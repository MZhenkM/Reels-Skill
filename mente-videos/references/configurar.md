# Configurar mente-videos

Sigue estos pasos cuando el creador pida instalar o configurar, o cuando `doctor` diga que falta algo. Hazlo tú todo:
al creador solo le corresponde responder y dar permisos. Háblale sin tecnicismos. `$SKILL` es la carpeta de la skill.

## 1. Prepara el ordenador

Instala lo que falte:

- **Node 20 o superior.** Windows: `winget install OpenJS.NodeJS.LTS`. Mac: `brew install node`. Linux: el gestor de
  paquetes de su sistema, o NodeSource si su versión es antigua.
- **ffmpeg.** Windows: `winget install Gyan.FFmpeg`. Mac: `brew install ffmpeg`. Linux: `apt install ffmpeg` o equivalente.
- **Linux, para la voz local:** `espeak-ng`.

Si acabas de instalar algo y la terminal no lo encuentra, actualiza su `PATH` o abre una terminal nueva.

## 2. Pregunta

Usa preguntas con opciones cuando la herramienta exista, y agrúpalas para no alargar la conversación. Propón siempre una
opción recomendada.

1. **Carpetas.** Propón una carpeta `mente-videos` dentro de Vídeos o Documentos, con tres subcarpetas, y deja que elija
   otras rutas:
   - `revision`: proyectos y borradores;
   - `finales`: vídeos terminados;
   - `assets`: lo que quiera usar en sus vídeos.
2. **Voz.** Recomienda ElevenLabs y explícale la diferencia:
   - **ElevenLabs (recomendada):** suena natural y da el tiempo exacto de cada palabra, así que los subtítulos y las
     animaciones van mejor sincronizados. Usa su cuenta y su saldo.
   - **Local:** gratis y sin cuenta, pero suena robótica y sus tiempos son aproximados. Sirve para una primera prueba, y
     puede cambiar a ElevenLabs cuando quiera.
3. **Idioma.**
4. **Estilo.** Pregúntale con sus palabras:
   - de qué temas habla y para quién;
   - cómo cuenta las cosas: serio, divertido, directo...;
   - qué aspecto quiere: colores, tipo de dibujo y referencias que le gusten;
   - cómo quiere cerrar sus vídeos.

No propongas un estilo por defecto ni rellenes sus respuestas: el estilo es lo que hace que sus vídeos sean suyos.

## 3. Guarda la configuración

```
ajustes carpeta_revision=<ruta> carpeta_finales=<ruta> carpeta_assets=<ruta> idioma=<código> voz=<sistema|elevenlabs>
ajustes color_texto=<hex> color_acento=<hex>
```

`ajustes` crea las carpetas, y en la de assets crea `letras`, `efectos`, `audios` y `texturas`.

Guarda en `~/.mente-videos/estilo.md` sus respuestas de estilo, con sus palabras.

## 4. Elige la voz

- **Si eligió ElevenLabs,** ejecuta `clave` en segundo plano. Se abre una web en su ordenador con los pasos para crear la
  clave y un campo para pegarla. Avísale de que la web se ha abierto y espera a que el comando termine: puede tardar
  varios minutos, y se cierra solo al guardar. Si la web no se abre, dale el enlace que imprime el comando. Nunca pidas la
  clave en el chat ni leas `~/.mente-videos/.env`.
- Ejecuta `voces` y pregúntale qué tipo de voz prefiere o si quiere que le recomiendes una.
- Recomienda una voz en su idioma cuyo tono encaje con su estilo, y dale el enlace de la muestra para que la oiga.
- Guarda la elegida: `ajustes elevenlabs_voz=<id>` o `ajustes sistema_voz="<nombre>"`.
- Si no hay voz local en su idioma, explícale cómo instalarla o propón ElevenLabs.

## 5. Termina

1. Ejecuta `doctor` y arregla lo que diga.
2. Dile dónde está su carpeta de assets y qué puede poner en cada subcarpeta:
   - `letras`: archivos `.ttf` u `.otf`;
   - `efectos`: sonidos cortos;
   - `audios`: música o audios largos;
   - `texturas`: imágenes.
3. Dile en una línea que ya puede pedir un vídeo con `/mente-videos` y una idea.

Si después añade una letra, usa `ajustes letra="Nombre de la letra"`. Recuérdale que use solo material que tenga permiso
para usar.
