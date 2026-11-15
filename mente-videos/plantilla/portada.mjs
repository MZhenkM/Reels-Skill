// La portada sale de un fotograma del vídeo con el título encima. Mírala con `ver <proyecto> portada`.
//   t: el segundo que sirve de fondo; elige uno donde se vea lo importante.
//   titulo: de 1 a 4 líneas cortas. resalta: la línea (o lista de líneas) en color de acento.
//   posicion: "abajo", "arriba" o "centro". Pon el título donde no tape el dibujo.
//   Opcionales: etiqueta ("CIENCIA"), zoom y foco ([x, y]) para acercar, mover ([dx, dy]) para dejar sitio al título,
//   color y acento, y dibujar(g, { k, W, H }) para añadir lo que quieras encima.
export default {
  t: 2,
  titulo: ["¿POR QUÉ", "FLOTA", "EL HIELO?"],
  resalta: 1,
  posicion: "abajo",
};
