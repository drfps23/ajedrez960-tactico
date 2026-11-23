import { Chess960Engine, FILES } from './engine.js';
import { CombatFX } from './fx.js';
import { THEMES } from './themes.js';
import { PUZZLE_LEVELS, PUZZLES } from './data/puzzles_data.js';

const SOLVED_KEY = 'ajedrez960_puzzles_solved_v1';
const EN_TO_ES = { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' };
const PIECE_SCORE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

function ensureTrainerStyles() {
  if (document.querySelector('style[data-trainer-css]')) return;
  const style = document.createElement('style');
  style.dataset.trainerCss = 'true';
  style.textContent = `
    .tr-levels { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; margin-bottom: 12px; }
    .tr-level-btn {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 11px;
      padding: 9px 12px; color: var(--text-main); cursor: pointer; text-align: left;
      display: flex; flex-direction: column; gap: 3px; transition: border-color 0.15s;
    }
    .tr-level-btn:hover { border-color: var(--accent-cyan); }
    .tr-level-btn.active { border-color: var(--accent-cyan); background: rgba(56, 189, 248, 0.14); box-shadow: 0 0 14px rgba(56, 189, 248, 0.18); }
    .tr-level-btn strong { font-size: 0.82rem; }
    .tr-level-btn span { font-size: 0.7rem; color: var(--text-muted); }
    .tr-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .tr-layout { display: grid; grid-template-columns: minmax(280px, 510px) minmax(260px, 1fr); gap: 18px; align-items: start; }
    .tr-board-wrap {
      position: relative; width: 100%; aspect-ratio: 1 / 1; border-radius: 12px;
      overflow: hidden; border: 3px solid var(--board-border); box-shadow: var(--board-shadow); user-select: none;
    }
    .tr-panel { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .tr-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .tr-pill {
      background: rgba(9, 13, 22, 0.7); color: var(--text-main); border: 1px solid var(--border-color);
      border-radius: 8px; padding: 6px 10px; font-size: 0.78rem; font-weight: 600; cursor: pointer;
    }
    .tr-pill.active { border-color: var(--accent-cyan); background: rgba(56, 189, 248, 0.16); color: var(--accent-cyan); }
    .tr-pill.solved { border-color: rgba(34, 197, 94, 0.55); }
    .tr-feedback {
      background: rgba(9, 13, 22, 0.65); border: 1px solid var(--border-color);
      border-left: 4px solid var(--accent-cyan); border-radius: 9px; padding: 10px 12px; font-size: 0.84rem; line-height: 1.48;
    }
    .tr-feedback.ok { border-left-color: #22c55e; color: #bbf7d0; }
    .tr-feedback.err { border-left-color: #f43f5e; color: #fecdd3; }
    .tr-feedback.task { border-left-color: #facc15; color: #fef08a; background: rgba(250, 204, 21, 0.08); }
    .tr-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .square.hint-sq { box-shadow: inset 0 0 0 3px #facc15; }
    .square.pz-wrong-sq { box-shadow: inset 0 0 0 3px #ef4444; background-color: rgba(239, 68, 68, 0.34) !important; }
    .pz-wrong-x {
      position: absolute; top: 3px; right: 3px; z-index: 14; width: 24px; height: 24px; border-radius: 50%;
      background: #ef4444; color: #ffffff; font-weight: 900; font-size: 0.85rem; display: grid; place-items: center;
      box-shadow: 0 2px 10px rgba(239, 68, 68, 0.75); animation: pzShake 0.35s ease;
    }
    @keyframes pzShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
    @media (max-width: 860px) { .tr-layout { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);
}

function loadFenIntoEngine(fen) {
  const eng = new Chess960Engine(518);
  const parts = String(fen || '').trim().split(/\s+/);
  const rows = (parts[0] || '').split('/');
  eng.board = Array.from({ length: 8 }, () => new Array(8).fill(null));
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of (rows[r] || '')) {
      if (ch >= '1' && ch <= '8') c += parseInt(ch, 10);
      else {
        eng.board[r][c] = { color: ch === ch.toUpperCase() ? 'w' : 'b', type: ch.toUpperCase() };
        c++;
      }
    }
  }
  eng.turn = parts[1] === 'b' ? 'b' : 'w';
  const castleStr = parts[2] || '-';
  eng.castling = {
    w: { K: castleStr.includes('K'), Q: castleStr.includes('Q') },
    b: { K: castleStr.includes('k'), Q: castleStr.includes('q') }
  };
  eng.epTarget = (parts[3] && parts[3] !== '-' && parts[3].length === 2)
    ? { r: 8 - parseInt(parts[3][1], 10), c: FILES.indexOf(parts[3][0]) }
    : null;
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

function moveToUci(m) {
  const destC = m.castle ? m.kingToCol : m.to.c;
  return `${FILES[m.from.c]}${8 - m.from.r}${FILES[destC]}${8 - m.to.r}${m.promo ? m.promo.toLowerCase() : ''}`;
}

function findLegalMoveByUci(engine, uci) {
  if (!uci || uci.length < 4) return null;
  const exp = uciToCoords(uci);
  const legal = engine.getLegalMoves(engine.turn);
  const direct = legal.find(m =>
    m.from.r === exp.from.r && m.from.c === exp.from.c &&
    m.to.r === exp.to.r && m.to.c === exp.to.c &&
    (!exp.promo || m.promo === exp.promo)
  );
  if (direct) return direct;
  const p = engine.board[exp.from.r]?.[exp.from.c];
  if (p && p.type === 'K' && Math.abs(exp.to.c - exp.from.c) >= 2) {
    return legal.find(m => m.castle === (exp.to.c > exp.from.c ? 'K' : 'Q')) || null;
  }
  return null;
}

function cleanSan(s) {
  return String(s || '').replace(/[+#!?=]/g, '').replace(/0/g, 'O').trim();
}

function enSanToEs(tok) {
  let s = String(tok || '').replace(/^\d+\.+/, '').replace(/[+#!?]/g, '').replace(/0/g, 'O').trim();
  if (!s || s.startsWith('O-O')) return s;
  if (EN_TO_ES[s[0]]) s = EN_TO_ES[s[0]] + s.slice(1);
  s = s.replace(/=([KQRBN])/, (_, p) => EN_TO_ES[p] || p);
  return s.replace(/=/g, '');
}

async function fetchInfiniteOnlinePuzzle(level, solvedSet) {
  const minPlies = level >= 3 ? 3 : 1;
  let fallback = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://api.chess.com/pub/puzzle/random?t=${Date.now()}_${attempt}`);
    if (!res.ok) continue;
    const data = await res.json();
    if (!data?.fen || !data?.pgn) continue;

    const pid = `inf_cc_${data.publish_time || Math.random().toString(36).slice(2, 8)}`;
    const tokens = data.pgn
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\{[^}]*\}/g, ' ')
      .replace(/\([^)]*\)/g, ' ')
      .split(/\s+/)
      .map(t => t.replace(/^\d+\.+/, '').trim())
      .filter(t => t && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t));

    if (!tokens.length) continue;

    const sim = loadFenIntoEngine(data.fen);
    const solution = [];
    let valid = true;

    for (const tok of tokens) {
      const want = enSanToEs(tok);
      const match = sim.getLegalMoves(sim.turn).find(m => cleanSan(sim.clone().makeMove(m).san) === want);
      if (!match) { valid = false; break; }
      solution.push(moveToUci(match));
      sim.makeMove(match);
    }
    if (!valid || !solution.length) continue;

    const lvlObj = PUZZLE_LEVELS.find(l => l.id === level) || PUZZLE_LEVELS[0];
    const obj = {
      id: pid,
      isLive: true,
      isInfinite: true,
      level,
      variant: 'classic',
      title: data.title ? `∞ ${data.title}` : `∞ Reto Táctico (${lvlObj.elo})`,
      theme: `∞ Reto Infinito · ${Math.ceil(solution.length / 2)} jug.`,
      fen: data.fen,
      solution,
      hint: 'Calcula primero los jaques forzados, capturas y amenazas dobles.',
      explanation: `¡Reto infinito superado! Combinación de ${Math.ceil(solution.length / 2)} jugada(s) exacta.`
    };
    fallback = obj;
    if (!solvedSet.has(pid) && solution.length >= minPlies) return obj;
  }
  return fallback;
}

