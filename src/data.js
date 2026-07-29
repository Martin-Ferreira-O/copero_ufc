// Todo el contenido del juego vive acá. El motor (sim.js) no sabe de nombres propios.
// Agregar contenido = empujar objetos a estos arrays, sin tocar sim.js.

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Perillas de balance. Un juego no se acierta en el papel: esto se toca a mano después de jugarlo.
export const TUNING = {
  baseDmg: 21, // daño repartido por round en una pelea pareja
  hpBase: 40, // vida = hpBase + chin * hpPerChin
  hpPerChin: 6.0,
  stamDrain: 9, // por round, más penalidad por cardio bajo
  subChance: 0.075, // por punto de ventaja de grappling en el suelo
  growthPerFight: 0.22, // mejora base de stats por pelea
  hypeWin: 6,
  hypeFinish: 5, // extra por finalizar
  hypeLoss: -5,
  yearsPerFight: 0.42,
  retireAge: 39,
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
export const LADDER = [
  { id: 'amateur', name: 'Amateur', fights: 3, need: 3, hype: 0, rounds: 3, pay: 0, oppLevel: 4.7 },
  { id: 'regional', name: 'Regional', fights: 4, need: 4, hype: 18, rounds: 3, pay: 1200, oppLevel: 5.9 },
  { id: 'dwcs', name: "Dana White's Contender Series", fights: 1, need: 1, hype: 32, rounds: 3, pay: 5000, oppLevel: 6.4 },
  { id: 'prelim', name: 'UFC — preliminares', fights: 3, need: 3, hype: 42, rounds: 3, pay: 12000, oppLevel: 6.9 },
  { id: 'maincard', name: 'UFC — main card', fights: 3, need: 3, hype: 56, rounds: 3, pay: 40000, oppLevel: 7.4 },
  { id: 'ranked', name: 'UFC — top 15', fights: 4, need: 4, hype: 74, rounds: 3, pay: 120000, oppLevel: 8.3 },
  { id: 'title', name: 'UFC — pelea de título', fights: 1, need: 1, hype: 86, rounds: 5, pay: 500000, oppLevel: 8.9 },
  { id: 'champ', name: 'UFC — campeón', fights: 99, need: 99, hype: 100, rounds: 5, pay: 900000, oppLevel: 8.7 },
]

export const isUFC = (tierId) => ['prelim', 'maincard', 'ranked', 'title', 'champ'].includes(tierId)

// Rivales de verdad para los escalones altos. Borrar nombres = editar un array.
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
}
const age = (s, years) => {
  s.age += years
}

