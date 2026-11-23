import { FILES } from './engine.js';

const SF_CDNS = [
  'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js',
  'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js'
];

/**
 * Genera FEN estándar (Clásico #518) o Shredder-FEN (Fischer 960) para Stockfish.
 */
export function engineToFen(engine) {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let rowStr = '';
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = engine.board[r][c];
      if (!p) {
        empty++;
      } else {
        if (empty) { rowStr += empty; empty = 0; }
        rowStr += p.color === 'w' ? p.type : p.type.toLowerCase();
      }
    }
    if (empty) rowStr += empty;
    rows.push(rowStr);
  }

  let castling = '';
  if (engine.positionId === 518) {
    if (engine.castling.w.K) castling += 'K';
    if (engine.castling.w.Q) castling += 'Q';
    if (engine.castling.b.K) castling += 'k';
    if (engine.castling.b.Q) castling += 'q';
  } else {
    if (engine.castling.w.Q) castling += FILES[engine.startCols.rookQ].toUpperCase();
    if (engine.castling.w.K) castling += FILES[engine.startCols.rookK].toUpperCase();
    if (engine.castling.b.Q) castling += FILES[engine.startCols.rookQ];
    if (engine.castling.b.K) castling += FILES[engine.startCols.rookK];
  }
  if (!castling) castling = '-';

  const ep = engine.epTarget
    ? `${FILES[engine.epTarget.c]}${8 - engine.epTarget.r}`
    : '-';

  return `${rows.join('/')} ${engine.turn} ${castling} ${ep} ${engine.halfmoveClock || 0} ${engine.fullmoveNumber || 1}`;
}

/**
 * Traduce un movimiento UCI de Stockfish (incluyendo enroques clásicos y 960) a jugada legal del motor.
 */
export function uciToLegalMove(engine, uci) {
  if (!uci || uci === '(none)' || uci.length < 4) return null;
  const fc = FILES.indexOf(uci[0]);
  const fr = 8 - parseInt(uci[1], 10);
  const tc = FILES.indexOf(uci[2]);
  const tr = 8 - parseInt(uci[3], 10);
  const promo = uci[4] ? uci[4].toUpperCase() : null;

  const legal = engine.getLegalMoves(engine.turn);

  const exact = legal.find(m =>
    m.from.r === fr &&
    m.from.c === fc &&
    m.to.r === tr &&
    m.to.c === tc &&
    (m.promo || null) === promo
  );
  if (exact) return exact;

  // Enroque clásico (e1g1 / e1c1) mapeado a representación interna
  return legal.find(m =>
    m.castle &&
    m.from.r === fr &&
    m.from.c === fc &&
    m.from.r === tr &&
    m.kingToCol === tc
  ) || null;
}

export class StockfishBridge {
  constructor() {
    this.worker = null;
    this.status = 'idle'; // idle | loading | ready | offline
    this.initPromise = null;
    this.reqToken = 0;
    this.activeJob = null;
    this.listeners = new Set();
  }

  onStatus(fn) {
    this.listeners.add(fn);
    fn(this.status);
  }

  _setStatus(st) {
    this.status = st;
    this.listeners.forEach(fn => fn(st));
  }

  init() {
    if (this.status === 'ready') return Promise.resolve(true);
    if (this.initPromise) return this.initPromise;

    this._setStatus('loading');
    this.initPromise = this._bootFromCdns(0).then((ok) => {
      this._setStatus(ok ? 'ready' : 'offline');
      return ok;
    });
    return this.initPromise;
  }

  _bootFromCdns(index) {
    if (index >= SF_CDNS.length || typeof Worker === 'undefined') {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      let settled = false;
      let worker = null;
      let blobUrl = null;

      const finish = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (!ok && worker) {
          try { worker.terminate(); } catch { /* ignorar */ }
        }
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        resolve(ok ? true : this._bootFromCdns(index + 1));
      };

      const timer = setTimeout(() => finish(false), 7500);

      try {
        const script = `importScripts(${JSON.stringify(SF_CDNS[index])});`;
        blobUrl = URL.createObjectURL(new Blob([script], { type: 'application/javascript' }));
        worker = new Worker(blobUrl);

        worker.onmessage = (e) => {
          const line = String(e.data || '');
          if (!settled && line.includes('uciok')) {
            this.worker = worker;
            this.worker.onmessage = (ev) => this._onLine(String(ev.data || ''));
            finish(true);
          }
        };
        worker.onerror = () => finish(false);
        worker.postMessage('uci');
      } catch {
        finish(false);
      }
    });
  }

  stop() {
    this.reqToken++;
    if (this.activeJob) {
      clearTimeout(this.activeJob.timeout);
      this.activeJob.resolve(null);
      this.activeJob = null;
    }
    if (this.worker) {
      try { this.worker.postMessage('stop'); } catch { /* ignorar */ }
    }
  }

  async evaluatePosition(engine, { skill = 20, depth = 11, movetime = 700 } = {}) {
    const ok = await this.init();
    if (!ok || !this.worker) return null;

    this.stop();
    const token = ++this.reqToken;
    const is960 = engine.positionId !== 518;
    const fen = engineToFen(engine);
    const turnSign = engine.turn === 'w' ? 1 : -1;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (this.activeJob && this.activeJob.token === token) {
          try { this.worker.postMessage('stop'); } catch { /* ignorar */ }
          this.activeJob = null;
          resolve(null);
        }
      }, movetime + 4500);

      this.activeJob = {
        token,
        phase: 'wait_ready',
        fen,
        depth,
        movetime,
        turnSign,
        engine: engine.clone(),
        scoreCp: 0,
        mateIn: null,
        bestDepth: 0,
        resolve,
        timeout
      };

      this.worker.postMessage(`setoption name UCI_Chess960 value ${is960}`);
      this.worker.postMessage(`setoption name Skill Level value ${Math.max(0, Math.min(20, skill))}`);
      this.worker.postMessage('isready');
    });
  }

  _onLine(line) {
    const job = this.activeJob;
    if (!job || job.token !== this.reqToken) return;

    if (job.phase === 'wait_ready') {
      if (line.includes('readyok')) {
        job.phase = 'searching';
        this.worker.postMessage(`position fen ${job.fen}`);
        this.worker.postMessage(`go depth ${job.depth} movetime ${job.movetime}`);
      }
      return;
    }

    if (line.startsWith('info ')) {
      const dm = line.match(/\bdepth (\d+)/);
      if (dm) job.bestDepth = parseInt(dm[1], 10);

      const mateM = line.match(/\bscore mate (-?\d+)/);
      if (mateM) {
        job.mateIn = parseInt(mateM[1], 10) * job.turnSign;
        job.scoreCp = job.mateIn > 0 ? 100000 : -100000;
      } else {
        const cpM = line.match(/\bscore cp (-?\d+)/);
        if (cpM) {
          job.mateIn = null;
          job.scoreCp = parseInt(cpM[1], 10) * job.turnSign;
        }
      }
      return;
    }

    if (line.startsWith('bestmove ')) {
      const uci = line.split(/\s+/)[1] || '';
      clearTimeout(job.timeout);
      this.activeJob = null;
      const move = uciToLegalMove(job.engine, uci);
      job.resolve({
        uci,
        move,
        scoreCp: job.scoreCp,
        mateIn: job.mateIn,
        depth: job.bestDepth
      });
    }
  }
}
