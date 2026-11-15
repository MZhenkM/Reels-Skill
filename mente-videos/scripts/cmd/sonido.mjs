// Genera sonidos/efectos.wav desde sonido.mjs del proyecto y desde el `sonido` de cada escena.
// sonido.mjs exporta una función ({ voz }) => lista. Cada elemento es:
//   { efecto, t, db }    un efecto en el segundo t. db es el nivel: -8 fuerte, -14 normal, -20 suave.
//   { musica, db }       música de fondo durante todo el vídeo; baja sola cuando habla la voz.
import { existsSync, readdirSync } from "node:fs";
import { join, parse } from "node:path";
import { pathToFileURL } from "node:url";
import { SR, carpetaAssets, carpetaDe, fallo, guardarWav, leerArgs, leerMono } from "../lib/base.mjs";
import { abrir } from "../lib/proyecto.mjs";
import { EFECTOS, MUSICAS } from "../lib/sintes.mjs";

const ENTRA = 1, SALE = 2.5; // segundos de fundido de la música al principio y al final
const BAJADA_DB = -12; // cuánto baja la música mientras se habla

function propios() {
  const mapa = {};
  for (const carpeta of [carpetaAssets("audios"), carpetaAssets("efectos")]) {
    if (existsSync(carpeta)) for (const f of readdirSync(carpeta)) if (/\.(wav|mp3|m4a|ogg)$/i.test(f)) mapa[parse(f).name] = join(carpeta, f);
  }
  return mapa;
}

// Curva de volumen que vale 1 en silencio y baja cuando hay voz, sin saltos bruscos.
function bajarConVoz(voz) {
  const n = voz.length, curva = new Float32Array(n), abajo = 10 ** (BAJADA_DB / 20);
  const ataque = Math.exp(-1 / (0.08 * SR)), suelta = Math.exp(-1 / (0.45 * SR)), seguir = Math.exp(-1 / (0.15 * SR));
  let env = 0, g = 1;
  for (let i = 0; i < n; i++) {
    const a = Math.abs(voz[i]);
    env = a > env ? a : env * seguir;
    const objetivo = env > 0.02 ? abajo : 1;
    g = objetivo < g ? objetivo + (g - objetivo) * ataque : objetivo + (g - objetivo) * suelta;
    curva[i] = g;
  }
  return curva;
}

function musica(nombre, n, mios) {
  if (MUSICAS[nombre]) return MUSICAS[nombre](n / SR);
  if (!mios[nombre]) fallo(`No existe la música «${nombre}». Hay: ${[...Object.keys(MUSICAS), ...Object.keys(mios)].join(", ")}.`);
  const original = leerMono(mios[nombre]), m = new Float32Array(n);
  for (let i = 0; i < n; i++) m[i] = original[i % original.length]; // si es más corta que el vídeo, se repite
  return m;
}

export default async function sonido(args) {
  const { sueltos, op } = leerArgs(args), mios = propios();
  if (op.catalogo) {
    console.log(["Efectos:", ...Object.keys(EFECTOS), ...Object.keys(mios), "", "Músicas:", ...Object.keys(MUSICAS), ...Object.keys(mios)].join("\n"));
    return;
  }
  const dir = carpetaDe(sueltos[0]), proy = await abrir(dir), { voz } = proy, f = join(dir, "sonido.mjs");
  const lista = existsSync(f) ? [...(await import(pathToFileURL(f).href)).default({ voz })] : [];
  // Las escenas pueden traer su propio sonido: `sonido: "whoosh"` o `sonido: { efecto: "whoosh", db: -18 }`.
  for (const e of proy.escenas) {
    if (!e.sonido) continue;
    const s = typeof e.sonido === "string" ? { efecto: e.sonido } : e.sonido;
    lista.push({ db: -16, ...s, t: e.desde + (s.t ?? -0.05) });
  }
  if (!lista.length) fallo("No hay sonidos: ni sonido.mjs ni escenas con `sonido`.");

  const pista = new Float32Array(Math.round(voz.duracion * SR));
  let curva;
  for (const e of lista) {
    const nivel = 10 ** ((e.db ?? -14) / 20);
    if (e.musica) {
      curva ??= bajarConVoz(leerMono(join(dir, "voz", "voz.wav")));
      const m = musica(e.musica, pista.length, mios);
      for (let i = 0; i < pista.length; i++) {
        const t = i / SR, fundido = Math.min(1, t / ENTRA, (voz.duracion - t) / SALE);
        pista[i] += m[i] * nivel * Math.max(0, fundido) * (curva[i] ?? 1);
      }
      continue;
    }
    const fuente = mios[e.efecto] ? leerMono(mios[e.efecto]) : EFECTOS[e.efecto]?.();
    if (!fuente) fallo(`No existe el efecto «${e.efecto}».`);
    if (!Number.isFinite(e.t)) fallo(`El efecto «${e.efecto}» no tiene un segundo válido.`);
    const inicio = Math.round(e.t * SR);
    for (let i = 0; i < fuente.length && inicio + i < pista.length; i++) if (inicio + i >= 0) pista[inicio + i] += fuente[i] * nivel;
  }
  guardarWav(join(dir, "sonidos", "efectos.wav"), pista);
  console.log(`${lista.length} sonidos en ${join(dir, "sonidos", "efectos.wav")}`);
}
