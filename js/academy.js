import { Chess960Engine, FILES } from './engine.js';
import { CombatFX } from './fx.js';
import { THEMES } from './themes.js';
import { ACADEMY_LESSONS } from './data/academy_data.js';

const CATEGORIES = [
  { id: 'all',      label: 'Todos' },
  { id: 'basics',   label: 'Principiantes' },
  { id: 'openings', label: 'Aperturas' },
  { id: 'defenses', label: 'Defensas' },
  { id: 'gambits',  label: 'Gambitos' }
];

function sqToRC(name) {
  return { r: 8 - parseInt(name[1], 10), c: FILES.indexOf(name[0]) };
}

export class AcademyTrainer {
  constructor(app) {
    this.app = app;
    this.category = 'all';
    this.lesson = ACADEMY_LESSONS[0];
    this.stepIdx = 0;
    this.voiceOn = true;
    this.autoTimer = null;
    this.fx = null;
    this.hidden = new Set();
  }

  stop() {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    this.fx?.cancelActive();
    this.app.analyzer?.voice?.stop();
  }

  mount(container) {
    this.container = container;
    this.selectLesson(this.lesson.id, false);
  }

  _filteredLessons() {
    if (this.category === 'all') return ACADEMY_LESSONS;
    return ACADEMY_LESSONS.filter(l => l.category === this.category);
  }

  selectLesson(id, speakIntro = true) {
    this.stop();
    const found = ACADEMY_LESSONS.find(l => l.id === id) || ACADEMY_LESSONS[0];
    this.lesson = found;
    this.engine = new Chess960Engine(found.positionId);
    this.stepIdx = 0;
    this.hidden.clear();
    this._renderScaffold();
    if (speakIntro && this.voiceOn) {
      this.app.analyzer?.voice?.speak(`${found.title}. ${found.summary}`, true);
    }
  }

