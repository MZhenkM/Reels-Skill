// Efectos generados por síntesis: no dependen de ningún archivo de audio. Es un punto de partida; cada creador añade los
// suyos en las carpetas efectos/ y audios/ de sus assets y los pide por su nombre de archivo.
import { SR } from "./base.mjs";

function ruido(semilla) {
  let s = semilla >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2147483648 - 1; };
}

function crear(segundos, fn) {
  const m = new Float32Array(Math.round(segundos * SR));
  for (let i = 0; i < m.length; i++) m[i] = fn(i / SR, i / m.length);
  return m;
}

function grave(segundos, f0, f1) {
  let fase = 0;
  return crear(segundos, (t, u) => {
    fase += (2 * Math.PI * (f0 + (f1 - f0) * u)) / SR;
    return Math.sin(fase) * Math.exp(-5 * u);
  });
}

function soplo(segundos, semilla, forma) {
  const r = ruido(semilla);
  let y = 0;
  return crear(segundos, (t, u) => {
    y += (0.04 + 0.2 * forma(u)) * (r() - y);
    return y * forma(u) * 2.5;
  });
}

export const EFECTOS = {
  clic: () => crear(0.05, (t, u) => Math.sin(2 * Math.PI * 1800 * t) * (1 - u) ** 4),
  golpe: () => grave(0.35, 130, 45),
  aire: () => soplo(0.6, 7, (u) => Math.sin(Math.PI * u) ** 2),
  sube: () => soplo(0.7, 11, (u) => u ** 2 * (1 - u ** 12)),
  estallido: () => {
    const a = grave(1.1, 90, 30), b = soplo(1.1, 3, (u) => Math.exp(-4 * u));
    return a.map((x, i) => 0.8 * x + 0.5 * b[i]);
  },
};
