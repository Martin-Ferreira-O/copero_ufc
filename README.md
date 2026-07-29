# Copero UFC

Simulador de carrera de peleador de MMA, en la línea del [simulador de carrera de Copero](https://www.copero.com.ar/juegos/simulador-carrera):
elegís país, gimnasio, estilo base y categoría, y en unos minutos de texto, decisiones y peleas
round por round recorrés toda la carrera hasta un final compartible.

```bash
npm install
npm run dev     # jugar
npm test        # 2000 carreras autojugadas: nada crashea y el balance no se desmadra
```

## Cómo está armado

- `src/data.js` — **todo el contenido**: gimnasios, estilos, categorías, escalones, rivales, los ~36 eventos y `TUNING` (las perillas de balance).
- `src/sim.js` — el motor: RNG sembrado, pelea round por round, progresión por escalones, finales.
- `src/App.jsx` — las tres pantallas (setup, carrera, card final).

Agregar contenido es empujar objetos a los arrays de `data.js`; el motor no conoce ningún nombre propio.

La carrera es **reproducible por semilla**: misma semilla + mismas decisiones = misma carrera.
La semilla aparece en la card final y en el texto que se copia.

## Nota sobre nombres

Usa marcas y peleadores reales (UFC, gimnasios, rivales rankeados). Es un juego de fans sin fines
comerciales; si eso llegara a molestar a alguien, los nombres viven en `REAL_OPPONENTS` y `GYMS`
dentro de `src/data.js` y se reemplazan editando dos arrays.
