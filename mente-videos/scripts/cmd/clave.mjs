// Abre una web solo en este ordenador para pegar la clave de ElevenLabs. La comprueba, la guarda en ~/.mente-videos/.env
// y deja elegida una voz en el idioma del creador. La clave no pasa por el chat.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { archivoEnv, guardarAjustes, guardarClaveVoz, leerAjustes } from "../lib/base.mjs";

const PAGINA = (aviso = "", listo = false) => `<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Tu clave de voz</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:#ffcb1f;color:#101a5c;font:18px/1.5 "Segoe UI",system-ui,sans-serif}
main{width:100%;max-width:540px;background:#fff6e0;border:5px solid #101a5c;border-radius:28px;padding:32px}
h1{margin:0 0 16px;font-size:clamp(32px,8vw,44px);line-height:1.05;font-weight:800;letter-spacing:-.02em}
ol{margin:0 0 22px;padding-left:24px}li{margin:7px 0}a{color:#2233d8;font-weight:700}
input{width:100%;padding:15px;font:16px ui-monospace,Consolas,monospace;color:#101a5c;background:#fff;border:3px solid #101a5c;border-radius:14px}
button{width:100%;margin-top:12px;padding:15px;font:800 18px "Segoe UI",system-ui,sans-serif;color:#ffcb1f;background:#101a5c;border:0;border-radius:999px;cursor:pointer}
:focus-visible{outline:3px solid #2233d8;outline-offset:3px}
.aviso{margin:16px 0 0;font-weight:700;color:#a3122a}.ok{margin:0;font-size:22px;font-weight:700}.nota{margin:18px 0 0;font-size:15px}
</style><main>
${listo ? `<h1>Clave guardada</h1><p class="ok">${aviso}</p>` : `<h1>Pega tu clave de ElevenLabs</h1>
<ol><li>Abre <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noreferrer">tus claves de ElevenLabs</a>.</li>
<li>Pulsa <b>Create Key</b>, ponle un nombre y créala.</li><li>Cópiala y pégala aquí.</li></ol>
<form method="post"><label for="clave">Tu clave</label><input id="clave" name="clave" type="password" placeholder="sk_..." autocomplete="off" spellcheck="false" autofocus>
<button>Guardar mi clave</button></form>${aviso ? `<p class="aviso">${aviso}</p>` : ""}
<p class="nota">Se guarda solo en este ordenador. No la pegues en el chat ni la compartas.</p>`}
</main></html>`;

// Devuelve las voces de la cuenta, null si no se pudo comprobar y false si ElevenLabs rechaza la clave.
async function leerVoces(clave) {
  const base = process.env.MENTE_ELEVENLABS_URL || "https://api.elevenlabs.io";
  try {
    const r = await fetch(`${base}/v1/voices`, { headers: { "xi-api-key": clave } });
    if (r.status === 401) return false;
    return r.ok ? (await r.json()).voices || [] : null;
  } catch { return null; }
}

export default function clave() {
  const servidor = createServer((req, res) => {
    const responder = (aviso, listo) => { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(PAGINA(aviso, listo)); };
    if (req.method !== "POST") return responder();
    let cuerpo = "";
    req.on("data", (d) => { cuerpo += d; });
    req.on("end", async () => {
      const valor = new URLSearchParams(cuerpo).get("clave")?.trim() || "";
      if (!/^\S{20,}$/.test(valor)) return responder("Esa clave parece incompleta. Cópiala otra vez.");
      const voces = await leerVoces(valor);
      if (voces === false) return responder("ElevenLabs no reconoce esa clave. Cópiala otra vez o crea una nueva.");
      guardarClaveVoz(valor);
      const a = leerAjustes(), voz = voces?.find((v) => v.labels?.language === a.idioma) ?? voces?.[0];
      a.voz = "elevenlabs";
      if (!a.elevenlabs_voz && voz) a.elevenlabs_voz = voz.voice_id;
      guardarAjustes(a);
      responder("Ya puedes cerrar esta pestaña y volver a Claude.", true);
      console.log(`Clave guardada en ${archivoEnv()}.`);
      console.log(a.elevenlabs_voz ? `Voz provisional: ${voz?.name || a.elevenlabs_voz}. Usa «voces» para elegir otra.` : "Falta elegir voz: usa «voces» o escribe el id con ajustes.");
      setTimeout(() => process.exit(0), 200);
    });
  });
  servidor.listen(0, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${servidor.address().port}/`;
    console.log(`Web de la clave: ${url}`);
    if (process.env.MENTE_SIN_NAVEGADOR) return;
    const [cmd, args] = { win32: ["cmd", ["/c", "start", "", url]], darwin: ["open", [url]] }[process.platform] || ["xdg-open", [url]];
    spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();
  });
  setTimeout(() => { console.log("Tiempo agotado: no se guardó ninguna clave."); process.exit(1); }, 900000);
}
