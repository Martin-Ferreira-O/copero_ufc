// Los checks del motor: 2000 carreras autojugadas por dificultad tienen que terminar bien,
// más una regresión del bug que originó todo esto.
// node --test src/sim.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  newCareer,
  nextStep,
  applyOption,
  simulateFight,
  applyFight,
  buildOpponent,
  stakes,
  effStats,
  grade,
  summaryText,
  mulberry32,
  suggestPlan,
  tierOf,
  buy,
  takeOffer,
} from './sim.js'
import { STYLES, GYMS, COUNTRIES, WEIGHT_CLASSES, STATS, DIFFICULTIES, PLAN_IDS, EVENTS, SHOP_GROUPS, TROPHIES, catalog } from './data.js'

const METHODS = /^(KO|TKO \(golpes\)|TKO \(golpes desde arriba\)|sumisión \(.+\)|decisión (unánime|dividida)|empate \(mayoría\))$/

const fighter = (rng, diff) => {
  const p = (arr) => arr[Math.floor(rng() * arr.length)]
  const country = p(Object.keys(COUNTRIES))
  return {
    name: 'Test Fighter',
    nickname: 'El Test',
    country,
    gym: p(Object.keys(GYMS).filter((g) => GYMS[g].country === country)),
    style: p(Object.keys(STYLES)),
    weight: p(WEIGHT_CLASSES).id,
    stance: rng() < 0.2 ? 'southpaw' : 'orthodox',
    age: 18 + Math.floor(rng() * 8),
    diff,
  }
}

function autoplay(seed, diff, choose) {
  const rng = mulberry32(seed * 7919 + 13)
  const p = (arr) => arr[Math.floor(rng() * arr.length)]
  const s = newCareer(fighter(rng, diff), seed)
  const plan = choose || (() => p(PLAN_IDS))

  for (let guard = 0; guard < 900; guard++) {
    const step = nextStep(s)
    if (step.kind === 'end') return s
    if (step.kind === 'event') {
      // sólo las opciones que se pueden pagar, igual que la UI
      const usable = step.event.options.map((o, i) => i).filter((i) => !step.event.options[i].can || step.event.options[i].can(s))
      assert.ok(usable.length, `${step.event.id}: ninguna opción elegible`)
      applyOption(s, step.event, p(usable))
    } else if (step.kind === 'offers') {
      assert.ok(step.offers.length >= 2, 'un callout con una sola opción no es una decisión')
      for (const o of step.offers) {
        assert.ok(o.id && o.label && o.fx && o.taken, `oferta sin label/fx/taken: ${o.id}`)
        assert.equal(typeof o.apply, 'function', `oferta sin apply: ${o.id}`)
      }
      // El jugador competente acepta la pelea que le ofrecen; el caos pide cualquier cosa.
      // Si el bot "competente" pidiera rivales al azar, la tabla de finales mediría su
      // imprudencia y no el balance del juego.
      takeOffer(s, step.offers, choose ? 0 : Math.floor(rng() * step.offers.length))
    } else {
      for (const st of stakes(s)) assert.ok(st.text && ['good', 'bad', 'info'].includes(st.tone), 'stakes mal formado')
      const fight = simulateFight(s, step.opponent, plan)
      assert.match(fight.method, METHODS, `método raro: ${fight.method}`)
      assert.ok(fight.endRound >= 1 && fight.endRound <= tierOf(s).rounds, `round inválido: ${fight.endRound}`)
      assert.ok(fight.rounds.length >= 1)
      for (const r of fight.rounds) {
        for (const k of ['aHp', 'bHp', 'aStam', 'bStam']) assert.ok(r[k] >= 0 && r[k] <= 1, `${k} fuera de rango: ${r[k]}`)
        assert.ok(PLAN_IDS.includes(r.plan), `plan inválido en el round: ${r.plan}`)
      }
      applyFight(s, fight, step.opponent)
    }
  }
  throw new Error(`la carrera con semilla ${seed} nunca terminó`)
}

const RUNS = 2000
// El balance se mide con un jugador competente: el que sigue lo que le dice la esquina.
const byDiff = Object.fromEntries(Object.keys(DIFFICULTIES).map((d) => [d, Array.from({ length: RUNS }, (_, i) => autoplay(i + 1, d, suggestPlan))]))
// Y aparte, planes al azar, para que ninguna secuencia rara de esquina rompa el motor.
const chaos = Object.keys(DIFFICULTIES).flatMap((d) => Array.from({ length: 400 }, (_, i) => autoplay(i + 1, d)))
const careers = [...Object.values(byDiff).flat(), ...chaos]

