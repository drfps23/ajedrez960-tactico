import { Chess960Engine, FILES } from './engine.js';
import { SoundFX } from './audio.js';
import { CombatFX } from './fx.js';
import { THEMES } from './themes.js';

const SOLVED_KEY = 'ajedrez960_puzzles_solved_v1';

export const PUZZLE_BANK = [
  // === AJEDREZ CLÁSICO ===
  {
    id: 'cl-1',
    variant: 'classic',
    tier: 'free',
    difficulty: 'Fácil',
    title: 'Mate del Pasillo',
    theme: 'Mate en 1',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    solution: ['d1d8'],
    hint: 'El Rey negro está atrapado detrás de sus propios peones en la octava fila.',
    explain: 'Td8# es jaque mate inmediato: los peones de f7, g7 y h7 le quitan toda escapatoria al Rey.'
  },
  {
    id: 'cl-2',
    variant: 'classic',
    tier: 'free',
    difficulty: 'Fácil',
    title: 'El Beso de la Muerte',
    theme: 'Mate en 1',
    fen: '6k1/5p1p/5PpQ/8/8/8/5PPP/6K1 w - - 0 1',
    solution: ['h6g7'],
    hint: 'Tu peón avanzado en f6 controla la casilla clave junto al Rey enemigo.',
    explain: 'Dg7# da mate apoyada por el peón en f6. La Dama sella todas las casillas de escape.'
  },
  {
    id: 'cl-3',
    variant: 'classic',
    tier: 'free',
    difficulty: 'Fácil',
    title: 'Horquilla Real del Caballo',
    theme: 'Ataque Doble',
    fen: 'q3k3/pp3ppp/8/3N4/8/8/PPP2PPP/6K1 w - - 0 1',
    solution: ['d5c7', 'e8d7', 'c7a8'],
    hint: 'Busca una casilla desde donde tu Caballo dé jaque al Rey y ataque a la Dama al mismo tiempo.',
    explain: 'Cc7+ aplica un ataque doble demoledor sobre Rey y Dama; al moverse el Rey, Cxa8 gana la Dama limpia.'
  },
  {
    id: 'cl-4',
    variant: 'classic',
    tier: 'pro',
    difficulty: 'Intermedio',
    title: 'Mate de la Coz',
    theme: 'Sacrificio · Mate en 2',
    fen: '5r1k/6pp/7N/8/8/1Q6/5PPP/6K1 w - - 0 1',
    solution: ['b3g8', 'f8g8', 'h6f7'],
    hint: 'Sacrifica tu Dama en la esquina para encerrar al Rey con su propia Torre.',
    explain: '¡Sacrificio clásico! Dg8+ fuerza Txg8 (el Rey no puede capturar porque el Caballo defiende), y Cf7# da mate asfixiado.'
  },
  {
    id: 'cl-5',
    variant: 'classic',
    tier: 'pro',
    difficulty: 'Intermedio',
    title: 'Mate de la Ópera (Morphy)',
    theme: 'Sacrificio · Mate en 2',
    fen: '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w - - 0 1',
    solution: ['b3b8', 'd7b8', 'd1d8'],
    hint: 'Desvía al Caballo de d7 sacrificando la Dama en b8 para abrir la columna d.',
    explain: 'Db8+!! obliga a Cxb8, despejando la columna d para que Td8# dé mate apoyado por el Alfil en g5.'
  },
  {
    id: 'cl-6',
    variant: 'classic',
    tier: 'pro',
    difficulty: 'Difícil',
    title: 'Persecución y Doble de Dama',
    theme: 'Táctica en 3 jugadas',
    fen: '6k1/7p/4p1p1/8/1n6/8/5PPP/3Q2K1 w - - 0 1',
    solution: ['d1d8', 'g8g7', 'd8d4', 'g7g8', 'd4b4'],
    hint: 'Empieza con un jaque en la octava fila para empujar al Rey hacia una diagonal vulnerable.',
    explain: 'Dd8+ fuerza Rg7, lo que habilita Dd4+ atacando simultáneamente al Rey y al Caballo indefenso de b4.'
  },

  // === FISCHER 960 ===
  {
    id: 'f960-1',
    variant: 'fischer960',
    tier: 'free',
    difficulty: 'Fácil',
    title: 'Batería de Esquina 960',
    theme: 'Mate en 1 · Geometría 960',
    fen: '1r3rk1/ppp2p1p/8/8/8/8/PQ3PPP/B5K1 w - - 0 1',
    solution: ['b2g7'],
    hint: 'En Fischer 960 el Alfil en a1 crea una batería mortal con la Dama en b2.',
    explain: 'Dg7# aprovecha la gran diagonal a1-h8 típica de las posiciones de esquina en Ajedrez 960.'
  },
  {
    id: 'f960-2',
    variant: 'fischer960',
    tier: 'free',
    difficulty: 'Fácil',
    title: 'Mate Árabe Asimétrico',
    theme: 'Mate en 1 · Torre + Caballo',
    fen: '1rr4k/ppp3pp/5N2/8/8/8/PPP5/1K5R w - - 0 1',
    solution: ['h1h7'],
    hint: 'Tu Caballo en f6 ya quita la casilla g8 y defiende el punto h7.',
    explain: 'Txh7# ejecuta un Mate Árabe limpio: el Caballo en f6 protege a la Torre y bloquea el escape por g8.'
  },
  {
    id: 'f960-3',
    variant: 'fischer960',
    tier: 'pro',
    difficulty: 'Intermedio',
    title: 'Francotirador de a1',
    theme: 'Sacrificio · Mate en 2',
    fen: '1r4rk/ppp2p1p/8/4Q3/8/1P6/P1P2PPP/BK4R1 w - - 0 1',
    solution: ['e5g7', 'g8g7', 'a1g7'],
    hint: 'Si entregas la Dama en g7, despejas la gran diagonal para tu Alfil en a1.',
    explain: 'Dg7+!! obliga a Txg7 y abre paso al golpe final Axg7# (o Txg7#), coordinando el Alfil de esquina y la Torre.'
  },
  {
    id: 'f960-4',
    variant: 'fischer960',
    tier: 'pro',
    difficulty: 'Difícil',
    title: 'Demolición de Torre 960',
    theme: 'Sacrificio · Mate en 2',
    fen: '1r4rk/ppp2p1p/5P2/8/8/5Q2/PPP2PPP/1K5R w - - 0 1',
    solution: ['h1h7', 'h8h7', 'f3h5'],
    hint: 'Sacrifica la Torre en h7 para arrastrar al Rey a una columna fatal.',
    explain: 'Txh7+!! fuerza Rxh7 (el peón de f6 cubre g7) y Dh5# remata inmediatamente al Rey expuesto.'
  }
];

