// Señala dónde mirar: no sustituye a ver el vídeo.
import { createCanvas } from "@napi-rs/canvas";
import { carpetaDe, leerAjustes, leerArgs } from "../lib/base.mjs";
import { dibujar, preparar } from "../lib/cuadro.mjs";
import { abrir } from "../lib/proyecto.mjs";

const PASO = 0.2, QUIETO = 0.4, SALTO = 45, TW = 54, TH = 96;

export default async function revisar(args) {
  const dir = carpetaDe(leerArgs(args).sueltos[0]), proy = await abrir(dir), est = preparar(proy);
  const mini = createCanvas(TW, TH), g = mini.getContext("2d"), avisos = [];
  const zona = leerAjustes().subtitulos === "arriba" ? [17, 25] : [60, 67]; // filas de la miniatura bajo el subtítulo
  let anterior = null, quietoDesde = null, claros = 0, muestras = 0;

  for (let t = 0; t < proy.duracion; t += PASO) {
    g.drawImage(dibujar(proy, est, t, { conSubtitulos: false }), 0, 0, TW, TH);
    const px = g.getImageData(0, 0, TW, TH).data, lum = new Float32Array(TW * TH);
    for (let i = 0; i < lum.length; i++) lum[i] = 0.3 * px[4 * i] + 0.59 * px[4 * i + 1] + 0.11 * px[4 * i + 2];
    let media = 0;
    for (let i = zona[0] * TW; i < zona[1] * TW; i++) media += lum[i];
    muestras++;
    if (media / ((zona[1] - zona[0]) * TW) > 190) claros++;
    if (anterior) {
      let d = 0;
      for (let i = 0; i < lum.length; i++) d += Math.abs(lum[i] - anterior[i]);
      d /= lum.length;
      const enCorte = proy.escenas.some((e) => Math.abs(e.desde - t) <= PASO);
      if (d > SALTO && !enCorte) avisos.push(`${t.toFixed(1)} s: salto brusco fuera de un corte.`);
      if (d < QUIETO) quietoDesde ??= t;
      else {
        if (quietoDesde !== null && t - quietoDesde > 1.5) avisos.push(`${quietoDesde.toFixed(1)}-${t.toFixed(1)} s: imagen casi quieta.`);
        quietoDesde = null;
      }
    }
    anterior = lum;
  }
  if (quietoDesde !== null && proy.duracion - quietoDesde > 1.5) avisos.push(`${quietoDesde.toFixed(1)} s hasta el final: imagen casi quieta.`);
  if (claros / muestras > 0.15) avisos.push("El fondo es muy claro detrás del subtítulo durante buena parte del vídeo.");
  for (const e of proy.escenas) if (e.hasta - e.desde < 1.2) avisos.push(`${e.nombre}: dura solo ${(e.hasta - e.desde).toFixed(1)} s.`);
  console.log(`${proy.duracion} s, ${proy.escenas.length} escenas. ${avisos.length ? "Mira esto:" : "Sin avisos; míralo igualmente."}`);
  avisos.forEach((a) => console.log(`  ${a}`));
}
