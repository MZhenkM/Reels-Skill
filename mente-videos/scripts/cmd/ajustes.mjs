// Ve o cambia los ajustes: ajustes voz=elevenlabs carpeta_finales=~/Videos/finales
// Las carpetas se guardan como rutas completas y se crean si no existen.
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { SUBCARPETAS_ASSETS, fallo, guardarAjustes, leerAjustes } from "../lib/base.mjs";

const ruta = (v) => resolve(v.replace(/^~(?=$|[\\/])/, homedir()));

export default function ajustes(args) {
  const a = leerAjustes();
  for (const par of args) {
    const i = par.indexOf("=");
    if (i < 1) fallo(`«${par}» no tiene la forma clave=valor.`);
    const clave = par.slice(0, i), valor = par.slice(i + 1);
    if (!(clave in a)) fallo(`No existe el ajuste «${clave}». Hay: ${Object.keys(a).join(", ")}.`);
    if (!clave.startsWith("carpeta_") || !valor) { a[clave] = valor; continue; }
    a[clave] = ruta(valor);
    mkdirSync(a[clave], { recursive: true });
    if (clave === "carpeta_assets") for (const s of SUBCARPETAS_ASSETS) mkdirSync(join(a[clave], s), { recursive: true });
  }
  if (args.length) guardarAjustes(a);
  console.log(JSON.stringify(a, null, 2));
}
