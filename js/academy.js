import { Chess960Engine, FILES } from './engine.js';
import { CombatFX } from './fx.js';
import { THEMES } from './themes.js';
import { ACADEMY_LEVELS, ACADEMY_LESSONS } from './data/academy_data.js';

const DONE_KEY = 'ajedrez960_academy_done_v1';

function sqToRC(name) {
  return { r: 8 - parseInt(name[1], 10), c: FILES.indexOf(name[0]) };
}

function buildLessonEngine(lesson) {
  const eng = new Chess960Engine(lesson.positionId ?? 518);
  if (!lesson.fen) return eng;
  const parts = lesson.fen.trim().split(/\s+/);
  const rows = parts[0].split('/');
  eng.board = Array.from({ length: 8 }, () => new Array(8).fill(null));
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of rows[r]) {
      if (ch >= '1' && ch <= '8') c += parseInt(ch, 10);
      else {
        eng.board[r][c] = { color: ch === ch.toUpperCase() ? 'w' : 'b', type: ch.toUpperCase() };
        c++;
      }
    }
  }
  eng.turn = parts[1] === 'b' ? 'b' : 'w';
  eng.castling = { w: { K: false, Q: false }, b: { K: false, Q: false } };
  eng.epTarget = null;
  eng.history = [];
  eng.status = 'playing';
  return eng;
}

export class AcademyTrainer {
  constructor(app) {
    this.app = app;
    this.level = 1;
    this.lesson = ACADEMY_LESSONS[0];
    this.stepIdx = 0;
    this.voiceOn = true;
    this.autoTimer = null;
    this.fx = null;
    this.busy = false;
    this.selected = null;
    this.legal = [];
    this.hidden = new Set();
    this.hintSquares = new Set();
    this.taskState = { type: 'info', text: '' };
    this.completed = this._loadDone();
  }

