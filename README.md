# Copero UFC

Simulador de carrera de peleador de MMA, en la línea del [simulador de carrera de Copero](https://www.copero.com.ar/juegos/simulador-carrera):
elegís país, gimnasio, estilo base, categoría y dificultad, y en unos minutos de texto, decisiones y peleas
round por round recorrés toda la carrera hasta un final compartible.

```bash
npm install
npm run dev     # jugar
npm test        # 2000 carreras autojugadas por dificultad + balance + regresiones
```

## Cómo está armado

- `src/data.js` — **todo el contenido**: gimnasios, estilos, categorías, escalones, rivales, los ~42 eventos,
  el catálogo de la tienda (`SHOP`), los 4 planes de round, las 3 dificultades, los textos de round y `TUNING`
  (las perillas de balance).
- `src/sim.js` — el motor: RNG sembrado, pelea round por round, ranking, lesiones, progresión, finales.
- `src/App.jsx` — las tres pantallas (setup, carrera, card final) y la esquina interactiva.

Agregar contenido es empujar objetos a los arrays de `data.js`; el motor no conoce ningún nombre propio.

## Las tres ideas del diseño

**Nada se decide a ciegas.** Cada opción de cada evento declara su `fx`: el efecto real, en el botón, antes de
apretarlo. Antes de cada pelea, `stakes(s)` dice qué se juega — "ganás y ascendés", "perdés y te cortan",
"te faltan 2 victorias y 9 de hype" — leyendo las mismas reglas que después ejecuta `advance()`. El escalón del
riel derecho muestra el gate vivo. No hay condiciones ocultas.

**La plata se gasta cuando querés.** El botón *Gastar plata* del riel derecho abre la tienda (`catalog(s)` sobre
`SHOP` + los gimnasios del escalón siguiente): equipo, servicios de campamento, prensa y mudarte de gimnasio.
Sigue la misma regla que los eventos — el precio y el efecto real están en el botón antes de apretarlo. El mismo
ítem **cuesta más cuanto mejor estás** en ese stat, así que la plata arregla debilidades barato y gilda fortalezas
caro; no hace falta un tope. Comprar no consume RNG: la carrera sigue siendo reproducible por semilla.

**Nada llega después del hecho.** Las consecuencias de carrera (ascenso, corte, democión, ranking) se muestran
**dentro del veredicto** de la pelea, no como una nota que aparece cuando ya cerraste. Los eventos de la semana de
pelea (`slot: 'week'`) modifican **la pelea que sigue inmediatamente**; los de campamento (`slot: 'camp'`) mueven
stats entre peleas. Los eventos que reaccionan a algo leen `s.last`, no agregados históricos: el evento del robo
de los jueces sólo aparece si te robaron *esa* pelea.

**El jugador es la esquina.** La pelea no es una cinemática: antes de cada round elegís uno de los cuatro planes
de `PLANS` y el motor resuelve ese round con tu elección. Presionar da más daño y comés más; boxear afuera gana
puntos y gasta poco; llevarlo al piso necesita grappling de verdad (buscar el suelo siendo el peor luchador te
deja abajo); aguantar el round recupera gas y puede sacarte el `hurt` de encima al precio de regalar el round.

## Los stats, y por qué cada uno importa

| Stat | Qué hace |
|---|---|
| Striking | Peso del reparto de daño, elevado a 2.5: una ventaja chica duele mucho. |
| Grappling | Curva continua de probabilidad de que el round vaya al piso, más control y sumisión. |
| Cardio | `sf = 0.38 + 0.62 · gas`. Cada plan drena distinto: presionar y derribar te vacían. |
| Mentón | Vida máxima y la tirada de salvación cuando te tiran. Decide si te levantás. |
| Fight IQ | Ataque, defensa (`guard`), qué tan bien te sale el plan (`planPower`) y cuánto scouting ves del rival. |

`effStats(s)` = los stats de la planilla menos las lesiones activas. Las lesiones duran N **peleas**, se ven
siempre en la ficha y podés elegir pelear roto.

## Dificultad

`normal` / `duro` / `realista` cambian nivel del rival, ritmo de mejora, cuántas derrotas aguanta el contrato y la
plata. Reparto de finales medido con 2000 carreras por dificultad **jugadas por un jugador competente** (el que
sigue lo que le sugiere la esquina); `npm test` lo imprime y aparte corre 400 carreras con planes al azar para que
ninguna secuencia rara rompa el motor:

| | campeón | retador | rankeado | cortado | retiro forzado | regional | nunca la pegó |
|---|---|---|---|---|---|---|---|
| Normal | 20% | 13% | 46% | 2% | 3% | 7% | 2% |
| Difícil | 7% | 9% | 45% | 8% | 7% | 13% | 6% |
| Realista | 1% | 2% | 31% | 9% | 13% | 19% | 19% |

Son el **piso**: el bot del test nunca entra a la tienda. Un jugador que gasta la plata en el gimnasio correcto
llega bastante más arriba, y esa diferencia es a propósito.

Los métodos caen cerca del deporte real: 54% decisión, 28% KO/TKO, 18% sumisión, 1% empate.

Los planes se calibraron midiendo victorias por plan contra cada arquetipo de rival, no a ojo. Contra un striker
mejor que vos, llevarlo al piso pasa de 37% a 63% de victorias; contra un luchador, tirar derribos te hunde de 52%
a 9%. Ahí está el juego: el scouting que te da el Fight IQ vale plata.

La carrera es **reproducible por semilla**: misma semilla + mismas decisiones + mismos planes = misma carrera.
La semilla aparece en la card final y en el texto que se copia.

## Nota sobre nombres

Usa marcas y peleadores reales (UFC, gimnasios, rivales rankeados; los seis nombres de cada categoría se mapean
a los puestos #1 a #6 del ranking, así la pelea de título es contra el campeón de verdad). Es un juego de fans sin
fines comerciales; si eso llegara a molestar a alguien, los nombres viven en `REAL_OPPONENTS` y `GYMS` dentro de
`src/data.js` y se reemplazan editando dos arrays.
