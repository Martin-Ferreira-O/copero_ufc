import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  COUNTRIES,
  GYMS,
  STYLES,
  WEIGHT_CLASSES,
  STATS,
  STAT_LABELS,
  NICKNAMES,
  LADDER,
  DIFFICULTIES,
  PLANS,
  PLAN_IDS,
  gymsOf,
} from './data.js'
import {
  newCareer,
  nextStep,
  applyOption,
  eventText,
  openFight,
  playRound,
  closeFight,
  suggestPlan,
  applyFight,
  scout,
  stakes,
  effStats,
  grade,
  afterlife,
  summaryText,
  tierOf,
  weightOf,
  diffOf,
} from './sim.js'

const PACE = 1500 // ms que queda en pantalla un round ya resuelto
const SHORT = { amateur: 'AM', regional: 'REG', dwcs: 'DWCS', prelim: 'PRE', maincard: 'MAIN', ranked: 'T15', title: 'TÍT', champ: 'CAMP' }
const LETTERS = 'ABCDEF'
// ponytail: el historial arranca cortado; el resto se despliega a pedido.
const HIST_N = 6

// En el escalón regional la promotora depende del país: le da color a la carrera.
const promoName = (s) => (s.tier === 'regional' ? COUNTRIES[s.country].regional : tierOf(s).name)
const usd = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)))

const hashSeed = (str) => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return h
}

export default function App() {
  const [career, setCareer] = useState(null)
  const [, force] = useState(0)
  const rerender = () => force((n) => n + 1)

  const screen = !career ? 'setup' : career.over ? 'end' : 'career'
  const restart = () => setCareer(null)

  return (
    <div className="app" data-tier={screen === 'career' ? career.tier : 'amateur'}>
      <Skin />
      {screen === 'setup' && <Setup key="setup" onStart={setCareer} />}
      {screen === 'career' && <Career key="career" s={career} rerender={rerender} onRestart={restart} />}
      {screen === 'end' && <End key="end" s={career} onRestart={restart} />}
      <footer className="siteFoot">
        <span>Copero · simulador de carrera UFC</span>
        <span>prototipo de escritorio</span>
      </footer>
    </div>
  )
}

// La sala: viñeta de luz, líneas de TV, tubo fluorescente y grano.
// Cada capa se prende o apaga por CSS según data-tier. Cero assets.
function Skin() {
  return (
    <div className="skin" aria-hidden="true">
      <span className="vig" />
      <span className="scan" />
      <span className="glare" />
      <svg className="grain" preserveAspectRatio="none">
        <filter id="cuGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.86" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#cuGrain)" />
      </svg>
    </div>
  )
}

