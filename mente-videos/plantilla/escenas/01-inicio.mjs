// Escena de ejemplo: enseña la forma de una escena, no un estilo. Sustitúyela.
export default function escena({ k, voz }) {
  const fin = voz.frase(1).fin;
  return {
    empieza: 0,
    dibujar(g, t) {
      k.fondo(g, ["#10243f", "#0a1020"]);
      const y = k.curva(t, [[0, 1500], [fin, 800]]);
      k.bola(g, 540, y + Math.sin(t * 2) * 20, 220, "#e8f7ff", "#6fb4d8");
    },
  };
}
