// Frase 7: mismo peso, más sitio. La balanza sigue nivelada y el bloque de hielo crece un 9 %, a escala real.
import { C, mezclaColor } from "./comun/dibujos.mjs";

export default function escena({ k, voz }) {
  const f = voz.frase(7), ocupa = f.en("ocupa"), nueve = f.en("nueve");
  const BASE = 1010, ALTO = 420, ANCHO = 300;
  const bloque = (g, x, alto, color) => {
    g.fillStyle = color;
    g.strokeStyle = C.tinta;
    g.lineWidth = 12;
    k.redondo(g, x - ANCHO / 2, BASE - alto, ANCHO, alto, 16);
    g.fill();
    g.stroke();
  };
  return {
    empieza: (v) => v.frase(7).inicio - 0.05,
    dibujar(g, t) {
      k.fondo(g, [C.papel, "#ffe9b0"]);
      // Tras el dato, la cámara se acerca al bloque que ha crecido.
      const acerca = 1 + 0.16 * k.suave(k.tramo(t, nueve + 0.2, f.fin + 0.2));
      g.translate(835, 700);
      g.scale(acerca, acerca);
      g.translate(-835, -700);
      const crece = k.entra(k.tramo(t, ocupa, nueve + 0.1));
      const giro = Math.sin((t - f.inicio) * 5) * 0.025 * Math.exp(-(t - f.inicio) * 1.5);
      g.strokeStyle = C.tinta;
      g.lineCap = "round";
      g.lineWidth = 22;
      g.beginPath();
      g.moveTo(540, 1110);
      g.lineTo(540, 380);
      g.stroke();
      g.save();
      g.translate(540, 380);
      g.rotate(giro);
      g.beginPath();
      g.moveTo(-295, 0);
      g.lineTo(295, 0);
      g.stroke();
      g.restore();
      g.lineWidth = 8;
      g.beginPath();
      for (const x of [245, 835]) {
        g.moveTo(x - 195, BASE + 10);
        g.lineTo(x, 380);
        g.lineTo(x + 195, BASE + 10);
      }
      g.stroke();
      g.lineWidth = 18;
      g.beginPath();
      g.moveTo(50, BASE + 10);
      g.lineTo(440, BASE + 10);
      g.moveTo(640, BASE + 10);
      g.lineTo(1030, BASE + 10);
      g.stroke();
      bloque(g, 245, ALTO, C.menta);
      bloque(g, 835, ALTO * (1 + 0.09 * crece), mezclaColor(C.menta, C.hielo, k.tramo(t, f.inicio, ocupa)));
      if (crece > 0) {
        g.setLineDash([22, 16]);
        g.strokeStyle = C.coral;
        g.lineWidth = 9;
        g.beginPath();
        g.moveTo(670, BASE - ALTO);
        g.lineTo(1000, BASE - ALTO);
        g.stroke();
        g.setLineDash([]);
      }
      const s = k.rebote(k.tramo(t, nueve, nueve + 0.3));
      if (s > 0.02) k.texto(g, "+9 %", 835, 790, { tam: 92 * s, color: C.tinta });
    },
  };
}
