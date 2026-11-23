export const ACADEMY_LEVELS = [
  { id: 1, name: 'Nivel 1 · Iniciación', elo: '0–900',     proOnly: false },
  { id: 2, name: 'Nivel 2 · Club',       elo: '900–1500',  proOnly: true },
  { id: 3, name: 'Nivel 3 · Avanzado',   elo: '1500–2000', proOnly: true },
  { id: 4, name: 'Nivel 4 · Maestro',    elo: '2000+',     proOnly: true }
];

export const ACADEMY_LESSONS = [
  // --- NIVEL 1: INICIACIÓN ---
  {
    id: 'l1-principios',
    level: 1,
    category: 'basics',
    badge: 'NIVEL 1 · GRATIS',
    title: 'Las 3 Reglas de Oro',
    summary: 'Controla el centro, desarrolla Caballos y Alfiles y asegura a tu Rey.',
    positionId: 518,
    playerColor: 'w',
    steps: [
      { from: 'e2', to: 'e4', text: 'Peón a e 4. Regla uno: ocupa el centro y abre paso a tu Dama y Alfil.' },
      { from: 'e7', to: 'e5', text: 'Las negras luchan por el centro de forma simétrica.' },
      { from: 'g1', to: 'f3', interactive: true, prompt: 'Tu turno: desarrolla el Caballo de g1 atacando el peón central de e5.', text: '¡Exacto! Caballo a efe 3 desarrolla una pieza mientras amenaza el peón de e 5.' },
      { from: 'b8', to: 'c6', text: 'Las negras defienden e 5 desarrollando su Caballo.' },
      { from: 'f1', to: 'c4', interactive: true, prompt: 'Tu turno: desarrolla tu Alfil a c4 apuntando al punto débil f7.', text: '¡Muy bien! El Alfil en ce 4 domina la diagonal y presiona efe 7.' },
      { from: 'g8', to: 'f6', text: 'Las negras desarrollan su segundo Caballo.' },
      { from: 'e1', to: 'g1', castle: 'K', interactive: true, prompt: 'Tu turno: protege al Rey ejecutando el enroque corto.', text: '¡Perfecto! Regla tres cumplida: Rey seguro y Torre lista para entrar en juego.' }
    ]
  },
  {
    id: 'l1-enroque-960',
    level: 1,
    category: 'basics',
    badge: 'NIVEL 1 · FISCHER 960',
    title: 'Desarrollo y Enroque 960',
    summary: 'Aprende a despejar la primera fila y ejecutar el enroque largo en Fischer 960.',
    positionId: 0,
    playerColor: 'w',
    steps: [
      { from: 'd2', to: 'd4', text: 'Posición Fischer cero. Abrimos el centro para liberar la Dama.' },
      { from: 'd7', to: 'd5', text: 'Las negras contestan ocupando espacio central.' },
      { from: 'd1', to: 'c3', interactive: true, prompt: 'Tu turno: saca el Caballo de d1 a c3 para despejar la primera fila.', text: '¡Bien! Desarrollar los Caballos rápido es clave para habilitar el enroque 960.' },
      { from: 'd8', to: 'c6', text: 'Las negras imitan el desarrollo.' },
      { from: 'e1', to: 'f3', text: 'Activamos el segundo Caballo y liberamos e 1.' },
      { from: 'e8', to: 'f6', text: 'Las negras completan el desarrollo de sus Caballos.' },
      { from: 'c1', to: 'e3', interactive: true, prompt: 'Tu turno: mueve la Dama de c1 a e3 para dejar libres c1, d1 y e1.', text: '¡Excelente! Ahora el camino hacia el flanco de dama está completamente libre.' },
      { from: 'a7', to: 'a6', text: 'Las negras hacen una jugada tranquila.' },
      { from: 'g1', to: 'f1', castle: 'Q', interactive: true, prompt: 'Tu turno: ejecuta el enroque largo 960 (toca el Rey en g1 y luego su Torre en f1).', text: '¡Dominado! En Fischer 960 el Rey salta hasta ce 1 y la Torre pasa a de 1.' }
    ]
  },

  // --- NIVEL 2: CLUB ---
  {
    id: 'l2-italiana',
    level: 2,
    category: 'openings',
    badge: 'NIVEL 2 · APERTURA',
    title: 'Apertura Italiana · Ruptura d4',
    summary: 'Aprende el plan clásico de la Giuoco Piano para apoderarte del centro.',
    positionId: 518,
    playerColor: 'w',
    steps: [
      { from: 'e2', to: 'e4', text: 'Peón a e 4 buscando lucha abierta desde el inicio.' },
      { from: 'e7', to: 'e5', text: 'Respuesta clásica de las negras.' },
      { from: 'g1', to: 'f3', text: 'Caballo a efe 3 presionando el centro.' },
      { from: 'b8', to: 'c6', text: 'Caballo a ce 6 defiende el peón.' },
      { from: 'f1', to: 'c4', interactive: true, prompt: 'Tu turno: plantea la Apertura Italiana llevando el Alfil a c4.', text: 'Alfil a ce 4 define la Apertura Italiana.' },
      { from: 'f8', to: 'c5', text: 'Las negras contestan con Alfil a ce 5.' },
      { from: 'c2', to: 'c3', interactive: true, prompt: 'Tu turno: prepara el golpe central avanzando el peón de c2 a c3.', text: 'Peón a ce 3 apoya el avance d4 y crea una casilla de escape para tu Alfil.' },
      { from: 'g8', to: 'f6', text: 'Las negras contraatacan tu peón de e 4.' },
      { from: 'd2', to: 'd4', interactive: true, prompt: 'Tu turno: ¡rompe el centro avanzando el peón a d4!', text: '¡Golpe perfecto! Peón a de 4 abre líneas con gran iniciativa para las blancas.' }
    ]
  },
  {
    id: 'l2-gambito-dama',
    level: 2,
    category: 'gambits',
    badge: 'NIVEL 2 · GAMBITO',
    title: 'Gambito de Dama',
    summary: 'Presiona el centro negro y clava al principal defensor de d5.',
    positionId: 518,
    playerColor: 'w',
    steps: [
      { from: 'd2', to: 'd4', text: 'Peón a de 4 para controlar el centro con solidez.' },
      { from: 'd7', to: 'd5', text: 'Las negras igualan el control central.' },
      { from: 'c2', to: 'c4', interactive: true, prompt: 'Tu turno: ofrece el Gambito de Dama atacando d5 con el peón c.', text: '¡Correcto! Peón a ce 4 reta al peón central negro.' },
      { from: 'e7', to: 'e6', text: 'Las negras eligen el Gambito de Dama Rehusado.' },
      { from: 'b1', to: 'c3', interactive: true, prompt: 'Tu turno: añade presión sobre d5 desarrollando tu Caballo a c3.', text: 'Caballo a ce 3 aumenta el control sobre d5 y e4.' },
      { from: 'g8', to: 'f6', text: 'Las negras defienden el centro con su Caballo.' },
      { from: 'c1', to: 'g5', interactive: true, prompt: 'Tu turno: clava el Caballo de f6 llevando tu Alfil a g5.', text: '¡Clave estratégica! Alfil a ge 5 inmoviliza al Caballo y debilita la defensa de de 5.' }
    ]
  },

  // --- NIVEL 3: AVANZADO ---
  {
    id: 'l3-siciliana',
    level: 3,
    category: 'defenses',
    badge: 'NIVEL 3 · DEFENSA (NEGRAS)',
    title: 'Siciliana Najdorf con Negras',
    summary: 'Juega desde el bando negro: crea asimetría y contraataca el centro blanco.',
    positionId: 518,
    playerColor: 'b',
    steps: [
      { from: 'e2', to: 'e4', text: 'Las blancas abren con peón a e 4.' },
      { from: 'c7', to: 'c5', interactive: true, prompt: 'Juegas con Negras: responde con la Defensa Siciliana (c5).', text: '¡Excelente! Peón a ce 5 lucha por de 4 sin ceder simetría.' },
      { from: 'g1', to: 'f3', text: 'Las blancas preparan la apertura central.' },
      { from: 'd7', to: 'd6', interactive: true, prompt: 'Tu turno (Negras): controla e5 y prepara tu desarrollo con d6.', text: 'Peón a de 6 sostiene la estructura flexible de la Siciliana.' },
      { from: 'd2', to: 'd4', text: 'Las blancas abren el centro con de 4.' },
      { from: 'c5', to: 'd4', interactive: true, prompt: 'Tu turno: cambia tu peón lateral de c5 por el peón central en d4.', text: '¡Bien! Cambias un peón de flanco por un valioso peón central rival.' },
      { from: 'f3', to: 'd4', text: 'El Caballo blanco recaptura en el centro.' },
      { from: 'g8', to: 'f6', interactive: true, prompt: 'Tu turno: desarrolla el Caballo a f6 atacando el peón de e4.', text: 'Caballo a efe 6 desarrolla con ganancia de tiempo obligando a defender e 4.' },
      { from: 'b1', to: 'c3', text: 'Las blancas defienden e 4 con Caballo a ce 3.' },
      { from: 'a7', to: 'a6', interactive: true, prompt: 'Tu turno: define la Variante Najdorf jugando a6 para controlar b5.', text: '¡Nivel magistral! Peón a a 6 frena saltos a be 5 y prepara tu avalancha en el flanco de dama.' }
    ]
  },
  {
    id: 'l3-evans',
    level: 3,
    category: 'gambits',
    badge: 'NIVEL 3 · GAMBITO AVANZADO',
    title: 'Gambito Evans',
    summary: 'Sacrifica un peón lateral para ganar tiempos explosivos y destruir el centro.',
    positionId: 518,
    playerColor: 'w',
    steps: [
      { from: 'e2', to: 'e4', text: 'Arrancamos en terreno de la Apertura Italiana.' },
      { from: 'e7', to: 'e5', text: 'Las negras contestan en el centro.' },
      { from: 'g1', to: 'f3', text: 'Caballo a efe 3.' },
      { from: 'b8', to: 'c6', text: 'Caballo a ce 6.' },
      { from: 'f1', to: 'c4', text: 'Alfil a ce 4.' },
      { from: 'f8', to: 'c5', text: 'Alfil a ce 5. Momento exacto para el Gambito Evans.' },
      { from: 'b2', to: 'b4', interactive: true, prompt: 'Tu turno: sacrifica el peón en b4 para desviar al Alfil negro.', text: '¡Valiente! El Gambito Evans cede material a cambio de desarrollo relámpago.' },
      { from: 'c5', to: 'b4', text: 'Las negras aceptan el peón con su Alfil.' },
      { from: 'c2', to: 'c3', interactive: true, prompt: 'Tu turno: golpea al Alfil en b4 con c3 ganando otro tiempo.', text: 'Peón a ce 3 obliga al Alfil a perder otra jugada y prepara de 4.' },
      { from: 'b4', to: 'a5', text: 'El Alfil se retira a a 5.' },
      { from: 'd2', to: 'd4', interactive: true, prompt: 'Tu turno: abre el centro de golpe avanzando el peón a d4.', text: '¡Iniciativa total! Con el centro abierto y ventaja de desarrollo, el ataque blanco es arrollador.' }
    ]
  },

  // --- NIVEL 4: MAESTRO & 960 ---
  {
    id: 'l4-oposicion',
    level: 4,
    category: 'endgames',
    badge: 'NIVEL 4 · FINAL TÉCNICO',
    title: 'Final de Peón: Casillas Clave',
    summary: 'Técnica imprescindible: utiliza tu Rey por delante del peón para forzar la coronación.',
    fen: '3k4/8/3K4/4P3/8/8/8/8 w - - 0 1',
    playerColor: 'w',
    steps: [
      { from: 'e5', to: 'e6', interactive: true, prompt: 'Tu Rey está en sexta fila controlando d7 y e7. Empuja el peón a e6.', text: '¡Exacto! Con el Rey en sexta fila por delante del peón, la posición está ganada independientemente de a quién le toque.' },
      { from: 'd8', to: 'e8', text: 'El Rey negro intenta bloquear la casilla de coronación en e 8.' },
      { from: 'e6', to: 'e7', interactive: true, prompt: 'Tu turno: avanza el peón a séptima fila (e7) para desalojar al Rey rival.', text: 'Peón a e 7 expulsa al Rey negro de e 8.' },
      { from: 'e8', to: 'f7', text: 'El Rey negro se ve forzado a salir hacia efe 7.' },
      { from: 'd6', to: 'd7', interactive: true, prompt: 'Tu turno: controla la casilla de coronación e8 moviendo tu Rey a d7.', text: '¡Victoria técnica! Tu Rey domina e 8 y nada puede impedir la nueva Dama.' }
    ]
  },
  {
    id: 'l4-f960-plan',
    level: 4,
    category: 'basics',
    badge: 'NIVEL 4 · ESTRATEGIA 960',
    title: 'Alfiles de Esquina en Fischer 960',
    summary: 'Cómo convertir dos Alfiles encerrados en a1 y b1 en cañones que dominan todo el tablero.',
    positionId: 0,
    playerColor: 'w',
    steps: [
      { from: 'b2', to: 'b3', interactive: true, prompt: 'En Fischer 960 #0 tienes Alfiles en a1 y b1. Libera ya al de a1 con b3.', text: '¡Gran visión! Peón a be 3 despierta de inmediato al Alfil de a 1 sobre la gran diagonal.' },
      { from: 'd7', to: 'd5', text: 'Las negras ocupan el centro con de 5.' },
      { from: 'c2', to: 'c4', interactive: true, prompt: 'Tu turno: reta al peón de d5 con c4 para despejar la diagonal de tu Alfil.', text: 'Peón a ce 4 presiona el centro aprovechando el apoyo escondido del Alfil en a 1.' },
      { from: 'd5', to: 'c4', text: 'Las negras capturan en ce 4.' },
      { from: 'b3', to: 'c4', interactive: true, prompt: 'Tu turno: recaptura en c4 con el peón de b3 manteniendo abiertas las líneas.', text: '¡Precisión! Mantienes mayoría central y ambas diagonales activas.' },
      { from: 'd8', to: 'c6', text: 'Las negras desarrollan el Caballo hacia ce 6.' },
      { from: 'e2', to: 'e4', interactive: true, prompt: 'Tu turno: toma espacio central con e4 preparando un muro dominante.', text: 'Peón a e 4 controla el centro con autoridad.' },
      { from: 'e7', to: 'e5', text: 'Las negras buscan frenar el avance blanco.' },
      { from: 'd2', to: 'd4', interactive: true, prompt: 'Tu turno: golpea con d4 para abrir por completo el tablero a tus Alfiles de esquina.', text: '¡Plan magistral! En posiciones asimétricas de Fischer 960, abrir diagonales para los Alfiles de esquina decide la partida.' }
    ]
  }
];
