// Devuelve la lista de sonidos. Los momentos salen de la voz, así siguen a la imagen si cambia el guion.
// La música baja sola mientras habla la voz. Ve todos los sonidos con `sonido --catalogo`.
export default ({ voz }) => [
  { musica: "ambiente", db: -22 },
  { efecto: "aire", t: 0, db: -16 },
  { efecto: "golpe", t: voz.en("expande"), db: -10 },
];
