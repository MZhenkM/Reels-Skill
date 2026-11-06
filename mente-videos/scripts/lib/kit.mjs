// Kit básico de dibujo. Es deliberadamente pequeño: el estilo de cada creador se construye en su propio
// ~/.mente-videos/kit.mjs, que las escenas reciben como `mi`.
import { existsSync } from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { carpetaAssets } from "./base.mjs";

// --- Tiempo y movimiento
export const lim = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mezcla = (a, b, u) => a + (b - a) * u;
export const tramo = (t, a, b) => lim((t - a) / (b - a));
export const suave = (u) => u * u * (3 - 2 * u);
export const entra = (u) => 1 - (1 - u) ** 3;
export const sale = (u) => u ** 3;
export const rebote = (u) => 1 + 2.7 * (u - 1) ** 3 + 1.7 * (u - 1) ** 2;

// Valor que pasa por [[t, valor], ...] sin tirones.
export function curva(t, puntos) {
  if (t <= puntos[0][0]) return puntos[0][1];
  for (let i = 1; i < puntos.length; i++) {
    const [t0, v0] = puntos[i - 1], [t1, v1] = puntos[i];
    if (t <= t1) return mezcla(v0, v1, suave(tramo(t, t0, t1)));
  }
  return puntos.at(-1)[1];
}

// --- Azar con semilla: el mismo fotograma debe salir igual en cualquier hilo
export function azar(semilla = 1) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Lienzos e imágenes
export const lienzo = (w, h) => createCanvas(w, h);
export const cargar = (ruta) => loadImage(ruta);

// Carga una imagen de la carpeta de assets del creador: await k.asset("texturas/madera.jpg")
export function asset(ruta) {
  const f = carpetaAssets(ruta);
  if (!existsSync(f)) throw new Error(`No existe el asset «${ruta}» en ${carpetaAssets()}.`);
  return loadImage(f);
}

// --- Cámara 3D sencilla: el mundo es [x, y, z] e y crece hacia arriba
export function camara(pos, mira, zoom = 1100) {
  const resta = (a, b) => a.map((v, i) => v - b[i]);
  const unit = (a) => { const n = Math.hypot(...a) || 1; return a.map((v) => v / n); };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const f = unit(resta(mira, pos)), r = unit(cruz(f, [0, 1, 0])), u = cruz(r, f);
  return {
    proyecta(p) {
      const d = resta(p, pos), z = punto(d, f);
      if (z <= 0.01) return null;
      const escala = zoom / z;
      return { x: 540 + punto(d, r) * escala, y: 960 - punto(d, u) * escala, z, escala };
    },
  };
}

// --- Dibujo
export function fondo(g, colores, angulo = 90) {
  const a = (angulo * Math.PI) / 180, dx = Math.cos(a) * 960, dy = Math.sin(a) * 960;
  const d = g.createLinearGradient(540 - dx, 960 - dy, 540 + dx, 960 + dy);
  colores.forEach((c, i) => d.addColorStop(i / Math.max(1, colores.length - 1), c));
  g.fillStyle = d;
  g.fillRect(0, 0, 1080, 1920);
}

export function brillo(g, x, y, r, color, alfa = 1) {
  g.save();
  g.globalCompositeOperation = "lighter";
  g.globalAlpha *= alfa;
  const d = g.createRadialGradient(x, y, 0, x, y, r);
  d.addColorStop(0, color);
  d.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = d;
  g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.restore();
}

export function bola(g, x, y, r, claro, oscuro) {
  const d = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  d.addColorStop(0, claro);
  d.addColorStop(1, oscuro);
  g.fillStyle = d;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

export function redondo(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

// Partículas con trayectoria calculada desde t, sin guardar estado entre fotogramas.
export function particulas(g, { x, y, t, t0, n = 60, semilla = 1, velocidad = 500, gravedad = 0, vida = 1.2, tam = 8, color = "#fff" }) {
  const e = t - t0;
  if (e < 0 || e > vida) return;
  const r = azar(semilla);
  g.save();
  g.fillStyle = color;
  g.globalAlpha *= 1 - e / vida;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, v = velocidad * (0.3 + r() * 0.7), s = tam * (0.5 + r());
    g.beginPath();
    g.arc(x + Math.cos(a) * v * e, y + Math.sin(a) * v * e + 0.5 * gravedad * e * e, s, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

export function texto(g, cadena, x, y, { tam = 80, peso = 800, color = "#fff", letra = "Arial, Helvetica, sans-serif", alinea = "center" } = {}) {
  g.save();
  g.font = `${peso} ${tam}px ${letra}`;
  g.textAlign = alinea;
  g.textBaseline = "middle";
  g.fillStyle = color;
  g.fillText(cadena, x, y);
  g.restore();
}
