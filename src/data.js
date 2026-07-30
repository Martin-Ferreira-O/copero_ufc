// Todo el contenido del juego vive acá. El motor (sim.js) no sabe de nombres propios.
// Agregar contenido = empujar objetos a estos arrays, sin tocar sim.js.

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Perillas de balance. Un juego no se acierta en el papel: esto se toca a mano después de jugarlo.
export const TUNING = {
  baseDmg: 31, // daño repartido por round en una pelea pareja
  hpBase: 38, // vida = hpBase + chin * hpPerChin
  hpPerChin: 7.0,
  stamDrain: 9, // por round, más penalidad por cardio bajo, escalado por el plan
  stamRecover: 0.16, // gas que recuperás en un round de aguantar
  downThreshold: 0.4, // daño (sobre la vida máxima) que puede tirarte al piso
  hurtThreshold: 0.22, // daño que te deja lastimado para el round siguiente
  subChance: 0.075, // por punto de ventaja de grappling en el suelo
  growthPerFight: 0.22, // mejora base de stats por pelea
  hypeWin: 6,
  hypeFinish: 5, // extra por finalizar
  hypeLoss: -5,
  yearsPerFight: 0.42,
  retireAge: 39,
}

// Se elige en el setup. Toca rival, crecimiento, cuántas derrotas aguanta el contrato y la plata.
export const DIFFICULTIES = {
  normal: {
    name: 'Normal',
    oppLevel: 0.2,
    growth: 1.06,
    cutStreak: 4,
    pay: 1.3,
    desc: 'Rivales un poco peores, mejorás más rápido y te cortan a la cuarta derrota.',
  },
  duro: {
    name: 'Difícil',
    oppLevel: 0.62,
    growth: 0.95,
    cutStreak: 3,
    pay: 1,
    desc: 'El deporte como es: tres derrotas al hilo en UFC y estás afuera.',
  },
  realista: {
    name: 'Realista',
    oppLevel: 1.12,
    growth: 0.82,
    cutStreak: 3,
    pay: 0.8,
    desc: 'Rivales mejores, progreso lento y bolsas más chicas. Casi nadie llega.',
  },
}

// El plan del round. `out` daño que das, `in` daño que comés, `drain` gas,
// `ground` cuánto empujás la pelea al piso. Cada uno es un canje distinto, no un mejor.
//
// Ojo con `out`/`in`: tienen que moverse juntos. Un plan que te hace comer la mitad y pegar
// casi lo mismo es gratis, y entonces no hay decisión. La diferencia real entre presionar y
// boxear es el gas y la varianza, no un descuento de daño.
export const PLANS = {
  presionar: { label: 'Presionar', hint: 'buscás el nocaut, gastás y comés', out: 1.45, in: 1.35, drain: 1.5, ground: -0.02, key: 'striking' },
  boxear: { label: 'Boxear afuera', hint: 'puntos y gas de sobra', out: 0.85, in: 0.8, drain: 0.8, ground: -0.12, key: 'iq' },
  derribar: { label: 'Llevarlo al piso', hint: 'control y sumisión', out: 1.0, in: 0.95, drain: 1.35, ground: 0.32, key: 'grappling' },
  // aguantar regala el round a propósito: sirve para sobrevivir, nunca para ganar.
  aguantar: { label: 'Aguantar el round', hint: 'regalás el round, recuperás gas', out: 0.3, in: 0.55, drain: 0.35, ground: -0.04, key: 'chin', survive: true },
}

export const PLAN_IDS = Object.keys(PLANS)

// El relato del round cambia según lo que pediste desde la esquina.
export const ROUND_TEXT = {
  even: [
    'Round parejo, mucho estudio y poco intercambio.',
    'Los dos tirando al mismo tiempo, nadie da un paso atrás.',
    'Round de esgrima: jab contra jab, se define por detalles.',
    'Cuatro minutos de amagues y un intercambio de diez segundos que no alcanza para nada.',
  ],
  presionar: {
    win: [
      'Lo caminaste todo el round. Terminó con la espalda en el alambrado y la boca abierta.',
      'Lo lastimaste con un cross que le dobló las piernas y lo perseguiste hasta la campana.',
      'Le rompiste la nariz con un codo en el clinch. Sangre por todos lados.',
    ],
    lose: [
      'Fuiste para adelante de cabeza y te encontró saliendo. Viste luces.',
      'Te esperó y te contó cada entrada. Tres veces te comió el uppercut igual.',
      'Presionaste sin cabeza y terminaste el round respirando por la boca.',
    ],
  },
  boxear: {
    win: [
      'Jab, salir, jab. No te encontró una sola vez limpia y te llevaste el round claro.',
      'Lo hiciste fallar todo el round y le pegaste en cada salida. Clase de distancia.',
      'Low kicks todo el round: ya no apoya bien la pierna de adelante.',
    ],
    lose: [
      'Te cortó la distancia y te metió contra la reja. Ahí tu plan se terminó.',
      'Boxeaste para atrás y los jueces vieron a otro tipo yendo para adelante.',
      'Te castigó a las costillas cada vez que retrocedías. Cada respiración duele.',
    ],
  },
  derribar: {
    win: [
      'Amagaste el derribo toda la noche y le pegaste arriba cuando ya no sabía qué esperar.',
      'No entró el doble pierna, pero lo tuviste pegado al alambrado sin poder tirar.',
      'Clinch, rodillas al cuerpo y volver a empujar. Round feo y tuyo.',
    ],
    lose: [
      'Tiraste tres derribos y en los tres te agarró la cabeza y te castigó.',
      'Se defendió el derribo y te dejó agotado y de rodillas comiendo golpes.',
      'Un solo intento mal calculado y te encontró con la rodilla en la cara.',
    ],
  },
  aguantar: {
    win: [
      'Cerraste la guardia, respiraste y de milagro terminaste ganando el round con dos manos.',
      'Aguantaste el chubasco y para el final del round el otro era el que estaba muerto.',
      'Te agarraste del clinch hasta recuperar. Nadie hizo nada, pero llegaste entero.',
    ],
    lose: [
      'Round de supervivencia: cubrirte, girar, aguantar. Lo perdés 10-9 y no importa.',
      'No tiraste una mano. Regalaste el round y salvaste la pelea.',
      'Te comiste todo con los brazos y llegaste a la campana. Es lo único que buscabas.',
    ],
  },
  ground: {
    mine: [
      'Lo derribaste temprano y le pasaste la guardia. Codos desde arriba todo el round.',
      'Doble pierna contra el alambrado y control absoluto: le sacaste la espalda dos veces.',
      'Lo tuviste montado casi cuatro minutos. El rival solo se cubría.',
    ],
    his: [
      'Te llevó al piso en el primer minuto y no te dejó levantar.',
      'Te comió con el wrestling: control, codos y cero espacio.',
      'Te tuvo de espaldas contra la reja aguantando el peso todo el round.',
    ],
  },
  down: {
    mine: [
      '¡Lo tiraste! Se levantó con las piernas de goma y salvado por la campana.',
      'Lo sentaste con un uppercut corto. Aguantó, pero de acá no vuelve igual.',
      'Cayó de rodillas y el referí casi para. Se levantó porque es duro, nada más.',
    ],
    his: [
      'Te durmió de pie por medio segundo. Te levantaste sin saber dónde estabas.',
      'Te sentó con un cross. Aguantaste el resto del round de puro mentón.',
      'Caíste, te cubriste y llegaste a la campana. No sabés cómo.',
    ],
  },
  finish: {
    mine: [
      'Se derrumbó. No se levantó.',
      'Lo apagaste. El referí lo tuvo que sacar de encima tuyo.',
      'Cayó de espaldas y el estadio hizo ese ruido que no se olvida.',
    ],
    his: [
      'Se te apagó la luz. No hubo vuelta.',
      'Te encontró limpio y te despertaste con el médico encima.',
      'Cayó todo: las piernas, los brazos y la pelea. No te acordás del final.',
    ],
  },
}

export const STATS = ['striking', 'grappling', 'cardio', 'chin', 'iq']

export const STAT_LABELS = {
  striking: 'Striking',
  grappling: 'Grappling',
  cardio: 'Cardio',
  chin: 'Mentón',
  iq: 'Fight IQ',
}

// Todos suman 23: ningún estilo arranca roto, cada uno gana de otra manera.
export const STYLES = {
  boxeo: {
    name: 'Boxeo',
    stats: { striking: 7, grappling: 2, cardio: 5, chin: 5, iq: 4 },
    desc: 'Manos pesadas y cintura. Si te llevan al piso, rezá.',
  },
  muaythai: {
    name: 'Muay Thai',
    stats: { striking: 7, grappling: 3, cardio: 5, chin: 5, iq: 3 },
    desc: 'Codos, rodillas y clinch. Aguantás lo que le tirés.',
  },
  kickboxing: {
    name: 'Kickboxing',
    stats: { striking: 7, grappling: 2, cardio: 6, chin: 4, iq: 4 },
    desc: 'Volumen y distancia. Ritmo alto los cinco rounds.',
  },
  bjj: {
    name: 'Jiu-Jitsu',
    stats: { striking: 3, grappling: 8, cardio: 4, chin: 4, iq: 4 },
    desc: 'Si la pelea toca la lona, la pelea es tuya.',
  },
  judo: {
    name: 'Judo',
    stats: { striking: 3, grappling: 7, cardio: 5, chin: 5, iq: 3 },
    desc: 'Proyecciones que terminan peleas y un cuello de toro.',
  },
  wrestling: {
    name: 'Wrestling',
    stats: { striking: 3, grappling: 8, cardio: 6, chin: 4, iq: 2 },
    desc: 'Derribás, controlás, ganás. Aburrido y efectivo.',
  },
  sambo: {
    name: 'Sambo',
    stats: { striking: 4, grappling: 7, cardio: 5, chin: 4, iq: 3 },
    desc: 'Lo mejor del judo y del wrestling, con llaves a la pierna.',
  },
  karate: {
    name: 'Karate',
    stats: { striking: 6, grappling: 2, cardio: 5, chin: 4, iq: 6 },
    desc: 'Entrás y salís de rango. Lectura por encima del promedio.',
  },
}

