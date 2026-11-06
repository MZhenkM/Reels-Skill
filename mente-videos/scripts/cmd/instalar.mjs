// Instala las dependencias dentro de la carpeta de la skill.
import { spawnSync } from "node:child_process";
import { SKILL, fallo } from "../lib/base.mjs";

export default function instalar() {
  const r = spawnSync("npm", ["install", "--omit=dev"], { cwd: SKILL, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) fallo("npm install no terminó bien.");
}
