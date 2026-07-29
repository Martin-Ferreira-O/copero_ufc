// Motor del juego. No contiene nombres propios: todo el contenido está en data.js.
import {
  clamp,
  TUNING,
  STATS,
  STYLES,
  GYMS,
  COUNTRIES,
  WEIGHT_CLASSES,
  LADDER,
  isUFC,
  REAL_OPPONENTS,
  randomOpponentName,
  EVENTS,
} from './data.js'

// RNG sembrado: misma semilla + mismas decisiones = misma carrera. Es lo que hace compartible el resultado.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)]
const tierIndex = (id) => LADDER.findIndex((t) => t.id === id)
export const tierOf = (state) => LADDER[tierIndex(state.tier)]
export const weightOf = (state) => WEIGHT_CLASSES.find((w) => w.id === state.weight)

export function newCareer({ name, nickname, country, gym, style, weight, stance, age }, seed) {
  const base = STYLES[style].stats
  const stats = {}
  for (const k of STATS) stats[k] = clamp(base[k] + (GYMS[gym].bonus[k] || 0) * 0.5, 1, 10)
  return {
    seed,
    rng: mulberry32(seed),
    name,
    nickname,
    country,
    gym,
    style,
    weight,
    stance,
    age,
    stats,
    hype: 0,
    money: 500,
    record: { w: 0, l: 0, d: 0 },
    methods: { ko: 0, sub: 0, dec: 0, koAgainst: 0 },
    titles: 0,
    streak: 0,
    lossStreak: 0,
    tier: 'amateur',
    peakTier: 0,
    tierFights: 0,
    tierWins: 0,
    fights: [],
    flags: {},
    seenEvents: [],
    log: [],
    phase: 'event',
    over: false,
    ending: null,
    retired: null,
  }
}

// ── eventos ───────────────────────────────────────────────────────────────────
export function pickEvent(s) {
  const pool = EVENTS.filter((e) => !s.seenEvents.includes(e.id) && e.when(s))
  if (!pool.length) return null
  const total = pool.reduce((n, e) => n + e.weight, 0)
  let roll = s.rng() * total
  for (const e of pool) {
    roll -= e.weight
    if (roll <= 0) return e
  }
  return pool[pool.length - 1]
}

export const eventText = (e, s) => (typeof e.text === 'function' ? e.text(s) : e.text)

export function applyOption(s, event, optionIndex) {
  const outcome = event.options[optionIndex].apply(s, s.rng)
  s.seenEvents.push(event.id)
  s.log.push({ kind: 'event', title: event.title, choice: event.options[optionIndex].label, outcome })
  s.phase = 'fight'
  if (s.retired) end(s, 'Retiro elegido', s.retired)
  return outcome
}

// ── rivales ───────────────────────────────────────────────────────────────────
export function buildOpponent(s) {
  const rng = s.rng
  const t = tierOf(s)
  let level = t.oppLevel
  if (s.flags.shortNotice) level += 1.1
  if (s.flags.easyOpp) level -= 1.2
  // El rival también es especialista: si fuera parejo en todo, cualquier jugador con un stat alto lo pasa por arriba.
  const shape = STYLES[pick(Object.keys(STYLES), rng)].stats
  const stats = {}
  for (const k of STATS) stats[k] = clamp(level + (shape[k] - 4.6) * 0.75 + (rng() * 1.6 - 0.8), 1, 10)
  const real = REAL_OPPONENTS[s.weight] || []
  const useReal = ['ranked', 'title', 'champ'].includes(s.tier) && real.length
  return {
    name: useReal ? pick(real, rng) : randomOpponentName(rng),
    style: pick(Object.keys(STYLES), rng),
    stats,
    real: !!useReal,
  }
}

// ── pelea ─────────────────────────────────────────────────────────────────────
const SUBS = ['mataleón', 'palanca de brazo', 'guillotina', 'triángulo', 'kimura', 'llave de talón']

const corner = (f, weightCut) => ({
  name: f.name,
  stats: { ...f.stats },
  hpMax: TUNING.hpBase + f.stats.chin * TUNING.hpPerChin,
  stamMax: (52 + f.stats.cardio * 4.8) * (weightCut || 1),
  hp: 0,
  stam: 0,
})

