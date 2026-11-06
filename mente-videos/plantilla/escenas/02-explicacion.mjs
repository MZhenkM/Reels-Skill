// Segunda escena de ejemplo: empieza en una palabra de la voz. Sustitúyela.
export default function escena({ k, voz }) {
  const t0 = voz.en("expande");
  return {
    empieza: "expande",
    transicion: "fundido",
    dibujar(g, t) {
      k.fondo(g, ["#0a1020", "#17324f"]);
      const r = k.mezcla(140, 300, k.entra(k.tramo(t, t0, t0 + 1.2)));
      k.bola(g, 540, 800 + Math.sin(t * 2) * 20, r, "#ffffff", "#7cc4e8");
      k.particulas(g, { x: 540, y: 800, t, t0, n: 40, velocidad: 600, color: "#bfe8ff" });
    },
  };
}
