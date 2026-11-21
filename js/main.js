import { Chess960Engine, FILES } from './engine.js';
import { SoundFX } from './audio.js';
import { CombatFX } from './fx.js';
import { ChessAI } from './ai.js';

const UNICODE_CAPTURED = {
  w: { P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' },
  b: { P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚' }
};

/**
 * Renderizador SVG escultórico con contraste nítido entre Blancas (Marfil/Plata) y Negras (Obsidiana/Cian).
 */
export function defaultPieceSvg(type, color) {
  const isW = color === 'w';
  const fill = isW ? '#f8fafc' : '#111827';
  const shade = isW ? '#cbd5e1' : '#1e293b';
  const stroke = isW ? '#0f172a' : '#38bdf8';
  const accent = isW ? '#0284c7' : '#f43f5e';
  const highlight = isW ? '#ffffff' : '#64748b';

  const shapes = {
    P: `<ellipse cx="22.5" cy="39" rx="12" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <path d="M12 37.5c0-4.2 4.5-6.5 10.5-6.5S33 33.3 33 37.5v2H12v-2z" fill="${fill}" stroke="${stroke}" stroke-width="1.9"/>
        <path d="M16.5 21h12l-2 10h-8l-2-10z" fill="${shade}" stroke="${stroke}" stroke-width="1.9"/>
        <circle cx="22.5" cy="14" r="6" fill="${fill}" stroke="${stroke}" stroke-width="1.9"/>
        <circle cx="20.6" cy="12" r="1.8" fill="${highlight}" opacity="0.7"/>
        <rect x="15" y="19.5" width="15" height="2.6" rx="1.2" fill="${accent}" stroke="${stroke}" stroke-width="1.1"/>`,
    R: `<ellipse cx="22.5" cy="39.5" rx="13.5" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <path d="M10.5 9.5h5v4.2h4.2V9.5h5.6v4.2h4.2V9.5h5v7.5l-3.8 3.2v11.8l3.3 3v4H11v-4l3.3-3V20.2l-3.8-3.2V9.5z" fill="${fill}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <rect x="14.5" y="20" width="16" height="12" fill="${shade}" opacity="0.65"/>
        <rect x="13" y="18.2" width="19" height="2.6" rx="1" fill="${accent}"/>
        <rect x="13" y="32" width="19" height="2.6" rx="1" fill="${accent}"/>`,
    N: `<ellipse cx="22.5" cy="39.5" rx="13.5" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <path d="M12 38.5v-3.8l4.5-4.8c-2.5-1.4-4.5-4.6-3.8-8.2l-3.2-1.8 4.2-7.5 4.8-4.2 3.2 2.6c5-.4 10.2 3.5 11.4 10.6 1 5.6-1 10.5-3.4 13.5l3.3 3.6H12z" fill="${fill}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M24 12.5c3.5 1.8 5.8 6.5 5.2 12.5-.5 4.5-2.6 7.4-5.2 9.2" fill="none" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="19.5" cy="16.5" r="1.8" fill="${accent}"/>
        <rect x="11.5" y="35.5" width="22" height="3.5" rx="1.4" fill="${shade}" stroke="${stroke}" stroke-width="1.6"/>`,
    B: `<ellipse cx="22.5" cy="39.5" rx="13" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <circle cx="22.5" cy="8.2" r="2.8" fill="${accent}" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M22.5 11.2c-6 3.5-8.5 9.5-6.8 15.8h13.6c1.7-6.3-.8-12.3-6.8-15.8z" fill="${fill}" stroke="${stroke}" stroke-width="1.9"/>
        <path d="M18.8 19.2h7.4M22.5 15.5v7.4" stroke="${accent}" stroke-width="2.3" stroke-linecap="round"/>
        <rect x="15" y="27" width="15" height="3" rx="1.2" fill="${accent}" stroke="${stroke}" stroke-width="1.2"/>
        <path d="M11.5 36.2c2.2-3.5 6.2-5 11-5s8.8 1.5 11 5v3.2h-22v-3.2z" fill="${shade}" stroke="${stroke}" stroke-width="1.9"/>`,
    Q: `<ellipse cx="22.5" cy="39.5" rx="14" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <path d="M8.5 14.5l6.2 13.5 7.8-16.5L30.3 28l6.2-13.5-3.2 19.5H11.7L8.5 14.5z" fill="${fill}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <circle cx="8.5" cy="12.5" r="2.5" fill="${accent}" stroke="${stroke}" stroke-width="1.2"/>
        <circle cx="15.5" cy="10.2" r="2.2" fill="${accent}" stroke="${stroke}" stroke-width="1.2"/>
        <circle cx="22.5" cy="8.5" r="2.8" fill="${accent}" stroke="${stroke}" stroke-width="1.2"/>
        <circle cx="29.5" cy="10.2" r="2.2" fill="${accent}" stroke="${stroke}" stroke-width="1.2"/>
        <circle cx="36.5" cy="12.5" r="2.5" fill="${accent}" stroke="${stroke}" stroke-width="1.2"/>
        <rect x="11" y="33.8" width="23" height="5.4" rx="2" fill="${shade}" stroke="${stroke}" stroke-width="1.9"/>
        <line x1="13" y1="31.2" x2="32" y2="31.2" stroke="${accent}" stroke-width="2.2"/>`,
    K: `<ellipse cx="22.5" cy="39.5" rx="14" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <path d="M22.5 5.2v9.2M18 9.2h9" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
        <path d="M13.5 30c-4.5-4.5-4.5-11.8 2-14.2 3.2-1.2 5.4.8 7 3.2 1.6-2.4 3.8-4.4 7-3.2 6.5 2.4 6.5 9.7 2 14.2l1.2 4.2H12.3l1.2-4.2z" fill="${fill}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <line x1="22.5" y1="18.5" x2="22.5" y2="31" stroke="${accent}" stroke-width="2"/>
        <rect x="11" y="34" width="23" height="5.4" rx="2" fill="${shade}" stroke="${stroke}" stroke-width="1.9"/>`
  };

  return `<svg viewBox="0 0 45 45" aria-hidden="true">${shapes[type] || ''}</svg>`;
}

class ChessApp {
  constructor() {
    this.engine = new Chess960Engine(Math.floor(Math.random() * 960));
    this.sound = new SoundFX();
    this.ai = new ChessAI();

    this.mode = 'ai-normal';
    this.flipped = false;
    this.selected = null;
    this.legalForSelected = [];
    this.showAttackMap = false;
    this.showThreatLines = true;
    this.aiBusy = false;
    this.isAnimating = false;
    this.hiddenSquares = new Set();
    this.pendingPromo = null;

    this.pieceRenderer = defaultPieceSvg;

    this._cacheDom();
    this.fx = new CombatFX(this.dom.fxCanvas, this.dom.boardWrapper);
    this._bindEvents();
    this._syncInputs();
    this.render();
  }

  _cacheDom() {
    const $ = (id) => document.getElementById(id);
    this.dom = {
      modeSelect: $('mode-select'),
      btnRandom960: $('btn-random-960'),
      posInput: $('pos-input'),
      btnLoadPos: $('btn-load-pos'),
      btnClassic: $('btn-classic'),
      boardWrapper: $('board-wrapper'),
      boardGrid: $('board-grid'),
      tacticalSvg: $('tactical-svg'),
      fxCanvas: $('fx-canvas'),
      topName: $('top-name'),
      bottomName: $('bottom-name'),
      topDot: $('top-dot'),
      bottomDot: $('bottom-dot'),
      materialTop: $('material-top'),
      materialBottom: $('material-bottom'),
      capturedTop: $('captured-top'),
      capturedBottom: $('captured-bottom'),
      btnFlip: $('btn-flip'),
      btnUndo: $('btn-undo'),
      btnAttackMap: $('btn-attack-map'),
      btnThreatLines: $('btn-threat-lines'),
      btnSound: $('btn-sound'),
      posBadge: $('pos-badge'),
      turnPill: $('turn-pill'),
      statusText: $('status-text'),
      fxPreviewGrid: $('fx-preview-grid'),
      movesList: $('moves-list'),
      btnCopyPgn: $('btn-copy-pgn'),
      promoModal: $('promo-modal'),
      promoChoices: $('promo-choices'),
      gameoverModal: $('gameover-modal'),
      gameoverTitle: $('gameover-title'),
      gameoverSubtitle: $('gameover-subtitle'),
      btnRematch: $('btn-rematch'),
      btnCloseGameover: $('btn-close-gameover')
    };
  }

  _bindEvents() {
    this.dom.modeSelect.addEventListener('change', (e) => {
      this.mode = e.target.value;
      this._updatePlayerLabels();
      if (this._isAiTurn() && !this.isAnimating) this._scheduleAiMove();
    });

    this.dom.btnRandom960.addEventListener('click', () => {
      this.startNewGame(Math.floor(Math.random() * 960));
    });

    this.dom.btnLoadPos.addEventListener('click', () => {
      const val = parseInt(this.dom.posInput.value, 10);
      this.startNewGame(isNaN(val) ? 518 : val);
    });

    this.dom.btnClassic.addEventListener('click', () => this.startNewGame(518));

    this.dom.btnFlip.addEventListener('click', () => {
      this.flipped = !this.flipped;
      this.render();
    });

    this.dom.btnUndo.addEventListener('click', () => this.handleUndo());

    this.dom.btnAttackMap.addEventListener('click', () => {
      this.showAttackMap = !this.showAttackMap;
      this.dom.btnAttackMap.classList.toggle('active', this.showAttackMap);
      this.render();
    });

    this.dom.btnThreatLines.addEventListener('click', () => {
      this.showThreatLines = !this.showThreatLines;
      this.dom.btnThreatLines.classList.toggle('active', this.showThreatLines);
      this._renderTacticalLines();
    });

    this.dom.btnSound.addEventListener('click', () => {
      const on = this.sound.toggle();
      this.dom.btnSound.classList.toggle('active', on);
      this.dom.btnSound.textContent = on ? '🔊 Sonido' : '🔇 Silencio';
    });

    // Vista previa interactiva con piezas fantasma y sonido completo
    this.dom.fxPreviewGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.fx-btn');
      if (!btn) return;
      const pieceType = btn.dataset.fx;
      this._playArsenalPreview(pieceType, btn);
    });

    this.dom.btnCopyPgn.addEventListener('click', () => this._copyHistory());

    this.dom.btnRematch.addEventListener('click', () => {
      this.dom.gameoverModal.classList.add('hidden');
      this.startNewGame(Math.floor(Math.random() * 960));
    });

    this.dom.btnCloseGameover.addEventListener('click', () => {
      this.dom.gameoverModal.classList.add('hidden');
    });
  }

  _playArsenalPreview(pieceType, btn) {
    const samples = {
      P: { from: { r: 5, c: 3 }, to: { r: 4, c: 4 }, victim: 'P' },
      N: { from: { r: 5, c: 2 }, to: { r: 3, c: 3 }, victim: 'B' },
      B: { from: { r: 6, c: 1 }, to: { r: 2, c: 5 }, victim: 'N' },
      R: { from: { r: 6, c: 3 }, to: { r: 2, c: 3 }, victim: 'R' },
      Q: { from: { r: 6, c: 4 }, to: { r: 2, c: 4 }, victim: 'Q' },
      K: { from: { r: 4, c: 3 }, to: { r: 3, c: 4 }, victim: 'R' }
    };
    const s = samples[pieceType] || samples.Q;

    btn.style.borderColor = '#facc15';
    setTimeout(() => { btn.style.borderColor = ''; }, 700);

    this.fx.playCombatSequence({
      pieceType,
      attackerHtml: this.pieceRenderer(pieceType, 'w'),
      victimHtml: this.pieceRenderer(s.victim, 'b'),
      from: s.from,
      to: s.to,
      flipped: this.flipped,
      isPreview: true,
      onCharge: () => this.sound.playCharge(pieceType),
      onImpact: () => this.sound.playAttack(pieceType)
    });
  }

  setPieceRenderer(fn) {
    this.pieceRenderer = fn || defaultPieceSvg;
    this.render();
  }

  startNewGame(positionId) {
    this.aiBusy = false;
    this.isAnimating = false;
    this.hiddenSquares.clear();
    this.selected = null;
    this.legalForSelected = [];
    this.engine.reset(positionId);
    this._syncInputs();
    this.dom.gameoverModal.classList.add('hidden');
    this.render();
  }

  _syncInputs() {
    this.dom.posInput.value = this.engine.positionId;
    this.dom.posBadge.textContent = `Posición #${this.engine.positionId}`;
    this._updatePlayerLabels();
  }

  _isAiTurn() {
    return this.mode !== 'pvp' && this.engine.turn === 'b' && this.engine.status === 'playing';
  }

  _updatePlayerLabels() {
    const topIsBlack = !this.flipped;
    const blackLabel = this.mode === 'pvp' ? 'Negras (J2)' : (this.mode === 'ai-easy' ? 'Negras (IA Fácil)' : 'Negras (IA Normal)');
    const whiteLabel = this.mode === 'pvp' ? 'Blancas (J1)' : 'Blancas (Tú)';

    this.dom.topName.textContent = topIsBlack ? blackLabel : whiteLabel;
    this.dom.bottomName.textContent = topIsBlack ? whiteLabel : blackLabel;
    this.dom.topDot.className = topIsBlack ? 'dot dot-black' : 'dot dot-white';
    this.dom.bottomDot.className = topIsBlack ? 'dot dot-white' : 'dot dot-black';
  }

  handleSquareClick(r, c) {
    if (this.aiBusy || this.isAnimating || this.engine.status !== 'playing') return;
    if (this._isAiTurn()) return;

    if (this.selected) {
      const candidates = this._matchMovesForClick(r, c);
      if (candidates.length > 0) {
        if (candidates.length > 1 && candidates[0].promo) {
          this._openPromoModal(candidates);
        } else {
          this._executeMove(candidates[0]);
        }
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
      this.render();
    } else {
      this.selected = null;
      this.legalForSelected = [];
      this.render();
    }
  }

  _matchMovesForClick(r, c) {
    const direct = this.legalForSelected.filter(m => m.to.r === r && m.to.c === c);
    if (direct.length > 0) return direct;

    const castleByDest = this.legalForSelected.filter(
      m => m.castle && m.from.r === r && m.kingToCol === c
    );
    if (castleByDest.length > 0) return castleByDest;

    return [];
  }

  _openPromoModal(promoMoves) {
    this.pendingPromo = promoMoves;
    const color = this.engine.turn;
    this.dom.promoChoices.innerHTML = '';

    ['Q', 'R', 'B', 'N'].forEach((type) => {
      const move = promoMoves.find(m => m.promo === type);
      const btn = document.createElement('button');
      btn.className = 'promo-choice';
      btn.innerHTML = this.pieceRenderer(type, color);
      btn.addEventListener('click', () => {
        this.dom.promoModal.classList.add('hidden');
        this.pendingPromo = null;
        if (move) this._executeMove(move);
      });
      this.dom.promoChoices.appendChild(btn);
    });

    this.dom.promoModal.classList.remove('hidden');
  }

  _executeMove(move) {
    const moverColor = this.engine.turn;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const record = this.engine.makeMove(move);

    this.selected = null;
    this.legalForSelected = [];
    this.isAnimating = true;
    this.hiddenSquares.clear();

    const finishMove = () => {
      this.hiddenSquares.clear();
      this.isAnimating = false;
      this.render();

      if (record.inCheck && this.engine.status === 'playing') {
        this.sound.playCheck();
      }

      if (this.engine.status !== 'playing') {
        this._handleGameOver();
        return;
      }

      if (this._isAiTurn()) {
        this._scheduleAiMove();
      }
    };

    if (record.castle) {
      const row = record.from.r;
      this.hiddenSquares.add(`${row},${record.kingToCol}`);
      this.hiddenSquares.add(`${row},${record.rookToCol}`);
      this.render();
      this.sound.playCastle();

      this.fx.animateCastle({
        kingHtml: this.pieceRenderer('K', moverColor),
        rookHtml: this.pieceRenderer('R', moverColor),
        row,
        kingFrom: record.from.c,
        kingTo: record.kingToCol,
        rookFrom: record.rookFromCol,
        rookTo: record.rookToCol,
        flipped: this.flipped,
        onComplete: finishMove
      });
      return;
    }

    if (record.captured) {
      const victimSq = record.ep
        ? { r: record.from.r, c: record.to.c }
        : { r: record.to.r, c: record.to.c };

      this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
      this.render();

      this.fx.playCombatSequence({
        pieceType: record.piece,
        attackerHtml: this.pieceRenderer(record.promo || record.piece, moverColor),
        victimHtml: this.pieceRenderer(record.captured, enemyColor),
        from: record.from,
        to: record.to,
        victimSq,
        flipped: this.flipped,
        onCharge: () => this.sound.playCharge(record.piece),
        onImpact: () => this.sound.playAttack(record.piece),
        onComplete: finishMove
      });
      return;
    }

    // Movimiento normal fluido
    this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
    this.render();
    this.sound.playMove(record.piece);

    this.fx.animateRegularMove({
      pieceHtml: this.pieceRenderer(record.promo || record.piece, moverColor),
      pieceType: record.piece,
      from: record.from,
      to: record.to,
      flipped: this.flipped,
      onComplete: finishMove
    });
  }

  _scheduleAiMove() {
    this.aiBusy = true;
    this.dom.statusText.textContent = 'La IA está calculando respuesta táctica...';

    setTimeout(() => {
      if (this.engine.status !== 'playing') {
        this.aiBusy = false;
        return;
      }
      const best = this.ai.getBestMove(this.engine, this.mode);
      this.aiBusy = false;
      if (best) this._executeMove(best);
    }, 340);
  }

  handleUndo() {
    if (this.aiBusy || this.isAnimating || this.engine.history.length === 0) return;
    this.dom.gameoverModal.classList.add('hidden');

    if (this.mode !== 'pvp' && this.engine.turn === 'w' && this.engine.history.length >= 2) {
      this.engine.undo();
      this.engine.undo();
    } else {
      this.engine.undo();
    }

    this.selected = null;
    this.legalForSelected = [];
    this.render();
  }

  _handleGameOver() {
    let title = 'Tablas';
    let subtitle = 'Empate por regla o material insuficiente.';

    if (this.engine.status === 'checkmate') {
      const winText = this.engine.winner === 'w' ? 'Blancas' : 'Negras';
      title = `¡Jaque Mate! Ganan ${winText}`;
      subtitle = `Partida finalizada en la posición Fischer #${this.engine.positionId}.`;
      this.sound.playGameOver(this.engine.winner === 'w');
    } else if (this.engine.status === 'stalemate') {
      title = 'Tablas por Ahogado';
      subtitle = 'El bando al turno no tiene jugadas legales y no está en jaque.';
    }

    this.dom.gameoverTitle.textContent = title;
    this.dom.gameoverSubtitle.textContent = subtitle;
    this.dom.gameoverModal.classList.remove('hidden');
  }

  _copyHistory() {
    const lines = [];
    for (let i = 0; i < this.engine.history.length; i += 2) {
      const num = Math.floor(i / 2) + 1;
      const w = this.engine.history[i]?.san || '';
      const b = this.engine.history[i + 1]?.san || '';
      lines.push(`${num}. ${w}${b ? ' ' + b : ''}`);
    }
    const text = `[Chess960 #${this.engine.positionId}]\n${lines.join(' ')}`;
    navigator.clipboard?.writeText(text).then(() => {
      this.dom.btnCopyPgn.textContent = '✓ Copiado';
      setTimeout(() => (this.dom.btnCopyPgn.textContent = '📋 Copiar'), 1400);
    });
  }

  render() {
    this._updatePlayerLabels();
    this._renderBoard();
    this._renderTacticalLines();
    this._renderStatusAndHistory();
  }

  _renderBoard() {
    const grid = this.dom.boardGrid;
    grid.innerHTML = '';

    const attackMap = this.showAttackMap ? this.engine.getAttackMap() : null;
    const lastMove = this.engine.history[this.engine.history.length - 1] || null;
    const checkKing = this.engine.isInCheck(this.engine.turn)
      ? this.engine.findKing(this.engine.turn)
      : null;

    for (let vr = 0; vr < 8; vr++) {
      for (let vc = 0; vc < 8; vc++) {
        const r = this.flipped ? 7 - vr : vr;
        const c = this.flipped ? 7 - vc : vc;

        const sq = document.createElement('div');
        sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;

        if (lastMove) {
          const toCol = lastMove.castle ? lastMove.kingToCol : lastMove.to.c;
          if (lastMove.from.r === r && lastMove.from.c === c) sq.classList.add('last-from');
          if (lastMove.to.r === r && toCol === c) sq.classList.add('last-to');
        }

        if (this.selected && this.selected.r === r && this.selected.c === c) {
          sq.classList.add('selected');
        }

        if (checkKing && checkKing.r === r && checkKing.c === c) {
          sq.classList.add('in-check');
        }

        if (attackMap) {
          const cell = attackMap[r][c];
          if (cell.w && cell.b) sq.classList.add('atk-both');
          else if (cell.w) sq.classList.add('atk-w');
          else if (cell.b) sq.classList.add('atk-b');
        }

        const matching = this.legalForSelected.filter(m => m.to.r === r && m.to.c === c);
        const castleMatch = matching.find(m => m.castle);
        if (castleMatch) {
          sq.classList.add('castle-target');
        } else if (matching.length > 0) {
          const isCap = matching.some(m => m.captured || m.ep);
          const marker = document.createElement('div');
          marker.className = isCap ? 'capture-ring' : 'move-dot';
          sq.appendChild(marker);
        }

        if (vc === 0) {
          const rankEl = document.createElement('span');
          rankEl.className = 'coord-rank';
          rankEl.textContent = 8 - r;
          sq.appendChild(rankEl);
        }
        if (vr === 7) {
          const fileEl = document.createElement('span');
          fileEl.className = 'coord-file';
          fileEl.textContent = FILES[c];
          sq.appendChild(fileEl);
        }

        const piece = this.engine.board[r][c];
        if (piece && !this.hiddenSquares.has(`${r},${c}`)) {
          const wrap = document.createElement('div');
          wrap.className = 'piece-wrap';
          wrap.innerHTML = this.pieceRenderer(piece.type, piece.color);
          sq.appendChild(wrap);
        }

        sq.addEventListener('click', () => this.handleSquareClick(r, c));
        grid.appendChild(sq);
      }
    }
  }

  _renderTacticalLines() {
    const svg = this.dom.tacticalSvg;
    svg.innerHTML = '';
    if (!this.showThreatLines) return;

    const threats = this.engine.getActiveThreats();
    const ns = 'http://www.w3.org/2000/svg';

    for (const th of threats) {
      const vr1 = this.flipped ? 7 - th.from.r : th.from.r;
      const vc1 = this.flipped ? 7 - th.from.c : th.from.c;
      const vr2 = this.flipped ? 7 - th.to.r : th.to.r;
      const vc2 = this.flipped ? 7 - th.to.c : th.to.c;

      const x1 = vc1 * 100 + 50;
      const y1 = vr1 * 100 + 50;
      const x2 = vc2 * 100 + 50;
      const y2 = vr2 * 100 + 50;
      const stroke = th.color === 'w' ? 'rgba(56, 189, 248, 0.52)' : 'rgba(244, 63, 94, 0.55)';

      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', stroke);
      line.setAttribute('stroke-width', '4');
      line.setAttribute('stroke-dasharray', '10 7');
      svg.appendChild(line);

      const reticle = document.createElementNS(ns, 'circle');
      reticle.setAttribute('cx', x2);
      reticle.setAttribute('cy', y2);
      reticle.setAttribute('r', '26');
      reticle.setAttribute('fill', 'none');
      reticle.setAttribute('stroke', stroke);
      reticle.setAttribute('stroke-width', '3');
      svg.appendChild(reticle);
    }
  }

  _renderStatusAndHistory() {
    const turnName = this.engine.turn === 'w' ? 'Blancas' : 'Negras';
    this.dom.turnPill.textContent = `Turno: ${turnName}`;

    if (this.engine.status === 'playing') {
      if (this.engine.isInCheck(this.engine.turn)) {
        this.dom.statusText.textContent = `¡Jaque a las ${turnName}! Debes proteger al Rey.`;
      } else {
        this.dom.statusText.textContent =
          'Selecciona una pieza. Para enroque 960, toca el Rey y luego su Torre iluminada en dorado.';
      }
    } else if (this.engine.status === 'checkmate') {
      this.dom.statusText.textContent = `Jaque mate. Victoria de ${this.engine.winner === 'w' ? 'Blancas' : 'Negras'}.`;
    } else {
      this.dom.statusText.textContent = 'Partida finalizada en tablas.';
    }

    const topColor = this.flipped ? 'w' : 'b';
    const bottomColor = this.flipped ? 'b' : 'w';
    const capRender = (byColor) => {
      const victimColor = byColor === 'w' ? 'b' : 'w';
      return this.engine.captured[byColor].map(t => UNICODE_CAPTURED[victimColor][t]).join('');
    };

    this.dom.capturedTop.textContent = capRender(topColor);
    this.dom.capturedBottom.textContent = capRender(bottomColor);

    const bal = this.engine.getMaterialBalance();
    const topBal = topColor === 'w' ? bal : -bal;
    const bottomBal = bottomColor === 'w' ? bal : -bal;
    this.dom.materialTop.textContent = topBal > 0 ? `+${topBal}` : '';
    this.dom.materialBottom.textContent = bottomBal > 0 ? `+${bottomBal}` : '';

    const list = this.dom.movesList;
    list.innerHTML = '';
    for (let i = 0; i < this.engine.history.length; i += 2) {
      const row = document.createElement('div');
      row.className = 'move-row';
      const num = Math.floor(i / 2) + 1;
      const wSan = this.engine.history[i]?.san || '';
      const bSan = this.engine.history[i + 1]?.san || '';
      row.innerHTML = `<span class="move-num">${num}.</span><span>${wSan}</span><span>${bSan}</span>`;
      list.appendChild(row);
    }
    list.scrollTop = list.scrollHeight;
  }
}

window.chessApp = new ChessApp();
