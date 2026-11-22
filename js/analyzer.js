import { Chess960Engine, PIECE_VALUES, sqName } from './engine.js';
import { ChessAI } from './ai.js';

const VOICE_STORAGE_KEY = 'ajedrez960_coach_voice_v1';

const PIECE_ES = {
  P: 'Peón',
  N: 'Caballo',
  B: 'Alfil',
  R: 'Torre',
  Q: 'Dama',
  K: 'Rey'
};

const PIECE_GEN = {
  P: 'tu Peón',
  N: 'tu Caballo',
  B: 'tu Alfil',
  R: 'tu Torre',
  Q: 'tu Dama',
  K: 'tu Rey'
};

const SAN_PIECE_NAME = {
  C: 'Caballo',
  A: 'Alfil',
  T: 'Torre',
  D: 'Dama',
  R: 'Rey'
};

export const CLASS_META = {
  brilliant:  { code: '!!', label: 'Brillante',    color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.16)' },
  best:       { code: '★',  label: 'Mejor jugada', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.16)' },
  excellent:  { code: '!',  label: 'Excelente',    color: '#4ade80', bg: 'rgba(74, 222, 128, 0.14)' },
  good:       { code: '✓',  label: 'Buena',        color: '#86efac', bg: 'rgba(134, 239, 172, 0.12)' },
  inaccuracy: { code: '?!', label: 'Imprecisión',  color: '#facc15', bg: 'rgba(250, 204, 21, 0.16)' },
  mistake:    { code: '?',  label: 'Error',        color: '#fb923c', bg: 'rgba(251, 146, 60, 0.18)' },
  blunder:    { code: '??', label: 'Error grave',  color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.20)' }
};

/**
 * Convierte notación algebraica en español (ej. Cxf6+, O-O, Dxg2#, e8=D) a frase natural hablada.
 */
function sanToSpanishSpeech(san) {
  if (!san) return '';
  let text = san.trim();
  let suffix = '';

  if (text.endsWith('#')) {
    suffix = ', jaque mate';
    text = text.slice(0, -1);
  } else if (text.endsWith('+')) {
    suffix = ', jaque';
    text = text.slice(0, -1);
  }

  if (text === 'O-O-O') return `enroque largo${suffix}`;
  if (text === 'O-O') return `enroque corto${suffix}`;

  let promoSpeech = '';
  const promoMatch = text.match(/=([CATD])$/);
  if (promoMatch) {
    promoSpeech = ` coronando a ${SAN_PIECE_NAME[promoMatch[1]] || promoMatch[1]}`;
    text = text.replace(/=[CATD]$/, '');
  }

  // Pieza mayor o menor: C, A, T, D, R
  const pieceMatch = text.match(/^([CATDR])([a-h]?[1-8]?)(x?)([a-h][1-8])$/);
  if (pieceMatch) {
    const [, pLetter, disamb, cap, dest] = pieceMatch;
    const pName = SAN_PIECE_NAME[pLetter] || pLetter;
    const fromPart = disamb ? ` de ${disamb}` : '';
    const action = cap ? ' captura en ' : ' a ';
    return `${pName}${fromPart}${action}${dest}${promoSpeech}${suffix}`;
  }

  // Captura de peón: exd5
  const pawnCap = text.match(/^([a-h])x([a-h][1-8])$/);
  if (pawnCap) {
    return `peón de ${pawnCap[1]} captura en ${pawnCap[2]}${promoSpeech}${suffix}`;
  }

  // Avance simple de peón: e4
  const pawnPush = text.match(/^([a-h][1-8])$/);
  if (pawnPush) {
    return `peón a ${pawnPush[1]}${promoSpeech}${suffix}`;
  }

  return `${text}${promoSpeech}${suffix}`;
}

/**
 * Reemplaza jugadas algebraicas incrustadas en un texto para que el narrador las lea con naturalidad.
 */
