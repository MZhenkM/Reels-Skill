// Genera voz/voz.wav y voz/tiempos.json. Motores: sistema (gratis), elevenlabs (de pago) y muda (para pruebas).
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SR, carpetaDe, fallo, guardarWav, leerAjustes, leerArgs, leerClaveVoz, leerMono } from "../lib/base.mjs";
import { leerGuion, palabrasDichas, tieneSonido } from "../lib/guion.mjs";

const COLA = 0.7;
const r2 = (x) => Math.round(x * 100) / 100;
const peso = (w) => (w.match(/[aeiouáéíóúüy]+/gi) || ["x"]).length + 0.35 + (/[,;:]$/.test(w) ? 1 : 0);
const pausaTras = (f) => (/[?!.:…]$/.test(f.dicho.trim()) ? 0.28 : 0.14);

// Sin marcas de tiempo del proveedor, reparte las palabras de un tramo por sus sílabas aproximadas.
function repartir(palabras, inicio, fin) {
  const pesos = palabras.map(peso), total = pesos.reduce((a, b) => a + b, 0);
  let t = inicio;
  return pesos.map((p) => { const d = ((fin - inicio) * p) / total, r = { inicio: t, fin: t + d }; t += d; return r; });
}

function recortarSilencio(m) {
  let a = 0, b = m.length - 1;
  while (a < b && Math.abs(m[a]) < 0.012) a++;
  while (b > a && Math.abs(m[b]) < 0.012) b--;
  return m.subarray(Math.max(0, a - 480), Math.min(m.length, b + 480));
}

// Une una toma por frase y calcula el tiempo de cada palabra hablada.
function unirTomas(frases, tomas) {
  const trozos = [], tiempos = [];
  let cursor = 0;
  frases.forEach((f, i) => {
    const voz = recortarSilencio(tomas[i]), d = voz.length / SR, pausa = pausaTras(f);
    trozos.push(voz, new Float32Array(Math.round(pausa * SR)));
    tiempos.push(...repartir(palabrasDichas(f.dicho), cursor, cursor + d));
    cursor += d + pausa;
  });
  const audio = new Float32Array(trozos.reduce((n, x) => n + x.length, 0));
  let p = 0;
  for (const x of trozos) { audio.set(x, p); p += x.length; }
  return { audio, tiempos };
}

function vozWindows(frases, idioma, tmp, nombre) {
  const datos = join(tmp, "frases.json"), ps = join(tmp, "voz.ps1");
  writeFileSync(datos, JSON.stringify(frases.map((f) => f.dicho)));
  writeFileSync(ps, `﻿Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$v = $s.GetInstalledVoices() | Where-Object { $_.Enabled -and ('${nombre}' -eq '' -or $_.VoiceInfo.Name -eq '${nombre}') -and $_.VoiceInfo.Culture.TwoLetterISOLanguageName -eq '${idioma}' } | Select-Object -First 1
if (-not $v) { exit 3 }
$s.SelectVoice($v.VoiceInfo.Name)
$frases = Get-Content -Raw -Encoding UTF8 '${datos}' | ConvertFrom-Json
$i = 0
foreach ($f in $frases) { $s.SetOutputToWaveFile('${tmp}\\' + $i + '.wav'); $s.Speak($f); $i++ }
$s.SetOutputToNull()
`);
  const r = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps], { encoding: "utf8" });
  if (r.status === 3) fallo(`Windows no tiene voz para «${idioma}»: instálala en Configuración > Hora e idioma > Voz, o usa ElevenLabs.`);
  if (r.status !== 0) fallo(`La voz de Windows falló: ${r.stderr.slice(-300)}`);
  return frases.map((_, i) => join(tmp, `${i}.wav`));
}

function vozMac(frases, idioma, tmp, nombre) {
  const linea = execFileSync("say", ["-v", "?"], { encoding: "utf8" }).split("\n").find((l) => new RegExp(`\\s${idioma}[_-]`).test(l));
  if (!nombre && !linea) fallo(`macOS no tiene voz para «${idioma}»: descárgala en Ajustes > Accesibilidad > Contenido leído, o usa ElevenLabs.`);
  const voz = nombre || linea.split(/\s{2,}/)[0].trim();
  return frases.map((f, i) => {
    const txt = join(tmp, `${i}.txt`), out = join(tmp, `${i}.aiff`);
    writeFileSync(txt, f.dicho);
    execFileSync("say", ["-v", voz, "-f", txt, "-o", out]);
    return out;
  });
}

function vozLinux(frases, idioma, tmp, nombre) {
  if (spawnSync("espeak-ng", ["--version"]).status !== 0) fallo("Falta espeak-ng (sudo apt install espeak-ng), o usa ElevenLabs.");
  return frases.map((f, i) => {
    const txt = join(tmp, `${i}.txt`), out = join(tmp, `${i}.wav`);
    writeFileSync(txt, f.dicho);
    execFileSync("espeak-ng", ["-v", nombre || idioma, "-f", txt, "-w", out]);
    return out;
  });
}