// tier 1-5: define bonus, calidad de sparring (ritmo de mejora) y cuánto te abre puertas.
export const GYMS = {
  'Torres Gym': { country: 'ar', tier: 2, bonus: { striking: 1, chin: 1 }, flavor: 'Bolsas remendadas con cinta y un frío de morirse en invierno.' },
  'La Fábrica MMA': { country: 'ar', tier: 1, bonus: { chin: 2 }, flavor: 'Un galpón en Lanús. Se entrena arriba de una lona que fue de otro club.' },
  'Kaizen MMA': { country: 'ar', tier: 2, bonus: { grappling: 1, iq: 1 }, flavor: 'Mucho gi, poco cardio, café después del entrenamiento.' },
  AKA: { country: 'us', tier: 5, bonus: { cardio: 2, grappling: 1 }, flavor: 'San José. Te matan en el sparring del martes y te reconstruyen el jueves.' },
  'American Top Team': { country: 'us', tier: 5, bonus: { striking: 1, grappling: 2 }, flavor: 'Coconut Creek. Doscientos peleadores y un solo tatami libre.' },
  'Kill Cliff FC': { country: 'us', tier: 4, bonus: { grappling: 2, iq: 1 }, flavor: 'Grappling de laboratorio y un patrocinador que te llena la heladera.' },
  'Jackson Wink': { country: 'us', tier: 4, bonus: { iq: 2, striking: 1 }, flavor: 'Albuquerque, mil metros de altura. Te arman un plan por rival.' },
  'Team Alpha Male': { country: 'us', tier: 4, bonus: { grappling: 1, cardio: 2 }, flavor: 'Sacramento. Wrestling hasta que no sentís las piernas.' },
  'Xtreme Couture': { country: 'us', tier: 3, bonus: { chin: 1, cardio: 1, striking: 1 }, flavor: 'Las Vegas. Guerra en el sparring y buffet a dos cuadras.' },
  'Nova União': { country: 'br', tier: 4, bonus: { grappling: 2, cardio: 1 }, flavor: 'Río. El calor te saca dos kilos antes de empezar.' },
  'Chute Boxe': { country: 'br', tier: 4, bonus: { striking: 2, chin: 1 }, flavor: 'Curitiba. Escuela de gente que camina para adelante.' },
  'Astra Fight Team': { country: 'br', tier: 3, bonus: { striking: 1, grappling: 1, iq: 1 }, flavor: 'São Paulo. Fábrica de prospectos que llegan a Contender Series.' },
  'SBG Ireland': { country: 'ie', tier: 4, bonus: { striking: 1, iq: 2 }, flavor: 'Dublín. Movimiento, timing y una conferencia de prensa que se te va de las manos.' },
  'Team Kaobon': { country: 'gb', tier: 3, bonus: { cardio: 1, grappling: 1, chin: 1 }, flavor: 'Liverpool. Nadie te va a felicitar por nada, nunca.' },
  'Eagles MMA': { country: 'ru', tier: 5, bonus: { grappling: 2, cardio: 1 }, flavor: 'Daguestán. Trote en la montaña antes de que salga el sol.' },
  'Akhmat MMA': { country: 'ru', tier: 4, bonus: { striking: 1, chin: 2 }, flavor: 'Grozni. Presupuesto infinito y expectativas peores.' },
  'Entram Gym': { country: 'mx', tier: 3, bonus: { striking: 2, cardio: 1 }, flavor: 'Tijuana. Boxeo de verdad metido adentro del MMA.' },
  'Lobo Gym': { country: 'mx', tier: 2, bonus: { striking: 1, chin: 1 }, flavor: 'Guadalajara. La mitad del gimnasio pelea los sábados en un salón de fiestas.' },
  'Tiger Muay Thai': { country: 'th', tier: 3, bonus: { striking: 2, cardio: 1 }, flavor: 'Phuket. Dos sesiones por día y turistas filmándote.' },
  'Tristar Gym': { country: 'ca', tier: 4, bonus: { iq: 2, grappling: 1 }, flavor: 'Montreal. Todo se resuelve con una pizarra y un jab.' },
  'City Kickboxing': { country: 'nz', tier: 4, bonus: { striking: 2, iq: 1 }, flavor: 'Auckland. Striking limpio y cero solemnidad.' },
  'Allstars Training Center': { country: 'se', tier: 3, bonus: { cardio: 2, grappling: 1 }, flavor: 'Estocolmo. Frío, orden y mucho wrestling.' },
}

export const COUNTRIES = {
  ar: { name: 'Argentina', regional: 'Samurai Fight House' },
  us: { name: 'Estados Unidos', regional: 'LFA' },
  br: { name: 'Brasil', regional: 'Jungle Fight' },
  mx: { name: 'México', regional: 'Combate Global' },
  ie: { name: 'Irlanda', regional: 'Cage Warriors' },
  gb: { name: 'Reino Unido', regional: 'Cage Warriors' },
  ru: { name: 'Rusia', regional: 'Fight Nights Global' },
  th: { name: 'Tailandia', regional: 'ONE Championship' },
  ca: { name: 'Canadá', regional: 'TKO MMA' },
  nz: { name: 'Nueva Zelanda', regional: 'Eternal MMA' },
  se: { name: 'Suecia', regional: 'Superior Challenge' },
}

export const gymsOf = (country) => Object.keys(GYMS).filter((g) => GYMS[g].country === country)

export const WEIGHT_CLASSES = [
  { id: 'fly', name: 'Peso Mosca', kg: 57, koPower: 0.78 },
  { id: 'bantam', name: 'Peso Gallo', kg: 61, koPower: 0.86 },
  { id: 'feather', name: 'Peso Pluma', kg: 66, koPower: 0.93 },
  { id: 'light', name: 'Peso Ligero', kg: 70, koPower: 1.0 },
  { id: 'welter', name: 'Peso Wélter', kg: 77, koPower: 1.07 },
  { id: 'middle', name: 'Peso Medio', kg: 84, koPower: 1.14 },
  { id: 'lhw', name: 'Peso Semipesado', kg: 93, koPower: 1.22 },
  { id: 'heavy', name: 'Peso Pesado', kg: 120, koPower: 1.35 },
]

// Los escalones. `need` = victorias necesarias en el escalón para que te miren de arriba.
// En `ranked` el gate no es `need` sino el número de ranking: se abre en el #2.
export const LADDER = [
  { id: 'amateur', name: 'Amateur', fights: 3, need: 3, hype: 0, rounds: 3, pay: 0, oppLevel: 4.7 },
  { id: 'regional', name: 'Regional', fights: 4, need: 4, hype: 16, rounds: 3, pay: 1200, oppLevel: 5.9 },
  { id: 'dwcs', name: "Dana White's Contender Series", fights: 1, need: 1, hype: 32, rounds: 3, pay: 5000, oppLevel: 6.4 },
  { id: 'prelim', name: 'UFC — preliminares', fights: 3, need: 3, hype: 44, rounds: 3, pay: 12000, oppLevel: 6.9 },
  { id: 'maincard', name: 'UFC — main card', fights: 3, need: 3, hype: 60, rounds: 3, pay: 40000, oppLevel: 7.4 },
  { id: 'ranked', name: 'UFC — top 15', fights: 4, need: 4, hype: 76, rounds: 3, pay: 120000, oppLevel: 8.3 },
  { id: 'title', name: 'UFC — pelea de título', fights: 1, need: 1, hype: 88, rounds: 5, pay: 500000, oppLevel: 8.9 },
  { id: 'champ', name: 'UFC — campeón', fights: 99, need: 99, hype: 100, rounds: 5, pay: 900000, oppLevel: 8.7 },
]

export const isUFC = (tierId) => ['prelim', 'maincard', 'ranked', 'title', 'champ'].includes(tierId)

