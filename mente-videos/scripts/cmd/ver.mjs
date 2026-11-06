// Dibuja fotogramas para mirarlos: uno grande, o una hoja de miniaturas.
//   ver P 12.4 | ver P 3-6 [--cada 0.25] | ver P frase 5 | ver P escenas | ver P   (todo el vídeo)
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { carpetaDe, fallo, leerArgs } from "../lib/base.mjs";
import { dibujar, preparar } from "../lib/cuadro.mjs";
import { abrir } from "../lib/proyecto.mjs";

const COLS = 6, TW = 270, TH = 480;
const rango = (a, b, cada) => { const l = []; for (let t = a; t < b; t += cada) l.push(t); return l; };

function instantes(proy, que, op) {
  const [modo, valor] = que;
  if (modo === "escenas") return { nombre: "escenas", ts: proy.escenas.flatMap((e) => [e.desde + 0.02, (e.desde + e.hasta) / 2, e.hasta - 0.04]) };
  if (modo === "frase") {
    const f = proy.voz.frase(Number(valor));
    return { nombre: `frase-${valor}`, ts: rango(f.inicio, f.fin + 0.01, Number(op.cada || (f.fin - f.inicio) / 11 || 0.2)) };
  }
  const m = /^([\d.]+)-([\d.]+)$/.exec(modo || "");
  if (m) return { nombre: `tramo-${m[1]}-${m[2]}`, ts: rango(Number(m[1]), Number(m[2]), Number(op.cada || 0.25)) };
  if (modo && !Number.isNaN(Number(modo))) return { nombre: `t-${modo}`, ts: [Number(modo)], grande: true };
  if (modo) fallo(`No entiendo «${modo}».`);
  return { nombre: "todo", ts: rango(0, proy.duracion, Math.max(0.5, proy.duracion / 36)) };
}

export default async function ver(args) {
  const { sueltos, op } = leerArgs(args);
  const dir = carpetaDe(sueltos[0]), proy = await abrir(dir), est = preparar(proy);
  const { nombre, ts, grande } = instantes(proy, sueltos.slice(1), op);
  const carpeta = join(dir, "revisar"), salida = join(carpeta, `${nombre}.jpg`);
  mkdirSync(carpeta, { recursive: true });
  if (grande) {
    writeFileSync(salida, await dibujar(proy, est, ts[0]).encode("jpeg", 88));
    console.log(salida);
    return;
  }
  const filas = Math.ceil(ts.length / COLS), hoja = createCanvas(COLS * TW, filas * TH), g = hoja.getContext("2d");
  ts.forEach((t, i) => {
    const x = (i % COLS) * TW, y = Math.floor(i / COLS) * TH;
    g.drawImage(dibujar(proy, est, Math.min(t, proy.duracion - 0.01)), x, y, TW - 2, TH - 2);
    g.fillStyle = "rgba(0,0,0,.7)";
    g.fillRect(x, y, 84, 30);
    g.fillStyle = "#fff";
    g.font = "20px sans-serif";
    g.fillText(`${t.toFixed(2)}s`, x + 6, y + 22);
  });
  writeFileSync(salida, await hoja.encode("jpeg", 82));
  console.log(salida);
}
