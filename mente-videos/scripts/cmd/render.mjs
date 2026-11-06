// Hace el vídeo. Final: la carpeta de finales (o <proyecto>/final/), con video.mp4, portada.jpg y post.txt.
// Borrador: <proyecto>/revisar/borrador.mp4.
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { createCanvas } from "@napi-rs/canvas";
import { H, W, carpetaDe, ffmpeg, leerAjustes, leerArgs } from "../lib/base.mjs";
import { dibujar, preparar } from "../lib/cuadro.mjs";
import { abrir } from "../lib/proyecto.mjs";

async function portada(proy, destino) {
  const f = join(proy.dir, "portada.mjs");
  if (!existsSync(f)) return console.log("Sin portada.mjs: no hay portada.");
  const { default: p } = await import(pathToFileURL(f).href), a = leerAjustes(), est = preparar(proy);
  const lienzo = createCanvas(W, H), g = lienzo.getContext("2d");
  g.drawImage(dibujar(proy, est, p.t, { conSubtitulos: false }), 0, 0);
  g.font = `800 112px ${a.letra}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  p.titulo.forEach((linea, i) => {
    const y = 960 + (i - (p.titulo.length - 1) / 2) * 128;
    g.strokeStyle = "rgba(0,0,0,.9)";
    g.lineWidth = 20;
    g.strokeText(linea, 540, y);
    g.fillStyle = i === p.resalta ? a.color_acento : a.color_texto;
    g.fillText(linea, 540, y);
  });
  writeFileSync(destino, await lienzo.encode("jpeg", 92));
  console.log(destino);
}

export default async function render(args) {
  const { sueltos, op } = leerArgs(args);
  const dir = carpetaDe(sueltos[0]), proy = await abrir(dir), borrador = !!op.borrador;
  const fps = Number(op.fps || 30), desde = Number(op.desde || 0), hasta = Math.min(proy.duracion, Number(op.hasta || proy.duracion));
  const finales = leerAjustes().carpeta_finales, destino = finales ? join(finales, basename(dir)) : join(dir, "final");
  const salida = borrador ? join(dir, "revisar", "borrador.mp4") : join(destino, "video.mp4");
  const tmp = join(dir, "revisar", ".render");
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  mkdirSync(dirname(salida), { recursive: true });

  const primero = Math.round(desde * fps), ultimo = Math.round(hasta * fps), total = ultimo - primero;
  const hilos = Math.max(1, Math.min(Number(op.hilos || Math.max(1, cpus().length - 1)), 8, Math.ceil(total / 30)));
  let hechos = 0, avisado = 0;
  const trozos = await Promise.all(Array.from({ length: hilos }, (_, i) => new Promise((ok, mal) => {
    const a = primero + Math.floor((total * i) / hilos), b = primero + Math.floor((total * (i + 1)) / hilos);
    const archivo = join(tmp, `${String(i).padStart(2, "0")}.mp4`);
    const w = new Worker(new URL("../lib/trozo.mjs", import.meta.url), {
      workerData: { dir, primero: a, ultimo: b, fps, salida: archivo, crf: borrador ? 26 : 17, preset: borrador ? "veryfast" : "medium" },
    });
    w.on("message", (n) => {
      hechos += n;
      const pct = Math.floor((hechos / total) * 4) * 25;
      if (pct > avisado) { avisado = pct; console.log(`${pct} %`); }
    });
    w.on("error", mal);
    w.on("exit", (c) => (c ? mal(new Error(`El hilo ${i} terminó con código ${c}`)) : ok(archivo)));
  })));

  const lista = join(tmp, "lista.txt"), imagen = join(tmp, "imagen.mp4");
  writeFileSync(lista, trozos.map((f) => `file '${f.replaceAll("\\", "/")}'`).join("\n"));
  ffmpeg(["-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", imagen]);

  const corte = ["-ss", String(desde), "-to", String(hasta)], efectos = join(dir, "sonidos", "efectos.wav"), hayEfectos = existsSync(efectos);
  ffmpeg(["-i", imagen, ...corte, "-i", join(dir, "voz", "voz.wav"), ...(hayEfectos ? [...corte, "-i", efectos] : []),
    "-filter_complex", `${hayEfectos ? "[1:a][2:a]amix=inputs=2:normalize=0:duration=first," : "[1:a]"}loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]`,
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", salida]);
  rmSync(tmp, { recursive: true, force: true });
  console.log(salida);

  if (!borrador) {
    await portada(proy, join(destino, "portada.jpg"));
    if (existsSync(join(dir, "post.txt"))) copyFileSync(join(dir, "post.txt"), join(destino, "post.txt"));
  }
}
