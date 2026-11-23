import { Chess960Engine, PIECE_VALUES } from './engine.js';
import { CLASS_META } from './analyzer.js';
import { detectOpening } from './openings.js';

CLASS_META.book = {
  code: '📖',
  label: 'Libro',
  color: '#c084fc',
  bg: 'rgba(192, 132, 252, 0.16)'
};

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

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function winPct(cp) {
  if (cp > 90000) return 100;
  if (cp < -90000) return 0;
  const c = clamp(cp, -1500, 1500);
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}

function calcAccuracyFromDrops(drops) {
  if (!drops.length) return 100;
  const sum = drops.reduce((acc, d) => {
    const score = clamp(103.1668 * Math.exp(-0.04354 * d) - 3.1668, 0, 100);
    return acc + score;
  }, 0);
  return Math.max(5, Math.min(100, Math.round(sum / drops.length)));
}

function buildSmartStockfishComment({
  analyzer,
  classification,
  beforeEngine,
  afterPlayed,
  played,
  bestMove,
  bestSan,
  bestRecord,
  openingHit,
  wasInCheck,
  isForced,
  isMatePlayed,
  savedUnderPressure,
  missedMate,
  allowedMate,
  isExactBest,
  looksLikeSacrifice
}) {
  if (isMatePlayed) {
    return '¡Jaque Mate! Remate impecable sin escapatoria para el Rey rival.';
  }
  if (isForced) {
    return wasInCheck
      ? 'Esta era la única jugada legal posible para salir del jaque.'
      : 'Única jugada legal disponible en esta posición.';
  }
  if (classification === 'book' && openingHit) {
    return `Jugada teórica de ${openingHit.name}. Sigue líneas probadas de apertura.`;
  }
  if (classification === 'brilliant') {
    return '¡Jugada brillante! Sacrificio táctico exacto que supera a todas las alternativas según Stockfish.';
  }
  if (classification === 'best') {
    if (wasInCheck) {
      return '¡Defensa exacta bajo jaque! Estabas en un aprieto y encontraste la mejor jugada posible para sobrevivir.';
    }
    if (savedUnderPressure) {
      return '¡Gran recurso en un aprieto! Esta era la mejor jugada posible para salvar tu pieza y sostener la posición.';
    }
    if (played.captured) {
      return '¡Esta era la mejor jugada posible! Captura precisa que aprovecha al máximo la posición.';
    }
    if (played.inCheck) {
      return '¡La mejor jugada posible! Das jaque ganando iniciativa y restringiendo al Rey rival.';
    }
    return '¡Esta era la mejor jugada posible! Coincides exactamente con la primera línea de Stockfish.';
  }
  if (classification === 'excellent') {
    return `Excelente decisión, prácticamente tan fuerte como la mejor jugada de Stockfish (${bestSan}).`;
  }
  if (classification === 'good') {
    return isExactBest
      ? 'Jugada sólida que mantiene controlada la posición.'
      : `Jugada sólida y razonable. Stockfish prefería ligeramente ${bestSan}.`;
  }

  return analyzer._buildCoachComment({
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
}

export function attachStockfishAnalyzer(app) {
  const analyzer = app.analyzer;
  const sf = app.stockfish;
  if (!analyzer || !sf) return;

  const origStart = analyzer.startAnalysis.bind(analyzer);

  analyzer.startAnalysis = async (engine) => {
    if (!engine || engine.history.length === 0) return;

    const sfReady = await sf.init();
    if (!sfReady) {
      analyzer.usedStockfish = false;
      return origStart(engine);
    }

    const token = ++analyzer._runToken;
    analyzer.voice.stop();
    sf.stop();
    analyzer.analyzing = true;
    analyzer.inReview = false;
    analyzer.usedStockfish = true;
    analyzer.positionId = engine.positionId;

    const history = engine.history.map(h => ({ ...h }));
    const total = history.length;

    const sim = new Chess960Engine(engine.positionId);
    const frames = [{ engine: sim.clone(), lastMove: null }];
    for (let i = 0; i < total; i++) {
      sim.makeMove(history[i]);
      frames.push({ engine: sim.clone(), lastMove: history[i] });
    }
    analyzer.frames = frames;
    analyzer.results = [];

    const evals = new Array(total + 1).fill(null);
    analyzer._renderProgress(0, total + 1);

    for (let k = 0; k <= total; k++) {
      if (token !== analyzer._runToken) return;
      const eng = frames[k].engine;

      if (eng.status === 'checkmate') {
        evals[k] = { move: null, scoreCp: eng.winner === 'w' ? 100000 : -100000, mateIn: 0 };
      } else if (eng.status !== 'playing') {
        evals[k] = { move: null, scoreCp: 0, mateIn: null };
      } else {
        const res = await sf.evaluatePosition(eng, { skill: 20, depth: 11, movetime: 250 });
        if (token !== analyzer._runToken) return;
        evals[k] = res || { move: null, scoreCp: 0, mateIn: null };
      }

      analyzer._renderProgress(k + 1, total + 1);
    }

    if (token !== analyzer._runToken) return;

    const wDrops = [];
    const bDrops = [];
    const counts = {
      book: 0, brilliant: 0, best: 0, excellent: 0,
      good: 0, inaccuracy: 0, mistake: 0, blunder: 0
    };

    for (let i = 0; i < total; i++) {
      const beforeEngine = frames[i].engine;
      const afterEngine = frames[i + 1].engine;
      const played = history[i];
      const color = played.color;
      const enemy = color === 'w' ? 'b' : 'w';
      const sign = color === 'w' ? 1 : -1;

      const legalMoves = beforeEngine.getLegalMoves(color);
      const beforeSf = evals[i];
      const afterSf = evals[i + 1];

      const isMatePlayed = Boolean(played.san && played.san.endsWith('#'));
      const bestMove = isMatePlayed
        ? played
        : (beforeSf?.move || legalMoves[0] || played);

      const bestSim = beforeEngine.clone();
      const bestRecord = bestSim.makeMove(bestMove);
      const bestSan = bestRecord.san;
      const isExactBest = isMatePlayed || sameMove(played, bestMove);

      const evalBest = beforeSf ? beforeSf.scoreCp : 0;
      const evalAfter = afterSf ? afterSf.scoreCp : 0;
      const moverBefore = evalBest * sign;
      const moverAfter = evalAfter * sign;

      const cpLoss = isExactBest
        ? 0
        : Math.max(0, Math.round(clamp(moverBefore, -1000, 1000) - clamp(moverAfter, -1000, 1000)));
      const winDrop = isExactBest
        ? 0
        : Math.max(0, winPct(moverBefore) - winPct(moverAfter));

      const allowedMate = moverAfter < -90000 && moverBefore > -90000;
      const missedMateToEqual = moverBefore > 90000 && moverAfter < 320;
      const missedMateStillWinning = moverBefore > 90000 && moverAfter >= 320 && moverAfter < 90000;

      const openingHit = (engine.positionId === 518 && i < 10)
        ? detectOpening(history.slice(0, i + 1))
        : null;
      const isBookMove = Boolean(openingHit && !allowedMate && winDrop <= 4.5 && !isMatePlayed);

      const alreadyWon = moverBefore >= 650 && moverAfter >= 550;
      const alreadyLost = moverBefore <= -650 && moverAfter <= -550;
      const isForced = legalMoves.length <= 1;
      const wasInCheck = typeof beforeEngine.isInCheck === 'function'
        ? beforeEngine.isInCheck(color)
        : false;

      // Detectar si salvó una pieza atacada o respondió con precisión bajo presión
      const pieceWasAttacked = !played.castle &&
        beforeEngine.isSquareAttacked(played.from.r, played.from.c, enemy) &&
        played.piece !== 'P';
      const destC = played.castle ? played.kingToCol : played.to.c;
      const destAttacked = !played.castle && afterEngine.isSquareAttacked(played.to.r, destC, enemy);
      const savedUnderPressure = Boolean(
        isExactBest &&
        !isForced &&
        ((pieceWasAttacked && !destAttacked) || (moverBefore < -40 && moverAfter >= -95))
      );

      const looksLikeSacrifice =
        !isMatePlayed &&
        !isBookMove &&
        !alreadyWon &&
        !alreadyLost &&
        isExactBest &&
        destAttacked &&
        played.piece !== 'P' &&
        played.piece !== 'K' &&
        (!played.captured || (PIECE_VALUES[played.piece] || 0) >= (PIECE_VALUES[played.captured] || 0) + 150) &&
        Math.abs(evalBest) < 360 &&
        moverAfter >= 40 &&
        legalMoves.length >= 4;

      let classification = 'good';
      if (isMatePlayed) {
        classification = 'best';
      } else if (isBookMove) {
        classification = 'book';
      } else if (allowedMate || missedMateToEqual || winDrop >= 24) {
        classification = 'blunder';
      } else if (missedMateStillWinning || winDrop >= 11.5) {
        classification = 'mistake';
      } else if (winDrop >= 5.8) {
        classification = 'inaccuracy';
      } else if (looksLikeSacrifice && winDrop <= 0.5) {
        classification = 'brilliant';
      } else if (isForced) {
        classification = 'good';
      } else if (isExactBest && !alreadyWon && !alreadyLost) {
        classification = 'best';
      } else if (winDrop <= 2.2 && cpLoss <= 40) {
        classification = 'excellent';
      } else {
        classification = 'good';
      }

      const comment = buildSmartStockfishComment({
        analyzer,
        classification,
        beforeEngine,
        afterPlayed: afterEngine,
        played,
        bestMove,
        bestSan,
        bestRecord,
        openingHit,
        wasInCheck,
        isForced,
        isMatePlayed,
        savedUnderPressure,
        missedMate: missedMateToEqual || missedMateStillWinning,
        allowedMate,
        isExactBest,
        looksLikeSacrifice
      });

      analyzer.results.push({
        played,
        bestMove,
        bestSan,
        classification,
        cpLoss,
        evalAfter,
        evalBest,
        isExactBest,
        comment
      });

      counts[classification]++;
      if (!isBookMove) {
        if (color === 'w') wDrops.push(winDrop);
        else bDrops.push(winDrop);
      }
    }

    analyzer.analyzing = false;
    analyzer.summary = {
      whiteAcc: calcAccuracyFromDrops(wDrops),
      blackAcc: calcAccuracyFromDrops(bDrops),
      counts
    };

    if (analyzer.onAnalysisReady) {
      analyzer.onAnalysisReady(analyzer.results);
    }

    analyzer.inReview = true;
    analyzer.goToPly(1);
  };

  const origRenderPanel = analyzer._renderReviewPanel.bind(analyzer);
  analyzer._renderReviewPanel = () => {
    origRenderPanel();
    const box = app.dom.postgameSlot?.querySelector('.an-box');
    if (!box || !analyzer.usedStockfish) return;

    const manualBtn = box.querySelector('#sf-deep-btn');
    if (manualBtn) manualBtn.parentElement?.remove();

    const counts = analyzer.summary?.counts;
    const countsEl = box.querySelector('.an-counts');
    if (counts && countsEl) {
      const order = ['book', 'brilliant', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'];
      countsEl.innerHTML = order
        .filter(k => (counts[k] || 0) > 0)
        .map(k => {
          const m = CLASS_META[k];
          return `<span class="an-chip" title="${m.label}" style="color:${m.color};background:${m.bg};border-color:${m.color}44">${m.code} ${counts[k]}</span>`;
        })
        .join('');
    }

    if (!box.querySelector('.sf-auto-tag')) {
      const tag = document.createElement('div');
      tag.className = 'sf-auto-tag';
      tag.style.cssText = 'font-size:0.72rem;font-weight:700;color:#4ade80;text-align:center;';
      tag.textContent = '⚙ Análisis calibrado con Stockfish';
      box.prepend(tag);
    }
  };
}