// Rivales de verdad para los escalones altos: se mapean a los ranks 1-6, así el #1 es el campeón.
// Borrar nombres = editar un array.
export const REAL_OPPONENTS = {
  fly: ['Alexandre Pantoja', 'Brandon Royval', 'Kai Kara-France', 'Brandon Moreno', 'Steve Erceg', 'Amir Albazi'],
  bantam: ['Merab Dvalishvili', "Sean O'Malley", 'Petr Yan', 'Cory Sandhagen', 'Umar Nurmagomedov', 'Marlon Vera'],
  feather: ['Ilia Topuria', 'Alexander Volkanovski', 'Max Holloway', 'Movsar Evloev', 'Diego Lopes', 'Brian Ortega'],
  light: ['Islam Makhachev', 'Arman Tsarukyan', 'Justin Gaethje', 'Charles Oliveira', 'Dustin Poirier', 'Mateusz Gamrot'],
  welter: ['Belal Muhammad', 'Shavkat Rakhmonov', 'Leon Edwards', 'Jack Della Maddalena', 'Sean Brady', 'Ian Garry'],
  middle: ['Dricus du Plessis', 'Israel Adesanya', 'Sean Strickland', 'Khamzat Chimaev', 'Robert Whittaker', 'Nassourdine Imavov'],
  lhw: ['Alex Pereira', 'Magomed Ankalaev', 'Jamahal Hill', 'Jiří Procházka', 'Jan Błachowicz', 'Carlos Ulberg'],
  heavy: ['Jon Jones', 'Tom Aspinall', 'Ciryl Gane', 'Sergei Pavlovich', 'Curtis Blaydes', 'Alexander Volkov'],
}

const FIRST = ['Marco', 'Diego', 'Lucas', 'Rafael', 'Tyrone', 'Kevin', 'Aslan', 'João', 'Nikita', 'Bruno', 'Dylan', 'Emiliano', 'Andrei', 'Ryan', 'Fabio', 'Cristian', 'Hamza', 'Josh', 'Marlon', 'Vitor']
const LAST = ['Souza', 'Petrov', 'Villalba', 'O’Connor', 'Kowalski', 'Da Silva', 'Nguyen', 'Ferreyra', 'Mbeki', 'Johnson', 'Karimov', 'Rossi', 'Ibáñez', 'Thompson', 'Okafor', 'Medina', 'Larsen', 'Aliyev', 'Prado', 'Bennett']
const MONIKERS = ['El Toro', 'The Hammer', 'La Bestia', 'Pitbull', 'El Cirujano', 'Silent Assassin', 'El Bombardero', 'The Wolf', 'Cuchillo', 'The Machine']

export const NICKNAMES = ['El Fenómeno', 'La Máquina', 'Mano de Piedra', 'El Cachorro', 'Pitbull', 'El Cirujano', 'La Hiena', 'El Pibe', 'Huracán', 'El Verdugo', 'Nitro', 'El Bicho']

export const randomOpponentName = (rng) => {
  const first = FIRST[Math.floor(rng() * FIRST.length)]
  const last = LAST[Math.floor(rng() * LAST.length)]
  const nick = rng() < 0.35 ? ` "${MONIKERS[Math.floor(rng() * MONIKERS.length)]}"` : ''
  return `${first}${nick} ${last}`
}

// ── helpers de eventos ────────────────────────────────────────────────────────
const bump = (s, k, n) => {
  s.stats[k] = clamp(s.stats[k] + n, 1, 10)
}
const hype = (s, n) => {
  s.hype = clamp(s.hype + n, 0, 100)
}
const cash = (s, n) => {
  s.money = Math.max(0, s.money + n)
  if (n > 0) s.earned += n
}
const age = (s, years) => {
  s.age += years
}
// Una lesión descuenta un stat durante N peleas y después expira. La UI la muestra siempre.
const injure = (s, label, stat, amount, fights) => {
  s.injuries.push({ label, stat, amount, fights })
}
const heal = (s) => s.injuries.shift()
const moveUp = (s) => {
  const i = WEIGHT_CLASSES.findIndex((w) => w.id === s.weight)
  if (i < WEIGHT_CLASSES.length - 1) s.weight = WEIGHT_CLASSES[i + 1].id
  return WEIGHT_CLASSES.find((w) => w.id === s.weight).name
}
const moveDown = (s) => {
  const i = WEIGHT_CLASSES.findIndex((w) => w.id === s.weight)
  if (i > 0) s.weight = WEIGHT_CLASSES[i - 1].id
  return WEIGHT_CLASSES.find((w) => w.id === s.weight).name
}

