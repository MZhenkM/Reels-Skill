// Frase 1: el cubo cae desde el primer fotograma y choca en «hielo».
import { C, NIVEL_VASO, cubo, vaso } from "./comun/dibujos.mjs";

export default function escena({ k, voz }) {
  const choque = voz.en("hielo"), REPOSO = 700;
  return {
    empieza: 0,
    dibujar(g, t) {
      const e = t - choque;
      const y = e < 0
        ? k.mezcla(215, REPOSO, k.sale(k.tramo(t, 0, choque)))
        : REPOSO + 110 * Math.exp(-2.6 * e) * Math.sin(5.5 * e) + Math.sin(t * 2) * 8;
      vaso(g, k, t, () => cubo(g, 540, y, 170, 0.08 + Math.sin(t * 1.6) * 0.03));
      if (e >= 0 && e < 1) {
        g.strokeStyle = C.papel;
        g.globalAlpha = 1 - e;
        g.lineWidth = 12;
        g.beginPath();
        g.ellipse(540, NIVEL_VASO, 180 + e * 90, 24 + e * 22, 0, 0, 7);
        g.stroke();
        g.globalAlpha = 1;
      }
      k.particulas(g, { x: 540, y: NIVEL_VASO, t, t0: choque, n: 46, semilla: 4, velocidad: 950, gravedad: 2100, vida: 0.95, tam: 13, color: C.papel });
    },
  };
}
