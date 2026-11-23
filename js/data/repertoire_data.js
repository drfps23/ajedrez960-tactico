export const REPERTOIRE = [
  // ===================== CON BLANCAS =====================
  {
    id: 'italian',
    color: 'w',
    name: 'Apertura Italiana',
    tag: 'Agresiva · Clásica',
    keywords: ['italian', 'giuoco', 'two knights', 'dos caballos', 'italiana', 'evans', 'c50', 'c53', 'c54', 'c55'],
    lines: [
      {
        id: 'it-main',
        title: 'Giuoco Piano (Línea Principal)',
        kind: 'main',
        desc: 'Construye un centro fuerte con c3 y d4 apuntando desde el inicio al punto f7.',
        steps: [
          { from: 'e2', to: 'e4', text: 'Peón a e4. Ocupas el centro y abres paso a tu Dama y Alfil.' },
          { from: 'e7', to: 'e5', text: 'Las negras contestan en el centro.' },
          { from: 'g1', to: 'f3', text: 'Caballo a f3 desarrolla con ataque directo sobre e5.' },
          { from: 'b8', to: 'c6', text: 'Las negras defienden e5 desarrollando su Caballo.' },
          { from: 'f1', to: 'c4', text: 'Alfil a c4 define la Italiana y apunta al punto más débil: f7.' },
          { from: 'f8', to: 'c5', text: 'Las negras responden de forma clásica con Alfil a c5.' },
          { from: 'c2', to: 'c3', text: 'Peón a c3 prepara el golpe central d4 y da refugio a tu Alfil.' },
          { from: 'g8', to: 'f6', text: 'Las negras contraatacan tu peón de e4.' },
          { from: 'd2', to: 'd4', text: '¡Ruptura central! Atacas el centro y al Alfil negro a la vez.' },
          { from: 'e5', to: 'd4', text: 'Las negras capturan en d4.' },
          { from: 'c3', to: 'd4', text: 'Recapturas formando un centro ideal de peones.' },
          { from: 'c5', to: 'b4', text: 'El Alfil negro da jaque en b4 para frenar tu iniciativa.' },
          { from: 'c1', to: 'd2', text: 'Alfil a d2 cubre el jaque desarrollando pieza y listo para enrocar.' }
        ]
      },
      {
        id: 'it-fegatello',
        title: '🔥 Demoledora: Ataque Fegatello',
        kind: 'killer',
        desc: 'Castiga la captura prematura Cxd5 en la Defensa de los Dos Caballos con sacrificio en f7.',
        steps: [
          { from: 'e2', to: 'e4', text: 'Peón a e4 iniciando la lucha abierta.' },
          { from: 'e7', to: 'e5', text: 'Respuesta simétrica en el centro.' },
          { from: 'g1', to: 'f3', text: 'Caballo a f3 presionando e5.' },
          { from: 'b8', to: 'c6', text: 'Caballo a c6 defiende el peón.' },
          { from: 'f1', to: 'c4', text: 'Alfil a c4 mirando a f7.' },
          { from: 'g8', to: 'f6', text: 'Las negras eligen la Defensa de los Dos Caballos.' },
          { from: 'f3', to: 'g5', text: '¡Ataque inmediato! Caballo y Alfil golpean juntos sobre f7.' },
          { from: 'd7', to: 'd5', text: 'Las negras cortan la diagonal del Alfil.' },
          { from: 'e4', to: 'd5', text: 'Capturas en d5 abriendo la columna e.' },
          { from: 'f6', to: 'd5', text: 'Error típico de club: recapturan con Caballo en vez de Ca5.' },
          { from: 'g5', to: 'f7', text: '¡Sacrificio Fegatello! Caballo por f7 ataca Dama y Torre a la vez.' },
          { from: 'e8', to: 'f7', text: 'El Rey se ve obligado a salir a campo abierto.' },
          { from: 'd1', to: 'f3', text: '¡Dama a f3 jaque! Doble ataque ganador sobre el Rey y el Caballo clavado en d5.' }
        ]
      }
    ]
  },
  {
    id: 'london',
    color: 'w',
    name: 'Sistema Londres',
    tag: 'Sólida · Fácil de aprender',
    keywords: ['london', 'londres', 'queen pawn', 'd00', 'd02'],
    lines: [
      {
        id: 'lon-main',
        title: 'Pirámide Sólida (Línea Principal)',
        kind: 'main',
        desc: 'Esquema universal contra casi cualquier respuesta negra a 1.d4.',
        steps: [
          { from: 'd2', to: 'd4', text: 'Peón a d4 controlando el centro desde la columna de dama.' },
          { from: 'd7', to: 'd5', text: 'Las negras igualan el espacio central.' },
          { from: 'c1', to: 'f4', text: 'Clave del Londres: sacas el Alfil fuera de la cadena antes de jugar e3.' },
          { from: 'g8', to: 'f6', text: 'Las negras desarrollan el Caballo.' },
          { from: 'e2', to: 'e3', text: 'Peón a e3 refuerza d4 y abre paso a tu Alfil de f1.' },
          { from: 'e7', to: 'e6', text: 'Las negras preparan su desarrollo.' },
          { from: 'g1', to: 'f3', text: 'Caballo a f3 controla la casilla estratégica e5.' },
          { from: 'c7', to: 'c5', text: 'Las negras atacan tu centro con c5.' },
          { from: 'c2', to: 'c3', text: 'Peón a c3 completa la pirámide indestructible c3-d4-e3.' },
          { from: 'b8', to: 'c6', text: 'Las negras añaden presión sobre d4.' },
          { from: 'b1', to: 'd2', text: 'Caballo a d2 mantiene flexibles todas tus piezas y apoya el salto a e5.' }
        ]
      },
      {
        id: 'lon-trap',
        title: '🔥 Demoledora: Trampa contra Db6',
        kind: 'killer',
        desc: 'Castiga a los rivales codiciosos que capturan tu peón de b2 con la Dama.',
        steps: [
          { from: 'd2', to: 'd4', text: 'Abrimos con d4.' },
          { from: 'd7', to: 'd5', text: 'Las negras contestan d5.' },
          { from: 'c1', to: 'f4', text: 'Planteamos el Sistema Londres con Af4.' },
          { from: 'c7', to: 'c5', text: 'Las negras contraatacan con c5.' },
          { from: 'e2', to: 'e3', text: 'Sostienes d4 con e3.' },
          { from: 'd8', to: 'b6', text: 'Las negras atacan tu peón indefenso de b2.' },
          { from: 'b1', to: 'c3', text: '¡Trampa tendida! No defiendes b2 y preparas un salto mortal a b5.' },
          { from: 'b6', to: 'b2', text: 'Las negras caen en la trampa comiendo el peón envenenado.' },
          { from: 'c3', to: 'b5', text: '¡Golpe ganador! Amenazas Cc7+ ganando la Torre de a8 y Tb1 atrapando la Dama.' }
        ]
      }
    ]
  },
  {
    id: 'queens_gambit',
    color: 'w',
    name: 'Gambito de Dama',
    tag: 'Estratégica · Profesional',
    keywords: ['queen\'s gambit', 'queens gambit', 'gambito de dama', 'slav', 'eslava', 'd06', 'd20', 'd30', 'd35'],
    lines: [
      {
        id: 'qg-main',
        title: 'Gambito Rehusado (Clavada en g5)',
        kind: 'main',
        desc: 'Domina el centro y presiona al principal defensor negro de d5.',
        steps: [
          { from: 'd2', to: 'd4', text: 'Peón a d4 tomando el centro.' },
          { from: 'd7', to: 'd5', text: 'Las negras responden d5.' },
          { from: 'c2', to: 'c4', text: 'Ofreces el peón c para desviar al peón central negro.' },
          { from: 'e7', to: 'e6', text: 'Las negras rehúsan el gambito defendiendo d5.' },
          { from: 'b1', to: 'c3', text: 'Caballo a c3 aumenta la presión sobre d5 y e4.' },
          { from: 'g8', to: 'f6', text: 'Las negras defienden d5 con su Caballo.' },
          { from: 'c1', to: 'g5', text: 'Alfil a g5 clava al Caballo defensor y complica el desarrollo negro.' },
          { from: 'f8', to: 'e7', text: 'Las negras desclavan el Caballo.' },
          { from: 'e2', to: 'e3', text: 'Peón a e3 consolida el centro y habilita el desarrollo del flanco de rey.' }
        ]
      },
      {
        id: 'qg-trap',
        title: '🔥 Demoledora: Castigo a b5 (Torre gratis)',
        kind: 'killer',
        desc: 'Cuando aceptan el gambito e intentan aferrarse al peón extra con b5, ganas la Torre de a8.',
        steps: [
          { from: 'd2', to: 'd4', text: 'Peón a d4.' },
          { from: 'd7', to: 'd5', text: 'Peón a d5.' },
          { from: 'c2', to: 'c4', text: 'Planteas el Gambito de Dama.' },
          { from: 'd5', to: 'c4', text: 'Las negras aceptan el peón.' },
          { from: 'e2', to: 'e3', text: 'Peón a e3 amenaza recuperar el peón de c4 con el Alfil.' },
          { from: 'b7', to: 'b5', text: 'Error clásico: intentan retener el peón a toda costa.' },
          { from: 'a2', to: 'a4', text: '¡Peón a a4! Minas de inmediato la cadena negra.' },
          { from: 'c7', to: 'c6', text: 'Las negras sostienen b5, debilitando toda la gran diagonal blanca.' },
          { from: 'a4', to: 'b5', text: 'Capturas en b5 abriendo líneas.' },
          { from: 'c6', to: 'b5', text: 'Las negras recapturan dejando la diagonal h1-a8 totalmente vacía.' },
          { from: 'd1', to: 'f3', text: '¡Dama a f3! Atacas directamente la Torre indefensa en a8 y ganas pieza limpia.' }
        ]
      }
    ]
  },

  // ===================== CON NEGRAS =====================
  {
    id: 'sicilian',
    color: 'b',
    name: 'Defensa Siciliana',
    tag: 'Contraataque vs. 1.e4',
    keywords: ['sicilian', 'siciliana', 'najdorf', 'dragon', 'bowdler', 'b20', 'b30', 'b50', 'b90'],
    lines: [
      {
        id: 'sic-najdorf',
        title: 'Siciliana Najdorf (Línea Principal)',
        kind: 'main',
        desc: 'Cambia tu peón lateral por el central blanco y busca contraataque ganador.',
        steps: [
          { from: 'e2', to: 'e4', text: 'Las blancas abren con e4.' },
          { from: 'c7', to: 'c5', text: 'Peón a c5 evita la simetría y lucha por el centro desde el inicio.' },
          { from: 'g1', to: 'f3', text: 'Las blancas preparan abrir el centro.' },
          { from: 'd7', to: 'd6', text: 'Peón a d6 controla e5 y da flexibilidad total a tus piezas.' },
          { from: 'd2', to: 'd4', text: 'Las blancas juegan la Siciliana Abierta.' },
          { from: 'c5', to: 'd4', text: 'Cambias tu peón lateral por un valioso peón central rival.' },
          { from: 'f3', to: 'd4', text: 'El Caballo blanco recaptura en el centro.' },
          { from: 'g8', to: 'f6', text: 'Caballo a f6 desarrolla ganando un tiempo sobre e4.' },
          { from: 'b1', to: 'c3', text: 'Las blancas defienden e4.' },
          { from: 'a7', to: 'a6', text: '¡Peón a a6! Frena saltos enemigos a b5 y prepara tu avalancha en el flanco de dama.' }
        ]
      },
      {
        id: 'sic-bowdler',
        title: '🔥 Demoledora: Castigo a Ac4 (Bowdler)',
        kind: 'killer',
        desc: 'La respuesta más común en partidas de club (2.Ac4) y cómo quitarle toda iniciativa.',
        steps: [
          { from: 'e2', to: 'e4', text: 'Las blancas juegan e4.' },
          { from: 'c7', to: 'c5', text: 'Respondes con la Siciliana.' },
          { from: 'f1', to: 'c4', text: 'El rival juega 2.Ac4 esperando un ataque rápido sobre f7.' },
          { from: 'e7', to: 'e6', text: 'Peón a e6 cierra por completo la diagonal de su Alfil y prepara d5.' },
          { from: 'b1', to: 'c3', text: 'Las blancas desarrollan el Caballo.' },
          { from: 'a7', to: 'a6', text: 'Peón a a6 prepara expulsar al Alfil con b5.' },
          { from: 'g1', to: 'f3', text: 'Las blancas continúan desarrollando.' },
          { from: 'b7', to: 'b5', text: '¡Peón a b5! Ganas espacio gratis en el flanco de dama empujando su Alfil.' },
          { from: 'c4', to: 'e2', text: 'El Alfil blanco tiene que retroceder perdiendo tiempos valiosos.' },
          { from: 'd7', to: 'd5', text: '¡Golpe central con d5! Las negras ya están mejor desarrolladas y dominan el tablero.' }
        ]
      }
    ]
  },
  {
    id: 'carokann',
    color: 'b',
    name: 'Defensa Caro-Kann',
    tag: 'Sólida vs. 1.e4',
    keywords: ['caro-kann', 'caro kann', 'carokann', 'b10', 'b12', 'b15', 'b18'],
    lines: [
      {
        id: 'ck-classic',
        title: 'Variante Clásica (Alfil libre)',
        kind: 'main',
        desc: 'Saca tu Alfil de casillas claras sin encerrarlo y mantén una estructura libre de debilidades.',
        steps: [
          { from: 'e2', to: 'e4', text: 'Las blancas juegan e4.' },
          { from: 'c7', to: 'c6', text: 'Peón a c6 prepara golpear el centro con d5 con respaldo sólido.' },
          { from: 'd2', to: 'd4', text: 'Las blancas ocupan el centro completo.' },
          { from: 'd7', to: 'd5', text: 'Peón a d5 reta de inmediato al peón de e4.' },
          { from: 'b1', to: 'c3', text: 'Las blancas defienden e4.' },
          { from: 'd5', to: 'e4', text: 'Capturas en e4 para liberar tus piezas menores.' },
          { from: 'c3', to: 'e4', text: 'El Caballo blanco recaptura.' },
          { from: 'c8', to: 'f5', text: '¡Clave de la Caro-Kann! Sacas el Alfil con tiempo antes de jugar e6.' },
          { from: 'e4', to: 'g3', text: 'Las blancas atacan tu Alfil.' },
          { from: 'f5', to: 'g6', text: 'El Alfil se refugia en g6 dominando la gran diagonal.' }
        ]
      },
      {
        id: 'ck-advance',
        title: '🔥 Demoledora: Ruptura c5 vs. Avance',
        kind: 'killer',
        desc: 'Cómo demoler el centro blanco cuando intentan aplastarte con 3.e5.',
        steps: [
          { from: 'e2', to: 'e4', text: 'Peón a e4.' },
          { from: 'c7', to: 'c6', text: 'Caro-Kann con c6.' },
          { from: 'd2', to: 'd4', text: 'Las blancas juegan d4.' },
          { from: 'd7', to: 'd5', text: 'Luchas por el centro con d5.' },
          { from: 'e4', to: 'e5', text: 'Las blancas avanzan buscando ventaja de espacio.' },
          { from: 'c8', to: 'f5', text: 'Sacas el Alfil a f5 antes de cerrar con e6.' },
          { from: 'g1', to: 'f3', text: 'Las blancas desarrollan.' },
          { from: 'e7', to: 'e6', text: 'Peón a e6 construye un muro sólido.' },
          { from: 'f1', to: 'e2', text: 'Las blancas preparan el enroque.' },
          { from: 'c6', to: 'c5', text: '¡Ruptura c5! Atacas la base d4 de la cadena blanca y tomas la iniciativa.' }
        ]
      }
    ]
  },
  {
    id: 'kid',
    color: 'b',
    name: 'India de Rey / Anti-Londres',
    tag: 'Dinámica vs. 1.d4',
    keywords: ['king\'s indian', 'kings indian', 'india de rey', 'indian', 'e60', 'e70', 'e90', 'd02'],
    lines: [
      {
        id: 'kid-main',
        title: 'Fianchetto y Contraataque e5',
        kind: 'main',
        desc: 'Enroque ultrarrápido, Alfil dragón en g7 y ruptura explosiva en el centro.',
        steps: [
          { from: 'd2', to: 'd4', text: 'Las blancas abren con d4.' },
          { from: 'g8', to: 'f6', text: 'Caballo a f6 controla e4 sin comprometer peones.' },
          { from: 'c2', to: 'c4', text: 'Las blancas ganan espacio con c4.' },
          { from: 'g7', to: 'g6', text: 'Peón a g6 prepara el poderoso Alfil en fianchetto.' },
          { from: 'b1', to: 'c3', text: 'Caballo a c3.' },
          { from: 'f8', to: 'g7', text: 'El Alfil en g7 corta toda la gran diagonal.' },
          { from: 'e2', to: 'e4', text: 'Las blancas construyen un centro grande.' },
          { from: 'd7', to: 'd6', text: 'Peón a d6 frena e5 y prepara tu propio golpe central.' },
          { from: 'g1', to: 'f3', text: 'Caballo a f3.' },
          { from: 'e8', to: 'g8', castle: 'K', text: 'Enroque corto inmediato: Rey seguro antes de atacar.' },
          { from: 'f1', to: 'e2', text: 'Alfil a e2.' },
          { from: 'e7', to: 'e5', text: '¡Contraataque e5! Desafías el centro blanco con todas tus piezas listas.' }
        ]
      },
      {
        id: 'kid-antilondon',
        title: '🔥 Demoledora: Golpe Anti-Londres',
        kind: 'killer',
        desc: 'Cómo castigar al Sistema Londres sin caer en la trampa de Cb5.',
        steps: [
          { from: 'd2', to: 'd4', text: 'Las blancas abren con d4.' },
          { from: 'g8', to: 'f6', text: 'Respondes flexible con Cf6.' },
          { from: 'c1', to: 'f4', text: 'El rival plantea el Sistema Londres.' },
          { from: 'c7', to: 'c5', text: 'Golpeas inmediatamente su centro con c5.' },
          { from: 'e2', to: 'e3', text: 'Sostienen d4 con e3.' },
          { from: 'd8', to: 'b6', text: 'Dama a b6 presiona b2 aprovechando que su Alfil abandonó c1.' },
          { from: 'b1', to: 'c3', text: 'Las blancas tienden la trampa invitándote a comer en b2.' },
          { from: 'c5', to: 'd4', text: '¡Jugada exacta! Capturas primero en d4 sin caer en Cb5.' },
          { from: 'e3', to: 'd4', text: 'Las blancas recapturan en d4.' },
          { from: 'd7', to: 'd6', text: 'Peón a d6 controla e5 y mantienes fuerte presión en todo el flanco de dama.' }
        ]
      }
    ]
  }
];
