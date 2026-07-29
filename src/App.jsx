import { useEffect, useRef, useState } from 'react'
import { COUNTRIES, GYMS, STYLES, WEIGHT_CLASSES, STATS, STAT_LABELS, NICKNAMES, gymsOf } from './data.js'
import { newCareer, nextStep, applyOption, eventText, simulateFight, applyFight, grade, summaryText, tierOf, weightOf } from './sim.js'

export default function App() {
  const [career, setCareer] = useState(null)
  const [, force] = useState(0)
  const rerender = () => force((n) => n + 1)

  if (!career) return <Setup onStart={setCareer} />
  if (career.over) return <End s={career} onRestart={() => setCareer(null)} />
  return <Career s={career} rerender={rerender} />
}

// ── setup ─────────────────────────────────────────────────────────────────────
function Setup({ onStart }) {
  const [country, setCountry] = useState('ar')
  const [gym, setGym] = useState(gymsOf('ar')[0])
  const [style, setStyle] = useState('boxeo')
  const [weight, setWeight] = useState('light')
  const [stance, setStance] = useState('orthodox')
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
          age: Number(age),
        },
        s
      )
    )
  }

  return (
    <div className="wrap">
      <header className="hero">
        <h1>
          COPERO <span>UFC</span>
        </h1>
        <p>Del gimnasio de barrio a la jaula más grande del mundo. Elegí quién sos y vamos a ver hasta dónde llegás.</p>
      </header>

      <section className="panel">
        <h2>1. ¿Quién sos?</h2>
        <div className="row">
          <label className="field">
            <span>Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" maxLength={24} />
          </label>
          <label className="field">
            <span>Apodo</span>
            <div className="withBtn">
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="opcional" maxLength={18} />
              <button type="button" onClick={() => setNickname(NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)])}>
                🎲
              </button>
            </div>
          </label>
        </div>
        <div className="row">
          <label className="field">
            <span>Edad de debut: {age}</span>
            <input type="range" min="18" max="26" value={age} onChange={(e) => setAge(e.target.value)} />
          </label>
          <div className="field">
            <span>Postura</span>
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
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>2. ¿De dónde salís?</h2>
        <select value={country} onChange={(e) => changeCountry(e.target.value)}>
          {Object.entries(COUNTRIES).map(([id, c]) => (
            <option key={id} value={id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="cards">
          {gymsOf(country).map((g) => (
            <button key={g} type="button" className={gym === g ? 'card on' : 'card'} onClick={() => setGym(g)}>
              <strong>{g}</strong>
              <em>{'★'.repeat(GYMS[g].tier)}</em>
              <p>{GYMS[g].flavor}</p>
              <small>{Object.entries(GYMS[g].bonus).map(([k, v]) => `+${v} ${STAT_LABELS[k]}`).join(' · ')}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>3. ¿Cómo peleás?</h2>
        <div className="cards">
          {Object.entries(STYLES).map(([id, st]) => (
            <button key={id} type="button" className={style === id ? 'card on' : 'card'} onClick={() => setStyle(id)}>
              <strong>{st.name}</strong>
              <p>{st.desc}</p>
              <small>{STATS.filter((k) => st.stats[k] >= 5).map((k) => `${STAT_LABELS[k]} ${st.stats[k]}`).join(' · ')}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>4. ¿En qué categoría?</h2>
        <div className="pills">
          {WEIGHT_CLASSES.map((w) => (
            <button key={w.id} type="button" className={weight === w.id ? 'pill on' : 'pill'} onClick={() => setWeight(w.id)}>
              {w.name} <small>{w.kg}kg</small>
            </button>
          ))}
        </div>
        <label className="field seed">
          <span>Semilla (opcional — misma semilla, misma carrera)</span>
          <input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="dejalo vacío para una al azar" maxLength={20} />
        </label>
      </section>

      <button className="go" onClick={start}>
        EMPEZAR LA CARRERA
      </button>
    </div>
  )
}

// En el escalón regional la promotora depende del país: le da color a la carrera.
const promoName = (s) => (s.tier === 'regional' ? COUNTRIES[s.country].regional : tierOf(s).name)

const hashSeed = (str) => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return h
}

// ── carrera ───────────────────────────────────────────────────────────────────
export function Career({ s, rerender }) {
  const [step, setStep] = useState(() => nextStep(s))
  const [fight, setFight] = useState(null)
  const bottom = useRef(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [step, fight])

  const advance = () => {
    if (s.over) return rerender()
    setStep(nextStep(s))
    rerender()
  }

  const choose = (i) => {
    applyOption(s, step.event, i)
    setFight(null)
    advance()
  }

  const startFight = () => setFight(simulateFight(s, step.opponent))

  const closeFight = () => {
    applyFight(s, fight, step.opponent)
    setFight(null)
    advance()
  }

  return (
    <div className="wrap career">
      <Hud s={s} />
      <div className="feed">
        {s.log.map((entry, i) => (
          <LogEntry key={i} entry={entry} s={s} />
        ))}

        {!fight && step.kind === 'event' && (
          <div className="beat event">
            <h3>{step.event.title}</h3>
            <p>{eventText(step.event, s)}</p>
            <div className="options">
              {step.event.options.map((o, i) => (
                <button key={i} onClick={() => choose(i)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step.kind === 'fight' && !fight && (
          <div className="beat bout">
            <span className="tier">{promoName(s)}</span>
            <h3>
              {s.name} <em>vs</em> {step.opponent.name}
            </h3>
            <p>
              {weightOf(s).name} · {tierOf(s).rounds} rounds · {step.opponent.real ? 'Rival rankeado de verdad' : STYLES[step.opponent.style].name}
            </p>
            <div className="options">
              <button onClick={startFight}>ENTRAR A LA JAULA</button>
            </div>
          </div>
        )}

        {fight && <FightPanel s={s} fight={fight} opponent={step.opponent} onDone={closeFight} />}
        <div ref={bottom} />
      </div>
    </div>
  )
}

function Hud({ s }) {
  return (
    <div className="hud">
      <div className="hudTop">
        <div>
          <strong>
            {s.name}
            {s.nickname && <em> “{s.nickname}”</em>}
          </strong>
          <small>
            {promoName(s)} · {weightOf(s).name} · {s.gym}
          </small>
        </div>
        <div className="rec">
          <b>
            {s.record.w}-{s.record.l}-{s.record.d}
          </b>
          <small>{Math.floor(s.age)} años</small>
        </div>
      </div>
      <div className="stats">
        {STATS.map((k) => (
          <div key={k} className="stat">
            <span>{STAT_LABELS[k]}</span>
            <i style={{ width: `${s.stats[k] * 10}%` }} />
            <b>{s.stats[k].toFixed(1)}</b>
          </div>
        ))}
        <div className="stat hype">
          <span>Hype</span>
          <i style={{ width: `${s.hype}%` }} />
          <b>{Math.round(s.hype)}</b>
        </div>
      </div>
    </div>
  )
}

function LogEntry({ entry }) {
  if (entry.kind === 'note') return <div className="beat note">{entry.text}</div>
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
    <div className={`beat past result ${f.result}`}>
      <h4>
        {f.result === 'win' ? 'Victoria' : 'Derrota'} vs {entry.opponent}
      </h4>
      <p>
        {f.method} · R{f.endRound} {f.time} · {entry.tier}
      </p>
    </div>
  )
}

// ── pelea round por round ─────────────────────────────────────────────────────
function FightPanel({ s, fight, opponent, onDone }) {
  const [shown, setShown] = useState(0)
  const done = shown >= fight.rounds.length

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 500 : 1600)
    return () => clearTimeout(t)
  }, [shown, done])

  const last = fight.rounds[Math.max(0, shown - 1)]
  const hpA = shown ? last.aHp : 1
  const hpB = shown ? last.bHp : 1
  const stA = shown ? last.aStam : 1
  const stB = shown ? last.bStam : 1

  return (
    <div className="beat fight">
      <div className="corners">
        <Corner name={s.name} hp={hpA} stam={stA} />
        <span className="vs">VS</span>
        <Corner name={opponent.name} hp={hpB} stam={stB} mirror />
      </div>

      <ol className="rounds">
        {fight.rounds.slice(0, shown).map((r) => (
          <li key={r.n}>
            <b>R{r.n}</b>
            <span>{r.text}</span>
          </li>
        ))}
      </ol>

      {!done && (
        <button className="skip" onClick={() => setShown(fight.rounds.length)}>
          saltear ▸▸
        </button>
      )}

      {done && (
        <div className={`verdict ${fight.result}`}>
          <strong>{fight.result === 'win' ? 'GANASTE' : 'PERDISTE'}</strong>
          <span>
            {fight.method} · round {fight.endRound} · {fight.time}
          </span>
          <button onClick={onDone}>Seguir</button>
        </div>
      )}
    </div>
  )
}

function Corner({ name, hp, stam, mirror }) {
  return (
    <div className={mirror ? 'corner mirror' : 'corner'}>
      <span className="cname">{name}</span>
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
  const finishes = s.methods.ko + s.methods.sub
  const bigWins = s.fights.filter((f) => f.result === 'win' && f.real).map((f) => f.opponent)

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
    <div className="wrap end">
      <div className="finalCard">
        <span className="gradeLabel">{g.title}</span>
        <h1>
          {s.name}
          {s.nickname && <em> “{s.nickname}”</em>}
        </h1>
        <p className="sub">
          {COUNTRIES[s.country].name} · {weightOf(s).name} · {STYLES[s.style].name} · {s.stance === 'southpaw' ? 'zurdo' : 'ortodoxo'} · {s.gym}
        </p>

        <div className="bigRecord">
          <b>{s.record.w}</b>-<b>{s.record.l}</b>-<b>{s.record.d}</b>
        </div>

        <div className="tiles">
          <Tile n={finishes} label="finalizaciones" />
          <Tile n={s.methods.ko} label="KO/TKO" />
          <Tile n={s.methods.sub} label="sumisiones" />
          <Tile n={s.titles} label="títulos y defensas" />
        </div>

        <p className="desc">{g.desc}</p>
        {s.endingText && <p className="desc soft">{s.endingText}</p>}
        {bigWins.length > 0 && (
          <p className="desc soft">
            Le ganó a: <b>{[...new Set(bigWins)].join(', ')}</b>
          </p>
        )}

        <div className="moments">
          {s.log
            .filter((e) => e.kind === 'note')
            .slice(-4)
            .map((e, i) => (
              <p key={i}>▸ {e.text}</p>
            ))}
        </div>

        <small className="seed">semilla {s.seed}</small>
      </div>

      <pre className="share">{text}</pre>
      <div className="endActions">
        <button onClick={copy}>{copied ? '¡Copiado!' : 'Copiar resumen'}</button>
        <button className="ghost" onClick={onRestart}>
          Otra carrera
        </button>
      </div>
    </div>
  )
}

const Tile = ({ n, label }) => (
  <div className="tile">
    <b>{n}</b>
    <span>{label}</span>
  </div>
)
