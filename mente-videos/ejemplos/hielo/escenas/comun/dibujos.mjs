// Dibujos compartidos por las escenas de este vídeo.
export const C = { mar: "#2233d8", tinta: "#101a5c", sol: "#ffcb1f", menta: "#5ff0b0", coral: "#ff6f7d", papel: "#fff6e0", hielo: "#bfeaff", naranja: "#ff9a3d" };

export function mezclaColor(a, b, u) {
  const n = (h, i) => parseInt(h.slice(i, i + 2), 16);
  const c = [1, 3, 5].map((i) => Math.round(n(a, i) + (n(b, i) - n(a, i)) * u));
  return `rgb(${c.join(",")})`;
}

export function cubo(g, x, y, s, giro = 0.07) {
  g.save();
  g.translate(x, y);
  g.rotate(giro);
  g.lineJoin = "round";
  g.lineWidth = s * 0.075;
  g.strokeStyle = C.tinta;
  const a = s * 0.9, b = s * 0.5;
  const cara = (puntos, color) => {
    g.beginPath();
    puntos.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    g.closePath();
    g.fillStyle = color;
    g.fill();
    g.stroke();
  };
  cara([[0, -s], [a, -b], [0, 0], [-a, -b]], "#ffffff");
  cara([[-a, -b], [0, 0], [0, s], [-a, b]], C.hielo);
  cara([[a, -b], [0, 0], [0, s], [a, b]], "#8fd2f2");
  g.strokeStyle = "#ffffff";
  g.lineCap = "round";
  g.lineWidth = s * 0.06;
  g.beginPath();
  g.moveTo(-a * 0.72, -b * 0.3);
  g.lineTo(-a * 0.72, b * 0.45);
  g.stroke();
  g.restore();
}

export const NIVEL_VASO = 560;

function formaAgua(g, y) {
  const izquierda = 232 + ((y - 400) / 720) * 34, derecha = 848 - ((y - 400) / 720) * 34;
  g.beginPath();
  g.moveTo(izquierda, y);
  g.lineTo(derecha, y);
  g.lineTo(814, 1120);
  g.lineTo(266, 1120);
  g.closePath();
}

// El vaso entero. dibujarDentro se pinta entre el agua y su capa translúcida, para que parezca sumergido.
export function vaso(g, k, t, dibujarDentro) {
  k.fondo(g, [C.mar, "#1a28ad"]);
  g.fillStyle = C.papel;
  for (const [x, y, r] of [[150, 210, 5], [930, 300, 6], [760, 170, 4], [110, 520, 4]]) {
    g.beginPath();
    g.arc(x, y, r, 0, 7);
    g.fill();
  }
  g.fillStyle = C.sol;
  g.beginPath();
  g.arc(250, 270, 86, 0, 7);
  g.fill();
  g.fillStyle = C.tinta;
  g.fillRect(0, 1120, 1080, 800);
  formaAgua(g, NIVEL_VASO);
  g.fillStyle = C.menta;
  g.fill();
  dibujarDentro?.();
  formaAgua(g, NIVEL_VASO);
  g.fillStyle = "rgba(95,240,176,.5)";
  g.fill();
  g.strokeStyle = C.papel;
  g.lineWidth = 20;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(232, 400);
  g.lineTo(266, 1120);
  g.lineTo(814, 1120);
  g.lineTo(848, 400);
  g.stroke();
}

export function molecula(g, x, y, r, angulo) {
  g.save();
  g.translate(x, y);
  g.rotate(angulo);
  for (const a of [-0.9, 0.9]) {
    g.fillStyle = C.papel;
    g.strokeStyle = C.tinta;
    g.lineWidth = 4;
    g.beginPath();
    g.arc(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15, r * 0.52, 0, 7);
    g.fill();
    g.stroke();
  }
  g.fillStyle = C.coral;
  g.strokeStyle = C.tinta;
  g.lineWidth = 5;
  g.beginPath();
  g.arc(0, 0, r, 0, 7);
  g.fill();
  g.stroke();
  g.restore();
}

export function pez(g, x, y, s, derecha = true, color = C.coral) {
  g.save();
  g.translate(x, y);
  g.scale(derecha ? s : -s, s);
  g.fillStyle = color;
  g.strokeStyle = C.tinta;
  g.lineWidth = 7;
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(-58, 0);
  g.lineTo(-104, -38);
  g.lineTo(-96, 0);
  g.lineTo(-104, 38);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(0, 0, 78, 46, 0, 0, 7);
  g.fill();
  g.stroke();
  g.fillStyle = C.papel;
  g.beginPath();
  g.arc(42, -12, 12, 0, 7);
  g.fill();
  g.fillStyle = C.tinta;
  g.beginPath();
  g.arc(46, -12, 6, 0, 7);
  g.fill();
  g.restore();
}

// Olla vista de frente con un líquido caliente.
export function olla(g, k, t, liquido, brilloColor, dibujarDentro) {
  k.fondo(g, [C.tinta, "#1a28ad"]);
  k.brillo(g, 540, 640, 640, brilloColor, 0.55);
  g.save();
  g.beginPath();
  g.rect(190, 420, 700, 690);
  g.clip();
  g.fillStyle = liquido;
  g.fillRect(190, 420, 700, 690);
  dibujarDentro?.();
  g.fillStyle = "rgba(255,255,255,.28)";
  for (let i = 0; i < 7; i++) {
    const y = 1080 - ((t * 120 + i * 96) % 640), x = 250 + ((i * 137) % 580);
    g.beginPath();
    g.arc(x, y, 9 + (i % 3) * 5, 0, 7);
    g.fill();
  }
  g.restore();
  g.strokeStyle = C.papel;
  g.lineWidth = 22;
  g.lineJoin = "round";
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(190, 340);
  g.lineTo(190, 1110);
  g.lineTo(890, 1110);
  g.lineTo(890, 340);
  g.stroke();
}
