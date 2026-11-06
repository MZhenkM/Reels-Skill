// Rutas, ajustes, argumentos y utilidades de audio compartidas por los comandos.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
// Lo personal vive fuera de la skill: sobrevive a una reinstalación y no viaja si alguien comparte la skill.
export const HOGAR = process.env.MENTE_VIDEOS_HOME || join(homedir(), ".mente-videos");
export const W = 1080, H = 1920, SR = 48000;

export function fallo(msg) {
  console.error(`\nError: ${msg}\n`);
  process.exit(1);
}

export function leerArgs(lista) {
  const sueltos = [], op = {};
  for (let i = 0; i < lista.length; i++) {
    const a = lista[i], siguiente = lista[i + 1];
    if (!a.startsWith("--")) sueltos.push(a);
    else if (siguiente !== undefined && !siguiente.startsWith("--")) { op[a.slice(2)] = siguiente; i++; }
    else op[a.slice(2)] = true;
  }
  return { sueltos, op };
}

const INICIALES = {
  idioma: "es",
  voz: "sistema", // sistema | elevenlabs | muda
  sistema_voz: "",
  elevenlabs_voz: "",
  elevenlabs_modelo: "eleven_multilingual_v2",
  letra: "Arial, Helvetica, 'DejaVu Sans', sans-serif",
  color_texto: "#ffffff",
  color_acento: "#ffffff",
  subtitulos: "abajo", // abajo | arriba | no
  carpeta_revision: "", // proyectos y borradores; vacío: ./mente-videos
  carpeta_finales: "", // vídeos terminados; vacío: <proyecto>/final
  carpeta_assets: "", // letras, efectos, audios y texturas del creador
};
export const SUBCARPETAS_ASSETS = ["letras", "efectos", "audios", "texturas"];
const archivoAjustes = () => join(HOGAR, "ajustes.json");

export function leerAjustes() {
  const f = archivoAjustes();
  return { ...INICIALES, ...(existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {}) };
}

export function guardarAjustes(a) {
  mkdirSync(HOGAR, { recursive: true });
  writeFileSync(archivoAjustes(), JSON.stringify(a, null, 2) + "\n");
}

// La clave vive en ~/.mente-videos/.env: es de cada persona y nunca forma parte de la skill.
export const archivoEnv = () => join(HOGAR, ".env");

export function leerClaveVoz() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const f = archivoEnv();
  if (!existsSync(f)) return "";
  const linea = readFileSync(f, "utf8").split(/\r?\n/).find((l) => l.startsWith("ELEVENLABS_API_KEY="));
  return linea ? linea.slice(linea.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") : "";
}

export function guardarClaveVoz(clave) {
  mkdirSync(HOGAR, { recursive: true });
  const f = archivoEnv();
  const otras = existsSync(f) ? readFileSync(f, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("ELEVENLABS_API_KEY=")) : [];
  writeFileSync(f, [...otras, `ELEVENLABS_API_KEY=${clave}`].join("\n") + "\n", { mode: 0o600 });
}

export const carpetaRevision = () => leerAjustes().carpeta_revision || resolve("mente-videos");
export const carpetaAssets = (sub = "") => join(leerAjustes().carpeta_assets || join(HOGAR, "assets"), sub);

// Un proyecto es una ruta o el nombre de una carpeta dentro de la carpeta de revisión.
export function carpetaDe(nombre) {
  if (!nombre) fallo("Falta el proyecto.");
  for (const c of [resolve(nombre), join(carpetaRevision(), nombre)]) if (existsSync(join(c, "guion.txt"))) return c;
  fallo(`No encuentro el proyecto «${nombre}» (una carpeta con guion.txt).`);
}

export function ffmpeg(args) {
  try {
    return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { maxBuffer: 2 ** 31 - 1, stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    fallo(`ffmpeg: ${String(e.stderr || e.message).slice(-500)}`);
  }
}

export function leerMono(archivo) {
  const crudo = execFileSync("ffmpeg", ["-v", "error", "-i", archivo, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 2 ** 31 - 1 });
  return new Float32Array(crudo.buffer.slice(crudo.byteOffset, crudo.byteOffset + crudo.length));
}

export function guardarWav(ruta, muestras) {
  const n = muestras.length, b = Buffer.alloc(44 + 2 * n);
  b.write("RIFF", 0); b.writeUInt32LE(36 + 2 * n, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(2 * n, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(muestras[i] * 32767))), 44 + 2 * i);
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, b);
}