function generateOfflineInfinitePuzzle(level, variant = 'classic') {
  const mirror = Math.random() < 0.5;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const flipR = (r) => (mirror ? 7 - r : r);
  const myC = mirror ? 'b' : 'w';
  const oppC = mirror ? 'w' : 'b';
  const toUci = (fr, fc, tr, tc) => `${FILES[fc]}${8 - fr}${FILES[tc]}${8 - tr}`;
  const is960 = variant === 'fischer960';
  const id = `inf_gen_${level}_${Date.now().toString(36)}`;

  const toFen = (pieces) => {
    const g = Array.from({ length: 8 }, () => new Array(8).fill(null));
    pieces.forEach(p => { g[p.r][p.c] = { color: p.color, type: p.type }; });
    return g.map(row => {
      let s = '', e = 0;
      for (const cell of row) {
        if (!cell) e++;
        else { if (e) { s += e; e = 0; } s += cell.color === 'w' ? cell.type : cell.type.toLowerCase(); }
      }
      return s + (e || '');
    }).join('/') + ` ${myC} - - 0 1`;
  };

  if (level <= 1) {
    const right = Math.random() < 0.5;
    const kCol = right ? 6 : 1;
    const pCols = right ? [5, 6, 7] : [0, 1, 2];
    const rCol = pick(right ? [0, 1, 2, 3, 4] : [3, 4, 5, 6, 7]);
    const pieces = [
      { r: flipR(0), c: kCol, color: oppC, type: 'K' },
      ...pCols.map(c => ({ r: flipR(1), c, color: oppC, type: 'P' })),
      { r: flipR(7), c: kCol, color: myC, type: 'K' },
      ...pCols.map(c => ({ r: flipR(6), c, color: myC, type: 'P' })),
      { r: flipR(7), c: rCol, color: myC, type: 'R' }
    ];
    return {
      id, isLive: true, isInfinite: true, level: 1, variant,
      title: `∞ Pasillo Aleatorio (${myC === 'w' ? 'Blancas' : 'Negras'})`,
      theme: is960 ? '∞ Mate en 1 · 960' : '∞ Mate en 1 · Nivel 1',
      fen: toFen(pieces),
      solution: [toUci(flipR(7), rCol, flipR(0), rCol)],
      hint: 'El Rey rival está encerrado detrás de sus peones en la última fila.',
      explanation: 'La Torre entra hasta la última fila dando jaque mate inmediato.'
    };
  }

  if (level === 2 || level === 3) {
    const right = Math.random() < 0.5;
    const kCol = right ? 6 : 1;
    const pCols = right ? [5, 6, 7] : [0, 1, 2];
    const atkCol = pick([3, 4]);
    const defCol = right ? pick([0, 1, 2]) : pick([5, 6, 7]);
    const pieces = [
      { r: flipR(0), c: kCol, color: oppC, type: 'K' },
      { r: flipR(0), c: defCol, color: oppC, type: 'R' },
      ...pCols.map(c => ({ r: flipR(1), c, color: oppC, type: 'P' })),
      { r: flipR(7), c: kCol, color: myC, type: 'K' },
      ...pCols.map(c => ({ r: flipR(6), c, color: myC, type: 'P' })),
      { r: flipR(6), c: atkCol, color: myC, type: 'Q' },
      { r: flipR(7), c: atkCol, color: myC, type: 'R' }
    ];
    return {
      id, isLive: true, isInfinite: true, level, variant,
      title: `∞ Desviación Dinámica (${myC === 'w' ? 'Blancas' : 'Negras'})`,
      theme: is960 ? '∞ Mate en 2 · 960' : `∞ Mate en 2 · Nivel ${level}`,
      fen: toFen(pieces),
      solution: [
        toUci(flipR(6), atkCol, flipR(0), atkCol),
        toUci(flipR(0), defCol, flipR(0), atkCol),
        toUci(flipR(7), atkCol, flipR(0), atkCol)
      ],
      hint: 'Sacrifica la Dama en la última fila para desviar a la Torre defensora.',
      explanation: 'Al capturar la Dama, la Torre defensora abandona la fila y rematas con tu Torre.'
    };
  }

  const pieces = [
    { r: flipR(0), c: 6, color: oppC, type: 'K' },
    { r: flipR(0), c: 0, color: oppC, type: 'R' },
    { r: flipR(0), c: 2, color: oppC, type: 'R' },
    { r: flipR(1), c: 5, color: oppC, type: 'P' },
    { r: flipR(1), c: 6, color: oppC, type: 'P' },
    { r: flipR(1), c: 7, color: oppC, type: 'P' },
    { r: flipR(7), c: 6, color: myC, type: 'K' },
    { r: flipR(6), c: 5, color: myC, type: 'P' },
    { r: flipR(6), c: 6, color: myC, type: 'P' },
    { r: flipR(6), c: 7, color: myC, type: 'P' },
    { r: flipR(4), c: 4, color: myC, type: 'Q' },
    { r: flipR(6), c: 4, color: myC, type: 'R' },
    { r: flipR(7), c: 4, color: myC, type: 'R' }
  ];
  return {
    id, isLive: true, isInfinite: true, level: 4, variant,
    title: `∞ Demolición Triple (${myC === 'w' ? 'Blancas' : 'Negras'})`,
    theme: is960 ? '∞ Mate en 3 · 960' : '∞ Mate en 3 · Nivel 4',
    fen: toFen(pieces),
    solution: [
      toUci(flipR(4), 4, flipR(0), 4),
      toUci(flipR(0), 2, flipR(0), 4),
      toUci(flipR(6), 4, flipR(0), 4),
      toUci(flipR(0), 0, flipR(0), 4),
      toUci(flipR(7), 4, flipR(0), 4)
    ],
    hint: 'Lanza tus tres piezas pesadas en cadena sobre la columna e.',
    explanation: 'Sacrificas Dama y primera Torre para eliminar ambas defensas y dar mate.'
  };
}

