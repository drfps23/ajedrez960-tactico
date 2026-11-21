import { PIECE_VALUES } from './engine.js';

const PST = {
  P: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    12, 12, 20, 30, 30, 20, 12, 12,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 22, 22,  0,  0,  0,
     5, -4, -8,  0,  0, -8, -4,  5,
     5, 10, 10,-18,-18, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ],
  N: [
   -50,-40,-30,-30,-30,-30,-40,-50,
   -40,-20,  0,  0,  0,  0,-20,-40,
   -30,  0, 12, 16, 16, 12,  0,-30,
   -30,  5, 16, 22, 22, 16,  5,-30,
   -30,  0, 16, 22, 22, 16,  0,-30,
   -30,  5, 12, 16, 16, 12,  5,-30,
   -40,-20,  0,  5,  5,  0,-20,-40,
   -50,-40,-30,-30,-30,-30,-40,-50
  ],
  B: [
   -20,-10,-10,-10,-10,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  8, 12, 12,  8,  0,-10,
   -10,  6,  8, 12, 12,  8,  6,-10,
   -10,  0, 10, 12, 12, 10,  0,-10,
   -10, 10, 10, 10, 10, 10, 10,-10,
   -10,  5,  0,  0,  0,  0,  5,-10,
   -20,-10,-10,-10,-10,-10,-10,-20
  ],
  R: [
     0,  0,  0,  2,  2,  0,  0,  0,
     6, 12, 12, 12, 12, 12, 12,  6,
    -4,  0,  0,  0,  0,  0,  0, -4,
    -4,  0,  0,  0,  0,  0,  0, -4,
    -4,  0,  0,  0,  0,  0,  0, -4,
    -4,  0,  0,  0,  0,  0,  0, -4,
    -4,  0,  0,  0,  0,  0,  0, -4,
     0,  0,  4,  8,  8,  4,  0,  0
  ],
  Q: [
   -20,-10,-10, -5, -5,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  6,  6,  6,  6,  0,-10,
    -5,  0,  6,  8,  8,  6,  0, -5,
     0,  0,  6,  8,  8,  6,  0, -5,
   -10,  5,  6,  6,  6,  6,  0,-10,
   -10,  0,  5,  0,  0,  0,  0,-10,
   -20,-10,-10, -5, -5,-10,-10,-20
  ],
  K: [
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -20,-30,-30,-40,-40,-30,-30,-20,
   -10,-20,-20,-20,-20,-20,-20,-10,
    18, 18,  0,  0,  0,  0, 18, 18,
    20, 30, 10,  0,  0, 10, 30, 20
  ]
};

/**
 * Evalúa el tablero en centipeones desde la perspectiva de las Blancas (+ favorece Blancas).
 */
export function evaluateBoard(engine) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = engine.board[r][c];
      if (!p) continue;
      const base = PIECE_VALUES[p.type] || 0;
      const idx = p.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;
      const pos = PST[p.type] ? PST[p.type][idx] : 0;
      score += p.color === 'w' ? (base + pos) : -(base + pos);
    }
  }
  return score;
}

function scoreMoveOrder(move) {
  let s = 0;
  if (move.captured) {
    s += 10 * (PIECE_VALUES[move.captured] || 100) - (PIECE_VALUES[move.piece] || 100);
  }
  if (move.promo) s += PIECE_VALUES[move.promo] || 800;
  if (move.castle) s += 60;
  return s;
}

export class ChessAI {
  getBestMove(engine, difficulty = 'ai-normal') {
    const moves = engine.getLegalMoves(engine.turn);
    if (moves.length === 0) return null;

    const maximizing = engine.turn === 'w';
    const depth = difficulty === 'ai-easy' ? 2 : 3;

    moves.sort((a, b) => scoreMoveOrder(b) - scoreMoveOrder(a));

    const scored = [];
    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of moves) {
      const sim = engine.clone();
      sim.makeMove(move);
      const val = this._minimax(sim, depth - 1, alpha, beta, !maximizing, 1);
      scored.push({ move, val });

      if (maximizing) {
        if (val > alpha) alpha = val;
      } else {
        if (val < beta) beta = val;
      }
    }

    scored.sort((a, b) => (maximizing ? b.val - a.val : a.val - b.val));

    // En modo Fácil añade variedad humana entre las 3 mejores opciones cercanas
    if (difficulty === 'ai-easy' && scored.length > 1) {
      const top = scored.slice(0, Math.min(3, scored.length));
      const pick = top[Math.floor(Math.random() * top.length)];
      return pick.move;
    }

    // Desempate aleatorio entre jugadas equivalentes
    const bestVal = scored[0].val;
    const ties = scored.filter(item => Math.abs(item.val - bestVal) <= 12);
    return ties[Math.floor(Math.random() * ties.length)].move;
  }

  _minimax(engine, depth, alpha, beta, maximizing, ply) {
    if (engine.status === 'checkmate') {
      return engine.winner === 'w' ? 100000 - ply : -100000 + ply;
    }
    if (engine.status === 'stalemate' || engine.status === 'draw') {
      return 0;
    }
    if (depth <= 0) {
      return evaluateBoard(engine);
    }

    const moves = engine.getLegalMoves(engine.turn);
    moves.sort((a, b) => scoreMoveOrder(b) - scoreMoveOrder(a));

    if (maximizing) {
      let maxEval = -Infinity;
      for (const m of moves) {
        const sim = engine.clone();
        sim.makeMove(m);
        const evalScore = this._minimax(sim, depth - 1, alpha, beta, false, ply + 1);
        if (evalScore > maxEval) maxEval = evalScore;
        if (evalScore > alpha) alpha = evalScore;
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of moves) {
        const sim = engine.clone();
        sim.makeMove(m);
        const evalScore = this._minimax(sim, depth - 1, alpha, beta, true, ply + 1);
        if (evalScore < minEval) minEval = evalScore;
        if (evalScore < beta) beta = evalScore;
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
}
