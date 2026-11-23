export const PUZZLE_LEVELS = [
  { id: 1, name: 'Nivel 1 · Iniciación', elo: '0–900',     proOnly: false },
  { id: 2, name: 'Nivel 2 · Club',       elo: '900–1500',  proOnly: true },
  { id: 3, name: 'Nivel 3 · Avanzado',   elo: '1500–2000', proOnly: true },
  { id: 4, name: 'Nivel 4 · Maestro',    elo: '2000+',     proOnly: true }
];

export const PUZZLES = [
  // --- NIVEL 1: INICIACIÓN ---
  {
    id: 'cl-l1-pasillo',
    level: 1,
    variant: 'classic',
    title: 'Mate del Pasillo',
    theme: 'Mate en 1',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    solution: ['d1d8'],
    hint: 'El Rey negro está encerrado detrás de sus propios peones en la octava fila.',
    explanation: 'La Torre entra en d8 dando jaque mate inmediato porque los peones impiden cualquier escape.'
  },
  {
    id: 'cl-l1-pastor',
    level: 1,
    variant: 'classic',
    title: 'Golpe al Punto f7',
    theme: 'Mate en 1',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w - - 0 4',
    solution: ['h5f7'],
    hint: 'Coordina tu Dama con el Alfil de c4 sobre la casilla f7.',
    explanation: 'Dama captura f7 apoyada por el Alfil en c4; el Rey no tiene escapatoria.'
  },
  {
    id: 'f960-l1-bateria',
    level: 1,
    variant: 'fischer960',
    title: 'Batería Diagonal 960',
    theme: 'Mate en 1 · 960',
    fen: 'bbrn1rk1/pppp1ppp/4p3/8/8/2Q5/PBPPPPPP/1R2K1NR w - - 0 1',
    solution: ['c3g7'],
    hint: 'Aprovecha la gran diagonal del Alfil en b2 apoyando a tu Dama.',
    explanation: 'En Fischer 960 los Alfiles de esquina forman baterías letales: Dama por g7 es mate protegido por el Alfil.'
  },

  // --- NIVEL 2: CLUB ---
  {
    id: 'cl-l2-desviacion',
    level: 2,
    variant: 'classic',
    title: 'Desviación en Octava Fila',
    theme: 'Mate en 2',
    fen: '2r3k1/5ppp/8/8/8/8/4QPPP/4R1K1 w - - 0 1',
    solution: ['e2e8', 'c8e8', 'e1e8'],
    hint: 'Sacrifica la Dama en e8 para obligar a la Torre defensora a abandonar la casilla.',
    explanation: 'Dama a e8 jaque fuerza Torre por e8 y tu Torre remata en e8 con jaque mate.'
  },
  {
    id: 'cl-l2-tenedor',
    level: 2,
    variant: 'classic',
    title: 'Tenedor Real de Caballo',
    theme: 'Ataque Doble',
    fen: 'r3k3/pp3ppp/2p5/3N4/8/8/PPP2PPP/4K3 w - - 0 1',
    solution: ['d5c7', 'e8d7', 'c7a8'],
    hint: 'Salta con el Caballo dando jaque al Rey y atacando la Torre de a8 al mismo tiempo.',
    explanation: 'Caballo a c7 jaque fuerza al Rey a moverse y capturas la Torre de a8 gratis.'
  },
  {
    id: 'f960-l2-pasillo960',
    level: 2,
    variant: 'fischer960',
    title: 'Sacrificio en Columna d (960)',
    theme: 'Mate en 2 · 960',
    fen: 'b1r3k1/pp3ppp/8/8/8/3Q4/PB3PPP/3R2K1 w - - 0 1',
    solution: ['d3d8', 'c8d8', 'd1d8'],
    hint: 'Tu Dama y tu Torre forman una batería letal sobre la columna d.',
    explanation: 'Dama a d8 jaque obliga a Torre por d8, dejando la octava fila indefensa ante Torre por d8 mate.'
  },

  // --- NIVEL 3: AVANZADO ---
  {
    id: 'cl-l3-coz',
    level: 3,
    variant: 'classic',
    title: 'Mate de la Coz',
    theme: 'Mate en 2 · Sacrificio',
    fen: 'r4r1k/ppp3pp/7N/8/8/1Q6/PPP2PPP/4R1K1 w - - 0 1',
    solution: ['b3g8', 'f8g8', 'h6f7'],
    hint: 'Sacrifica tu Dama en g8 (protegida por el Caballo) para encerrar al Rey rival.',
    explanation: 'Dama a g8 jaque obliga a Torre por g8 y Caballo a f7 remata con un mate ahogado clásico.'
  },
  {
    id: 'cl-l3-anastasia',
    level: 3,
    variant: 'classic',
    title: 'Mate de Anastasia',
    theme: 'Mate en 2 · Patrón',
    fen: 'r2q3k/pp2N1pp/8/7Q/8/5R2/PP3PP1/6K1 w - - 0 1',
    solution: ['h5h7', 'h8h7', 'f3h3'],
    hint: 'El Caballo en e7 quita las casillas g8 y g6. Abre la columna h con un sacrificio.',
    explanation: 'Dama por h7 jaque fuerza Rey por h7 y Torre a h3 sella el famoso Mate de Anastasia.'
  },
  {
    id: 'f960-l3-coz960',
    level: 3,
    variant: 'fischer960',
    title: 'Asfixia Real en 960',
    theme: 'Mate en 2 · 960',
    fen: 'bb1r1r1k/ppp3pp/7N/8/8/1Q6/PPP2PPP/4R1K1 w - - 0 1',
    solution: ['b3g8', 'f8g8', 'h6f7'],
    hint: 'Encierra al Rey en h8 obligando a su propia Torre a taparle la última salida.',
    explanation: 'Tras Dama a g8 jaque y Torre por g8, el Caballo entra en f7 dando mate imparable.'
  },

  // --- NIVEL 4: MAESTRO & 960 ---
  {
    id: 'cl-l4-opera',
    level: 4,
    variant: 'classic',
    title: 'Mate de la Ópera (Morphy)',
    theme: 'Mate en 2 · Obra Maestra',
    fen: '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w - - 0 1',
    solution: ['b3b8', 'd7b8', 'd1d8'],
    hint: 'Desvía al Caballo de d7 sacrificando la Dama en la octava fila.',
    explanation: 'Dama a b8 jaque obliga a Caballo por b8, despejando la columna d para Torre a d8 mate apoyada por el Alfil en g5.'
  },
  {
    id: 'cl-l4-canon',
    level: 4,
    variant: 'classic',
    title: 'Cañón de Alekhine',
    theme: 'Mate en 3 · Forzado',
    fen: 'r1r3k1/pp3ppp/8/8/8/4Q3/PP2RPPP/4R1K1 w - - 0 1',
    solution: ['e3e8', 'c8e8', 'e2e8', 'a8e8', 'e1e8'],
    hint: 'Lanza tus tres piezas mayores una detrás de otra sobre la casilla e8.',
    explanation: 'Dama a e8+, Torre por e8+ y finalmente la última Torre en e8 demuelen por completo la defensa negra.'
  },
  {
    id: 'f960-l4-sobrecarga',
    level: 4,
    variant: 'fischer960',
    title: 'Sobrecarga y Batería 960',
    theme: 'Mate en 2 · 960',
    fen: 'bb4k1/pp3rpp/8/8/3Q4/8/PB3PPP/4R1K1 w - - 0 1',
    solution: ['e1e8', 'f7f8', 'd4g7'],
    hint: 'La Torre negra en f7 es la única defensora de g7. Oblígala a abandonar la séptima fila con jaque.',
    explanation: 'Torre a e8 jaque fuerza Torre a f8, sobrecargando la defensa y permitiendo Dama por g7 mate protegido por el Alfil en b2.'
  }
];
