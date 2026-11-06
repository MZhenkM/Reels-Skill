// Frases 10 y 11: un lago por dentro. La tapa de hielo crece y los peces siguen nadando debajo.
import { C, pez } from "./comun/dibujos.mjs";

export default function escena({ k, voz }) {
  const f = voz.frase(11), hielan = f.en("hielan"), tapa = f.en("tapa"), peces = f.en("peces"), vidas = voz.en("vidas");
  const azar = k.azar(21);
  const copos = Array.from({ length: 34 }, () => ({ x: azar() * 1080, y: azar() * 420, v: 50 + azar() * 70, r: 4 + azar() * 6 }));
  const lista = [[300, 760, 1.15, 0.2, C.coral], [760, 930, 1.45, 1.9, C.sol], [420, 1050, 0.9, 3.6, C.menta]];
  return {
    empieza: (v) => v.frase(10).inicio - 0.05,
    dibujar(g, t) {
      k.fondo(g, ["#0d1548", "#2233d8"]);
      g.fillStyle = C.papel;
      for (const c of copos) {
        g.beginPath();
        g.arc((c.x + 40 + Math.sin(t + c.y) * 20) % 1080, (c.y + t * c.v) % 430, c.r, 0, 7);
        g.fill();
      }
      const d = g.createLinearGradient(0, 430, 0, 1200);
      d.addColorStop(0, "#1fa6d6");
      d.addColorStop(1, C.tinta);
      g.fillStyle = d;
      g.fillRect(0, 430, 1080, 1490);
      const zoom = 1 + 0.42 * k.entra(k.tramo(t, peces - 0.15, peces + 0.5));
      lista.forEach(([x, y, s, fase, color], i) => {
        const px = x + Math.sin(t * 0.8 + fase) * 170, py = y + Math.sin(t * 1.7 + fase) * 26;
        if (i === 0 && t >= vidas) k.brillo(g, px, py, 260, "#ffcb1f", 0.6 * (1 - k.tramo(t, vidas + 0.5, hielan)));
        pez(g, px, py, s * zoom, Math.cos(t * 0.8 + fase) > 0, color);
      });
      const grueso = k.entra(k.tramo(t, hielan, tapa)) * 130;
      if (grueso > 0) {
        g.fillStyle = C.hielo;
        g.strokeStyle = C.tinta;
        g.lineWidth = 12;
        g.beginPath();
        g.moveTo(-20, 430);
        g.lineTo(1100, 430);
        g.lineTo(1100, 430 + grueso);
        for (let x = 1080; x >= -20; x -= 120) g.lineTo(x, 430 + grueso + ((x / 120) % 2 ? 16 : -6));
        g.closePath();
        g.fill();
        g.stroke();
      }
    },
  };
}
