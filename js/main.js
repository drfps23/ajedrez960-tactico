import { Chess960Engine, FILES } from './engine.js';
import { SoundFX } from './audio.js';
import { CombatFX } from './fx.js';
import { ChessAI } from './ai.js';
import { ThemeManager, THEMES } from './themes.js';
import { FischerClock } from './clock.js';
import { GameAnalyzer, CLASS_META } from './analyzer.js';
import { MultiplayerManager } from './multiplayer.js';

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
    this.onlineColor = null;
    this.flipped = false;
    this.selected = null;
    this.legalForSelected = [];
    this.showAttackMap = false;
    this.showThreatLines = false;
    this.aiBusy = false;
    this.isAnimating = false;
    this.hiddenSquares = new Set();
    this.defeatedKingSq = null;
    this.pendingPromo = null;

    this.reviewFrame = null;
    this.analysisResults = null;
    this._reviewAnimToken = 0;

    this.pieceRenderer = THEMES.neon.renderPiece;

    this._cacheDom();
    this._mountResignButton();
    this.fx = new CombatFX(this.dom.fxCanvas, this.dom.boardWrapper);

    this.dom.btnThreatLines.classList.remove('active');
    this.dom.btnThreatLines.textContent = '🎯 Mira al Seleccionar';

    // Fase 2: Temas y piezas
    this.themes = new ThemeManager({
      slotEl: this.dom.themeSlot,
      onThemeChange: (theme) => {
        this.fx.setPalette(theme.fxPalette);
        this.setPieceRenderer(theme.renderPiece);
      }
    });

    // Fase 3: Reloj Fischer
    this.clock = new FischerClock({
      topSlotEl: this.dom.clockTopSlot,
      bottomSlotEl: this.dom.clockBottomSlot,
      controlsHostEl: this.dom.themeSlot,
      onTimeout: (loser, winner) => this._handleTimeout(loser, winner, false)
    });
    this.clock.applyModeDefault(this.mode);

    // Fase 4: Analizador Post-Partida con Voz Fluida y Animaciones
    this.analyzer = new GameAnalyzer({
      postgameSlotEl: this.dom.postgameSlot,
      modalActionsEl: this.dom.gameoverActions,
      deferVoice: true,
      onAnalysisReady: (results) => {
        this.analysisResults = results;
        this._renderStatusAndHistory();
      },
      onReviewStep: (frame) => this._handleReviewStep(frame),
      onExitReview: () => {
        this._reviewAnimToken++;
        this.fx.cancelActive();
        this.hiddenSquares.clear();
        this.reviewFrame = null;
        this.defeatedKingSq = this.engine.status === 'checkmate'
          ? this.engine.findKing(this.engine.winner === 'w' ? 'b' : 'w')
          : null;
        this.render();
      }
    });

    // Fase 5: Multijugador Online
    this.mp = new MultiplayerManager({
      modeSelectEl: this.dom.modeSelect,
      sidePanelEl: this.dom.sidePanel,
      getHostConfig: () => ({
        positionId: this.engine.positionId,
        clockPresetId: this.clock.preset.id
      }),
      onMatchStart: ({ positionId, myColor, clockPresetId }) => {
        this._startOnlineMatch(positionId, myColor, clockPresetId);
      },
      onRemoteMove: (payload) => this._handleRemoteMove(payload),
      onRemoteResign: (loserColor) => this._finishResign(loserColor, true),
      onRemoteTimeout: (loser, winner) => this._handleTimeout(loser, winner, true),
      onPeerDisconnect: () => {
        this.clock.stop();
        this.render();
      }
    });

    this._bindEvents();
    this._syncInputs();

    const inviteRoom = this.mp.getPendingRoomFromUrl();
    if (inviteRoom) {
      this.mode = 'online';
      this.dom.modeSelect.value = 'online';
      this.clock.applyModeDefault('online');
      this.mp.setVisible(true);
      this.mp.joinRoom(inviteRoom);
    }

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
      sidePanel: document.querySelector('.side-panel'),
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
      const prevMode = this.mode;
      this.mode = e.target.value;

      if (prevMode === 'online' && this.mode !== 'online') {
        this.mp.disconnect(true);
        this.onlineColor = null;
      }

      this.mp.setVisible(this.mode === 'online');
      this.clock.applyModeDefault(this.mode);
      this._updatePlayerLabels();
      this.render();

      if (this._isAiTurn() && !this.isAnimating && !this.reviewFrame) {
        this._scheduleAiMove();
      }
    });

    this.dom.btnRandom960.addEventListener('click', () => {
      this._requestNewPosition(Math.floor(Math.random() * 960));
    });

    this.dom.btnLoadPos.addEventListener('click', () => {
      const val = parseInt(this.dom.posInput.value, 10);
      this._requestNewPosition(isNaN(val) ? 518 : val);
    });

    this.dom.btnClassic.addEventListener('click', () => this._requestNewPosition(518));

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
      this._requestNewPosition(Math.floor(Math.random() * 960));
    });

    this.dom.btnCloseGameover.addEventListener('click', () => {
      this.dom.gameoverModal.classList.add('hidden');
    });
  }

  /**
   * Reproduce cada jugada de la revisión post-partida con sus animaciones,
   * explosión de jaque mate si aplica, y activa la voz al asentarse la jugada.
   */
  _handleReviewStep(frame) {
    const token = ++this._reviewAnimToken;
    this.fx.cancelActive();
    this.hiddenSquares.clear();
    this.selected = null;
    this.legalForSelected = [];
    this.defeatedKingSq = null;
    this.reviewFrame = frame;

    if (frame.ply === 0 || !frame.lastMove) {
      this.render();
      frame.stopVoice?.();
      return;
    }

    const record = frame.lastMove;
    const moverColor = record.color;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const isMate = Boolean(record.san && record.san.endsWith('#'));

    const finishReviewAnim = () => {
      if (token !== this._reviewAnimToken) return;

      if (isMate) {
        const kSq = frame.engine.findKing(enemyColor);
        if (kSq) {
          this.hiddenSquares.clear();
          this.hiddenSquares.add(`${kSq.r},${kSq.c}`);
          this.render({ skipReviewOverlay: true });
          this.sound.playCheckmateDefeat();

          this.fx.playCheckmateSequence({
            kingHtml: this.pieceRenderer('K', enemyColor),
            kingSq: kSq,
            flipped: this.flipped,
            winnerColor: moverColor,
            onComplete: () => {
              if (token !== this._reviewAnimToken) return;
              this.hiddenSquares.clear();
              this.defeatedKingSq = kSq;
              this.render();
              frame.speak?.();
            }
          });
          return;
        }
      }

      this.hiddenSquares.clear();
      if (record.inCheck) this.sound.playCheck();
      this.render();
      frame.speak?.();
    };

    if (record.castle) {
      const row = record.from.r;
      this.hiddenSquares.add(`${row},${record.kingToCol}`);
      this.hiddenSquares.add(`${row},${record.rookToCol}`);
      this.render({ skipReviewOverlay: true });
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
        onComplete: finishReviewAnim
      });
      return;
    }

    if (record.captured) {
      const victimSq = record.ep
        ? { r: record.from.r, c: record.to.c }
        : { r: record.to.r, c: record.to.c };

      this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
      this.render({ skipReviewOverlay: true });

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
        onComplete: finishReviewAnim
      });
      return;
    }

    this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
    this.render({ skipReviewOverlay: true });
    this.sound.playMove(record.piece);

    this.fx.animateRegularMove({
      pieceHtml: this.pieceRenderer(record.promo || record.piece, moverColor),
      pieceType: record.piece,
      from: record.from,
      to: record.to,
      flipped: this.flipped,
      onComplete: finishReviewAnim
    });
  }

  _requestNewPosition(positionId) {
    if (this.mode === 'online' && this.mp.isConnected()) {
      this.mp.requestRematch(positionId, this.clock.preset.id);
      return;
    }
    this.startNewGame(positionId);
  }

  _startOnlineMatch(positionId, myColor, clockPresetId) {
    this.onlineColor = myColor;
    this.flipped = myColor === 'b';
    this.clock.setPreset(clockPresetId || '5+3');
    this.clock.syncOrientation(this.flipped);
    this.startNewGame(positionId);
    this.sound.playCastle();
  }

  _handleRemoteMove(payload) {
    if (this.mode !== 'online' || !this.mp.isConnected() || this.engine.status !== 'playing') return;
    if (this.isAnimating) {
      setTimeout(() => this._handleRemoteMove(payload), 70);
      return;
    }

    const raw = payload?.move;
    if (!raw) return;

    const legal = this.engine.getLegalMoves(this.engine.turn);
    const matched = legal.find(m =>
      m.from.r === raw.from.r &&
      m.from.c === raw.from.c &&
      m.to.r === raw.to.r &&
      m.to.c === raw.to.c &&
      (m.promo || null) === (raw.promo || null) &&
      (m.castle || null) === (raw.castle || null)
    );

    if (!matched) return;

    if (payload.remaining && this.clock.isEnabled()) {
      this.clock.remaining.w = payload.remaining.w;
      this.clock.remaining.b = payload.remaining.b;
      this.clock.render();
    }

    this._executeMove(matched, { fromRemote: true });
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
    this._reviewAnimToken++;
    this.fx.cancelActive();
    this.aiBusy = false;
    this.isAnimating = false;
    this.hiddenSquares.clear();
    this.defeatedKingSq = null;
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
    return (this.mode === 'ai-normal' || this.mode === 'ai-easy') &&
      this.engine.turn === 'b' &&
      this.engine.status === 'playing';
  }

  _updatePlayerLabels() {
    const topIsBlack = !this.flipped;
    let whiteLabel = 'Blancas (Tú)';
    let blackLabel = this.mode === 'ai-easy' ? 'Negras (IA Fácil)' : 'Negras (IA Normal)';

    if (this.mode === 'pvp') {
      whiteLabel = 'Blancas (J1)';
      blackLabel = 'Negras (J2)';
    } else if (this.mode === 'online') {
      if (this.mp.isConnected() && this.onlineColor) {
        whiteLabel = this.onlineColor === 'w' ? 'Blancas (Tú)' : 'Blancas (Rival Online)';
        blackLabel = this.onlineColor === 'b' ? 'Negras (Tú)' : 'Negras (Rival Online)';
      } else {
        whiteLabel = 'Blancas (Esperando...)';
        blackLabel = 'Negras (Esperando...)';
      }
    }

    this.dom.topName.textContent = topIsBlack ? blackLabel : whiteLabel;
    this.dom.bottomName.textContent = topIsBlack ? whiteLabel : blackLabel;
    this.dom.topDot.className = topIsBlack ? 'dot dot-black' : 'dot dot-white';
    this.dom.bottomDot.className = topIsBlack ? 'dot dot-white' : 'dot dot-black';
  }

  handleSquareClick(r, c) {
    if (this.reviewFrame) return;
    if (this.aiBusy || this.isAnimating || this.engine.status !== 'playing') return;
    if (this._isAiTurn()) return;

    if (this.mode === 'online') {
      if (!this.mp.isConnected()) return;
      if (this.engine.turn !== this.onlineColor) return;
    }

    if (this.selected) {
      const candidates = this._matchMovesForClick(r, c);
      if (candidates.length > 0) {
        if (candidates.length > 1 && candidates[0].promo) {
          this._openPromoModal(candidates);
        } else {
          this._executeMove(candidates[0], { fromRemote: false });
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
        if (move) this._executeMove(move, { fromRemote: false });
      });
      this.dom.promoChoices.appendChild(btn);
    });

    this.dom.promoModal.classList.remove('hidden');
  }

  _executeMove(move, { fromRemote = false } = {}) {
    const moverColor = this.engine.turn;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const record = this.engine.makeMove(move);

    this.selected = null;
    this.legalForSelected = [];
    this.isAnimating = true;
    this.hiddenSquares.clear();

    this.clock.pause();

    if (this.mode === 'online' && !fromRemote && this.mp.isConnected()) {
      const projected = { ...this.clock.remaining };
      if (this.clock.isEnabled() && this.clock.started) {
        projected[moverColor] += this.clock.preset.incSec * 1000;
      }
      this.mp.sendMove(move, projected);
    }

    const finishMove = () => {
      this.hiddenSquares.clear();

      // Si es Jaque Mate: detonar la caída y explosión del Rey vencido antes de abrir el modal
      if (this.engine.status === 'checkmate') {
        this.clock.stop();
        const loserColor = this.engine.winner === 'w' ? 'b' : 'w';
        const kSq = this.engine.findKing(loserColor);

        if (kSq) {
          this.hiddenSquares.add(`${kSq.r},${kSq.c}`);
          this.render();
          this.sound.playCheckmateDefeat();

          this.fx.playCheckmateSequence({
            kingHtml: this.pieceRenderer('K', loserColor),
            kingSq: kSq,
            flipped: this.flipped,
            winnerColor: this.engine.winner,
            onComplete: () => {
              this.hiddenSquares.clear();
              this.defeatedKingSq = kSq;
              this.isAnimating = false;
              this.render();
              this._handleGameOver({ skipVictoryJingle: true });
            }
          });
          return;
        }
      }

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
      if (best) this._executeMove(best, { fromRemote: false });
    }, 340);
  }

  handleUndo() {
    if (this.mode === 'online') return;
    if (this.aiBusy || this.isAnimating || this.engine.history.length === 0) return;
    this._reviewAnimToken++;
    this.fx.cancelActive();
    this.dom.gameoverModal.classList.add('hidden');
    this.reviewFrame = null;
    this.analysisResults = null;
    this.defeatedKingSq = null;
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
    let loser = 'w';
    if (this.mode === 'pvp') loser = this.engine.turn;
    else if (this.mode === 'online') {
      if (!this.mp.isConnected() || !this.onlineColor) return;
      loser = this.onlineColor;
      this.mp.sendResign(loser);
    }
    this._finishResign(loser, false);
  }

  _finishResign(loser, fromRemote = false) {
    if (this.engine.status !== 'playing') return;
    const winner = loser === 'w' ? 'b' : 'w';
    this.engine.status = 'resigned';
    this.engine.winner = winner;
    this.clock.stop();
    this.selected = null;
    this.legalForSelected = [];
    this.render();

    const winText = winner === 'w' ? 'Blancas' : 'Negras';
    const loseText = loser === 'w' ? 'Blancas' : 'Negras';
    const iWon = this.mode === 'online' ? winner === this.onlineColor : !fromRemote && winner === 'w';
    this.sound.playGameOver(iWon);

    this.dom.gameoverTitle.textContent = `🏳 Rendición — Ganan ${winText}`;
    this.dom.gameoverSubtitle.textContent = `Las ${loseText} se rindieron tras ${this.engine.history.length} medias jugadas. Ya puedes analizar la partida con voz.`;
    this.analyzer.onGameOver(this.engine);
    this.dom.gameoverModal.classList.remove('hidden');
  }

  _handleTimeout(loser, winner, fromRemote = false) {
    if (this.engine.status !== 'playing') return;
    if (this.mode === 'online' && !fromRemote && this.mp.isConnected()) {
      this.mp.sendTimeout(loser, winner);
    }

    this.engine.status = 'timeout';
    this.engine.winner = winner;
    this.aiBusy = false;
    this.selected = null;
    this.legalForSelected = [];
    this.clock.stop();
    this.render();

    const winText = winner === 'w' ? 'Blancas' : 'Negras';
    const loseText = loser === 'w' ? 'Blancas' : 'Negras';
    const iWon = this.mode === 'online' ? winner === this.onlineColor : winner === 'w';
    this.sound.playGameOver(iWon);

    this.dom.gameoverTitle.textContent = `⏱ ¡Tiempo Agotado! Ganan ${winText}`;
    this.dom.gameoverSubtitle.textContent = `A las ${loseText} se les acabó el reloj Fischer en la posición #${this.engine.positionId}.`;
    this.analyzer.onGameOver(this.engine);
    this.dom.gameoverModal.classList.remove('hidden');
  }

  _handleGameOver({ skipVictoryJingle = false } = {}) {
    let title = 'Tablas';
    let subtitle = 'Empate por regla o material insuficiente.';

    if (this.engine.status === 'checkmate') {
      const winText = this.engine.winner === 'w' ? 'Blancas' : 'Negras';
      const iWon = this.mode === 'online' ? this.engine.winner === this.onlineColor : this.engine.winner === 'w';
      title = `👑 ¡Jaque Mate! Ganan ${winText}`;
      subtitle = `El Rey cayó en la posición Fischer #${this.engine.positionId}.`;
      if (!skipVictoryJingle) this.sound.playGameOver(iWon);
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

  render({ skipReviewOverlay = false } = {}) {
    this._updatePlayerLabels();
    this._renderBoard();
    this._renderTacticalLines(skipReviewOverlay);
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
        const isHidden = this.hiddenSquares.has(`${r},${c}`);
        if (piece && !isHidden) {
          const wrap = document.createElement('div');
          wrap.className = 'piece-wrap';
          if (
            piece.type === 'K' &&
            this.defeatedKingSq &&
            this.defeatedKingSq.r === r &&
            this.defeatedKingSq.c === c
          ) {
            wrap.classList.add('king-defeated');
          }
          wrap.innerHTML = this.pieceRenderer(piece.type, piece.color);
          sq.appendChild(wrap);
        }

        sq.addEventListener('click', () => this.handleSquareClick(r, c));
        grid.appendChild(sq);
      }
    }
  }

  _renderTacticalLines(skipReviewOverlay = false) {
    const svg = this.dom.tacticalSvg;
    svg.innerHTML = '';

    if (this.reviewFrame) {
      if (!skipReviewOverlay) {
        this.analyzer.renderBoardOverlay(svg, this.flipped);
      }
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

    if (this.dom.btnUndo) {
      const disableUndo = this.mode === 'online';
      this.dom.btnUndo.disabled = disableUndo;
      this.dom.btnUndo.style.opacity = disableUndo ? '0.4' : '1';
    }

    if (this.dom.btnResign) {
      const canResign =
        this.engine.status === 'playing' &&
        this.engine.history.length > 0 &&
        !this.reviewFrame &&
        (this.mode !== 'online' || this.mp.isConnected());
      this.dom.btnResign.disabled = !canResign;
      this.dom.btnResign.style.opacity = canResign ? '1' : '0.4';
    }

    if (this.reviewFrame) {
      this.dom.turnPill.textContent = `Revisión: Jugada ${this.reviewFrame.ply}/${this.engine.history.length}`;
      this.dom.statusText.textContent = 'Modo Revisión Post-Partida activo. Usa ◀ ▶ o toca cualquier jugada para revivir las animaciones y escuchar el análisis.';
    } else if (this.mode === 'online' && !this.mp.isConnected()) {
      this.dom.turnPill.textContent = 'Online: En espera';
      this.dom.statusText.textContent = 'Crea una sala privada o pega un código en el panel derecho para iniciar la partida en vivo.';
    } else {
      this.dom.turnPill.textContent = `Turno: ${turnName}`;
      if (this.engine.status === 'playing') {
        if (this.mode === 'online') {
          const myTurn = this.engine.turn === this.onlineColor;
          this.dom.statusText.textContent = this.engine.isInCheck(this.engine.turn)
            ? `¡Jaque a las ${turnName}! ${myTurn ? 'Es tu turno de responder.' : 'Esperando respuesta del rival...'}`
            : (myTurn ? 'Es tu turno. Realiza tu jugada.' : 'Esperando la jugada de tu rival en línea...');
        } else if (this.engine.isInCheck(this.engine.turn)) {
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
