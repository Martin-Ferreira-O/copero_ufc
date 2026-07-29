// El único check del motor: 2000 carreras autojugadas tienen que terminar bien.
// node --test src/sim.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { newCareer, nextStep, applyOption, simulateFight, applyFight, grade, summaryText, mulberry32, tierOf } from './sim.js'
import { STYLES, GYMS, COUNTRIES, WEIGHT_CLASSES, STATS } from './data.js'

const METHODS = /^(KO|TKO \(golpes\)|TKO \(golpes desde arriba\)|sumisión \(.+\)|decisión (unánime|dividida))$/

function autoplay(seed) {
  const rng = mulberry32(seed * 7919 + 13)
  const p = (arr) => arr[Math.floor(rng() * arr.length)]
  const country = p(Object.keys(COUNTRIES))
  const s = newCareer(
    {
      name: 'Test Fighter',
      nickname: 'El Test',
      country,
      gym: p(Object.keys(GYMS).filter((g) => GYMS[g].country === country)),
      style: p(Object.keys(STYLES)),
      weight: p(WEIGHT_CLASSES).id,
      stance: 'orthodox',
      age: 18 + Math.floor(rng() * 8),
    },
    seed
  )

  for (let guard = 0; guard < 500; guard++) {
    const step = nextStep(s)
    if (step.kind === 'end') return s
    if (step.kind === 'event') {
      applyOption(s, step.event, Math.floor(rng() * step.event.options.length))
    } else {
      const fight = simulateFight(s, step.opponent)
      assert.match(fight.method, METHODS, `método raro: ${fight.method}`)
      assert.ok(fight.endRound >= 1 && fight.endRound <= tierOf(s).rounds, `round inválido: ${fight.endRound}`)
      assert.ok(fight.rounds.length >= 1)
      for (const r of fight.rounds) {
        for (const k of ['aHp', 'bHp', 'aStam', 'bStam']) assert.ok(r[k] >= 0 && r[k] <= 1, `${k} fuera de rango: ${r[k]}`)
      }
      applyFight(s, fight, step.opponent)
    }
  }
  throw new Error(`la carrera con semilla ${seed} nunca terminó`)
}

const RUNS = 2000
const careers = Array.from({ length: RUNS }, (_, i) => autoplay(i + 1))

test('toda carrera termina, con récord consistente y stats en rango', () => {
  for (const s of careers) {
    assert.ok(s.over, 'la carrera no terminó')
    assert.equal(s.record.w + s.record.l + s.record.d, s.fights.length, 'el récord no cierra con el historial')
    assert.ok(s.fights.length <= 60, `demasiadas peleas: ${s.fights.length}`)
    assert.ok(s.age <= 45, `edad absurda: ${s.age}`)
    for (const k of STATS) assert.ok(s.stats[k] >= 1 && s.stats[k] <= 10, `${k} fuera de rango: ${s.stats[k]}`)
    assert.ok(s.hype >= 0 && s.hype <= 100)
    assert.ok(s.money >= 0)
    assert.ok(summaryText(s).length > 40)
  }
})

test('la misma semilla y las mismas decisiones dan la misma carrera', () => {
  const a = autoplay(42)
  const b = autoplay(42)
  assert.deepEqual(a.record, b.record)
  assert.deepEqual(
    a.fights.map((f) => `${f.opponent}|${f.result}|${f.method}`),
    b.fights.map((f) => `${f.opponent}|${f.result}|${f.method}`)
  )
})

// Chequeo de balance, no de correctitud: si un final se come todo, hay que girar TUNING.
test('los finales están repartidos', () => {
  const tally = {}
  for (const s of careers) {
    const g = grade(s).title
    tally[g] = (tally[g] || 0) + 1
  }
  console.log(tally)
  const kinds = Object.keys(tally)
  assert.ok(kinds.length >= 4, `muy poca variedad de finales: ${kinds.join(', ')}`)
  for (const [k, n] of Object.entries(tally)) assert.ok(n / RUNS <= 0.6, `el final "${k}" se come el ${Math.round((n / RUNS) * 100)}% de las partidas`)
  assert.ok((tally['Campeón de UFC'] || 0) + (tally['Leyenda'] || 0) >= 1, 'nadie llega nunca a campeón')
  assert.ok((tally['Nunca la pegó'] || 0) >= 1, 'nadie fracasa nunca')
})