function ensurePuzzleStyles() {
  if (document.querySelector('style[data-puzzles-css]')) return;
  const style = document.createElement('style');
  style.dataset.puzzlesCss = 'true';
  style.textContent = `
    .pz-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pz-tab {
      background: var(--bg-card);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      border-radius: 9px;
      padding: 7px 14px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
    }
    .pz-tab.active {
      background: rgba(56, 189, 248, 0.16);
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
    }
    .pz-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
    }
    .pz-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 13px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      cursor: pointer;
      transition: transform 0.14s ease, border-color 0.18s ease;
      text-align: left;
      color: var(--text-main);
    }
    .pz-card:hover {
      transform: translateY(-2px);
      border-color: var(--accent-cyan);
    }
    .pz-card.solved {
      border-color: rgba(34, 197, 94, 0.45);
    }
    .pz-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }
    .pz-arena {
      display: grid;
      grid-template-columns: minmax(290px, 560px) minmax(260px, 1fr);
      gap: 20px;
      align-items: start;
    }
    .pz-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .pz-feedback {
      border-radius: 10px;
      padding: 11px 13px;
      font-size: 0.84rem;
      line-height: 1.48;
      background: rgba(9, 13, 22, 0.65);
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--accent-cyan);
    }
    .pz-feedback.ok {
      border-left-color: #22c55e;
      background: rgba(34, 197, 94, 0.12);
    }
    .pz-feedback.err {
      border-left-color: #f43f5e;
      background: rgba(244, 63, 94, 0.14);
    }
    .pz-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    @media (max-width: 880px) {
      .pz-arena { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

export function algToRC(alg) {
  const file = alg[0];
  const rank = parseInt(alg[1], 10);
  return { r: 8 - rank, c: FILES.indexOf(file) };
}

export function loadFenIntoEngine(engine, fen) {
  const parts = fen.trim().split(/\s+/);
  const rows = parts[0].split('/');
  const turn = parts[1] === 'b' ? 'b' : 'w';

  engine.board = Array.from({ length: 8 }, () => new Array(8).fill(null));
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of rows[r]) {
      if (ch >= '1' && ch <= '8') {
        c += parseInt(ch, 10);
      } else {
        const isWhite = ch === ch.toUpperCase();
        engine.board[r][c] = {
          color: isWhite ? 'w' : 'b',
          type: ch.toUpperCase()
        };
        c++;
      }
    }
  }

  engine.turn = turn;
  engine.castling = { w: { K: false, Q: false }, b: { K: false, Q: false } };
  engine.epTarget = null;
  engine.halfmoveClock = 0;
  engine.fullmoveNumber = 1;
  engine.history = [];
  engine.captured = { w: [], b: [] };
  engine.status = 'playing';
  engine.winner = null;
}

export class PuzzlesView {
  constructor({ rootEl, store, getCurrentThemeId, onBackHome, onOpenSubscription }) {
    ensurePuzzleStyles();
    this.rootEl = rootEl;
    this.store = store;
    this.getCurrentThemeId = getCurrentThemeId;
    this.onBackHome = onBackHome;
    this.onOpenSubscription = onOpenSubscription;

    this.sound = new SoundFX();
    this.filter = 'all';
    this.solved = this._loadSolved();
    this.activePuzzle = null;
    this.engine = null;
    this.fx = null;
    this.stepIdx = 0;
    this.selected = null;
    this.legalForSelected = [];
    this.hiddenSquares = new Set();
    this.defeatedKingSq = null;
    this.hintMove = null;
    this.isAnimating = false;
    this.completed = false;
    this.failedOnce = false;
    this.feedback = null;
    this._animToken = 0;
  }

  _loadSolved() {
    try {
      const raw = localStorage.getItem(SOLVED_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  _saveSolved() {
    try {
      localStorage.setItem(SOLVED_KEY, JSON.stringify([...this.solved]));
    } catch { /* ignorar */ }
  }

  _theme() {
    const id = this.getCurrentThemeId ? this.getCurrentThemeId() : 'neon';
    return THEMES[id] || THEMES.neon;
  }

  destroy() {
    this._animToken++;
    if (this.fx) this.fx.cancelActive();
    this.fx = null;
  }

  render() {
    if (this.activePuzzle) {
      this._renderSolverShell();
    } else {
      this._renderCatalog();
    }
  }

  _renderCatalog() {
    this.destroy();
    const hasPro = this.store.hasAccess('pro_puzzles');
    const list = PUZZLE_BANK.filter(p => this.filter === 'all' || p.variant === this.filter);

    this.rootEl.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>🧩 Problemas Tácticos (${this.solved.size}/${PUZZLE_BANK.length})</h2>
          <p class="sec-sub">Resuelve mates y combinaciones en Ajedrez Clásico y Fischer 960 con tus animaciones de combate.</p>
        </div>
        <button class="btn btn-secondary" id="pz-back-home">← Volver al Inicio</button>
      </div>

      <div class="pz-tabs">
        <button class="pz-tab ${this.filter === 'all' ? 'active' : ''}" data-filter="all">Todos (${PUZZLE_BANK.length})</button>
        <button class="pz-tab ${this.filter === 'classic' ? 'active' : ''}" data-filter="classic">♟ Ajedrez Clásico</button>
        <button class="pz-tab ${this.filter === 'fischer960' ? 'active' : ''}" data-filter="fischer960">🎲 Fischer 960</button>
      </div>

      <div class="pz-grid">
        ${list.map(p => {
          const isSolved = this.solved.has(p.id);
          const locked = p.tier === 'pro' && !hasPro;
          return `
            <button class="pz-card ${isSolved ? 'solved' : ''}" data-open-pz="${p.id}" data-locked="${locked}">
              <div class="pz-card-top">
                <span class="curr-pill">${p.variant === 'classic' ? '♟ CLÁSICO' : '🎲 960'} · ${p.difficulty}</span>
                <span class="mode-card-tag ${locked ? 'soon' : ''}">
                  ${locked ? '🔒 PRO' : (isSolved ? '✓ RESUELTO' : 'JUGAR')}
                </span>
              </div>
              <h3 style="font-size:0.98rem">${p.title}</h3>
              <p class="sec-sub">${p.theme}</p>
            </button>
          `;
        }).join('')}
      </div>
    `;

    this.rootEl.querySelector('#pz-back-home')?.addEventListener('click', () => this.onBackHome());
    this.rootEl.querySelectorAll('.pz-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filter = btn.dataset.filter;
        this._renderCatalog();
      });
    });
    this.rootEl.querySelectorAll('[data-open-pz]').forEach(card => {
      card.addEventListener('click', () => {
        if (card.dataset.locked === 'true') {
          this.onOpenSubscription();
          return;
        }
        const pz = PUZZLE_BANK.find(x => x.id === card.dataset.openPz);
        if (pz) this.openPuzzle(pz);
      });
    });
  }

  openPuzzle(puzzle) {
    this.destroy();
    this.activePuzzle = puzzle;
    this.engine = new Chess960Engine(518);
    loadFenIntoEngine(this.engine, puzzle.fen);

    this.stepIdx = 0;
    this.selected = null;
    this.legalForSelected = [];
    this.hiddenSquares.clear();
    this.defeatedKingSq = null;
    this.hintMove = null;
    this.isAnimating = false;
    this.completed = false;
    this.failedOnce = false;
    this.feedback = {
      type: 'info',
      text: `Turno de ${this.engine.turn === 'w' ? 'Blancas' : 'Negras'}. Encuentra la mejor jugada (${puzzle.theme}).`
    };

    this._renderSolverShell();
  }

  _renderSolverShell() {
    const p = this.activePuzzle;
    const theme = this._theme();

    this.rootEl.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>🧩 ${p.title} <span class="curr-pill" style="vertical-align:middle">${p.variant === 'classic' ? '♟ Clásico' : '🎲 Fischer 960'} · ${p.difficulty}</span></h2>
          <p class="sec-sub">${p.theme}</p>
        </div>
        <button class="btn btn-secondary" id="pz-back-list">← Lista de Problemas</button>
      </div>

      <div class="pz-arena">
        <div class="board-stage">
          <div class="board-wrapper" id="pz-board-wrapper">
            <div class="board-grid" id="pz-board-grid"></div>
            <svg class="tactical-svg" id="pz-svg" viewBox="0 0 800 800" preserveAspectRatio="none"></svg>
            <canvas class="fx-canvas" id="pz-fx-canvas"></canvas>
          </div>
        </div>

        <div class="pz-panel">
          <div class="card">
            <div class="card-header">
              <h2>Objetivo Táctico</h2>
              <span class="pos-badge">${this.solved.has(p.id) ? '✓ Resuelto' : 'En curso'}</span>
            </div>
            <div class="pz-feedback" id="pz-feedback"></div>
          </div>

          <div class="card">
            <div class="pz-actions">
              <button class="btn btn-secondary" id="pz-hint">💡 Pista</button>
              <button class="btn btn-secondary" id="pz-retry">↺ Reiniciar</button>
              <button class="btn btn-primary" id="pz-next">Siguiente Problema →</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.boardWrapper = this.rootEl.querySelector('#pz-board-wrapper');
    this.boardGrid = this.rootEl.querySelector('#pz-board-grid');
    this.svgEl = this.rootEl.querySelector('#pz-svg');
    this.fxCanvas = this.rootEl.querySelector('#pz-fx-canvas');
    this.feedbackEl = this.rootEl.querySelector('#pz-feedback');

    this.fx = new CombatFX(this.fxCanvas, this.boardWrapper);
    this.fx.setPalette(theme.fxPalette);
    requestAnimationFrame(() => this.fx?._resize());

    this.rootEl.querySelector('#pz-back-list')?.addEventListener('click', () => {
      this.activePuzzle = null;
      this._renderCatalog();
    });
    this.rootEl.querySelector('#pz-retry')?.addEventListener('click', () => {
      this.openPuzzle(this.activePuzzle);
    });
    this.rootEl.querySelector('#pz-hint')?.addEventListener('click', () => this._showHint());
    this.rootEl.querySelector('#pz-next')?.addEventListener('click', () => this._openNextPuzzle());

    this._renderBoardAndFeedback();
  }

  _showHint() {
    if (this.completed || this.isAnimating) return;
    const expectedUci = this.activePuzzle.solution[this.stepIdx];
    if (!expectedUci) return;
    this.hintMove = {
      from: algToRC(expectedUci.slice(0, 2)),
      to: algToRC(expectedUci.slice(2, 4))
    };
    this.feedback = { type: 'info', text: `💡 Pista: ${this.activePuzzle.hint}` };
    this._renderBoardAndFeedback();
  }

  _openNextPuzzle() {
    const hasPro = this.store.hasAccess('pro_puzzles');
    const available = PUZZLE_BANK.filter(p => (this.filter === 'all' || p.variant === this.filter) && (p.tier === 'free' || hasPro));
    if (!available.length) return;
    const idx = available.findIndex(p => p.id === this.activePuzzle.id);
    const next = available[(idx + 1) % available.length];
    this.openPuzzle(next);
  }

  _handleSquareClick(r, c) {
    if (this.isAnimating || this.completed) return;

    if (this.selected) {
      const candidates = this.legalForSelected.filter(m => m.to.r === r && m.to.c === c);
      if (candidates.length > 0) {
        const chosen = candidates.find(m => m.promo === 'Q') || candidates[0];
        this._validatePlayerMove(chosen);
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
      this._renderBoardAndFeedback();
    } else {
      this.selected = null;
      this.legalForSelected = [];
      this._renderBoardAndFeedback();
    }
  }

  _validatePlayerMove(move) {
    const expectedUci = this.activePuzzle.solution[this.stepIdx];
    const expFrom = algToRC(expectedUci.slice(0, 2));
    const expTo = algToRC(expectedUci.slice(2, 4));

    const exactMatch =
      move.from.r === expFrom.r &&
      move.from.c === expFrom.c &&
      move.to.r === expTo.r &&
      move.to.c === expTo.c;

    // Aceptar también cualquier jugada alternativa que dé jaque mate directo en el paso final
    let altMate = false;
    if (!exactMatch && this.stepIdx === this.activePuzzle.solution.length - 1) {
      const sim = this.engine.clone();
      sim.makeMove(move);
      if (sim.status === 'checkmate') altMate = true;
    }

    if (!exactMatch && !altMate) {
      this.failedOnce = true;
      this.selected = null;
      this.legalForSelected = [];
      this.sound.playCheck();
      this.feedback = {
        type: 'err',
        text: 'Esa jugada no es la más precisa. Intenta de nuevo o toca 💡 Pista.'
      };
      this._renderBoardAndFeedback();
      return;
    }

    this.hintMove = null;
    this._executeAnimatedMove(move, () => {
      this.stepIdx++;

      if (this.stepIdx >= this.activePuzzle.solution.length || this.engine.status === 'checkmate') {
        this.completed = true;
        const firstTime = !this.solved.has(this.activePuzzle.id);
        this.solved.add(this.activePuzzle.id);
        this._saveSolved();
        if (firstTime) {
          this.store.addMessage({
            icon: '🧩',
            title: `Problema resuelto: ${this.activePuzzle.title}`, body: this.activePuzzle.explain }); this.store.save(); } this.feedback = { type: 'ok', text: `¡Excelente! ${this.activePuzzle.explain}`
        };
        this._renderBoardAndFeedback();
        return;
      }

      this.feedback = { type: 'ok', text: '¡Correcto! Sigue con la combinación...' };
      this._renderBoardAndFeedback();

      // Respuesta automática del rival
      const replyUci = this.activePuzzle.solution[this.stepIdx];
      const rf = algToRC(replyUci.slice(0, 2));
      const rt = algToRC(replyUci.slice(2, 4));
      const token = this._animToken;

      setTimeout(() => {
        if (token !== this._animToken || !this.engine) return;
        const legal = this.engine.getLegalMoves(this.engine.turn);
        const replyMove = legal.find(m => m.from.r === rf.r && m.from.c === rf.c && m.to.r === rt.r && m.to.c === rt.c);
        if (!replyMove) return;

        this._executeAnimatedMove(replyMove, () => {
          this.stepIdx++;
          this.feedback = { type: 'info', text: 'Tu turno: remata la combinación.' };
          this._renderBoardAndFeedback();
        });
      }, 360);
    });
  }

  _executeAnimatedMove(move, onDone) {
    const token = ++this._animToken;
    const theme = this._theme();
    const moverColor = this.engine.turn;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const record = this.engine.makeMove(move);

    this.selected = null;
    this.legalForSelected = [];
    this.isAnimating = true;
    this.hiddenSquares.clear();

    const finish = () => {
      if (token !== this._animToken) return;
      this.hiddenSquares.clear();

      if (this.engine.status === 'checkmate') {
        const kSq = this.engine.findKing(enemyColor);
        if (kSq) {
          this.hiddenSquares.add(`${kSq.r},${kSq.c}`);
          this._renderBoardAndFeedback();
          this.sound.playCheckmateDefeat();

          this.fx.playCheckmateSequence({
            kingHtml: theme.renderPiece('K', enemyColor),
            kingSq: kSq,
            flipped: false,
            winnerColor: moverColor,
            onComplete: () => {
              if (token !== this._animToken) return;
              this.hiddenSquares.clear();
              this.defeatedKingSq = kSq;
              this.isAnimating = false;
              this._renderBoardAndFeedback();
              if (onDone) onDone();
            }
          });
          return;
        }
      }

      this.isAnimating = false;
      if (record.inCheck) this.sound.playCheck();
      this._renderBoardAndFeedback();
      if (onDone) onDone();
    };

    if (record.captured) {
      this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
      this._renderBoardAndFeedback();

      this.fx.playCombatSequence({
        pieceType: record.piece,
        attackerHtml: theme.renderPiece(record.promo || record.piece, moverColor),
        victimHtml: theme.renderPiece(record.captured, enemyColor),
        from: record.from,
        to: record.to,
        flipped: false,
        onCharge: () => this.sound.playCharge(record.piece),
        onImpact: () => this.sound.playAttack(record.piece),
        onComplete: finish
      });
      return;
    }

    this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
    this._renderBoardAndFeedback();
    this.sound.playMove(record.piece);

    this.fx.animateRegularMove({
      pieceHtml: theme.renderPiece(record.promo || record.piece, moverColor),
      pieceType: record.piece,
      from: record.from,
      to: record.to,
      flipped: false,
      onComplete: finish
    });
  }

  _renderBoardAndFeedback() {
    if (!this.boardGrid || !this.engine) return;
    const theme = this._theme();
    const lastMove = this.engine.history[this.engine.history.length - 1] || null;
    const checkKing = this.engine.isInCheck(this.engine.turn)
      ? this.engine.findKing(this.engine.turn)
      : null;

    this.boardGrid.innerHTML = '';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        sq.className = `square ${(r + c) \% 2 === 0 ? 'light' : 'dark'}`;  if (lastMove) { if (lastMove.from.r === r && lastMove.from.c === c) sq.classList.add('last-from'); if (lastMove.to.r === r && lastMove.to.c === c) sq.classList.add('last-to'); } if (this.selected && this.selected.r === r && this.selected.c === c) { sq.classList.add('selected'); } if (checkKing && checkKing.r === r && checkKing.c === c) { sq.classList.add('in-check'); }  const matching = this.legalForSelected.filter(m => m.to.r === r && m.to.c === c); if (matching.length > 0) { const isCap = matching.some(m => m.captured \vert{}\vert{} m.ep); const marker = document.createElement('div'); marker.className = isCap ? 'capture-ring' : 'move-dot'; sq.appendChild(marker); }  if (c === 0) { const rankEl = document.createElement('span'); rankEl.className = 'coord-rank'; rankEl.textContent = 8 - r; sq.appendChild(rankEl); } if (r === 7) { const fileEl = document.createElement('span'); fileEl.className = 'coord-file'; fileEl.textContent = FILES[c]; sq.appendChild(fileEl); }  const piece = this.engine.board[r][c]; if (piece && !this.hiddenSquares.has(`${r},${c}`)) { const wrap = document.createElement('div'); wrap.className = 'piece-wrap'; if ( piece.type === 'K' && this.defeatedKingSq && this.defeatedKingSq.r === r && this.defeatedKingSq.c === c ) { wrap.classList.add('king-defeated'); } wrap.innerHTML = theme.renderPiece(piece.type, piece.color); sq.appendChild(wrap); }  sq.addEventListener('click', () => this._handleSquareClick(r, c)); this.boardGrid.appendChild(sq); } }  // Flecha verde de pista this.svgEl.innerHTML = ''; if (this.hintMove) { const ns = 'http://www.w3.org/2000/svg'; const x1 = this.hintMove.from.c * 100 + 50; const y1 = this.hintMove.from.r * 100 + 50; const x2 = this.hintMove.to.c * 100 + 50; const y2 = this.hintMove.to.r * 100 + 50; const dx = x2 - x1; const dy = y2 - y1; const len = Math.hypot(dx, dy) \vert{}\vert{} 1; const ux = dx / len; const uy = dy / len;  const line = document.createElementNS(ns, 'line'); line.setAttribute('x1', x1 + ux * 18); line.setAttribute('y1', y1 + uy * 18); line.setAttribute('x2', x2 - ux * 26); line.setAttribute('y2', y2 - uy * 26); line.setAttribute('stroke', '#22c55e'); line.setAttribute('stroke-width', '14'); line.setAttribute('stroke-linecap', 'round'); line.setAttribute('opacity', '0.88'); this.svgEl.appendChild(line);  const tipX = x2 - ux * 6; const tipY = y2 - uy * 6; const baseX = x2 - ux * 32; const baseY = y2 - uy * 32; const px = -uy * 16; const py = ux * 16; const head = document.createElementNS(ns, 'polygon'); head.setAttribute('points', `${tipX},${tipY}${baseX + px},${baseY + py}${baseX - px},${baseY - py}`); head.setAttribute('fill', '#22c55e'); head.setAttribute('opacity', '0.88'); this.svgEl.appendChild(head); }  if (this.feedbackEl && this.feedback) { this.feedbackEl.className = `pz-feedback ${this.feedback.type === 'ok' ? 'ok' : this.feedback.type === 'err' ? 'err' : ''}`;
      this.feedbackEl.textContent = this.feedback.text;
    }
  }
}
