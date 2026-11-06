# Cómo se programa una escena

El lienzo mide 1080 × 1920. Cada escena es un archivo `escenas/NN-nombre.mjs`:

```js
export default function escena({ k, voz, mi, W, H }) {
  // Aquí va lo pesado: cargar imágenes, generar listas con k.azar(semilla).
  return {
    empieza: "palabra",     // "palabra", "palabra#2", un número de segundos o (voz) => segundos
    transicion: "corte",    // "corte" o "fundido"
    dibujar(g, t, info) {   // t: segundo del vídeo. info: { inicio, fin, u } con u de 0 a 1 en la escena
    },
  };
}
```

## Reglas técnicas

- `dibujar` solo puede depender de `t`. El render reparte el vídeo entre hilos, así que nada se guarda entre fotogramas.
- Usa `k.azar(semilla)` en lugar de `Math.random`, o cada hilo dibujará algo distinto.
- Los subtítulos los pone el motor. Déjales libre su zona: y 1180-1360 con `abajo`, y 310-490 con `arriba`.
- Lo importante debe quedar entre y 270 e y 1440, y lejos del borde derecho, donde las apps ponen sus botones.
- Las escenas pueden compartir código con un archivo propio del proyecto, por ejemplo `escenas/comun/objetos.mjs`. Solo
  se cargan como escenas los `.mjs` que están directamente en `escenas/`.

## La voz

- `voz.en("palabra")`, `voz.en("palabra", 2)`: cuándo empieza. `voz.finDe("palabra")`: cuándo acaba.
- `voz.frase(3)`: `{ inicio, fin, palabras, en(), finDe() }`. Buscar dentro de una frase evita coger otra aparición.
- `voz.duracion`: lo que dura todo.

`empieza: "palabra"` busca en toda la voz y coge la primera aparición. Con palabras comunes («el», «y», «por») eso
puede ser otra frase, y la escena empezaría antes de tiempo. Para abrir una frase usa
`empieza: (v) => v.frase(8).inicio - 0.05`.

Las búsquedas ignoran mayúsculas, tildes y signos. Calcula los momentos con estas funciones en lugar de escribir
segundos a mano: así la imagen sigue a la voz cuando el guion cambia.

## El kit (`k`)

- Movimiento: `lim`, `mezcla`, `tramo(t, a, b)`, `suave`, `entra`, `sale`, `rebote`, `curva(t, [[t, valor], ...])`.
- Azar, lienzos e imágenes: `azar(semilla)`, `lienzo(w, h)`, `asset(ruta)`, `cargar(ruta)`.
- Cámara: `camara(pos, mira, zoom)` devuelve `{ proyecta([x, y, z]) }`, que da `{ x, y, z, escala }` o `null`.
- Dibujo: `fondo(g, colores, angulo)`, `brillo(g, x, y, r, color, alfa)`, `bola(g, x, y, r, claro, oscuro)`,
  `redondo(g, x, y, w, h, r)`, `particulas(g, opciones)`, `texto(g, cadena, x, y, opciones)`.

`g` es un contexto de canvas 2D normal: degradados, caminos, `globalCompositeOperation`, `drawImage`.

## Tu propio kit (`mi`)

El kit trae lo mínimo a propósito. Lo que dibujes y quieras reutilizar va en `~/.mente-videos/kit.mjs`, y las escenas lo
reciben como `mi`:

```js
// ~/.mente-videos/kit.mjs
export function miPersonaje(g, x, y, escala) { /* ... */ }
```

Cuando un objeto salga bien en un vídeo, ofrece al creador pasarlo ahí. Con el tiempo, ese archivo es su estilo.

## Los assets del creador

Ejecuta `assets` para ver qué hay en su carpeta.

- **Texturas e imágenes:** `await k.asset("texturas/madera.jpg")` al crear la escena, con la función declarada `async`.
- **Letras:** los `.ttf` y `.otf` de `letras/` se cargan solos. Elige una con `ajustes letra="Nombre de la letra"`.
- **Efectos y audios:** en `sonido.mjs`, pídelos por su nombre de archivo sin extensión:
  `{ efecto: "mi-musica", t: 0, db: -22 }`.

Apunta en `fuentes.md` la licencia de cualquier material que no sea del creador.
