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
} from './sim.js'
import { STYLES, GYMS, COUNTRIES, WEIGHT_CLASSES, STATS, DIFFICULTIES, PLAN_IDS, EVENTS } from './data.js'

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
