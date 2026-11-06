// guion.txt: una frase por línea. Las líneas vacías y las que empiezan por # se ignoran.
//   *palabra*     la palabra destacada en el subtítulo
//   [[IA|i a]]    se escribe «IA» y se pronuncia «i a»
import { readFileSync } from "node:fs";
import { join } from "node:path";

const TROZO = /(\*?)\[\[(.+?)\|(.+?)\]\](\*?)(\S*)|\S+/g;
export const tieneSonido = (s) => /[\p{L}\p{N}]/u.test(s);
export const palabrasDichas = (s) => s.split(/\s+/).filter(tieneSonido);

export function leerFrase(linea) {
  const tokens = [];
  for (const m of linea.matchAll(TROZO)) {
    if (m[2]) tokens.push({ texto: m[2] + m[5], dicho: m[3] + m[5], destacada: m[1] === "*" });
    else tokens.push({ texto: m[0].replaceAll("*", ""), dicho: m[0].replaceAll("*", ""), destacada: m[0].includes("*") });
  }
  return { texto: tokens.map((t) => t.texto).join(" "), dicho: tokens.map((t) => t.dicho).join(" "), tokens };
}

export function leerGuion(dir) {
  return readFileSync(join(dir, "guion.txt"), "utf8").split(/\r?\n/).map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#")).map(leerFrase);
}
