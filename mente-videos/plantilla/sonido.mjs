// Devuelve la lista de efectos. Los momentos salen de la voz, así siguen a la imagen si cambia el guion.
export default ({ voz }) => [
  { efecto: "aire", t: 0, db: -16 },
  { efecto: "golpe", t: voz.en("expande"), db: -10 },
];
