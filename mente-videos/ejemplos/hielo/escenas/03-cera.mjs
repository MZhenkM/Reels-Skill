// Frase 3: la misma idea con algo de casa, un trozo de cera en cera derretida.
import { C, olla } from "./comun/dibujos.mjs";

export default function escena({ k, voz }) {
  const f = voz.frase(3), cae = f.en("cae"), fondo = f.en("fondo");
  const trozo = (g, y) => {
    g.fillStyle = "#fff0b0";
    g.strokeStyle = C.tinta;
    g.lineWidth = 12;
    k.redondo(g, 420, y, 240, 200, 26);
    g.fill();
    g.stroke();
    g.fillStyle = "#ffffff";
    g.fillRect(452, y + 30, 90, 16);
  };
  return {
    empieza: "Un",
    dibujar(g, t) {
      const y = k.curva(t, [[f.inicio, 270], [cae, 300], [fondo + 0.15, 620], [f.fin, 880]]);
      olla(g, k, t, "#ffd566", "#ffcb1f", () => trozo(g, y));
      if (y < 430) trozo(g, y);
    },
  };
}
