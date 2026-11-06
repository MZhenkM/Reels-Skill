// Dibuja un fotograma completo: la escena que toca y los subtítulos.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { GlobalFonts, createCanvas } from "@napi-rs/canvas";
import { H, W, carpetaAssets, leerAjustes } from "./base.mjs";

const FUNDIDO = 0.35, MAX_PALABRAS = 4, TAM = 76;

function registrarLetras() {
  const carpeta = carpetaAssets("letras");
  if (!existsSync(carpeta)) return;
  for (const f of readdirSync(carpeta)) if (/\.(ttf|otf)$/i.test(f)) GlobalFonts.registerFromPath(join(carpeta, f));
}

// Agrupa las palabras en bloques cortos, sin cruzar de una frase a otra.
function bloques(voz) {
  const lista = [];
  for (const f of voz.frases) {
    for (let i = 0; i < f.palabras.length; i += MAX_PALABRAS) {
      const palabras = f.palabras.slice(i, i + MAX_PALABRAS);
      lista.push({ palabras, inicio: palabras[0].inicio, fin: palabras.at(-1).fin + 0.15 });
    }
  }
  return lista;
}

export function preparar(proy) {
  registrarLetras();
  const lienzo = createCanvas(W, H), aparte = createCanvas(W, H);
  return { lienzo, g: lienzo.getContext("2d"), aparte, subs: bloques(proy.voz), ajustes: leerAjustes() };
}

function limpiar(g) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
}

function pintar(e, g, t) {
  limpiar(g);
  g.save();
  try { e.dibujar(g, t, { inicio: e.desde, fin: e.hasta, u: (t - e.desde) / (e.hasta - e.desde) }); }
  catch (err) { err.message = `escena ${e.nombre}, segundo ${t.toFixed(2)}: ${err.message}`; throw err; }
  g.restore();
}

function subtitulos(g, t, est) {
  const { ajustes } = est, b = est.subs.find((x) => t >= x.inicio && t < x.fin);
  if (!b || ajustes.subtitulos === "no") return;
  g.save();
  g.font = `800 ${TAM}px ${ajustes.letra}`;
  g.textBaseline = "middle";
  g.lineJoin = "round";
  const espacio = g.measureText(" ").width, lineas = [[]];
  let ancho = 0;
  for (const p of b.palabras) {
    const w = g.measureText(p.texto).width;
    if (ancho + w > 900 && lineas.at(-1).length) { lineas.push([]); ancho = 0; }
    lineas.at(-1).push({ ...p, w });
    ancho += w + espacio;
  }
  const y0 = (ajustes.subtitulos === "arriba" ? 400 : 1270) - ((lineas.length - 1) * TAM * 1.2) / 2;
  lineas.forEach((linea, i) => {
    let x = 540 - (linea.reduce((s, p) => s + p.w, 0) + espacio * (linea.length - 1)) / 2;
    const y = y0 + i * TAM * 1.2;
    for (const p of linea) {
      g.strokeStyle = "rgba(0,0,0,.85)";
      g.lineWidth = 14;
      g.strokeText(p.texto, x, y);
      g.fillStyle = p.destacada || (t >= p.inicio && t < p.fin) ? ajustes.color_acento : ajustes.color_texto;
      g.fillText(p.texto, x, y);
      x += p.w + espacio;
    }
  });
  g.restore();
}

export function indiceEn(proy, t) {
  let i = 0;
  while (i + 1 < proy.escenas.length && t >= proy.escenas[i + 1].desde) i++;
  return i;
}

export function dibujar(proy, est, t, { conSubtitulos = true } = {}) {
  const i = indiceEn(proy, t), e = proy.escenas[i];
  pintar(e, est.g, t);
  if (e.transicion === "fundido" && i > 0 && t < e.desde + FUNDIDO) {
    pintar(proy.escenas[i - 1], est.aparte.getContext("2d"), t);
    est.g.globalAlpha = 1 - (t - e.desde) / FUNDIDO;
    est.g.drawImage(est.aparte, 0, 0);
    est.g.globalAlpha = 1;
  }
  if (conSubtitulos) subtitulos(est.g, t, est);
  return est.lienzo;
}