// ── eventos ───────────────────────────────────────────────────────────────────
// { id, slot, weight, every?, when(s), title, text, options:[{ label, fx, can?(s), apply(s, rng) -> texto }] }
//
// `slot: 'week'` = semana de pelea. Lo que decidís ahí lo consume LA PELEA QUE SIGUE, así la
// causa y el efecto quedan pegados. `slot: 'camp'` (default) = entre peleas, mueve stats y vida.
// `fx` es el efecto real en un string corto: se muestra en el botón ANTES de elegir.
// `every: N` = el evento vuelve al bolillero N peleas después. Sin `every`, es de una sola vez.
export const EVENTS = [
  // ── semana de pelea ─────────────────────────────────────────────────────────
  {
    id: 'corte-peso',
    slot: 'week',
    weight: 3,
    every: 5,
    when: (s) => s.record.w + s.record.l >= 2,
    title: 'La balanza',
    text: 'Faltan 30 horas y te sobran cuatro kilos. El nutricionista te mira y no dice nada, que es peor.',
    options: [
      {
        label: 'Bajar como sea: sauna y pileta',
        fx: 'entrás vacío a la pelea',
        apply: (s) => {
          s.flags.badCut = true
          return s.flags.nutri
            ? 'Diste el peso sufriendo, pero el nutricionista te sacó del pozo a tiempo. Llegás bien.'
            : 'Diste el peso por 100 gramos y te fuiste caminando como un abuelo. Vas a pelear vacío.'
        },
      },
      {
        label: 'No dar el peso y bancar la multa',
        fx: '−3k · −8 hype',
        apply: (s) => {
          cash(s, -3000)
          hype(s, -8)
          return 'Subiste 1.2 kilos arriba. Perdés el 20% de la bolsa y el rival te odia con razón.'
        },
      },
      {
        label: 'Subir de categoría de una vez',
        fx: '+0.6 Cardio · categoría arriba',
        apply: (s) => {
          const name = moveUp(s)
          bump(s, 'cardio', 0.6)
          return `Se terminó el circo de la balanza: te mudás a ${name}. Vas a estar más chico, pero entero.`
        },
      },
    ],
  },
  {
    id: 'aviso-corto',
    slot: 'week',
    weight: 3,
    every: 6,
    when: (s) => isUFC(s.tier) || s.tier === 'regional',
    title: 'Diez días de aviso',
    text: 'Se cayó una pelea y te ofrecen el lugar contra alguien bastante mejor rankeado. Estás a seis kilos del límite y sin campamento.',
    options: [
      {
        label: 'Firmar sin leer',
        fx: '+12 hype · rival mucho mejor, sin campamento',
        apply: (s) => {
          s.flags.shortNotice = true
          hype(s, 12)
          return 'La gente ya te quiere solo por aceptar. Ahora hay que entrar a la jaula sin haber dormido tres días.'
        },
      },
      {
        label: 'Pasar y esperar el campamento completo',
        fx: '−4 hype · +0.4 Fight IQ',
        apply: (s) => {
          hype(s, -4)
          bump(s, 'iq', 0.4)
          return 'El matchmaker anota. La próxima oferta va a tardar un poquito más en llegar.'
        },
      },
    ],
  },
  {
    id: 'plan-de-pelea',
    slot: 'week',
    weight: 4,
    every: 3,
    when: () => true,
    title: 'La pizarra',
    text: 'Última semana. El equipo miró horas de video del rival y hay tiempo para afilar una sola cosa.',
    options: [
      {
        label: 'Manos: entrar y salir mil veces',
        fx: '+0.6 Striking sólo en esta pelea',
        apply: (s) => {
          s.flags.prep = 'striking'
          return 'Mil rounds de guanteo con el mismo movimiento. Entrás con las manos calientes.'
        },
      },
      {
        label: 'Piso: derribos y defensa de derribo',
        fx: '+0.6 Grappling sólo en esta pelea',
        apply: (s) => {
          s.flags.prep = 'grappling'
          return 'Toda la semana levantando gente y peleando desde abajo. Estás listo para el piso.'
        },
      },
      {
        label: 'Motor: que no te falte el aire',
        fx: '+0.6 Cardio sólo en esta pelea',
        apply: (s) => {
          s.flags.prep = 'cardio'
          return 'Rounds de más, bici y cuerda. Vas a ser el que respira en el tercero.'
        },
      },
    ],
  },
  {
    id: 'conferencia',
    slot: 'week',
    weight: 3,
    every: 5,
    when: (s) => isUFC(s.tier),
    title: 'Conferencia de prensa',
    text: 'El rival dice tu apellido mal a propósito y se ríe con su equipo.',
    options: [
      {
        label: 'Devolvérsela con todo',
        fx: '+10 hype',
        apply: (s) => {
          hype(s, 10)
          return 'Se armó. Le pusieron main event a la pelea solo por lo que se dijeron.'
        },
      },
      {
        label: 'Sonreír y no decir nada',
        fx: '+0.5 Fight IQ · −2 hype',
        apply: (s) => {
          bump(s, 'iq', 0.5)
          hype(s, -2)
          return 'Ni una palabra. En el pesaje lo mirás fijo y se le nota la incomodidad.'
        },
      },
    ],
  },
  {
    id: 'pesaje-cara-a-cara',
    slot: 'week',
    weight: 3,
    every: 4,
    when: (s) => isUFC(s.tier) || s.tier === 'dwcs',
    title: 'Cara a cara',
    text: 'En el pesaje el rival te apoya la frente en la frente y no se mueve.',
    options: [
      {
        label: 'Empujarlo',
        fx: '+6 hype · −2k de multa',
        apply: (s) => {
          hype(s, 6)
          cash(s, -2000)
          return 'Se armó el tumulto, te multaron y la venta de la pelea se disparó.'
        },
      },
      {
        label: 'Aguantar la mirada sin moverte',
        fx: '+0.4 Fight IQ · +3 hype',
        apply: (s) => {
          bump(s, 'iq', 0.4)
          hype(s, 3)
          return 'No parpadeaste. La foto quedó para siempre.'
        },
      },
    ],
  },
  {
    id: 'rival-lesionado',
    slot: 'week',
    weight: 2,
    every: 7,
    when: (s) => isUFC(s.tier),
    title: 'Se cayó tu rival',
    text: 'A tres semanas de la pelea, el rival se lesiona. Te ofrecen un reemplazo peor rankeado.',
    options: [
      {
        label: 'Aceptar al reemplazo',
        fx: 'rival mucho peor · −3 hype',
        apply: (s) => {
          s.flags.easyOpp = true
          hype(s, -3)
          return 'Peleás igual. Ganes como ganes, te van a decir que le ganaste a un don nadie.'
        },
      },
      {
        label: 'Esperar al original',
        fx: '5 meses de espera · +0.4 Fight IQ · +2 hype',
        apply: (s) => {
          age(s, 0.4)
          bump(s, 'iq', 0.4)
          hype(s, 2)
          return 'Seis meses más de espera para pelear contra el que valía la pena.'
        },
      },
    ],
  },
  {
    id: 'revancha',
    slot: 'week',
    weight: 5,
    every: 4,
    when: (s) => s.rivals.some((r) => r.beatMe),
    title: 'La revancha',
    text: (s) => {
      const r = s.rivals.filter((x) => x.beatMe).slice(-1)[0]
      return `${r.name} te ganó y no se calló nunca más. Ahora la promotora quiere hacer la segunda y te preguntan a vos.`
    },
    options: [
      {
        label: 'Firmar la revancha',
        fx: '+8 hype · rival más difícil que la primera vez',
        apply: (s) => {
          const r = s.rivals.filter((x) => x.beatMe).slice(-1)[0]
          s.nextOpponent = r
          hype(s, 8)
          return `Se firmó. ${r.name} otra vez, y esta vez los dos saben todo del otro.`
        },
      },
      {
        label: 'No mirar atrás',
        fx: '+0.5 Fight IQ · −3 hype',
        apply: (s) => {
          bump(s, 'iq', 0.5)
          hype(s, -3)
          return 'Dijiste que no vivís del pasado. Por dentro sabés que te vas a acordar igual.'
        },
      },
    ],
  },
  {
    id: 'medico-precombate',
    slot: 'week',
    weight: 4,
    every: 2,
    when: (s) => s.injuries.length > 0,
    title: 'El médico de la comisión',
    text: (s) => `Revisión previa. Te aprietan donde duele y preguntan por ${s.injuries[0].label.toLowerCase()}. Podés decir la verdad o no.`,
    options: [
      {
        label: 'Decir que estás perfecto y pelear',
        fx: 'peleás lesionado · +4 hype',
        apply: (s) => {
          hype(s, 4)
          return 'Firmaste el papel mintiendo. Entrás roto y nadie más que vos lo sabe.'
        },
      },
      {
        label: 'Bajarte de la pelea y curarte',
        fx: 'curás la lesión · 4 meses · −10 hype',
        apply: (s) => {
          const inj = heal(s)
          age(s, 0.35)
          hype(s, -10)
          return `Te bajaste. ${inj.label} curada de verdad, pero perdiste el lugar en la cartelera y el sueldo.`
        },
      },
    ],
  },
  {
    id: 'rival-no-da-peso',
    slot: 'week',
    weight: 2,
    every: 8,
    when: (s) => isUFC(s.tier) || s.tier === 'regional',
    title: 'El rival no dio el peso',
    text: 'Subió dos kilos arriba del límite. Te ofrecen el 30% de su bolsa si aceptás pelear igual.',
    options: [
      {
        label: 'Aceptar la plata y pelear',
        fx: '+9k · rival más grande y con fuerza',
        apply: (s) => {
          cash(s, 9000)
          s.flags.shortNotice = true
          return 'Cobraste su multa. Ahora tenés adelante a un tipo de otra categoría que no sufrió el corte.'
        },
      },
      {
        label: 'Cancelar la pelea',
        fx: '−6 hype · 3 meses',
        apply: (s) => {
          hype(s, -6)
          age(s, 0.25)
          return 'Te negaste. Hiciste lo correcto y en internet igual te dijeron cagón.'
        },
      },
    ],
  },
  {
    id: 'lesion-campamento',
    slot: 'week',
    weight: 3,
    every: 6,
    when: (s) => s.record.w + s.record.l >= 3,
    title: 'A dos semanas',
    text: 'Última semana dura de sparring y algo hizo un ruido que no tenía que hacer. Camina, pero no del todo bien.',
    options: [
      {
        label: 'Callarse y pelear',
        fx: '−1.0 Cardio por 2 peleas',
        apply: (s) => {
          injure(s, 'Costilla fisurada', 'cardio', 1.0, 2)
          return 'Nadie se enteró. Cada vez que respires fuerte te vas a acordar de esta decisión.'
        },
      },
      {
        label: 'Avisar y pedir tres semanas más',
        fx: '3 meses · +0.3 Fight IQ · −4 hype',
        apply: (s) => {
          age(s, 0.25)
          bump(s, 'iq', 0.3)
          hype(s, -4)
          return 'Corrieron la pelea. Llegás entero y con el plan mejor armado.'
        },
      },
    ],
  },
  {
    id: 'main-event',
    slot: 'week',
    weight: 3,
    every: 7,
    when: (s) => isUFC(s.tier) && s.hype > 45,
    title: 'Se cayó el main event',
    text: 'La pelea principal se cae a nueve días del evento y quieren poner la tuya arriba. Cinco rounds en vez de tres.',
    options: [
      {
        label: 'Aceptar el main event',
        fx: '+14 hype · +1 escalón de rival · más rounds',
        apply: (s) => {
          hype(s, 14)
          s.flags.shortNotice = true
          return 'Tu nombre arriba del cartel por primera vez. También cinco rounds que no entrenaste.'
        },
      },
      {
        label: 'Quedarte donde estabas',
        fx: '+0.4 Cardio · sin cambios',
        apply: (s) => {
          bump(s, 'cardio', 0.4)
          return 'Preferiste no cambiar nada a nueve días. Aburrido y probablemente correcto.'
        },
      },
    ],
  },
  {
    id: 'apuesta',
    slot: 'week',
    weight: 1,
    every: 9,
    when: (s) => isUFC(s.tier),
    title: 'Una propuesta rara',
    text: 'Un tipo que nadie sabe quién es te ofrece plata por "hacer el segundo round parejo".',
    options: [
      {
        label: 'Mandarlo a la mierda y denunciarlo',
        fx: '+5 hype · +0.3 Fight IQ',
        apply: (s) => {
          hype(s, 5)
          bump(s, 'iq', 0.3)
          return 'Lo denunciaste. La comisión te lo agradece; el tipo desapareció.'
        },
      },
      {
        label: 'Escuchar la cifra',
        fx: '+40k · ⚠ 30% suspensión de un año',
        apply: (s, rng) => {
          cash(s, 40000)
          if (rng() < 0.3) {
            s.flags.suspended = true
            hype(s, -30)
            age(s, 1)
            return 'Investigación de apuestas. Un año suspendido y tu nombre asociado a eso para siempre.'
          }
          return 'Cobraste y nadie se enteró. Dormís mal, pero cobraste.'
        },
      },
    ],
  },

  // ── entre peleas ────────────────────────────────────────────────────────────
  {
    id: 'presupuesto',
    weight: 5,
    every: 3,
    when: (s) => s.money >= 8000,
    title: 'La plata del campamento',
    text: (s) => `Tenés US$ ${s.money.toLocaleString('es-AR')} en la cuenta. Un campamento serio se compra, no se reza.`,
    options: [
      {
        label: 'Sparring de elite (15k)',
        fx: '−15k · +0.5 Striking · +0.5 Grappling',
        can: (s) => s.money >= 15000,
        apply: (s) => {
          cash(s, -15000)
          bump(s, 'striking', 0.5)
          bump(s, 'grappling', 0.5)
          return 'Trajiste tres compañeros de otro país sólo para que te peguen. La mejor plata que gastaste.'
        },
      },
      {
        label: 'Nutricionista de verdad (8k)',
        fx: '−8k · el corte de peso no te afecta por 5 peleas',
        can: (s) => s.money >= 8000,
        apply: (s) => {
          cash(s, -8000)
          s.flags.nutri = 5
          bump(s, 'cardio', 0.3)
          return 'Balanza, pesos y comida medida al gramo. Se terminó llegar al pesaje arrastrándose.'
        },
      },
      {
        label: 'Preparador físico (10k)',
        fx: '−10k · +0.9 Cardio',
        can: (s) => s.money >= 10000,
        apply: (s) => {
          cash(s, -10000)
          bump(s, 'cardio', 0.9)
          return 'Un tipo con planilla que te mide todo. Cinco rounds ya no son un problema.'
        },
      },
      {
        label: 'Cirugía y rehabilitación en serio (25k)',
        fx: '−25k · curás una lesión · 5 meses',
        can: (s) => s.money >= 25000 && s.injuries.length > 0,
        apply: (s) => {
          cash(s, -25000)
          const inj = heal(s)
          age(s, 0.4)
          return `${inj.label}: operada por el mejor y rehabilitada como corresponde. Volvés entero.`
        },
      },
      {
        label: 'No gastar nada',
        fx: 'te queda la plata',
        apply: () => 'Guardaste todo. Nadie sabe cuánto va a durar esto.',
      },
    ],
  },
  {
    id: 'tapar-el-agujero',
    weight: 4,
    every: 4,
    when: (s) => s.last && s.last.result === 'loss',
    title: 'Dónde te ganaron',
    text: (s) =>
      s.last.methodKey === 'subAgainst' || s.last.methodKey === 'koAgainst'
        ? `${s.last.opponent} te encontró el agujero y todo el mundo lo vio. Ya sabés exactamente qué hay que arreglar.`
        : `Viste la pelea con ${s.last.opponent} tres veces. El problema no se esconde: está ahí.`,
    options: [
      {
        label: 'Seis meses debajo de luchadores',
        fx: '+1.4 Grappling · 4 meses',
        apply: (s) => {
          bump(s, 'grappling', 1.4)
          age(s, 0.35)
          return 'Medio año en el tatami peleando desde abajo. Ahora te levantás de cualquier lado.'
        },
      },
      {
        label: 'Seis meses en un gimnasio de boxeo',
        fx: '+1.4 Striking · 4 meses',
        apply: (s) => {
          bump(s, 'striking', 1.4)
          age(s, 0.35)
          return 'Mil rounds con boxeadores de verdad. Las manos salen antes de que las pienses.'
        },
      },
      {
        label: 'Seis meses arreglando la cabeza y la lectura',
        fx: '+1.2 Fight IQ · 4 meses',
        apply: (s) => {
          bump(s, 'iq', 1.2)
          age(s, 0.35)
          return 'Video, pizarra y preguntas incómodas. Entendés por qué perdiste y no te va a volver a pasar igual.'
        },
      },
    ],
  },
  {
    id: 'oferta-gym-grande',
    weight: 3,
    every: 12,
    when: (s) => GYMS[s.gym].tier <= 3 && s.hype > 20,
    title: 'Te llaman de arriba',
    text: 'Un gimnasio de primer nivel te ofrece lugar en el equipo. Sparring de otro planeta, pero es cruzar el mundo y pagarlo vos.',
    options: [
      {
        label: 'Hacer las valijas',
        fx: '−8k · +6 hype · mejor sparring para siempre',
        apply: (s, rng) => {
          const big = Object.keys(GYMS).filter((g) => GYMS[g].tier >= 4)
          const pick = big[Math.floor(rng() * big.length)]
          s.gym = pick
          cash(s, -8000)
          hype(s, 6)
          for (const [k, v] of Object.entries(GYMS[pick].bonus)) bump(s, k, v * 0.5)
          return `Te mudaste a ${pick}. La primera semana de sparring te comieron vivo; la cuarta ya devolvías.`
        },
      },
      {
        label: 'Quedarte con los tuyos',
        fx: '+4 hype · +0.4 Mentón',
        apply: (s) => {
          hype(s, 4)
          bump(s, 'chin', 0.4)
          return 'Te quedaste. En el barrio te aplauden y el entrenador de toda la vida no te lo va a decir nunca, pero se le llenaron los ojos.'
        },
      },
    ],
  },
  {
    id: 'rodilla',
    weight: 2,
    when: (s) => s.record.w + s.record.l >= 3,
    title: 'La rodilla dijo basta',
    text: 'Ligamento cruzado, en un entrenamiento cualquiera, sin nadie encima. El médico te muestra la resonancia como quien muestra una boleta.',
    options: [
      {
        label: 'Operarte y hacer todo bien',
        fx: '1 año afuera · −12 hype · −0.5 Cardio',
        apply: (s) => {
          age(s, 1.1)
          hype(s, -12)
          bump(s, 'cardio', -0.5)
          return 'Un año afuera. Volvés entero, pero el ranking no te esperó y el teléfono suena bastante menos.'
        },
      },
      {
        label: 'Infiltrarte y seguir peleando',
        fx: '+3 hype · −1.2 Cardio y −0.6 Grappling por 8 peleas',
        apply: (s) => {
          injure(s, 'Rodilla infiltrada', 'cardio', 1.2, 8)
          injure(s, 'Rodilla infiltrada', 'grappling', 0.6, 8)
          hype(s, 3)
          return 'Peleaste en tres meses. La rodilla te va a pasar la factura cada round de las próximas ocho peleas.'
        },
      },
    ],
  },
  {
    id: 'suplemento',
    weight: 2,
    every: 10,
    when: (s) => !s.flags.suspended,
    title: 'El sponsor generoso',
    text: 'Una marca de suplementos te ofrece contrato. El frasco no tiene sello de nada y el tipo insiste con que "es todo natural".',
    options: [
      {
        label: 'Tomarlo, la plata es la plata',
        fx: '+15k · +0.8 Cardio · ⚠ 35% suspensión',
        apply: (s, rng) => {
          cash(s, 15000)
          if (rng() < 0.35) {
            s.flags.suspended = true
            age(s, 0.5)
            hype(s, -20)
            return 'Diste positivo. Seis meses de suspensión y una explicación en video que nadie te compró.'
          }
          bump(s, 'cardio', 0.8)
          bump(s, 'striking', 0.3)
          return 'Pasaste todos los controles y encima te sentís un caballo. A veces sale bien.'
        },
      },
      {
        label: 'Tirarlo a la basura',
        fx: '+0.3 Fight IQ',
        apply: (s) => {
          bump(s, 'iq', 0.3)
          return 'Le dijiste que no. Seguís pobre y seguís durmiendo bien.'
        },
      },
    ],
  },
  {
    id: 'pelea-boliche',
    weight: 2,
    every: 8,
    when: (s) => s.age < 28,
    title: 'Tres de la mañana',
    text: 'A la salida del boliche un pibe te reconoce, te empuja y te dice que le ganás porque tenés guantes.',
    options: [
      {
        label: 'Irte caminando',
        fx: '+0.5 Fight IQ',
        apply: (s) => {
          bump(s, 'iq', 0.5)
          return 'Te fuiste. Te filmaron igual, pero el video te deja bien parado.'
        },
      },
      {
        label: 'Contestarle',
        fx: '⚠ 50%: +8 hype · o −6k, −10 hype y mano lastimada',
        apply: (s, rng) => {
          if (rng() < 0.5) {
            hype(s, 8)
            cash(s, -2000)
            return 'Un cross y el pibe se durmió en el cordón. El video explota, la causa penal también.'
          }
          cash(s, -6000)
          hype(s, -10)
          injure(s, 'Mano hinchada', 'striking', 0.8, 2)
          return 'Eran seis. Te dieron una paliza en la vereda y te la vio todo el país.'
        },
      },
    ],
  },
  {
    id: 'hijo',
    weight: 2,
    when: (s) => s.age > 22 && !s.flags.kid,
    title: 'Dos rayitas',
    text: 'Vas a ser padre. La cuenta bancaria opina distinto que el corazón.',
    options: [
      {
        label: 'Agarrar todas las peleas que aparezcan',
        fx: '+8k · +0.5 Mentón · −0.4 Cardio',
        apply: (s) => {
          s.flags.kid = true
          cash(s, 8000)
          bump(s, 'chin', 0.5)
          bump(s, 'cardio', -0.4)
          return 'Peleás cada dos meses. El cuerpo lo siente, pero en tu casa no falta nada.'
        },
      },
      {
        label: 'Bajar un cambio y entrenar mejor',
        fx: '+0.7 Fight IQ · +0.4 Striking · −3 hype',
        apply: (s) => {
          s.flags.kid = true
          bump(s, 'iq', 0.7)
          bump(s, 'striking', 0.4)
          hype(s, -3)
          return 'Menos peleas, mejores campamentos. Te ven menos, pero cada vez que aparecés estás afiladísimo.'
        },
      },
    ],
  },
  {
    id: 'manager',
    weight: 2,
    every: 12,
    when: (s) => s.record.w >= 4,
    title: 'El manager',
    text: 'Descubrís que tu manager se está quedando con más porcentaje del que arreglaron.',
    options: [
      {
        label: 'Echarlo y arreglar vos',
        fx: '+6k · −5 hype',
        apply: (s) => {
          cash(s, 6000)
          hype(s, -5)
          return 'Ahora te queda toda la plata. También te queda contestar cuarenta mails por semana.'
        },
      },
      {
        label: 'Hacerte el boludo, te consigue peleas',
        fx: '+7 hype · −4k',
        apply: (s) => {
          hype(s, 7)
          cash(s, -4000)
          return 'Te roba, pero te mete en carteleras que no te corresponden. El negocio es así.'
        },
      },
    ],
  },
  {
    id: 'podcast',
    weight: 2,
    every: 8,
    when: (s) => s.hype > 40,
    title: 'Te invitan al podcast',
    text: 'Tres horas de micrófono con Rogan. Puede ser el mejor día de tu carrera o el peor.',
    options: [
      {
        label: 'Ir y hablar de más',
        fx: '⚠ 70%: +14 hype y +5k · o −8 hype',
        apply: (s, rng) => {
          if (rng() < 0.7) {
            hype(s, 14)
            cash(s, 5000)
            return 'Contaste la historia del galpón y de tu viejo. Se hizo viral y triplicaste seguidores.'
          }
          hype(s, -8)
          return 'Opinaste de todo lo que no había que opinar. Un clip de once segundos te persigue hace meses.'
        },
      },
      {
        label: 'Pasar, estás en campamento',
        fx: '+0.5 Cardio',
        apply: (s) => {
          bump(s, 'cardio', 0.5)
          return 'Te quedaste entrenando. Nadie hace un clip de eso, pero llegás mejor a la pelea.'
        },
      },
    ],
  },
  {
    id: 'sparring-ko',
    weight: 3,
    every: 5,
    when: () => true,
    title: 'Sparring del martes',
    text: 'Un pesado del gimnasio te tocó el mentón y viste todo blanco por dos segundos.',
    options: [
      {
        label: 'Seguir el round como si nada',
        fx: '⚠ 50%: −0.7 Mentón · o +0.3 Mentón y +2 hype',
        apply: (s, rng) => {
          if (rng() < 0.5) {
            bump(s, 'chin', -0.7)
            return 'Terminaste el round y esa noche vomitaste. Eso no se recupera del todo.'
          }
          bump(s, 'chin', 0.3)
          hype(s, 2)
          return 'Aguantaste, lo cruzaste contra el alambrado y el gimnasio entero gritó.'
        },
      },
      {
        label: 'Parar y ver al médico',
        fx: '+0.4 Fight IQ · 1 mes',
        apply: (s) => {
          bump(s, 'iq', 0.4)
          age(s, 0.1)
          return 'Dos semanas sin contacto. Aburrido, sano, correcto.'
        },
      },
    ],
  },
  {
    id: 'estilo-nuevo',
    weight: 3,
    every: 4,
    when: () => true,
    title: 'Tapar el agujero',
    text: 'Mirando tus últimas peleas queda claro dónde te van a atacar la próxima vez.',
    options: [
      {
        label: 'Meterle seis meses al wrestling',
        fx: '+1.1 Grappling · 4 meses',
        apply: (s) => {
          bump(s, 'grappling', 1.1)
          age(s, 0.3)
          return 'Seis meses debajo de gente que te tira al piso por deporte. Ahora te levantás.'
        },
      },
      {
        label: 'Meterle seis meses a las manos',
        fx: '+1.1 Striking · 4 meses',
        apply: (s) => {
          bump(s, 'striking', 1.1)
          age(s, 0.3)
          return 'Gimnasio de boxeo, mil rounds de guanteo. Las manos ya salen solas.'
        },
      },
      {
        label: 'Correr y correr y correr',
        fx: '+1.1 Cardio · 4 meses',
        apply: (s) => {
          bump(s, 'cardio', 1.1)
          age(s, 0.3)
          return 'Cerros, cuerdas y bici. En el quinto round vas a ser el único que respira.'
        },
      },
    ],
  },
  {
    id: 'psicologo',
    weight: 2,
    every: 8,
    when: (s) => s.record.w + s.record.l >= 5,
    title: 'La cabeza',
    text: 'Hace tres campamentos que dormís mal y en la jaula pensás de más. Alguien del equipo te pasa un teléfono.',
    options: [
      {
        label: 'Ir a terapia deportiva',
        fx: '−5k · +1.0 Fight IQ',
        can: (s) => s.money >= 5000,
        apply: (s) => {
          cash(s, -5000)
          bump(s, 'iq', 1.0)
          return 'Seis meses de laburo mental. Entrás a la jaula sin ese ruido de fondo y se nota en todo.'
        },
      },
      {
        label: 'Aguantártela solo, como siempre',
        fx: '+0.4 Mentón · −0.3 Fight IQ',
        apply: (s) => {
          bump(s, 'chin', 0.4)
          bump(s, 'iq', -0.3)
          return 'Te la comés solo. Funciona hasta que un día no funciona más.'
        },
      },
    ],
  },
  {
    id: 'sparring-fijo',
    weight: 2,
    every: 6,
    when: (s) => s.record.w + s.record.l >= 4,
    title: 'El compañero de todos los días',
    text: 'Hay un tipo en el gimnasio de tu peso y tu nivel. Pueden hacerse mejores los dos o romperse los dos.',
    options: [
      {
        label: 'Guerra todos los martes',
        fx: '+0.7 Striking · +0.5 Grappling · −0.5 Mentón',
        apply: (s) => {
          bump(s, 'striking', 0.7)
          bump(s, 'grappling', 0.5)
          bump(s, 'chin', -0.5)
          return 'Se pegaron como si fueran peleas de verdad. Los dos mejoraron y los dos dejaron algo en el camino.'
        },
      },
      {
        label: 'Técnica al 60%, siempre',
        fx: '+0.5 Fight IQ · +0.4 Cardio',
        apply: (s) => {
          bump(s, 'iq', 0.5)
          bump(s, 'cardio', 0.4)
          return 'Sparring inteligente, cero cabezazos. Menos épica y mucho más carrera.'
        },
      },
    ],
  },
  {
    id: 'entrenador-viejo',
    weight: 2,
    when: (s) => GYMS[s.gym].tier <= 2 && s.hype > 30,
    title: 'El de siempre',
    text: 'Tu primer entrenador se está quedando atrás y todo el equipo lo sabe. Vos también.',
    options: [
      {
        label: 'Traer un head coach nuevo',
        fx: '−10k · +1.0 Fight IQ · −3 hype',
        apply: (s) => {
          bump(s, 'iq', 1.0)
          cash(s, -10000)
          hype(s, -3)
          return 'Trajiste a alguien con currículum. El viejo va igual a la esquina, pero ya no habla entre rounds.'
        },
      },
      {
        label: 'Bancarlo hasta el final',
        fx: '+0.6 Mentón · +4 hype',
        apply: (s) => {
          bump(s, 'chin', 0.6)
          hype(s, 4)
          return 'Sigue siendo él el que te pone la vaselina en la cara. Peleás para los dos.'
        },
      },
    ],
  },
  {
    id: 'oferta-otra-promo',
    weight: 2,
    when: (s) => s.tier === 'regional' || s.tier === 'dwcs',
    title: 'Plata ahora o UFC después',
    text: 'Una promotora asiática te ofrece un contrato de tres peleas por mucha más plata de la que viste junta.',
    options: [
      {
        label: 'Firmar por la plata',
        fx: '+60k · −6 hype · 10 meses',
        apply: (s) => {
          cash(s, 60000)
          hype(s, -6)
          age(s, 0.8)
          return 'Tres peleas, buen sueldo, ninguna repercusión. Volvés con el bolsillo lleno y dos años menos de carrera.'
        },
      },
      {
        label: 'Apostar todo a la jaula grande',
        fx: '+6 hype',
        apply: (s) => {
          hype(s, 6)
          return 'Rechazaste la plata. Ahora no hay plan B, y eso se nota cuando entrás a pelear.'
        },
      },
    ],
  },
  {
    id: 'lesion-mano',
    weight: 2,
    every: 9,
    when: (s) => s.record.w + s.record.l >= 4,
    title: 'La mano derecha',
    text: 'Te fracturaste el quinto metacarpiano pegándole a alguien en la frente.',
    options: [
      {
        label: 'Clavo y a entrenar patadas',
        fx: '4 meses · +0.5 Striking',
        apply: (s) => {
          age(s, 0.3)
          bump(s, 'striking', 0.5)
          return 'Tres meses sin manos: te volviste peligrosísimo con las piernas.'
        },
      },
      {
        label: 'Vendarla y pelear igual',
        fx: '+3 hype · −1.1 Striking por 3 peleas',
        apply: (s) => {
          injure(s, 'Mano fracturada', 'striking', 1.1, 3)
          hype(s, 3)
          return 'Peleaste con la mano rota. Épico para el público, malísimo para tu mano.'
        },
      },
    ],
  },
  {
    id: 'ranking-injusto',
    weight: 2,
    every: 6,
    when: (s) => s.tier === 'ranked',
    title: 'El ranking',
    text: (s) => `Sos el #${s.rank} y te siguen ofreciendo gente que viene de perder. Nadie sube así.`,
    options: [
      {
        label: 'Quejarte en todos lados',
        fx: '⚠ 55%: +12 hype · o −6 hype',
        apply: (s, rng) => {
          if (rng() < 0.55) {
            hype(s, 12)
            return 'Tanto ruido hiciste que te dieron el rival que querías.'
          }
          hype(s, -6)
          return 'En la oficina te pusieron la etiqueta de problemático. Vas a esperar sentado.'
        },
      },
      {
        label: 'Aceptar y ganar todas',
        fx: '+0.6 Fight IQ · +3 hype',
        apply: (s) => {
          bump(s, 'iq', 0.6)
          hype(s, 3)
          return 'Callado y ganando. Lento, pero nadie puede decirte nada.'
        },
      },
    ],
  },
  {
    id: 'plata-corta',
    weight: 4,
    every: 4,
    when: (s) => s.money < 2500,
    title: 'No llegás a fin de mes',
    text: (s) => `Te quedan US$ ${s.money.toLocaleString('es-AR')} y la próxima bolsa está a meses. El alquiler no entiende de sueños.`,
    options: [
      {
        label: 'Laburar en una obra a la mañana',
        fx: '+5k · −0.5 Cardio · +0.4 Mentón',
        apply: (s) => {
          cash(s, 5000)
          bump(s, 'cardio', -0.5)
          bump(s, 'chin', 0.4)
          return 'Ocho horas de pala y después entrenar. Llegás muerto a todos lados, pero llegás.'
        },
      },
      {
        label: 'Dar clases en el gimnasio',
        fx: '+2.5k · +0.6 Fight IQ',
        apply: (s) => {
          cash(s, 2500)
          bump(s, 'iq', 0.6)
          return 'Enseñar te obligó a entender lo que hacías por instinto. Sirvió más de lo que pensabas.'
        },
      },
      {
        label: 'Vivir de prestado y entrenar full time',
        fx: '+0.5 Striking · +0.5 Grappling · te quedás en cero',
        apply: (s) => {
          s.money = 0
          bump(s, 'striking', 0.5)
          bump(s, 'grappling', 0.5)
          return 'Dos entrenamientos por día y arroz. Estás peligroso y estás en rojo.'
        },
      },
    ],
  },
  {
    id: 'video-viral',
    weight: 2,
    every: 8,
    when: (s) => s.record.w >= 3,
    title: 'Se hizo viral',
    text: 'Un KO tuyo de hace dos años apareció en una cuenta con millones de seguidores.',
    options: [
      {
        label: 'Aprovechar y subir contenido todos los días',
        fx: '+12 hype · −0.3 Cardio',
        apply: (s) => {
          hype(s, 12)
          bump(s, 'cardio', -0.3)
          return 'Sos más conocido que peleadores que te ganan. La cámara come tiempo de entrenamiento.'
        },
      },
      {
        label: 'Ignorarlo',
        fx: '+2 hype · +0.4 Grappling',
        apply: (s) => {
          hype(s, 2)
          bump(s, 'grappling', 0.4)
          return 'Ni te enteraste. Estabas en el tatami.'
        },
      },
    ],
  },
  {
    id: 'cambio-esquina',
    weight: 3,
    every: 3,
    when: (s) => s.last && s.last.result === 'loss',
    title: 'Después de la derrota',
    text: (s) => `Perdiste con ${s.last.opponent} y el vestuario está en silencio. Alguien tiene que decir algo.`,
    options: [
      {
        label: 'Ver la pelea entera con el equipo',
        fx: '+0.8 Fight IQ',
        apply: (s) => {
          bump(s, 'iq', 0.8)
          return 'Tres horas de video, pausa en cada error. Duele y sirve.'
        },
      },
      {
        label: 'Desaparecer un mes',
        fx: '2 meses · +0.4 Mentón · −3 hype',
        apply: (s) => {
          age(s, 0.2)
          bump(s, 'chin', 0.4)
          hype(s, -3)
          return 'Playa, familia y cero MMA. Volviste con la cabeza limpia.'
        },
      },
    ],
  },
  {
    id: 'campamento-altura',
    weight: 3,
    every: 3,
    when: () => true,
    title: 'Campamento',
    text: 'Ocho semanas hasta la pelea. Hay que decidir dónde y cómo.',
    options: [
      {
        label: 'Altura, dos meses aislado',
        fx: '−4k · +0.9 Cardio',
        apply: (s) => {
          bump(s, 'cardio', 0.9)
          cash(s, -4000)
          return 'Volviste con los pulmones de otro. También con dos meses de no ver a nadie.'
        },
      },
      {
        label: 'En casa, con los tuyos',
        fx: '+1k · +0.4 Mentón · +0.3 Fight IQ',
        apply: (s) => {
          bump(s, 'chin', 0.4)
          bump(s, 'iq', 0.3)
          cash(s, 1000)
          return 'Rutina, familia y el mismo café de siempre. Llegás tranquilo.'
        },
      },
      {
        label: 'Sparring con el campeón de otra división',
        fx: '⚠ 65%: +0.7 Striking y +0.5 Grappling · o −0.6 Mentón',
        apply: (s, rng) => {
          if (rng() < 0.65) {
            bump(s, 'striking', 0.7)
            bump(s, 'grappling', 0.5)
            return 'Te dio ocho semanas de infierno y saliste a otro nivel.'
          }
          bump(s, 'chin', -0.6)
          return 'Te dejó marcado. Llegás a la pelea gastado antes de empezar.'
        },
      },
    ],
  },
  {
    id: 'documental',
    weight: 1,
    every: 12,
    when: (s) => s.hype > 55,
    title: 'Quieren filmarte',
    text: 'Una productora quiere hacer un documental sobre tu vida. Cámaras en el gimnasio, en tu casa, en todos lados.',
    options: [
      {
        label: 'Dejarlos entrar',
        fx: '+20k · +15 hype · −0.4 Cardio',
        apply: (s) => {
          hype(s, 15)
          cash(s, 20000)
          bump(s, 'cardio', -0.4)
          return 'Todo el mundo conoce la historia de tu vieja lavando ropa para pagarte los viajes. Te para gente en la calle.'
        },
      },
      {
        label: 'No, gracias',
        fx: '+0.4 Fight IQ',
        apply: (s) => {
          bump(s, 'iq', 0.4)
          return 'Preferís que te conozcan por pelear. Rarísimo hoy en día.'
        },
      },
    ],
  },
  {
    id: 'guerra-anterior',
    weight: 4,
    every: 4,
    when: (s) => s.last && s.last.war,
    title: 'La resaca',
    text: (s) => `Lo de ${s.last.opponent} fue una guerra y el cuerpo todavía no volvió. Te levantás con dolor de cabeza.`,
    options: [
      {
        label: 'Volver rápido, está caliente el nombre',
        fx: '+8 hype · −1.0 Mentón por 3 peleas',
        apply: (s) => {
          hype(s, 8)
          injure(s, 'Cabeza golpeada', 'chin', 1.0, 3)
          return 'Volviste en cuatro meses. Vas a entrar a las próximas tres con el mentón prestado.'
        },
      },
      {
        label: 'Tomarte un año',
        fx: '10 meses · −8 hype · +0.3 Mentón',
        apply: (s) => {
          age(s, 0.8)
          hype(s, -8)
          bump(s, 'chin', 0.3)
          return 'Un año sin pelear. El cuerpo lo agradece, la memoria del público no.'
        },
      },
    ],
  },
  {
    id: 'contrato-nuevo',
    weight: 2,
    every: 10,
    when: (s) => isUFC(s.tier) && s.record.w >= 6,
    title: 'Renovación',
    text: 'Se te vence el contrato. Ponen los papeles sobre la mesa y sonríen mucho.',
    options: [
      {
        label: 'Negociar duro',
        fx: '⚠ 60%: +80k · o −8 hype y 5 meses congelado',
        apply: (s, rng) => {
          if (rng() < 0.6) {
            cash(s, 80000)
            hype(s, 3)
            return 'Aguantaste tres meses sin firmar y te mejoraron todo. Se puede.'
          }
          hype(s, -8)
          age(s, 0.4)
          return 'Te dejaron congelado medio año para que entiendas quién manda.'
        },
      },
      {
        label: 'Firmar lo que pongan',
        fx: '+25k · +2 hype',
        apply: (s) => {
          cash(s, 25000)
          hype(s, 2)
          return 'Firmaste rápido y te metieron en la próxima cartelera. Barato y activo.'
        },
      },
    ],
  },
  {
    id: 'ojo',
    weight: 2,
    when: (s) => s.methods.koAgainst >= 1 || s.record.l >= 3,
    title: 'El ojo',
    text: 'Te desprendiste la retina. El oftalmólogo pregunta si tenés otro oficio.',
    options: [
      {
        label: 'Operarte y volver',
        fx: '8 meses · −0.3 Fight IQ · −0.3 Mentón',
        apply: (s) => {
          age(s, 0.7)
          bump(s, 'iq', -0.3)
          bump(s, 'chin', -0.3)
          return 'Volviste con licencia médica renovada y una advertencia en el legajo.'
        },
      },
      {
        label: 'Cambiar el estilo: menos intercambios',
        fx: '+0.9 Grappling · −0.4 Striking · −4 hype',
        apply: (s) => {
          bump(s, 'grappling', 0.9)
          bump(s, 'striking', -0.4)
          hype(s, -4)
          return 'Ahora derribás y controlás. Ganás igual, pero el público te silba.'
        },
      },
    ],
  },
  {
    id: 'bandera',
    weight: 1,
    every: 10,
    when: (s) => s.hype > 45,
    title: 'La bandera',
    // `text` puede ser función cuando necesita el estado
    text: (s) => `Sos lo más grande que dio ${COUNTRIES[s.country].name} en este deporte y de golpe todos opinan de vos.`,
    options: [
      {
        label: 'Ponerte el país al hombro',
        fx: '+10 hype · +0.4 Mentón',
        apply: (s) => {
          hype(s, 10)
          bump(s, 'chin', 0.4)
          return 'Salís con la bandera y el estadio canta. Peleás con veinte kilos de presión encima y te gusta.'
        },
      },
      {
        label: 'Bajar el perfil',
        fx: '+0.5 Fight IQ',
        apply: (s) => {
          bump(s, 'iq', 0.5)
          return 'Menos ruido, menos entrevistas, más entrenamiento. Nadie te va a hacer un mural, pero llegás mejor.'
        },
      },
    ],
  },
  {
    id: 'peso-natural',
    weight: 2,
    when: (s) => s.age > 29,
    title: 'El cuerpo cambió',
    text: 'Bajar a tu categoría ya no es sacrificio, es una locura. El cuerpo de treinta no es el de veintidós.',
    options: [
      {
        label: 'Subir de categoría',
        fx: '+0.8 Cardio · +0.3 Mentón · −4 hype · pegan más fuerte',
        apply: (s) => {
          const name = moveUp(s)
          bump(s, 'cardio', 0.8)
          bump(s, 'chin', 0.3)
          hype(s, -4)
          return `Arriba te sentís persona otra vez. En ${name} pegan bastante más fuerte.`
        },
      },
      {
        label: 'Aguantar donde sos grande',
        fx: '−0.6 Cardio · +3 hype',
        apply: (s) => {
          bump(s, 'cardio', -0.6)
          hype(s, 3)
          return 'Seguís siendo el más grande de la división. Los cortes te van a ir comiendo de a poco.'
        },
      },
    ],
  },
  {
    id: 'bajar-division',
    weight: 2,
    when: (s) => s.age < 28 && s.record.w + s.record.l >= 4 && WEIGHT_CLASSES[0].id !== s.weight,
    title: 'Abajo pegás igual',
    text: 'Sos chico para la categoría y lo comés cada vez que alguien te agarra el clinch. Abajo serías el grande.',
    options: [
      {
        label: 'Bajar de categoría',
        fx: '−0.5 Cardio · pegás más fuerte para la división',
        apply: (s) => {
          const name = moveDown(s)
          bump(s, 'cardio', -0.5)
          return `Te bajás a ${name}. Cortes horribles cada campamento, pero ahora el grande sos vos.`
        },
      },
      {
        label: 'Quedarte y ganar músculo',
        fx: '+0.6 Mentón · +0.3 Grappling',
        apply: (s) => {
          bump(s, 'chin', 0.6)
          bump(s, 'grappling', 0.3)
          return 'Ocho kilos de músculo en un año. Ya no te tiran como antes.'
        },
      },
    ],
  },
  {
    id: 'academia',
    weight: 1,
    when: (s) => s.money > 50000,
    title: 'Tu propio gimnasio',
    text: 'Tenés plata para abrir tu academia. También tenés una carrera para atender.',
    options: [
      {
        label: 'Abrirlo ahora',
        fx: '−40k · +0.6 Fight IQ · −0.5 Cardio · futuro asegurado',
        can: (s) => s.money >= 40000,
        apply: (s) => {
          cash(s, -40000)
          s.flags.ownGym = true
          bump(s, 'iq', 0.6)
          bump(s, 'cardio', -0.5)
          return 'Ciento veinte alumnos y un contador. Tenés futuro asegurado y menos tiempo para entrenar.'
        },
      },
      {
        label: 'Después del retiro',
        fx: '+0.4 Striking',
        apply: (s) => {
          bump(s, 'striking', 0.4)
          return 'Todavía no. Hay una sola cosa a la vez.'
        },
      },
    ],
  },
  {
    id: 'nuevo-prospecto',
    weight: 2,
    every: 6,
    when: (s) => s.age > 30 && isUFC(s.tier),
    title: 'El pibe nuevo',
    text: 'Llegó un pendejo de 22 al gimnasio que te pasa por arriba en el sparring y sonríe.',
    options: [
      {
        label: 'Ir a la guerra todos los martes',
        fx: '⚠ 50%: +0.6 Striking y +0.4 Cardio · o −0.8 Mentón',
        apply: (s, rng) => {
          if (rng() < 0.5) {
            bump(s, 'striking', 0.6)
            bump(s, 'cardio', 0.4)
            return 'Te obligó a entrenar como a los 24. Estás peligroso otra vez.'
          }
          bump(s, 'chin', -0.8)
          return 'Te ganó el orgullo. Dejaste rounds en el gimnasio que te hacían falta en la jaula.'
        },
      },
      {
        label: 'Enseñarle todo lo que sabés',
        fx: '+0.9 Fight IQ · +2 hype',
        apply: (s) => {
          bump(s, 'iq', 0.9)
          hype(s, 2)
          return 'Te convertiste en el veterano del equipo. Entendés la pelea como nunca.'
        },
      },
    ],
  },
  {
    id: 'retiro-temprano',
    weight: 2,
    when: (s) => s.age > 31 && s.lossStreak >= 2,
    title: '¿Y si listo?',
    text: 'Venís de dos derrotas y te levantás con dolor de cabeza tres días por semana.',
    options: [
      {
        label: 'Una más y veo',
        fx: '+2 hype · −0.4 Mentón',
        apply: (s) => {
          hype(s, 2)
          bump(s, 'chin', -0.4)
          return 'Siempre es una más.'
        },
      },
      {
        label: 'Colgar los guantes',
        fx: '⚠ termina la carrera acá, en tus términos',
        apply: (s) => {
          s.retired = 'Te retiraste vos, con la cabeza sana y en tus términos. Muy poca gente en este deporte puede decir eso.'
          return s.retired
        },
      },
    ],
  },
  {
    id: 'vuelta-al-barrio',
    weight: 1,
    when: (s) => GYMS[s.gym].tier >= 4 && s.record.w >= 5,
    title: 'Volver',
    text: 'Extrañás. En el gimnasio grande sos un número más y allá eras el que todos miraban.',
    options: [
      {
        label: 'Volver a tu gimnasio de siempre',
        fx: '+5 hype · +0.6 Mentón · peor sparring para siempre',
        apply: (s, rng) => {
          const small = Object.keys(GYMS).filter((g) => GYMS[g].tier <= 2)
          s.gym = small[Math.floor(rng() * small.length)]
          hype(s, 5)
          bump(s, 'chin', 0.6)
          bump(s, 'cardio', -0.4)
          return `Volviste a ${s.gym}. Peor sparring, mejor cabeza.`
        },
      },
      {
        label: 'Bancarte la nostalgia',
        fx: '+0.5 Grappling · +0.3 Striking',
        apply: (s) => {
          bump(s, 'grappling', 0.5)
          bump(s, 'striking', 0.3)
          return 'Te quedaste donde te hacen mejor, aunque no te hagan sentir mejor.'
        },
      },
    ],
  },
  {
    id: 'grasa-corporal',
    weight: 2,
    every: 6,
    when: () => true,
    title: 'Entre peleas',
    text: 'No hay pelea firmada y el asado del domingo es una institución.',
    options: [
      {
        label: 'Mantenerte cerca del peso todo el año',
        fx: '+0.6 Cardio',
        apply: (s) => {
          bump(s, 'cardio', 0.6)
          return 'Nunca estás a más de cinco kilos. Aceptás peleas cuando querés.'
        },
      },
      {
        label: 'Vivir un poco',
        fx: '+0.3 Mentón · −0.5 Cardio · +2 hype',
        apply: (s) => {
          bump(s, 'chin', 0.3)
          bump(s, 'cardio', -0.5)
          hype(s, 2)
          return 'Subiste doce kilos y bajaste feliz. Cada campamento va a ser un calvario.'
        },
      },
    ],
  },
  {
    id: 'robo-jueces',
    weight: 4,
    every: 5,
    when: (s) => s.last && s.last.robbed,
    title: 'Los jueces',
    text: (s) => `Le ganaste a ${s.last.opponent} y los tres jueces vieron otra pelea. Todo el mundo lo vio menos ellos.`,
    options: [
      {
        label: 'Pedir revancha inmediata',
        fx: '⚠ 60%: +10 hype y revancha firmada · o −4 hype',
        apply: (s, rng) => {
          if (rng() < 0.6) {
            hype(s, 10)
            const r = s.rivals.filter((x) => x.beatMe).slice(-1)[0]
            if (r) s.nextOpponent = r
            return 'Te dieron la revancha y la vendieron como injusticia reparada.'
          }
          hype(s, -4)
          return 'El rival no quiso saber nada y se fue a pelear por el título.'
        },
      },
      {
        label: 'No dejar que lleguen a los jueces nunca más',
        fx: '+0.7 Striking · −0.3 Mentón',
        apply: (s) => {
          bump(s, 'striking', 0.7)
          bump(s, 'chin', -0.3)
          return 'Salís a buscar el finish siempre. Más lindo de ver, más riesgoso de vivir.'
        },
      },
    ],
  },
  {
    id: 'redes',
    weight: 2,
    every: 7,
    when: (s) => s.hype > 25,
    title: 'El community manager',
    text: 'Una agencia te ofrece manejarte las redes. Dicen que en seis meses duplican todo.',
    options: [
      {
        label: 'Contratarlos',
        fx: '−6k · +10 hype',
        can: (s) => s.money >= 6000,
        apply: (s) => {
          cash(s, -6000)
          hype(s, 10)
          return 'Tres posteos por día, reels con música épica y una foto tuya mirando el horizonte. Funciona, lamentablemente.'
        },
      },
      {
        label: 'Manejarlo vos, como puedas',
        fx: '+2 hype · +0.3 Fight IQ',
        apply: (s) => {
          hype(s, 2)
          bump(s, 'iq', 0.3)
          return 'Subís lo que se te canta cuando se te canta. Menos alcance, cero cringe.'
        },
      },
    ],
  },
]
