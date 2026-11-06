// Frases 8 y 9: el cubo sube desde el fondo y se queda con casi todo el cuerpo bajo el agua.
import { C, cubo } from "./comun/dibujos.mjs";

export default function escena({ k, voz }) {
  const f8 = voz.frase(8), f9 = voz.frase(9), ligero = f8.en("ligero"), sube = f8.en("sube"), casi = f9.en("casi");
  const NIVEL = 470, S = 250, REPOSO = NIVEL + S * 0.72;
  const ola = (g, t) => {
    g.beginPath();
    g.moveTo(0, 1920);
    g.lineTo(0, NIVEL);
    for (let x = 0; x <= 1080; x += 36) g.lineTo(x, NIVEL + Math.sin(x * 0.012 + t * 2.4) * 12);
    g.lineTo(1080, 1920);
    g.closePath();
  };
  return {
    empieza: (v) => v.frase(8).inicio - 0.05,
    dibujar(g, t) {
      k.fondo(g, ["#7ec8ff", "#d5efff"]);
      ola(g, t);
      const d = g.createLinearGradient(0, NIVEL, 0, 1200);
      d.addColorStop(0, "#1fb7c9");
      d.addColorStop(1, C.tinta);
      g.fillStyle = d;
      g.fill();
      const y = k.curva(t, [[f8.inicio, 860], [ligero, 850], [sube + 0.2, REPOSO - 40], [sube + 0.75, REPOSO + 16], [f9.inicio + 0.3, REPOSO]]) + Math.sin(t * 2) * 7;
      cubo(g, 540, y, S, 0.05);
      ola(g, t);
      g.fillStyle = "rgba(31,183,201,.34)";
      g.fill();
      const a = k.suave(k.tramo(t, ligero, ligero + 0.3)) * (1 - k.tramo(t, sube + 0.2, sube + 0.5));
      if (a > 0) {
        g.save();
        g.globalAlpha = a;
        g.strokeStyle = C.sol;
        g.lineWidth = 22;
        g.lineCap = "round";
        g.lineJoin = "round";
        for (const x of [160, 920]) {
          const dy = ((t * 260) % 90) - 45;
          g.beginPath();
          g.moveTo(x, 940 + dy);
          g.lineTo(x, 720 + dy);
          g.moveTo(x - 50, 775 + dy);
          g.lineTo(x, 720 + dy);
          g.lineTo(x + 50, 775 + dy);
          g.stroke();
        }
        g.restore();
      }
      const m = k.suave(k.tramo(t, casi - 0.1, casi + 0.4));
      if (m > 0) {
        g.save();
        g.globalAlpha = m;
        g.strokeStyle = C.sol;
        g.lineWidth = 12;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(860, NIVEL + 24);
        g.lineTo(860, y + S);
        g.moveTo(830, NIVEL + 24);
        g.lineTo(890, NIVEL + 24);
        g.moveTo(830, y + S);
        g.lineTo(890, y + S);
        g.stroke();
        g.restore();
      }
    },
  };
}
