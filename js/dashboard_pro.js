import { PUZZLES } from './data/puzzles_data.js';

const FLAG_KEY = 'ajedrez960_flag_v1';
const PACE_KEY = 'ajedrez960_pace_ratings_v1';
const WEEK_KEY = 'ajedrez960_active_days_v1';

const COUNTRY_FLAGS = [
  '🌍', '🇦🇷', '🇧🇴', '🇧🇷', '🇨🇱', '🇨🇴', '🇨🇷', '🇨🇺',
  '🇩🇴', '🇪🇨', '🇸🇻', '🇪🇸', '🇺🇸', '🇬🇹', '🇭🇳', '🇲🇽',
  '🇳🇮', '🇵🇦', '🇵🇾', '🇵🇪', '🇵🇷', '🇺🇾', '🇻🇪'
];

const GLYPHS = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

function dateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDailyPuzzle() {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  return PUZZLES[daysSinceEpoch % PUZZLES.length] || PUZZLES[0];
}

function renderMiniFenBoard(fen) {
  const rows = (fen || '').split(' ')[0].split('/');
  let cells = '';
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of (rows[r] || '')) {
      if (ch >= '1' && ch <= '8') {
        const n = parseInt(ch, 10);
        for (let k = 0; k < n; k++) {
          cells += `<div class="dp-sq ${(r + c) % 2 === 0 ? 'l' : 'd'}"></div>`;
          c++;
        }
      } else {
        const isW = ch === ch.toUpperCase();
        cells += `<div class="dp-sq ${(r + c) % 2 === 0 ? 'l' : 'd'} ${isW ? 'pw' : 'pb'}">${GLYPHS[ch] || ''}</div>`;
        c++;
      }
    }
  }
  return `<div class="dp-miniboard">${cells}</div>`;
}

function ensureProStyles() {
  if (document.querySelector('style[data-dash-pro-css]')) return;
  const style = document.createElement('style');
  style.dataset.dashProCss = 'true';
  style.textContent = `
    .dp-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;
    }
    .dp-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 15px; padding: 14px 16px;
      display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
    }
    .dp-row { display: flex; gap: 12px; align-items: center; }
    .dp-miniboard {
      width: 96px; height: 96px; flex-shrink: 0; border-radius: 8px; overflow: hidden;
      border: 2px solid var(--board-border);
      display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr);
    }
    .dp-sq { display: grid; place-items: center; font-size: 10px; line-height: 1; }
    .dp-sq.l { background: var(--sq-light); }
    .dp-sq.d { background: var(--sq-dark); }
    .dp-sq.pw { color: #ffffff; text-shadow: 0 1px 2px #000; }
    .dp-sq.pb { color: #090d16; text-shadow: 0 0 2px #38bdf8; }
    .dp-week { display: flex; gap: 6px; justify-content: space-between; margin-top: 4px; }
    .dp-day {
      flex: 1; text-align: center; padding: 6px 2px; border-radius: 8px;
      background: rgba(9, 13, 22, 0.7); border: 1px solid var(--border-color);
      font-size: 0.7rem; font-weight: 800; color: var(--text-muted);
      display: flex; flex-direction: column; gap: 3px; align-items: center;
    }
    .dp-day.active {
      border-color: #22c55e; background: rgba(34, 197, 94, 0.16); color: #4ade80;
    }
    .dp-day.today { box-shadow: 0 0 0 1.5px var(--accent-cyan); }
    .dp-stats-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 9px; }
    .dp-stat-box {
      background: rgba(9, 13, 22, 0.65); border: 1px solid var(--border-color);
      border-radius: 11px; padding: 10px 12px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .dp-stat-box strong { font-size: 1rem; color: var(--accent-cyan); }
    .dp-flags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .dp-flag-btn {
      font-size: 1.25rem; padding: 5px 8px; border-radius: 8px; cursor: pointer;
      background: rgba(9, 13, 22, 0.75); border: 1px solid var(--border-color);
    }
    .dp-flag-btn.active { border-color: #facc15; background: rgba(250, 204, 21, 0.18); }
  `;
  document.head.appendChild(style);
}

