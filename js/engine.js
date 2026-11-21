export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const PIECE_VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

const KRN_TABLE = [
  [0, 1], [0, 2], [0, 3], [0, 4], [1, 2],
  [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]
];

/**
 * Convierte un índice oficial Scharnagl (0..959) en la fila inicial de 8 piezas.
 * El #518 corresponde al ajedrez clásico: R N B Q K B N R.
 */
export function scharnaglToRow(id) {
  const n = Math.max(0, Math.min(959, Math.floor(id)));
  const row = new Array(8).fill(null);

  const b1 = n % 4;
  row[b1 * 2 + 1] = 'B';
  const n2 = Math.floor(n / 4);

  const b2 = n2 % 4;
  row[b2 * 2] = 'B';
  const n3 = Math.floor(n2 / 4);

  const q = n3 % 6;
  let empties = row.map((v, i) => (v === null ? i : -1)).filter(i => i !== -1);
  row[empties[q]] = 'Q';

  const n4 = Math.floor(n3 / 6);
  empties = row.map((v, i) => (v === null ? i : -1)).filter(i => i !== -1);
  const [k1, k2] = KRN_TABLE[n4];
  row[empties[k1]] = 'N';
  row[empties[k2]] = 'N';

  empties = row.map((v, i) => (v === null ? i : -1)).filter(i => i !== -1);
  row[empties[0]] = 'R';
  row[empties[1]] = 'K';
  row[empties[2]] = 'R';

  return row;
}

export function sqName(r, c) {
  return FILES[c] + (8 - r);
}

export class Chess960Engine {
  constructor(positionId = null) {
    this.reset(positionId ?? Math.floor(Math.random() * 960));
  }

  reset(positionId = 518) {
    this.positionId = Math.max(0, Math.min(959, Math.floor(positionId)));
    const backRank = scharnaglToRow(this.positionId);

    this.board = Array.from({ length: 8 }, () => new Array(8).fill(null));
    for (let c = 0; c < 8; c++) {
      this.board[0][c] = { color: 'b', type: backRank[c] };
      this.board[1][c] = { color: 'b', type: 'P' };
      this.board[6][c] = { color: 'w', type: 'P' };
      this.board[7][c] = { color: 'w', type: backRank[c] };
    }

    const kingCol = backRank.indexOf('K');
    const rookQCol = backRank.indexOf('R');
    const rookKCol = backRank.lastIndexOf('R');

    this.startCols = { king: kingCol, rookQ: rookQCol, rookK: rookKCol };
    this.castling = {
      w: { K: true, Q: true },
      b: { K: true, Q: true }
    };
    this.turn = 'w';
    this.epTarget = null;
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
    this.history = [];
    this.captured = { w: [], b: [] };
    this.status = 'playing'; // playing | checkmate | stalemate | draw
    this.winner = null;
  }

  clone() {
    const copy = Object.create(Chess960Engine.prototype);
    copy.positionId = this.positionId;
    copy.board = this.board.map(row => row.map(p => (p ? { ...p } : null)));
    copy.startCols = { ...this.startCols };
    copy.castling = {
      w: { ...this.castling.w },
      b: { ...this.castling.b }
    };
    copy.turn = this.turn;
    copy.epTarget = this.epTarget ? { ...this.epTarget } : null;
    copy.halfmoveClock = this.halfmoveClock;
    copy.fullmoveNumber = this.fullmoveNumber;
    copy.history = [];
    copy.captured = { w: [...this.captured.w], b: [...this.captured.b] };
    copy.status = this.status;
    copy.winner = this.winner;
    return copy;
  }

  inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  findKing(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === color && p.type === 'K') return { r, c };
      }
    }
    return null;
  }

  /**
   * Comprueba si la casilla (tr, tc) es atacada por `byColor`.
   */
  isSquareAttacked(tr, tc, byColor) {
    const pawnDir = byColor === 'w' ? 1 : -1;
    for (const dc of [-1, 1]) {
      const pr = tr + pawnDir;
      const pc = tc + dc;
      if (this.inBounds(pr, pc)) {
        const p = this.board[pr][pc];
        if (p && p.color === byColor && p.type === 'P') return true;
      }
    }

    const knightJumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of knightJumps) {
      const nr = tr + dr, nc = tc + dc;
      if (this.inBounds(nr, nc)) {
        const p = this.board[nr][nc];
        if (p && p.color === byColor && p.type === 'N') return true;
      }
    }

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const kr = tr + dr, kc = tc + dc;
        if (this.inBounds(kr, kc)) {
          const p = this.board[kr][kc];
          if (p && p.color === byColor && p.type === 'K') return true;
        }
      }
    }

    const diag = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, dc] of diag) {
      let r = tr + dr, c = tc + dc;
      while (this.inBounds(r, c)) {
        const p = this.board[r][c];
        if (p) {
          if (p.color === byColor && (p.type === 'B' || p.type === 'Q')) return true;
          break;
        }
        r += dr; c += dc;
      }
    }

    const ortho = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of ortho) {
      let r = tr + dr, c = tc + dc;
      while (this.inBounds(r, c)) {
        const p = this.board[r][c];
        if (p) {
          if (p.color === byColor && (p.type === 'R' || p.type === 'Q')) return true;
          break;
        }
        r += dr; c += dc;
      }
    }

    return false;
  }

  isInCheck(color) {
    const k = this.findKing(color);
    if (!k) return false;
    return this.isSquareAttacked(k.r, k.c, color === 'w' ? 'b' : 'w');
  }

  getAttackMap() {
    const map = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => ({ w: false, b: false }))
    );
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        map[r][c].w = this.isSquareAttacked(r, c, 'w');
        map[r][c].b = this.isSquareAttacked(r, c, 'b');
      }
    }
    return map;
  }

  /**
   * Devuelve líneas de amenaza activas: piezas que actualmente atacan una pieza enemiga.
   */
  getActiveThreats() {
    const threats = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (!p) continue;
        const targets = this.generatePseudoMoves(r, c, false);
        for (const m of targets) {
          const target = this.board[m.to.r][m.to.c];
          if (target && target.color !== p.color) {
            threats.push({
              from: { r, c },
              to: { r: m.to.r, c: m.to.c },
              color: p.color,
              attackerType: p.type,
              victimType: target.type
            });
          }
        }
      }
    }
    return threats;
  }

  generatePseudoMoves(r, c, includeCastling = true) {
    const p = this.board[r][c];
    if (!p) return [];
    const moves = [];
    const enemy = p.color === 'w' ? 'b' : 'w';

    if (p.type === 'P') {
      const dir = p.color === 'w' ? -1 : 1;
      const startRow = p.color === 'w' ? 6 : 1;
      const promoRow = p.color === 'w' ? 0 : 7;

      const pushPawn = (tr, tc, extra = {}) => {
        if (tr === promoRow) {
          for (const promo of ['Q', 'R', 'B', 'N']) {
            moves.push({ from: { r, c }, to: { r: tr, c: tc }, piece: p.type, promo, ...extra });
          }
        } else {
          moves.push({ from: { r, c }, to: { r: tr, c: tc }, piece: p.type, ...extra });
        }
      };

      const nr = r + dir;
      if (this.inBounds(nr, c) && !this.board[nr][c]) {
        pushPawn(nr, c);
        if (r === startRow && !this.board[r + 2 * dir][c]) {
          moves.push({ from: { r, c }, to: { r: r + 2 * dir, c }, piece: 'P', doublePush: true });
        }
      }

      for (const dc of [-1, 1]) {
        const nc = c + dc;
        if (!this.inBounds(nr, nc)) continue;
        const target = this.board[nr][nc];
        if (target && target.color === enemy) {
          pushPawn(nr, nc, { captured: target.type });
        } else if (this.epTarget && this.epTarget.r === nr && this.epTarget.c === nc) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece: 'P', ep: true, captured: 'P' });
        }
      }
    } else if (p.type === 'N') {
      const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of jumps) {
        const nr = r + dr, nc = c + dc;
        if (!this.inBounds(nr, nc)) continue;
        const t = this.board[nr][nc];
        if (!t || t.color === enemy) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece: 'N', captured: t ? t.type : null });
        }
      }
    } else if (p.type === 'B' || p.type === 'R' || p.type === 'Q') {
      const dirs = [];
      if (p.type === 'B' || p.type === 'Q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      if (p.type === 'R' || p.type === 'Q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      for (const [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (this.inBounds(nr, nc)) {
          const t = this.board[nr][nc];
          if (!t) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece: p.type });
          } else {
            if (t.color === enemy) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece: p.type, captured: t.type });
            }
            break;
          }
          nr += dr; nc += dc;
        }
      }
    } else if (p.type === 'K') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr, nc = c + dc;
          if (!this.inBounds(nr, nc)) continue;
          const t = this.board[nr][nc];
          if (!t || t.color === enemy) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece: 'K', captured: t ? t.type : null });
          }
        }
      }

      if (includeCastling) {
        this._addCastling960Moves(p.color, r, c, moves);
      }
    }

    return moves;
  }

  _addCastling960Moves(color, r, c, moves) {
    const homeRow = color === 'w' ? 7 : 0;
    if (r !== homeRow || c !== this.startCols.king) return;
    const enemy = color === 'w' ? 'b' : 'w';
    if (this.isSquareAttacked(homeRow, c, enemy)) return;

    const sides = [
      { side: 'K', rookCol: this.startCols.rookK, kingTo: 6, rookTo: 5 },
      { side: 'Q', rookCol: this.startCols.rookQ, kingTo: 2, rookTo: 3 }
    ];

    for (const { side, rookCol, kingTo, rookTo } of sides) {
      if (!this.castling[color][side]) continue;
      const rook = this.board[homeRow][rookCol];
      if (!rook || rook.color !== color || rook.type !== 'R') continue;

      const minClear = Math.min(c, rookCol, kingTo, rookTo);
      const maxClear = Math.max(c, rookCol, kingTo, rookTo);
      let blocked = false;
      for (let col = minClear; col <= maxClear; col++) {
        if (col === c || col === rookCol) continue;
        if (this.board[homeRow][col] !== null) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;

      const step = kingTo >= c ? 1 : -1;
      let attacked = false;
      for (let col = c; ; col += step) {
        if (this.isSquareAttacked(homeRow, col, enemy)) {
          attacked = true;
          break;
        }
        if (col === kingTo) break;
      }
      if (attacked) continue;

      moves.push({
        from: { r: homeRow, c },
        to: { r: homeRow, c: rookCol }, // Representación canónica 960 (Rey -> su Torre)
        piece: 'K',
        castle: side,
        kingToCol: kingTo,
        rookToCol: rookTo,
        rookFromCol: rookCol
      });
    }
  }

  getLegalMoves(color = this.turn) {
    const legal = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (!p || p.color !== color) continue;
        const pseudo = this.generatePseudoMoves(r, c, true);
        for (const m of pseudo) {
          if (m.castle) {
            legal.push(m);
            continue;
          }
          const sim = this.clone();
          sim._applyRawMove(m);
          if (!sim.isInCheck(color)) {
            legal.push(m);
          }
        }
      }
    }
    return legal;
  }

  getLegalMovesFrom(r, c) {
    const p = this.board[r][c];
    if (!p || p.color !== this.turn) return [];
    return this.getLegalMoves(this.turn).filter(m => m.from.r === r && m.from.c === c);
  }

  _applyRawMove(move) {
    const p = this.board[move.from.r][move.from.c];
    if (move.castle) {
      const row = move.from.r;
      const rook = this.board[row][move.rookFromCol];
      this.board[row][move.from.c] = null;
      this.board[row][move.rookFromCol] = null;
      this.board[row][move.kingToCol] = p;
      this.board[row][move.rookToCol] = rook;
      return;
    }

    this.board[move.from.r][move.from.c] = null;
    if (move.ep) {
      this.board[move.from.r][move.to.c] = null;
    }
    this.board[move.to.r][move.to.c] = move.promo
      ? { color: p.color, type: move.promo }
      : p;
  }

  makeMove(move) {
    const snapshot = {
      board: this.board.map(row => row.map(p => (p ? { ...p } : null))),
      castling: { w: { ...this.castling.w }, b: { ...this.castling.b } },
      turn: this.turn,
      epTarget: this.epTarget ? { ...this.epTarget } : null,
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber,
      captured: { w: [...this.captured.w], b: [...this.captured.b] },
      status: this.status,
      winner: this.winner
    };

    const color = this.turn;
    const enemy = color === 'w' ? 'b' : 'w';
    const sanBase = this._computeSanBase(move, color);

    const capturedPiece = move.ep
      ? { color: enemy, type: 'P' }
      : (!move.castle ? this.board[move.to.r][move.to.c] : null);

    if (capturedPiece) {
      this.captured[color].push(capturedPiece.type);
    }

    this._applyRawMove(move);

    // Actualizar derechos de enroque
    const homeRow = color === 'w' ? 7 : 0;
    const enemyHome = enemy === 'w' ? 7 : 0;
    if (move.piece === 'K') {
      this.castling[color].K = false;
      this.castling[color].Q = false;
    }
    if (move.from.r === homeRow && move.from.c === this.startCols.rookK) this.castling[color].K = false;
    if (move.from.r === homeRow && move.from.c === this.startCols.rookQ) this.castling[color].Q = false;
    if (!move.castle) {
      if (move.to.r === enemyHome && move.to.c === this.startCols.rookK) this.castling[enemy].K = false;
      if (move.to.r === enemyHome && move.to.c === this.startCols.rookQ) this.castling[enemy].Q = false;
    }

    // Al paso
    this.epTarget = move.doublePush
      ? { r: (move.from.r + move.to.r) / 2, c: move.from.c }
      : null;

    this.halfmoveClock = (move.piece === 'P' || capturedPiece) ? 0 : this.halfmoveClock + 1;
    if (color === 'b') this.fullmoveNumber++;
    this.turn = enemy;

    const inCheck = this.isInCheck(enemy);
    const enemyMoves = this.getLegalMoves(enemy);

    let suffix = '';
    if (enemyMoves.length === 0) {
      if (inCheck) {
        this.status = 'checkmate';
        this.winner = color;
        suffix = '#';
      } else {
        this.status = 'stalemate';
        this.winner = null;
      }
    } else {
      if (inCheck) suffix = '+';
      if (this.halfmoveClock >= 100 || this._isInsufficientMaterial()) {
        this.status = 'draw';
        this.winner = null;
      }
    }

    const record = {
      ...move,
      color,
      captured: capturedPiece ? capturedPiece.type : null,
      san: sanBase + suffix,
      inCheck,
      snapshot
    };
    this.history.push(record);
    return record;
  }

  undo() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();
    const s = last.snapshot;
    this.board = s.board;
    this.castling = s.castling;
    this.turn = s.turn;
    this.epTarget = s.epTarget;
    this.halfmoveClock = s.halfmoveClock;
    this.fullmoveNumber = s.fullmoveNumber;
    this.captured = s.captured;
    this.status = s.status;
    this.winner = s.winner;
    return last;
  }

  _computeSanBase(move, color) {
    if (move.castle) return move.castle === 'K' ? 'O-O' : 'O-O-O';
    const esNames = { P: '', N: 'C', B: 'A', R: 'T', Q: 'D', K: 'R' };
    const isCap = Boolean(move.captured || move.ep);
    let san = esNames[move.piece];

    if (move.piece === 'P' && isCap) {
      san += FILES[move.from.c];
    } else if (move.piece !== 'P' && move.piece !== 'K') {
      const others = this.getLegalMoves(color).filter(m =>
        !m.castle &&
        m.piece === move.piece &&
        m.to.r === move.to.r &&
        m.to.c === move.to.c &&
        (m.from.r !== move.from.r || m.from.c !== move.from.c)
      );
      if (others.length > 0) {
        const sameFile = others.some(m => m.from.c === move.from.c);
        const sameRank = others.some(m => m.from.r === move.from.r);
        if (!sameFile) san += FILES[move.from.c];
        else if (!sameRank) san += (8 - move.from.r);
        else san += sqName(move.from.r, move.from.c);
      }
    }

    if (isCap) san += 'x';
    san += sqName(move.to.r, move.to.c);
    if (move.promo) san += '=' + esNames[move.promo];
    return san;
  }

  _isInsufficientMaterial() {
    const pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.type !== 'K') pieces.push(p.type);
      }
    }
    if (pieces.length === 0) return true;
    if (pieces.length === 1 && (pieces[0] === 'B' || pieces[0] === 'N')) return true;
    return false;
  }

  getMaterialBalance() {
    let w = 0, b = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (!p || p.type === 'K') continue;
        if (p.color === 'w') w += PIECE_VALUES[p.type] / 100;
        else b += PIECE_VALUES[p.type] / 100;
      }
    }
    return Math.round(w - b);
  }
}