// ── setup ─────────────────────────────────────────────────────────────────────
function Setup({ onStart }) {
  const [country, setCountry] = useState('ar')
  const [gym, setGym] = useState(gymsOf('ar')[0])
  const [style, setStyle] = useState('boxeo')
  const [weight, setWeight] = useState('light')
  const [stance, setStance] = useState('orthodox')
  const [diff, setDiff] = useState('normal')
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState(20)
  const [seed, setSeed] = useState('')

  const changeCountry = (c) => {
    setCountry(c)
    setGym(gymsOf(c)[0])
  }

  const start = () => {
    const s = (seed.trim() && Math.abs(hashSeed(seed.trim()))) || Math.floor(Math.random() * 1e9)
    onStart(
      newCareer(
        {
          name: name.trim() || 'Peleador Sin Nombre',
          nickname: nickname.trim(),
          country,
          gym,
          style,
          weight,
          stance,
          diff,
          age: Number(age),
        },
        s
      )
    )
  }

  const w = WEIGHT_CLASSES.find((x) => x.id === weight)
  const meta = [
    COUNTRIES[country].name,
    gym,
    STYLES[style].name,
    `${w.name} (${w.kg} kg)`,
    stance === 'southpaw' ? 'zurdo' : 'ortodoxo',
    `debut a los ${age}`,
    DIFFICULTIES[diff].name,
  ].join(' · ')

  return (
    <div className="screen setup">
      <div className="wrap">
        <header className="hero">
          <div>
            <p className="kicker">simulador de carrera</p>
            <h1>
              COPERO <span>UFC</span>
            </h1>
          </div>
          <div className="heroSide">
            <p>
              Del gimnasio de barrio a la jaula más grande del mundo. Elegí quién sos, tomá las decisiones que te van a doler y peleá round por
              round hasta donde llegues.
            </p>
            <div className="heroStats">
              <span>
                <b>{LADDER.length}</b>
                <small>escalones</small>
              </span>
              <span>
                <b>{WEIGHT_CLASSES.length}</b>
                <small>categorías</small>
              </span>
              <span>
                <b>∞</b>
                <small>carreras</small>
              </span>
            </div>
          </div>
        </header>

        <div className="panels">
          <section className="panel">
            <h2>
              <b>01</b>
              <span>¿Quién sos?</span>
            </h2>
            <div className="fields">
              <label className="field">
                <span className="lbl">Nombre</span>
                <input className="big" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" maxLength={24} />
              </label>

              <div className="field">
                <span className="lbl">Apodo</span>
                <div className="withBtn">
                  <input
                    className="big gold"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="opcional"
                    maxLength={18}
                  />
                  <button
                    type="button"
                    aria-label="Apodo al azar"
                    onClick={() => setNickname(NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)])}
                  >
                    🎲
                  </button>
                </div>
              </div>

              <label className="field">
                <span className="lbl">Debut a los</span>
                <span className="ageNum">
                  {age} <small>años</small>
                </span>
                <input type="range" min="18" max="26" value={age} onChange={(e) => setAge(Number(e.target.value))} />
              </label>

              <div className="field">
                <span className="lbl">Guardia</span>
                <div className="pills">
                  {[
                    ['orthodox', 'Ortodoxa'],
                    ['southpaw', 'Zurda'],
                  ].map(([id, label]) => (
                    <button key={id} type="button" className={stance === id ? 'pill on' : 'pill'} onClick={() => setStance(id)}>
                      {label}
                    </button>
                  ))}
                </div>
                <span className="hint">La zurda incomoda a los ortodoxos, salvo que el rival lea muy bien.</span>
              </div>

              <div className="field">
                <span className="lbl">Dificultad</span>
                <div className="pills">
                  {Object.entries(DIFFICULTIES).map(([id, d]) => (
                    <button key={id} type="button" className={diff === id ? 'pill on' : 'pill'} onClick={() => setDiff(id)}>
                      {d.name}
                    </button>
                  ))}
                </div>
                <span className="hint">{DIFFICULTIES[diff].desc}</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>
              <b>02</b>
              <span>¿De dónde salís?</span>
            </h2>
            <select value={country} onChange={(e) => changeCountry(e.target.value)} aria-label="País">
              {Object.entries(COUNTRIES).map(([id, c]) => (
                <option key={id} value={id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="subHead">
              <span>Gimnasio</span>
              <span className="soft">Regional: {COUNTRIES[country].regional}</span>
            </div>
            <div className="list">
              {gymsOf(country).map((g) => (
                <button key={g} type="button" className={gym === g ? 'row on' : 'row'} onClick={() => setGym(g)}>
                  <span className="head">
                    <strong>{g}</strong>
                    <em>{'★'.repeat(GYMS[g].tier)}</em>
                  </span>
                  <span className="flavor">{GYMS[g].flavor}</span>
                  <span className="bonus">
                    {Object.entries(GYMS[g].bonus)
                      .map(([k, v]) => `+${v} ${STAT_LABELS[k]}`)
                      .join(' · ')}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>
              <b>03</b>
              <span>¿Cómo peleás?</span>
            </h2>
            <div className="grid2">
              {Object.entries(STYLES).map(([id, st]) => (
                <button key={id} type="button" className={style === id ? 'cell on' : 'cell'} onClick={() => setStyle(id)}>
                  <strong>{st.name}</strong>
                  <span className="flavor">{st.desc}</span>
                  <span className="bonus">
                    {STATS.filter((k) => st.stats[k] >= 5)
                      .map((k) => `${STAT_LABELS[k]} ${st.stats[k]}`)
                      .join(' · ')}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <h2 className="loose">
          <b>04</b>
          <span>¿En qué categoría?</span>
        </h2>
        <div className="strip">
          {WEIGHT_CLASSES.map((x) => (
            <button key={x.id} type="button" className={weight === x.id ? 'on' : ''} onClick={() => setWeight(x.id)}>
              <span>{x.name}</span>
              <small>{x.kg} kg</small>
            </button>
          ))}
        </div>
      </div>

      <div className="startBar">
        <div className="startInner">
          <div className="who">
            <div className="line1">
              {name.trim() || 'Peleador Sin Nombre'} {nickname.trim() && <span>“{nickname.trim()}”</span>}
            </div>
            <div className="line2">{meta}</div>
          </div>
          <label className="field seed">
            <span className="lbl">Semilla (opcional)</span>
            <input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="misma semilla, misma carrera" maxLength={20} />
          </label>
          <button className="go" onClick={start}>
            <span>Empezar la carrera</span>
            <span className="chev">▸▸</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── carrera ───────────────────────────────────────────────────────────────────
export function Career({ s, rerender, onRestart }) {
  const [step, setStep] = useState(() => nextStep(s))
  const [inCage, setInCage] = useState(false)
  const [allHist, setAllHist] = useState(false)

  const advance = () => {
    setInCage(false)
    if (s.over) return rerender()
    setStep(nextStep(s))
    rerender()
  }

  const choose = (i) => {
    applyOption(s, step.event, i)
    advance()
  }

  const idx = LADDER.findIndex((t) => t.id === s.tier)
  const { line, bump } = useDeltas(s)
  const eff = effStats(s)
  const risks = stakes(s)
  const danger = risks.find((r) => r.danger)

  return (
    <div className="screen career">
      <div className="rail left">
        <div className="idCard">
          <div className="idHead">
            <span className="promo">{promoName(s)}</span>
            <span className="short">{s.rank ? `#${s.rank}` : SHORT[s.tier]}</span>
          </div>
          <div className="idBody">
            <div className="fname">{s.name}</div>
            {s.nickname && <div className="fnick">“{s.nickname}”</div>}
            <div className="fmeta">
              {[weightOf(s).name, STYLES[s.style].name, s.gym, COUNTRIES[s.country].name, `${Math.floor(s.age)} años`].join(' · ')}
            </div>
            <div className="recRow">
              <b key={bump ? 'bump' : 'calm'} className={bump ? 'pop' : ''}>
                {s.record.w}-{s.record.l}-{s.record.d}
              </b>
              <small>
                récord
                <br />
                profesional
              </small>
            </div>
          </div>
          {danger && <div className="danger">⚠ {danger.danger}</div>}
          {line && (
            <div className="bug" key={line}>
              {line}
            </div>
          )}
        </div>

        <div className="box">
          <div className="boxHead">atributos</div>
          <div className="stats">
            {STATS.map((k) => {
              const down = s.stats[k] - eff[k]
              return (
                <div key={k} className="stat">
                  <span>{STAT_LABELS[k]}</span>
                  <span className="track">
                    <i style={{ width: `${eff[k] * 10}%` }} />
                  </span>
                  <b className={down > 0.05 ? 'hit' : ''}>
                    {eff[k].toFixed(1)}
                    {down > 0.05 && <em>−{down.toFixed(1)}</em>}
                  </b>
                </div>
              )
            })}
          </div>
          {s.injuries.length > 0 && (
            <div className="injuries">
              {s.injuries.map((inj, i) => (
                <span key={i}>
                  {inj.label} <small>{inj.fights} pelea{inj.fights === 1 ? '' : 's'}</small>
                </span>
              ))}
            </div>
          )}
          <div className="hype">
            <div className="hypeTop">
              <span>Hype</span>
              <b>{Math.round(s.hype)}</b>
            </div>
            <span className="track">
              <i style={{ width: `${Math.max(0, Math.min(100, s.hype))}%` }} />
            </span>
          </div>
        </div>
      </div>

      <div className="center">
        {!inCage && step.kind === 'event' && (
          <div className="beat event">
            <p className="kicker dot">{step.slot === 'week' ? 'semana de pelea' : 'entre peleas'}</p>
            <h3>{step.event.title}</h3>
            <p className="body">{eventText(step.event, s)}</p>
            <div className="options">
              {step.event.options.map((o, i) => {
                const off = o.can && !o.can(s)
                return (
                  <button key={i} onClick={() => choose(i)} disabled={off} title={off ? 'No te alcanza' : undefined}>
                    <b>{LETTERS[i]}</b>
                    <span className="oLabel">
                      {o.label}
                      <small className="fx">{off ? 'no te alcanza la plata' : o.fx}</small>
                    </span>
                    <span className="chev">▸</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {!inCage && step.kind === 'fight' && (
          <div className="beat bout">
            <span className="tier">{promoName(s)}</span>
            <div className="names">
              <div className="me">{s.name}</div>
              <div className="vs">VS</div>
              <div className="opp">{step.opponent.name}</div>
            </div>
            <p className="boutMeta">
              {weightOf(s).name} · {tierOf(s).rounds} rounds · {scout(s, step.opponent).join(' · ')}
            </p>
            <div className="stakes">
              {risks.map((r, i) => (
                <span key={i} className={`stake ${r.tone}`}>
                  {r.text}
                </span>
              ))}
            </div>
            <button className="enter" onClick={() => setInCage(true)}>
              Entrar a la jaula
            </button>
          </div>
        )}

        <div className="history">
          <div className="histHead">
            <span>historial</span>
            <span className="rule" />
            <span className="count">{s.fights.length ? `${s.fights.length} peleas` : 'todavía nada'}</span>
          </div>
          <div className="histList">
            {(allHist ? s.log : s.log.slice(-HIST_N))
              .map((entry, i) => <LogEntry key={s.log.length - i} entry={entry} />)
              .reverse()}
          </div>
          {s.log.length > HIST_N && (
            <button className="histMore" onClick={() => setAllHist(!allHist)}>
              {allHist ? '▲ mostrar menos' : `▼ ver todo (${s.log.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="rail right">
        <div className="box">
          <div className="boxHead">el camino</div>
          <div className="ladder">
            {LADDER.map((t, i) => (
              <div key={t.id} className={i < idx ? 'rung done' : i === idx ? 'rung now' : 'rung'}>
                <span className="bar" />
                <span className="name">{t.id === 'regional' ? COUNTRIES[s.country].regional : t.name}</span>
                <span className="meta">{rungMeta(s, i, idx)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="box">
          <div className="boxHead">planilla</div>
          <div className="tiles">
            <Tile n={s.fights.length} label="peleas" />
            <Tile n={s.methods.ko + s.methods.sub} label="finalizaciones" />
            <Tile n={s.titles} label="títulos" />
            <Tile n={usd(s.money)} label="en la cuenta" />
          </div>
          <div className="seedRow">
            <span>{diffOf(s).name.toLowerCase()} · semilla</span>
            <span>{s.seed}</span>
          </div>
        </div>

        <button className="reset" onClick={onRestart}>
          Reiniciar carrera
        </button>
      </div>

      {inCage && <FightPanel s={s} opponent={step.opponent} onDone={advance} />}
    </div>
  )
}

// Lo que falta para subir, en el escalón donde estás. Nada de gates invisibles.
function rungMeta(s, i, idx) {
  if (i < idx) return 'hecho'
  if (i > idx) return `${LADDER[i].rounds}r`
  if (s.tier === 'champ') return `${s.titles} def.`
  if (s.rank) return `sos el #${s.rank}`
  const t = LADDER[i]
  const gap = Math.max(0, Math.ceil(LADDER[i + 1].hype - s.hype))
  return `${Math.min(s.tierWins, t.need)}/${t.need} v${gap ? ` · falta ${gap} hype` : ''}`
}

// Lee `s` después de cada mutación del motor y arma la línea de cambios.
// No toca el motor: sólo compara el snapshot anterior con el actual.
function useDeltas(s) {
  const prev = useRef(null)
  const [line, setLine] = useState('')
  const [bump, setBump] = useState(false)

  useEffect(() => {
    const now = { ...s.stats, hype: s.hype, w: s.record.w, l: s.record.l }
    const before = prev.current
    prev.current = now
    if (!before) return

    const out = []
    for (const k of STATS) {
      const d = now[k] - before[k]
      if (Math.abs(d) >= 0.05) out.push(`${STAT_LABELS[k]} ${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`)
    }
    const dh = Math.round(now.hype - before.hype)
    if (dh) out.push(`Hype ${dh > 0 ? '+' : '−'}${Math.abs(dh)}`)
    const rec = now.w !== before.w || now.l !== before.l
    if (rec) out.push(`Récord ${s.record.w}-${s.record.l}-${s.record.d}`)
    if (!out.length) return

    setLine(out.join('  ·  '))
    setBump(rec)
    const t1 = setTimeout(() => setLine(''), 2200)
    const t2 = setTimeout(() => setBump(false), 500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [s.record.w, s.record.l, s.hype, s.log.length])

  return { line, bump }
}

function LogEntry({ entry }) {
  if (entry.kind === 'note')
    return (
      <div className="beat note">
        <span className="tick" />
        <span>{entry.text}</span>
      </div>
    )

  if (entry.kind === 'event')
    return (
      <div className="beat past">
        <h4>{entry.title}</h4>
        <p className="choice">→ {entry.choice}</p>
        <p>{entry.outcome}</p>
      </div>
    )

  const f = entry.fight
  return (
    <div className={`beat result ${f.result}`}>
      <span className="chip">{f.result === 'win' ? 'GANÓ' : f.result === 'draw' ? 'EMPATÓ' : 'PERDIÓ'}</span>
      <span className="oppName">{entry.opponent}</span>
      <span className="resMeta">
        {f.method} · R{f.endRound} {f.time} · {entry.tier}
      </span>
    </div>
  )
}

// ── pelea round por round ─────────────────────────────────────────────────────
// El jugador es la esquina: antes de cada round pide un plan y el motor resuelve ese round.
function FightPanel({ s, opponent, onDone }) {
  const [f] = useState(() => openFight(s, opponent)) // openFight no consume RNG: seguro en el initializer
  const [shown, setShown] = useState([]) // rounds ya resueltos, copiados para render
  const [phase, setPhase] = useState('call') // call → reveal → (call | done)
  const [notes, setNotes] = useState([])
  const [auto, setAuto] = useState(false)
  const applied = useRef(false)

  const call = (plan) => {
    playRound(s, f, plan)
    if (!f.result && f.rounds.length >= f.max) closeFight(s, f)
    setShown([...f.rounds])
    setPhase('reveal')
  }

  // el round resuelto queda en pantalla y después seguimos: otro plan, o el veredicto
  useEffect(() => {
    if (phase !== 'reveal') return
    const t = setTimeout(
      () => {
        if (!f.result) return setPhase('call')
        if (!applied.current) {
          applied.current = true
          setNotes(applyFight(s, f, opponent))
        }
        setPhase('done')
      },
      auto ? 700 : PACE
    )
    return () => clearTimeout(t)
  }, [phase, auto])

  // modo automático: la esquina decide por vos
  useEffect(() => {
    if (auto && phase === 'call' && !f.result) call(suggestPlan(s, f))
  }, [auto, phase])

  const last = shown[shown.length - 1]
  const hp = (side) => (last ? last[side + 'Hp'] : 1)
  const st = (side) => (last ? last[side + 'Stam'] : 1)
  const ko = f.methodKey === 'ko' || f.methodKey === 'koAgainst'
  const byDecision = /decisión|empate/.test(f.method || '')
  const tip = suggestPlan(s, f)

  // ponytail: portal a body — dentro de .screen (que anima transform) el fixed
  // se ancla al ancestro y la jaula queda centrada en la página, no en la pantalla.
  return createPortal(
    <div className="fightOverlay">
      <div className="fightBox">
        {phase === 'reveal' && <span className="flash bell" key={shown.length} />}
        {phase === 'done' && ko && <span className={`flash ko ${f.result}`} />}

        <div className="fightHead">
          <div className="fhMeta">
            <span className="promo">{promoName(s)}</span>
            <span>
              {weightOf(s).name} · {f.max} rounds
            </span>
          </div>
          <div className="corners">
            <Corner name={s.name} hp={hp('a')} stam={st('a')} hurt={f.a.hurt} downs={f.a.downs} />
            <span className="vs">VS</span>
            <Corner name={opponent.name} hp={hp('b')} stam={st('b')} hurt={f.b.hurt} downs={f.b.downs} mirror />
          </div>
        </div>

        <ol className="rounds">
          {shown.map((r, i) => (
            <li key={r.n} className={i === shown.length - 1 ? 'live' : ''}>
              <b>R{r.n}</b>
              <span>
                <em className="planTag">{PLANS[r.plan].label}</em>
                {r.text}
              </span>
            </li>
          ))}
        </ol>

        {phase === 'call' && !f.result && (
          <div className="cornerCall">
            <p className="callHead">
              <b>Round {f.rounds.length + 1}</b>
              <span>
                {f.a.hurt ? 'estás lastimado' : st('a') < 0.3 ? 'te queda poco gas' : shown.length ? 'la esquina te pregunta' : 'último aviso antes de la campana'}
              </span>
              <button className={auto ? 'autoBtn on' : 'autoBtn'} onClick={() => setAuto(!auto)}>
                {auto ? 'auto ✓' : 'auto'}
              </button>
            </p>
            <div className="options plans">
              {PLAN_IDS.map((id, i) => (
                <button key={id} onClick={() => call(id)}>
                  <b>{LETTERS[i]}</b>
                  <span className="oLabel">
                    {PLANS[id].label}
                    <small className="fx">
                      {PLANS[id].hint} · {STAT_LABELS[PLANS[id].key]}
                    </small>
                  </span>
                  <span className="chev">{id === tip ? '★' : '▸'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className={`verdict ${f.result}`}>
            <strong>{f.result === 'win' ? 'GANASTE' : f.result === 'draw' ? 'EMPATE' : 'PERDISTE'}</strong>
            <div className="vLines">
              <div className="score">
                <b>{byDecision ? `${f.scoreA}–${f.scoreB}` : `R${f.endRound} ${f.time}`}</b>
                <small>{byDecision ? 'scorecard' : ko ? 'nocaut' : 'finalización'}</small>
              </div>
              <p>
                {f.method} · round {f.endRound} · {f.time}
                {f.war ? ' · guerra' : ''}
              </p>
            </div>
            {notes.length > 0 && (
              <div className="consequences">
                {notes.map((n, i) => (
                  <p key={i}>▸ {n}</p>
                ))}
              </div>
            )}
            <button onClick={onDone}>Seguir</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

function Corner({ name, hp, stam, hurt, downs, mirror }) {
  return (
    <div className={mirror ? 'corner mirror' : 'corner'} data-hurt={hurt ? '1' : '0'}>
      <span className="cname">
        {name}
        {downs > 0 && <em className="downs">{downs} caída{downs === 1 ? '' : 's'}</em>}
      </span>
      <div className="bar hp">
        <i style={{ width: `${hp * 100}%` }} />
      </div>
      <div className="bar st">
        <i style={{ width: `${stam * 100}%` }} />
      </div>
    </div>
  )
}

// ── final ─────────────────────────────────────────────────────────────────────
export function End({ s, onRestart }) {
  const g = grade(s)
  const text = summaryText(s)
  const [copied, setCopied] = useState(false)
  const rec = useCountUp(s.record)
  const finishes = s.methods.ko + s.methods.sub
  const bigWins = [...new Set(s.fights.filter((f) => f.result === 'win' && f.real).map((f) => f.opponent))]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="screen end">
      <div className="finalCard">
        <div className="glow" aria-hidden="true" />
        <div className="cardLeft">
          <span className="gradeLabel">{g.title}</span>
          <h1>{s.name}</h1>
          {s.nickname && <div className="fnick">“{s.nickname}”</div>}
          <p className="endSub">
            {[
              COUNTRIES[s.country].name,
              weightOf(s).name,
              STYLES[s.style].name,
              s.stance === 'southpaw' ? 'zurdo' : 'ortodoxo',
              s.gym,
              diffOf(s).name,
            ].join(' · ')}
          </p>
          <div className="bigRecord">
            <b>
              {rec.w}-{rec.l}-{rec.d}
            </b>
            <small>
              récord
              <br />
              profesional
            </small>
          </div>
          <div className="tiles">
            <Tile n={finishes} label="finalizaciones" />
            <Tile n={s.methods.ko} label="KO/TKO" />
            <Tile n={s.methods.sub} label="sumisiones" />
            <Tile n={s.titles} label="títulos y defensas" />
            <Tile n={s.peakRank ? `#${s.peakRank}` : '—'} label="mejor ranking" />
            <Tile n={`US$ ${usd(s.earned)}`} label="ganado" />
          </div>
        </div>

        <div className="cardRight">
          <p className="desc">{g.desc}</p>
          {s.endingText && <p className="desc soft">{s.endingText}</p>}
          <p className="desc soft">{afterlife(s)}</p>
          {bigWins.length > 0 && <p className="desc gold">Le ganó a: {bigWins.join(', ')}</p>}
          <div className="moments">
            {s.log
              .filter((e) => e.kind === 'note')
              .slice(-5)
              .map((e, i) => (
                <p key={i}>▸ {e.text}</p>
              ))}
          </div>
          <span className="grow" />
          <div className="cardFoot">
            <span>semilla {s.seed}</span>
            <span>copero ufc</span>
          </div>
          <div className="endActions">
            <button onClick={copy}>{copied ? '¡Copiado!' : 'Copiar resumen'}</button>
            <button className="ghost" onClick={onRestart}>
              Otra carrera
            </button>
          </div>
        </div>
      </div>

      <pre className="share">{text}</pre>
    </div>
  )
}

// 10 pasos de 55 ms = 550 ms, termina justo cuando aparecen los tiles.
function useCountUp(target) {
  const [v, setV] = useState({ w: 0, l: 0, d: 0 })
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      const k = i / 10
      setV({ w: Math.round(target.w * k), l: Math.round(target.l * k), d: Math.round(target.d * k) })
      if (i >= 10) clearInterval(id)
    }, 55)
    return () => clearInterval(id)
  }, [])
  return v
}

const Tile = ({ n, label }) => (
  <div className="tile">
    <b>{n}</b>
    <span>{label}</span>
  </div>
)
