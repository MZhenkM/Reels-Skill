// El acceso a los tiempos de la voz que reciben las escenas.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fallo } from "./base.mjs";

const normal = (s) => String(s).toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]/gu, "");

function buscar(palabras, consulta, n = 1) {
  const [base, sufijo] = String(consulta).split("#");
  const objetivo = normal(base), veces = Number(sufijo || n);
  const hallazgos = palabras.filter((p) => normal(p.texto) === objetivo);
  if (hallazgos.length < veces) throw new Error(`La palabra «${consulta}» no aparece en la voz (veces encontradas: ${hallazgos.length}).`);
  return hallazgos[veces - 1];
}

export function crearVoz(datos) {
  const palabras = datos.frases.flatMap((f) => f.palabras);
  const frases = datos.frases.map((f) => ({
    ...f,
    en: (p, n) => buscar(f.palabras, p, n).inicio,
    finDe: (p, n) => buscar(f.palabras, p, n).fin,
  }));
  return {
    duracion: datos.duracion, palabras, frases,
    en: (p, n) => buscar(palabras, p, n).inicio,
    finDe: (p, n) => buscar(palabras, p, n).fin,
    frase(n) {
      if (!frases[n - 1]) throw new Error(`No existe la frase ${n}: hay ${frases.length}.`);
      return frases[n - 1];
    },
  };
}

export function leerVoz(dir) {
  const f = join(dir, "voz", "tiempos.json");
  if (!existsSync(f)) fallo("Este proyecto aún no tiene voz: ejecuta el comando «voz».");
  return crearVoz(JSON.parse(readFileSync(f, "utf8")));
}
