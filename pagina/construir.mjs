// Compila Tailwind y mete CSS, letras e iconos en un solo HTML que funciona sin internet.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

execSync("npx @tailwindcss/cli -i entrada.css -o salida.css --minify", { stdio: "pipe" });
const b64 = (f) => readFileSync(f).toString("base64");
const letra = (familia, archivo, peso) => `@font-face{font-family:"${familia}";font-style:normal;font-weight:${peso};font-display:swap;src:url(data:font/woff2;base64,${b64(archivo)}) format("woff2")}`;
const letras = [
  letra("Bricolage Grotesque Variable", "node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2", "200 800"),
  letra("Atkinson Hyperlegible", "node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2", 400),
  letra("Atkinson Hyperlegible", "node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2", 700),
].join("");
const icono = (n) => /\sd="([^"]+)"/.exec(readFileSync(`node_modules/simple-icons/icons/${n}.svg`, "utf8"))[1];
const iconos = { Instagram: icono("instagram"), TikTok: icono("tiktok"), YouTube: icono("youtube"), Facebook: icono("facebook") };
const html = readFileSync("fuente.html", "utf8")
  .replace("/*ESTILOS*/", () => letras + readFileSync("salida.css", "utf8"))
  .replace("/*ICONOS*/", () => JSON.stringify(iconos));
writeFileSync(process.argv[2] || "../BIENVENIDA.html", html);
console.log(`${(html.length / 1024).toFixed(0)} KB`);
