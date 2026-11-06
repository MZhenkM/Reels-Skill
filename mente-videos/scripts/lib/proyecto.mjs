// Abre un proyecto: carga la voz y las escenas.
//
// Una escena es un archivo escenas/NN-nombre.mjs cuya exportación por defecto recibe { k, voz, mi, W, H } y devuelve
//   { empieza, transicion, dibujar(g, t, info) }
// Lo pesado se hace una vez al crear la escena; dibujar() solo depende de t, porque el render dibuja trozos en paralelo.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { H, HOGAR, W, fallo } from "./base.mjs";
import * as k from "./kit.mjs";
import { leerVoz } from "./tiempos.mjs";

const ADELANTO = 0.05; // la imagen llega justo antes que la palabra

async function kitPersonal() {
  const f = join(HOGAR, "kit.mjs");
  return existsSync(f) ? import(pathToFileURL(f).href) : {};
}

function resolver(empieza, voz, nombre) {
  try {
    if (typeof empieza === "number") return empieza;
    if (typeof empieza === "function") return empieza(voz);
    if (typeof empieza === "string") return Math.max(0, voz.en(empieza) - ADELANTO);
  } catch (e) { fallo(`Escena ${nombre}: ${e.message}`); }
  fallo(`Escena ${nombre}: «empieza» debe ser una palabra, un número o una función.`);
}

export async function abrir(dir) {
  const voz = leerVoz(dir), mi = await kitPersonal(), carpeta = join(dir, "escenas");
  const archivos = existsSync(carpeta) ? readdirSync(carpeta).filter((f) => f.endsWith(".mjs")).sort() : [];
  if (!archivos.length) fallo(`No hay escenas en ${carpeta}.`);
  const escenas = [];
  for (const nombre of archivos) {
    let e;
    try {
      const m = await import(pathToFileURL(join(carpeta, nombre)).href);
      e = await m.default({ k, voz, mi, W, H });
    } catch (err) { fallo(`La escena ${nombre} no carga: ${err.stack || err}`); }
    if (typeof e?.dibujar !== "function") fallo(`La escena ${nombre} no devuelve dibujar(g, t).`);
    escenas.push({ ...e, nombre, desde: resolver(e.empieza ?? 0, voz, nombre), transicion: e.transicion || "corte" });
  }
  escenas.sort((a, b) => a.desde - b.desde);
  escenas[0].desde = 0;
  escenas.forEach((e, i) => { e.hasta = escenas[i + 1]?.desde ?? voz.duracion; });
  return { dir, voz, escenas, duracion: voz.duracion };
}