const timeStr = (rng) => {
  const t = Math.floor(rng() * 290) + 5
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

export function simulateFight(s, opponent) {
  const rng = s.rng
  const rounds = tierOf(s).rounds
  const ko = weightOf(s).koPower

  let cut = 1
  if (s.flags.badCut) cut *= 0.74
  if (s.flags.shortNotice) cut *= 0.86
  if (s.flags.badKnee) cut *= 0.92

  const a = corner({ name: s.name, stats: s.stats }, cut)
  const b = corner(opponent)
  a.hp = a.hpMax
  b.hp = b.hpMax
  a.stam = a.stamMax
  b.stam = b.stamMax

  const out = { rounds: [], result: null, method: null, endRound: null, time: null, opponent: opponent.name }
  let aPts = 0
  let bPts = 0
  let totalDmg = 0

  for (let r = 1; r <= rounds; r++) {
    const sf = (f) => 0.55 + 0.45 * clamp(f.stam / f.stamMax, 0, 1)
    const str = (f) => f.stats.striking * sf(f) * (1 + f.stats.iq * 0.03)
    const grap = (f) => f.stats.grappling * sf(f) * (1 + f.stats.iq * 0.02)

    const gap = grap(a) - grap(b)
    const ground = Math.abs(gap) >= 1.4 && rng() < 0.6
    let text
    let dmgA = 0
    let dmgB = 0
    let roundWinner

    if (ground) {
      const top = gap > 0 ? a : b
      const bottom = gap > 0 ? b : a
      const edge = Math.abs(gap)
      const dmg = TUNING.baseDmg * 0.85 * ko * (0.5 + rng() * 0.7) * clamp(edge / 3, 0.35, 1.3)
      if (top === a) dmgB = dmg
      else dmgA = dmg
      bottom.stam -= 5
      roundWinner = top === a ? 'a' : 'b'

      const subP = TUNING.subChance * edge * (1 - bottom.stats.grappling / 14)
      if (rng() < subP) {
        const sub = pick(SUBS, rng)
        finish(out, top === a ? 'win' : 'loss', `sumisión (${sub})`, r, timeStr(rng), top === a ? 'sub' : 'subAgainst')
        pushRound(out, r, a, b, `${top.name} lo llevó a la lona y lo terminó con ${sub}.`, aPts, bPts)
        break
      }
      text =
        top === a
          ? pick(
              [
                `Lo derribaste temprano y le pasaste la guardia. Codos desde arriba todo el round.`,
                `Doble pierna contra el alambrado y control absoluto: le sacaste la espalda dos veces.`,
                `Lo tuviste montado casi cuatro minutos. El rival solo se cubría.`,
              ],
              rng
            )
          : pick(
              [
                `Te llevó al piso en el primer minuto y no te dejó levantar.`,
                `Te comió con el wrestling: control, codos y cero espacio.`,
                `Te tuvo de espaldas contra la reja aguantando el peso todo el round.`,
              ],
              rng
            )
    } else {
      // reparto no lineal: una ventaja chica de striking tiene que doler de verdad,
      // si no todas las peleas se van a los puntos
      const aS = str(a) ** 2.5
      const bS = str(b) ** 2.5
      const share = aS / (aS + bS)
      dmgB = TUNING.baseDmg * 2 * share * ko * (0.62 + rng() * 0.76)
      dmgA = TUNING.baseDmg * 2 * (1 - share) * ko * (0.62 + rng() * 0.76)
      roundWinner = dmgB > dmgA ? 'a' : 'b'
      const dom = Math.abs(dmgB - dmgA) / Math.max(1, dmgB + dmgA)
      const mine = roundWinner === 'a'
      text =
        dom > 0.35
          ? mine
            ? pick(
                [`Lo lastimaste con un cross que le dobló las piernas y lo perseguiste hasta la campana.`, `Le rompiste la nariz con un codo en el clinch. Sangre por todos lados.`, `Low kicks todo el round: ya no apoya bien la pierna de adelante.`],
                rng
              )
            : pick(
                [`Te encontró con un overhand y viste luces. Aguantaste de milagro.`, `Te reventó el ojo izquierdo, casi no ves de ese lado.`, `Te castigó a las costillas: cada respiración duele.`],
                rng
              )
          : pick(
              [`Round parejo, mucho estudio y poco intercambio.`, `Los dos tirando al mismo tiempo, nadie da un paso atrás.`, `Round de esgrima: jab contra jab, se define por detalles.`],
              rng
            )
    }

    a.hp -= dmgA
    b.hp -= dmgB
    totalDmg += dmgA + dmgB
    const drain = (f) => TUNING.stamDrain + (10 - f.stats.cardio) * 1.3
    a.stam = Math.max(0, a.stam - drain(a))
    b.stam = Math.max(0, b.stam - drain(b))

    if (b.hp <= 0 || a.hp <= 0) {
      const iLost = a.hp <= 0 && (b.hp > 0 || a.hp <= b.hp)
      const method = ground ? 'TKO (golpes desde arriba)' : rng() < 0.45 ? 'KO' : 'TKO (golpes)'
      finish(out, iLost ? 'loss' : 'win', method, r, timeStr(rng), iLost ? 'koAgainst' : 'ko')
      pushRound(out, r, a, b, iLost ? `Se te apagó la luz. ${b.name} te encontró y no hubo vuelta.` : `${b.name} se derrumbó. No se levantó.`, aPts, bPts)
      break
    }

    const blowout = Math.abs(dmgB - dmgA) > TUNING.baseDmg * 1.15
    if (roundWinner === 'a') {
      aPts += 10
      bPts += blowout ? 8 : 9
    } else {
      bPts += 10
      aPts += blowout ? 8 : 9
    }

    pushRound(out, r, a, b, text, aPts, bPts)
  }

  if (!out.result) {
    // A los jueces. Cada uno con su propio ruido: de ahí salen las divididas y los robos.
    const margin = aPts - bPts
    let forMe = 0
    for (let j = 0; j < 3; j++) if (margin + (rng() * 4 - 2) > 0) forMe++
    if (forMe === 3) finish(out, 'win', 'decisión unánime', out.rounds.length, '5:00', 'dec')
    else if (forMe === 2) finish(out, 'win', 'decisión dividida', out.rounds.length, '5:00', 'dec')
    else if (forMe === 1) finish(out, 'loss', 'decisión dividida', out.rounds.length, '5:00', 'decAgainst')
    else finish(out, 'loss', 'decisión unánime', out.rounds.length, '5:00', 'decAgainst')
    out.war = totalDmg > TUNING.baseDmg * rounds * 1.5
  }
  out.scoreA = aPts
  out.scoreB = bPts
  return out
}

function pushRound(out, n, a, b, text, aPts, bPts) {
  out.rounds.push({
    n,
    text,
    aHp: clamp(a.hp / a.hpMax, 0, 1),
    bHp: clamp(b.hp / b.hpMax, 0, 1),
    aStam: clamp(a.stam / a.stamMax, 0, 1),
    bStam: clamp(b.stam / b.stamMax, 0, 1),
    aPts,
    bPts,
  })
}

function finish(out, result, method, round, time, methodKey) {
  out.result = result
  out.method = method
  out.endRound = round
  out.time = time
  out.methodKey = methodKey
}

// ── progresión ────────────────────────────────────────────────────────────────
export function applyFight(s, fight, opponent) {
  const t = tierOf(s)
  s.fights.push({ opponent: opponent.name, result: fight.result, method: fight.method, round: fight.endRound, tier: t.name, real: opponent.real })
  s.log.push({ kind: 'fight', fight, opponent: opponent.name, tier: t.name })

  if (fight.result === 'win') {
    s.record.w++
    s.streak++
    s.lossStreak = 0
    s.hype = clamp(s.hype + TUNING.hypeWin + (fight.method.includes('decisión') ? 0 : TUNING.hypeFinish) + (isUFC(s.tier) ? 4 : 0), 0, 100)
    s.money += t.pay
    s.tierWins++
  } else {
    s.record.l++
    s.streak = 0
    s.lossStreak++
    s.hype = clamp(s.hype + TUNING.hypeLoss, 0, 100)
    s.money += Math.round(t.pay * 0.45)
  }
  if (s.methods[fight.methodKey] !== undefined) s.methods[fight.methodKey]++

  s.tierFights++
  s.age += TUNING.yearsPerFight
  if (fight.war) s.flags.war = true

  // las banderas de "esta pelea" se consumen
  delete s.flags.badCut
  delete s.flags.shortNotice
  delete s.flags.easyOpp

  grow(s, fight)
  advance(s, fight)
  s.phase = 'event'
  s.peakTier = Math.max(s.peakTier, tierIndex(s.tier))
}

function grow(s, fight) {
  const gymTier = GYMS[s.gym].tier
  const young = s.age < 29 ? 1 : s.age < 33 ? 0.5 : 0.1
  const g = TUNING.growthPerFight * (0.6 + gymTier * 0.18) * young
  // rendimiento decreciente: llegar de 8 a 9 cuesta mucho más que de 4 a 5
  for (const k of ['striking', 'grappling', 'iq']) s.stats[k] = clamp(s.stats[k] + g * (0.6 + s.rng() * 0.8) * (1 - s.stats[k] / 11), 1, 10)
  if (s.age > 31) {
    s.stats.cardio = clamp(s.stats.cardio - 0.16, 1, 10)
    s.stats.chin = clamp(s.stats.chin - 0.12, 1, 10)
  }
  if (fight.methodKey === 'koAgainst') s.stats.chin = clamp(s.stats.chin - 0.38, 1, 10)
  if (s.flags.badKnee) s.stats.cardio = clamp(s.stats.cardio - 0.05, 1, 10)
}

function advance(s, fight) {
  const i = tierIndex(s.tier)
  const t = LADDER[i]
  const won = fight.result === 'win'

  if (s.tier === 'champ') {
    if (won) {
      s.titles++
      s.log.push({ kind: 'note', text: `Defensa de título número ${s.titles}. Sos el campeón.` })
    } else {
      s.tier = 'ranked'
      s.tierFights = 0
      s.tierWins = 0
      s.log.push({ kind: 'note', text: 'Perdiste el cinturón. Se termina un reinado y empieza la parte difícil.' })
    }
  } else if (s.tier === 'title') {
    if (won) {
      s.tier = 'champ'
      s.titles++
      s.tierFights = 0
      s.tierWins = 0
      s.log.push({ kind: 'note', text: '¡Campeón del mundo! Te ponen el cinturón en la cintura y no te entra en la cabeza.' })
    } else {
      s.tier = 'ranked'
      s.tierFights = 0
      s.tierWins = 0
      s.log.push({ kind: 'note', text: 'Perdiste la pelea de tu vida. Hay que volver a subir.' })
    }
  } else if (s.tierWins >= t.need && s.hype >= LADDER[i + 1].hype) {
    s.tier = LADDER[i + 1].id
    s.tierFights = 0
    s.tierWins = 0
    s.log.push({ kind: 'note', text: `Subís de escalón: ${LADDER[i + 1].name}.` })
  } else if (s.tierFights - s.tierWins >= 3) {
    // el escalón te reinicia: tres derrotas acá y la racha buena no cuenta más
    s.tierFights = 0
    s.tierWins = 0
    s.hype = clamp(s.hype - 6, 0, 100)
    s.log.push({ kind: 'note', text: 'Te estancaste en este nivel. Los que decidían miran para otro lado y hay que empezar de nuevo.' })
  }

  // corte, estancamiento y retiro
  if (isUFC(s.tier) && s.lossStreak >= 3) {
    if (s.age > 33 || s.record.l > s.record.w) return end(s, 'Cortado', 'Tres derrotas seguidas y la carta de despido. A esa edad no vuelve a llamar nadie.')
    s.tier = 'regional'
    s.tierFights = 0
    s.tierWins = 0
    s.hype = clamp(s.hype - 18, 0, 100)
    s.log.push({ kind: 'note', text: 'Te cortaron de UFC. Vuelta al circuito regional a reconstruirlo todo.' })
  }
  if (!isUFC(s.tier) && s.lossStreak >= 4) return end(s, 'Nunca la pegó', 'Cuatro derrotas al hilo en el regional. En algún momento hay que aceptar que el teléfono no va a sonar.')
  if (s.stats.chin <= 1.35 && s.methods.koAgainst >= 4) return end(s, 'Retiro forzado', 'Tres nocauts en poco tiempo. La comisión médica no te renueva la licencia y, si sos honesto, es un alivio.')
  if (s.age >= TUNING.retireAge) return end(s, 'Retiro por edad', 'Se acabó el tiempo. Colgás los guantes con el cuerpo hecho un mapa y ninguna deuda con nadie.')
  if (s.fights.length >= 60) return end(s, 'Retiro por edad', 'Sesenta peleas profesionales. Ya está.')
}

function end(s, ending, text) {
  s.over = true
  s.ending = ending
  s.log.push({ kind: 'note', text })
  s.endingText = text
}

export function nextStep(s) {
  if (s.over) return { kind: 'end' }
  if (s.phase === 'event') {
    const e = pickEvent(s)
    if (e) return { kind: 'event', event: e }
    s.phase = 'fight'
  }
  return { kind: 'fight', opponent: buildOpponent(s) }
}

// ── final ─────────────────────────────────────────────────────────────────────
export function grade(s) {
  if (s.titles >= 3) return { title: 'Leyenda', desc: 'Vas a estar en el Salón de la Fama y en la remera de un pibe que todavía no nació.' }
  if (s.titles >= 1) return { title: 'Campeón de UFC', desc: 'Llegaste a lo más alto del deporte. Poca gente en la historia puede decir lo mismo.' }
  if (s.peakTier >= tierIndex('title')) return { title: 'Retador al título', desc: 'Peleaste por el cinturón. Te quedaste a un round de la gloria.' }
  if (s.peakTier >= tierIndex('ranked')) return { title: 'Top 15 mundial', desc: 'Estuviste rankeado entre los quince mejores del planeta en tu categoría.' }
  if (s.ending === 'Cortado') return { title: 'Cortado de UFC', desc: 'Llegaste a la jaula grande y no te alcanzó el tiempo adentro.' }
  if (s.ending === 'Retiro forzado') return { title: 'Retiro forzado', desc: 'El cuerpo dijo basta antes que la cabeza.' }
  if (s.peakTier >= tierIndex('prelim')) return { title: 'Peleador de UFC', desc: 'Entraste a la jaula que se ve en todo el mundo. Eso ya es más de lo que logra el 99%.' }
  if (s.peakTier >= tierIndex('regional')) return { title: 'Gatekeeper regional', desc: 'Fuiste el examen que tenían que aprobar los prospectos. Alguien tiene que serlo.' }
  return { title: 'Nunca la pegó', desc: 'Quedó la anécdota, el gimnasio y las fotos con la nariz rota.' }
}

export function summaryText(s) {
  const g = grade(s)
  const w = weightOf(s)
  const finishes = s.methods.ko + s.methods.sub
  const best = s.fights.filter((f) => f.result === 'win' && f.real).slice(-3).map((f) => f.opponent)
  return [
    `🥊 ${s.name}${s.nickname ? ` "${s.nickname}"` : ''} — ${COUNTRIES[s.country].name}`,
    `${w.name} · ${STYLES[s.style].name} · ${s.gym}`,
    `Récord: ${s.record.w}-${s.record.l}-${s.record.d} (${finishes} finalizaciones)`,
    s.titles ? `🏆 Campeón de UFC · ${s.titles} ${s.titles === 1 ? 'título/defensa' : 'títulos y defensas'}` : null,
    best.length ? `Le ganó a: ${best.join(', ')}` : null,
    `Final: ${g.title} — ${g.desc}`,
    `Semilla: ${s.seed}`,
    `Jugá el tuyo 👊`,
  ]
    .filter(Boolean)
    .join('\n')
}
