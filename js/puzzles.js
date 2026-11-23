import { Chess960Engine, FILES } from './engine.js';
import { CombatFX } from './fx.js';
import { THEMES } from './themes.js';

const PUZZLES_KEY = 'ajedrez960_puzzles_solved_v1';

function parseSq(sq) {
  return { r: 8 - parseInt(sq[1], 10), c: sq.charCodeAt(0) - 97 };
}

function toUci(from, to) {
  return FILES[from.c] + (8 - from.r) + FILES[to.c] + (8 - to.r);
}

export const PUZZLE_BANK = [
  // === AJEDREZ CLÁSICO ===
  {
    id: 'c1',
    variant: 'classic',
    title: 'Mate del Pasillo',
    level: 'Fácil',
    goal: 'Blancas juegan y dan mate en 1.',
    hint: 'La octava fila está indefensa y los peones encierran al Rey enemigo.',
    turn: 'w',
    pieces: [
      ['w', 'K', 'g1'], ['w', 'R', 'd1'], ['w', 'P', 'f2'], ['w', 'P', 'g2'], ['w', 'P', 'h2'],
      ['b', 'K', 'g8'], ['b', 'R', 'c2'], ['b', 'P', 'f7'], ['b', 'P', 'g7'], ['b', 'P', 'h7']
    ],
    solution: ['d1d8']
  },
  {
    id: 'c2',
    variant: 'classic',
    title: 'Mate del Pastor',
    level: 'Fácil',
    goal: 'Blancas juegan y dan mate en 1.',
    hint: 'El punto f7 solo está defendido por el Rey y tu Alfil ya apunta allí.',
    turn: 'w',
    pieces: [
      ['w', 'K', 'g1'], ['w', 'Q', 'f3'], ['w', 'B', 'c4'], ['w', 'P', 'f2'], ['w', 'P', 'g2'], ['w', 'P', 'h2'],
      ['b', 'K', 'e8'], ['b', 'Q', 'd8'], ['b', 'R', 'a8'], ['b', 'R', 'h8'], ['b', 'B', 'c8'], ['b', 'B', 'f8'],
      ['b', 'N', 'b8'], ['b', 'N', 'g8'], ['b', 'P', 'a7'], ['b', 'P', 'b7'], ['b', 'P', 'c7'],
      ['b', 'P', 'd7'], ['b', 'P', 'e5'], ['b', 'P', 'f7'], ['b', 'P', 'g7'], ['b', 'P', 'h7']
    ],
    solution: ['f3f7']
  },
  {
    id: 'c3',
    variant: 'classic',
    title: 'Ataque Doble Real',
    level: 'Intermedio',
    goal: 'Blancas juegan y ganan la Dama en 2 jugadas.',
    hint: 'Busca un salto de Caballo que dé jaque al Rey y ataque la Dama al mismo tiempo.',
    turn: 'w',
    pieces: [
      ['w', 'K', 'g1'], ['w', 'N', 'd5'], ['w', 'R', 'a1'], ['w', 'P', 'f2'], ['w', 'P', 'g2'], ['w', 'P', 'h2'],
      ['b', 'K', 'g8'], ['b', 'Q', 'c6'], ['b', 'R', 'a8'], ['b', 'P', 'a7'], ['b', 'P', 'b7'],
      ['b', 'P', 'f7'], ['b', 'P', 'g7'], ['b', 'P', 'h7']
    ],
    solution: ['d5e7', 'g8h8', 'e7c6']
  },
  {
    id: 'c4',
    variant: 'classic',
    title: 'Sacrificio de Dama',
    level: 'Avanzado',
    goal: 'Blancas juegan y dan mate en 2.',
    hint: 'Sacrifica la Dama en la octava fila para desviar la defensa y rematar con la Torre.',
    turn: 'w',
    pieces: [
      ['w', 'K', 'g1'], ['w', 'Q', 'd3'], ['w', 'R', 'd1'], ['w', 'P', 'f2'], ['w', 'P', 'g2'], ['w', 'P', 'h2'],
      ['b', 'K', 'g8'], ['b', 'R', 'd8'], ['b', 'Q', 'b6'], ['b', 'P', 'f7'], ['b', 'P', 'g7'], ['b', 'P', 'h7']
    ],
    solution: ['d3d8', 'b6d8', 'd1d8']
  },

  // === FISCHER 960 ===
  {
    id: 'f1',
    variant: 'fischer960',
    title: 'Alfil Francotirador 960',
    level: 'Fácil',
    goal: 'Blancas juegan y dan mate en 1.',
    hint: 'En Fischer 960 el Alfil desde a1 domina toda la gran diagonal hasta g7.',
    turn: 'w',
    pieces: [
      ['w', 'K', 'f1'], ['w', 'B', 'a1'], ['w', 'Q', 'g4'], ['w', 'R', 'c1'], ['w', 'P', 'a2'], ['w', 'P', 'b3'], ['w', 'P', 'f2'], ['w', 'P', 'g2'], ['w', 'P', 'h2'],
      ['b', 'K', 'h8'], ['b', 'R', 'e8'], ['b', 'R', 'c8'], ['b', 'B', 'b8'], ['b', 'P', 'f7'], ['b', 'P', 'g7'], ['b', 'P', 'h7']
    ],
    solution: ['g4g7']
  },
  {
    id: 'f2',
    variant: 'fischer960',
    title: 'Batería de Torres en Columna E',
    level: 'Intermedio',
    goal: 'Blancas juegan y dan mate en 2.',
    hint: 'Rompe directamente en e8 con tu primera Torre; la segunda completará el mate.',
    turn: 'w',
    pieces: [
      ['w', 'K', 'c1'], ['w', 'R', 'e2'], ['w', 'R', 'e1'], ['w', 'P', 'b2'], ['w', 'P', 'c2'], ['w', 'P', 'g2'], ['w', 'P', 'h2'],
      ['b', 'K', 'g8'], ['b', 'R', 'e8'], ['b', 'R', 'b8'], ['b', 'P', 'a7'], ['b', 'P', 'b7'], ['b', 'P', 'f7'], ['b', 'P', 'g7'], ['b', 'P', 'h7']
    ],
    solution: ['e2e8', 'b8e8', 'e1e8']
  },
  {
    id: 'f3',
    variant: 'fischer960',
    title: 'Enroque 960 Fulminante',
    level: 'Avanzado',
    goal: 'Blancas juegan y dan mate en 1 usando el enroque 960.',
    hint: 'Selecciona tu Rey en d1 y haz clic en la Torre en h1 (iluminada en dorado) para enrocar.',
    turn: 'w',
    startCols: { king: 3, rookQ: 0, rookK: 7 },
    castling: { w: { K: true, Q: false }, b: { K: false, Q: false } },
    pieces: [
      ['w', 'K', 'd1'], ['w', 'R', 'h1'], ['w', 'P', 'a2'], ['w', 'P', 'b2'], ['w', 'P', 'c2'],
      ['b', 'K', 'f8'], ['b', 'R', 'e8'], ['b', 'R', 'g8'], ['b', 'P', 'e7'], ['b', 'P', 'g7'], ['b', 'P', 'h7']
    ],
    solution: ['d1h1']
  },
  {
    id: 'f4',
    variant: 'fischer960',
    title: 'Mate de la Coz (Salto Sísmico)',
    level: 'Fácil',
    goal: 'Blancas juegan y dan mate en 1.',
    hint: 'El Rey negro está encerrado por sus propias piezas; el Caballo puede saltar sobre ellas.',
    turn: 'w',
    pieces: [
      ['w', 'K', 'b1'], ['w', 'N', 'g5'], ['w', 'R', 'a1'], ['w', 'P', 'a2'], ['w', 'P', 'b2'], ['w', 'P', 'c2'],
      ['b', 'K', 'h8'], ['b', 'R', 'g8'], ['b', 'P', 'f7'], ['b', 'P', 'g7'], ['b', 'P', 'h7']
    ],
    solution: ['g5f7']
  }
];

