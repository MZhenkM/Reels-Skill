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

function tono(segundos, f0, f1, caida) {
  let fase = 0;
  return crear(segundos, (t, u) => {
    fase += (2 * Math.PI * (f0 + (f1 - f0) * u)) / SR;
    return Math.sin(fase) * Math.exp(-caida * u);
  });
}

function mezclar(segundos, partes) {
  const m = new Float32Array(Math.round(segundos * SR));
  for (const [onda, desde, nivel] of partes) {
    const i0 = Math.round(desde * SR);
    for (let i = 0; i < onda.length && i0 + i < m.length; i++) m[i0 + i] += onda[i] * nivel;
  }
  return m;
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
  // Paso rápido de aire, para transiciones.
  whoosh: () => soplo(0.45, 23, (u) => Math.sin(Math.PI * u ** 0.7) ** 3),
  // Algo que aparece.
  pop: () => tono(0.09, 700, 180, 9),
  // Dato importante: campana con parciales inarmónicos.
  ding: () => {
    const f = 1320;
    return crear(1.2, (t, u) => (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-6 * u)
      + 0.25 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-12 * u)) * Math.exp(-5 * u) * Math.min(1, t * 400) * 0.6);
  },
  // Sube la tensión antes de una revelación. Colócalo 1,5 s antes del momento.
  riser: () => {
    const aire = soplo(1.5, 31, (u) => u ** 2);
    let fase = 0;
    return crear(1.5, (t, u) => {
      fase += (2 * Math.PI * (180 + 900 * u * u)) / SR;
      return 0.35 * Math.sin(fase) * u ** 2 + 0.7 * aire[Math.round(u * (aire.length - 1))];
    });
  },
  // Corazón: «pum-pum».
  latido: () => mezclar(0.7, [[grave(0.25, 70, 40), 0, 1], [grave(0.22, 60, 35), 0.22, 0.7]]),
  // Reloj: un segundo con «tic» y «tac».
  tictac: () => {
    const clic = (f) => crear(0.03, (t, u) => Math.sin(2 * Math.PI * f * t) * (1 - u) ** 6);
    return mezclar(1, [[clic(2400), 0, 0.8], [clic(1700), 0.5, 0.8]]);
  },
};

// Música de fondo generada: acordes suaves que se repiten. dur en segundos.
const ACORDES = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]];
export const MUSICAS = {
  ambiente: (dur) => {
    const paso = 4, fases = new Float64Array(12); // dos acordes a la vez durante el cruce, por eso 12
    return crear(dur, (t) => {
      const n = Math.floor(t / paso), dentro = (t % paso) / paso, cruce = Math.min(1, dentro * 8);
      let v = 0;
      for (const [k, peso] of [[n, cruce], [n - 1, 1 - cruce]]) {
        if (k < 0 || peso <= 0) continue;
        const acorde = ACORDES[k % ACORDES.length];
        acorde.forEach((f, j) => {
          const i = (k % 2) * 6 + j * 2;
          fases[i] += (2 * Math.PI * f) / SR; // dos voces un poco desafinadas por nota: suena más ancho
          fases[i + 1] += (2 * Math.PI * f * 1.004) / SR;
          v += peso * (Math.sin(fases[i]) + Math.sin(fases[i + 1])) * 0.12;
        });
      }
      return v * (0.85 + 0.15 * Math.sin(2 * Math.PI * 0.25 * t));
    });
  },
};