function humanizeTextForSpeech(rawText) {
  if (!rawText) return '';
  const tokenRegex = /\b(O-O-O|O-O|[CATDR][a-h]?[1-8]?x?[a-h][1-8](?:=[CATD])?[+#]?|[a-h]x[a-h][1-8](?:=[CATD])?[+#]?|[a-h][1-8](?:=[CATD])?[+#]?)\b/g;
  return rawText.replace(tokenRegex, (match) => sanToSpanishSpeech(match));
}

class VoiceCoach {
  constructor() {
    this.supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.enabled = this._loadPref();
    this.voice = null;

    if (this.supported) {
      this._pickSpanishVoice();
      window.speechSynthesis.addEventListener?.('voiceschanged', () => this._pickSpanishVoice());
    }
  }

  _loadPref() {
    try {
      const saved = localStorage.getItem(VOICE_STORAGE_KEY);
      if (saved === 'off') return false;
    } catch {
      // ignorar
    }
    return true;
  }

  _pickSpanishVoice() {
    if (!this.supported) return;
    const voices = window.speechSynthesis.getVoices() || [];
    const esVoices = voices.filter(v => (v.lang || '').toLowerCase().startsWith('es'));
    if (esVoices.length === 0) return;

    // Priorizar voces naturales en español (Google / Microsoft / latinoamérica / España)
    const preferred =
      esVoices.find(v => /google|natural|sabina|paulina|dalia|elena|monica/i.test(v.name)) ||
      esVoices.find(v => /es-(us|mx|ve|do|co|es)/i.test(v.lang)) ||
      esVoices[0];

    this.voice = preferred || null;
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, this.enabled ? 'on' : 'off');
    } catch {
      // ignorar
    }
    if (!this.enabled) this.stop();
    return this.enabled;
  }

  stop() {
    if (!this.supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignorar
    }
  }

  speak(text, force = false) {
    if (!this.supported || (!this.enabled && !force) || !text) return;
    this.stop();

    if (!this.voice) this._pickSpanishVoice();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = this.voice?.lang || 'es-ES';
    if (this.voice) utter.voice = this.voice;
    utter.rate = 1.03;
    utter.pitch = 1.0;

    try {
      window.speechSynthesis.speak(utter);
    } catch {
      // ignorar si el navegador bloquea la reproducción sin gesto previo
    }
  }
}

function ensureAnalyzerStyles() {
  if (document.querySelector('style[data-analyzer-css]')) return;
  const style = document.createElement('style');
  style.dataset.analyzerCss = 'true';
  style.textContent = `
    .an-box {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .an-launch-btn {
      width: 100%;
      padding: 10px 14px;
      font-size: 0.88rem;
      background: linear-gradient(135deg, #10b981, #0284c7);
      color: #ffffff;
      border: none;
      border-radius: 9px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.32);
      transition: filter 0.15s ease, transform 0.1s ease;
    }
    .an-launch-btn:hover { filter: brightness(1.1); }
    .an-launch-btn:active { transform: scale(0.98); }

    .an-progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .an-progress-text {
      font-size: 0.78rem;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
    }
    .an-progress-track {
      height: 8px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.75);
      overflow: hidden;
      border: 1px solid var(--border-color);
    }
    .an-progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #22c55e, #38bdf8);
      transition: width 0.12s linear;
    }

    .an-summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .an-acc-card {
      background: rgba(9, 13, 22, 0.55);
      border: 1px solid var(--border-color);
      border-radius: 9px;
      padding: 8px 10px;
      text-align: center;
    }
    .an-acc-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    .an-acc-val {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .an-counts {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      justify-content: center;
    }
    .an-chip {
      font-size: 0.71rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 999px;
      border: 1px solid transparent;
    }

    .an-eval-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .an-eval-bar {
      flex: 1;
      height: 10px;
      border-radius: 999px;
      background: #1e293b;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }
    .an-eval-white {
      height: 100%;
      width: 50%;
      background: linear-gradient(90deg, #e2e8f0, #f8fafc);
      transition: width 0.25s ease;
    }
    .an-eval-num {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.78rem;
      font-weight: 800;
      min-width: 48px;
      text-align: right;
      color: var(--text-main);
    }

    .an-nav {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .an-nav button {
      background: rgba(15, 23, 42, 0.75);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      border-radius: 7px;
      padding: 6px 0;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
    }
    .an-nav button:hover:not(:disabled) {
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
    }
    .an-nav button:disabled {
      opacity: 0.35;
      cursor: default;
    }

    .an-voice-bar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .an-voice-btn {
      background: rgba(15, 23, 42, 0.75);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      border-radius: 7px;
      padding: 6px 8px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
    }
    .an-voice-btn.active {
      background: rgba(56, 189, 248, 0.16);
      border-color: var(--accent-cyan);
      color: var(--accent-cyan);
    }
    .an-voice-btn:hover {
      border-color: var(--accent-cyan);
    }

    .an-coach {
      background: rgba(9, 13, 22, 0.65);
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--accent-cyan);
      border-radius: 9px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .an-coach-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .an-coach-badge {
      font-size: 0.74rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .an-coach-move {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .an-coach-body {
      font-size: 0.8rem;
      line-height: 1.48;
      color: var(--text-main);
    }
    .an-coach-best {
      font-size: 0.76rem;
      color: #4ade80;
      font-weight: 600;
    }

    .an-exit-btn {
      width: 100%;
      padding: 6px 10px;
      font-size: 0.77rem;
    }

    .move-cell {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 5px;
      border-radius: 5px;
    }
    .move-cell.clickable { cursor: pointer; }
    .move-cell.clickable:hover { background: rgba(148, 163, 184, 0.16); }
    .move-cell.review-active {
      background: rgba(56, 189, 248, 0.25);
      outline: 1px solid var(--accent-cyan);
    }
    .move-tag {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 0 4px;
      border-radius: 4px;
    }
  `;
  document.head.appendChild(style);
}

