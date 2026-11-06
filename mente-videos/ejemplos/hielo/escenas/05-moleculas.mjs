// Frases 5 y 6: un solo sitio. Las moléculas se empujan y, al congelarse, se ordenan en una red con huecos.
import { C, mezclaColor, molecula } from "./comun/dibujos.mjs";

const LADO = 112, CENTRO = [540, 690];

function red() {
  const vistos = new Map(), centros = [];
  for (let fila = -6; fila <= 6; fila++) {
    for (let col = -5; col <= 5; col++) {
      const cx = CENTRO[0] + (col + (fila % 2 ? 0.5 : 0)) * Math.sqrt(3) * LADO, cy = CENTRO[1] + fila * 1.5 * LADO;
      if (Math.abs(cx - 540) > 400 || Math.abs(cy - 690) > 350) continue;
      centros.push([cx, cy]);
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (i * Math.PI) / 3, x = cx + Math.cos(a) * LADO, y = cy + Math.sin(a) * LADO;
        vistos.set(`${Math.round(x)},${Math.round(y)}`, [x, y]);
      }
    }
  }
  return { vertices: [...vistos.values()], centros };
}

export default function escena({ k, voz }) {
  const f6 = voz.frase(6), inicio = f6.en("congelarse"), enganche = f6.en("enganchan"), huecos = f6.en("huecos");
  const { vertices, centros } = red(), azar = k.azar(9);
  const datos = vertices.map(([x, y]) => ({
    x, y,
    lx: CENTRO[0] + (x - CENTRO[0]) * 0.72, ly: CENTRO[1] + (y - CENTRO[1]) * 0.72,
    fase: azar() * 6.28, vel: 1.6 + azar() * 1.6, giro: (azar() - 0.5) * 5,
  }));
  const enlaces = [];
  datos.forEach((a, i) => datos.forEach((b, j) => {
    if (i < j && Math.hypot(a.x - b.x, a.y - b.y) < LADO * 1.05) enlaces.push([a, b]);
  }));
  const donde = (m, t, u) => {
    const lx = m.lx + Math.sin(t * m.vel + m.fase) * 52, ly = m.ly + Math.cos(t * m.vel * 1.2 + m.fase * 2) * 52;
    return [k.mezcla(lx, m.x, u), k.mezcla(ly, m.y, u)];
  };
  return {
    empieza: "Sus",
    dibujar(g, t) {
      const u = k.suave(k.tramo(t, inicio, enganche + 0.25));
      k.fondo(g, [mezclaColor("#0f7f86", "#1b5fd0", u), C.tinta]);
      // Con la red ya formada, la cámara se acerca despacio hacia los huecos.
      const acerca = 1 + 0.16 * k.suave(k.tramo(t, enganche + 0.3, f6.fin + 0.2));
      g.translate(540, 690);
      g.scale(acerca, acerca);
      g.translate(-540, -690);
      if (t >= huecos - 0.2) {
        const luz = k.entra(k.tramo(t, huecos - 0.2, huecos + 0.3));
        g.fillStyle = C.sol;
        for (const [x, y] of centros) {
          g.beginPath();
          g.arc(x, y, 58 * luz, 0, 7);
          g.fill();
        }
      }
      const b = k.tramo(t, enganche, enganche + 0.5);
      if (b > 0) {
        g.strokeStyle = C.papel;
        g.lineWidth = 9;
        g.globalAlpha = b;
        g.beginPath();
        for (const [p, q] of enlaces) {
          const [x1, y1] = donde(p, t, u), [x2, y2] = donde(q, t, u);
          g.moveTo(x1, y1);
          g.lineTo(x2, y2);
        }
        g.stroke();
        g.globalAlpha = 1;
      }
      for (const m of datos) {
        const [x, y] = donde(m, t, u);
        molecula(g, x, y, 30, k.mezcla(t * m.giro + m.fase, -Math.PI / 2, u));
      }
    },
  };
}