// ── eventos ───────────────────────────────────────────────────────────────────
// { id, weight, when(s), title, text, options:[{ label, apply(s, rng) -> texto }] }
export const EVENTS = [
  {
    id: 'corte-peso',
    weight: 3,
    when: (s) => s.record.w + s.record.l >= 2,
    title: 'La balanza',
    text: 'Faltan 30 horas y te sobran cuatro kilos. El nutricionista te mira y no dice nada, que es peor.',
    options: [
      {
        label: 'Bajar como sea: sauna y pileta',
        apply: (s) => {
          s.flags.badCut = true
          return 'Diste el peso por 100 gramos y te fuiste caminando como un abuelo. Vas a pelear vacío.'
        },
      },
      {
        label: 'No dar el peso y bancar la multa',
        apply: (s) => {
          cash(s, -3000)
          hype(s, -8)
          return 'Subiste 1.2 kilos arriba. Perdés el 20% de la bolsa y el rival te odia con razón.'
        },
      },
      {
        label: 'Subir de categoría de una vez',
        apply: (s) => {
          const i = WEIGHT_CLASSES.findIndex((w) => w.id === s.weight)
          if (i < WEIGHT_CLASSES.length - 1) s.weight = WEIGHT_CLASSES[i + 1].id
          bump(s, 'cardio', 0.6)
          return `Se terminó el circo de la balanza: te mudás a ${WEIGHT_CLASSES.find((w) => w.id === s.weight).name}. Vas a estar más chico, pero entero.`
        },
      },
    ],
  },
  {
    id: 'oferta-gym-grande',
    weight: 3,
    when: (s) => GYMS[s.gym].tier <= 3 && s.hype > 20,
    title: 'Te llaman de arriba',
    text: 'Un gimnasio de primer nivel te ofrece lugar en el equipo. Sparring de otro planeta, pero es cruzar el mundo y pagarlo vos.',
    options: [
      {
        label: 'Hacer las valijas',
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
    when: (s) => !s.flags.kneeDone && s.record.w + s.record.l >= 3,
    title: 'La rodilla dijo basta',
    text: 'Ligamento cruzado, en un entrenamiento cualquiera, sin nadie encima. El médico te muestra la resonancia como quien muestra una boleta.',
    options: [
      {
        label: 'Operarte y hacer todo bien',
        apply: (s) => {
          s.flags.kneeDone = true
          age(s, 1.1)
          hype(s, -12)
          bump(s, 'cardio', -0.5)
          return 'Un año afuera. Volvés entero, pero el ranking no te esperó y el teléfono suena bastante menos.'
        },
      },
      {
        label: 'Infiltrarte y seguir peleando',
        apply: (s) => {
          s.flags.kneeDone = true
          s.flags.badKnee = true
          bump(s, 'cardio', -1.2)
          bump(s, 'grappling', -0.6)
          hype(s, 3)
          return 'Peleaste en tres meses. La rodilla te va a pasar la factura cada round de cada pelea que te queda.'
        },
      },
    ],
  },
  {
    id: 'aviso-corto',
    weight: 3,
    when: (s) => isUFC(s.tier) || s.tier === 'regional',
    title: 'Diez días de aviso',
    text: 'Se cayó una pelea y te ofrecen el lugar contra alguien bastante mejor rankeado. Estás a seis kilos del límite y sin campamento.',
    options: [
      {
        label: 'Firmar sin leer',
        apply: (s) => {
          s.flags.shortNotice = true
          hype(s, 12)
          return 'La gente ya te quiere solo por aceptar. Ahora hay que entrar a la jaula sin haber dormido tres días.'
        },
      },
      {
        label: 'Pasar y esperar el campamento completo',
        apply: (s) => {
          hype(s, -4)
          bump(s, 'iq', 0.4)
          return 'El matchmaker anota. La próxima oferta va a tardar un poquito más en llegar.'
        },
      },
    ],
  },
  {
    id: 'suplemento',
    weight: 2,
    when: (s) => !s.flags.suspended,
    title: 'El sponsor generoso',
    text: 'Una marca de suplementos te ofrece contrato. El frasco no tiene sello de nada y el tipo insiste con que "es todo natural".',
    options: [
      {
        label: 'Tomarlo, la plata es la plata',
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
    when: (s) => s.age < 28,
    title: 'Tres de la mañana',
    text: 'A la salida del boliche un pibe te reconoce, te empuja y te dice que le ganás porque tenés guantes.',
    options: [
      {
        label: 'Irte caminando',
        apply: (s) => {
          bump(s, 'iq', 0.5)
          return 'Te fuiste. Te filmaron igual, pero el video te deja bien parado.'
        },
      },
      {
        label: 'Contestarle',
        apply: (s, rng) => {
          if (rng() < 0.5) {
            hype(s, 8)
            cash(s, -2000)
            return 'Un cross y el pibe se durmió en el cordón. El video explota, la causa penal también.'
          }
          cash(s, -6000)
          hype(s, -10)
          bump(s, 'chin', -0.5)
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
    when: (s) => s.record.w >= 4,
    title: 'El manager',
    text: 'Descubrís que tu manager se está quedando con más porcentaje del que arreglaron.',
    options: [
      {
        label: 'Echarlo y arreglar vos',
        apply: (s) => {
          cash(s, 6000)
          hype(s, -5)
          return 'Ahora te queda toda la plata. También te queda contestar cuarenta mails por semana.'
        },
      },
      {
        label: 'Hacerte el boludo, te consigue peleas',
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
    when: (s) => s.hype > 40,
    title: 'Te invitan al podcast',
    text: 'Tres horas de micrófono con Rogan. Puede ser el mejor día de tu carrera o el peor.',
    options: [
      {
        label: 'Ir y hablar de más',
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
        apply: (s) => {
          bump(s, 'cardio', 0.5)
          return 'Te quedaste entrenando. Nadie hace un clip de eso, pero llegás mejor a la pelea.'
        },
      },
    ],
  },
  {
    id: 'conferencia',
    weight: 3,
    when: (s) => isUFC(s.tier),
    title: 'Conferencia de prensa',
    text: 'El rival dice tu apellido mal a propósito y se ríe con su equipo.',
    options: [
      {
        label: 'Devolvérsela con todo',
        apply: (s) => {
          hype(s, 10)
          s.flags.beef = true
          return 'Se armó. Le pusieron main event a la pelea solo por lo que se dijeron.'
        },
      },
      {
        label: 'Sonreír y no decir nada',
        apply: (s) => {
          bump(s, 'iq', 0.5)
          hype(s, -2)
          return 'Ni una palabra. En el pesaje lo mirás fijo y se le nota la incomodidad.'
        },
      },
    ],
  },
  {
    id: 'sparring-ko',
    weight: 3,
    when: () => true,
    title: 'Sparring del martes',
    text: 'Un pesado del gimnasio te tocó el mentón y viste todo blanco por dos segundos.',
    options: [
      {
        label: 'Seguir el round como si nada',
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
    when: () => true,
    title: 'Tapar el agujero',
    text: 'Mirando tus últimas peleas queda claro dónde te van a atacar la próxima vez.',
    options: [
      {
        label: 'Meterle seis meses al wrestling',
        apply: (s) => {
          bump(s, 'grappling', 1.1)
          age(s, 0.3)
          return 'Seis meses debajo de gente que te tira al piso por deporte. Ahora te levantás.'
        },
      },
      {
        label: 'Meterle seis meses a las manos',
        apply: (s) => {
          bump(s, 'striking', 1.1)
          age(s, 0.3)
          return 'Gimnasio de boxeo, mil rounds de guanteo. Las manos ya salen solas.'
        },
      },
      {
        label: 'Correr y correr y correr',
        apply: (s) => {
          bump(s, 'cardio', 1.1)
          age(s, 0.3)
          return 'Cerros, cuerdas y bici. En el quinto round vas a ser el único que respira.'
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
        apply: (s) => {
          bump(s, 'iq', 1.0)
          cash(s, -10000)
          hype(s, -3)
          return 'Trajiste a alguien con currículum. El viejo va igual a la esquina, pero ya no habla entre rounds.'
        },
      },
      {
        label: 'Bancarlo hasta el final',
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
        apply: (s) => {
          cash(s, 60000)
          hype(s, -6)
          age(s, 0.8)
          return 'Tres peleas, buen sueldo, ninguna repercusión. Volvés con el bolsillo lleno y dos años menos de carrera.'
        },
      },
      {
        label: 'Apostar todo a la jaula grande',
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
    when: (s) => s.record.w + s.record.l >= 4,
    title: 'La mano derecha',
    text: 'Te fracturaste el quinto metacarpiano pegándole a alguien en la frente.',
    options: [
      {
        label: 'Clavo y a entrenar patadas',
        apply: (s) => {
          age(s, 0.3)
          bump(s, 'striking', 0.5)
          return 'Tres meses sin manos: te volviste peligrosísimo con las piernas.'
        },
      },
      {
        label: 'Vendarla y pelear igual',
        apply: (s) => {
          bump(s, 'striking', -0.8)
          hype(s, 3)
          return 'Peleaste con la mano rota. Épico para el público, malísimo para tu mano.'
        },
      },
    ],
  },
  {
    id: 'ranking-injusto',
    weight: 2,
    when: (s) => s.tier === 'ranked',
    title: 'El ranking',
    text: 'Ganaste tres seguidas y te siguen ofreciendo gente que viene de perder.',
    options: [
      {
        label: 'Quejarte en todos lados',
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
    weight: 3,
    when: (s) => s.money < 3000 && !isUFC(s.tier),
    title: 'No llegás a fin de mes',
    text: 'Peleás por 1200 dólares cada seis meses. El alquiler no entiende de sueños.',
    options: [
      {
        label: 'Laburar en una obra a la mañana',
        apply: (s) => {
          cash(s, 5000)
          bump(s, 'cardio', -0.5)
          bump(s, 'chin', 0.4)
          return 'Ocho horas de pala y después entrenar. Llegás muerto a todos lados, pero llegás.'
        },
      },
      {
        label: 'Dar clases en el gimnasio',
        apply: (s) => {
          cash(s, 2500)
          bump(s, 'iq', 0.6)
          return 'Enseñar te obligó a entender lo que hacías por instinto. Sirvió más de lo que pensabas.'
        },
      },
      {
        label: 'Vivir de prestado y entrenar full time',
        apply: (s) => {
          cash(s, -1000)
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
    when: (s) => s.record.w >= 3,
    title: 'Se hizo viral',
    text: 'Un KO tuyo de hace dos años apareció en una cuenta con millones de seguidores.',
    options: [
      {
        label: 'Aprovechar y subir contenido todos los días',
        apply: (s) => {
          hype(s, 12)
          bump(s, 'cardio', -0.3)
          return 'Sos más conocido que peleadores que te ganan. La cámara come tiempo de entrenamiento.'
        },
      },
      {
        label: 'Ignorarlo',
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
    weight: 2,
    when: (s) => s.lossStreak >= 1,
    title: 'Después de la derrota',
    text: 'Perdiste y el vestuario está en silencio. Alguien tiene que decir algo.',
    options: [
      {
        label: 'Ver la pelea entera con el equipo',
        apply: (s) => {
          bump(s, 'iq', 0.8)
          return 'Tres horas de video, pausa en cada error. Duele y sirve.'
        },
      },
      {
        label: 'Desaparecer un mes',
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
    id: 'apuesta',
    weight: 1,
    when: (s) => isUFC(s.tier),
    title: 'Una propuesta rara',
    text: 'Un tipo que nadie sabe quién es te ofrece plata por "hacer el segundo round parejo".',
    options: [
      {
        label: 'Mandarlo a la mierda y denunciarlo',
        apply: (s) => {
          hype(s, 5)
          bump(s, 'iq', 0.3)
          return 'Lo denunciaste. La comisión te lo agradece; el tipo desapareció.'
        },
      },
      {
        label: 'Escuchar la cifra',
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
  {
    id: 'campamento-altura',
    weight: 3,
    when: () => true,
    title: 'Campamento',
    text: 'Ocho semanas hasta la pelea. Hay que decidir dónde y cómo.',
    options: [
      {
        label: 'Altura, dos meses aislado',
        apply: (s) => {
          bump(s, 'cardio', 0.9)
          cash(s, -4000)
          return 'Volviste con los pulmones de otro. También con dos meses de no ver a nadie.'
        },
      },
      {
        label: 'En casa, con los tuyos',
        apply: (s) => {
          bump(s, 'chin', 0.4)
          bump(s, 'iq', 0.3)
          cash(s, 1000)
          return 'Rutina, familia y el mismo café de siempre. Llegás tranquilo.'
        },
      },
      {
        label: 'Sparring con el campeón de otra división',
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
    when: (s) => s.hype > 55,
    title: 'Quieren filmarte',
    text: 'Una productora quiere hacer un documental sobre tu vida. Cámaras en el gimnasio, en tu casa, en todos lados.',
    options: [
      {
        label: 'Dejarlos entrar',
        apply: (s) => {
          hype(s, 15)
          cash(s, 20000)
          bump(s, 'cardio', -0.4)
          return 'Todo el mundo conoce la historia de tu vieja lavando ropa para pagarte los viajes. Te para gente en la calle.'
        },
      },
      {
        label: 'No, gracias',
        apply: (s) => {
          bump(s, 'iq', 0.4)
          return 'Preferís que te conozcan por pelear. Rarísimo hoy en día.'
        },
      },
    ],
  },
  {
    id: 'guerra-anterior',
    weight: 2,
    when: (s) => s.flags.war,
    title: 'La resaca',
    text: 'La última fue una guerra de quince minutos. El cuerpo todavía no volvió.',
    options: [
      {
        label: 'Volver rápido, está caliente el nombre',
        apply: (s) => {
          hype(s, 8)
          bump(s, 'chin', -0.8)
          return 'Volviste en cuatro meses. El mentón ya no es el que era.'
        },
      },
      {
        label: 'Tomarte un año',
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
    when: (s) => isUFC(s.tier) && s.record.w >= 6,
    title: 'Renovación',
    text: 'Se te vence el contrato. Ponen los papeles sobre la mesa y sonríen mucho.',
    options: [
      {
        label: 'Negociar duro',
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
        apply: (s) => {
          cash(s, 25000)
          hype(s, 2)
          return 'Firmaste rápido y te metieron en la próxima cartelera. Barato y activo.'
        },
      },
    ],
  },
  {
    id: 'rival-lesionado',
    weight: 2,
    when: (s) => isUFC(s.tier),
    title: 'Se cayó tu rival',
    text: 'A tres semanas de la pelea, el rival se lesiona. Te ofrecen un reemplazo peor rankeado.',
    options: [
      {
        label: 'Aceptar al reemplazo',
        apply: (s) => {
          s.flags.easyOpp = true
          hype(s, -3)
          return 'Peleás igual. Ganes como ganes, te van a decir que le ganaste a un don nadie.'
        },
      },
      {
        label: 'Esperar al original',
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
    id: 'ojo',
    weight: 2,
    when: (s) => s.record.l >= 1,
    title: 'El ojo',
    text: 'Te desprendiste la retina. El oftalmólogo pregunta si tenés otro oficio.',
    options: [
      {
        label: 'Operarte y volver',
        apply: (s) => {
          age(s, 0.7)
          bump(s, 'iq', -0.3)
          bump(s, 'chin', -0.3)
          return 'Volviste con licencia médica renovada y una advertencia en el legajo.'
        },
      },
      {
        label: 'Cambiar el estilo: menos intercambios',
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
    when: (s) => s.hype > 45,
    title: 'La bandera',
    // `text` puede ser función cuando necesita el estado
    text: (s) => `Sos lo más grande que dio ${COUNTRIES[s.country].name} en este deporte y de golpe todos opinan de vos.`,
    options: [
      {
        label: 'Ponerte el país al hombro',
        apply: (s) => {
          hype(s, 10)
          bump(s, 'chin', 0.4)
          return 'Salís con la bandera y el estadio canta. Peleás con veinte kilos de presión encima y te gusta.'
        },
      },
      {
        label: 'Bajar el perfil',
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
        apply: (s) => {
          const i = WEIGHT_CLASSES.findIndex((w) => w.id === s.weight)
          if (i < WEIGHT_CLASSES.length - 1) s.weight = WEIGHT_CLASSES[i + 1].id
          bump(s, 'cardio', 0.8)
          bump(s, 'chin', 0.3)
          hype(s, -4)
          return `Arriba te sentís persona otra vez. En ${WEIGHT_CLASSES.find((w) => w.id === s.weight).name} pegan bastante más fuerte.`
        },
      },
      {
        label: 'Aguantar donde sos grande',
        apply: (s) => {
          bump(s, 'cardio', -0.6)
          hype(s, 3)
          return 'Seguís siendo el más grande de la división. Los cortes te van a ir comiendo de a poco.'
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
    when: (s) => s.age > 30 && isUFC(s.tier),
    title: 'El pibe nuevo',
    text: 'Llegó un pendejo de 22 al gimnasio que te pasa por arriba en el sparring y sonríe.',
    options: [
      {
        label: 'Ir a la guerra todos los martes',
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
    weight: 1,
    when: (s) => s.age > 31 && s.lossStreak >= 2,
    title: '¿Y si listo?',
    text: 'Venís de dos derrotas y te levantás con dolor de cabeza tres días por semana.',
    options: [
      {
        label: 'Una más y veo',
        apply: (s) => {
          hype(s, 2)
          bump(s, 'chin', -0.4)
          return 'Siempre es una más.'
        },
      },
      {
        label: 'Colgar los guantes',
        apply: (s) => {
          s.retired = 'Te retiraste vos, con la cabeza sana y en tus términos. Muy poca gente en este deporte puede decir eso.'
          return s.retired
        },
      },
    ],
  },
  {
    id: 'pesaje-cara-a-cara',
    weight: 3,
    when: (s) => isUFC(s.tier) || s.tier === 'dwcs',
    title: 'Cara a cara',
    text: 'En el pesaje el rival te apoya la frente en la frente y no se mueve.',
    options: [
      {
        label: 'Empujarlo',
        apply: (s) => {
          hype(s, 6)
          cash(s, -2000)
          return 'Se armó el tumulto, te multaron y la venta de la pelea se disparó.'
        },
      },
      {
        label: 'Aguantar la mirada sin moverte',
        apply: (s) => {
          bump(s, 'iq', 0.4)
          hype(s, 3)
          return 'No parpadeaste. La foto quedó para siempre.'
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
    when: () => true,
    title: 'Entre peleas',
    text: 'No hay pelea firmada y el asado del domingo es una institución.',
    options: [
      {
        label: 'Mantenerte cerca del peso todo el año',
        apply: (s) => {
          bump(s, 'cardio', 0.6)
          s.flags.disciplined = true
          return 'Nunca estás a más de cinco kilos. Aceptás peleas cuando querés.'
        },
      },
      {
        label: 'Vivir un poco',
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
    weight: 1,
    when: (s) => s.record.l >= 2 && isUFC(s.tier),
    title: 'Los jueces',
    text: 'Te robaron una decisión y todo el mundo lo vio.',
    options: [
      {
        label: 'Pedir revancha inmediata',
        apply: (s, rng) => {
          if (rng() < 0.6) {
            hype(s, 10)
            return 'Te dieron la revancha y la vendieron como injusticia reparada.'
          }
          hype(s, -4)
          return 'El rival no quiso saber nada y se fue a pelear por el título.'
        },
      },
      {
        label: 'No dejar que lleguen a los jueces nunca más',
        apply: (s) => {
          bump(s, 'striking', 0.7)
          bump(s, 'chin', -0.3)
          return 'Salís a buscar el finish siempre. Más lindo de ver, más riesgoso de vivir.'
        },
      },
    ],
  },
]
