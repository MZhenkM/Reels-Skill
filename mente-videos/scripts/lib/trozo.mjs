// Hilo de render: dibuja un rango de fotogramas y los codifica en un mp4 parcial.
import { spawn } from "node:child_process";
import { parentPort, workerData } from "node:worker_threads";
import { H, W } from "./base.mjs";
import { dibujar, preparar } from "./cuadro.mjs";
import { abrir } from "./proyecto.mjs";

const { dir, primero, ultimo, fps, salida, crf, preset } = workerData;
const proy = await abrir(dir), est = preparar(proy);
const p = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(fps), "-i", "-",
  "-c:v", "libx264", "-preset", preset, "-crf", String(crf), "-pix_fmt", "yuv420p", salida], { stdio: ["pipe", "ignore", "inherit"] });
const cerrado = new Promise((ok, mal) => p.on("close", (c) => (c === 0 ? ok() : mal(new Error(`ffmpeg terminó con código ${c}`)))));

for (let f = primero; f < ultimo; f++) {
  const datos = Buffer.from(dibujar(proy, est, f / fps).data());
  if (!p.stdin.write(datos)) await new Promise((r) => p.stdin.once("drain", r));
  parentPort.postMessage(1);
}
p.stdin.end();
await cerrado;