function ensurePuzzleStyles() {
  if (document.querySelector('style[data-puzzles-css]')) return;
  const style = document.createElement('style');
  style.dataset.puzzlesCss = 'true';
  style.textContent = `
    .pz-layout {
      display: grid;
      grid-template-columns: minmax(280px, 520px) minmax(260px, 1fr);
      gap: 20px;
      align-items: start;
    }
    .pz-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
    .pz-list { display: flex; flex-direction: column; gap: 8px; }
    .pz-item {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 11px;
      padding: 11px 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--text-main);
      text-align: left;
    }
    .pz-item:hover, .pz-item.active {
      border-color: var(--accent-cyan);
      background: rgba(56, 189, 248, 0.12);
    }
    .pz-item.solved { border-left: 4px solid #22c55e; }
    .pz-feedback {
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 0.84rem;
      line-height: 1.45;
      background: rgba(9, 13, 22, 0.65);
      border: 1px solid var(--border-color);
    }
    .pz-feedback.ok { border-color: #22c55e; color: #86efac; }
    .pz-feedback.err { border-color: #f43f5e; color: #fda4af; }
    .pz-feedback.hint { border-color: #facc15; color: #fde047; }
    .pz-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    @media (max-width: 860px) {
      .pz-layout { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

export class PuzzlesView {
  constructor({ container, sound, store, getThemeId, onBack }) {
    ensurePuzzleStyles();
    this.container = container;
    this.sound = sound;
    this.store = store;
    this.getThemeId = getThemeId;
    this.onBack = onBack;

    this.filterVariant = 'classic';
    this.solvedIds = this._loadSolved();
    this.currentPuzzle = PUZZLE_BANK[0];
    this.stepIdx = 0;
    this.selected = null;
    this.legalForSelected = [];
    this.hiddenSquares = new Set();
    this.defeatedKingSq = null;
    this.isAnimating = false;
    this.solvedNow = false;
    this.feedback = { cls: '', text: '' };
    this.fx = null;

    this.engine = new Chess960Engine(518);
    this._mountLayout();
    this.loadPuzzle(PUZZLE_BANK[0]);
  }

  _loadSolved() {
    try {
      const raw = localStorage.getItem(PUZZLES_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  _saveSolved() {
    try {
      localStorage.setItem(PUZZLES_KEY, JSON.stringify([...this.solvedIds]));
    } catch { /* ignorar */ }
  }

  destroy() {
    this.fx?.cancelActive();
  }

  _getTheme() {
    const id = this.getThemeId?.() || 'neon';
    return THEMES[id] || THEMES.neon;
  }

  _mountLayout() {
    this.container.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>🧩 Problemas Tácticos (Clásico y Fischer 960)</h2>
          <p class="sec-sub">Encuentra la jugada ganadora con tus animaciones de combate y explosión de Jaque Mate.</p>
        </div>
        <button id="pz-back" class="btn btn-secondary">← Volver al Inicio</button>
      </div>

      <div class="pz-tabs">
        <button class="btn btn-primary" data-pz-tab="classic">♟ Problemas Clásicos</button>
        <button class="btn btn-secondary" data-pz-tab="fischer960">🎲 Problemas Fischer 960</button>
      </div>

      <div class="pz-layout">
        <div class="board-column">
          <div class="board-wrapper" id="pz-board-wrapper">
            <div class="board-grid" id="pz-board-grid"></div>
            <canvas class="fx-canvas" id="pz-fx-canvas"></canvas>
          </div>
        </div>

        <div class="side-panel">
          <div class="card" style="display:flex;flex-direction:column;gap:10px">
            <div class="status-row">
              <span class="pos-badge" id="pz-badge"></span>
              <span class="turn-pill" id="pz-level"></span>
            </div>
            <h3 id="pz-title" style="font-size:1.05rem"></h3>
            <p class="status-text" id="pz-goal"></p>
            <div class="pz-feedback" id="pz-feedback">Toca una pieza blanca para iniciar el reto.</div>
            <div class="pz-actions">
              <button id="pz-hint" class="btn btn-secondary">💡 Pista</button>
              <button id="pz-retry" class="btn btn-secondary">↺ Reintentar</button>
              <button id="pz-next" class="btn btn-primary">Siguiente →</button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2>Lista de Retos</h2>
              <span class="mini-hint" id="pz-counter"></span>
            </div>
            <div class="pz-list" id="pz-list"></div>
          </div>
        </div>
      </div>
    `;

    this.dom = {
      wrapper: this.container.querySelector('#pz-board-wrapper'),
      grid: this.container.querySelector('#pz-board-grid'),
      canvas: this.container.querySelector('#pz-fx-canvas'),
      badge: this.container.querySelector('#pz-badge'),
      level: this.container.querySelector('#pz-level'),
      title: this.container.querySelector('#pz-title'),
      goal: this.container.querySelector('#pz-goal'),
      feedback: this.container.querySelector('#pz-feedback'),
      list: this.container.querySelector('#pz-list'),
      counter: this.container.querySelector('#pz-counter')
    };

    this.fx = new CombatFX(this.dom.canvas, this.dom.wrapper);
    this.fx.setPalette(this._getTheme().fxPalette);

    this.container.querySelector('#pz-back').addEventListener('click', () => {
      this.destroy();
      this.onBack?.();
    });

    this.container.querySelectorAll('[data-pz-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterVariant = btn.dataset.pzTab;
        this.container.querySelectorAll('[data-pz-tab]').forEach(b => {
          b.className = b.dataset.pzTab === this.filterVariant ? 'btn btn-primary' : 'btn btn-secondary';
        });
        const first = PUZZLE_BANK.find(p => p.variant === this.filterVariant);
        if (first) this.loadPuzzle(first);
      });
    });

    this.container.querySelector('#pz-hint').addEventListener('click', () => {
      this.feedback = { cls: 'hint', text: `💡 Pista: ${this.currentPuzzle.hint}` };
      this._renderInfo();
    });

    this.container.querySelector('#pz-retry').addEventListener('click', () => {
      this.loadPuzzle(this.currentPuzzle);
    });

    this.container.querySelector('#pz-next').addEventListener('click', () => {
      const subset = PUZZLE_BANK.filter(p => p.variant === this.filterVariant);
      const idx = subset.findIndex(p => p.id === this.currentPuzzle.id);
      const next = subset[(idx + 1) % subset.length];
      if (next) this.loadPuzzle(next);
    });
  }

  loadPuzzle(puzzle) {
    this.fx?.cancelActive();
    this.currentPuzzle = puzzle;
    this.stepIdx = 0;
    this.selected = null;
    this.legalForSelected = [];
    this.hiddenSquares.clear();
    this.defeatedKingSq = null;
    this.isAnimating = false;
    this.solvedNow = false;
    this.feedback = { cls: '', text: 'Encuentra la mejor jugada para las Blancas.' };

    // Cargar posición personalizada sobre el motor puro
    this.engine.reset(518);
    this.engine.board = Array.from({ length: 8 }, () => new Array(8).fill(null));
    for (const [color, type, sq] of puzzle.pieces) {
      const { r, c } = parseSq(sq);
      this.engine.board[r][c] = { color, type };
    }
    this.engine.turn = puzzle.turn || 'w';
    this.engine.startCols = puzzle.startCols || { king: 4, rookQ: 0, rookK: 7 };
    this.engine.castling = puzzle.castling
      ? { w: { ...puzzle.castling.w }, b: { ...puzzle.castling.b } }
      : { w: { K: false, Q: false }, b: { K: false, Q: false } };
    this.engine.epTarget = null;
    this.engine.history = [];
    this.engine.status = 'playing';
    this.engine.winner = null;

    this.fx?.setPalette(this._getTheme().fxPalette);
    this._renderAll();
  }

  _handleClick(r, c) {
    if (this.isAnimating || this.solvedNow) return;

    if (this.selected) {
      const candidates = this._matchMovesForClick(r, c);
      if (candidates.length > 0) {
        const chosen = candidates.find(m => !m.promo || m.promo === 'Q') || candidates[0];
        this._checkUserMove(chosen);
        return;
      }
    }

    const piece = this.engine.board[r][c];
    if (piece && piece.color === this.engine.turn) {
      if (this.selected && this.selected.r === r && this.selected.c === c) {
        this.selected = null;
        this.legalForSelected = [];
      } else {
        this.selected = { r, c };
        this.legalForSelected = this.engine.getLegalMovesFrom(r, c);
      }
      this._renderBoard();
    } else {
      this.selected = null;
      this.legalForSelected = [];
      this._renderBoard();
    }
  }

  _matchMovesForClick(r, c) {
    const direct = this.legalForSelected.filter(m => m.to.r === r && m.to.c === c);
    if (direct.length > 0) return direct;
    return this.legalForSelected.filter(m => m.castle && m.from.r === r && m.kingToCol === c);
  }

  _checkUserMove(move) {
    const expected = this.currentPuzzle.solution[this.stepIdx];
    const playedUci = toUci(move.from, move.to);

    if (playedUci !== expected) {
      this.selected = null;
      this.legalForSelected = [];
      this.feedback = { cls: 'err', text: '❌ Esa no es la jugada más precisa. Intenta de nuevo o usa una pista.' };
      this.sound?.playCheck();
      this._renderAll();
      return;
    }

    this._animateAndApply(move, () => {
      this.stepIdx++;
      if (this.stepIdx >= this.currentPuzzle.solution.length) {
        this.solvedNow = true;
        this.solvedIds.add(this.currentPuzzle.id);
        this._saveSolved();
        this.feedback = { cls: 'ok', text: '✅ ¡Problema resuelto con éxito! Excelente visión táctica.' };
        this._renderAll();
        return;
      }

      // Ejecutar respuesta automática del rival
      this.feedback = { cls: 'ok', text: '✓ ¡Bien visto! El rival responde... encuentra el remate.' };
      this._renderInfo();
      setTimeout(() => this._playOpponentReply(), 320);
    });
  }

  _playOpponentReply() {
    const replyUci = this.currentPuzzle.solution[this.stepIdx];
    if (!replyUci) return;
    const legal = this.engine.getLegalMoves(this.engine.turn);
    const match = legal.find(m => toUci(m.from, m.to) === replyUci);
    if (!match) return;

    this._animateAndApply(match, () => {
      this.stepIdx++;
      this._renderAll();
    });
  }

  _animateAndApply(move, onDone) {
    const theme = this._getTheme();
    const moverColor = this.engine.turn;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const record = this.engine.makeMove(move);

    this.selected = null;
    this.legalForSelected = [];
    this.isAnimating = true;
    this.hiddenSquares.clear();

    const finish = () => {
      this.hiddenSquares.clear();
      if (this.engine.status === 'checkmate') {
        const kSq = this.engine.findKing(enemyColor);
        if (kSq) {
          this.hiddenSquares.add(`${kSq.r},${kSq.c}`);
          this._renderBoard();
          this.sound?.playCheckmateDefeat();
          this.fx.playCheckmateSequence({
            kingHtml: theme.renderPiece('K', enemyColor),
            kingSq: kSq,
            flipped: false,
            winnerColor: moverColor,
            onComplete: () => {
              this.hiddenSquares.clear();
              this.defeatedKingSq = kSq;
              this.isAnimating = false;
              this._renderBoard();
              onDone?.();
            }
          });
          return;
        }
      }

      this.isAnimating = false;
      this._renderBoard();
      if (record.inCheck) this.sound?.playCheck();
      onDone?.();
    };

    if (record.castle) {
      const row = record.from.r;
      this.hiddenSquares.add(`${row},${record.kingToCol}`);
      this.hiddenSquares.add(`${row},${record.rookToCol}`);
      this._renderBoard();
      this.sound?.playCastle();
      this.fx.animateCastle({
        kingHtml: theme.renderPiece('K', moverColor),
        rookHtml: theme.renderPiece('R', moverColor),
        row,
        kingFrom: record.from.c,
        kingTo: record.kingToCol,
        rookFrom: record.rookFromCol,
        rookTo: record.rookToCol,
        flipped: false,
        onComplete: finish
      });
      return;
    }

    if (record.captured) {
      this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
      this._renderBoard();
      this.fx.playCombatSequence({
        pieceType: record.piece,
        attackerHtml: theme.renderPiece(record.promo || record.piece, moverColor),
        victimHtml: theme.renderPiece(record.captured, enemyColor),
        from: record.from,
        to: record.to,
        flipped: false,
        onCharge: () => this.sound?.playCharge(record.piece),
        onImpact: () => this.sound?.playAttack(record.piece),
        onComplete: finish
      });
      return;
    }

    this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
    this._renderBoard();
    this.sound?.playMove(record.piece);
    this.fx.animateRegularMove({
      pieceHtml: theme.renderPiece(record.promo || record.piece, moverColor),
      pieceType: record.piece,
      from: record.from,
      to: record.to,
      flipped: false,
      onComplete: finish
    });
  }

  _renderAll() {
    this._renderBoard();
    this._renderInfo();
    this._renderList();
  }

  _renderInfo() {
    const p = this.currentPuzzle;
    this.dom.badge.textContent = p.variant === 'classic' ? '♟ CLÁSICO' : '🎲 FISCHER 960';
    this.dom.level.textContent = p.level;
    this.dom.title.textContent = p.title;
    this.dom.goal.textContent = p.goal;
    this.dom.feedback.className = `pz-feedback ${this.feedback.cls}`;
    this.dom.feedback.textContent = this.feedback.text;
  }

  _renderList() {
    const subset = PUZZLE_BANK.filter(p => p.variant === this.filterVariant);
    const solvedInTab = subset.filter(p => this.solvedIds.has(p.id)).length;
    this.dom.counter.textContent = `${solvedInTab}/${subset.length} resueltos`;

    this.dom.list.innerHTML = subset.map(p => {
      const done = this.solvedIds.has(p.id);
      const active = p.id === this.currentPuzzle.id;
      return `
        <button class="pz-item ${active ? 'active' : ''} ${done ? 'solved' : ''}" data-pz-id="${p.id}">
          <div>
            <div style="font-weight:700;font-size:0.86rem">${p.title}</div>
            <div class="mini-hint">${p.level}</div>
          </div>
          <span>${done ? '✅' : '▶'}</span>
        </button>
      `;
    }).join('');

    this.dom.list.querySelectorAll('[data-pz-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const found = PUZZLE_BANK.find(x => x.id === btn.dataset.pzId);
        if (found) this.loadPuzzle(found);
      });
    });
  }

  _renderBoard() {
    const theme = this._getTheme();
    const grid = this.dom.grid;
    grid.innerHTML = '';

    const lastMove = this.engine.history[this.engine.history.length - 1] || null;
    const checkKing = this.engine.isInCheck(this.engine.turn)
      ? this.engine.findKing(this.engine.turn)
      : null;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;

        if (lastMove) {
          const toCol = lastMove.castle ? lastMove.kingToCol : lastMove.to.c;
          if (lastMove.from.r === r && lastMove.from.c === c) sq.classList.add('last-from');
          if (lastMove.to.r === r && toCol === c) sq.classList.add('last-to');
        }
        if (this.selected && this.selected.r === r && this.selected.c === c) sq.classList.add('selected');
        if (checkKing && checkKing.r === r && checkKing.c === c) sq.classList.add('in-check');

        const matching = this.legalForSelected.filter(m => m.to.r === r && m.to.c === c);
        if (matching.some(m => m.castle)) {
          sq.classList.add('castle-target');
        } else if (matching.length > 0) {
          const marker = document.createElement('div');
          marker.className = matching.some(m => m.captured || m.ep) ? 'capture-ring' : 'move-dot';
          sq.appendChild(marker);
        }

        if (c === 0) {
          const rk = document.createElement('span');
          rk.className = 'coord-rank';
          rk.textContent = 8 - r;
          sq.appendChild(rk);
        }
        if (r === 7) {
          const fl = document.createElement('span');
          fl.className = 'coord-file';
          fl.textContent = FILES[c];
          sq.appendChild(fl);
        }

        const piece = this.engine.board[r][c];
        if (piece && !this.hiddenSquares.has(`${r},${c}`)) {
          const wrap = document.createElement('div');
          wrap.className = 'piece-wrap';
          if (piece.type === 'K' && this.defeatedKingSq && this.defeatedKingSq.r === r && this.defeatedKingSq.c === c) {
            wrap.classList.add('king-defeated');
          }
          wrap.innerHTML = theme.renderPiece(piece.type, piece.color);
          sq.appendChild(wrap);
        }

        sq.addEventListener('click', () => this._handleClick(r, c));
        grid.appendChild(sq);
      }
    }
  }
}