test('toda carrera termina, con récord consistente y estado en rango', () => {
  for (const s of careers) {
    assert.ok(s.over, 'la carrera no terminó')
    assert.equal(s.record.w + s.record.l + s.record.d, s.fights.length, 'el récord no cierra con el historial')
    assert.ok(s.fights.length <= 60, `demasiadas peleas: ${s.fights.length}`)
    assert.ok(s.age <= 45, `edad absurda: ${s.age}`)
    for (const k of STATS) {
      assert.ok(s.stats[k] >= 1 && s.stats[k] <= 10, `${k} fuera de rango: ${s.stats[k]}`)
      assert.ok(effStats(s)[k] >= 1 && effStats(s)[k] <= 10, `${k} lesionado fuera de rango`)
    }
    assert.ok(s.hype >= 0 && s.hype <= 100)
    assert.ok(s.money >= 0)
    assert.ok(s.earned >= 0)
    assert.ok(s.rank === null || (s.rank >= 1 && s.rank <= 15), `ranking inválido: ${s.rank}`)
    for (const inj of s.injuries) assert.ok(inj.fights > 0, 'quedó una lesión ya expirada')
    assert.ok(summaryText(s).length > 40)
  }
})

test('la misma semilla, las mismas decisiones y los mismos planes dan la misma carrera', () => {
  const a = autoplay(42, 'duro', suggestPlan)
  const b = autoplay(42, 'duro', suggestPlan)
  assert.deepEqual(a.record, b.record)
  assert.deepEqual(
    a.fights.map((f) => `${f.opponent}|${f.result}|${f.method}`),
    b.fights.map((f) => `${f.opponent}|${f.result}|${f.method}`)
  )
})

// El bug reportado: ganás una pelea y el juego te dice que te estancaste y te borra el escalón.
test('ganar nunca reinicia el escalón', () => {
  const s = newCareer(fighter(mulberry32(7), 'duro'), 7)
  s.tier = 'regional'
  s.tierFights = 5
  s.tierWins = 2 // 2 victorias y 3 derrotas: al límite del reinicio
  s.hype = 40
  const opponent = buildOpponent(s)
  const notes = applyFight(
    s,
    { result: 'win', method: 'KO', endRound: 1, time: '1:11', methodKey: 'ko', rounds: [{}], a: { hurt: false, downs: 0 }, oppRank: null },
    opponent
  )
  assert.equal(s.tierWins, 3, 'ganar borró las victorias del escalón')
  assert.ok(!notes.some((n) => /estancaste/.test(n)), 'te avisó de un estancamiento después de ganar')
})

test('todo evento declara slot y toda opción declara su efecto', () => {
  const ids = EVENTS.map((e) => e.id)
  assert.equal(new Set(ids).size, ids.length, 'hay ids de evento duplicados')
  for (const e of EVENTS) {
    assert.ok(['camp', 'week'].includes(e.slot || 'camp'), `${e.id}: slot inválido`)
    assert.ok(e.options.length >= 2, `${e.id}: necesita al menos dos opciones`)
    for (const o of e.options) {
      assert.ok(typeof o.fx === 'string' && o.fx.length, `${e.id} / "${o.label}": falta el fx que se muestra en el botón`)
      assert.equal(typeof o.apply, 'function', `${e.id} / "${o.label}": falta apply`)
    }
  }
})

test('los logros se desbloquean una sola vez y ninguno es imposible', () => {
  const ids = new Set()
  for (const t of TROPHIES) {
    assert.ok(t.id && t.label && t.desc, `logro incompleto: ${t.id}`)
    assert.equal(typeof t.when, 'function', `${t.id}: falta when`)
    assert.ok(!ids.has(t.id), `logro duplicado: ${t.id}`)
    ids.add(t.id)
  }
  let total = 0
  for (const s of careers) {
    assert.equal(new Set(s.trophies).size, s.trophies.length, 'un logro se desbloqueó dos veces')
    for (const id of s.trophies) assert.ok(ids.has(id), `logro fantasma: ${id}`)
    total += s.trophies.length
  }
  // Un logro que no sale nunca en 7200 carreras es contenido muerto: o está roto o es inalcanzable.
  const seen = new Set(careers.flatMap((s) => s.trophies))
  const nunca = TROPHIES.filter((t) => !seen.has(t.id)).map((t) => t.id)
  assert.deepEqual(nunca, [], `logros que no salen nunca: ${nunca.join(', ')}`)
  console.log(`logros: ${(total / careers.length).toFixed(1)} por carrera de ${TROPHIES.length}`)
})

