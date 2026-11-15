// Dibuja la portada a partir de portada.mjs del proyecto:
//   t         segundo del vídeo que sirve de fondo
//   titulo    líneas cortas, de 1 a 4
//   resalta   número de línea (o lista) que va en color de acento
//   posicion  "abajo" (por defecto), "arriba" o "centro": dónde va el título
//   etiqueta  texto pequeño opcional encima del título, como «CIENCIA»
//   zoom, foco  acerca el fondo hacia [x, y] para encuadrar lo importante (por defecto 1 y [540, 960])
//   mover     [dx, dy] desplaza el fondo, por ejemplo hacia arriba para dejar sitio al título
//   color, acento  sustituyen a color_texto y color_acento de los ajustes
//   dibujar(g, { k, W, H })  opcional: dibuja lo que quieras encima al final
// Las apps recortan la portada a 3:4 en el perfil (y de 240 a 1680): el título se queda dentro de esa zona.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { H, W, fallo, leerAjustes } from "./base.mjs";
import { dibujar, preparar } from "./cuadro.mjs";
import * as k from "./kit.mjs";

const ANCHO_MAX = 920, TAM_MAX = 150;

export async function leerPortada(dir) {
  const f = join(dir, "portada.mjs");
  return existsSync(f) ? (await import(pathToFileURL(f).href)).default : null;
}

function oscurecer(g, posicion) {
  const d = posicion === "arriba" ? g.createLinearGradient(0, 0, 0, H * 0.55)
    : posicion === "centro" ? null
    : g.createLinearGradient(0, H, 0, H * 0.42);
  if (!d) {
    const r = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, H * 0.6);
    r.addColorStop(0, "rgba(0,0,0,0.55)");
    r.addColorStop(1, "rgba(0,0,0,0.15)");
    g.fillStyle = r;
  } else {
    d.addColorStop(0, "rgba(0,0,0,0.82)");
    d.addColorStop(0.55, "rgba(0,0,0,0.45)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
  }
  g.fillRect(0, 0, W, H);
}

export async function pintarPortada(proy, p) {
  if (!Array.isArray(p.titulo) || !p.titulo.length) fallo("portada.mjs necesita `titulo`: una lista de líneas.");
  const a = leerAjustes(), est = preparar(proy), lienzo = createCanvas(W, H), g = lienzo.getContext("2d");
  const posicion = p.posicion || "abajo", color = p.color || a.color_texto, acento = p.acento || a.color_acento;
  const resalta = new Set([].concat(p.resalta ?? []));

  // Fondo: el fotograma elegido, acercado hacia el foco si se pide.
  const z = p.zoom || 1, [fx, fy] = p.foco || [W / 2, H / 2], [dx, dy] = p.mover || [0, 0];
  g.save();
  g.translate(fx + dx, fy + dy);
  g.scale(z, z);
  g.translate(-fx, -fy);
  g.drawImage(dibujar(proy, est, p.t ?? 0, { conSubtitulos: false }), 0, 0);
  g.restore();
  oscurecer(g, posicion);

  // Título: el tamaño se ajusta para que la línea más larga quepa en el ancho.
  const letra = (tam) => `900 ${tam}px ${a.letra}`;
  g.font = letra(100);
  const mayor = Math.max(...p.titulo.map((l) => g.measureText(l).width));
  const tam = Math.min(TAM_MAX, Math.floor((100 * ANCHO_MAX) / mayor)), alto = tam * 1.02;
  const bloque = alto * p.titulo.length + (p.etiqueta ? 90 : 0);
  const y0 = posicion === "arriba" ? 290 : posicion === "centro" ? H / 2 - bloque / 2 : 1650 - bloque;

  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  let y = y0;
  if (p.etiqueta) {
    g.font = `800 44px ${a.letra}`;
    const w = g.measureText(p.etiqueta).width + 56;
    g.fillStyle = acento;
    k.redondo(g, W / 2 - w / 2, y, w, 70, 35);
    g.fill();
    g.fillStyle = "#111";
    g.fillText(p.etiqueta, W / 2, y + 37);
    y += 90;
  }
  g.font = letra(tam);
  p.titulo.forEach((linea, i) => {
    const cy = y + alto * (i + 0.5);
    g.save();
    g.shadowColor = "rgba(0,0,0,0.55)";
    g.shadowBlur = 40;
    g.shadowOffsetY = 10;
    g.strokeStyle = "rgba(0,0,0,0.9)";
    g.lineWidth = tam * 0.14;
    g.strokeText(linea, W / 2, cy);
    g.restore();
    g.fillStyle = resalta.has(i) ? acento : color;
    g.fillText(linea, W / 2, cy);
  });

  if (typeof p.dibujar === "function") {
    g.save();
    p.dibujar(g, { k, W, H });
    g.restore();
  }
  return lienzo;
}