function sameMove(a, b) {
  if (!a || !b) return false;
  return (
    a.from.r === b.from.r &&
    a.from.c === b.from.c &&
    a.to.r === b.to.r &&
    a.to.c === b.to.c &&
    (a.promo || null) === (b.promo || null) &&
    (a.castle || null) === (b.castle || null)
  );
}

function normalizeEval(rawScore) {
  if (rawScore > 90000) return 1000;
  if (rawScore < -90000) return -1000;
  return Math.max(-1000, Math.min(1000, rawScore));
}

function formatEval(rawScore) {
  if (rawScore > 90000) return '+M';
  if (rawScore < -90000) return '-M';
  const pawns = rawScore / 100;
  const sign = pawns > 0 ? '+' : '';
  return `${sign}${pawns.toFixed(1)}`;
}

function evalToWhitePercent(rawScore) {
  if (rawScore > 90000) return 98;
  if (rawScore < -90000) return 2;
  const clamped = Math.max(-800, Math.min(800, rawScore));
  return Math.round(50 + (clamped / 800) * 46);
}

function calcAccuracy(losses) {
  if (losses.length === 0) return 100;
  const avg = losses.reduce((a, b) => a + b, 0) / losses.length;
  const acc = 103.1668 * Math.exp(-0.0042 * avg) - 3.1668;
  return Math.max(5, Math.min(100, Math.round(acc)));
}

function isCenterSquare(r, c) {
  return (r === 3 || r === 4) && (c === 3 || c === 4);
}

function moveDestCol(m) {
  return m.castle ? m.kingToCol : m.to.c;
}

export class GameAnalyzer {
  constructor({ postgameSlotEl, modalActionsEl, onReviewStep, onExitReview, onAnalysisReady }) {
    ensureAnalyzerStyles();
    this.postgameSlotEl = postgameSlotEl;
    this.modalActionsEl = modalActionsEl;
    this.onReviewStep = onReviewStep;
    this.onExitReview = onExitReview;
    this.onAnalysisReady = onAnalysisReady;

    this.ai = new ChessAI();
    this.voice = new VoiceCoach();
    this.reset();
    this._bindKeyboard();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.inReview) return;
      if (e.target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.goToPly(this.currentPly - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.goToPly(this.currentPly + 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.goToPly(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.goToPly(this.results.length);
      }
    });
  }

  reset() {
    this._runToken = (this._runToken || 0) + 1;
    this.voice?.stop();
    this.analyzing = false;
    this.inReview = false;
    this.positionId = null;
    this.frames = [];
    this.results = [];
    this.summary = null;
    this.currentPly = 0;

    if (this.postgameSlotEl) this.postgameSlotEl.innerHTML = '';
    this._removeModalButton();
  }

  _removeModalButton() {
    if (!this.modalActionsEl) return;
    const old = this.modalActionsEl.querySelector('[data-an-modal-btn]');
    if (old) old.remove();
  }

  onGameOver(engine) {
    this.reset();
    if (!engine || engine.history.length === 0) return;

    this._sourceEngine = engine;

    if (this.modalActionsEl) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.dataset.anModalBtn = 'true';
      btn.style.background = 'linear-gradient(135deg, #10b981, #0284c7)';
      btn.textContent = '📊 Analizar Partida';
      btn.addEventListener('click', () => {
        const modal = document.getElementById('gameover-modal');
        if (modal) modal.classList.add('hidden');
        this.startAnalysis(engine);
      });
      this.modalActionsEl.prepend(btn);
    }