// El guardado vive en App.jsx, pero lo que puede romperse en silencio es esto: que el estado
// del RNG no sobreviva al JSON. Si se rompe, recargar te cambia la carrera y nadie se entera.
test('la carrera sobrevive a JSON: recargar no cambia nada', () => {
  const trip = (s) => {
    const back = JSON.parse(JSON.stringify({ ...s, rng: s.rng.state(), pending: null }))
    back.rng = mulberry32(back.rng)
    return back
  }
  const step = (s) => {
    const st = nextStep(s)
    if (st.kind === 'end') return false
    if (st.kind === 'event') applyOption(s, st.event, 0)
    else if (st.kind === 'offers') takeOffer(s, st.offers, 0)
    else applyFight(s, simulateFight(s, st.opponent, suggestPlan), st.opponent)
    return true
  }
  const print = (s) => JSON.stringify([s.record, s.tier, s.rank, s.trophies, s.fights.map((f) => `${f.opponent}|${f.result}|${f.method}`)])

  for (const seed of [4, 11, 23]) {
    const a = newCareer(fighter(mulberry32(seed), 'duro'), seed)
    let b = newCareer(fighter(mulberry32(seed), 'duro'), seed)
    for (let i = 0; i < 400 && step(a); i++);
    for (let i = 0; i < 400; i++) {
      b = trip(b) // se guarda y se restaura en CADA paso, el peor caso
      if (!step(b)) break
    }
    assert.ok(a.over, `semilla ${seed}: la carrera de control no terminó`)
    assert.equal(print(b), print(a), `semilla ${seed}: recargar cambió la carrera`)
  }
})

test('el bono de la noche sólo cae en UFC y suma a lo ganado', () => {
  // regional: pelear una guerra no puede pagar bono
  const s = Object.assign(newCareer(fighter(mulberry32(9), 'duro'), 9), { tier: 'regional' })
  const before = s.earned
  const opp = buildOpponent(s)
  const notes = applyFight(s, { result: 'win', method: 'KO', methodKey: 'ko', endRound: 1, war: true, a: { hurt: false, downs: 0 } }, opp)
  assert.ok(!notes.some((n) => /bono/.test(n)), 'pagó bono de la noche fuera de UFC')

  const u = Object.assign(newCareer(fighter(mulberry32(9), 'duro'), 9), { tier: 'maincard' })
  const uBefore = u.earned
  const uNotes = applyFight(u, { result: 'win', method: 'KO', methodKey: 'ko', endRound: 1, war: false, a: { hurt: false, downs: 0 } }, buildOpponent(u))
  assert.ok(uNotes.some((n) => /Actuación de la Noche/.test(n)), 'finalizar en UFC no pagó bono')
  assert.ok(u.earned - uBefore > s.earned - before, 'el bono no entró en lo ganado')
})

// ── la tienda ─────────────────────────────────────────────────────────────────
const shopper = (over = {}) => Object.assign(newCareer(fighter(mulberry32(3), 'duro'), 3), over)
const groups = new Set(SHOP_GROUPS.map(([g]) => g))

test('el catálogo declara precio y efecto en todo estado', () => {
  const states = [
    shopper(),
    shopper({ money: 0 }),
    shopper({ money: 9e6, hype: 100, injuries: [{ label: 'Rodilla', stat: 'cardio', amount: 1, fights: 2 }] }),
    shopper({ gym: 'AKA' }), // tier 5: no queda ningún gimnasio para comprar
  ]
  for (const s of states) {
    const items = catalog(s)
    assert.ok(items.length, 'catálogo vacío')
    const ids = items.map((i) => i.id)
    assert.equal(new Set(ids).size, ids.length, 'hay ids duplicados en la tienda')
    for (const it of items) {
      assert.ok(groups.has(it.group), `${it.id}: grupo desconocido "${it.group}"`)
      assert.ok(typeof it.fx === 'string' && it.fx.length, `${it.id}: falta el fx que se muestra en el botón`)
      assert.ok(Number.isInteger(it.cost) && it.cost >= 0, `${it.id}: precio inválido ${it.cost}`)
      assert.equal(typeof it.apply, 'function', `${it.id}: falta apply`)
    }
  }
  assert.ok(!catalog(shopper({ gym: 'AKA' })).some((i) => i.group === 'gym'), 'ofrece gimnasios peores que el tuyo')
  assert.ok(catalog(shopper({ money: 0 })).every((i) => i.off), 'sin plata igual te deja comprar')
})

test('comprar cobra exacto y nunca te deja en rojo', () => {
  const broke = shopper({ money: 0 })
  for (const it of catalog(broke)) assert.equal(buy(broke, it), null, `${it.id}: te dejó comprar sin plata`)
  assert.equal(broke.money, 0)
  assert.equal(broke.log.length, 0, 'una compra fallida dejó rastro')

  const s = shopper({ money: 50000 })
  const it = catalog(s).find((i) => i.id === 'bucal')
  const chin = s.stats.chin
  assert.ok(buy(s, it), 'no se pudo comprar algo que se podía pagar')
  assert.equal(s.money, 50000 - it.cost)
  assert.ok(s.stats.chin > chin, 'el mentón no subió')
  assert.equal(s.log.at(-1).kind, 'note', 'la compra no quedó en el historial')
})