export function attachDashboardPro(app) {
  ensureProStyles();

  const loadPace = () => {
    const def = { blitz: 1200, rapid: 1200, classical: 1200, puzzles: 1200, puzzleSolved: 0 };
    try { return { ...def, ...JSON.parse(localStorage.getItem(PACE_KEY) || '{}') }; }
    catch { return def; }
  };

  const savePace = (obj) => {
    try { localStorage.setItem(PACE_KEY, JSON.stringify(obj)); } catch { /* ignorar */ }
  };

  const getFlag = () => {
    try { return localStorage.getItem(FLAG_KEY) || '🌍'; } catch { return '🌍'; }
  };

  const setFlag = (f) => {
    try { localStorage.setItem(FLAG_KEY, f); } catch { /* ignorar */ }
    app.matchmaking?.syncCloudPlayer?.();
  };

  const loadActiveDays = () => {
    try { return new Set(JSON.parse(localStorage.getItem(WEEK_KEY) || '[]')); }
    catch { return new Set(); }
  };

  const markTodayActive = () => {
    const days = loadActiveDays();
    days.add(dateStr());
    const trimmed = [...days].slice(-45);
    try { localStorage.setItem(WEEK_KEY, JSON.stringify(trimmed)); } catch { /* ignorar */ }
  };

  // Registrar ELO por ritmo en partidas online
  const origRecord = app.store.recordGame.bind(app.store);
  app.store.recordGame = (payload) => {
    const res = origRecord(payload);
    markTodayActive();

    if (payload?.mode === 'online') {
      const clk = app.clock?.preset?.id || '10+0';
      const bucket = (clk === '3+2' || clk === '5+3')
        ? 'blitz'
        : (clk === '15+10' || clk === '30+0')
          ? 'classical'
          : 'rapid';
      const pace = loadPace();
      const delta = payload.result === 'win' ? 14 : payload.result === 'loss' ? -12 : 1;
      pace[bucket] = Math.max(400, pace[bucket] + delta);
      savePace(pace);
    }
    return res;
  };

  // Registrar ELO de Problemas Tácticos
  if (app.puzzles) {
    let penalizedId = '';
    const origSolved = app.puzzles._markSolved.bind(app.puzzles);
    app.puzzles._markSolved = (id) => {
      const res = origSolved(id);
      markTodayActive();
      const pace = loadPace();
      pace.puzzles = Math.min(3000, pace.puzzles + 18);
      pace.puzzleSolved = (pace.puzzleSolved || 0) + 1;
      savePace(pace);
      penalizedId = '';
      return res;
    };

    const origFb = app.puzzles._setFeedback.bind(app.puzzles);
    app.puzzles._setFeedback = (type, text) => {
      if (type === 'err' && app.puzzles.puzzle?.id && penalizedId !== app.puzzles.puzzle.id) {
        penalizedId = app.puzzles.puzzle.id;
        const pace = loadPace();
        pace.puzzles = Math.max(400, pace.puzzles - 8);
        savePace(pace);
      }
      return origFb(type, text);
    };
  }

  if (app.academy?._markDone) {
    const origDone = app.academy._markDone.bind(app.academy);
    app.academy._markDone = (id) => {
      markTodayActive();
      return origDone(id);
    };
  }

  // Construir semana actual Lunes -> Domingo
  const buildWeekHtml = () => {
    const active = loadActiveDays();
    const today = new Date();
    const todayIso = dateStr(today);
    const dow = (today.getDay() + 6) % 7; // 0 = Lunes ... 6 = Domingo
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    return labels.map((lbl, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() - dow + idx);
      const iso = dateStr(d);
      const ok = active.has(iso);
      return `
        <div class="dp-day ${ok ? 'active' : ''} ${iso === todayIso ? 'today' : ''}">
          <span>${lbl}</span>
          <span>${ok ? '✓' : '·'}</span>
        </div>
      `;
    }).join('');
  };

  // 1. Inyectar widgets visuales + bandera en Pantalla de Inicio
  const origHome = app.shell._renderHome.bind(app.shell);
  app.shell._renderHome = () => {
    origHome();
    const root = app.shell.viewRoot;
    if (!root) return;

    // Mostrar bandera al lado del saludo
    const h2 = root.querySelector('.home-hero h2');
    const flag = getFlag();
    if (h2 && flag && !h2.textContent.includes(flag)) {
      h2.textContent = `${h2.textContent} ${flag}`;
    }

    if (root.querySelector('.dp-grid')) return;

    const daily = getDailyPuzzle();
    const games = app.historyVault?.loadGames?.() || [];
    const lastGame = games[0] || null;
    const pace = loadPace();
    const activeDaysCount = loadActiveDays().size;

    const section = document.createElement('section');
    section.className = 'dp-grid';
    section.innerHTML = `
      <div class="dp-card">
        <div class="dp-row">
          ${renderMiniFenBoard(daily.fen)}
          <div>
            <span class="mode-card-tag">PROBLEMA DEL DÍA</span>
            <h3 style="font-size:0.95rem;margin-top:4px">${daily.title}</h3>
            <p class="sec-sub">${daily.theme} · ELO Problemas: <strong>${pace.puzzles}</strong></p>
          </div>
        </div>
        <button type="button" class="btn btn-primary" id="dp-daily-btn" style="width:100%">🧩 Resolver Problema del Día</button>
      </div>

      <div class="dp-card">
        <div>
          <span class="mode-card-tag">ÚLTIMA PARTIDA</span>
          ${lastGame ? `
            <h3 style="font-size:0.95rem;margin-top:5px">vs. ${lastGame.opponent}</h3>
            <p class="sec-sub" style="margin-top:3px">
              ${lastGame.outcome === 'win' ? '✅ Victoria' : lastGame.outcome === 'loss' ? '❌ Derrota' : '🤝 Tablas'}
              · ${lastGame.clockShort || 'Sin reloj'} · ${Math.ceil(lastGame.plies / 2)} jug.
              ${lastGame.whiteAcc != null ? `<br/>Precisión: <strong>${lastGame.whiteAcc}% / ${lastGame.blackAcc}%</strong>` : ''}
            </p>
          ` : `
            <h3 style="font-size:0.95rem;margin-top:5px">Sin partidas recientes</h3>
            <p class="sec-sub" style="margin-top:3px">Termina una partida para revisarla al instante con Stockfish y el Entrenador.</p>
          `}
        </div>
        <button type="button" class="btn btn-secondary" id="dp-last-btn" style="width:100%">
          ${lastGame ? '📊 Revisar Última Partida' : '⚔️ Jugar Ahora'}
        </button>
      </div>

      <div class="dp-card">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="mode-card-tag">RACHA SEMANAL</span>
            <span class="sec-sub">🔥 ${activeDaysCount} día(s)</span>
          </div>
          <div class="dp-week">${buildWeekHtml()}</div>
          <div class="sec-sub" style="margin-top:8px;display:flex;justify-content:space-between">
            <span>⚡ Blitz: <strong>${pace.blitz}</strong></span>
            <span>⏱ Rápida: <strong>${pace.rapid}</strong></span>
            <span>👑 Clásica: <strong>${pace.classical}</strong></span>
          </div>
        </div>
        <button type="button" class="btn btn-ghost" id="dp-stats-btn" style="width:100%">📈 Ver Estadísticas Completas</button>
      </div>
    `;

    const mmCard = root.querySelector('.mm-card') || root.querySelector('.home-hero');
    if (mmCard) mmCard.insertAdjacentElement('afterend', section);

    section.querySelector('#dp-daily-btn')?.addEventListener('click', () => {
      app.shell.navigate('puzzles');
      app.puzzles?.loadPuzzle(daily.id);
    });
    section.querySelector('#dp-last-btn')?.addEventListener('click', () => {
      if (lastGame) app.historyVault?.openSavedForAnalysis(lastGame);
      else app.shell.navigate('play');
    });
    section.querySelector('#dp-stats-btn')?.addEventListener('click', () => app.shell.navigate('profile'));
  };

  // 2. Añadir Bandera de País y Estadísticas por Ritmo en Perfil
  const origProfile = app.shell._renderProfileView.bind(app.shell);
  app.shell._renderProfileView = () => {
    origProfile();
    const root = app.shell.viewRoot;
    if (!root || root.querySelector('#dp-profile-extras')) return;

    const pace = loadPace();
    const currentFlag = getFlag();
    const totalGames = (app.store.data.stats.classic.games || 0) + (app.store.data.stats.fischer960.games || 0);
    const lessonsDone = app.academy?.completed?.size || 0;

    const box = document.createElement('div');
    box.id = 'dp-profile-extras';
    box.className = 'settings-box';
    box.style.marginTop = '12px';
    box.innerHTML = `
      <div>
        <strong>📈 Estadísticas por Ritmo y Problemas</strong>
        <div class="dp-stats-list" style="margin-top:10px">
          <div class="dp-stat-box"><span>⏱ Rápida (10m)</span><strong>${pace.rapid}</strong></div>
          <div class="dp-stat-box"><span>⚡ Blitz (3m / 5m)</span><strong>${pace.blitz}</strong></div>
          <div class="dp-stat-box"><span>👑 Clásica (15m / 30m)</span><strong>${pace.classical}</strong></div>
          <div class="dp-stat-box"><span>🧩 ELO Problemas</span><strong>${pace.puzzles}</strong></div>
          <div class="dp-stat-box"><span>♟ Partidas Totales</span><strong>${totalGames}</strong></div>
          <div class="dp-stat-box"><span>🎓 Lecciones</span><strong>${lessonsDone}</strong></div>
        </div>
      </div>

      <div style="margin-top:12px">
        <strong>🏳️ Bandera de País (Perfil y Ranking Global)</strong>
        <div class="dp-flags">
          ${COUNTRY_FLAGS.map(f => `
            <button type="button" class="dp-flag-btn ${f === currentFlag ? 'active' : ''}" data-flag="${f}">${f}</button>
          `).join('')}
        </div>
      </div>
    `;

    root.appendChild(box);
    box.querySelectorAll('[data-flag]').forEach(btn => {
      btn.addEventListener('click', () => {
        setFlag(btn.dataset.flag);
        app.shell._renderProfileView();
      });
    });
  };
}
