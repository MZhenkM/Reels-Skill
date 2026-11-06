#!/usr/bin/env node
// Copia la skill a ~/.claude/skills/mente-videos e instala sus dependencias. Lo ejecuta Claude al escribir «instálame».
// node instalar.mjs [--destino carpeta-de-skills]
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2), i = argv.indexOf("--destino");
const base = i > -1 ? resolve(argv[i + 1]) : join(homedir(), ".claude", "skills");
const origen = join(dirname(fileURLToPath(import.meta.url)), "mente-videos"), destino = join(base, "mente-videos");

mkdirSync(base, { recursive: true });
rmSync(destino, { recursive: true, force: true });
cpSync(origen, destino, { recursive: true, filter: (f) => !f.includes("node_modules") });
const r = spawnSync(process.execPath, [join(destino, "scripts", "mv.mjs"), "instalar"], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`\nSkill instalada en ${destino}`);
