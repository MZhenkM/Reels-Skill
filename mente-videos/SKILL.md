---
name: mente-videos
description: Genera vídeos verticales explicativos dibujados con código, con voz, subtítulos, efectos y portada, a partir de una idea. Úsala cuando alguien pida crear un vídeo explicativo, reel, short o TikTok animado sobre cualquier tema, o escribir su guion, aunque no nombre la skill.
---

# mente-videos

Convierte una idea en un vídeo vertical de 1080 × 1920: investiga, escribe un guion, genera la voz, programa las escenas
y entrega el vídeo con portada y texto para publicar. Nada se publica automáticamente.

La carpeta de este archivo es `$SKILL`. Todos los comandos son `node "$SKILL/scripts/mv.mjs" <comando>`. Los proyectos y
los borradores se crean en su carpeta de revisión, y los vídeos terminados, en su carpeta de finales.

Instala y ejecuta tú lo que haga falta. Al creador solo le corresponde decidir y dar permisos.

## Antes del primer vídeo

Ejecuta `doctor`. Si falta algo, o si el creador pide instalar o configurar, sigue `references/configurar.md`. No empieces
un vídeo hasta que esté todo listo.

## Cada vídeo

Lee antes `~/.mente-videos/estilo.md` y, si existe, `~/.mente-videos/aprendido.md`. Ejecuta `assets` para ver lo que el
creador ha puesto en su carpeta y úsalo cuando encaje con el vídeo.

1. **Investiga.** Crea el proyecto con `nuevo "<idea>"`. Busca fuentes primarias y apunta cada dato con su enlace en
   `fuentes.md`. Si no puedes confirmar un dato, no lo uses.
2. **Escribe el guion** en `guion.txt`, con el tono del creador. La primera frase debe dejar claro de qué va el vídeo y
   abrir una duda. Cada frase siguiente debe poder enseñarse en imagen. Enséñale el guion y espera su visto bueno: es lo
   más barato de cambiar.
3. **Genera la voz** con `voz <proyecto>`. Imprime el segundo de cada palabra; usa esos tiempos para planificar.
4. **Planifica** en `plan.md`: qué se ve en cada frase y en qué palabra cambia la imagen.
5. **Programa las escenas** una a una, siguiendo `references/escenas.md`. La plantilla es solo un ejemplo de formato:
   sustitúyela. Dibuja según `estilo.md`. En `ejemplos/hielo/` hay un vídeo completo: consúltalo para ver cómo se
   organizan las escenas, se sincronizan con la voz y se colocan los efectos, pero no copies su aspecto.
6. **Mira lo que haces.** Tras cada cambio usa `ver <proyecto> 12.4`, `ver <proyecto> frase 3` o `ver <proyecto> escenas`
   y abre la imagen. Antes de terminar, ejecuta `revisar <proyecto>` y arregla lo que veas mal.
7. **Enseña un borrador** con `render <proyecto> --borrador` y pregunta qué cambiaría.
8. **Añade el sonido** si el creador lo quiere: edita `sonido.mjs` y ejecuta `sonido <proyecto>`. No puedes oír el
   resultado, así que pídele que lo escuche.
9. **Termina.** Edita `portada.mjs` y `post.txt` y ejecuta `render <proyecto>`. Todo queda en su carpeta de finales.

## Lo que aprende

Después de cada vídeo, apunta en `~/.mente-videos/aprendido.md` lo que el creador aprobó o rechazó, en una línea cada
cosa. Si un dibujo salió bien, ofrécele guardarlo en su kit (`references/escenas.md`). Así cada creador va construyendo
su propio estilo.

Usa solo imágenes, letras y sonidos que el creador tenga permiso para usar, y no imites el estilo de otro creador
concreto aunque te lo pidan como atajo: ayúdale a encontrar el suyo.
