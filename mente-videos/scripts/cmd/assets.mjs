// Lista lo que el creador ha puesto en su carpeta de assets.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { SUBCARPETAS_ASSETS, carpetaAssets } from "../lib/base.mjs";

function archivos(carpeta) {
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta).flatMap((f) => {
    const r = join(carpeta, f);
    return statSync(r).isDirectory() ? archivos(r) : [r];
  });
}

export default function assets() {
  console.log(carpetaAssets());
  for (const s of SUBCARPETAS_ASSETS) {
    const lista = archivos(carpetaAssets(s));
    console.log(`\n${s}: ${lista.length}`);
    for (const f of lista) console.log(`  ${relative(carpetaAssets(), f).replaceAll("\\", "/")}`);
  }
}
