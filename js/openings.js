import { FILES } from './engine.js';

const OPENING_BOOK = [
  { eco: 'C51', name: 'Gambito Evans', moves: 'e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 b2b4' },
  { eco: 'C50', name: 'Apertura Italiana · Giuoco Piano', moves: 'e2e4 e7e5 g1f3 b8c6 f1c4 f8c5' },
  { eco: 'C55', name: 'Defensa de los Dos Caballos', moves: 'e2e4 e7e5 g1f3 b8c6 f1c4 g8f6' },
  { eco: 'C50', name: 'Apertura Italiana', moves: 'e2e4 e7e5 g1f3 b8c6 f1c4' },
  { eco: 'C70', name: 'Apertura Española · Defensa Morphy', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5 a7a6' },
  { eco: 'C65', name: 'Apertura Española · Defensa Berlinesa', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5 g8f6' },
  { eco: 'C60', name: 'Apertura Española (Ruy López)', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5' },
  { eco: 'C44', name: 'Apertura Escocesa', moves: 'e2e4 e7e5 g1f3 b8c6 d2d4' },
  { eco: 'C47', name: 'Apertura de los Cuatro Caballos', moves: 'e2e4 e7e5 g1f3 b8c6 b1c3 g8f6' },
  { eco: 'C42', name: 'Defensa Petrov', moves: 'e2e4 e7e5 g1f3 g8f6' },
  { eco: 'C41', name: 'Defensa Philidor', moves: 'e2e4 e7e5 g1f3 d7d6' },
  { eco: 'C33', name: 'Gambito de Rey Aceptado', moves: 'e2e4 e7e5 f2f4 e5f4' },
  { eco: 'C30', name: 'Gambito de Rey', moves: 'e2e4 e7e5 f2f4' },
  { eco: 'C25', name: 'Apertura Vienesa', moves: 'e2e4 e7e5 b1c3' },
  { eco: 'C20', name: 'Ataque del Pastor', moves: 'e2e4 e7e5 d1h5' },
  { eco: 'B90', name: 'Defensa Siciliana · Najdorf', moves: 'e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6' },
  { eco: 'B70', name: 'Defensa Siciliana · Dragón', moves: 'e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 g7g6' },
  { eco: 'B32', name: 'Defensa Siciliana Abierta', moves: 'e2e4 c7c5 g1f3 b8c6 d2d4' },
  { eco: 'B20', name: 'Defensa Siciliana', moves: 'e2e4 c7c5' },
  { eco: 'C02', name: 'Defensa Francesa · Variante del Avance', moves: 'e2e4 e7e6 d2d4 d7d5 e4e5' },
  { eco: 'C00', name: 'Defensa Francesa', moves: 'e2e4 e7e6' },
  { eco: 'B12', name: 'Defensa Caro-Kann', moves: 'e2e4 c7c6 d2d4 d7d5' },
  { eco: 'B10', name: 'Defensa Caro-Kann', moves: 'e2e4 c7c6' },
  { eco: 'B07', name: 'Defensa Pirc', moves: 'e2e4 d7d6 d2d4 g8f6' },
  { eco: 'B01', name: 'Defensa Escandinava', moves: 'e2e4 d7d5' },
  { eco: 'B02', name: 'Defensa Alekhine', moves: 'e2e4 g8f6' },
  { eco: 'D30', name: 'Gambito de Dama Rehusado', moves: 'd2d4 d7d5 c2c4 e7e6' },
  { eco: 'D20', name: 'Gambito de Dama Aceptado', moves: 'd2d4 d7d5 c2c4 d5c4' },
  { eco: 'D10', name: 'Defensa Eslava', moves: 'd2d4 d7d5 c2c4 c7c6' },
  { eco: 'D06', name: 'Gambito de Dama', moves: 'd2d4 d7d5 c2c4' },
  { eco: 'D02', name: 'Sistema Londres', moves: 'd2d4 d7d5 c1f4' },
  { eco: 'A45', name: 'Sistema Londres', moves: 'd2d4 g8f6 c1f4' },
  { eco: 'E60', name: 'Defensa India de Rey', moves: 'd2d4 g8f6 c2c4 g7g6 b1c3 f8g7' },
  { eco: 'E20', name: 'Defensa Nimzoindia', moves: 'd2d4 g8f6 c2c4 e7e6 b1c3 f8b4' },
  { eco: 'A10', name: 'Apertura Inglesa', moves: 'c2c4' },
  { eco: 'A04', name: 'Apertura Réti', moves: 'g1f3' },
  { eco: 'A02', name: 'Apertura Bird', moves: 'f2f4' }
];

function ensureOpeningStyles() {
  if (document.querySelector('style[data-openings-css]')) return;
  const style = document.createElement('style');
  style.dataset.openingsCss = 'true';
  style.textContent = `
    .opening-pill {
      margin-top: 8px;
      font-size: 0.76rem;
      font-weight: 700;
      padding: 5px 10px;
      border-radius: 8px;
      background: rgba(56, 189, 248, 0.11);
      border: 1px solid rgba(56, 189, 248, 0.28);
      color: var(--accent-cyan);
    }
    .opening-pill.hidden { display: none; }
  `;
  document.head.appendChild(style);
}

function moveToUci(m) {
  const fc = FILES[m.from.c];
  const fr = 8 - m.from.r;
  const tc = FILES[m.castle ? m.kingToCol : m.to.c];
  const tr = 8 - m.to.r;
  return `${fc}${fr}${tc}${tr}`;
}

export function detectOpening(history) {
  if (!history || history.length === 0) return null;
  const seq = history.slice(0, 14).map(moveToUci).join(' ');
  let best = null;
  for (const item of OPENING_BOOK) {
    if (seq === item.moves || seq.startsWith(item.moves + ' ')) {
      if (!best || item.moves.length > best.moves.length) {
        best = item;
      }
    }
  }
  return best;
}

export function attachOpeningBook(app) {
  ensureOpeningStyles();
  const statusCard = document.querySelector('.status-card');
  if (!statusCard) return;

  const pill = document.createElement('div');
  pill.id = 'opening-pill';
  pill.className = 'opening-pill hidden';
  const postSlot = document.getElementById('postgame-slot');
  if (postSlot && postSlot.parentNode === statusCard) {
    statusCard.insertBefore(pill, postSlot);
  } else {
    statusCard.appendChild(pill);
  }

  const origRenderStatus = app._renderStatusAndHistory.bind(app);
  app._renderStatusAndHistory = () => {
    origRenderStatus();

    const moves = app.reviewFrame
      ? app.engine.history.slice(0, app.reviewFrame.ply)
      : app.engine.history;

    if (!moves || moves.length === 0) {
      pill.classList.add('hidden');
      return;
    }

    if (app.engine.positionId !== 518) {
      pill.textContent = `🎲 Apertura Libre · Posición Fischer #${app.engine.positionId}`;
      pill.classList.remove('hidden');
      return;
    }

    const hit = detectOpening(moves);
    if (hit) {
      pill.textContent = `📖 ${hit.eco} · ${hit.name}`;
      pill.classList.remove('hidden');
    } else {
      pill.classList.add('hidden');
    }
  };

  app._renderStatusAndHistory();
}