    if (this.postgameSlotEl) {
      this.postgameSlotEl.innerHTML = `
        <div class="an-box">
          <button class="an-launch-btn" id="an-launch-panel">📊 Analizar Partida (con Voz)</button>
        </div>
      `;
      this.postgameSlotEl.querySelector('#an-launch-panel')?.addEventListener('click', () => {
        this.startAnalysis(engine);
      });
    }
  }

  async startAnalysis(engine) {
    if (!engine || engine.history.length === 0) return;
    const token = ++this._runToken;
    this.voice.stop();
    this.analyzing = true;
    this.inReview = false;
    this.positionId = engine.positionId;

    const history = engine.history.map(h => ({ ...h }));
    const total = history.length;

    const sim = new Chess960Engine(engine.positionId);
    this.frames = [{ engine: sim.clone(), lastMove: null }];
    this.results = [];

    this._renderProgress(0, total);

    const wLosses = [];
    const bLosses = [];
    const counts = {
      brilliant: 0,
      best: 0,
      excellent: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0
    };

    for (let i = 0; i < total; i++) {
      if (token !== this._runToken) return;

      const beforeEngine = sim.clone();
      const played = history[i];
      const analysis = this._analyzeSinglePly(beforeEngine, played);

      sim.makeMove(played);
      this.frames.push({ engine: sim.clone(), lastMove: played });
      this.results.push(analysis);

      counts[analysis.classification]++;
      if (played.color === 'w') wLosses.push(analysis.cpLoss);
      else bLosses.push(analysis.cpLoss);

      this._renderProgress(i + 1, total);
      await new Promise(resolve => setTimeout(resolve, 12));
    }

    if (token !== this._runToken) return;

    this.analyzing = false;
    this.summary = {
      whiteAcc: calcAccuracy(wLosses),
      blackAcc: calcAccuracy(bLosses),
      counts
    };

    if (this.onAnalysisReady) {
      this.onAnalysisReady(this.results);
    }

    this.inReview = true;
    this.goToPly(1);
  }

  _analyzeSinglePly(beforeEngine, played) {
    const color = beforeEngine.turn;
    const enemy = color === 'w' ? 'b' : 'w';
    const maximizing = color === 'w';
    const legalMoves = beforeEngine.getLegalMoves(color);

    const scored = [];
    let bestMove = legalMoves[0] || played;
    let bestRaw = maximizing ? -Infinity : Infinity;
    let playedRaw = null;

    const ordered = [...legalMoves].sort((a, b) => {
      const sa = (a.captured ? PIECE_VALUES[a.captured] * 10 - PIECE_VALUES[a.piece] : 0) + (a.promo ? 800 : 0);
      const sb = (b.captured ? PIECE_VALUES[b.captured] * 10 - PIECE_VALUES[b.piece] : 0) + (b.promo ? 800 : 0);
      return sb - sa;
    });

    let alpha = -Infinity;
    let beta = Infinity;

    for (const m of ordered) {
      const next = beforeEngine.clone();
      next.makeMove(m);

      const isPlayed = sameMove(m, played);
      const val = isPlayed
        ? this.ai._minimax(next, 1, -Infinity, Infinity, !maximizing, 1)
        : this.ai._minimax(next, 1, alpha, beta, !maximizing, 1);

      scored.push({ move: m, val });
      if (isPlayed) playedRaw = val;

      if (maximizing) {
        if (val > bestRaw) { bestRaw = val; bestMove = m; }
        if (val > alpha) alpha = val;
      } else {
        if (val < bestRaw) { bestRaw = val; bestMove = m; }
        if (val < beta) beta = val;
      }
    }

    if (playedRaw === null) {
      const simPlayed = beforeEngine.clone();
      simPlayed.makeMove(played);
      playedRaw = this.ai._minimax(simPlayed, 1, -Infinity, Infinity, !maximizing, 1);
    }

    const bestSim = beforeEngine.clone();
    const bestRecord = bestSim.makeMove(bestMove);
    const bestSan = bestRecord.san;

    const bestNorm = normalizeEval(bestRaw);
    const playedNorm = normalizeEval(playedRaw);
    const rawDiff = maximizing ? (bestNorm - playedNorm) : (playedNorm - bestNorm);
    const cpLoss = Math.max(0, Math.round(rawDiff));

    const afterPlayed = beforeEngine.clone();
    afterPlayed.makeMove(played);

    const isExactBest = sameMove(played, bestMove);
    const missedMate = (maximizing ? bestRaw > 90000 : bestRaw < -90000) && !(maximizing ? playedRaw > 90000 : playedRaw < -90000);
    const allowedMate = (maximizing ? playedRaw < -90000 : playedRaw > 90000) && !(maximizing ? bestRaw < -90000 : bestRaw > 90000);

    const destR = played.to.r;
    const destC = moveDestCol(played);
    const destAttacked = !played.castle && afterPlayed.isSquareAttacked(destR, destC, enemy);
    const secondBestGap = this._secondBestGap(scored, maximizing);
    const looksLikeSacrifice =
      destAttacked &&
      played.piece !== 'P' &&
      played.piece !== 'K' &&
      (!played.captured || PIECE_VALUES[played.piece] > PIECE_VALUES[played.captured]) &&
      (maximizing ? playedRaw >= 80 : playedRaw <= -80);

    let classification = 'good';
    if (allowedMate || missedMate || cpLoss > 280) {
      classification = 'blunder';
    } else if (cpLoss > 130) {
      classification = 'mistake';
    } else if (cpLoss > 60) {
      classification = 'inaccuracy';
    } else if (cpLoss <= 12 && (looksLikeSacrifice || (isExactBest && secondBestGap >= 220 && legalMoves.length >= 4))) {
      classification = 'brilliant';
    } else if (isExactBest || cpLoss <= 10) {
      classification = 'best';
    } else if (cpLoss <= 28) {
      classification = 'excellent';
    } else {
      classification = 'good';
    }

    const comment = this._buildCoachComment({
      classification,
      beforeEngine,
      afterPlayed,
      played,
      bestMove,
      bestSan,
      bestRecord,
      cpLoss,
      missedMate,
      allowedMate,
      isExactBest,
      looksLikeSacrifice
    });

    return {
      played,
      bestMove,
      bestSan,
      classification,
      cpLoss,
      evalAfter: playedRaw,
      evalBest: bestRaw,
      isExactBest,
      comment
    };
  }

  _secondBestGap(scored, maximizing) {
    if (scored.length < 2) return 0;
    const sorted = [...scored].sort((a, b) => (maximizing ? b.val - a.val : a.val - b.val));
    const v1 = normalizeEval(sorted[0].val);
    const v2 = normalizeEval(sorted[1].val);
    return Math.abs(v1 - v2);
  }

  _buildCoachComment({
    classification,
    beforeEngine,
    afterPlayed,
    played,
    bestMove,
    bestSan,
    bestRecord,
    cpLoss,
    missedMate,
    allowedMate,
    isExactBest,
    looksLikeSacrifice
  }) {
    const color = played.color;
    const enemy = color === 'w' ? 'b' : 'w';
    const destSq = sqName(played.to.r, moveDestCol(played));
    const pieceName = PIECE_GEN[played.piece] || 'tu pieza';

    const whyBest = () => {
      if (bestRecord.san.endsWith('#')) return 'da jaque mate inmediato y cierra la partida';
      if (bestMove.castle) return 'resguarda al Rey de forma segura y conecta las Torres';
      if (bestMove.promo) return `corona el Peón a ${PIECE_ES[bestMove.promo]} ganando ventaja decisiva`;
      if (bestRecord.captured) {
        const capVal = PIECE_VALUES[bestRecord.captured] || 100;
        const atkVal = PIECE_VALUES[bestMove.piece] || 100;
        if (capVal > atkVal) return `captura un ${PIECE_ES[bestRecord.captured]} enemigo ganando material limpio`;
        return `elimina el ${PIECE_ES[bestRecord.captured]} en ${sqName(bestMove.to.r, bestMove.to.c)} y mejora tu iniciativa`;
      }
      if (bestRecord.inCheck) return 'da jaque y obliga al rival a defenderse, manteniendo la iniciativa';
      const movedFromAttacked = beforeEngine.isSquareAttacked(bestMove.from.r, bestMove.from.c, enemy);
      if (movedFromAttacked && bestMove.piece !== 'P') {
        return `ponía a salvo tu ${PIECE_ES[bestMove.piece]} que estaba bajo ataque`;
      }
      if (isCenterSquare(bestMove.to.r, moveDestCol(bestMove))) {
        return `toma el control directo del centro en ${sqName(bestMove.to.r, moveDestCol(bestMove))}`;
      }
      if (bestMove.piece === 'N' || bestMove.piece === 'B') {
        return `activa tu ${PIECE_ES[bestMove.piece]} hacia una casilla mucho más agresiva`;
      }
      return 'mantiene mejor coordinación de piezas y evita debilidades tácticas';
    };

    if (played.san.endsWith('#')) {
      return `¡Remate impecable! ${played.san} sella el jaque mate sin escapatoria posible.`;
    }

    if (classification === 'blunder' || classification === 'mistake' || classification === 'inaccuracy') {
      if (allowedMate) {
        return `Error crítico: ${played.san} deja a tu Rey expuesto a jaque mate forzado. Yo habría jugado ${bestSan}, porque ${whyBest()}.`;
      }
      if (missedMate) {
        return `Dejaste escapar una victoria inmediata. En lugar de ${played.san}, yo habría jugado ${bestSan}, que ${whyBest()}.`;
      }

      const destR = played.to.r;
      const destC = moveDestCol(played);
      const hungMovedPiece =
        !played.castle &&
        afterPlayed.isSquareAttacked(destR, destC, enemy) &&
        !afterPlayed.isSquareAttacked(destR, destC, color);

      if (hungMovedPiece && played.piece !== 'K') {
        return `Con ${played.san} dejaste ${pieceName} sin defensa en ${destSq}, donde el rival puede capturarlo gratis. Yo habría jugado ${bestSan}, ya que ${whyBest()}.`;
      }

      if (bestRecord.captured && !played.captured) {
        return `Pasaste por alto una captura táctica importante. En vez de ${played.san}, yo jugaría ${bestSan}, porque ${whyBest()}.`;
      }

      if (classification === 'inaccuracy') {
        return `${played.san} es jugable, pero cede algo de ventaja (${(cpLoss / 100).toFixed(1)} peones). Yo preferiría ${bestSan}, porque ${whyBest()}.`;
      }

      return `${played.san} debilita seriamente tu posición y permite un contragolpe rival. Yo habría hecho ${bestSan}, ya que ${whyBest()}.`;
    }

    if (classification === 'brilliant') {
      if (looksLikeSacrifice) {
        return `¡Golpe táctico brillante! Con ${played.san} sacrificas o expones ${pieceName} en ${destSq} con cálculo exacto, obligando al rival a quedar en desventaja.`;
      }
      return `¡Jugada brillante! ${played.san} era la única línea ganadora en una posición muy aguda y mantiene el dominio total.`;
    }

    if (played.castle) {
      return `Muy buena decisión con ${played.san}: proteges al Rey y activas la Torre rápidamente, clave en Ajedrez 960.`;
    }
    if (played.promo) {
      return `Gran avance: coronar con ${played.san} convierte tu ventaja en material decisivo.`;
    }
    if (played.captured) {
      return `${isExactBest ? 'La mejor continuación' : 'Sólida captura'}: ${played.san} elimina un ${PIECE_ES[played.captured]} enemigo${played.inCheck ? ' con jaque' : ''} y mantiene la presión.`;
    }
    if (played.inCheck) {
      return `Buen golpe táctico: ${played.san} da jaque, limita las opciones del rival y te permite dictar el ritmo.`;
    }
    if (isExactBest) {
      return `Precisión máxima: ${played.san} es exactamente la jugada que elegiría el motor porque ${whyBest()}.`;
    }
    if (classification === 'excellent') {
      return `Excelente elección: ${played.san} mantiene la iniciativa y la solidez de tu estructura. Como alternativa muy pareja, también funcionaba ${bestSan}.`;
    }
    return `Jugada correcta y consistente: ${played.san} sostiene bien la posición. Otra opción ligeramente más activa era ${bestSan}, que ${whyBest()}.`;
  }

  _speakCurrentPly(force = false) {
    if (!this.inReview) return;
    if (this.currentPly <= 0) {
      if (force && this.summary) {
        this.voice.speak(
          `Posición inicial número ${this.positionId}. Precisión de Blancas: ${this.summary.whiteAcc} por ciento. Precisión de Negras: ${this.summary.blackAcc} por ciento.`,
          true
        );
      } else {
        this.voice.stop();
      }
      return;
    }

    const item = this.results[this.currentPly - 1];
    if (!item) return;

    const meta = CLASS_META[item.classification];
    const moveNum = Math.floor((this.currentPly - 1) / 2) + 1;
    const side = item.played.color === 'w' ? 'Blancas' : 'Negras';
    const spokenMove = sanToSpanishSpeech(item.played.san);
    const spokenComment = humanizeTextForSpeech(item.comment);

    const script = `Jugada ${moveNum}, ${side}: ${spokenMove}. ${meta.label}. ${spokenComment}`;
    this.voice.speak(script, force);
  }

  _renderProgress(done, total) {
    if (!this.postgameSlotEl) return;
    const pct = Math.round((done / Math.max(1, total)) * 100);
    this.postgameSlotEl.innerHTML = `
      <div class="an-box">
        <div class="an-progress-wrap">
          <div class="an-progress-text">
            <span>Analizando partida...</span>
            <strong>${done} / ${total} (${pct}%)</strong>
          </div>
          <div class="an-progress-track">
            <div class="an-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
    `;
  }

  goToPly(ply) {
    if (!this.frames.length) return;
    const clamped = Math.max(0, Math.min(this.frames.length - 1, ply));
    this.currentPly = clamped;
    this.inReview = true;

    this._renderReviewPanel();
    this._speakCurrentPly(false);

    if (this.onReviewStep) {
      this.onReviewStep({
        ply: clamped,
        engine: this.frames[clamped].engine,
        lastMove: this.frames[clamped].lastMove,
        analysis: clamped > 0 ? this.results[clamped - 1] : null
      });
    }
  }

  exitReview() {
    this.voice.stop();
    this.inReview = false;
    if (this.onExitReview) this.onExitReview();
    if (this._sourceEngine) {
      this.onGameOver(this._sourceEngine);
    }
  }

  _renderReviewPanel() {
    if (!this.postgameSlotEl || !this.summary) return;
    const { whiteAcc, blackAcc, counts } = this.summary;
    const ply = this.currentPly;
    const total = this.results.length;
    const item = ply > 0 ? this.results[ply - 1] : null;

    const evalScore = item ? item.evalAfter : 0;
    const evalPct = evalToWhitePercent(evalScore);
    const evalLabel = formatEval(evalScore);

    const chips = [
      { key: 'brilliant', count: counts.brilliant },
      { key: 'best', count: counts.best },
      { key: 'inaccuracy', count: counts.inaccuracy },
      { key: 'mistake', count: counts.mistake },
      { key: 'blunder', count: counts.blunder }
    ]
      .filter(c => c.count > 0)
      .map(c => {
        const m = CLASS_META[c.key];
        return `<span class="an-chip" style="color:${m.color};background:${m.bg};border-color:${m.color}44">${m.code} ${c.count}</span>`;
      })
      .join('');

    let coachHtml = '';
    if (!item) {
      coachHtml = `
        <div class="an-coach" style="border-left-color:var(--accent-cyan)">
          <div class="an-coach-head">
            <span class="an-coach-badge" style="color:var(--accent-cyan);background:rgba(56,189,248,0.16)">INICIO #${this.positionId}</span>
            <span class="an-coach-move">Posición inicial</span>
          </div>
          <div class="an-coach-body">Usa las flechas ◀ ▶ (o haz clic en cualquier jugada del historial) para escuchar y leer el análisis completo.</div>
        </div>
      `;
    } else {
      const meta = CLASS_META[item.classification];
      const moveNum = Math.floor((ply - 1) / 2) + 1;
      const sideText = item.played.color === 'w' ? 'Blancas' : 'Negras';
      const showBest = !item.isExactBest && ['inaccuracy', 'mistake', 'blunder'].includes(item.classification);

      coachHtml = `
        <div class="an-coach" style="border-left-color:${meta.color}">
          <div class="an-coach-head">
            <span class="an-coach-badge" style="color:${meta.color};background:${meta.bg}">${meta.code} ${meta.label}</span>
            <span class="an-coach-move">${moveNum}. ${sideText}: ${item.played.san}</span>
          </div>
          <div class="an-coach-body">${item.comment}</div>
          ${showBest ? `<div class="an-coach-best">💡 Mejor jugada sugerida: ${item.bestSan} (flecha verde en el tablero)</div>` : ''}
        </div>
      `;
    }

    const voiceOn = this.voice.enabled;
    const voiceControls = this.voice.supported
      ? `
        <div class="an-voice-bar">
          <button id="an-voice-toggle" class="an-voice-btn ${voiceOn ? 'active' : ''}">
            ${voiceOn ? '🔊 Voz: ON' : '🔇 Voz: OFF'}
          </button>
          <button id="an-voice-replay" class="an-voice-btn">🗣 Repetir Voz</button>
        </div>
      `
      : '';

    this.postgameSlotEl.innerHTML = `
      <div class="an-box">
        <div class="an-summary-grid">
          <div class="an-acc-card">
            <div class="an-acc-label">Precisión Blancas</div>
            <div class="an-acc-val">${whiteAcc}%</div>
          </div>
          <div class="an-acc-card">
            <div class="an-acc-label">Precisión Negras</div>
            <div class="an-acc-val">${blackAcc}%</div>
          </div>
        </div>

        <div class="an-counts">${chips}</div>

        <div class="an-eval-wrap" title="Evaluación de la posición (+ favorece Blancas)">
          <div class="an-eval-bar"><div class="an-eval-white" style="width:${evalPct}%"></div></div>
          <span class="an-eval-num">${evalLabel}</span>
        </div>

        <div class="an-nav">
          <button id="an-first" ${ply === 0 ? 'disabled' : ''} title="Inicio">⏮</button>
          <button id="an-prev" ${ply === 0 ? 'disabled' : ''} title="Jugada anterior">◀</button>
          <button id="an-next" ${ply === total ? 'disabled' : ''} title="Siguiente jugada">▶</button>
          <button id="an-last" ${ply === total ? 'disabled' : ''} title="Final">⏭</button>
        </div>

        ${voiceControls}
        ${coachHtml}

        <button class="btn btn-ghost an-exit-btn" id="an-exit">Cerrar Revisión</button>
      </div>
    `;

    this.postgameSlotEl.querySelector('#an-first')?.addEventListener('click', () => this.goToPly(0));
    this.postgameSlotEl.querySelector('#an-prev')?.addEventListener('click', () => this.goToPly(ply - 1));
    this.postgameSlotEl.querySelector('#an-next')?.addEventListener('click', () => this.goToPly(ply + 1));
    this.postgameSlotEl.querySelector('#an-last')?.addEventListener('click', () => this.goToPly(total));
    this.postgameSlotEl.querySelector('#an-exit')?.addEventListener('click', () => this.exitReview());

    this.postgameSlotEl.querySelector('#an-voice-toggle')?.addEventListener('click', () => {
      const active = this.voice.toggle();
      this._renderReviewPanel();
      if (active) this._speakCurrentPly(false);
    });
    this.postgameSlotEl.querySelector('#an-voice-replay')?.addEventListener('click', () => {
      this._speakCurrentPly(true);
    });
  }

  renderBoardOverlay(svg, flipped) {
    if (!svg || !this.inReview) return;
    svg.innerHTML = '';
    if (this.currentPly <= 0) return;

    const item = this.results[this.currentPly - 1];
    if (!item) return;

    const ns = 'http://www.w3.org/2000/svg';
    const meta = CLASS_META[item.classification];

    const toCenter = (r, c) => {
      const vr = flipped ? 7 - r : r;
      const vc = flipped ? 7 - c : c;
      return { x: vc * 100 + 50, y: vr * 100 + 50, vr, vc };
    };

    const drawArrow = (fromR, fromC, toR, toC, color, opacity = 0.85) => {
      const p1 = toCenter(fromR, fromC);
      const p2 = toCenter(toR, toC);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      if (len < 10) return;

      const ux = dx / len;
      const uy = dy / len;
      const sx = p1.x + ux * 18;
      const sy = p1.y + uy * 18;
      const ex = p2.x - ux * 26;
      const ey = p2.y - uy * 26;

      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', sx);
      line.setAttribute('y1', sy);
      line.setAttribute('x2', ex);
      line.setAttribute('y2', ey);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '14');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('opacity', String(opacity));
      svg.appendChild(line);

      const tipX = p2.x - ux * 6;
      const tipY = p2.y - uy * 6;
      const baseX = p2.x - ux * 32;
      const baseY = p2.y - uy * 32;
      const px = -uy * 16;
      const py = ux * 16;

      const head = document.createElementNS(ns, 'polygon');
      head.setAttribute('points', `${tipX},${tipY} ${baseX + px},${baseY + py} ${baseX - px},${baseY - py}`);
      head.setAttribute('fill', color);
      head.setAttribute('opacity', String(opacity));
      svg.appendChild(head);
    };

    if (!item.isExactBest && ['inaccuracy', 'mistake', 'blunder'].includes(item.classification)) {
      const bDestC = moveDestCol(item.bestMove);
      const bVisualC = (item.bestMove.castle && bDestC === item.bestMove.from.c)
        ? item.bestMove.rookFromCol
        : bDestC;
      drawArrow(item.bestMove.from.r, item.bestMove.from.c, item.bestMove.to.r, bVisualC, '#22c55e', 0.86);
    }

    const pDest = toCenter(item.played.to.r, moveDestCol(item.played));
    const bx = pDest.vc * 100 + 82;
    const by = pDest.vr * 100 + 18;

    const badgeBg = document.createElementNS(ns, 'circle');
    badgeBg.setAttribute('cx', bx);
    badgeBg.setAttribute('cy', by);
    badgeBg.setAttribute('r', '17');
    badgeBg.setAttribute('fill', meta.color);
    badgeBg.setAttribute('stroke', '#090d16');
    badgeBg.setAttribute('stroke-width', '3');
    svg.appendChild(badgeBg);

    const badgeTxt = document.createElementNS(ns, 'text');
    badgeTxt.setAttribute('x', bx);
    badgeTxt.setAttribute('y', by + 5);
    badgeTxt.setAttribute('text-anchor', 'middle');
    badgeTxt.setAttribute('fill', '#090d16');
    badgeTxt.setAttribute('font-size', item.classification === 'brilliant' || item.classification === 'blunder' ? '15' : '16');
    badgeTxt.setAttribute('font-weight', '900');
    badgeTxt.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    badgeTxt.textContent = meta.code;
    svg.appendChild(badgeTxt);
  }
}
