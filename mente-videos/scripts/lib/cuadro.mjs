// Dibuja un fotograma completo: la escena que toca y los subtítulos.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { GlobalFonts, createCanvas } from "@napi-rs/canvas";
import { prepararAcabado } from "./acabado.mjs";
import { H, W, carpetaAssets, fallo, leerAjustes } from "./base.mjs";

const MAX_PALABRAS = 4, TAM = 76;

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
  const lienzo = createCanvas(W, H), vieja = createCanvas(W, H), nueva = createCanvas(W, H), ajustes = leerAjustes();
  let acabado;
  try { acabado = prepararAcabado(ajustes.acabado); } catch (e) { fallo(e.message); }
  return { lienzo, g: lienzo.getContext("2d"), vieja, nueva, acabado, subs: bloques(proy.voz), ajustes };
}

function limpiarEstado(g) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
}

function limpiar(g) {
  limpiarEstado(g);
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

const suaveT = (u) => u * u * (3 - 2 * u);

// Cada transición recibe la escena que se va (vieja) y la que llega (nueva) ya pintadas, y u de 0 a 1.
export const TRANSICIONES = {
  corte: null,
  fundido: { dura: 0.35, pintar(g, vieja, nueva, u) {
    g.drawImage(nueva, 0, 0);
    g.globalAlpha = 1 - u;
    g.drawImage(vieja, 0, 0);
  } },
  // La nueva entra barriendo de izquierda a derecha, con un borde suave.
  barrido: { dura: 0.45, pintar(g, vieja, nueva, u) {
    u = suaveT(u);
    g.drawImage(vieja, 0, 0);
    const x = u * (W + 160) - 160;
    g.save();
    g.beginPath();
    g.rect(0, 0, Math.max(0, x), H);
    g.clip();
    g.drawImage(nueva, 0, 0);
    g.restore();
    const borde = g.createLinearGradient(x, 0, x + 160, 0);
    borde.addColorStop(0, "rgba(0,0,0,0.35)");
    borde.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = borde;
    g.fillRect(x, 0, 160, H);
  } },
  // La vieja se acerca y se desvanece; debajo, la nueva se asienta desde un poco más cerca.
  zoom: { dura: 0.4, pintar(g, vieja, nueva, u) {
    const e = suaveT(u), zn = 1.15 - 0.15 * e, zv = 1 + 0.35 * e;
    g.drawImage(nueva, (W - W * zn) / 2, (H - H * zn) / 2, W * zn, H * zn);
    g.globalAlpha = 1 - e;
    g.drawImage(vieja, (W - W * zv) / 2, (H - H * zv) / 2, W * zv, H * zv);
  } },
  // La vieja sube y la nueva entra desde abajo, como al pasar a otro vídeo.
  deslizar: { dura: 0.4, pintar(g, vieja, nueva, u) {
    const y = -suaveT(u) * H;
    g.drawImage(vieja, 0, y);
    g.drawImage(nueva, 0, y + H);
  } },
  // La nueva aparece dentro de un círculo que crece desde el centro.
  circulo: { dura: 0.45, pintar(g, vieja, nueva, u) {
    g.drawImage(vieja, 0, 0);
    g.save();
    g.beginPath();
    g.arc(W / 2, H / 2, suaveT(u) * Math.hypot(W, H) / 2, 0, Math.PI * 2);
    g.clip();
    g.drawImage(nueva, 0, 0);
    g.restore();
  } },
};

export function dibujar(proy, est, t, { conSubtitulos = true } = {}) {
  const i = indiceEn(proy, t), e = proy.escenas[i], tr = TRANSICIONES[e.transicion];
  if (tr && i > 0 && t < e.desde + tr.dura) {
    pintar(proy.escenas[i - 1], est.vieja.getContext("2d"), t);
    pintar(e, est.nueva.getContext("2d"), t);
    limpiar(est.g);
    est.g.save();
    tr.pintar(est.g, est.vieja, est.nueva, (t - e.desde) / tr.dura);
    est.g.restore();
  } else pintar(e, est.g, t);
  if (est.acabado) {
    limpiarEstado(est.g);
    est.acabado(est.g, t);
  }
  if (conSubtitulos) subtitulos(est.g, t, est);
  return est.lienzo;
}
