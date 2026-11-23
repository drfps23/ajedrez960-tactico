export const ACADEMY_LESSONS = [
  {
    id: 'bas-principios',
    category: 'basics',
    badge: 'PRINCIPIANTES · GRATIS',
    title: 'Las 3 Reglas de Oro al Empezar',
    summary: 'Controla el centro, desarrolla Caballos y Alfiles rápido y protege al Rey con el enroque.',
    positionId: 518,
    steps: [
      { from: 'e2', to: 'e4', text: 'Peón a e 4. Regla uno: ocupa el centro y abre paso a tu Dama y Alfil.' },
      { from: 'e7', to: 'e5', text: 'Las negras responden igual luchando por las casillas centrales.' },
      { from: 'g1', to: 'f3', text: 'Caballo a efe 3. Regla dos: desarrolla tus piezas menores mientras atacas el peón de e 5.' },
      { from: 'b8', to: 'c6', text: 'Las negras defienden e 5 desarrollando su Caballo.' },
      { from: 'f1', to: 'c4', text: 'Alfil a ce 4. Apunta directo al punto efe 7, la casilla más vulnerable al inicio.' },
      { from: 'g8', to: 'f6', text: 'Las negras desarrollan su otro Caballo presionando el centro.' },
      { from: 'e1', to: 'g1', castle: 'K', text: 'Enroque corto. Regla tres: pon al Rey a salvo y activa la Torre.' }
    ]
  },
  {
    id: 'bas-enroque-960',
    category: 'basics',
    badge: 'FISCHER 960 · GRATIS',
    title: 'Cómo Jugar y Enrocar en Fischer 960',
    summary: 'Ejemplo en la posición #0: desarrolla rápido y ejecuta un enroque largo 960 aunque el Rey empiece en g1.',
    positionId: 0,
    steps: [
      { from: 'd2', to: 'd4', text: 'Posición Fischer cero. Empezamos tomando el centro y liberando la Dama de ce 1.' },
      { from: 'd7', to: 'd5', text: 'Las negras toman espacio central de forma simétrica.' },
      { from: 'd1', to: 'c3', text: 'Sacamos el Caballo de de 1 para despejar la primera fila.' },
      { from: 'd8', to: 'c6', text: 'Las negras desarrollan su Caballo hacia ce 6.' },
      { from: 'e1', to: 'f3', text: 'Activamos el segundo Caballo y liberamos la casilla e 1.' },
      { from: 'e8', to: 'f6', text: 'Las negras completan el desarrollo de sus Caballos.' },
      { from: 'c1', to: 'e3', text: 'Movemos la Dama para dejar totalmente libres ce 1, de 1 y e 1.' },
      { from: 'a7', to: 'a6', text: 'Las negras hacen una jugada de espera.' },
      { from: 'g1', to: 'f1', castle: 'Q', text: 'Enroque largo novecientos sesenta. El Rey salta desde ge 1 hasta ce 1 y la Torre pasa a de 1.' }
    ]
  },
  {
    id: 'ap-italiana',
    category: 'openings',
    badge: 'APERTURA',
    title: 'Apertura Italiana',
    summary: 'Clásica, directa y ofensiva: lucha por el centro rápido y presiona sobre f7.',
    positionId: 518,
    steps: [
      { from: 'e2', to: 'e4', text: 'Peón a e 4, apertura abierta buscando juego táctico rápido.' },
      { from: 'e7', to: 'e5', text: 'Respuesta clásica de las negras.' },
      { from: 'g1', to: 'f3', text: 'Caballo a efe 3 atacando el peón central.' },
      { from: 'b8', to: 'c6', text: 'Caballo a ce 6 defendiendo e 5.' },
      { from: 'f1', to: 'c4', text: 'Alfil a ce 4 define la Apertura Italiana, apuntando a efe 7.' },
      { from: 'f8', to: 'c5', text: 'Las negras contestan con Alfil a ce 5 en la variante Giuoco Piano.' },
      { from: 'c2', to: 'c3', text: 'Peón a ce 3 prepara el golpe central peón a de 4.' },
      { from: 'g8', to: 'f6', text: 'Caballo a efe 6 contraataca el peón de e 4.' },
      { from: 'd2', to: 'd4', text: 'Peón a de 4 rompe el centro con iniciativa para las blancas.' }
    ]
  },
  {
    id: 'ap-espanola',
    category: 'openings',
    badge: 'APERTURA',
    title: 'Apertura Española (Ruy López)',
    summary: 'La favorita de los Campeones del Mundo: presiona al defensor de e5 desde la jugada 3.',
    positionId: 518,
    steps: [
      { from: 'e2', to: 'e4', text: 'Peón a e 4 iniciando la lucha por el centro.' },
      { from: 'e7', to: 'e5', text: 'Las negras responden peón a e 5.' },
      { from: 'g1', to: 'f3', text: 'Caballo a efe 3 presionando e 5.' },
      { from: 'b8', to: 'c6', text: 'Caballo a ce 6 defiende el peón.' },
      { from: 'f1', to: 'b5', text: 'Alfil a be 5 caracteriza la Española: presiona al Caballo que sostiene el centro negro.' },
      { from: 'a7', to: 'a6', text: 'Defensa Morphy: pregunta de inmediato qué hará el Alfil.' },
      { from: 'b5', to: 'a4', text: 'El Alfil retrocede a a 4 manteniendo la presión a largo plazo.' },
      { from: 'g8', to: 'f6', text: 'Las negras desarrollan el Caballo atacando e 4.' },
      { from: 'e1', to: 'g1', castle: 'K', text: 'Enroque corto: las blancas dejan el peón indirectamente defendido y aceleran el ataque.' }
    ]
  },
  {
    id: 'def-siciliana',
    category: 'defenses',
    badge: 'DEFENSA',
    title: 'Defensa Siciliana',
    summary: 'La defensa más combativa con Negras contra 1.e4: busca asimetría y contragolpe.',
    positionId: 518,
    steps: [
      { from: 'e2', to: 'e4', text: 'Las blancas abren con peón a e 4.' },
      { from: 'c7', to: 'c5', text: 'Peón a ce 5 define la Defensa Siciliana: lucha por de 4 sin ceder simetría.' },
      { from: 'g1', to: 'f3', text: 'Caballo a efe 3 preparando el avance de 4.' },
      { from: 'd7', to: 'd6', text: 'Peón a de 6 controla e 5 y prepara el desarrollo del Alfil.' },
      { from: 'd2', to: 'd4', text: 'Las blancas abren el centro con peón a de 4.' },
      { from: 'c5', to: 'd4', text: 'Las negras cambian un peón lateral por un peón central blanco.' },
      { from: 'f3', to: 'd4', text: 'El Caballo recaptura ganando espacio central.' },
      { from: 'g8', to: 'f6', text: 'Caballo a efe 6 desarrolla atacando e 4.' },
      { from: 'b1', to: 'c3', text: 'Caballo a ce 3 defiende y deja la posición lista para una batalla táctica.' }
    ]
  },
  {
    id: 'def-francesa',
    category: 'defenses',
    badge: 'DEFENSA',
    title: 'Defensa Francesa',
    summary: 'Sólida y contragolpeadora: bloquea el centro para luego demoler la cadena blanca con c5.',
    positionId: 518,
    steps: [
      { from: 'e2', to: 'e4', text: 'Las blancas inician con peón a e 4.' },
      { from: 'e7', to: 'e6', text: 'Peón a e 6 prepara de 5 con respaldo sólido.' },
      { from: 'd2', to: 'd4', text: 'Las blancas ocupan todo el centro con sus peones.' },
      { from: 'd7', to: 'd5', text: 'Las negras desafían de inmediato el peón de e 4.' },
      { from: 'b1', to: 'c3', text: 'Caballo a ce 3 defiende el centro.' },
      { from: 'g8', to: 'f6', text: 'Caballo a efe 6 aumenta la presión sobre e 4.' },
      { from: 'e4', to: 'e5', text: 'Las blancas avanzan ganando espacio pero crean una cadena rígida.' },
      { from: 'f6', to: 'd7', text: 'El Caballo se retira a de 7 para lanzar el contragolpe peón a ce 5.' }
    ]
  },
  {
    id: 'gam-dama',
    category: 'gambits',
    badge: 'GAMBITO',
    title: 'Gambito de Dama',
    summary: 'Ofrece el peón de c4 para desviar el centro negro y dominar el tablero.',
    positionId: 518,
    steps: [
      { from: 'd2', to: 'd4', text: 'Peón a de 4, apertura cerrada de gran control posicional.' },
      { from: 'd7', to: 'd5', text: 'Las negras responden tomando el centro.' },
      { from: 'c2', to: 'c4', text: 'Peón a ce 4 ofrece el Gambito de Dama buscando destruir el centro de de 5.' },
      { from: 'e7', to: 'e6', text: 'Gambito de Dama Rehusado: las negras sostienen de 5 con solidez.' },
      { from: 'b1', to: 'c3', text: 'Caballo a ce 3 añade presión sobre el centro.' },
      { from: 'g8', to: 'f6', text: 'Caballo a efe 6 defiende de 5.' },
      { from: 'c1', to: 'g5', text: 'Alfil a ge 5 clava el Caballo e intensifica el ataque sobre el centro negro.' }
    ]
  },
  {
    id: 'gam-rey',
    category: 'gambits',
    badge: 'GAMBITO',
    title: 'Gambito de Rey',
    summary: 'Sacrificio romántico y agresivo para abrir la columna f y lanzar un ataque directo.',
    positionId: 518,
    steps: [
      { from: 'e2', to: 'e4', text: 'Peón a e 4 abriendo líneas.' },
      { from: 'e7', to: 'e5', text: 'Respuesta simétrica de las negras.' },
      { from: 'f2', to: 'f4', text: 'Peón a efe 4: el Gambito de Rey sacrifica un peón para abrir la columna efe.' },
      { from: 'e5', to: 'f4', text: 'Las negras aceptan el gambito capturando en efe 4.' },
      { from: 'g1', to: 'f3', text: 'Caballo a efe 3 impide el jaque molesto de Dama en hache 4.' },
      { from: 'g7', to: 'g5', text: 'Las negras intentan aferrarse al peón de ventaja.' },
      { from: 'f1', to: 'c4', text: 'Alfil a ce 4 apunta a efe 7 y prepara un ataque fulminante.' }
    ]
  }
];
