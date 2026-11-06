// Lista las voces del motor elegido, para recomendar una y elegirla. Listarlas no gasta saldo de ElevenLabs.
import { execFileSync, spawnSync } from "node:child_process";
import { fallo, leerAjustes, leerClaveVoz } from "../lib/base.mjs";

const POWERSHELL = `Add-Type -AssemblyName System.Speech
(New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices() | ForEach-Object {
  $i = $_.VoiceInfo; "$($i.Name)|$($i.Culture.TwoLetterISOLanguageName)|$($i.Gender)" }`;

function delSistema(idioma) {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", POWERSHELL], { encoding: "utf8" });
    return r.stdout.split(/\r?\n/).filter(Boolean).map((l) => l.split("|")).filter((v) => v[1] === idioma).map(([nombre, , genero]) => `${nombre} (${genero})`);
  }
  if (process.platform === "darwin") {
    return execFileSync("say", ["-v", "?"], { encoding: "utf8" }).split("\n")
      .filter((l) => new RegExp(`\\s${idioma}[_-]`).test(l)).map((l) => l.split(/\s{2,}/)[0].trim());
  }
  return [`${idioma} (espeak-ng; variantes: ${idioma}+f3, ${idioma}+m3)`];
}

async function deElevenLabs(idioma) {
  const clave = leerClaveVoz();
  if (!clave) fallo("No hay clave de ElevenLabs: usa el comando «clave». Nunca se pide en el chat.");
  const base = process.env.MENTE_ELEVENLABS_URL || "https://api.elevenlabs.io";
  const r = await fetch(`${base}/v1/voices`, { headers: { "xi-api-key": clave } });
  if (!r.ok) fallo(`ElevenLabs respondió ${r.status}. La clave necesita permiso para leer voces, o elige el id en su web.`);
  const voces = (await r.json()).voices || [];
  const propias = voces.filter((v) => v.labels?.language === idioma), otras = voces.filter((v) => v.labels?.language !== idioma);
  const linea = (v) => `${v.voice_id} | ${v.name} | ${[v.labels?.gender, v.labels?.accent, v.labels?.language].filter(Boolean).join(", ")} | muestra: ${v.preview_url || "sin muestra"}`;
  return [`En «${idioma}»: ${propias.length}`, ...propias.map(linea), `\nEn otros idiomas: ${otras.length}`, ...otras.map(linea)];
}

export default async function voces() {
  const a = leerAjustes();
  const lista = a.voz === "elevenlabs" ? await deElevenLabs(a.idioma) : delSistema(a.idioma);
  console.log(`Motor: ${a.voz}, idioma: ${a.idioma}`);
  console.log(lista.length ? lista.join("\n") : "No hay voces instaladas para este idioma.");
}