export class PuzzleTrainer {
  constructor(app) {
    ensureTrainerStyles();
    this.app = app;
    this.level = 1;
    this.filter = 'all';
    this.currentId = PUZZLES[0].id;
    this.solved = this._loadSolved();
    this.fx = null;
    this.busy = false;
    this.loadingInfinite = false;
    this.playerColor = 'w';
    this.hidden = new Set();
    this.hintSquares = new Set();
    this.wrongSqKey = null;
    this.defeatedKingSq = null;
    this._runToken = 0;
  }

  _loadSolved() {
    try { return new Set(JSON.parse(localStorage.getItem(SOLVED_KEY) || '[]')); }
    catch { return new Set(); }
  }

  _markSolved(id) {
    this.solved.add(id);
    try { localStorage.setItem(SOLVED_KEY, JSON.stringify([...this.solved])); } catch { /* ignorar */ }
  }

  stop() {
    this._runToken++;
    this.busy = false;
    this.fx?.cancelActive();
  }

  mount(container) {
    this.container = container;
    this.loadPuzzle(this.currentId);
  }

  _filteredList() {
    return PUZZLES.filter(p => p.level === this.level && (this.filter === 'all' || p.variant === this.filter));
  }

  _startPuzzleObject(p) {
    this._runToken++;
    this.puzzle = p;
    this.currentId = p.id;
    if (p.level) this.level = p.level;
    this.engine = loadFenIntoEngine(p.fen);
    this.playerColor = this.engine.turn;
    this.stepIdx = 0;
    this.selected = null;
    this.legal = [];
    this.busy = false;
    this.done = false;
    this.hidden.clear();
    this.hintSquares.clear();
    this.wrongSqKey = null;
    this.defeatedKingSq = null;
    this.feedback = {
      type: 'info',
      text: `Tu turno (${this.playerColor === 'w' ? 'Blancas' : 'Negras'}). Encuentra la jugada ganadora.`
    };
    this._renderScaffold();
  }

