// Genera sonidos/efectos.wav desde sonido.mjs del proyecto.
// sonido.mjs exporta una función ({ voz }) => [{ efecto, t, db }]. db es el nivel: -8 fuerte, -14 normal, -20 suave.
import { existsSync, readdirSync } from "node:fs";
import { join, parse } from "node:path";
import { pathToFileURL } from "node:url";
import { SR, carpetaAssets, carpetaDe, fallo, guardarWav, leerArgs, leerMono } from "../lib/base.mjs";
import { EFECTOS } from "../lib/sintes.mjs";
import { leerVoz } from "../lib/tiempos.mjs";

function propios() {
  const mapa = {};
  for (const carpeta of [carpetaAssets("audios"), carpetaAssets("efectos")]) {
    if (existsSync(carpeta)) for (const f of readdirSync(carpeta)) if (/\.(wav|mp3|m4a|ogg)$/i.test(f)) mapa[parse(f).name] = join(carpeta, f);
  }
  return mapa;
}

export default async function sonido(args) {
  const { sueltos, op } = leerArgs(args), mios = propios();
  if (op.catalogo) { console.log([...Object.keys(EFECTOS), ...Object.keys(mios)].join("\n")); return; }
  const dir = carpetaDe(sueltos[0]), voz = leerVoz(dir), f = join(dir, "sonido.mjs");
  if (!existsSync(f)) fallo("Este proyecto no tiene sonido.mjs.");
  const lista = (await import(pathToFileURL(f).href)).default({ voz });
  const pista = new Float32Array(Math.round(voz.duracion * SR));
  for (const e of lista) {
    const fuente = mios[e.efecto] ? leerMono(mios[e.efecto]) : EFECTOS[e.efecto]?.();
    if (!fuente) fallo(`No existe el efecto «${e.efecto}».`);
    if (!Number.isFinite(e.t)) fallo(`El efecto «${e.efecto}» no tiene un segundo válido.`);
    const nivel = 10 ** ((e.db ?? -14) / 20), inicio = Math.round(e.t * SR);
    for (let i = 0; i < fuente.length && inicio + i < pista.length; i++) if (inicio + i >= 0) pista[inicio + i] += fuente[i] * nivel;
  }
  guardarWav(join(dir, "sonidos", "efectos.wav"), pista);
  console.log(`${lista.length} efectos en ${join(dir, "sonidos", "efectos.wav")}`);
}