  _renderScaffold() {
    if (!this.container) return;
    const list = this._filteredLessons();
    const isPro = this.app.store.hasAccess('pro_academy');

    this.container.innerHTML = `
      <div class="sec-head" style="margin-bottom:14px">
        <div>
          <h2>🎓 Academia: Fundamentos, Aperturas, Defensas y Gambitos</h2>
          <p class="sec-sub">Avanza paso a paso sobre el tablero con animaciones y narración en voz alta.</p>
        </div>
        <button class="btn btn-secondary" id="ac-home">← Inicio</button>
      </div>
      <div class="tr-bar" style="margin-bottom:12px">
        ${CATEGORIES.map(c => `<button class="tr-pill ${this.category === c.id ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>`).join('')}
      </div>
      <div class="tr-list" style="margin-bottom:16px">
        ${list.map(l => {
          const locked = !isPro && l.category !== 'basics';
          return `<button class="tr-pill ${l.id === this.lesson.id ? 'active' : ''}" data-lid="${l.id}" data-locked="${locked}">
            ${locked ? '🔒 ' : ''}${l.title}
          </button>`;
        }).join('')}
      </div>
      <div class="tr-layout">
        <div class="tr-board-wrap" id="ac-wrap">
          <div class="board-grid" id="ac-grid"></div>
          <canvas class="fx-canvas" id="ac-canvas"></canvas>
        </div>
        <div class="tr-panel">
          <div class="status-row">
            <span class="pos-badge">${this.lesson.badge}</span>
            <span class="turn-pill" id="ac-progress">Paso 0 / ${this.lesson.steps.length}</span>
          </div>
          <h3>${this.lesson.title}</h3>
          <div class="tr-feedback" id="ac-text">${this.lesson.summary}</div>
          <div class="tr-actions">
            <button class="btn btn-secondary" id="ac-prev">◀ Anterior</button>
            <button class="btn btn-primary" id="ac-next">Siguiente ▶</button>
            <button class="btn btn-secondary" id="ac-auto">▶ Auto</button>
            <button class="btn btn-secondary ${this.voiceOn ? 'active' : ''}" id="ac-voice">${this.voiceOn ? '🔊 Voz' : '🔇 Voz'}</button>
          </div>
          <button class="btn btn-ghost" id="ac-practice" style="width:100%">♟ Practicar esta modalidad en el tablero</button>
        </div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#ac-grid');
    this.textEl = this.container.querySelector('#ac-text');
    this.progEl = this.container.querySelector('#ac-progress');
    this.fx = new CombatFX(this.container.querySelector('#ac-canvas'), this.container.querySelector('#ac-wrap'));
    const theme = THEMES[this.app.themes.currentId];
    if (theme) this.fx.setPalette(theme.fxPalette);

    this.container.querySelector('#ac-home').addEventListener('click', () => {
      this.stop();
      this.app.shell.navigate('home');
    });
    this.container.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => {
      this.category = b.dataset.cat;
      const first = this._filteredLessons().find(l => isPro || l.category === 'basics') || ACADEMY_LESSONS[0];
      this.selectLesson(first.id, false);
    }));
    this.container.querySelectorAll('[data-lid]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.locked === 'true') {
        this.stop();
        this.app.shell.navigate('subscription');
        return;
      }
      this.selectLesson(b.dataset.lid, true);
    }));
    this.container.querySelector('#ac-prev').addEventListener('click', () => this.stepBack());
    this.container.querySelector('#ac-next').addEventListener('click', () => this.stepForward(false));
    this.container.querySelector('#ac-auto').addEventListener('click', () => this.toggleAuto());
    this.container.querySelector('#ac-voice').addEventListener('click', (e) => {
      this.voiceOn = !this.voiceOn;
      if (!this.voiceOn) this.app.analyzer?.voice?.stop();
      e.target.classList.toggle('active', this.voiceOn);
      e.target.textContent = this.voiceOn ? '🔊 Voz' : '🔇 Voz';
    });
    this.container.querySelector('#ac-practice').addEventListener('click', () => {
      this.stop();
      const variant = this.lesson.positionId === 518 ? 'classic' : 'fischer960';
      this.app.shell.navigate('play');
      this.app._setModeProgrammatically('ai-normal');
      this.app.setVariant(variant, { startFresh: false });
      this.app.startNewGame(this.lesson.positionId);
    });

    this._renderBoard();
  }

  toggleAuto() {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
      return;
    }
    if (this.stepIdx >= this.lesson.steps.length) {
      this.selectLesson(this.lesson.id, false);
    }
    this.stepForward(true);
  }

  stepBack() {
    if (this.stepIdx <= 0) return;
    this.stop();
    this.engine.undo();
    this.stepIdx--;
    this._syncText();
    this._renderBoard();
  }

  stepForward(continueAuto = false) {
    if (this.stepIdx >= this.lesson.steps.length) {
      this.autoTimer = null;
      return;
    }
    const step = this.lesson.steps[this.stepIdx];
    const legal = this.engine.getLegalMoves(this.engine.turn);
    let move = null;

    if (step.castle) {
      move = legal.find(m => m.castle === step.castle);
    } else {
      const f = sqToRC(step.from);
      const t = sqToRC(step.to);
      move = legal.find(m => m.from.r === f.r && m.from.c === f.c && m.to.r === t.r && m.to.c === t.c);
    }
    if (!move) return;

    const moverColor = this.engine.turn;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const rec = this.engine.makeMove(move);
    this.stepIdx++;
    this._syncText();

    const finish = () => {
      this.hidden.clear();
      this._renderBoard();
      if (this.voiceOn) {
        this.app.analyzer?.voice?.speak(step.text, true);
      }
      if (continueAuto && this.stepIdx < this.lesson.steps.length) {
        this.autoTimer = setTimeout(() => this.stepForward(true), 3200);
      }
    };

    this.hidden.clear();
    if (rec.castle) {
      const row = rec.from.r;
      this.hidden.add(`${row},${rec.kingToCol}`);
      this.hidden.add(`${row},${rec.rookToCol}`);
      this._renderBoard();
      this.app.sound.playCastle();
      this.fx.animateCastle({
        kingHtml: this.app.pieceRenderer('K', moverColor),
        rookHtml: this.app.pieceRenderer('R', moverColor),
        row,
        kingFrom: rec.from.c,
        kingTo: rec.kingToCol,
        rookFrom: rec.rookFromCol,
        rookTo: rec.rookToCol,
        onComplete: finish
      });
    } else if (rec.captured) {
      this.hidden.add(`${rec.to.r},${rec.to.c}`);
      this._renderBoard();
      this.fx.playCombatSequence({
        pieceType: rec.piece,
        attackerHtml: this.app.pieceRenderer(rec.piece, moverColor),
        victimHtml: this.app.pieceRenderer(rec.captured, enemyColor),
        from: rec.from,
        to: rec.to,
        onCharge: () => this.app.sound.playCharge(rec.piece),
        onImpact: () => this.app.sound.playAttack(rec.piece),
        onComplete: finish
      });
    } else {
      this.hidden.add(`${rec.to.r},${rec.to.c}`);
      this._renderBoard();
      this.app.sound.playMove(rec.piece);
      this.fx.animateRegularMove({
        pieceHtml: this.app.pieceRenderer(rec.piece, moverColor),
        pieceType: rec.piece,
        from: rec.from,
        to: rec.to,
        onComplete: finish
      });
    }
  }

  _syncText() {
    if (this.progEl) this.progEl.textContent = `Paso ${this.stepIdx} / ${this.lesson.steps.length}`;
    if (this.textEl) {
      this.textEl.textContent = this.stepIdx === 0
        ? this.lesson.summary
        : this.lesson.steps[this.stepIdx - 1].text;
    }
  }

  _renderBoard() {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = '';
    const last = this.engine.history[this.engine.history.length - 1] || null;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        if (last) {
          const toCol = last.castle ? last.kingToCol : last.to.c;
          if (last.from.r === r && last.from.c === c) sq.classList.add('last-from');
          if (last.to.r === r && toCol === c) sq.classList.add('last-to');
        }
        const piece = this.engine.board[r][c];
        if (piece && !this.hidden.has(`${r},${c}`)) {
          const wrap = document.createElement('div');
          wrap.className = 'piece-wrap';
          wrap.innerHTML = this.app.pieceRenderer(piece.type, piece.color);
          sq.appendChild(wrap);
        }
        this.gridEl.appendChild(sq);
      }
    }
  }
}
