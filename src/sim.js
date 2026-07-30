// Motor del juego. No contiene nombres propios: todo el contenido está en data.js.
import {
  clamp,
  TUNING,
  DIFFICULTIES,
  PLANS,
  ROUND_TEXT,
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
export const diffOf = (state) => DIFFICULTIES[state.diff] || DIFFICULTIES.duro

// Los stats que entran a la jaula: los de la planilla menos lo que arrastrás lesionado.
// La UI muestra el número base y el descuento, así una lesión se ve antes de pelear.
export function effStats(s) {
  const out = { ...s.stats }
  for (const inj of s.injuries) out[inj.stat] = clamp(out[inj.stat] - inj.amount, 1, 10)
  return out
}

export function newCareer({ name, nickname, country, gym, style, weight, stance, age, diff }, seed) {
  const base = STYLES[style].stats
  const stats = {}
  for (const k of STATS) stats[k] = clamp(base[k] + (GYMS[gym].bonus[k] || 0) * 0.5, 1, 10)
  return {
    seed,
    rng: mulberry32(seed),
    diff: DIFFICULTIES[diff] ? diff : 'duro',
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
    earned: 0,
    record: { w: 0, l: 0, d: 0 },
    methods: { ko: 0, sub: 0, dec: 0, koAgainst: 0 },
    titles: 0,
    streak: 0,
    lossStreak: 0,
    tier: 'amateur',
    peakTier: 0,
    tierFights: 0,
    tierWins: 0,
    rank: null, // #15 → #1 dentro del top 15; null fuera del ranking
    peakRank: null, // el mejor puesto al que llegaste: define el final si no fuiste campeón
    injuries: [], // [{ label, stat, amount, fights }] — se descuentan de los stats y expiran
    rivals: [], // a quién le perdiste o con quién te agarraste a trompadas
    nextOpponent: null, // revancha firmada
    last: null, // qué pasó en la última pelea: los eventos leen de acá
    fights: [],
    flags: {},
    seen: {}, // { idDeEvento: nº de pelea } para los cooldowns
    log: [],
    phase: 'camp',
    pending: null, // el paso actual, cacheado: nextStep no puede consumir RNG dos veces
    over: false,
    ending: null,
    retired: null,
  }
}

// ── eventos ───────────────────────────────────────────────────────────────────
// Un evento repetible (`every: N`) vuelve al bolillero N peleas después.
// Sin `every`, es de una sola vez en la carrera.
const ready = (s, e) => s.seen[e.id] === undefined || (e.every && s.fights.length - s.seen[e.id] >= e.every)

export function pickEvent(s, slot) {
  const pool = EVENTS.filter((e) => (e.slot || 'camp') === slot && ready(s, e) && e.when(s))
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
  s.seen[event.id] = s.fights.length
  s.log.push({ kind: 'event', title: event.title, choice: event.options[optionIndex].label, outcome })
  s.pending = null
  s.phase = (event.slot || 'camp') === 'camp' ? 'week' : 'fight'
  if (s.retired) end(s, 'Retiro elegido', s.retired)
  return outcome
}

// ── rivales ───────────────────────────────────────────────────────────────────
// El top 15 tiene nombres estables dentro de una carrera: el #7 es siempre el mismo #7.
// Los seis primeros son los rankeados de verdad, así la pelea de título es contra el campeón.
const rankedName = (s, rank) => {
  const real = REAL_OPPONENTS[s.weight] || []
  return rank <= real.length ? real[rank - 1] : randomOpponentName(mulberry32(s.seed + rank * 7919))
}

export function buildOpponent(s) {
  const rng = s.rng
  const t = tierOf(s)
  let level = t.oppLevel + diffOf(s).oppLevel
  if (s.flags.shortNotice) level += 1.1
  if (s.flags.easyOpp) level -= 1.2

  // Un solo pick de estilo: la forma de los stats y el estilo que ves antes de pelear
  // tienen que ser la misma cosa, si no el scouting es mentira.
  let styleId = pick(Object.keys(STYLES), rng)
  let name = null
  let oppRank = null
  let real = false

  const re = s.nextOpponent
  if (re) {
    name = re.name
    styleId = re.style
    level = re.level + 0.35
    oppRank = re.rank ?? null
    real = re.real
  } else if (s.tier === 'title') {
    oppRank = 1
    name = rankedName(s, 1)
    real = true
    level += 0.3
  } else if (s.tier === 'champ') {
    oppRank = 2 + Math.floor(rng() * 4)
    name = rankedName(s, oppRank)
    real = oppRank <= (REAL_OPPONENTS[s.weight] || []).length
  } else if (s.rank) {
    oppRank = clamp(s.rank + Math.floor(rng() * 7) - 3, 1, 15)
    name = rankedName(s, oppRank)
    real = oppRank <= (REAL_OPPONENTS[s.weight] || []).length
    level = 7.9 + (16 - oppRank) * 0.055 + diffOf(s).oppLevel
  } else {
    name = randomOpponentName(rng)
  }

  // El rival también es especialista: si fuera parejo en todo, cualquier jugador con un stat alto lo pasa por arriba.
  const shape = STYLES[styleId].stats
  const stats = {}
  for (const k of STATS) stats[k] = clamp(level + (shape[k] - 4.6) * 0.75 + (rng() * 1.6 - 0.8), 1, 10)

  return { name, style: styleId, stance: rng() < 0.22 ? 'southpaw' : 'orthodox', stats, rank: oppRank, level, real }
}

// Lo que sabés del rival antes de entrar. Con Fight IQ alto te leés su plan; con IQ bajo peleás a ciegas.
export function scout(s, opponent) {
  const iq = effStats(s).iq
  const out = [opponent.rank ? `#${opponent.rank} del ranking` : opponent.real ? 'rival rankeado' : 'sin ranking']
  if (iq >= 4) out.push(STYLES[opponent.style].name)
  if (iq >= 6) {
    const best = STATS.filter((k) => k !== 'chin').sort((a, b) => opponent.stats[b] - opponent.stats[a])[0]
    out.push(`fuerte en ${best === 'iq' ? 'lectura' : best}`)
    out.push(opponent.stance === 'southpaw' ? 'zurdo' : 'ortodoxo')
  }
  if (iq < 4) out.push('no lo tenés estudiado')
  return out
}

// ── pelea ─────────────────────────────────────────────────────────────────────
const SUBS = ['mataleón', 'palanca de brazo', 'guillotina', 'triángulo', 'kimura', 'llave de talón']

const corner = (name, stats, stance, stamMult) => ({
  name,
  stats: { ...stats },
  stance,
  hpMax: TUNING.hpBase + stats.chin * TUNING.hpPerChin,
  stamMax: (52 + stats.cardio * 4.8) * stamMult,
  hp: 0,
  stam: 0,
  hurt: false,
  downs: 0,
})

const timeStr = (rng) => {
  const t = Math.floor(rng() * 290) + 5
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

export function openFight(s, opponent) {
  let cut = 1
  if (s.flags.badCut && !s.flags.nutri) cut *= 0.74
  if (s.flags.shortNotice) cut *= 0.86

  // lo que afilaste en la semana de pelea, sólo para esta pelea
  const st = effStats(s)
  if (s.flags.prep) st[s.flags.prep] = clamp(st[s.flags.prep] + 0.6, 1, 10)

  const a = corner(s.name, st, s.stance, cut)
  const b = corner(opponent.name, opponent.stats, opponent.stance, 1)
  a.hp = a.hpMax
  b.hp = b.hpMax
  a.stam = a.stamMax
  b.stam = b.stamMax

  return {
    a,
    b,
    max: tierOf(s).rounds,
    ko: weightOf(s).koPower,
    rounds: [],
    aPts: 0,
    bPts: 0,
    totalDmg: 0,
    result: null,
    method: null,
    endRound: null,
    time: null,
    methodKey: null,
    opponent: opponent.name,
    oppRank: opponent.rank,
    oppStyle: opponent.style,
  }
}

// El rival lee la pelea igual que vos: si es grappler busca el piso, si está lastimado aguanta.
function oppPlan(f, rng) {
  const b = f.b
  if (b.hurt && rng() < 0.6) return 'aguantar'
  if (b.stam / b.stamMax < 0.3 && rng() < 0.55) return 'boxear'
  const g = b.stats.grappling - b.stats.striking
  if (g > 1.2) return rng() < 0.72 ? 'derribar' : 'boxear'
  if (g < -1.2) return rng() < 0.62 ? 'presionar' : 'boxear'
  return rng() < 0.5 ? 'boxear' : 'presionar'
}

// El plan que te sugiere la esquina (la ★ y el botón "auto").
// Los umbrales salen de medir victorias por plan contra cada arquetipo, no de la intuición.
export function suggestPlan(s, f) {
  const a = f.a
  const b = f.b
  // aguantar regala el round: sólo vale la pena si de verdad te están por parar la pelea
  if (a.hurt && a.hp / a.hpMax < 0.35) return 'aguantar'
  if (a.stam / a.stamMax < 0.25) return 'boxear'
  const gEdge = a.stats.grappling - b.stats.grappling
  const sEdge = a.stats.striking - b.stats.striking
  // buscá el piso si luchás mejor, o si de pie te van a ganar
  if (gEdge > 0.8 || sEdge < -0.4) return 'derribar'
  // presioná sólo si pegás mucho más y no te va a llevar al piso por presionar
  if (sEdge > 1.5 && gEdge > -1.5 && b.stats.chin < 6) return 'presionar'
  return 'boxear'
}

export function playRound(s, f, planId) {
  const rng = s.rng
  const n = f.rounds.length + 1
  const mine = PLANS[planId] ? planId : 'boxear'
  const his = oppPlan(f, rng)
  const P = PLANS[mine]
  const O = PLANS[his]

  // aguantar el round: recuperás gas y podés sacarte el "lastimado" de encima
  const recover = (c, plan) => {
    if (plan !== 'aguantar') return
    c.stam = Math.min(c.stamMax, c.stam + c.stamMax * TUNING.stamRecover)
    if (c.hurt && rng() < 0.42 + c.stats.chin * 0.045) c.hurt = false
  }
  recover(f.a, mine)
  recover(f.b, his)

  const sf = (c) => 0.38 + 0.62 * clamp(c.stam / c.stamMax, 0, 1)
  const power = (c) => 0.72 + c.stats.iq * 0.055 // qué tan bien te sale el plan que elegiste
  const guard = (c) => 1 - c.stats.iq * 0.022 // leer la pelea también es no comer
  const stanceEdge = (c, o) => (c.stance === 'southpaw' && o.stance !== 'southpaw' ? 1.07 - o.stats.iq * 0.007 : 1)
  const str = (c, o) => c.stats.striking * sf(c) * (1 + c.stats.iq * 0.045) * stanceEdge(c, o)
  const grap = (c) => c.stats.grappling * sf(c) * (1 + c.stats.iq * 0.03)

  // ¿Dónde pasa el round? Curva continua empujada por los dos planes: cada décima de
  // grappling hace algo, y buscar el piso siendo el peor luchador te deja abajo.
  const gap = grap(f.a) - grap(f.b)
  const wants = P.ground * power(f.a) + O.ground * power(f.b)
  const pGround = clamp(0.08 + Math.abs(gap) * 0.11 + wants, 0.02, 0.88)
  const ground = rng() < pGround
  const topIsMe = gap + (P.ground - O.ground) * 1.2 > 0

  let dmgA = 0
  let dmgB = 0
  let text
  let roundWinner
  let blowout = false

  if (ground) {
    const top = topIsMe ? f.a : f.b
    const bottom = topIsMe ? f.b : f.a
    const edge = Math.max(0.35, Math.abs(gap))
    // arriba se pega poco pero se controla: mismos modificadores que de pie, para que
    // el plan y el Fight IQ valgan lo mismo en los dos lados de la pelea
    const dmg =
      TUNING.baseDmg *
      0.8 *
      f.ko *
      (0.5 + rng() * 0.7) *
      clamp(edge / 3, 0.3, 1.3) *
      (topIsMe ? P.out * O.in : O.out * P.in) *
      guard(bottom) *
      (bottom.hurt && (topIsMe ? his : mine) !== 'aguantar' ? 1.25 : 1)
    if (topIsMe) dmgB = dmg
    else dmgA = dmg
    bottom.stam = Math.max(0, bottom.stam - 6)
    roundWinner = topIsMe ? 'a' : 'b'
    blowout = edge > 2.2

    const subP = TUNING.subChance * edge * (1 - bottom.stats.grappling / 14) * power(top)
    if (rng() < subP) {
      const sub = pick(SUBS, rng)
      finish(f, topIsMe ? 'win' : 'loss', `sumisión (${sub})`, n, timeStr(rng), topIsMe ? 'sub' : 'subAgainst')
      pushRound(f, n, mine, `${top.name} lo llevó a la lona y lo terminó con ${sub}.`)
      return f.rounds[f.rounds.length - 1]
    }
    text = pick(ROUND_TEXT.ground[topIsMe ? 'mine' : 'his'], rng)
  } else {
    // reparto no lineal: una ventaja chica de striking tiene que doler de verdad,
    // si no todas las peleas se van a los puntos
    const aS = str(f.a, f.b) ** 2.5
    const bS = str(f.b, f.a) ** 2.5
    const share = aS / (aS + bS)
    const swing = TUNING.baseDmg * 2 * f.ko
    dmgB = swing * share * (0.62 + rng() * 0.76) * P.out * O.in * guard(f.b)
    dmgA = swing * (1 - share) * (0.62 + rng() * 0.76) * O.out * P.in * guard(f.a)
    if (f.a.hurt && mine !== 'aguantar') dmgA *= 1.25
    if (f.b.hurt && his !== 'aguantar') dmgB *= 1.25
    roundWinner = dmgB > dmgA ? 'a' : 'b'
    const dom = Math.abs(dmgB - dmgA) / Math.max(1, dmgB + dmgA)
    blowout = dom > 0.42
    // El que se dedica a sobrevivir pierde el round, y lo pierde 10-8. Si no,
    // "aguantar" sería la forma barata de ganar peleas y no habría decisión.
    if (P.survive !== O.survive) {
      roundWinner = P.survive ? 'b' : 'a'
      blowout = true
    }
    const bank = ROUND_TEXT[mine] || ROUND_TEXT.boxear
    text = pick(dom > 0.32 ? bank[roundWinner === 'a' ? 'win' : 'lose'] : ROUND_TEXT.even, rng)
  }

  f.a.hp -= dmgA
  f.b.hp -= dmgB
  f.totalDmg += dmgA + dmgB
  const drain = (c, plan) => Math.max(0, (TUNING.stamDrain + (10 - c.stats.cardio) * 1.3) * PLANS[plan].drain)
  f.a.stam = Math.max(0, f.a.stam - drain(f.a, mine))
  f.b.stam = Math.max(0, f.b.stam - drain(f.b, his))

  // Derribo: el mentón decide si te levantás. Acá es donde chin dejó de ser seis puntos de vida.
  const dropped = (c, dmg) => c.hp > 0 && dmg > c.hpMax * TUNING.downThreshold && rng() < 0.35
  for (const [c, dmg, iLose] of [
    [f.b, dmgB, false],
    [f.a, dmgA, true],
  ]) {
    if (!dropped(c, dmg)) continue
    if (rng() < 0.34 + c.stats.chin * 0.06) {
      c.downs++
      c.hurt = true
      c.hp -= c.hpMax * 0.06
      blowout = true
      roundWinner = iLose ? 'b' : 'a'
      text = pick(ROUND_TEXT.down[iLose ? 'his' : 'mine'], rng)
    } else {
      finish(f, iLose ? 'loss' : 'win', rng() < 0.5 ? 'KO' : 'TKO (golpes)', n, timeStr(rng), iLose ? 'koAgainst' : 'ko')
      pushRound(f, n, mine, pick(ROUND_TEXT.finish[iLose ? 'his' : 'mine'], rng))
      return f.rounds[f.rounds.length - 1]
    }
  }

  if (dmgA > f.a.hpMax * TUNING.hurtThreshold || f.a.hp / f.a.hpMax < 0.3) f.a.hurt = true
  if (dmgB > f.b.hpMax * TUNING.hurtThreshold || f.b.hp / f.b.hpMax < 0.3) f.b.hurt = true

  if (f.b.hp <= 0 || f.a.hp <= 0) {
    const iLost = f.a.hp <= 0 && (f.b.hp > 0 || f.a.hp <= f.b.hp)
    const method = ground ? 'TKO (golpes desde arriba)' : rng() < 0.45 ? 'KO' : 'TKO (golpes)'
    finish(f, iLost ? 'loss' : 'win', method, n, timeStr(rng), iLost ? 'koAgainst' : 'ko')
    pushRound(f, n, mine, pick(ROUND_TEXT.finish[iLost ? 'his' : 'mine'], rng))
    return f.rounds[f.rounds.length - 1]
  }

  if (roundWinner === 'a') {
    f.aPts += 10
    f.bPts += blowout ? 8 : 9
  } else {
    f.bPts += 10
    f.aPts += blowout ? 8 : 9
  }

  pushRound(f, n, mine, text)
  return f.rounds[f.rounds.length - 1]
}

export function closeFight(s, f) {
  if (!f.result) {
    const margin = f.aPts - f.bPts
    // tarjeta empatada: la mayoría de las veces un juez la parte y sale dividida, a veces es empate
    if (margin === 0 && s.rng() < 0.25) {
      finish(f, 'draw', 'empate (mayoría)', f.rounds.length, '5:00', 'draw')
    } else {
      // A los jueces. Cada uno con su propio ruido: de ahí salen las divididas y los robos.
      let forMe = 0
      for (let j = 0; j < 3; j++) if (margin + (s.rng() * 4 - 2) > 0) forMe++
      if (forMe === 3) finish(f, 'win', 'decisión unánime', f.rounds.length, '5:00', 'dec')
      else if (forMe === 2) finish(f, 'win', 'decisión dividida', f.rounds.length, '5:00', 'dec')
      else if (forMe === 1) finish(f, 'loss', 'decisión dividida', f.rounds.length, '5:00', 'decAgainst')
      else finish(f, 'loss', 'decisión unánime', f.rounds.length, '5:00', 'decAgainst')
      // robo de verdad: la tarjeta acumulada decía que ganabas y te la dieron al otro
      f.robbed = f.result === 'loss' && margin > 0
    }
    f.war = f.totalDmg > TUNING.baseDmg * f.rounds.length * 1.28
  }
  if (f.a.downs + f.b.downs >= 3) f.war = true
  f.scoreA = f.aPts
  f.scoreB = f.bPts
  return f
}

// El loop completo, para el autoplay del test. En la UI el jugador es el `choose`.
export function simulateFight(s, opponent, choose = suggestPlan) {
  const f = openFight(s, opponent)
  while (!f.result && f.rounds.length < f.max) playRound(s, f, choose(s, f))
  return closeFight(s, f)
}

function pushRound(f, n, plan, text) {
  f.rounds.push({
    n,
    plan,
    text,
    aHp: clamp(f.a.hp / f.a.hpMax, 0, 1),
    bHp: clamp(f.b.hp / f.b.hpMax, 0, 1),
    aStam: clamp(f.a.stam / f.a.stamMax, 0, 1),
    bStam: clamp(f.b.stam / f.b.stamMax, 0, 1),
    aPts: f.aPts,
    bPts: f.bPts,
    aHurt: f.a.hurt,
    bHurt: f.b.hurt,
  })
}

function finish(f, result, method, round, time, methodKey) {
  f.result = result
  f.method = method
  f.endRound = round
  f.time = time
  f.methodKey = methodKey
}

// ── qué se juega ───────────────────────────────────────────────────────────────
// Misma reglas que advance(), sin mutar nada. Es lo que se muestra ANTES de entrar
// a la jaula: nadie tiene que perder algo sin haberlo visto venir.
export function stakes(s) {
  const i = tierIndex(s.tier)
  const t = LADDER[i]
  const d = diffOf(s)
  const out = []

  if (s.tier === 'champ') {
    out.push({ tone: 'good', text: `Ganás y es la defensa número ${s.titles + 1}` })
    out.push({ tone: 'bad', text: 'Perdés y entregás el cinturón' })
  } else if (s.tier === 'title') {
    out.push({ tone: 'good', text: 'Ganás y sos campeón del mundo' })
    out.push({ tone: 'bad', text: 'Perdés y volvés al ranking' })
  } else if (s.tier === 'ranked') {
    const hypeGap = Math.max(0, Math.ceil(LADDER[tierIndex('title')].hype - s.hype))
    out.push({
      tone: s.rank <= 3 && !hypeGap ? 'good' : 'info',
      text:
        s.rank <= 3
          ? hypeGap
            ? `Sos el #${s.rank}: para la pelea de título faltan #2 y ${hypeGap} de hype`
            : 'Estás a un puesto de pelear por el título'
          : `Sos el #${s.rank}. La pelea de título se abre en el #2${hypeGap ? ` (y ${hypeGap} de hype)` : ''}`,
    })
    out.push({ tone: 'bad', text: 'Perdés y bajás hasta tres puestos' })
  } else {
    const need = Math.max(0, t.need - s.tierWins)
    const hypeGap = Math.max(0, Math.ceil(LADDER[i + 1].hype - s.hype))
    const next = LADDER[i + 1].id === 'regional' ? COUNTRIES[s.country].regional : LADDER[i + 1].name
    if (need <= 1 && hypeGap === 0) out.push({ tone: 'good', text: `Ganás y ascendés a ${next}` })
    else
      out.push({
        tone: 'info',
        text: `Para ${next}: ${need} victoria${need === 1 ? '' : 's'} más${hypeGap ? ` y ${hypeGap} de hype` : ''}`,
      })
  }

  const cut = d.cutStreak
  if (isUFC(s.tier) && s.lossStreak >= cut - 1) out.push({ tone: 'bad', danger: 'Perdés esta y te cortan de UFC', text: 'Perdés esta y te cortan de UFC' })
  else if (!isUFC(s.tier) && s.lossStreak >= 3)
    out.push({ tone: 'bad', danger: 'Otra derrota y se termina la carrera', text: 'Perdés la cuarta al hilo y se termina la carrera' })
  else if (isUFC(s.tier) && s.lossStreak >= 1) out.push({ tone: 'bad', text: `Van ${s.lossStreak} derrotas al hilo, te cortan a las ${cut}` })
  if (s.tier !== 'ranked' && s.tierFights - s.tierWins >= 2) out.push({ tone: 'bad', text: 'Otra derrota acá y el escalón se reinicia' })

  for (const inj of s.injuries) out.push({ tone: 'bad', text: `${inj.label} (−${inj.amount.toFixed(1)}, ${inj.fights} pelea${inj.fights === 1 ? '' : 's'})` })
  if (s.flags.badCut && !s.flags.nutri) out.push({ tone: 'bad', text: 'Entrás vacío por el corte de peso' })
  if (s.flags.prep) out.push({ tone: 'good', text: `+0.6 ${s.flags.prep} por lo que afilaste esta semana` })
  if (s.flags.shortNotice) out.push({ tone: 'bad', text: 'Sin campamento y contra alguien mejor' })
  if (s.flags.easyOpp) out.push({ tone: 'info', text: 'Reemplazo peor rankeado' })
  if (s.nextOpponent) out.push({ tone: 'info', text: 'Revancha: ya sabe cómo peleás' })
  return out
}

// ── progresión ────────────────────────────────────────────────────────────────
export function applyFight(s, fight, opponent) {
  const t = tierOf(s)
  const d = diffOf(s)
  const notes = []
  const note = (text) => {
    notes.push(text)
    s.log.push({ kind: 'note', text })
  }
  const wasRematch = !!s.nextOpponent

  s.fights.push({
    opponent: opponent.name,
    result: fight.result,
    method: fight.method,
    round: fight.endRound,
    tier: t.name,
    rank: opponent.rank,
    real: opponent.real,
  })
  s.log.push({ kind: 'fight', fight, opponent: opponent.name, tier: t.name })

  const won = fight.result === 'win'
  const lost = fight.result === 'loss'
  const finished = fight.methodKey === 'ko' || fight.methodKey === 'sub'

  if (won) {
    s.record.w++
    s.streak++
    s.lossStreak = 0
    s.hype = clamp(s.hype + TUNING.hypeWin + (finished ? TUNING.hypeFinish : 0) + (isUFC(s.tier) ? 4 : 0), 0, 100)
    s.tierWins++
  } else if (lost) {
    s.record.l++
    s.streak = 0
    s.lossStreak++
    s.hype = clamp(s.hype + TUNING.hypeLoss, 0, 100)
  } else {
    s.record.d++
    s.streak = 0
    s.hype = clamp(s.hype - 1, 0, 100)
  }
  if (fight.war) s.hype = clamp(s.hype + 4, 0, 100)

  const pay = Math.round(t.pay * d.pay * (won ? 1 : 0.45))
  s.money += pay
  s.earned += pay
  // La carrera cuesta plata: gimnasio, equipo, viajes. Sin esto el dinero sólo sube y elegir es gratis.
  s.money = Math.max(0, s.money - Math.round(t.pay * d.pay * 0.18 + 900))

  if (s.methods[fight.methodKey] !== undefined) s.methods[fight.methodKey]++

  s.tierFights++
  s.age += TUNING.yearsPerFight

  if (wasRematch && won) note(`Le devolviste la derrota a ${opponent.name}. Eso no se lo saca nadie.`)
  if (wasRematch && won) s.hype = clamp(s.hype + 6, 0, 100)
  if ((lost || fight.war) && !s.rivals.some((r) => r.name === opponent.name))
    s.rivals.push({ name: opponent.name, style: opponent.style, level: opponent.level, rank: opponent.rank, real: opponent.real, beatMe: lost })
  if (won) s.rivals = s.rivals.filter((r) => r.name !== opponent.name)

  // las banderas y la revancha son de "esta pelea": se consumen
  delete s.flags.badCut
  delete s.flags.shortNotice
  delete s.flags.easyOpp
  delete s.flags.prep
  if (s.flags.nutri && --s.flags.nutri <= 0) delete s.flags.nutri
  s.nextOpponent = null

  // las lesiones cuentan peleas, no años
  s.injuries = s.injuries.filter((inj) => --inj.fights > 0)

  s.last = {
    result: fight.result,
    methodKey: fight.methodKey,
    war: !!fight.war,
    robbed: !!fight.robbed,
    hurt: fight.a.hurt,
    downs: fight.a.downs,
    opponent: opponent.name,
    rank: opponent.rank,
  }

  grow(s, fight)
  advance(s, fight, note)
  s.pending = null
  s.phase = 'camp'
  s.peakTier = Math.max(s.peakTier, tierIndex(s.tier))
  if (s.rank) s.peakRank = Math.min(s.peakRank ?? 99, s.rank)
  return notes
}

function grow(s, fight) {
  const gymTier = GYMS[s.gym].tier
  const young = s.age < 29 ? 1 : s.age < 33 ? 0.5 : 0.1
  const g = TUNING.growthPerFight * (0.6 + gymTier * 0.18) * young * diffOf(s).growth
  // rendimiento decreciente: llegar de 8 a 9 cuesta mucho más que de 4 a 5
  for (const k of ['striking', 'grappling', 'iq']) s.stats[k] = clamp(s.stats[k] + g * (0.6 + s.rng() * 0.8) * (1 - s.stats[k] / 11), 1, 10)
  if (s.age > 31) {
    s.stats.cardio = clamp(s.stats.cardio - 0.16, 1, 10)
    s.stats.chin = clamp(s.stats.chin - 0.12, 1, 10)
  }
  if (fight.methodKey === 'koAgainst') s.stats.chin = clamp(s.stats.chin - 0.38, 1, 10)
  if (fight.a.downs) s.stats.chin = clamp(s.stats.chin - 0.08 * fight.a.downs, 1, 10)
}

function advance(s, fight, note) {
  const i = tierIndex(s.tier)
  const t = LADDER[i]
  const d = diffOf(s)
  const won = fight.result === 'win'
  const lost = fight.result === 'loss'
  const finished = fight.methodKey === 'ko' || fight.methodKey === 'sub'
  const toTier = (id, rank = null) => {
    s.tier = id
    s.rank = rank
    s.tierFights = 0
    s.tierWins = 0
  }

  if (s.tier === 'champ') {
    if (won) {
      s.titles++
      note(`Defensa de título número ${s.titles}. Sos el campeón.`)
    } else if (lost) {
      toTier('ranked', 1)
      note('Perdiste el cinturón. Se termina un reinado y empieza la parte difícil.')
    }
  } else if (s.tier === 'title') {
    if (won) {
      toTier('champ')
      s.titles++
      note('¡Campeón del mundo! Te ponen el cinturón en la cintura y no te entra en la cabeza.')
    } else if (lost) {
      toTier('ranked', 3)
      note('Perdiste la pelea de tu vida. Hay que volver a subir.')
    }
  } else if (s.tier === 'ranked') {
    // El ranking es el gate: cada pelea mueve un número que el jugador ve.
    const oppRank = fight.oppRank ?? 16
    const before = s.rank
    if (won) s.rank = Math.max(1, s.rank - (oppRank < s.rank ? 2 : 1) - (finished && oppRank < s.rank ? 1 : 0))
    else if (lost) s.rank = Math.min(15, s.rank + (oppRank > s.rank ? 3 : 2))
    if (s.rank !== before) note(won ? `Subís al #${s.rank} del ranking mundial.` : `Caés al #${s.rank} del ranking.`)
    const titleHype = LADDER[tierIndex('title')].hype
    if (s.rank <= 2 && s.hype >= titleHype) {
      toTier('title', 1)
      note('Te dan la pelea por el título. Es esta.')
    } else if (s.rank <= 2 && s.rank !== before) {
      note(`Sos el #${s.rank}, pero te faltan ${Math.ceil(titleHype - s.hype)} de hype para que alguien venda una pelea de título con tu nombre.`)
    }
  } else if (won && s.tierWins >= t.need && s.hype >= LADDER[i + 1].hype) {
    const nextId = LADDER[i + 1].id
    toTier(nextId, nextId === 'ranked' ? 15 : null)
    note(`Subís de escalón: ${LADDER[i + 1].name}.${nextId === 'ranked' ? ' Entrás al top 15 como #15.' : ''}`)
  } else if (won && s.tierWins >= t.need) {
    // ganaste lo que hacía falta pero no te conoce nadie: decilo, no lo escondas
    note(`Tenés las victorias para subir, pero te faltan ${Math.ceil(LADDER[i + 1].hype - s.hype)} de hype. Nadie vende esa pelea todavía.`)
  } else if (lost && s.tierFights - s.tierWins >= 3) {
    // sólo después de una derrota: ganar nunca te puede reiniciar el escalón
    s.tierFights = 0
    s.tierWins = 0
    s.hype = clamp(s.hype - 6, 0, 100)
    note('Te estancaste en este nivel. Los que decidían miran para otro lado y hay que empezar de nuevo.')
  }

  // corte, estancamiento y retiro
  if (isUFC(s.tier) && s.lossStreak >= d.cutStreak) {
    if (s.age > 33 || s.record.l > s.record.w)
      return end(s, 'Cortado', `${s.lossStreak} derrotas seguidas y la carta de despido. A esa edad no vuelve a llamar nadie.`)
    toTier('regional')
    s.hype = clamp(s.hype - 18, 0, 100)
    note('Te cortaron de UFC. Vuelta al circuito regional a reconstruirlo todo.')
  }
  if (!isUFC(s.tier) && s.lossStreak >= 4)
    return end(s, 'Nunca la pegó', 'Cuatro derrotas al hilo en el regional. En algún momento hay que aceptar que el teléfono no va a sonar.')
  if (s.stats.chin <= 1.35 && s.methods.koAgainst >= 4)
    return end(s, 'Retiro forzado', 'Cuatro nocauts en poco tiempo. La comisión médica no te renueva la licencia y, si sos honesto, es un alivio.')
  if (s.age >= TUNING.retireAge) return end(s, 'Retiro por edad', 'Se acabó el tiempo. Colgás los guantes con el cuerpo hecho un mapa y ninguna deuda con nadie.')
  if (s.fights.length >= 60) return end(s, 'Retiro por edad', 'Sesenta peleas profesionales. Ya está.')
}

function end(s, ending, text) {
  s.over = true
  s.ending = ending
  s.log.push({ kind: 'note', text })
  s.endingText = text
}

// Cachea el paso: nextStep se llama en cada render y no puede consumir RNG dos veces.
export function nextStep(s) {
  if (s.over) return { kind: 'end' }
  if (s.pending) return s.pending
  if (s.phase === 'camp') {
    const e = pickEvent(s, 'camp')
    if (e) return (s.pending = { kind: 'event', event: e, slot: 'camp' })
    s.phase = 'week'
  }
  if (s.phase === 'week') {
    const e = pickEvent(s, 'week')
    if (e) return (s.pending = { kind: 'event', event: e, slot: 'week' })
    s.phase = 'fight'
  }
  return (s.pending = { kind: 'fight', opponent: buildOpponent(s) })
}

// ── final ─────────────────────────────────────────────────────────────────────
export function grade(s) {
  if (s.titles >= 3) return { title: 'Leyenda', desc: 'Vas a estar en el Salón de la Fama y en la remera de un pibe que todavía no nació.' }
  if (s.titles >= 1) return { title: 'Campeón de UFC', desc: 'Llegaste a lo más alto del deporte. Poca gente en la historia puede decir lo mismo.' }
  if (s.peakTier >= tierIndex('title')) return { title: 'Retador al título', desc: 'Peleaste por el cinturón. Te quedaste a un round de la gloria.' }
  if (s.peakRank && s.peakRank <= 3) return { title: `Top 3 del mundo`, desc: `Llegaste al #${s.peakRank} de la división y te faltó una sola pelea. Vas a pensar en eso el resto de tu vida.` }
  if (s.peakRank && s.peakRank <= 8) return { title: 'Top 10 mundial', desc: `Llegaste al #${s.peakRank} del mundo. Estuviste entre los mejores diez del planeta en tu categoría.` }
  if (s.peakTier >= tierIndex('ranked')) return { title: 'Top 15 mundial', desc: 'Estuviste rankeado entre los quince mejores del planeta en tu categoría.' }
  if (s.ending === 'Cortado') return { title: 'Cortado de UFC', desc: 'Llegaste a la jaula grande y no te alcanzó el tiempo adentro.' }
  if (s.ending === 'Retiro forzado') return { title: 'Retiro forzado', desc: 'El cuerpo dijo basta antes que la cabeza.' }
  if (s.peakTier >= tierIndex('prelim')) return { title: 'Peleador de UFC', desc: 'Entraste a la jaula que se ve en todo el mundo. Eso ya es más de lo que logra el 99%.' }
  if (s.peakTier >= tierIndex('regional')) return { title: 'Gatekeeper regional', desc: 'Fuiste el examen que tenían que aprobar los prospectos. Alguien tiene que serlo.' }
  return { title: 'Nunca la pegó', desc: 'Quedó la anécdota, el gimnasio y las fotos con la nariz rota.' }
}

// Con qué te quedás después. La plata sí importa acá: es la diferencia entre
// tener un gimnasio y volver a la obra a los treinta y nueve.
export function afterlife(s) {
  if (s.flags.ownGym) return 'Tenés tu academia llena de pibes que quieren ser vos. No vas a trabajar de otra cosa nunca más.'
  if (s.money > 250000) return 'Te retirás acomodado. La plata alcanza y sobra, y eso en este deporte es casi tan raro como un cinturón.'
  if (s.money > 40000) return 'Te alcanza para arrancar algo. No es una fortuna, pero saliste entero y con algo en el banco.'
  if (s.earned > 200000) return 'Ganaste mucha plata y no te queda casi nada. Pasa más seguido de lo que se cuenta.'
  return 'Te retirás sin un peso. Mañana hay que buscar trabajo como todo el mundo.'
}

export function summaryText(s) {
  const g = grade(s)
  const w = weightOf(s)
  const finishes = s.methods.ko + s.methods.sub
  const best = s.fights.filter((f) => f.result === 'win' && f.real).slice(-3).map((f) => f.opponent)
  return [
    `🥊 ${s.name}${s.nickname ? ` "${s.nickname}"` : ''} — ${COUNTRIES[s.country].name}`,
    `${w.name} · ${STYLES[s.style].name} · ${s.gym} · ${diffOf(s).name}`,
    `Récord: ${s.record.w}-${s.record.l}-${s.record.d} (${finishes} finalizaciones)`,
    s.titles ? `🏆 Campeón de UFC · ${s.titles} ${s.titles === 1 ? 'título/defensa' : 'títulos y defensas'}` : null,
    best.length ? `Le ganó a: ${best.join(', ')}` : null,
    `Ganó US$ ${s.earned.toLocaleString('es-AR')} en toda la carrera`,
    `Final: ${g.title} — ${g.desc}`,
    `Semilla: ${s.seed}`,
    `Jugá el tuyo 👊`,
  ]
    .filter(Boolean)
    .join('\n')
}
