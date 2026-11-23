import { Chess960Engine, FILES } from './engine.js';
import { CombatFX } from './fx.js';
import { THEMES } from './themes.js';
import { REPERTOIRE } from './data/repertoire_data.js';
import { mountScoutPanel } from './scout_import.js';

const MASTERY_KEY = 'ajedrez960_repertoire_mastery_v1';

function sqToRC(name) {
  return { r: 8 - parseInt(name[1], 10), c: FILES.indexOf(name[0]) };
}

function ensureRepertoireStyles() {
  if (document.querySelector('style[data-rep-css]')) return;
  const style = document.createElement('style');
  style.dataset.repCss = 'true';
  style.textContent = `
    .rep-top-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .rep-color-btn {
      flex: 1; min-width: 155px; padding: 11px 14px; border-radius: 12px;
      background: var(--bg-card); border: 1.5px solid var(--border-color);
      color: var(--text-main); font-weight: 800; font-size: 0.88rem; cursor: pointer;
      display: flex; justify-content: space-between; align-items: center;
    }
    .rep-color-btn.active { border-color: var(--accent-cyan); background: rgba(56, 189, 248, 0.14); }
    .rep-openings {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 10px; margin-bottom: 14px;
    }
    .rep-op-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      padding: 11px 13px; cursor: pointer; text-align: left; color: var(--text-main);
      display: flex; flex-direction: column; gap: 6px;
    }
    .rep-op-card.active { border-color: #facc15; box-shadow: 0 0 16px rgba(250, 204, 21, 0.18); }
    .rep-mbar { height: 6px; border-radius: 999px; background: rgba(148, 163, 184, 0.2); overflow: hidden; }
    .rep-mbar-fill { height: 100%; background: linear-gradient(90deg, #38bdf8, #22c55e); transition: width 0.25s; }
    .rep-mode-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .rep-wrong-x {
      position: absolute; top: 3px; right: 3px; z-index: 12;
      width: 24px; height: 24px; border-radius: 50%;
      background: #ef4444; color: #fff; font-weight: 900; font-size: 0.85rem;
      display: grid; place-items: center; box-shadow: 0 2px 10px rgba(239, 68, 68, 0.7);
      animation: repShake 0.35s ease;
    }
    .square.rep-wrong-sq { box-shadow: inset 0 0 0 3px #ef4444; background-color: rgba(239, 68, 68, 0.32) !important; }
    .rep-scout-box {
      margin-top: 18px; background: var(--bg-card); border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 15px; padding: 16px; display: flex; flex-direction: column; gap: 12px;
    }
    .rep-scout-form { display: flex; flex-wrap: wrap; gap: 8px; }
    .rep-scout-input {
      flex: 1; min-width: 180px; padding: 9px 12px; border-radius: 9px;
      background: rgba(9, 13, 22, 0.8); border: 1px solid var(--border-color);
      color: #f8fafc; font-size: 0.9rem;
    }
    .rep-scout-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-top: 10px; }
    .rep-scout-col {
      background: rgba(9, 13, 22, 0.62); border: 1px solid var(--border-color);
      border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;
    }
    .rep-scout-row {
      display: flex; align-items: center; gap: 8px; padding-bottom: 6px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    }
    .rep-weak-alert {
      margin-top: 8px; padding: 10px 12px; border-radius: 10px;
      background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.4);
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px;
      font-size: 0.82rem;
    }
    @keyframes repShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);
}

export function attachRepertoireLab(app) {
  ensureRepertoireStyles();

  let activeColor = 'w';
  let activeOpeningId = REPERTOIRE[0].id;
  let activeLineId = REPERTOIRE[0].lines[0].id;
  let trainMode = 'study'; // 'study' | 'exam'
  let voiceOn = true;

  let engine = new Chess960Engine(518);
  let stepIdx = 0;
  let selected = null;
  let legal = [];
  let hidden = new Set();
  let wrongSqKey = null;
  let wrongCount = 0;
  let stepErrors = 0;
  let busy = false;
  let completedLine = false;
  let autoTimer = null;
  let fx = null;
  let gridEl = null;
  let fbEl = null;
  let feedback = { type: 'info', text: '' };

  const loadMastery = () => {
    try { return JSON.parse(localStorage.getItem(MASTERY_KEY) || '{}'); }
    catch { return {}; }
  };

  const saveMastery = (obj) => {
    try { localStorage.setItem(MASTERY_KEY, JSON.stringify(obj)); } catch { /* ignorar */ }
  };

  const getLineMastery = (lineId) => Math.min(100, Math.max(0, Number(loadMastery()[lineId]) || 0));

  const getOpeningMastery = (op) => {
    if (!op.lines.length) return 0;
    const sum = op.lines.reduce((acc, l) => acc + getLineMastery(l.id), 0);
    return Math.round(sum / op.lines.length);
  };

  const getColorMastery = (color) => {
    const ops = REPERTOIRE.filter(o => o.color === color);
    if (!ops.length) return 0;
    return Math.round(ops.reduce((acc, o) => acc + getOpeningMastery(o), 0) / ops.length);
  };

  const getActiveOpening = () => REPERTOIRE.find(o => o.id === activeOpeningId) || REPERTOIRE[0];
  const getActiveLine = () => {
    const op = getActiveOpening();
    return op.lines.find(l => l.id === activeLineId) || op.lines[0];
  };

  const stopTimers = () => {
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    busy = false;
    fx?.cancelActive();
    app.analyzer?.voice?.stop();
  };

  const findExpectedMove = (step) => {
    if (!step) return null;
    const all = engine.getLegalMoves(engine.turn);
    if (step.castle) return all.find(m => m.castle === step.castle) || null;
    const f = sqToRC(step.from);
    const t = sqToRC(step.to);
    return all.find(m => m.from.r === f.r && m.from.c === f.c && m.to.r === t.r && m.to.c === t.c) || null;
  };

  const setFeedback = (type, text) => {
    feedback = { type, text };
    if (fbEl) {
      fbEl.className = `tr-feedback ${type}`;
      fbEl.textContent = text;
    }
  };

  const isPlayerTurn = () => {
    const op = getActiveOpening();
    return engine.turn === op.color;
  };

  const playStepAnimated = (step, move, onDone) => {
    const moverColor = engine.turn;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const rec = engine.makeMove(move);
    stepIdx++;
    busy = true;
    selected = null;
    legal = [];
    wrongSqKey = null;

    const flipped = getActiveOpening().color === 'b';
    const finish = () => {
      busy = false;
      hidden.clear();
      renderBoard();
      onDone?.();
    };

    hidden.clear();
    if (rec.castle) {
      const row = rec.from.r;
      hidden.add(`${row},${rec.kingToCol}`);
      hidden.add(`${row},${rec.rookToCol}`);
      renderBoard();
      app.sound.playCastle();
      fx.animateCastle({
        kingHtml: app.pieceRenderer('K', moverColor),
        rookHtml: app.pieceRenderer('R', moverColor),
        row,
        kingFrom: rec.from.c,
        kingTo: rec.kingToCol,
        rookFrom: rec.rookFromCol,
        rookTo: rec.rookToCol,
        flipped,
        onComplete: finish
      });
    } else if (rec.captured) {
      hidden.add(`${rec.to.r},${rec.to.c}`);
      renderBoard();
      fx.playCombatSequence({
        pieceType: rec.piece,
        attackerHtml: app.pieceRenderer(rec.piece, moverColor),
        victimHtml: app.pieceRenderer(rec.captured, enemyColor),
        from: rec.from,
        to: rec.to,
        flipped,
        onCharge: () => app.sound.playCharge(rec.piece),
        onImpact: () => app.sound.playAttack(rec.piece),
        onComplete: finish
      });
    } else {
      hidden.add(`${rec.to.r},${rec.to.c}`);
      renderBoard();
      app.sound.playMove(rec.piece);
      fx.animateRegularMove({
        pieceHtml: app.pieceRenderer(rec.piece, moverColor),
        pieceType: rec.piece,
        from: rec.from,
        to: rec.to,
        flipped,
        onComplete: finish
      });
    }
  };

  const advanceTurnLogic = () => {
    const line = getActiveLine();
    const progEl = document.getElementById('rep-progress');
    if (progEl) progEl.textContent = `Jugada ${stepIdx} / ${line.steps.length}`;

    if (stepIdx >= line.steps.length) {
      completedLine = true;
      const m = loadMastery();
      const prev = Number(m[line.id]) || 0;
      const earned = trainMode === 'exam'
        ? (wrongCount === 0 ? 100 : Math.max(prev, 75))
        : Math.max(prev, 45);
      m[line.id] = earned;
      saveMastery(m);

      const msg = trainMode === 'exam' && wrongCount === 0
        ? `🏆 ¡Examen perfecto! Maestría al 100% en "${line.title}".`
        : trainMode === 'exam'
          ? `✅ Variante completada con ${wrongCount} error(es). Maestría: ${earned}%. Repítela sin fallos para llegar al 100%.`
          : `🎓 Estudio completado (${earned}%). Cambia ahora a "🧠 Examen de Memoria" para dominarla al 100%.`;
      setFeedback('ok', msg);
      if (voiceOn) app.analyzer?.voice?.speak(msg, true);
      app.haptics?.pulse('heavy');
      updateMasteryBarsOnly();
      return;
    }

    const nextStep = line.steps[stepIdx];
    if (!isPlayerTurn()) {
      setFeedback('info', `Respuesta del rival: ${nextStep.text}`);
      autoTimer = setTimeout(() => {
        const mv = findExpectedMove(nextStep);
        if (mv) playStepAnimated(nextStep, mv, advanceTurnLogic);
      }, 650);
    } else {
      stepErrors = 0;
      if (trainMode === 'study') {
        setFeedback('task', `📖 Tu turno (${nextStep.from} → ${nextStep.to}): ${nextStep.text}`);
        if (voiceOn) app.analyzer?.voice?.speak(nextStep.text, true);
      } else {
        setFeedback('task', '🧠 Examen de Memoria: ejecuta tu jugada exacta sin pistas.');
      }
      renderBoard();
    }
  };

  const resetLine = () => {
    stopTimers();
    engine = new Chess960Engine(518);
    stepIdx = 0;
    selected = null;
    legal = [];
    hidden.clear();
    wrongSqKey = null;
    wrongCount = 0;
    stepErrors = 0;
    completedLine = false;
    renderRepertoireView();
    setTimeout(() => advanceTurnLogic(), 120);
  };

  const onSquareClick = (r, c) => {
    if (busy || completedLine || !isPlayerTurn()) return;

    if (selected) {
      const direct = legal.filter(m => m.to.r === r && m.to.c === c);
      const castleMatch = legal.filter(m => m.castle && m.from.r === r && m.kingToCol === c);
      const chosen = direct[0] || castleMatch[0];

      if (chosen) {
        const step = getActiveLine().steps[stepIdx];
        const expected = findExpectedMove(step);
        const ok = expected &&
          chosen.from.r === expected.from.r && chosen.from.c === expected.from.c &&
          chosen.to.r === expected.to.r && chosen.to.c === expected.to.c &&
          (chosen.castle || null) === (expected.castle || null);

        selected = null;
        legal = [];

        if (!ok) {
          wrongCount++;
          stepErrors++;
          const destC = chosen.castle ? chosen.kingToCol : chosen.to.c;
          wrongSqKey = `${chosen.to.r},${destC}`;
          app.haptics?.pulse('light');
          const tip = stepErrors >= 2
            ? `✕ Jugada incorrecta. Pista activada en el tablero: ${step.text}`
            : '✕ Jugada incorrecta para esta variante. Intenta de nuevo.';
          setFeedback('err', tip);
          renderBoard();
          return;
        }

        playStepAnimated(step, chosen, advanceTurnLogic);
        return;
      }
    }

    const p = engine.board[r][c];
    if (p && p.color === engine.turn) {
      selected = { r, c };
      legal = engine.getLegalMovesFrom(r, c);
    } else {
      selected = null;
      legal = [];
    }
    renderBoard();
  };

  const renderBoard = () => {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    const flipped = getActiveOpening().color === 'b';
    const last = engine.history[engine.history.length - 1] || null;

    // Mostrar guía visual en Modo Estudio o tras 2 fallos en Examen
    const curStep = getActiveLine().steps[stepIdx];
    const showGuide = Boolean(curStep && isPlayerTurn() && !completedLine && (trainMode === 'study' || stepErrors >= 2));
    const guideMove = showGuide ? findExpectedMove(curStep) : null;
    const guideFrom = guideMove ? `${guideMove.from.r},${guideMove.from.c}` : '';
    const guideTo = guideMove ? `${guideMove.to.r},${guideMove.castle ? guideMove.kingToCol : guideMove.to.c}` : '';

    for (let vr = 0; vr < 8; vr++) {
      for (let vc = 0; vc < 8; vc++) {
        const r = flipped ? 7 - vr : vr;
        const c = flipped ? 7 - vc : vc;
        const key = `${r},${c}`;

        const sq = document.createElement('div');
        sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        if (last) {
          const toCol = last.castle ? last.kingToCol : last.to.c;
          if (last.from.r === r && last.from.c === c) sq.classList.add('last-from');
          if (last.to.r === r && toCol === c) sq.classList.add('last-to');
        }
        if (selected && selected.r === r && selected.c === c) sq.classList.add('selected');
        if (key === guideFrom || key === guideTo) sq.classList.add('hint-sq');
        if (key === wrongSqKey) sq.classList.add('rep-wrong-sq');

        const matching = legal.filter(m => m.to.r === r && m.to.c === c);
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

        const piece = engine.board[r][c];
        if (piece && !hidden.has(key)) {
          const wrap = document.createElement('div');
          wrap.className = 'piece-wrap';
          wrap.innerHTML = app.pieceRenderer(piece.type, piece.color);
          sq.appendChild(wrap);
        }

        if (key === wrongSqKey) {
          const badge = document.createElement('span');
          badge.className = 'rep-wrong-x';
          badge.textContent = '✕';
          sq.appendChild(badge);
        }

        sq.addEventListener('click', () => onSquareClick(r, c));
        gridEl.appendChild(sq);
      }
    }
  };

  const updateMasteryBarsOnly = () => {
    const line = getActiveLine();
    const mEl = document.getElementById('rep-line-mastery');
    if (mEl) mEl.textContent = `${getLineMastery(line.id)}% Maestría`;
  };

  const launchPositionInMainBoard = async () => {
    stopTimers();
    const op = getActiveOpening();
    const line = getActiveLine();
    app.shell.navigate('play');
    app._setModeProgrammatically(op.color === 'w' ? 'ai-elo-1200' : 'pvp');
    app.setVariant('classic', { startFresh: false });
    app.flipped = op.color === 'b';
    app.startNewGame(518);

    for (const st of line.steps) {
      const all = app.engine.getLegalMoves(app.engine.turn);
      const found = st.castle
        ? all.find(m => m.castle === st.castle)
        : all.find(m => {
            const f = sqToRC(st.from);
            const t = sqToRC(st.to);
            return m.from.r === f.r && m.from.c === f.c && m.to.r === t.r && m.to.c === t.c;
          });
      if (!found) break;
      app.engine.makeMove(found);
    }

    // Si juegas Blancas contra IA y quedó turno negro, Stockfish responde 1 jugada para darte el turno
    if (op.color === 'w' && app.engine.turn === 'b' && app.stockfish) {
      const ok = await app.stockfish.init();
      if (ok) {
        const res = await app.stockfish.evaluatePosition(app.engine, { skill: 10, depth: 8, movetime: 200 });
        if (res?.move) app.engine.makeMove(res.move);
      }
    }
    app.render();
  };

  const renderRepertoireView = () => {
    const root = app.shell.viewRoot;
    const ops = REPERTOIRE.filter(o => o.color === activeColor);
    const op = getActiveOpening();
    const line = getActiveLine();

    root.innerHTML = `
      <div class="sec-head" style="margin-bottom:12px">
        <div>
          <h2>📚 Laboratorio de Repertorio</h2>
          <p class="sec-sub">Domina tus aperturas con Blancas y Negras, supera exámenes de memoria y analiza tus partidas reales.</p>
        </div>
        <button class="btn btn-secondary" id="rep-home">← Inicio</button>
      </div>

      <div class="rep-top-tabs">
        <button type="button" class="rep-color-btn ${activeColor === 'w' ? 'active' : ''}" data-rep-color="w">
          <span>⬜ Repertorio con Blancas</span>
          <span class="turn-pill">${getColorMastery('w')}%</span>
        </button>
        <button type="button" class="rep-color-btn ${activeColor === 'b' ? 'active' : ''}" data-rep-color="b">
          <span>⬛ Repertorio con Negras</span>
          <span class="turn-pill">${getColorMastery('b')}%</span>
        </button>
      </div>

      <div class="rep-openings">
        ${ops.map(o => {
          const pct = getOpeningMastery(o);
          return `
            <button type="button" class="rep-op-card ${o.id === op.id ? 'active' : ''}" data-rep-op="${o.id}">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                <strong style="font-size:0.9rem">${o.name}</strong>
                <span style="font-size:0.74rem;font-weight:800;color:${pct === 100 ? '#4ade80' : '#38bdf8'}">${pct}%</span>
              </div>
              <span class="sec-sub">${o.tag}</span>
              <div class="rep-mbar"><div class="rep-mbar-fill" style="width:${pct}%"></div></div>
            </button>
          `;
        }).join('')}
      </div>

      <div class="tr-list" style="margin-bottom:14px">
        ${op.lines.map(l => {
          const m = getLineMastery(l.id);
          return `<button type="button" class="tr-pill ${l.id === line.id ? 'active' : ''} ${m === 100 ? 'solved' : ''}" data-rep-line="${l.id}">
            ${m === 100 ? '🏆 ' : ''}${l.title} (${m}%)
          </button>`;
        }).join('')}
      </div>

      <div class="tr-layout">
        <div class="tr-board-wrap" id="rep-wrap">
          <div class="board-grid" id="rep-grid"></div>
          <canvas class="fx-canvas" id="rep-canvas"></canvas>
        </div>

        <div class="tr-panel">
          <div class="status-row">
            <span class="pos-badge" id="rep-line-mastery">${getLineMastery(line.id)}% Maestría</span>
            <span class="turn-pill" id="rep-progress">Jugada ${stepIdx} / ${line.steps.length}</span>
          </div>
          <h3>${line.title}</h3>
          <p class="sec-sub">${line.desc}</p>

          <div class="rep-mode-row">
            <button type="button" class="tr-pill ${trainMode === 'study' ? 'active' : ''}" data-rep-mode="study">📖 Estudiar con Maestro</button>
            <button type="button" class="tr-pill ${trainMode === 'exam' ? 'active' : ''}" data-rep-mode="exam">🧠 Examen de Memoria</button>
          </div>

          <div class="tr-feedback ${feedback.type}" id="rep-fb">${feedback.text}</div>

          <div class="tr-actions">
            <button type="button" class="btn btn-secondary" id="rep-retry">🔄 Reiniciar</button>
            <button type="button" class="btn btn-secondary ${voiceOn ? 'active' : ''}" id="rep-voice">${voiceOn ? '🔊 Voz' : '🔇 Voz'}</button>
            <button type="button" class="btn btn-primary" id="rep-play-pos">
              ${op.color === 'w' ? '🤖 Jugar desde aquí vs. Stockfish' : '♟ Llevar al Tablero'}
            </button>
          </div>
        </div>
      </div>

      <div id="rep-scout-slot"></div>
    `;

    gridEl = root.querySelector('#rep-grid');
    fbEl = root.querySelector('#rep-fb');
    fx = new CombatFX(root.querySelector('#rep-canvas'), root.querySelector('#rep-wrap'));
    const theme = THEMES[app.themes.currentId];
    if (theme) fx.setPalette(theme.fxPalette);

    root.querySelector('#rep-home')?.addEventListener('click', () => { stopTimers(); app.shell.navigate('home'); });
    root.querySelectorAll('[data-rep-color]').forEach(b => b.addEventListener('click', () => {
      activeColor = b.dataset.repColor;
      const firstOp = REPERTOIRE.find(o => o.color === activeColor);
      if (firstOp) { activeOpeningId = firstOp.id; activeLineId = firstOp.lines[0].id; }
      resetLine();
    }));
    root.querySelectorAll('[data-rep-op]').forEach(b => b.addEventListener('click', () => {
      activeOpeningId = b.dataset.repOp;
      activeLineId = getActiveOpening().lines[0].id;
      resetLine();
    }));
    root.querySelectorAll('[data-rep-line]').forEach(b => b.addEventListener('click', () => {
      activeLineId = b.dataset.repLine;
      resetLine();
    }));
    root.querySelectorAll('[data-rep-mode]').forEach(b => b.addEventListener('click', () => {
      trainMode = b.dataset.repMode;
      resetLine();
    }));
    root.querySelector('#rep-retry')?.addEventListener('click', () => resetLine());
    root.querySelector('#rep-voice')?.addEventListener('click', (e) => {
      voiceOn = !voiceOn;
      if (!voiceOn) app.analyzer?.voice?.stop();
      e.target.classList.toggle('active', voiceOn);
      e.target.textContent = voiceOn ? '🔊 Voz' : '🔇 Voz';
    });
    root.querySelector('#rep-play-pos')?.addEventListener('click', () => launchPositionInMainBoard());

    mountScoutPanel(root.querySelector('#rep-scout-slot'), {
      onTrainOpening: (color, opId) => {
        activeColor = color;
        activeOpeningId = opId;
        const found = REPERTOIRE.find(o => o.id === opId);
        if (found) activeLineId = found.lines[0].id;
        trainMode = 'study';
        resetLine();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    renderBoard();
  };

  // Registrar vista 'repertoire' en AppShell
  const origNav = app.shell.navigate.bind(app.shell);
  app.shell.navigate = (viewId) => {
    if (viewId !== 'repertoire') stopTimers();
    origNav(viewId);
    if (viewId === 'repertoire') resetLine();
  };

  const origRenderView = app.shell.renderCurrentView.bind(app.shell);
  app.shell.renderCurrentView = () => {
    if (app.shell.currentView === 'repertoire') { renderRepertoireView(); return; }
    origRenderView();
  };

  const origDrawer = app.shell._renderDrawer.bind(app.shell);
  app.shell._renderDrawer = () => {
    origDrawer();
    const learnItem = app.shell.drawerPanel?.querySelector('[data-nav="learn"]');
    if (!learnItem || app.shell.drawerPanel.querySelector('[data-nav="repertoire"]')) return;
    const btn = document.createElement('button');
    btn.className = `drawer-item ${app.shell.currentView === 'repertoire' ? 'active' : ''}`;
    btn.dataset.nav = 'repertoire';
    btn.innerHTML = '<span>📚 Repertorio</span><span class="mode-card-tag">NUEVO</span>';
    btn.addEventListener('click', () => { app.shell.closeDrawer(); app.shell.navigate('repertoire'); });
    learnItem.insertAdjacentElement('afterend', btn);
  };

  const origHome = app.shell._renderHome.bind(app.shell);
  app.shell._renderHome = () => {
    origHome();
    const strip = app.shell.viewRoot?.querySelector('.quick-strip');
    if (!strip || strip.querySelector('[data-nav="repertoire"]')) return;
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.dataset.nav = 'repertoire';
    btn.textContent = '📚 Laboratorio de Repertorio';
    btn.addEventListener('click', () => app.shell.navigate('repertoire'));
    strip.prepend(btn);
  };
}
