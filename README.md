<div align="center">

# 🥊 Copero UFC

**Simulador de carrera de peleador de MMA.** Elegís país, gimnasio, estilo, categoría y dificultad —
y en unos minutos de texto, decisiones y peleas round por round recorrés toda la carrera
hasta un final compartible.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tests](https://img.shields.io/badge/tests-node%3Atest-339933?logo=node.js&logoColor=white)](src/sim.test.js)
[![Dependencies](https://img.shields.io/badge/runtime%20deps-2-brightgreen.svg)](package.json)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-blueviolet.svg)](https://github.com/Martin-Ferreira-O/copero_ufc/pulls)

En la línea del [simulador de carrera de Copero](https://www.copero.com.ar/juegos/simulador-carrera).

</div>

## Empezar

```bash
npm install
npm run dev     # jugar
npm test        # 2000 carreras autojugadas por dificultad + balance + regresiones
```

> **Sin dependencias raras.** React, Vite y nada más: el motor entero (`src/sim.js`) es JavaScript plano
> con un RNG sembrado propio, y los tests corren con el `node:test` que ya trae Node.

## Cómo está armado

- `src/data.js` — **todo el contenido**: gimnasios, estilos, categorías, escalones, rivales, los ~47 eventos,
  el catálogo de la tienda (`SHOP`), los 16 logros (`TROPHIES`), los 4 planes de round, las 3 dificultades,
  los textos de round y `TUNING` (las perillas de balance).
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

**Ganar te da la agencia.** Después de cada victoria en UFC, `offers(s)` abre el **callout**: elegís tu próxima
pelea entre la que te ofrecen, un rival tres puestos arriba tuyo (con nombre y apellido, porque el top 15 es
estable), la revancha contra el que te ganó, o una pelea con poco aviso que paga más y te saltea el campamento.
Perdés y peleás contra el que te den: la agencia es el premio, no el default. Igual que la tienda, `offers` es una
función pura de `s` y no consume RNG — elegir sólo deja flags, el rival lo sigue armando `buildOpponent`.

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

| | campeón | retador | rankeado | peleador UFC | cortado | retiro forzado | regional | nunca la pegó |
|---|---|---|---|---|---|---|---|---|
| Normal | 18% | 13% | 47% | 6% | 2% | 4% | 7% | 2% |
| Difícil | 6% | 9% | 45% | 6% | 8% | 7% | 14% | 6% |
| Realista | 1% | 2% | 31% | 6% | 9% | 13% | 19% | 20% |

Son el **piso**: el bot del test nunca entra a la tienda y en el callout siempre acepta la pelea que le
ofrecen. Un jugador que gasta la plata en el gimnasio correcto y pide las peleas que le convienen llega
bastante más arriba, y esa diferencia es a propósito.

Los métodos caen cerca del deporte real: 54% decisión, 28% KO/TKO, 18% sumisión, 1% empate.

Los planes se calibraron midiendo victorias por plan contra cada arquetipo de rival, no a ojo. Contra un striker
mejor que vos, llevarlo al piso pasa de 37% a 63% de victorias; contra un luchador, tirar derribos te hunde de 52%
a 9%. Ahí está el juego: el scouting que te da el Fight IQ vale plata.

La carrera es **reproducible por semilla**: misma semilla + mismas decisiones + mismos planes = misma carrera.
La semilla aparece en la card final y en el texto que se copia.

## Lo que devuelve la plata y lo que se colecciona

Finalizar o pelear una guerra en UFC paga **bono de la noche** (`TUNING.bonusBase` + una parte de la bolsa;
la guerra lo cobra aunque pierdas). Los **16 logros** de `TROPHIES` se chequean después de cada pelea, saltan
una sola vez, van al historial y a la card final; su `when` tiene que ser puro, igual que el de los eventos.
Siendo campeón con tres títulos aparece **subir de categoría**: entregás el cinturón, entrás #8 arriba y si lo
ganás de nuevo el final es *doble campeón*.

La carrera **se guarda sola** en `localStorage`: todo el estado del RNG es un entero (`s.rng.state()`), así que
recargar la pestaña devuelve exactamente el mismo paso y la misma carrera. `pending` no se guarda — trae
funciones — y `nextStep` lo regenera igual.

## Nota sobre nombres

Usa marcas y peleadores reales (UFC, gimnasios, rivales rankeados; los seis nombres de cada categoría se mapean
a los puestos #1 a #6 del ranking, así la pelea de título es contra el campeón de verdad). Es un juego de fans sin
fines comerciales; si eso llegara a molestar a alguien, los nombres viven en `REAL_OPPONENTS` y `GYMS` dentro de
`src/data.js` y se reemplazan editando dos arrays.

## Contribuir

El contenido es data, no código: eventos, rivales, ítems de tienda y logros son objetos en `src/data.js` y el
motor no conoce ningún nombre propio. Agregá el objeto, corré `npm test` (los 2000 runs por dificultad avisan si
rompiste el balance) y mandá el PR.

## Licencia

[MIT](LICENSE) para el código.

Proyecto de fans, no oficial y sin fines comerciales: no está afiliado ni respaldado por UFC, Zuffa/TKO, ni por
ninguno de los gimnasios, promotoras o peleadores nombrados. Las marcas son de sus respectivos dueños y se usan
de forma descriptiva; la licencia MIT cubre el código, no las marcas.
