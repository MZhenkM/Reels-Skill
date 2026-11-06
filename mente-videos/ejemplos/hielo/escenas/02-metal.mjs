// Frase 2: un lingote se hunde en su propio metal fundido.
import { C, olla } from "./comun/dibujos.mjs";

export default function escena({ k, voz }) {
  const f = voz.frase(2), hunde = f.en("hunde");
  const lingote = (g, y) => {
    g.fillStyle = "#c9cdd8";
    g.strokeStyle = C.tinta;
    g.lineWidth = 12;
    k.redondo(g, 380, y, 320, 150, 18);
    g.fill();
    g.stroke();
    g.fillStyle = "#eef0f5";
    g.fillRect(410, y + 26, 150, 18);
  };
  return {
    empieza: "Casi",
    dibujar(g, t) {
      const y = k.curva(t, [[f.inicio, 250], [hunde, 460], [f.fin + 0.2, 880]]);
      olla(g, k, t, C.naranja, "#ff7a2f", () => lingote(g, y));
      if (y < 420) lingote(g, y);
    },
  };
}
