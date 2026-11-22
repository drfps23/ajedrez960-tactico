import { Chess960Engine, PIECE_VALUES, sqName } from './engine.js';
import { ChessAI } from './ai.js';

const VOICE_STORAGE_KEY = 'ajedrez960_coach_voice_v1';
const VOICE_NAME_KEY = 'ajedrez960_coach_voice_name_v1';

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

const FILE_PHONETIC = {
  a: 'a',
  b: 'be',
  c: 'ce',
  d: 'de',
  e: 'e',
  f: 'efe',
  g: 'ge',
  h: 'hache'
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

function squareToSpeech(sq) {
  if (!sq || sq.length !== 2) return sq || '';
  const f = FILE_PHONETIC[sq[0]] || sq[0];
  return `${f} ${sq[1]}`;
}

/**
 * Convierte notación algebraica a formato conciso de comentarista en español:
 * De4 -> "Dama e 4" | Cxf6+ -> "Caballo por efe 6, jaque" | O-O -> "enroque corto"
 */
function sanToSpanishSpeech(san, { includeMateSuffix = true } = {}) {
  if (!san) return '';
  let text = san.trim();
  let suffix = '';

  if (text.endsWith('#')) {
    if (includeMateSuffix) suffix = ', jaque mate';
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
    promoSpeech = ` corona ${SAN_PIECE_NAME[promoMatch[1]] || promoMatch[1]}`;
    text = text.replace(/=[CATD]$/, '');
  }

  const pieceMatch = text.match(/^([CATDR])([a-h]?[1-8]?)(x?)([a-h][1-8])$/);
  if (pieceMatch) {
    const [, pLetter, disamb, cap, dest] = pieceMatch;
    const pName = SAN_PIECE_NAME[pLetter] || pLetter;
    let fromPart = '';
    if (disamb) {
      fromPart = disamb.length === 2
        ? ` de ${squareToSpeech(disamb)}`
        : ` de ${FILE_PHONETIC[disamb] || disamb}`;
    }
    const connector = cap ? ' por ' : ' ';
    return `${pName}${fromPart}${connector}${squareToSpeech(dest)}${promoSpeech}${suffix}`;
  }

  const pawnCap = text.match(/^([a-h])x([a-h][1-8])$/);
  if (pawnCap) {
    const fileSpoken = FILE_PHONETIC[pawnCap[1]] || pawnCap[1];
    return `${fileSpoken} por ${squareToSpeech(pawnCap[2])}${promoSpeech}${suffix}`;
  }

  const pawnPush = text.match(/^([a-h][1-8])$/);
  if (pawnPush) {
    return `${squareToSpeech(pawnPush[1])}${promoSpeech}${suffix}`;
  }

  return `${text}${promoSpeech}${suffix}`;
}

function humanizeTextForSpeech(rawText) {
  if (!rawText) return '';
  const tokenRegex = /\b(O-O-O|O-O|[CATDR][a-h]?[1-8]?x?[a-h][1-8](?:=[CATD])?[+#]?|[a-h]x[a-h][1-8](?:=[CATD])?[+#]?|[a-h][1-8](?:=[CATD])?[+#]?)\b/g;
  return rawText
    .replace(tokenRegex, (match) => sanToSpanishSpeech(match))
    .replace(/(\d+)\.(\d+)/g, '$1,$2')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreSpanishVoice(v) {
  const name = (v.name || '').toLowerCase();
  const lang = (v.lang || '').toLowerCase();
  let score = 0;

  if (name.includes('natural') || name.includes('online')) score += 120;
  if (name.includes('google')) score += 95;
  if (name.includes('neural') || name.includes('siri') || name.includes('enhanced') || name.includes('premium')) score += 85;
  if (/dalia|elena|alvaro|álvaro|jorge|paulina|sabina|salome|salomé|monica|mónica|camila|mia|paloma/.test(name)) score += 35;
  if (/^es-(mx|co|us|ve|do|419|ar|pe)/.test(lang)) score += 22;
  else if (lang === 'es-es') score += 18;
  if (/espeak|compact|robot/.test(name)) score -= 60;
  return score;
}

class VoiceCoach {
  constructor(onVoicesReady) {
    this.supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.onVoicesReady = onVoicesReady;
    this.enabled = this._loadEnabledPref();
    this.savedVoiceName = this._loadVoiceName();
    this.spanishVoices = [];
    this.voice = null;
    this._speakTimer = null;

    if (this.supported) {
      this._refreshVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged', () => {
        this._refreshVoices();
        if (this.onVoicesReady) this.onVoicesReady();
      });
    }
  }

  _loadEnabledPref() {
    try {
      if (localStorage.getItem(VOICE_STORAGE_KEY) === 'off') return false;
    } catch { /* ignorar */ }
    return true;
  }

  _loadVoiceName() {
    try {
      return localStorage.getItem(VOICE_NAME_KEY) || '';
    } catch {
      return '';
    }
  }

  _refreshVoices() {
    if (!this.supported) return;
    const all = window.speechSynthesis.getVoices() || [];
    const es = all.filter(v => (v.lang || '').toLowerCase().startsWith('es'));
    es.sort((a, b) => scoreSpanishVoice(b) - scoreSpanishVoice(a));
    this.spanishVoices = es;

    if (this.savedVoiceName) {
      const exact = es.find(v => v.name === this.savedVoiceName);
      if (exact) {
        this.voice = exact;
        return;
      }
    }
    this.voice = es[0] || null;
  }

  selectVoiceByName(name) {
    const found = this.spanishVoices.find(v => v.name === name);
    if (!found) return;
    this.voice = found;
    this.savedVoiceName = found.name;
    try {
      localStorage.setItem(VOICE_NAME_KEY, found.name);
    } catch { /* ignorar */ }
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, this.enabled ? 'on' : 'off');
    } catch { /* ignorar */ }
    if (!this.enabled) this.stop();
    return this.enabled;
  }

  stop() {
    if (this._speakTimer) {
      clearTimeout(this._speakTimer);
      this._speakTimer = null;
    }
    if (!this.supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch { /* ignorar */ }
  }

  speak(text, force = false) {
    if (!this.supported || (!this.enabled && !force) || !text) return;
    this.stop();

    if (!this.voice) this._refreshVoices();

    this._speakTimer = setTimeout(() => {
      this._speakTimer = null;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = this.voice?.lang || 'es-ES';
      if (this.voice) utter.voice = this.voice;

      const isNeural = /natural|online|google|neural/i.test(this.voice?.name || '');
      utter.rate = isNeural ? 1.04 : 1.05;
      utter.pitch = 1.0;

      try {
        window.speechSynthesis.speak(utter);
      } catch { /* ignorar */ }
    }, 45);
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
    .an-voice-btn:hover { border-color: var(--accent-cyan); }
    .an-voice-select {
      width: 100%;
      background: rgba(9, 13, 22, 0.72);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      border-radius: 7px;
      padding: 5px 8px;
      font-size: 0.73rem;
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
  constructor({ postgameSlotEl, modalActionsEl, deferVoice = true, onReviewStep, onExitReview, onAnalysisReady }) {
    ensureAnalyzerStyles();
    this.postgameSlotEl = postgameSlotEl;
    this.modalActionsEl = modalActionsEl;
    this.deferVoice = deferVoice;
    this.onReviewStep = onReviewStep;
    this.onExitReview = onExitReview;
    this.onAnalysisReady = onAnalysisReady;

    this.ai = new ChessAI();
    this.voice = new VoiceCoach(() => {
      if (this.inReview) this._renderReviewPanel();
    });
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
          <button class="an-launch-btn" id="an-launch-panel">📊 Analizar Partida (con Voz y Animaciones)</button>
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

  /**
   * Análisis directo y sin redundancias: no repite la clasificación ni la jugada realizada.
   */
  _buildCoachComment({
    classification,
    beforeEngine,
    afterPlayed,
    played,
    bestMove,
    bestSan,
    bestRecord,
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
      if (bestRecord.san.endsWith('#')) return 'da jaque mate inmediato';
      if (bestMove.castle) return 'resguarda al Rey y conecta las Torres';
      if (bestMove.promo) return `corona a ${PIECE_ES[bestMove.promo]} con ventaja decisiva`;
      if (bestRecord.captured) {
        const capVal = PIECE_VALUES[bestRecord.captured] || 100;
        const atkVal = PIECE_VALUES[bestMove.piece] || 100;
        if (capVal > atkVal) return `gana un ${PIECE_ES[bestRecord.captured]} limpio`;
        return `elimina el ${PIECE_ES[bestRecord.captured]} rival y mejora la iniciativa`;
      }
      if (bestRecord.inCheck) return 'da jaque y mantiene la iniciativa';
      const movedFromAttacked = beforeEngine.isSquareAttacked(bestMove.from.r, bestMove.from.c, enemy);
      if (movedFromAttacked && bestMove.piece !== 'P') {
        return `pone a salvo tu ${PIECE_ES[bestMove.piece]}`;
      }
      if (isCenterSquare(bestMove.to.r, moveDestCol(bestMove))) {
        return 'toma el control directo del centro';
      }
      if (bestMove.piece === 'N' || bestMove.piece === 'B') {
        return `activa tu ${PIECE_ES[bestMove.piece]} hacia una casilla más agresiva`;
      }
      return 'mantiene mejor coordinación sin dejar debilidades';
    };

    if (played.san.endsWith('#')) {
      return 'Remate impecable, sin escapatoria para el Rey.';
    }

    if (classification === 'blunder' || classification === 'mistake' || classification === 'inaccuracy') {
      if (allowedMate) {
        return `Deja a tu Rey expuesto a jaque mate forzado. Mejor era ${bestSan}, porque ${whyBest()}.`;
      }
      if (missedMate) {
        return `Dejas escapar una victoria inmediata. Mejor era ${bestSan}, porque ${whyBest()}.`;
      }

      const destR = played.to.r;
      const destC = moveDestCol(played);
      const hungMovedPiece =
        !played.castle &&
        afterPlayed.isSquareAttacked(destR, destC, enemy) &&
        !afterPlayed.isSquareAttacked(destR, destC, color);

      if (hungMovedPiece && played.piece !== 'K') {
        return `Dejas ${pieceName} sin defensa en ${destSq}. Mejor era ${bestSan}, porque ${whyBest()}.`;
      }

      if (bestRecord.captured && !played.captured) {
        return `Pasas por alto una captura táctica. Mejor era ${bestSan}, porque ${whyBest()}.`;
      }

      if (classification === 'inaccuracy') {
        return `Cede algo de ventaja. Mejor era ${bestSan}, porque ${whyBest()}.`;
      }

      return `Debilita la posición y permite contrajuego. Mejor era ${bestSan}, porque ${whyBest()}.`;
    }

    if (classification === 'brilliant') {
      if (looksLikeSacrifice) {
        return `Sacrificas ${pieceName} con cálculo exacto y dejas al rival sin respuesta.`;
      }
      return 'Única línea ganadora en una posición muy aguda.';
    }

    if (played.castle) {
      return 'Resguardas al Rey y activas la Torre, clave en Ajedrez 960.';
    }
    if (played.promo) {
      return 'Coronas y conviertes tu ventaja en material decisivo.';
    }
    if (played.captured) {
      return `Eliminas un ${PIECE_ES[played.captured]} enemigo${played.inCheck ? ' con jaque' : ''} y mantienes la presión.`;
    }
    if (played.inCheck) {
      return 'Obligas al rival a defenderse y conservas la iniciativa.';
    }
    if (isExactBest) {
      return `Justo lo que pedía la posición, porque ${whyBest()}.`;
    }
    if (classification === 'excellent') {
      return `Mantiene la iniciativa y una estructura sólida.${!isExactBest ? ` También servía ${bestSan}.` : ''}`;
    }
    return `Sostiene bien la posición.${!isExactBest ? ` Otra opción activa era ${bestSan}.` : ''}`;
  }

  /**
   * Guión conciso y natural: "[Clasificación], [Jugada]. [Análisis/recomendación]"
   */
  speakCurrentPly(force = false) {
    if (!this.inReview) return;
    if (this.currentPly <= 0) {
      if (force && this.summary) {
        this.voice.speak(
          `Posición ${this.positionId}. Precisión: Blancas ${this.summary.whiteAcc} por ciento, Negras ${this.summary.blackAcc} por ciento.`,
          true
        );
      } else {
        this.voice.stop();
      }
      return;
    }

    const item = this.results[this.currentPly - 1];
    if (!item) return;

    const isMate = Boolean(item.played.san && item.played.san.endsWith('#'));
    const label = isMate ? 'Jaque mate' : CLASS_META[item.classification].label;
    const spokenMove = sanToSpanishSpeech(item.played.san, { includeMateSuffix: !isMate });
    const spokenComment = humanizeTextForSpeech(item.comment);

    this.voice.speak(`${label}, ${spokenMove}. ${spokenComment}`, force);
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
    const prevPly = this.currentPly;
    const clamped = Math.max(0, Math.min(this.frames.length - 1, ply));
    this.currentPly = clamped;
    this.inReview = true;

    this.voice.stop();
    this._renderReviewPanel();

    if (!this.deferVoice) {
      this.speakCurrentPly(false);
    }

    if (this.onReviewStep) {
      this.onReviewStep({
        ply: clamped,
        prevPly,
        engine: this.frames[clamped].engine,
        prevEngine: clamped > 0 ? this.frames[clamped - 1].engine : null,
        lastMove: this.frames[clamped].lastMove,
        analysis: clamped > 0 ? this.results[clamped - 1] : null,
        speak: () => this.speakCurrentPly(false),
        stopVoice: () => this.voice.stop()
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
          <div class="an-coach-body">Usa las flechas ◀ ▶ (o haz clic en cualquier jugada del historial) para ver las animaciones y escuchar el análisis.</div>
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
    const voiceOptions = this.voice.spanishVoices
      .slice(0, 12)
      .map(v => {
        const selected = this.voice.voice && v.name === this.voice.voice.name ? 'selected' : '';
        const cleanName = v.name.replace(/Microsoft |Google |Online \(Natural\) - /g, '');
        return `<option value="${v.name.replace(/"/g, '"')}" ${selected}>🎙 ${cleanName} (${v.lang})</option>`;
      })
      .join('');

    const voiceControls = this.voice.supported
      ? `
        <div class="an-voice-bar">
          <button id="an-voice-toggle" class="an-voice-btn ${voiceOn ? 'active' : ''}">
            ${voiceOn ? '🔊 Voz: ON' : '🔇 Voz: OFF'}
          </button>
          <button id="an-voice-replay" class="an-voice-btn">🗣 Repetir Voz</button>
        </div>
        ${this.voice.spanishVoices.length > 1 ? `<select id="an-voice-select" class="an-voice-select" title="Seleccionar voz del entrenador">${voiceOptions}</select>` : ''}
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
      if (active) this.speakCurrentPly(false);
    });
    this.postgameSlotEl.querySelector('#an-voice-replay')?.addEventListener('click', () => {
      this.speakCurrentPly(true);
    });
    this.postgameSlotEl.querySelector('#an-voice-select')?.addEventListener('change', (e) => {
      this.voice.selectVoiceByName(e.target.value);
      this.speakCurrentPly(true);
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
