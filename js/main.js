import { Chess960Engine, FILES } from './engine.js';
import { SoundFX } from './audio.js';
import { CombatFX } from './fx.js';
import { ChessAI } from './ai.js';
import { ThemeManager, THEMES } from './themes.js';
import { FischerClock } from './clock.js';
import { GameAnalyzer, CLASS_META } from './analyzer.js';

const UNICODE_CAPTURED = {
  w: { P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' },
  b: { P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚' }
};

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
    this.showThreatLines = false;
    this.aiBusy = false;
    this.isAnimating = false;
    this.hiddenSquares = new Set();
    this.pendingPromo = null;

    // Estado de revisión post-partida (null durante juego normal)
    this.reviewFrame = null;
    this.analysisResults = null;

    this.pieceRenderer = THEMES.neon.renderPiece;

    this._cacheDom();
    this._mountResignButton();
    this.fx = new CombatFX(this.dom.fxCanvas, this.dom.boardWrapper);

    this.dom.btnThreatLines.classList.remove('active');
    this.dom.btnThreatLines.textContent = '🎯 Mira al Seleccionar';

    // Fase 2: Gestor de Temas
    this.themes = new ThemeManager({
      slotEl: this.dom.themeSlot,
      onThemeChange: (theme) => {
        this.fx.setPalette(theme.fxPalette);
        this.setPieceRenderer(theme.renderPiece);
      }
    });

    // Fase 3: Reloj con Incremento Fischer
    this.clock = new FischerClock({
      topSlotEl: this.dom.clockTopSlot,
      bottomSlotEl: this.dom.clockBottomSlot,
      controlsHostEl: this.dom.themeSlot,
      onTimeout: (loser, winner) => this._handleTimeout(loser, winner)
    });
    this.clock.applyModeDefault(this.mode);

    // Fase 4: Analizador Post-Partida
    this.analyzer = new GameAnalyzer({
      postgameSlotEl: this.dom.postgameSlot,
      modalActionsEl: this.dom.gameoverActions,
      onAnalysisReady: (results) => {
        this.analysisResults = results;
        this._renderStatusAndHistory();
      },
      onReviewStep: (frame) => {
        this.reviewFrame = frame;
        this.selected = null;
        this.legalForSelected = [];
        this.render();
      },
      onExitReview: () => {
        this.reviewFrame = null;
        this.render();
      }
    });

    this._bindEvents();
    this._syncInputs();
    this.render();
  }

  _cacheDom() {
    const $ = (id) => document.getElementById(id);
    this.dom = {
      modeSelect: $('mode-select'),
      themeSlot: $('theme-slot'),
      clockTopSlot: $('clock-top-slot'),
      clockBottomSlot: $('clock-bottom-slot'),
      postgameSlot: $('postgame-slot'),
      gameoverActions: $('gameover-actions'),
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

  _mountResignButton() {
    const toolbar = document.querySelector('.board-toolbar');
    if (!toolbar) return;
    const btn = document.createElement('button');
    btn.id = 'btn-resign';
    btn.className = 'btn btn-ghost';
    btn.textContent = '🏳 Rendirse';
    btn.title = 'Finalizar partida para analizar tus jugadas';
    btn.addEventListener('click', () => this.handleResign());
    toolbar.appendChild(btn);
    this.dom.btnResign = btn;
  }

  _bindEvents() {
    this.dom.modeSelect.addEventListener('change', (e) => {
      this.mode = e.target.value;
      this.clock.applyModeDefault(this.mode);
      this._updatePlayerLabels();
      if (this._isAiTurn() && !this.isAnimating && !this.reviewFrame) this._scheduleAiMove();
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
      this.clock.syncOrientation(this.flipped);
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
    this.pieceRenderer = fn || THEMES.neon.renderPiece;
    if (this.dom?.boardGrid) this.render();
  }

  startNewGame(positionId) {
    this.aiBusy = false;
    this.isAnimating = false;
    this.hiddenSquares.clear();
    this.selected = null;
    this.legalForSelected = [];
    this.reviewFrame = null;
    this.analysisResults = null;
    this.analyzer.reset();
    this.engine.reset(positionId);
    this.clock.reset();
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
    if (this.reviewFrame) return;
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

    this.clock.pause();

    const finishMove = () => {
      this.hiddenSquares.clear();
      this.isAnimating = false;
      this.render();

      if (record.inCheck && this.engine.status === 'playing') {
        this.sound.playCheck();
      }

      if (this.engine.status !== 'playing') {
        this.clock.stop();
        this._handleGameOver();
        return;
      }

      this.clock.onMoveCompleted(moverColor, this.engine.turn);

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
    this.reviewFrame = null;
    this.analysisResults = null;
    this.analyzer.reset();

    if (this.mode !== 'pvp' && this.engine.turn === 'w' && this.engine.history.length >= 2) {
      this.engine.undo();
      this.engine.undo();
    } else {
      this.engine.undo();
    }

    this.selected = null;
    this.legalForSelected = [];
    this.clock.syncTurnAfterUndo(this.engine.turn);
    this.render();
  }

  handleResign() {
    if (this.aiBusy || this.isAnimating || this.engine.status !== 'playing' || this.engine.history.length === 0) {
      return;
    }
    const loser = this.mode === 'pvp' ? this.engine.turn : 'w';
    const winner = loser === 'w' ? 'b' : 'w';
    this.engine.status = 'resigned';
    this.engine.winner = winner;
    this.clock.stop();
    this.selected = null;
    this.legalForSelected = [];
    this.render();

    const winText = winner === 'w' ? 'Blancas' : 'Negras';
    const loseText = loser === 'w' ? 'Blancas' : 'Negras';
    this.sound.playGameOver(false);

    this.dom.gameoverTitle.textContent = `🏳 Rendición — Ganan ${winText}`;
    this.dom.gameoverSubtitle.textContent = `Las ${loseText} se rindieron tras ${this.engine.history.length} medias jugadas. Ya puedes analizar la partida.`;
    this.analyzer.onGameOver(this.engine);
    this.dom.gameoverModal.classList.remove('hidden');
  }

  _handleTimeout(loser, winner) {
    if (this.engine.status !== 'playing') return;
    this.engine.status = 'timeout';
    this.engine.winner = winner;
    this.aiBusy = false;
    this.selected = null;
    this.legalForSelected = [];
    this.render();

    const winText = winner === 'w' ? 'Blancas' : 'Negras';
    const loseText = loser === 'w' ? 'Blancas' : 'Negras';
    this.sound.playGameOver(winner === 'w');

    this.dom.gameoverTitle.textContent = `⏱ ¡Tiempo Agotado! Ganan ${winText}`;
    this.dom.gameoverSubtitle.textContent = `A las ${loseText} se les acabó el reloj Fischer en la posición #${this.engine.positionId}.`;
    this.analyzer.onGameOver(this.engine);
    this.dom.gameoverModal.classList.remove('hidden');
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
    this.analyzer.onGameOver(this.engine);
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

    const activeEngine = this.reviewFrame ? this.reviewFrame.engine : this.engine;
    const attackMap = this.showAttackMap ? activeEngine.getAttackMap() : null;
    const lastMove = this.reviewFrame
      ? this.reviewFrame.lastMove
      : (this.engine.history[this.engine.history.length - 1] || null);
    const checkKing = activeEngine.isInCheck(activeEngine.turn)
      ? activeEngine.findKing(activeEngine.turn)
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

        if (!this.reviewFrame && this.selected && this.selected.r === r && this.selected.c === c) {
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

        if (!this.reviewFrame) {
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

        const piece = activeEngine.board[r][c];
        const isHidden = !this.reviewFrame && this.hiddenSquares.has(`${r},${c}`);
        if (piece && !isHidden) {
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

    // En modo revisión, el analizador dibuja su flecha verde de Mejor Jugada y la insignia
    if (this.reviewFrame) {
      this.analyzer.renderBoardOverlay(svg, this.flipped);
      return;
    }

    if (!this.showThreatLines || !this.selected) return;

    const captures = [];
    const seen = new Set();
    for (const m of this.legalForSelected) {
      if (!m.captured && !m.ep) continue;
      const key = `${m.to.r},${m.to.c}`;
      if (seen.has(key)) continue;
      seen.add(key);
      captures.push(m);
    }

    if (captures.length === 0) return;

    const ns = 'http://www.w3.org/2000/svg';
    const vr1 = this.flipped ? 7 - this.selected.r : this.selected.r;
    const vc1 = this.flipped ? 7 - this.selected.c : this.selected.c;
    const x1 = vc1 * 100 + 50;
    const y1 = vr1 * 100 + 50;

    for (const m of captures) {
      const vr2 = this.flipped ? 7 - m.to.r : m.to.r;
      const vc2 = this.flipped ? 7 - m.to.c : m.to.c;
      const x2 = vc2 * 100 + 50;
      const y2 = vr2 * 100 + 50;
      const stroke = 'rgba(244, 63, 94, 0.78)';

      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', stroke);
      line.setAttribute('stroke-width', '4.5');
      line.setAttribute('stroke-dasharray', '10 7');
      svg.appendChild(line);

      const reticle = document.createElementNS(ns, 'circle');
      reticle.setAttribute('cx', x2);
      reticle.setAttribute('cy', y2);
      reticle.setAttribute('r', '28');
      reticle.setAttribute('fill', 'none');
      reticle.setAttribute('stroke', stroke);
      reticle.setAttribute('stroke-width', '3.5');
      svg.appendChild(reticle);
    }
  }

  _renderStatusAndHistory() {
    const activeEngine = this.reviewFrame ? this.reviewFrame.engine : this.engine;
    const turnName = activeEngine.turn === 'w' ? 'Blancas' : 'Negras';

    if (this.dom.btnResign) {
      const canResign = this.engine.status === 'playing' && this.engine.history.length > 0 && !this.reviewFrame;
      this.dom.btnResign.disabled = !canResign;
      this.dom.btnResign.style.opacity = canResign ? '1' : '0.4';
    }

    if (this.reviewFrame) {
      this.dom.turnPill.textContent = `Revisión: Jugada ${this.reviewFrame.ply}/${this.engine.history.length}`;
      this.dom.statusText.textContent = 'Modo Revisión Post-Partida activo. Usa ◀ ▶ o toca cualquier jugada en el historial.';
    } else {
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
      } else if (this.engine.status === 'timeout') {
        this.dom.statusText.textContent = `Tiempo agotado. Victoria de ${this.engine.winner === 'w' ? 'Blancas' : 'Negras'}.`;
      } else if (this.engine.status === 'resigned') {
        this.dom.statusText.textContent = `Rendición. Victoria de ${this.engine.winner === 'w' ? 'Blancas' : 'Negras'}.`;
      } else {
        this.dom.statusText.textContent = 'Partida finalizada en tablas.';
      }
    }

    const topColor = this.flipped ? 'w' : 'b';
    const bottomColor = this.flipped ? 'b' : 'w';
    const capRender = (byColor) => {
      const victimColor = byColor === 'w' ? 'b' : 'w';
      return activeEngine.captured[byColor].map(t => UNICODE_CAPTURED[victimColor][t]).join('');
    };

    this.dom.capturedTop.textContent = capRender(topColor);
    this.dom.capturedBottom.textContent = capRender(bottomColor);

    const bal = activeEngine.getMaterialBalance();
    const topBal = topColor === 'w' ? bal : -bal;
    const bottomBal = bottomColor === 'w' ? bal : -bal;
    this.dom.materialTop.textContent = topBal > 0 ? `+${topBal}` : '';
    this.dom.materialBottom.textContent = bottomBal > 0 ? `+${bottomBal}` : '';

    // Historial (enriquecido con insignias y clics cuando existe análisis)
    const list = this.dom.movesList;
    list.innerHTML = '';

    const buildCell = (plyIdx, san) => {
      const span = document.createElement('span');
      span.className = 'move-cell';
      if (!san) return span;

      span.textContent = san;
      const res = this.analysisResults ? this.analysisResults[plyIdx] : null;
      if (res) {
        const meta = CLASS_META[res.classification];
        const tag = document.createElement('span');
        tag.className = 'move-tag';
        tag.textContent = meta.code;
        tag.style.color = meta.color;
        tag.style.background = meta.bg;
        span.appendChild(tag);
        span.classList.add('clickable');
        if (this.reviewFrame && this.reviewFrame.ply === plyIdx + 1) {
          span.classList.add('review-active');
        }
        span.addEventListener('click', () => this.analyzer.goToPly(plyIdx + 1));
      }
      return span;
    };

    for (let i = 0; i < this.engine.history.length; i += 2) {
      const row = document.createElement('div');
      row.className = 'move-row';
      const num = document.createElement('span');
      num.className = 'move-num';
      num.textContent = `${Math.floor(i / 2) + 1}.`;

      row.appendChild(num);
      row.appendChild(buildCell(i, this.engine.history[i]?.san || ''));
      row.appendChild(buildCell(i + 1, this.engine.history[i + 1]?.san || ''));
      list.appendChild(row);
    }

    if (!this.reviewFrame) {
      list.scrollTop = list.scrollHeight;
    }
  }
}

window.chessApp = new ChessApp();
