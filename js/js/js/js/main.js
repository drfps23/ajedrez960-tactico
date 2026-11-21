import { Chess960Engine, FILES } from './engine.js';
import { SoundFX } from './audio.js';
import { CombatFX } from './fx.js';
import { ChessAI } from './ai.js';

const UNICODE_CAPTURED = {
  w: { P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' },
  b: { P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚' }
};

/**
 * Renderizador SVG base de las piezas (en Fase 2 será extensible por themes.js).
 */
export function defaultPieceSvg(type, color) {
  const fill = color === 'w' ? '#f8fafc' : '#1e293b';
  const stroke = color === 'w' ? '#0f172a' : '#38bdf8';
  const accent = color === 'w' ? '#38bdf8' : '#f43f5e';

  const shapes = {
    P: `<circle cx="22.5" cy="14" r="5.5" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <path d="M16 21h13l-2 9h-9l-2-9z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <path d="M11 36c0-4 5-6 11.5-6S34 32 34 36v3H11v-3z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`,
    R: `<path d="M10 10h5v4h4v-4h7v4h4v-4h5v8l-4 3v12l3 3v3H11v-3l3-3V21l-4-3v-8z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <line x1="14" y1="21" x2="31" y2="21" stroke="${accent}" stroke-width="2"/>`,
    N: `<path d="M14 39v-4l4-5c-3-1-5-4-4-8l-3-2 4-7 4-4 3 3c4 0 8 4 9 10 1 5-1 10-3 13l3 4H14z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="22" cy="16" r="1.6" fill="${accent}"/>`,
    B: `<circle cx="22.5" cy="8.5" r="2.6" fill="${accent}" stroke="${stroke}" stroke-width="1.6"/>
        <path d="M22.5 11.5c-5.5 3-8 8.5-6.5 14.5h13c1.5-6-1-11.5-6.5-14.5z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <line x1="19" y1="19" x2="26" y2="19" stroke="${accent}" stroke-width="2"/>
        <line x1="22.5" y1="15.5" x2="22.5" y2="22.5" stroke="${accent}" stroke-width="2"/>
        <path d="M12 36c2-3 6-4 10.5-4s8.5 1 10.5 4v3H12v-3z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`,
    Q: `<path d="M9 15l6 13 7.5-16L30 28l6-13-3 19H12L9 15z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="9" cy="13" r="2.2" fill="${accent}"/>
        <circle cx="22.5" cy="10" r="2.5" fill="${accent}"/>
        <circle cx="36" cy="13" r="2.2" fill="${accent}"/>
        <rect x="11" y="34" width="23" height="5" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`,
    K: `<line x1="22.5" y1="6" x2="22.5" y2="14" stroke="${accent}" stroke-width="2.6"/>
        <line x1="18.5" y1="9.5" x2="26.5" y2="9.5" stroke="${accent}" stroke-width="2.6"/>
        <path d="M14 29c-4-4-4-11 2-13 3-1 5 1 6.5 3 1.5-2 3.5-4 6.5-3 6 2 6 9 2 13l1 5H13l1-5z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <rect x="11" y="34" width="23" height="5" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
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
      if (this._isAiTurn()) this._scheduleAiMove();
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

    this.dom.fxPreviewGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.fx-btn');
      if (!btn) return;
      const pieceType = btn.dataset.fx;
      this.fx.triggerPreview(pieceType, this.flipped);
      this.sound.playAttack(pieceType);
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

  setPieceRenderer(fn) {
    this.pieceRenderer = fn || defaultPieceSvg;
    this.render();
  }

  startNewGame(positionId) {
    this.aiBusy = false;
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
    if (this.aiBusy || this.engine.status !== 'playing') return;
    if (this._isAiTurn()) return;

    // 1. Si hay una pieza seleccionada, comprobar si el clic corresponde a un movimiento legal
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

    // 2. Seleccionar pieza propia del turno actual
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
    // Coincidencia directa (incluye Rey -> su Torre en enroque 960)
    const direct = this.legalForSelected.filter(m => m.to.r === r && m.to.c === c);
    if (direct.length > 0) return direct;

    // Comodidad extra: permitir clicar la casilla destino del Rey (g/c) al enrocar si está libre
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
    const record = this.engine.makeMove(move);
    this.selected = null;
    this.legalForSelected = [];

    if (record.captured) {
      this.fx.triggerAttack({
        pieceType: record.piece,
        from: record.from,
        to: record.to,
        flipped: this.flipped
      });
      this.sound.playAttack(record.piece);
    } else if (record.castle) {
      this.sound.playCastle();
    } else {
      this.sound.playMove();
    }

    if (record.inCheck && this.engine.status === 'playing') {
      setTimeout(() => this.sound.playCheck(), 120);
    }

    this.render();

    if (this.engine.status !== 'playing') {
      this._handleGameOver();
      return;
    }

    if (this._isAiTurn()) {
      this._scheduleAiMove();
    }
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
    }, 320);
  }

  handleUndo() {
    if (this.aiBusy || this.engine.history.length === 0) return;
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

        // Indicadores de jugadas legales
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

        // Coordenadas en bordes
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

        // Pieza
        const piece = this.engine.board[r][c];
        if (piece) {
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

    // Capturadas y ventaja material
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

    // Historial
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
