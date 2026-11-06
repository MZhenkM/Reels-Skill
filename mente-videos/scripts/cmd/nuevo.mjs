// Crea un proyecto en la carpeta de revisión a partir de plantilla/.
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SKILL, carpetaRevision, fallo, leerArgs } from "../lib/base.mjs";

export default function nuevo(args) {
  const { sueltos } = leerArgs(args), idea = sueltos.join(" ").trim();
  if (!idea) fallo("Falta la idea.");
  const slug = idea.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "video";
  const dir = join(carpetaRevision(), `${new Date().toISOString().slice(0, 10)}-${slug}`);
  if (existsSync(dir)) fallo(`Ya existe ${dir}.`);
  mkdirSync(dir, { recursive: true });
  cpSync(join(SKILL, "plantilla"), dir, { recursive: true });
  writeFileSync(join(dir, "fuentes.md"), `# ${idea}\n\nCada dato del guion, con su fuente:\n\n`);
  console.log(dir);
}