function vozSistema(frases, idioma, nombre) {
  const tmp = mkdtempSync(join(tmpdir(), "mente-voz-"));
  try {
    const hacer = { win32: vozWindows, darwin: vozMac }[process.platform] || vozLinux;
    return unirTomas(frases, hacer(frases, idioma, tmp, nombre).map(leerMono));
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

function vozMuda(frases) {
  return unirTomas(frases, frases.map((f) => {
    const m = new Float32Array(Math.round((palabrasDichas(f.dicho).length / 2.6) * SR));
    m[0] = m[m.length - 1] = 0.02;
    return m;
  }));
}

async function vozElevenLabs(frases, a) {
  const clave = leerClaveVoz();
  if (!clave) fallo("No hay clave de ElevenLabs: usa el comando «clave». Nunca se pide en el chat.");
  if (!a.elevenlabs_voz) fallo("Falta el id de la voz: ajustes elevenlabs_voz=<id de una voz de tu cuenta>.");
  const base = process.env.MENTE_ELEVENLABS_URL || "https://api.elevenlabs.io";
  const r = await fetch(`${base}/v1/text-to-speech/${a.elevenlabs_voz}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": clave, "content-type": "application/json" },
    body: JSON.stringify({ text: frases.map((f) => f.dicho).join(" "), model_id: a.elevenlabs_modelo }),
  });
  if (!r.ok) fallo(`ElevenLabs respondió ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json(), al = j.alignment || j.normalized_alignment;
  const tmp = mkdtempSync(join(tmpdir(), "mente-voz-")), mp3 = join(tmp, "v.mp3");
  writeFileSync(mp3, Buffer.from(j.audio_base64, "base64"));
  const audio = leerMono(mp3);
  rmSync(tmp, { recursive: true, force: true });

  const tiempos = [];
  let actual = null, texto = "";
  const cerrar = () => { if (actual && tieneSonido(texto)) tiempos.push(actual); actual = null; texto = ""; };
  al.characters.forEach((c, i) => {
    if (/\s/.test(c)) return cerrar();
    actual ||= { inicio: al.character_start_times_seconds[i] };
    actual.fin = al.character_end_times_seconds[i];
    texto += c;
  });
  cerrar();
  const todas = frases.flatMap((f) => palabrasDichas(f.dicho));
  if (tiempos.length === todas.length) return { audio, tiempos };
  console.log(`Aviso: la voz trae ${tiempos.length} palabras y el guion ${todas.length}; los tiempos serán aproximados.`);
  return { audio, tiempos: repartir(todas, tiempos[0]?.inicio ?? 0, tiempos.at(-1)?.fin ?? audio.length / SR) };
}

// Pasa de palabras habladas a palabras escritas: «IA» dicho «i a» ocupa dos tiempos y un solo subtítulo.
function asignar(frases, tiempos) {
  let k = 0;
  return frases.map((f, i) => {
    const palabras = [];
    for (const tok of f.tokens) {
      const n = palabrasDichas(tok.dicho).length;
      if (!n) { if (palabras.length) palabras.at(-1).texto += ` ${tok.texto}`; continue; }
      palabras.push({ texto: tok.texto, destacada: tok.destacada, inicio: r2(tiempos[k].inicio), fin: r2(tiempos[k + n - 1].fin) });
      k += n;
    }
    return { n: i + 1, texto: f.texto, inicio: palabras[0].inicio, fin: palabras.at(-1).fin, palabras };
  });
}

export default async function voz(args) {
  const { sueltos, op } = leerArgs(args);
  const dir = carpetaDe(sueltos[0]), a = leerAjustes(), motor = op.motor || a.voz, frases = leerGuion(dir);
  if (!frases.length) fallo("guion.txt está vacío.");
  const firma = createHash("sha256").update(JSON.stringify([motor, a.idioma, a.elevenlabs_voz, a.sistema_voz, frases.map((f) => [f.texto, f.dicho])])).digest("hex").slice(0, 16);
  const carpeta = join(dir, "voz"), archivo = join(carpeta, "tiempos.json");
  mkdirSync(carpeta, { recursive: true });
  // Si nada cambió no se pide otra toma: con ElevenLabs cada una cuesta dinero.
  let datos = existsSync(archivo) ? JSON.parse(readFileSync(archivo, "utf8")) : null;
  if (!datos || datos.firma !== firma || op.rehacer) {
    const hecho = motor === "elevenlabs" ? await vozElevenLabs(frases, a) : motor === "muda" ? vozMuda(frases) : vozSistema(frases, a.idioma, a.sistema_voz);
    const duracion = hecho.audio.length / SR + COLA, audio = new Float32Array(Math.round(duracion * SR));
    audio.set(hecho.audio);
    guardarWav(join(carpeta, "voz.wav"), audio);
    datos = { firma, motor, duracion: r2(duracion), frases: asignar(frases, hecho.tiempos) };
    writeFileSync(archivo, JSON.stringify(datos, null, 1) + "\n");
  }
  console.log(`Voz: ${datos.motor}, ${datos.duracion} s, ${datos.frases.length} frases`);
  for (const f of datos.frases) console.log(`${String(f.n).padStart(2)} ${f.inicio.toFixed(2)}-${f.fin.toFixed(2)}  ${f.palabras.map((p) => `${p.texto}@${p.inicio.toFixed(2)}`).join(" ")}`);
}
