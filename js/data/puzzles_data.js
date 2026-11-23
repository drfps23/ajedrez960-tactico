export const PUZZLES = [
  {
    id: 'cl-mate1-pasillo',
    variant: 'classic',
    title: 'Mate del Pasillo',
    theme: 'Mate en 1',
    difficulty: 'Fácil',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    solution: ['d1d8'],
    hint: 'El Rey negro está atrapado detrás de sus propios peones en la octava fila.',
    explanation: 'La Torre desciende a d8 y da jaque mate inmediato porque los peones bloquean toda escapatoria.'
  },
  {
    id: 'cl-mate1-pastor',
    variant: 'classic',
    title: 'Golpe al Punto f7',
    theme: 'Mate en 1',
    difficulty: 'Fácil',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
    solution: ['h5f7'],
    hint: 'Combina tu Dama con el Alfil de c4 sobre la casilla más débil del rival.',
    explanation: 'Dama captura en f7 con apoyo del Alfil en c4; el Rey no puede capturarla ni escapar.'
  },
  {
    id: 'cl-mate2-sacrificio',
    variant: 'classic',
    title: 'Desviación en la Octava Fila',
    theme: 'Mate en 2',
    difficulty: 'Intermedio',
    fen: '2r3k1/5ppp/8/8/8/8/4QPPP/4R1K1 w - - 0 1',
    solution: ['e2e8', 'c8e8', 'e1e8'],
    hint: 'Sacrifica la Dama con jaque en la octava fila para atraer a la Torre defensora.',
    explanation: 'Tras Dama a e8 jaque, la Torre negra está obligada a capturar y tu Torre entra en e8 dando jaque mate.'
  },
  {
    id: 'cl-fork-caballo',
    variant: 'classic',
    title: 'Tenedor Real de Caballo',
    theme: 'Ataque Doble',
    difficulty: 'Intermedio',
    fen: 'r3k3/pp3ppp/2p5/3N4/8/8/PPP2PPP/4K3 w - - 0 1',
    solution: ['d5c7', 'e8d7', 'c7a8'],
    hint: 'Salva tu Caballo atacando al Rey y a la Torre al mismo tiempo.',
    explanation: 'Caballo a c7 da jaque al Rey y ataca la Torre de a8, ganando calidad limpia en la siguiente jugada.'
  },
  {
    id: 'f960-bateria-esquina',
    variant: 'fischer960',
    title: 'Batería Diagonal 960',
    theme: 'Mate en 1 · 960',
    difficulty: 'Fácil',
    fen: 'bbrn1rk1/pppp1ppp/4p3/8/8/2Q5/PBPPPPPP/1R2K1NR w - - 0 1',
    solution: ['c3g7'],
    hint: 'Aprovecha la gran diagonal del Alfil en b2 junto con tu Dama.',
    explanation: 'En Fischer 960 los Alfiles en esquina crean baterías letales: Dama captura g7 es jaque mate protegido por el Alfil.'
  },
  {
    id: 'f960-mate-coz',
    variant: 'fischer960',
    title: 'Mate de la Coz 960',
    theme: 'Mate en 2 · 960',
    difficulty: 'Difícil',
    fen: 'bb1r1r1k/ppp3pp/7N/8/8/1Q6/PPP2PPP/4R1K1 w - - 0 1',
    solution: ['b3g8', 'f8g8', 'h6f7'],
    hint: 'Sacrifica tu Dama junto al Rey encerrado para obligar a su Torre a taparle la salida.',
    explanation: 'Dama a g8 jaque obliga a Torre por g8, y el Caballo remata en f7 con un mate ahogado espectacular.'
  }
];
