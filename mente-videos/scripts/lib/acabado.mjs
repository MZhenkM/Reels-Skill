// Capas que se ponen encima de todo el vídeo (bajo los subtítulos): ajustes acabado=grano,vineta,papel
// Se preparan una vez por hilo; por fotograma solo se pegan encima.
import { createCanvas } from "@napi-rs/canvas";
import { H, W } from "./base.mjs";
import { azar } from "./kit.mjs";

const LADO = 256, CUADROS_GRANO = 6;

function grano() {
  const r = azar(91);
  const patrones = Array.from({ length: CUADROS_GRANO }, () => {
    const c = createCanvas(LADO, LADO), g = c.getContext("2d"), img = g.createImageData(LADO, LADO);
    for (let i = 0; i < LADO * LADO; i++) {
      const v = 128 + (r() + r() + r() - 1.5) * 120;
      img.data.set([v, v, v, 255], 4 * i);
    }
    g.putImageData(img, 0, 0);
    return c;
  });
  return (g, t) => {
    const n = Math.floor(t * 24), cual = patrones[n % CUADROS_GRANO], s = azar(n + 1);
    const dx = Math.floor(s() * LADO), dy = Math.floor(s() * LADO);
    g.save();
    g.globalCompositeOperation = "overlay";
    g.globalAlpha = 0.18;
    for (let y = -dy; y < H; y += LADO) for (let x = -dx; x < W; x += LADO) g.drawImage(cual, x, y);
    g.restore();
  };
}

function vineta() {
  const c = createCanvas(W, H), g = c.getContext("2d");
  const d = g.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.62);
  d.addColorStop(0, "rgba(0,0,0,0)");
  d.addColorStop(1, "rgba(0,0,0,0.6)");
  g.fillStyle = d;
  g.fillRect(0, 0, W, H);
  return (g2) => g2.drawImage(c, 0, 0);
}

// Papel: manchas grandes y suaves más fibras finas, en tonos cálidos. Se nota sobre fondos claros.
function papel() {
  const r = azar(17), chico = createCanvas(W / 24, H / 24), gc = chico.getContext("2d"), img = gc.createImageData(chico.width, chico.height);
  for (let i = 0; i < chico.width * chico.height; i++) {
    const v = 225 + r() * 30;
    img.data.set([v, v * 0.97, v * 0.9, 255], 4 * i);
  }
  gc.putImageData(img, 0, 0);
  const c = createCanvas(W, H), g = c.getContext("2d");
  g.imageSmoothingEnabled = true;
  g.drawImage(chico, 0, 0, W, H);
  g.strokeStyle = "rgba(120,100,70,0.08)";
  g.lineWidth = 1;
  for (let i = 0; i < 1400; i++) {
    const x = r() * W, y = r() * H, a = r() * Math.PI, l = 6 + r() * 22;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return (g2) => {
    g2.save();
    g2.globalCompositeOperation = "multiply";
    g2.drawImage(c, 0, 0);
    g2.restore();
  };
}

export const ACABADOS = { grano, vineta, papel };

// Devuelve una función (g, t) que pinta las capas pedidas, en el orden en que se escribieron.
export function prepararAcabado(texto) {
  const nombres = String(texto || "").split(",").map((x) => x.trim()).filter(Boolean);
  const capas = nombres.map((n) => {
    if (!ACABADOS[n]) throw new Error(`No existe el acabado «${n}». Hay: ${Object.keys(ACABADOS).join(", ")}.`);
    return ACABADOS[n]();
  });
  return capas.length ? (g, t) => { for (const c of capas) c(g, t); } : null;
}
