#!/usr/bin/env node
// Punto de entrada único: node scripts/mv.mjs <comando> ...
// Cada comando se carga bajo demanda para que `doctor` funcione antes de instalar dependencias.
const AYUDA = `mente-videos

  doctor                          comprueba la máquina
  instalar                        instala las dependencias de la skill
  ajustes [clave=valor ...]       ve o cambia los ajustes guardados
  voces                           lista las voces disponibles para el motor elegido
  assets                          lista las letras, efectos, audios y texturas del creador
  clave                           abre una página local para guardar la clave de ElevenLabs
  nuevo "<idea>"                  crea un proyecto en la carpeta de revisión
  voz <proyecto> [--rehacer]      genera la voz y los tiempos de cada palabra
  ver <proyecto> [qué]            mira fotogramas: 12.4 | 3-6 | frase 5 | escenas
  revisar <proyecto>              busca tramos quietos, saltos y subtítulos difíciles de leer
  sonido <proyecto> [--catalogo]  genera la pista de efectos
  render <proyecto> [--borrador] [--desde s] [--hasta s] [--fps n]
`;
const COMANDOS = ["doctor", "instalar", "ajustes", "voces", "assets", "clave", "nuevo", "voz", "ver", "revisar", "sonido", "render"];
const [cmd, ...resto] = process.argv.slice(2);
if (!COMANDOS.includes(cmd)) {
  console.log(AYUDA);
  process.exit(cmd && !["ayuda", "--help", "-h"].includes(cmd) ? 1 : 0);
}
const { default: ejecutar } = await import(`./cmd/${cmd}.mjs`);
await ejecutar(resto);
