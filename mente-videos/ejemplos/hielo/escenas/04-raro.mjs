// Frase 4: vuelve el vaso y, en «raro», la cámara entra en el agua.
import { C, cubo, vaso } from "./comun/dibujos.mjs";

export default function escena({ k, voz }) {
  const f = voz.frase(4), raro = f.en("raro"), hace = f.en("hace");
  return {
    empieza: "Pero",
    dibujar(g, t) {
      const zoom = 1 + 7 * k.sale(k.tramo(t, raro - 0.35, f.fin + 0.24));
      g.save();
      g.translate(540, 860);
      g.scale(zoom, zoom);
      g.translate(-540, -860);
      vaso(g, k, t, () => cubo(g, 540, 700 + Math.sin(t * 2) * 8, 170, 0.08));
      g.restore();
      const pregunta = k.rebote(k.tramo(t, hace, hace + 0.35)) * (1 - k.tramo(t, raro - 0.3, raro));
      if (pregunta > 0.02) k.texto(g, "?", 830, 330, { tam: 250 * pregunta, color: C.sol });
    },
  };
}
