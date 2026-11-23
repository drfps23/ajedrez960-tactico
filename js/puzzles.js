import { Chess960Engine, FILES } from './engine.js';
import { CombatFX } from './fx.js';
import { THEMES } from './themes.js';
import { PUZZLES } from './data/puzzles_data.js';

const SOLVED_KEY = 'ajedrez960_puzzles_solved_v1';

function ensureTrainerStyles() {
  if (document.querySelector('style[data-trainer-css]')) return;
  const style = document.createElement('style');
  style.dataset.trainerCss = 'true';
  style.textContent = `
    .tr-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .tr-layout {
      display: grid; grid-template-columns: minmax(280px, 510px) minmax(260px, 1fr);
      gap: 18px; align-items: start;
    }
    .tr-board-wrap {
      position: relative; width: 100%; aspect-ratio: 1 / 1; border-radius: 12px;
      overflow: hidden; border: 3px solid var(--board-border);
      box-shadow: var(--board-shadow); user-select: none;
    }
    .tr-panel {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px;
    }
    .tr-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .tr-pill {
      background: rgba(9, 13, 22, 0.7); color: var(--text-main);
      border: 1px solid var(--border-color); border-radius: 8px;
      padding: 6px 10px; font-size: 0.78rem; font-weight: 600; cursor: pointer;
    }
    .tr-pill.active { border-color: var(--accent-cyan); background: rgba(56, 189, 248, 0.16); color: var(--accent-cyan); }
    .tr-pill.solved { border-color: rgba(34, 197, 94, 0.5); }
    .tr-feedback {
      background: rgba(9, 13, 22, 0.65); border: 1px solid var(--border-color);
      border-left: 4px solid var(--accent-cyan); border-radius: 9px;
      padding: 10px 12px; font-size: 0.84rem; line-height: 1.48;
    }
    .tr-feedback.ok { border-left-color: #22c55e; color: #bbf7d0; }
    .tr-feedback.err { border-left-color: #f43f5e; color: #fecdd3; }
    .tr-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    @media (max-width: 860px) { .tr-layout { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);
}

function loadFenIntoEngine(fen) {
  const eng = new Chess960Engine(518);
  const parts = fen.trim().split(/\s+/);
  const rows = parts[0].split('/');
  eng.board = Array.from({ length: 8 }, () => new Array(8).fill(null));

  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of rows[r]) {
      if (ch >= '1' && ch <= '8') {
        c += parseInt(ch, 10);
      } else {
        const isW = ch === ch.toUpperCase();
        eng.board[r][c] = { color: isW ? 'w' : 'b', type: ch.toUpperCase() };
        c++;
      }
    }
  }
  eng.turn = parts[1] === 'b' ? 'b' : 'w';
  eng.castling = { w: { K: false, Q: false }, b: { K: false, Q: false } };
  eng.epTarget = null;
  eng.history = [];
  eng.status = 'playing';
  eng.winner = null;
  return eng;
}

function uciToCoords(uci) {
  return {
    from: { r: 8 - parseInt(uci[1], 10), c: FILES.indexOf(uci[0]) },
    to: { r: 8 - parseInt(uci[3], 10), c: FILES.indexOf(uci[2]) },
    promo: uci[4] ? uci[4].toUpperCase() : null
  };
}

export class PuzzleTrainer {
  constructor(app) {
    ensureTrainerStyles();
    this.app = app;
    this.filter = 'all';
    this.currentId = PUZZLES[0].id;
    this.solved = this._loadSolved();
    this.fx = null;
    this.busy = false;
    this.hidden = new Set();
    this.defeatedKingSq = null;
  }

  _loadSolved() {
    try {
      return new Set(JSON.parse(localStorage.getItem(SOLVED_KEY) || '[]'));
    } catch {
      return new Set();
    }
  }

  _markSolved(id) {
    this.solved.add(id);
    try {
      localStorage.setItem(SOLVED_KEY, JSON.stringify([...this.solved]));
    } catch { /* ignorar */ }
  }

  stop() {
    this.busy = false;
    this.fx?.cancelActive();
  }

  mount(container) {
    this.container = container;
    this.loadPuzzle(this.currentId);
  }

  _filteredList() {
    if (this.filter === 'all') return PUZZLES;
    return PUZZLES.filter(p => p.variant === this.filter);
  }

  loadPuzzle(id) {
    const p = PUZZLES.find(item => item.id === id) || PUZZLES[0];
    this.puzzle = p;
    this.currentId = p.id;
    this.engine = loadFenIntoEngine(p.fen);
    this.stepIdx = 0;
    this.selected = null;
    this.legal = [];
    this.busy = false;
    this.done = false;
    this.hidden.clear();
    this.defeatedKingSq = null;
    this.feedback = { type: 'info', text: `Tu turno (${this.engine.turn === 'w' ? 'Blancas' : 'Negras'}). Encuentra la secuencia ganadora.` };
    this._renderScaffold();
  }

  _renderScaffold() {
    if (!this.container) return;
    const list = this._filteredList();
    const isPro = this.app.store.hasAccess('pro_puzzles');

    this.container.innerHTML = `
      <div class="sec-head" style="margin-bottom:14px">
        <div>
          <h2>🧩 Problemas Tácticos (${this.solved.size}/${PUZZLES.length})</h2>
          <p class="sec-sub">Entrena remates en Ajedrez Clásico y Fischer 960 con animaciones de combate.</p>
        </div>
        <button class="btn btn-secondary" id="pz-home">← Inicio</button>
      </div>
      <div class="tr-bar" style="margin-bottom:12px">
        <button class="tr-pill ${this.filter === 'all' ? 'active' : ''}" data-f="all">Todos</button>
        <button class="tr-pill ${this.filter === 'classic' ? 'active' : ''}" data-f="classic">♟ Clásico</button>
        <button class="tr-pill ${this.filter === 'fischer960' ? 'active' : ''}" data-f="fischer960">🎲 Fischer 960</button>
      </div>
      <div class="tr-list" style="margin-bottom:16px">
        ${list.map((item) => {
          const idx = PUZZLES.indexOf(item);
          const locked = !isPro && idx >= 3;
          const ok = this.solved.has(item.id);
          return `<button class="tr-pill ${item.id === this.puzzle.id ? 'active' : ''} ${ok ? 'solved' : ''}" data-pid="${item.id}" data-locked="${locked}">
            ${locked ? '🔒 ' : (ok ? '✓ ' : '')}${item.title}
          </button>`;
        }).join('')}
      </div>
      <div class="tr-layout">
        <div class="tr-board-wrap" id="pz-wrap">
          <div class="board-grid" id="pz-grid"></div>
          <canvas class="fx-canvas" id="pz-canvas"></canvas>
        </div>
        <div class="tr-panel">
          <div class="status-row">
            <span class="pos-badge">${this.puzzle.theme}</span>
            <span class="turn-pill">${this.puzzle.difficulty}</span>
          </div>
          <h3>${this.puzzle.title}</h3>
          <div class="tr-feedback ${this.feedback.type}" id="pz-fb">${this.feedback.text}</div>
          <div class="tr-actions">
            <button class="btn btn-secondary" id="pz-hint">💡 Pista</button>
            <button class="btn btn-secondary" id="pz-retry">🔄 Reiniciar</button>
            <button class="btn btn-primary" id="pz-next">Siguiente →</button>
          </div>
        </div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#pz-grid');
    this.fbEl = this.container.querySelector('#pz-fb');
    this.fx = new CombatFX(this.container.querySelector('#pz-canvas'), this.container.querySelector('#pz-wrap'));
    const theme = THEMES[this.app.themes.currentId];
    if (theme) this.fx.setPalette(theme.fxPalette);

    this.container.querySelector('#pz-home').addEventListener('click', () => this.app.shell.navigate('home'));
    this.container.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
      this.filter = b.dataset.f;
      const next = this._filteredList()[0];
      this.loadPuzzle(next ? next.id : PUZZLES[0].id);
    }));
    this.container.querySelectorAll('[data-pid]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.locked === 'true') {
        this.app.shell.navigate('subscription');
        return;
      }
      this.loadPuzzle(b.dataset.pid);
    }));
    this.container.querySelector('#pz-hint').addEventListener('click', () => {
      this._setFeedback('info', `💡 Pista: ${this.puzzle.hint}`);
    });
    this.container.querySelector('#pz-retry').addEventListener('click', () => this.loadPuzzle(this.puzzle.id));
    this.container.querySelector('#pz-next').addEventListener('click', () => {
      const items = this._filteredList();
      const idx = items.findIndex(x => x.id === this.puzzle.id);
      const next = items[(idx + 1) % items.length];
      if (!isPro && PUZZLES.indexOf(next) >= 3) {
        this.app.shell.navigate('subscription');
        return;
      }
      this.loadPuzzle(next.id);
    });

    this._renderBoard();
  }

  _setFeedback(type, text) {
    this.feedback = { type, text };
    if (this.fbEl) {
      this.fbEl.className = `tr-feedback ${type}`;
      this.fbEl.textContent = text;
    }
  }

  _onSquareClick(r, c) {
    if (this.busy || this.done) return;

    if (this.selected) {
      const match = this.legal.find(m => m.to.r === r && m.to.c === c);
      if (match) {
        this._checkMove(match);
        return;
      }
    }

    const p = this.engine.board[r][c];
    if (p && p.color === this.engine.turn) {
      this.selected = { r, c };
      this.legal = this.engine.getLegalMovesFrom(r, c);
    } else {
      this.selected = null;
      this.legal = [];
    }
    this._renderBoard();
  }

  _checkMove(move) {
    const expected = uciToCoords(this.puzzle.solution[this.stepIdx]);
    const ok = move.from.r === expected.from.r && move.from.c === expected.from.c &&
               move.to.r === expected.to.r && move.to.c === expected.to.c;

    this.selected = null;
    this.legal = [];

    if (!ok) {
      this._setFeedback('err', 'No es la jugada exacta. Observa las amenazas o toca "Pista".');
      this._renderBoard();
      return;
    }

    this._playAnimatedMove(move, () => {
      this.stepIdx++;
      if (this.stepIdx >= this.puzzle.solution.length) {
        this.done = true;
        this._markSolved(this.puzzle.id);
        this._setFeedback('ok', `✓ ¡Resuelto! ${this.puzzle.explanation}`);
        this._renderBoard();
        return;
      }
      // Respuesta automática del rival
      setTimeout(() => {
        const reply = uciToCoords(this.puzzle.solution[this.stepIdx]);
        const legal = this.engine.getLegalMoves(this.engine.turn);
        const replyMove = legal.find(m => m.from.r === reply.from.r && m.from.c === reply.from.c && m.to.r === reply.to.r && m.to.c === reply.to.c);
        if (replyMove) {
          this._playAnimatedMove(replyMove, () => {
            this.stepIdx++;
            this._setFeedback('info', '¡Bien! Ahora remata la combinación.');
          });
        }
      }, 280);
    });
  }

  _playAnimatedMove(move, onDone) {
    const moverColor = this.engine.turn;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const rec = this.engine.makeMove(move);
    this.busy = true;
    this.hidden.clear();
    this.hidden.add(`${rec.to.r},${rec.to.c}`);
    this._renderBoard();

    const finish = () => {
      this.hidden.clear();
      if (this.engine.status === 'checkmate') {
        const kSq = this.engine.findKing(enemyColor);
        if (kSq) {
          this.hidden.add(`${kSq.r},${kSq.c}`);
          this._renderBoard();
          this.app.sound.playCheckmateDefeat();
          this.fx.playCheckmateSequence({
            kingHtml: this.app.pieceRenderer('K', enemyColor),
            kingSq: kSq,
            winnerColor: moverColor,
            onComplete: () => {
              this.hidden.clear();
              this.defeatedKingSq = kSq;
              this.busy = false;
              this._renderBoard();
              onDone?.();
            }
          });
          return;
        }
      }
      this.busy = false;
      if (rec.inCheck) this.app.sound.playCheck();
      this._renderBoard();
      onDone?.();
    };

    if (rec.captured) {
      this.fx.playCombatSequence({
        pieceType: rec.piece,
        attackerHtml: this.app.pieceRenderer(rec.promo || rec.piece, moverColor),
        victimHtml: this.app.pieceRenderer(rec.captured, enemyColor),
        from: rec.from,
        to: rec.to,
        onCharge: () => this.app.sound.playCharge(rec.piece),
        onImpact: () => this.app.sound.playAttack(rec.piece),
        onComplete: finish
      });
    } else {
      this.app.sound.playMove(rec.piece);
      this.fx.animateRegularMove({
        pieceHtml: this.app.pieceRenderer(rec.promo || rec.piece, moverColor),
        pieceType: rec.piece,
        from: rec.from,
        to: rec.to,
        onComplete: finish
      });
    }
  }

  _renderBoard() {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = '';
    const last = this.engine.history[this.engine.history.length - 1] || null;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        if (last && last.from.r === r && last.from.c === c) sq.classList.add('last-from');
        if (last && last.to.r === r && last.to.c === c) sq.classList.add('last-to');
        if (this.selected && this.selected.r === r && this.selected.c === c) sq.classList.add('selected');

        const m = this.legal.find(x => x.to.r === r && x.to.c === c);
        if (m) {
          const mk = document.createElement('div');
          mk.className = m.captured ? 'capture-ring' : 'move-dot';
          sq.appendChild(mk);
        }

        const piece = this.engine.board[r][c];
        if (piece && !this.hidden.has(`${r},${c}`)) {
          const wrap = document.createElement('div');
          wrap.className = 'piece-wrap';
          if (piece.type === 'K' && this.defeatedKingSq && this.defeatedKingSq.r === r && this.defeatedKingSq.c === c) {
            wrap.classList.add('king-defeated');
          }
          wrap.innerHTML = this.app.pieceRenderer(piece.type, piece.color);
          sq.appendChild(wrap);
        }

        sq.addEventListener('click', () => this._onSquareClick(r, c));
        this.gridEl.appendChild(sq);
      }
    }
  }
}