  loadPuzzle(id) {
    this._startPuzzleObject(PUZZLES.find(item => item.id === id) || PUZZLES[0]);
  }

  loadExternalPuzzle(puzzleObj) {
    if (puzzleObj) this._startPuzzleObject(puzzleObj);
  }

  async loadInfinitePuzzle() {
    if (this.loadingInfinite) return;
    this.loadingInfinite = true;
    const btn = this.container?.querySelector('#pz-infinite');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Buscando reto...'; }

    let nextObj = null;
    try {
      if (this.filter !== 'fischer960') {
        nextObj = await fetchInfiniteOnlinePuzzle(this.level, this.solved);
      }
    } catch { /* respaldo offline */ }

    if (!nextObj) {
      nextObj = generateOfflineInfinitePuzzle(this.level, this.filter === 'fischer960' ? 'fischer960' : 'classic');
    }
    this.loadingInfinite = false;
    this._startPuzzleObject(nextObj);
  }

  _renderScaffold() {
    if (!this.container) return;
    const list = this._filteredList();
    const isPro = this.app.store.hasAccess('pro_puzzles');
    const lvlInfo = PUZZLE_LEVELS.find(l => l.id === this.level) || PUZZLE_LEVELS[0];
    const eloBadge = this.puzzle.rating ? `ELO ${this.puzzle.rating}` : `${lvlInfo.elo} ELO`;

    this.container.innerHTML = `
      <div class="sec-head" style="margin-bottom:12px">
        <div>
          <h2>🧩 Problemas Tácticos (${this.solved.size} resueltos)</h2>
          <p class="sec-sub">4 niveles progresivos + Modo Infinito inagotable. Si fallas, Stockfish castiga tu jugada.</p>
        </div>
        <button class="btn btn-secondary" id="pz-home">← Inicio</button>
      </div>

      <div class="tr-levels">
        ${PUZZLE_LEVELS.map(l => {
          const allInLvl = PUZZLES.filter(x => x.level === l.id);
          const doneInLvl = allInLvl.filter(x => this.solved.has(x.id)).length;
          const locked = l.proOnly && !isPro;
          return `
            <button class="tr-level-btn ${this.level === l.id ? 'active' : ''}" data-lvl="${l.id}" data-locked="${locked}">
              <strong>${locked ? '🔒 ' : ''}${l.name}</strong>
              <span>ELO ${l.elo} · ${doneInLvl}/${allInLvl.length} base + ∞</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="tr-bar" style="margin-bottom:10px">
        <button class="tr-pill ${this.filter === 'all' ? 'active' : ''}" data-f="all">Todos</button>
        <button class="tr-pill ${this.filter === 'classic' ? 'active' : ''}" data-f="classic">♟ Clásico</button>
        <button class="tr-pill ${this.filter === 'fischer960' ? 'active' : ''}" data-f="fischer960">🎲 Fischer 960</button>
        <button class="btn btn-primary" id="pz-infinite" style="margin-left:auto">∞ Nuevo Reto Infinito</button>
      </div>

      <div class="tr-list" style="margin-bottom:16px">
        ${list.map(item => {
          const ok = this.solved.has(item.id);
          return `<button class="tr-pill ${item.id === this.puzzle.id ? 'active' : ''} ${ok ? 'solved' : ''}" data-pid="${item.id}">
            ${ok ? '✓ ' : ''}${item.title}
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
            <span class="turn-pill">${eloBadge}</span>
          </div>
          <h3>${this.puzzle.title}</h3>
          <div class="tr-feedback ${this.feedback.type}" id="pz-fb">${this.feedback.text}</div>
          <div class="tr-actions">
            <button class="btn btn-secondary" id="pz-hint">💡 Pista</button>
            <button class="btn btn-secondary" id="pz-retry">🔄 Reiniciar</button>
            <button class="btn btn-primary" id="pz-next">${this.puzzle.isInfinite ? '∞ Siguiente Reto →' : 'Siguiente →'}</button>
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
    this.container.querySelector('#pz-infinite').addEventListener('click', () => this.loadInfinitePuzzle());
    this.container.querySelectorAll('[data-lvl]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.locked === 'true') { this.app.shell.navigate('subscription'); return; }
      this.level = Number(b.dataset.lvl);
      const pending = this._filteredList().find(x => !this.solved.has(x.id));
      if (pending) this.loadPuzzle(pending.id);
      else this.loadInfinitePuzzle();
    }));
    this.container.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
      this.filter = b.dataset.f;
      const next = this._filteredList()[0];
      if (next) this.loadPuzzle(next.id);
      else this.loadInfinitePuzzle();
    }));
    this.container.querySelectorAll('[data-pid]').forEach(b => b.addEventListener('click', () => {
      this.loadPuzzle(b.dataset.pid);
    }));
    this.container.querySelector('#pz-hint').addEventListener('click', () => {
      const mv = findLegalMoveByUci(this.engine, this.puzzle.solution[this.stepIdx] || this.puzzle.solution[0]);
      if (mv) this.hintSquares = new Set([`${mv.from.r},${mv.from.c}`]);
      this._setFeedback('task', `💡 Pista: ${this.puzzle.hint || 'Observa la pieza resaltada en amarillo.'}`);
      this._renderBoard();
    });
    this.container.querySelector('#pz-retry').addEventListener('click', () => this._startPuzzleObject(this.puzzle));
    this.container.querySelector('#pz-next').addEventListener('click', () => {
      if (this.puzzle.isInfinite) { this.loadInfinitePuzzle(); return; }
      const items = this._filteredList();
      const idx = items.findIndex(x => x.id === this.puzzle.id);
      if (idx >= 0 && idx + 1 < items.length) this.loadPuzzle(items[idx + 1].id);
      else this.loadInfinitePuzzle();
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
      const matches = this.legal.filter(m =>
        (m.to.r === r && m.to.c === c) || (m.castle && m.from.r === r && m.kingToCol === c)
      );
      if (matches.length > 0) {
        const expUci = this.puzzle.solution[this.stepIdx] || '';
        const expPromo = expUci[4] ? expUci[4].toUpperCase() : 'Q';
        const chosen = matches.find(m => m.promo === expPromo) || matches.find(m => m.promo === 'Q') || matches[0];
        this._checkMove(chosen);
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

  async _findRefutationMove(wrongMove) {
    const legal = this.engine.getLegalMoves(this.engine.turn);
    if (!legal.length) return null;

    if (this.app.stockfish) {
      try {
        const ok = await this.app.stockfish.init();
        if (ok) {
          const res = await this.app.stockfish.evaluatePosition(this.engine, { skill: 20, depth: 7, movetime: 180 });
          if (res?.move) return res.move;
        }
      } catch { /* respaldo local */ }
    }

    const destC = wrongMove.castle ? wrongMove.kingToCol : wrongMove.to.c;
    const captureBlunder = legal.find(m => m.to.r === wrongMove.to.r && m.to.c === destC);
    if (captureBlunder) return captureBlunder;

    let best = legal[0];
    let bestScore = -1;
    for (const m of legal) {
      const sim = this.engine.clone();
      const rec = sim.makeMove(m);
      let s = (rec.captured ? (PIECE_SCORE[rec.captured] || 100) : 0) + (rec.inCheck ? 150 : 0);
      if (sim.status === 'checkmate') s += 9999;
      if (s > bestScore) { bestScore = s; best = m; }
    }
    return best;
  }

  _handleWrongMoveWithRefutation(wrongMove) {
    const token = ++this._runToken;
    const restoreEngine = this.engine.clone();
    const destC = wrongMove.castle ? wrongMove.kingToCol : wrongMove.to.c;

    this.hintSquares.clear();
    this.wrongSqKey = `${wrongMove.to.r},${destC}`;
    this.app.haptics?.pulse('light');
    this._setFeedback('err', '✕ Jugada incorrecta. Observa cómo responde el rival para neutralizarla...');

    this._playAnimatedMove(wrongMove, async () => {
      if (token !== this._runToken) return;
      const refutation = this.engine.status === 'playing' ? await this._findRefutationMove(wrongMove) : null;
      if (token !== this._runToken) return;

      const revert = () => {
        if (token !== this._runToken) return;
        this.engine = restoreEngine;
        this.wrongSqKey = null;
        this.defeatedKingSq = null;
        this.busy = false;
        this._setFeedback('err', '✕ Esa línea falla. Vuelve a calcular tu jugada o pulsa "💡 Pista".');
        this._renderBoard();
      };

      if (refutation) {
        this.busy = true;
        setTimeout(() => {
          if (token !== this._runToken) return;
          const preview = this.engine.clone().makeMove(refutation);
          this._setFeedback('err', `✕ Incorrecto: el rival responde con ${preview.san} y escapa o castiga tu jugada.`);
          this._playAnimatedMove(refutation, () => {
            if (token !== this._runToken) return;
            this.busy = true;
            setTimeout(revert, 1150);
          });
        }, 320);
      } else {
        this.busy = true;
        setTimeout(revert, 950);
      }
    });
  }

  _checkMove(move) {
    const expected = findLegalMoveByUci(this.engine, this.puzzle.solution[this.stepIdx]);
    const simCheck = this.engine.clone();
    simCheck.makeMove(move);
    const deliversMate = simCheck.status === 'checkmate';

    const ok = deliversMate || (expected &&
      move.from.r === expected.from.r && move.from.c === expected.from.c &&
      move.to.r === expected.to.r && move.to.c === expected.to.c &&
      (move.castle || null) === (expected.castle || null));

    this.selected = null;
    this.legal = [];

    if (!ok) {
      this._handleWrongMoveWithRefutation(move);
      return;
    }

    this.wrongSqKey = null;
    this.hintSquares.clear();
    const token = ++this._runToken;

    this._playAnimatedMove(move, () => {
      if (token !== this._runToken) return;
      this.stepIdx++;
      if (deliversMate || this.stepIdx >= this.puzzle.solution.length) {
        this.done = true;
        this._markSolved(this.puzzle.id);
        this._setFeedback('ok', `✓ ¡Resuelto! ${this.puzzle.explanation || 'Combinación ejecutada con precisión.'}`);
        const h2 = this.container?.querySelector('.sec-head h2');
        if (h2) h2.textContent = `🧩 Problemas Tácticos (${this.solved.size} resueltos)`;
        this._renderBoard();
        return;
      }
      setTimeout(() => {
        if (token !== this._runToken) return;
        const replyMove = findLegalMoveByUci(this.engine, this.puzzle.solution[this.stepIdx]);
        if (replyMove) {
          this._playAnimatedMove(replyMove, () => {
            if (token !== this._runToken) return;
            this.stepIdx++;
            this._setFeedback('info', '¡Excelente! Continúa la secuencia ganadora.');
          });
        }
      }, 300);
    });
  }

  _playAnimatedMove(move, onDone) {
    const moverColor = this.engine.turn;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const flipped = this.playerColor === 'b';
    const rec = this.engine.makeMove(move);

    this.busy = true;
    this.hidden.clear();
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
            flipped,
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

    if (rec.castle) {
      const row = rec.from.r;
      this.hidden.add(`${row},${rec.kingToCol}`);
      this.hidden.add(`${row},${rec.rookToCol}`);
      this._renderBoard();
      this.app.sound.playCastle();
      this.fx.animateCastle({
        kingHtml: this.app.pieceRenderer('K', moverColor),
        rookHtml: this.app.pieceRenderer('R', moverColor),
        row,
        kingFrom: rec.from.c,
        kingTo: rec.kingToCol,
        rookFrom: rec.rookFromCol,
        rookTo: rec.rookToCol,
        flipped,
        onComplete: finish
      });
    } else if (rec.captured) {
      this.hidden.add(`${rec.to.r},${rec.to.c}`);
      this._renderBoard();
      this.fx.playCombatSequence({
        pieceType: rec.piece,
        attackerHtml: this.app.pieceRenderer(rec.promo || rec.piece, moverColor),
        victimHtml: this.app.pieceRenderer(rec.captured, enemyColor),
        from: rec.from,
        to: rec.to,
        flipped,
        onCharge: () => this.app.sound.playCharge(rec.piece),
        onImpact: () => this.app.sound.playAttack(rec.piece),
        onComplete: finish
      });
    } else {
      this.hidden.add(`${rec.to.r},${rec.to.c}`);
      this._renderBoard();
      this.app.sound.playMove(rec.piece);
      this.fx.animateRegularMove({
        pieceHtml: this.app.pieceRenderer(rec.promo || rec.piece, moverColor),
        pieceType: rec.piece,
        from: rec.from,
        to: rec.to,
        flipped,
        onComplete: finish
      });
    }
  }

  _renderBoard() {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = '';
    const flipped = this.playerColor === 'b';
    const last = this.engine.history[this.engine.history.length - 1] || null;

    for (let vr = 0; vr < 8; vr++) {
      for (let vc = 0; vc < 8; vc++) {
        const r = flipped ? 7 - vr : vr;
        const c = flipped ? 7 - vc : vc;
        const key = `${r},${c}`;

        const sq = document.createElement('div');
        sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        if (last) {
          const toCol = last.castle ? last.kingToCol : last.to.c;
          if (last.from.r === r && last.from.c === c) sq.classList.add('last-from');
          if (last.to.r === r && toCol === c) sq.classList.add('last-to');
        }
        if (this.selected && this.selected.r === r && this.selected.c === c) sq.classList.add('selected');
        if (this.hintSquares.has(key)) sq.classList.add('hint-sq');
        if (key === this.wrongSqKey) sq.classList.add('pz-wrong-sq');

        const m = this.legal.find(x =>
          (x.to.r === r && x.to.c === c) || (x.castle && x.from.r === r && x.kingToCol === c)
        );
        if (m) {
          const mk = document.createElement('div');
          mk.className = m.captured ? 'capture-ring' : 'move-dot';
          sq.appendChild(mk);
        }

        if (vc === 0) {
          const rk = document.createElement('span');
          rk.className = 'coord-rank';
          rk.textContent = 8 - r;
          sq.appendChild(rk);
        }
        if (vr === 7) {
          const fl = document.createElement('span');
          fl.className = 'coord-file';
          fl.textContent = FILES[c];
          sq.appendChild(fl);
        }

        const piece = this.engine.board[r][c];
        if (piece && !this.hidden.has(key)) {
          const wrap = document.createElement('div');
          wrap.className = 'piece-wrap';
          if (piece.type === 'K' && this.defeatedKingSq && this.defeatedKingSq.r === r && this.defeatedKingSq.c === c) {
            wrap.classList.add('king-defeated');
          }
          wrap.innerHTML = this.app.pieceRenderer(piece.type, piece.color);
          sq.appendChild(wrap);
        }

        if (key === this.wrongSqKey) {
          const badge = document.createElement('span');
          badge.className = 'pz-wrong-x';
          badge.textContent = '✕';
          sq.appendChild(badge);
        }

        sq.addEventListener('click', () => this._onSquareClick(r, c));
        this.gridEl.appendChild(sq);
      }
    }
  }
}