  _loadDone() {
    try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]')); }
    catch { return new Set(); }
  }

  _markDone(id) {
    this.completed.add(id);
    try { localStorage.setItem(DONE_KEY, JSON.stringify([...this.completed])); } catch { /* ignorar */ }
  }

  stop() {
    if (this.autoTimer) { clearTimeout(this.autoTimer); this.autoTimer = null; }
    this.busy = false;
    this.fx?.cancelActive();
    this.app.analyzer?.voice?.stop();
  }

  mount(container) {
    this.container = container;
    const pending = ACADEMY_LESSONS.find(l => l.level === this.level && !this.completed.has(l.id));
    this.selectLesson((pending || this.lesson).id, false);
  }

  _lessonsInLevel(lvl = this.level) {
    return ACADEMY_LESSONS.filter(l => l.level === lvl);
  }

  _currentStep() {
    return this.lesson.steps[this.stepIdx] || null;
  }

  _isWaitingForUser() {
    const st = this._currentStep();
    return Boolean(st && st.interactive && !this.busy);
  }

  _flipped() {
    return this.lesson.playerColor === 'b';
  }

  goToNextLesson() {
    const isPro = this.app.store.hasAccess('pro_academy');
    const inLvl = this._lessonsInLevel();
    const curIdx = inLvl.findIndex(l => l.id === this.lesson.id);

    // 1. Siguiente lección dentro del mismo nivel
    const pendingInLvl = inLvl.find((l, i) => i > curIdx && !this.completed.has(l.id)) || inLvl[curIdx + 1];
    if (pendingInLvl) {
      this.selectLesson(pendingInLvl.id, true);
      return;
    }

    // 2. Avanzar al siguiente nivel disponible
    for (let nextLvl = this.level + 1; nextLvl <= 4; nextLvl++) {
      const lvlObj = ACADEMY_LEVELS.find(x => x.id === nextLvl);
      if (lvlObj?.proOnly && !isPro) {
        this.stop();
        this.app.shell.navigate('subscription');
        return;
      }
      const nextList = this._lessonsInLevel(nextLvl);
      if (nextList.length) {
        const pick = nextList.find(l => !this.completed.has(l.id)) || nextList[0];
        this.selectLesson(pick.id, true);
        return;
      }
    }

    // 3. Si completó todas, reiniciar desde Nivel 1
    this.selectLesson(ACADEMY_LESSONS[0].id, true);
  }

  selectLesson(id, speakIntro = true) {
    this.stop();
    const found = ACADEMY_LESSONS.find(l => l.id === id) || ACADEMY_LESSONS[0];
    this.lesson = found;
    this.level = found.level;
    this.engine = buildLessonEngine(found);
    this.stepIdx = 0;
    this.selected = null;
    this.legal = [];
    this.hidden.clear();
    this.hintSquares.clear();

    const firstStep = this._currentStep();
    this.taskState = firstStep?.interactive
      ? { type: 'task', text: `🎯 ${firstStep.prompt}` }
      : { type: 'info', text: 'Pulsa "Siguiente ▶" o "▶ Auto" para comenzar la lección interactiva.' };

    this._renderScaffold();
    if (speakIntro && this.voiceOn) {
      const introSpeech = firstStep?.interactive
        ? `${found.title}. ${firstStep.prompt}`
        : `${found.title}. ${found.summary}`;
      this.app.analyzer?.voice?.speak(introSpeech, true);
    }
  }

  _refreshProgressBadges() {
    if (!this.container) return;
    const h2 = this.container.querySelector('.sec-head h2');
    if (h2) h2.textContent = `🎓 Academia Interactiva (${this.completed.size}/${ACADEMY_LESSONS.length})`;

    this.container.querySelectorAll('[data-lvl]').forEach(btn => {
      const lvlId = Number(btn.dataset.lvl);
      const lvlObj = ACADEMY_LEVELS.find(x => x.id === lvlId);
      const all = this._lessonsInLevel(lvlId);
      const done = all.filter(x => this.completed.has(x.id)).length;
      const span = btn.querySelector('span');
      if (span && lvlObj) span.textContent = `ELO ${lvlObj.elo} · ${done}/${all.length} completadas`;
    });

    this.container.querySelectorAll('[data-lid]').forEach(pill => {
      const l = ACADEMY_LESSONS.find(x => x.id === pill.dataset.lid);
      if (!l) return;
      const done = this.completed.has(l.id);
      pill.classList.toggle('solved', done);
      pill.textContent = `${done ? '✓ ' : ''}${l.title}`;
    });
  }

  _renderScaffold() {
    if (!this.container) return;
    const list = this._lessonsInLevel();
    const isPro = this.app.store.hasAccess('pro_academy');
    const waiting = this._isWaitingForUser();
    const isFinished = this.stepIdx >= this.lesson.steps.length;

    this.container.innerHTML = `
      <div class="sec-head" style="margin-bottom:12px">
        <div>
          <h2>🎓 Academia Interactiva (${this.completed.size}/${ACADEMY_LESSONS.length})</h2>
          <p class="sec-sub">4 niveles progresivos: el entrenador te explica la idea y te desafía a ejecutar las jugadas clave.</p>
        </div>
        <button class="btn btn-secondary" id="ac-home">← Inicio</button>
      </div>

      <div class="tr-levels">
        ${ACADEMY_LEVELS.map(l => {
          const allInLvl = this._lessonsInLevel(l.id);
          const doneInLvl = allInLvl.filter(x => this.completed.has(x.id)).length;
          const locked = l.proOnly && !isPro;
          return `
            <button class="tr-level-btn ${this.level === l.id ? 'active' : ''}" data-lvl="${l.id}" data-locked="${locked}">
              <strong>${locked ? '🔒 ' : ''}${l.name}</strong>
              <span>ELO ${l.elo} · ${doneInLvl}/${allInLvl.length} completadas</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="tr-list" style="margin-bottom:16px">
        ${list.map(l => {
          const done = this.completed.has(l.id);
          return `<button class="tr-pill ${l.id === this.lesson.id ? 'active' : ''} ${done ? 'solved' : ''}" data-lid="${l.id}">
            ${done ? '✓ ' : ''}${l.title}
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
            <span class="turn-pill" id="ac-progress">Paso ${this.stepIdx} / ${this.lesson.steps.length}</span>
          </div>
          <h3>${this.lesson.title}</h3>
          <div class="tr-feedback" id="ac-text">${this.lesson.summary}</div>
          <div class="tr-feedback ${this.taskState.type}" id="ac-task">${this.taskState.text}</div>
          <div class="tr-actions">
            <button class="btn btn-secondary" id="ac-prev">◀ Anterior</button>
            <button class="btn btn-primary" id="ac-next">${isFinished ? 'Siguiente Lección →' : (waiting ? '⏭ Ver jugada' : 'Siguiente ▶')}</button>
            <button class="btn btn-secondary" id="ac-hint" style="${waiting ? '' : 'display:none'}">💡 Pista</button>
            <button class="btn btn-secondary" id="ac-auto">▶ Auto</button>
            <button class="btn btn-secondary ${this.voiceOn ? 'active' : ''}" id="ac-voice">${this.voiceOn ? '🔊 Voz' : '🔇 Voz'}</button>
          </div>
          <button class="btn btn-ghost" id="ac-practice" style="width:100%">♟ Practicar esta modalidad contra IA</button>
        </div>
      </div>
    `;

    this.gridEl = this.container.querySelector('#ac-grid');
    this.textEl = this.container.querySelector('#ac-text');
    this.taskEl = this.container.querySelector('#ac-task');
    this.progEl = this.container.querySelector('#ac-progress');
    this.nextBtn = this.container.querySelector('#ac-next');
    this.hintBtn = this.container.querySelector('#ac-hint');

    this.fx = new CombatFX(this.container.querySelector('#ac-canvas'), this.container.querySelector('#ac-wrap'));
    const theme = THEMES[this.app.themes.currentId];
    if (theme) this.fx.setPalette(theme.fxPalette);

    this.container.querySelector('#ac-home').addEventListener('click', () => {
      this.stop();
      this.app.shell.navigate('home');
    });
    this.container.querySelectorAll('[data-lvl]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.locked === 'true') { this.stop(); this.app.shell.navigate('subscription'); return; }
      const targetLvl = Number(b.dataset.lvl);
      const inLvl = this._lessonsInLevel(targetLvl);
      if (!inLvl.length) return;

      // Abrir la primera lección pendiente del nivel (o alternar a la otra si ya estás en este nivel)
      let pick = inLvl.find(l => !this.completed.has(l.id) && l.id !== this.lesson.id)
        || inLvl.find(l => !this.completed.has(l.id));
      if (!pick) {
        const curIdx = inLvl.findIndex(l => l.id === this.lesson.id);
        pick = inLvl[(curIdx + 1) % inLvl.length];
      }
      this.selectLesson(pick.id, true);
    }));
    this.container.querySelectorAll('[data-lid]').forEach(b => b.addEventListener('click', () => {
      this.selectLesson(b.dataset.lid, true);
    }));
    this.container.querySelector('#ac-prev').addEventListener('click', () => this.stepBack());
    this.nextBtn.addEventListener('click', () => {
      if (this.stepIdx >= this.lesson.steps.length) this.goToNextLesson();
      else this.stepForward(false);
    });
    this.hintBtn.addEventListener('click', () => this._showHint());
    this.container.querySelector('#ac-auto').addEventListener('click', () => this.toggleAuto());
    this.container.querySelector('#ac-voice').addEventListener('click', (e) => {
      this.voiceOn = !this.voiceOn;
      if (!this.voiceOn) this.app.analyzer?.voice?.stop();
      e.target.classList.toggle('active', this.voiceOn);
      e.target.textContent = this.voiceOn ? '🔊 Voz' : '🔇 Voz';
    });
    this.container.querySelector('#ac-practice').addEventListener('click', () => {
      this.stop();
      const posId = this.lesson.positionId ?? 518;
      const variant = posId === 518 ? 'classic' : 'fischer960';
      this.app.shell.navigate('play');
      this.app._setModeProgrammatically('ai-elo-1200');
      this.app.setVariant(variant, { startFresh: false });
      this.app.startNewGame(posId);
    });

    this._renderBoard();
  }

  _findExpectedMove(step) {
    if (!step) return null;
    const legal = this.engine.getLegalMoves(this.engine.turn);
    if (step.castle) return legal.find(m => m.castle === step.castle) || null;
    const f = sqToRC(step.from);
    const t = sqToRC(step.to);
    return legal.find(m => m.from.r === f.r && m.from.c === f.c && m.to.r === t.r && m.to.c === t.c) || null;
  }

  _showHint() {
    const move = this._findExpectedMove(this._currentStep());
    if (!move) return;
    const destC = move.castle ? move.kingToCol : move.to.c;
    this.hintSquares = new Set([`${move.from.r},${move.from.c}`, `${move.to.r},${destC}`]);
    this._renderBoard();
  }

  _onSquareClick(r, c) {
    if (!this._isWaitingForUser()) return;

    if (this.selected) {
      const direct = this.legal.filter(m => m.to.r === r && m.to.c === c);
      const castleMatch = this.legal.filter(m => m.castle && m.from.r === r && m.kingToCol === c);
      const chosen = direct[0] || castleMatch[0];
      if (chosen) {
        const expected = this._findExpectedMove(this._currentStep());
        const same = expected &&
          chosen.from.r === expected.from.r && chosen.from.c === expected.from.c &&
          chosen.to.r === expected.to.r && chosen.to.c === expected.to.c &&
          (chosen.castle || null) === (expected.castle || null);

        this.selected = null;
        this.legal = [];

        if (!same) {
          this._setTask('err', `Casi, prueba otra jugada. ${this._currentStep().prompt}`);
          this._renderBoard();
          return;
        }
        this._executeStep(this._currentStep(), chosen, false);
        return;
      }
    }

    const p = this.engine.board[r][c];
    if (p && p.color === this.engine.turn) {
      this.selected = { r, c };
      this.legal = this.engine.getLegalMovesFrom(r, c);
    } else {
      this.selected = null;
      this.legal = [];
    }
    this._renderBoard();
  }

  _setTask(type, text) {
    this.taskState = { type, text };
    if (this.taskEl) {
      this.taskEl.className = `tr-feedback ${type}`;
      this.taskEl.textContent = text;
    }
  }

  toggleAuto() {
    if (this.autoTimer) { clearTimeout(this.autoTimer); this.autoTimer = null; return; }
    if (this.stepIdx >= this.lesson.steps.length) this.selectLesson(this.lesson.id, false);
    this.stepForward(true);
  }

  stepBack() {
    if (this.stepIdx <= 0) return;
    this.stop();
    this.engine.undo();
    this.stepIdx--;
    this.selected = null;
    this.legal = [];
    this.hintSquares.clear();
    const st = this._currentStep();
    this._setTask(st?.interactive ? 'task' : 'info', st?.interactive ? `🎯 ${st.prompt}` : 'Pulsa "Siguiente ▶" para continuar.');
    this._syncText();
    this._renderBoard();
  }

  stepForward(continueAuto = false) {
    if (this.busy || this.stepIdx >= this.lesson.steps.length) { this.autoTimer = null; return; }
    const step = this._currentStep();
    const move = this._findExpectedMove(step);
    if (!move) return;
    this._executeStep(step, move, continueAuto);
  }

  _executeStep(step, move, continueAuto) {
    const moverColor = this.engine.turn;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const rec = this.engine.makeMove(move);
    this.stepIdx++;
    this.busy = true;
    this.selected = null;
    this.legal = [];
    this.hintSquares.clear();

    const finish = () => {
      this.busy = false;
      this.hidden.clear();
      this._renderBoard();

      const nextStep = this._currentStep();
      if (!nextStep) {
        this._markDone(this.lesson.id);
        this._refreshProgressBadges();
        this._setTask('ok', '🏆 ¡Lección completada! Pulsa "Siguiente Lección →" para continuar o practícala contra la IA.');
      } else if (nextStep.interactive) {
        this._setTask('task', `🎯 ${nextStep.prompt}`);
      } else {
        this._setTask('info', 'Observa la respuesta del rival...');
      }

      this._syncText();

      if (this.voiceOn) {
        const spoken = nextStep?.interactive && !continueAuto
          ? `${step.text} ${nextStep.prompt}`
          : step.text;
        this.app.analyzer?.voice?.speak(spoken, true);
      }

      if (nextStep && !nextStep.interactive && step.interactive && !continueAuto) {
        this.autoTimer = setTimeout(() => this.stepForward(false), 1600);
      } else if (continueAuto && nextStep) {
        this.autoTimer = setTimeout(() => this.stepForward(true), 3200);
      }
    };

    const flipped = this._flipped();
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
        flipped,
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
        flipped,
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
        flipped,
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
    const isFinished = this.stepIdx >= this.lesson.steps.length;
    const waiting = this._isWaitingForUser();
    if (this.nextBtn) {
      this.nextBtn.textContent = isFinished
        ? 'Siguiente Lección →'
        : (waiting ? '⏭ Ver jugada' : 'Siguiente ▶');
    }
    if (this.hintBtn) this.hintBtn.style.display = waiting ? '' : 'none';
  }

  _renderBoard() {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = '';
    const flipped = this._flipped();
    const last = this.engine.history[this.engine.history.length - 1] || null;

    for (let vr = 0; vr < 8; vr++) {
      for (let vc = 0; vc < 8; vc++) {
        const r = flipped ? 7 - vr : vr;
        const c = flipped ? 7 - vc : vc;

        const sq = document.createElement('div');
        sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        if (last) {
          const toCol = last.castle ? last.kingToCol : last.to.c;
          if (last.from.r === r && last.from.c === c) sq.classList.add('last-from');
          if (last.to.r === r && toCol === c) sq.classList.add('last-to');
        }
        if (this.selected && this.selected.r === r && this.selected.c === c) sq.classList.add('selected');
        if (this.hintSquares.has(`${r},${c}`)) sq.classList.add('hint-sq');

        const matching = this.legal.filter(m => m.to.r === r && m.to.c === c);
        if (matching.some(m => m.castle)) {
          sq.classList.add('castle-target');
        } else if (matching.length > 0) {
          const mk = document.createElement('div');
          mk.className = matching.some(m => m.captured) ? 'capture-ring' : 'move-dot';
          sq.appendChild(mk);
        }

        if (vc === 0) {
          const rk = document.createElement('span');
          rk.className = 'coord-rank';
          rk.textContent = 8 - r;
          sq.appendChild(rk);
        }
        if (vr === 7) {
          const fl = document.createElement('span');
          fl.className = 'coord-file';
          fl.textContent = FILES[c];
          sq.appendChild(fl);
        }

        const piece = this.engine.board[r][c];
        if (piece && !this.hidden.has(`${r},${c}`)) {
          const wrap = document.createElement('div');
          wrap.className = 'piece-wrap';
          wrap.innerHTML = this.app.pieceRenderer(piece.type, piece.color);
          sq.appendChild(wrap);
        }

        sq.addEventListener('click', () => this._onSquareClick(r, c));
        this.gridEl.appendChild(sq);
      }
    }
  }
}
