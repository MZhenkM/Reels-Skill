// Comprueba lo necesario y dice una línea por cosa.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { HOGAR, SKILL, leerAjustes, leerClaveVoz } from "../lib/base.mjs";

export default function doctor() {
  const falta = [];
  const linea = (ok, nombre, detalle) => { console.log(`${ok ? "ok   " : "falta"} ${nombre.padEnd(12)} ${detalle}`); if (!ok) falta.push(nombre); };
  const nodeOk = Number(process.versions.node.split(".")[0]) >= 20;
  linea(nodeOk, "node", nodeOk ? process.versions.node : `hace falta 20 o más; hay ${process.versions.node}`);
  const ff = spawnSync("ffmpeg", ["-version"]).status === 0;
  linea(ff, "ffmpeg", ff ? "instalado" : "winget install Gyan.FFmpeg | brew install ffmpeg | sudo apt install ffmpeg");
  const lienzo = existsSync(join(SKILL, "node_modules", "@napi-rs", "canvas"));
  linea(lienzo, "dibujo", lienzo ? "instalado" : "ejecuta el comando «instalar»");
  const a = leerAjustes();
  const vozOk = a.voz !== "elevenlabs" || (leerClaveVoz() && a.elevenlabs_voz);
  linea(!!vozOk, "voz", vozOk ? a.voz : "ElevenLabs necesita clave (comando «clave») y elevenlabs_voz en ajustes");
  const carpetas = a.carpeta_revision && a.carpeta_finales && a.carpeta_assets;
  linea(!!carpetas, "carpetas", carpetas ? "elegidas" : "falta elegirlas: sigue references/configurar.md");
  const estilo = existsSync(join(HOGAR, "estilo.md"));
  linea(estilo, "estilo", estilo ? "definido" : `falta ${join(HOGAR, "estilo.md")}: créalo con el creador antes del primer vídeo`);
  process.exit(falta.length ? 1 : 0);
}
