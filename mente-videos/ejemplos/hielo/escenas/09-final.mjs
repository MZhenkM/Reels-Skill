// Frase 12: vuelve el vaso del principio y un pez diminuto cruza bajo el cubo en «lago».
import { cubo, pez, vaso } from "./comun/dibujos.mjs";

export default function escena({ k, voz }) {
  const f = voz.frase(12), lago = f.en("lago");
  return {
    empieza: "Así",
    dibujar(g, t) {
      // La cámara se aleja despacio mientras la voz va del cubito al lago entero.
      const zoom = k.mezcla(1.38, 1, k.suave(k.tramo(t, f.inicio, f.fin)));
      g.translate(540, 700);
      g.scale(zoom, zoom);
      g.translate(-540, -700);
      vaso(g, k, t, () => cubo(g, 540, 700 + Math.sin(t * 2) * 8, 170, 0.08 + Math.sin(t * 1.6) * 0.03));
      // El pez va encima del agua para conservar su color, recortado para no salirse del vaso.
      if (t > lago - 0.5) {
        const x = k.mezcla(180, 900, k.suave(k.tramo(t, lago - 0.5, lago + 1.6)));
        g.save();
        g.beginPath();
        g.rect(276, 560, 528, 550);
        g.clip();
        pez(g, x, 985, 0.75, true);
        g.restore();
      }
    },
  };
}
