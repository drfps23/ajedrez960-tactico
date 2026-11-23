const MISSIONS_KEY = 'ajedrez960_daily_missions_v1';

const DAILY_DEFS = [
  { id: 'play_game',    icon: '⚔️', title: 'Combate Diario',       desc: 'Termina 1 partida en Clásico o 960.',          goal: 1, xp: 30, nav: 'play' },
  { id: 'solve_puzzle', icon: '🧩', title: 'Mente Táctica',        desc: 'Resuelve 2 problemas tácticos.',               goal: 2, xp: 35, nav: 'puzzles' },
  { id: 'study_review', icon: '🎓', title: 'Estudiante Constante', desc: 'Completa 1 lección o analiza 1 partida.',      goal: 1, xp: 35, nav: 'learn' }
];

const RANKS = [
  { minXp: 0,    name: 'Aprendiz' },
  { minXp: 100,  name: 'Escudero' },
  { minXp: 250,  name: 'Estratega' },
  { minXp: 500,  name: 'Táctico' },
  { minXp: 900,  name: 'Maestro' },
  { minXp: 1500, name: 'Leyenda' }
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getRankName(xp) {
  let rank = RANKS[0].name;
  for (const r of RANKS) {
    if (xp >= r.minXp) rank = r.name;
  }
  return rank;
}

function ensureMissionStyles() {
  if (document.querySelector('style[data-missions-css]')) return;
  const style = document.createElement('style');
  style.dataset.missionsCss = 'true';
  style.textContent = `
    .ms-box {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 15px; padding: 16px 18px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .ms-head {
      display: flex; flex-wrap: wrap; justify-content: space-between;
      align-items: center; gap: 10px;
    }
    .ms-head h3 { font-size: 1rem; font-weight: 800; }
    .ms-badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .ms-pill {
      font-size: 0.72rem; font-weight: 800; padding: 3px 10px;
      border-radius: 999px; background: rgba(250, 204, 21, 0.14); color: #facc15;
      border: 1px solid rgba(250, 204, 21, 0.3);
    }
    .ms-pill.xp { background: rgba(56, 189, 248, 0.14); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); }
    .ms-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; }
    .ms-card {
      background: rgba(9, 13, 22, 0.65); border: 1px solid var(--border-color);
      border-radius: 12px; padding: 12px; cursor: pointer; text-align: left;
      color: var(--text-main); display: flex; flex-direction: column; gap: 7px;
      transition: border-color 0.15s, transform 0.12s;
    }
    .ms-card:hover { border-color: var(--accent-cyan); transform: translateY(-2px); }
    .ms-card.done { border-color: rgba(34, 197, 94, 0.55); background: rgba(34, 197, 94, 0.08); }
    .ms-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 0.85rem; }
    .ms-bar { height: 6px; border-radius: 999px; background: rgba(148, 163, 184, 0.2); overflow: hidden; }
    .ms-bar-fill { height: 100%; background: linear-gradient(90deg, #38bdf8, #4ade80); transition: width 0.25s ease; }
  `;
  document.head.appendChild(style);
}

export function attachDailyMissions(app) {
  ensureMissionStyles();

  const loadState = () => {
    const today = todayKey();
    let st = { day: today, progress: {}, claimed: [], xp: 0, dayStreak: 0, lastActiveDay: '' };
    try {
      const parsed = JSON.parse(localStorage.getItem(MISSIONS_KEY) || 'null');
      if (parsed) st = { ...st, ...parsed };
    } catch { /* ignorar */ }

    if (st.day !== today) {
      st.day = today;
      st.progress = {};
      st.claimed = [];
    }
    return st;
  };

  let state = loadState();

  const saveState = () => {
    try { localStorage.setItem(MISSIONS_KEY, JSON.stringify(state)); } catch { /* ignorar */ }
  };

  const addProgress = (missionId, amount = 1) => {
    state = loadState();
    const def = DAILY_DEFS.find(m => m.id === missionId);
    if (!def) return;

    const prev = state.progress[missionId] || 0;
    const next = Math.min(def.goal, prev + amount);
    state.progress[missionId] = next;

    if (next >= def.goal && !state.claimed.includes(missionId)) {
      state.claimed.push(missionId);
      state.xp += def.xp;

      const today = todayKey();
      if (state.lastActiveDay !== today) {
        state.dayStreak = state.lastActiveDay === yesterdayKey() ? state.dayStreak + 1 : 1;
        state.lastActiveDay = today;
      }

      const newRank = getRankName(state.xp);
      app.store.updateProfile({ title: newRank });
      app.store.addMessage({
        icon: def.icon,
        title: `Misión completada: ${def.title} (+${def.xp} XP)`,
        body: `Rango actual: ${newRank} (${state.xp} XP) · Racha diaria: ${state.dayStreak} día(s).`
      });
      app.store.save();
    }
    saveState();
  };

  // Conectar eventos reales del juego a las misiones
  const origRecordGame = app.store.recordGame.bind(app.store);
  app.store.recordGame = (payload) => {
    const res = origRecordGame(payload);
    addProgress('play_game', 1);
    return res;
  };

  if (app.puzzles?._markSolved) {
    const origSolve = app.puzzles._markSolved.bind(app.puzzles);
    app.puzzles._markSolved = (id) => {
      const res = origSolve(id);
      addProgress('solve_puzzle', 1);
      return res;
    };
  }

  if (app.academy?._markDone) {
    const origLesson = app.academy._markDone.bind(app.academy);
    app.academy._markDone = (id) => {
      const res = origLesson(id);
      addProgress('study_review', 1);
      return res;
    };
  }

  if (app.analyzer?.startAnalysis) {
    const origAna = app.analyzer.startAnalysis.bind(app.analyzer);
    app.analyzer.startAnalysis = (...args) => {
      addProgress('study_review', 1);
      return origAna(...args);
    };
  }

  // Insertar tarjeta de Misiones Diarias en la Pantalla de Inicio
  const origHome = app.shell._renderHome.bind(app.shell);
  app.shell._renderHome = () => {
    origHome();
    state = loadState();
    const hero = app.shell.viewRoot?.querySelector('.home-hero');
    if (!hero || app.shell.viewRoot.querySelector('.ms-box')) return;

    const doneCount = DAILY_DEFS.filter(d => state.claimed.includes(d.id)).length;
    const rank = getRankName(state.xp);

    const box = document.createElement('section');
    box.className = 'ms-box';
    box.innerHTML = `
      <div class="ms-head">
        <h3>🎯 Misiones de Hoy (${doneCount}/${DAILY_DEFS.length})</h3>
        <div class="ms-badges">
          <span class="ms-pill">🔥 Racha: ${state.dayStreak} día(s)</span>
          <span class="ms-pill xp">⭐ ${rank} · ${state.xp} XP</span>
        </div>
      </div>
      <div class="ms-grid">
        ${DAILY_DEFS.map(d => {
          const cur = Math.min(d.goal, state.progress[d.id] || 0);
          const done = state.claimed.includes(d.id);
          const pct = Math.round((cur / d.goal) * 100);
          return `
            <button type="button" class="ms-card ${done ? 'done' : ''}" data-ms-nav="${d.nav}">
              <div class="ms-top">
                <strong>${d.icon} ${d.title}</strong>
                <span style="font-weight:800;color:${done ? '#4ade80' : '#facc15'}">${done ? '✓ +' + d.xp + ' XP' : `${cur}/${d.goal}`}</span>
              </div>
              <span class="sec-sub">${d.desc}</span>
              <div class="ms-bar"><div class="ms-bar-fill" style="width:${pct}%"></div></div>
            </button>
          `;
        }).join('')}
      </div>
    `;

    hero.insertAdjacentElement('afterend', box);
    box.querySelectorAll('[data-ms-nav]').forEach(btn => {
      btn.addEventListener('click', () => app.shell.navigate(btn.dataset.msNav));
    });
  };
}