test('el precio sube con el atributo y frena la compra de un 10', () => {
  const s = shopper({ money: 9e9 })
  const first = catalog(s).find((i) => i.id === 'bucal').cost
  for (let i = 0; i < 50; i++) buy(s, catalog(s).find((x) => x.id === 'bucal'))
  const last = catalog(s).find((i) => i.id === 'bucal').cost
  assert.ok(s.stats.chin <= 10, `mentón fuera de rango: ${s.stats.chin}`)
  assert.ok(last > first * 3, `el precio no escaló: ${first} → ${last}`)

  const maxed = catalog(s).find((i) => i.id === 'bucal')
  assert.equal(s.stats.chin, 10, 'el mentón no llegó al tope')
  assert.ok(maxed.off, 'te deja comprar un atributo que ya está en 10')
  assert.equal(buy(s, maxed), null, 'la compra al tope igual pasó')
  assert.match(maxed.fx, /Mentón 10\.0 → 10\.0/, 'el botón no muestra el atributo que comprás')
})

test('comprar no consume RNG: la semilla sigue valiendo', () => {
  const rivals = (compra) => {
    const s = newCareer(fighter(mulberry32(11), 'duro'), 11)
    s.money = 9e6
    const out = []
    for (let i = 0; i < 6; i++) {
      if (compra) buy(s, catalog(s).find((x) => x.id === 'video'))
      out.push(buildOpponent(s).name)
    }
    return out
  }
  assert.deepEqual(rivals(true), rivals(false), 'comprar movió el stream del RNG')
})

// Chequeo de balance, no de correctitud: si un final o un método se come todo, hay que girar TUNING.
test('los finales y los métodos están repartidos', () => {
  const methods = {}
  let draws = 0
  for (const s of careers) {
    for (const f of s.fights) methods[f.method.replace(/ \(.+\)/, '')] = (methods[f.method.replace(/ \(.+\)/, '')] || 0) + 1
    draws += s.record.d
  }
  const total = Object.values(methods).reduce((a, b) => a + b, 0)
  console.log(
    '\nmétodos:',
    Object.entries(methods)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${Math.round((n / total) * 100)}%`)
      .join(' · ')
  )

  for (const [d, list] of Object.entries(byDiff)) {
    const tally = {}
    for (const s of list) tally[grade(s).title] = (tally[grade(s).title] || 0) + 1
    const pct = (k) => Math.round(((tally[k] || 0) / RUNS) * 100)
    const top = pct('Top 15 mundial') + pct('Top 10 mundial') + pct('Top 3 del mundo')
    console.log(
      `${DIFFICULTIES[d].name.padEnd(9)} campeón ${pct('Campeón de UFC') + pct('Leyenda')}% · retador ${pct('Retador al título')}% · rankeado ${top}%` +
        ` · UFC ${pct('Peleador de UFC')}% · cortado ${pct('Cortado de UFC')}% · retiro forzado ${pct('Retiro forzado')}% · regional ${pct(
          'Gatekeeper regional'
        )}% · nunca ${pct('Nunca la pegó')}%`
    )
    assert.ok(Object.keys(tally).length >= 4, `${d}: muy poca variedad de finales`)
    for (const [k, n] of Object.entries(tally)) assert.ok(n / RUNS <= 0.6, `${d}: el final "${k}" se come el ${Math.round((n / RUNS) * 100)}%`)
    assert.ok((tally['Campeón de UFC'] || 0) + (tally['Leyenda'] || 0) >= 1, `${d}: nadie llega nunca a campeón`)
    assert.ok((tally['Nunca la pegó'] || 0) >= 1, `${d}: nadie fracasa nunca`)
  }

  assert.ok(draws > 0, 'los empates nunca ocurren')
  const share = (re) =>
    Object.entries(methods)
      .filter(([k]) => re.test(k))
      .reduce((a, [, n]) => a + n, 0) / total
  assert.ok(share(/decisión/) < 0.62, `las decisiones son el ${Math.round(share(/decisión/) * 100)}% de las peleas`)
  assert.ok(share(/KO/) > 0.2, `los nocauts son sólo el ${Math.round(share(/KO/) * 100)}% de las peleas`)
  assert.ok(share(/empate/) < 0.02, `los empates son el ${Math.round(share(/empate/) * 100)}% de las peleas`)
})
