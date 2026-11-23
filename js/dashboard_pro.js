import { PUZZLES } from './data/puzzles_data.js';
import { Chess960Engine, FILES } from './engine.js';
import { detectOpening } from './openings.js';

const FLAG_KEY = 'ajedrez960_flag_v1';
const PACE_KEY = 'ajedrez960_pace_ratings_v1';
const WEEK_KEY = 'ajedrez960_active_days_v1';
const DAILY_CACHE_KEY = 'ajedrez960_lichess_daily_v1';

const COUNTRY_FLAGS = [
  '🌍', '🇦🇷', '🇧🇴', '🇧🇷', '🇨🇱', '🇨🇴', '🇨🇷', '🇨🇺',
  '🇩🇴', '🇪🇨', '🇸🇻', '🇪🇸', '🇺🇸', '🇬🇹', '🇭🇳', '🇲🇽',
  '🇳🇮', '🇵🇦', '🇵🇾', '🇵🇪', '🇵🇷', '🇺🇾', '🇻🇪'
];

const GLYPHS = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

const EN_TO_ES = { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' };

const REPERTOIRE_TARGETS = [
  { id: 'italian', color: 'w', name: 'Apertura Italiana', keywords: ['italian', 'giuoco', 'two knights', 'dos caballos', 'italiana', 'evans', 'c50', 'c53', 'c54', 'c55'] },
  { id: 'london', color: 'w', name: 'Sistema Londres', keywords: ['london', 'londres', 'queen pawn', 'd00', 'd02'] },
  { id: 'queens_gambit', color: 'w', name: 'Gambito de Dama', keywords: ['queen', 'gambito de dama', 'slav', 'eslava', 'd06', 'd20', 'd30', 'd35'] },
  { id: 'sicilian', color: 'b', name: 'Defensa Siciliana', keywords: ['sicilian', 'siciliana', 'najdorf', 'dragon', 'bowdler', 'b20', 'b30', 'b50', 'b90'] },
  { id: 'carokann', color: 'b', name: 'Defensa Caro-Kann', keywords: ['caro-kann', 'caro kann', 'carokann', 'b10', 'b12', 'b15', 'b18'] },
  { id: 'kid', color: 'b', name: 'India de Rey / Anti-Londres', keywords: ['indian', 'india de rey', 'e60', 'e70', 'e90', 'd02'] }
];

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function findRecommendedOpening(name, eco, color) {
  const hay = `${name || ''} ${eco || ''}`.toLowerCase();
  const pool = REPERTOIRE_TARGETS.filter(o => o.color === color);
  return pool.find(o => o.keywords.some(kw => hay.includes(kw))) || pool[0] || null;
}

function dateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getLocalDailyPuzzle() {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  return PUZZLES[daysSinceEpoch % PUZZLES.length] || PUZZLES[0];
}

function cleanSan(s) {
  return String(s || '').replace(/[+#!?=]/g, '').replace(/0/g, 'O').trim();
}

function lichessTokenToEs(tok) {
  let s = String(tok || '').replace(/^\d+\.+/, '').replace(/[+#!?]/g, '').replace(/0/g, 'O').trim();
  if (!s || s.startsWith('O-O')) return s;
  if (EN_TO_ES[s[0]]) s = EN_TO_ES[s[0]] + s.slice(1);
  s = s.replace(/=([KQRBN])/, (_, p) => EN_TO_ES[p] || p);
  return s.replace(/=/g, '');
}

function engineToFen(eng) {
  const ranks = [];
  for (let r = 0; r < 8; r++) {
    let row = '';
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = eng.board[r][c];
      if (!p) {
        empty++;
      } else {
        if (empty) {
          row += empty;
          empty = 0;
        }
        row += p.color === 'w' ? p.type : p.type.toLowerCase();
      }
    }
    if (empty) row += empty;
    ranks.push(row);
  }
  let cast = '';
  if (eng.castling?.w?.K) cast += 'K';
  if (eng.castling?.w?.Q) cast += 'Q';
  if (eng.castling?.b?.K) cast += 'k';
  if (eng.castling?.b?.Q) cast += 'q';
  const ep = eng.epTarget && typeof eng.epTarget.r === 'number' && typeof eng.epTarget.c === 'number' && FILES[eng.epTarget.c]
    ? `${FILES[eng.epTarget.c]}${8 - eng.epTarget.r}`
    : '-';
  return `${ranks.join('/')} ${eng.turn} ${cast || '-'} ${ep} 0 1`;
}

function hasLegalUci(eng, uci) {
  if (!uci || uci.length < 4) return false;
  const fr = 8 - parseInt(uci[1], 10);
  const fc = FILES.indexOf(uci[0]);
  const tr = 8 - parseInt(uci[3], 10);
  const tc = FILES.indexOf(uci[2]);
  return eng.getLegalMoves(eng.turn).some(m =>
    m.from.r === fr &&
    m.from.c === fc &&
    ((m.to.r === tr && m.to.c === tc) || (m.castle && Math.abs(tc - fc) >= 2))
  );
}

async function fetchLiveDailyPuzzle() {
  const today = dateStr();
  try {
    const cached = JSON.parse(localStorage.getItem(DAILY_CACHE_KEY) || 'null');
    if (cached && cached.day === today && cached.puzzle) return cached.puzzle;
  } catch { /* ignorar */ }

  const res = await fetch('https://lichess.org/api/puzzle/daily');
  if (!res.ok) throw new Error('Sin acceso diario');
  const data = await res.json();

  const rawTokens = String(data?.game?.pgn || '')
    .split(/\s+/)
    .map(t => t.replace(/^\d+\.+/, '').trim())
    .filter(t => t && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t));

  const solution = Array.isArray(data?.puzzle?.solution) ? data.puzzle.solution : [];
  if (!rawTokens.length || !solution.length) throw new Error('Formato incompleto');

  const sim = new Chess960Engine(518);
  let targetFen = null;
  const stopPly = Math.min(rawTokens.length, (data.puzzle.initialPly ?? rawTokens.length - 1) + 1);

  for (let i = 0; i < rawTokens.length; i++) {
    const want = lichessTokenToEs(rawTokens[i]);
    if (!want) continue;
    const legal = sim.getLegalMoves(sim.turn);
    const match = legal.find(m => {
      const rec = sim.clone().makeMove(m);
      return cleanSan(rec.san) === want;
    });
    if (!match) break;
    sim.makeMove(match);
    if (i + 1 === stopPly && hasLegalUci(sim, solution[0])) {
      targetFen = engineToFen(sim);
      break;
    }
  }

  if (!targetFen && hasLegalUci(sim, solution[0])) {
    targetFen = engineToFen(sim);
  }
  if (!targetFen) throw new Error('Posición no verificada');

  const puzzleObj = {
    id: `daily_${data.puzzle.id || today}`,
    isLive: true,
    variant: 'classic',
    title: `Desafío Mundial · ${today}`,
    theme: '🌍 Problema del Día',
    rating: data.puzzle.rating || 1500,
    fen: targetFen,
    solution,
    hint: 'Observa los jaques, capturas y amenazas tácticas de la pieza resaltada.',
    explanation: `¡Excelente visión! Has superado el Problema del Día oficial (ELO ${data.puzzle.rating || 1500}).`
  };

  try {
    localStorage.setItem(DAILY_CACHE_KEY, JSON.stringify({ day: today, puzzle: puzzleObj }));
  } catch { /* ignorar */ }
  return puzzleObj;
}

function renderMiniFenBoard(fen) {
  const rows = String(fen || '').split(' ')[0].split('/');
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
    .dp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; }
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
    .dp-day.active { border-color: #22c55e; background: rgba(34, 197, 94, 0.16); color: #4ade80; }
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
    .dp-rec-box {
      margin-top: 6px; padding: 9px 11px; border-radius: 10px;
      background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.35);
      display: flex; flex-direction: column; gap: 7px; font-size: 0.78rem;
    }

    /* Menú lateral fijo en computadora, plegable en celular */
    .dt-sidebar { display: none; }
    @media (min-width: 1080px) {
      body.has-dt-sidebar { padding-left: 230px; }
      body.has-dt-sidebar .dt-topbar-menu-btn { display: none !important; }
      body.has-dt-sidebar .dt-sidebar {
        display: flex; flex-direction: column;
        position: fixed; top: 0; left: 0; bottom: 0; width: 230px; z-index: 45;
        background: linear-gradient(180deg, rgba(13, 19, 34, 0.98), rgba(8, 12, 22, 0.99));
        border-right: 1px solid var(--border-color);
        padding: 14px 10px; gap: 10px;
      }
      .dt-sb-brand {
        display: flex; align-items: center; gap: 10px; padding: 6px 8px 12px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.14); cursor: pointer;
      }
      .dt-sb-logo {
        width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center;
        background: linear-gradient(135deg, #0284c7, #6366f1); color: #fff; font-size: 1.15rem; flex-shrink: 0;
      }
      .dt-sb-brand strong { display: block; font-size: 0.92rem; color: #f8fafc; line-height: 1.15; }
      .dt-sb-brand span { font-size: 0.7rem; color: var(--text-muted); }
      .dt-sb-nav {
        flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 2px;
      }
      .dt-sb-item {
        width: 100%; background: transparent; border: 1px solid transparent; border-radius: 10px;
        color: var(--text-main); padding: 9px 11px; font-size: 0.84rem; font-weight: 700;
        display: flex; justify-content: space-between; align-items: center; gap: 8px;
        cursor: pointer; text-align: left; transition: background 0.15s, border-color 0.15s;
      }
      .dt-sb-item:hover { background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.28); }
      .dt-sb-item.active {
        background: rgba(56, 189, 248, 0.18); border-color: var(--accent-cyan); color: var(--accent-cyan);
      }
      .dt-sb-profile {
        display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 11px;
        background: rgba(15, 23, 42, 0.85); border: 1px solid var(--border-color);
        color: var(--text-main); cursor: pointer; text-align: left;
      }
      .dt-sb-profile:hover { border-color: var(--accent-cyan); }
      .dt-sb-av { font-size: 1.35rem; }
      .dt-sb-pinfo { min-width: 0; }
      .dt-sb-pinfo strong {
        display: block; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .dt-sb-pinfo span { font-size: 0.7rem; color: var(--accent-cyan); font-weight: 700; }
    }
    @media (min-width: 1080px) and (max-width: 1479px) {
      body.has-dt-sidebar.review-coach-open { padding-left: 0; }
      body.has-dt-sidebar.review-coach-open .dt-sidebar { display: none; }
      body.has-dt-sidebar.review-coach-open .dt-topbar-menu-btn { display: inline-flex !important; }
    }
  `;
  document.head.appendChild(style);
}

export function attachDashboardPro(app) {
  ensureProStyles();

  let dailyPuzzle = getLocalDailyPuzzle();
  let triggerSidebarSync = () => {};

  fetchLiveDailyPuzzle()
    .then((live) => {
      dailyPuzzle = live;
      if (app.shell?.currentView === 'home') app.shell.renderCurrentView();
    })
    .catch(() => { /* mantener respaldo local offline */ });

  const loadPace = () => {
    const def = { blitz: 1200, rapid: 1200, classical: 1200, puzzles: 1200, puzzleSolved: 0 };
    try {
      return { ...def, ...JSON.parse(localStorage.getItem(PACE_KEY) || '{}') };
    } catch {
      return def;
    }
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
    triggerSidebarSync();
  };

  const loadActiveDays = () => {
    try { return new Set(JSON.parse(localStorage.getItem(WEEK_KEY) || '[]')); }
    catch { return new Set(); }
  };

  const markTodayActive = () => {
    const days = loadActiveDays();
    days.add(dateStr());
    try { localStorage.setItem(WEEK_KEY, JSON.stringify([...days].slice(-45))); } catch { /* ignorar */ }
  };

  if (app.store?.recordGame) {
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
      triggerSidebarSync();
      return res;
    };
  }

  if (app.puzzles?._markSolved && app.puzzles?._setFeedback) {
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

  const buildWeekHtml = () => {
    const active = loadActiveDays();
    const today = new Date();
    const todayIso = dateStr(today);
    const dow = (today.getDay() + 6) % 7;
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

  // 1. Widgets visuales en Pantalla de Inicio
  if (app.shell?._renderHome) {
    const origHome = app.shell._renderHome.bind(app.shell);
    app.shell._renderHome = () => {
      origHome();
      const root = app.shell.viewRoot;
      if (!root) return;

      const h2 = root.querySelector('.home-hero h2');
      const flag = getFlag();
      if (h2 && flag && !h2.textContent.includes(flag)) {
        h2.textContent = `${h2.textContent} ${flag}`;
      }
      if (root.querySelector('.dp-grid')) return;

      const games = app.historyVault?.loadGames?.() || [];
      const lastGame = games[0] || null;
      const pace = loadPace();
      const activeDaysCount = loadActiveDays().size;

      const section = document.createElement('section');
      section.className = 'dp-grid';
      section.innerHTML = `
        <div class="dp-card">
          <div class="dp-row">
            ${renderMiniFenBoard(dailyPuzzle.fen)}
            <div>
              <span class="mode-card-tag">${dailyPuzzle.isLive ? '🌍 PROBLEMA DEL DÍA (EN VIVO)' : 'PROBLEMA DEL DÍA'}</span>
              <h3 style="font-size:0.95rem;margin-top:4px">${esc(dailyPuzzle.title)}</h3>
              <p class="sec-sub">${dailyPuzzle.rating ? `Nivel ${dailyPuzzle.rating} ELO` : esc(dailyPuzzle.theme)} · Tu ELO: <strong>${pace.puzzles}</strong></p>
            </div>
          </div>
          <button type="button" class="btn btn-primary" id="dp-daily-btn" style="width:100%">🧩 Resolver Problema del Día</button>
        </div>

        <div class="dp-card">
          <div>
            <span class="mode-card-tag">ÚLTIMA PARTIDA</span>
            ${lastGame ? `
              <h3 style="font-size:0.95rem;margin-top:5px">vs. ${esc(lastGame.opponent)}</h3>
              <p class="sec-sub" style="margin-top:3px">
                ${lastGame.outcome === 'win' ? '✅ Victoria' : lastGame.outcome === 'loss' ? '❌ Derrota' : '🤝 Tablas'}
                · ${esc(lastGame.clockShort || 'Sin reloj')} · ${Math.ceil((lastGame.plies || 0) / 2)} jug.
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

      const anchor = root.querySelector('.mm-card') || root.querySelector('.home-hero');
      if (anchor) anchor.insertAdjacentElement('afterend', section);

      section.querySelector('#dp-daily-btn')?.addEventListener('click', () => {
        app.shell.navigate('puzzles');
        if (dailyPuzzle.isLive && typeof app.puzzles?.loadExternalPuzzle === 'function') {
          app.puzzles.loadExternalPuzzle(dailyPuzzle);
        } else {
          app.puzzles?.loadPuzzle?.(dailyPuzzle.id);
        }
      });
      section.querySelector('#dp-last-btn')?.addEventListener('click', () => {
        if (lastGame) app.historyVault?.openSavedForAnalysis?.(lastGame);
        else app.shell.navigate('play');
      });
      section.querySelector('#dp-stats-btn')?.addEventListener('click', () => app.shell.navigate('profile'));
    };
  }

  // 2. Bandera de País y Estadísticas por Ritmo en Perfil
  if (app.shell?._renderProfileView) {
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

  // 3. Recomendación inteligente de Apertura al revisar una partida Clásica
  if (app.analyzer?._renderReviewPanel) {
    const origReview = app.analyzer._renderReviewPanel.bind(app.analyzer);
    app.analyzer._renderReviewPanel = () => {
      origReview();
      const box = app.dom?.postgameSlot?.querySelector('.an-box');
      if (!box || !app.analyzer.inReview || app.analyzer.positionId !== 518) return;
      if (box.querySelector('.dp-rec-box')) return;

      const moves = (app.analyzer.results || []).map(r => r.played).filter(Boolean);
      const op = typeof detectOpening === 'function' ? detectOpening(moves) : null;
      if (!op) return;

      const myColor = app.flipped ? 'b' : 'w';
      const target = findRecommendedOpening(op.name, op.eco, myColor);
      if (!target) return;

      const rec = document.createElement('div');
      rec.className = 'dp-rec-box';
      rec.innerHTML = `
        <span>📚 Apertura jugada: <strong>${esc(op.name)}</strong></span>
        <button type="button" class="btn btn-secondary" id="dp-train-rec" style="width:100%">
          🎯 Practicar ${esc(target.name)} en Repertorio
        </button>
      `;
      box.appendChild(rec);

      rec.querySelector('#dp-train-rec')?.addEventListener('click', () => {
        app.analyzer.exitReview();
        app.shell.navigate('repertoire');
        setTimeout(() => {
          document.querySelector(`[data-rep-color="${myColor}"]`)?.click();
          setTimeout(() => {
            document.querySelector(`[data-rep-op="${target.id}"]`)?.click();
          }, 90);
        }, 90);
      });
    };
  }

  // 4. Menú lateral fijo en PC (desplegable en celular)
  if (!document.getElementById('dt-sidebar')) {
    const aside = document.createElement('aside');
    aside.id = 'dt-sidebar';
    aside.className = 'dt-sidebar';
    document.body.appendChild(aside);
    document.body.classList.add('has-dt-sidebar');

    const markTopMenuBtn = () => {
      document.querySelectorAll('header button, .topbar button, .app-header button').forEach(b => {
        if ((b.textContent || '').includes('Menú')) b.classList.add('dt-topbar-menu-btn');
      });
    };

    let rafId = null;
    const syncSidebar = () => {
      rafId = null;
      markTopMenuBtn();
      const drawer = app.shell?.drawerPanel;
      if (!drawer) return;
      if (!drawer.querySelector('.drawer-item') && typeof app.shell._renderDrawer === 'function') {
        app.shell._renderDrawer();
      }
      const items = Array.from(drawer.querySelectorAll('.drawer-item'));
      if (!items.length) return;

      const prof = app.store?.data?.profile || {};
      const elo = app.store?.data?.stats?.classic?.elo || 1200;
      const curView = app.shell?.currentView || 'home';
      const flag = getFlag();

      aside.innerHTML = `
        <div class="dt-sb-brand" id="dt-sb-home">
          <div class="dt-sb-logo">♛</div>
          <div>
            <strong>Ajedrez Táctico</strong>
            <span>Clásico & Fischer 960</span>
          </div>
        </div>
        <nav class="dt-sb-nav">
          ${items.map((btn, idx) => {
            const nav = btn.dataset.nav || '';
            const active = btn.classList.contains('active') || (nav && nav === curView);
            return `<button type="button" class="dt-sb-item ${active ? 'active' : ''}" data-dt-idx="${idx}" data-dt-nav="${esc(nav)}">${btn.innerHTML}</button>`;
          }).join('')}
        </nav>
        <button type="button" class="dt-sb-profile" id="dt-sb-prof">
          <span class="dt-sb-av">${esc(prof.avatar || '♛')}</span>
          <div class="dt-sb-pinfo">
            <strong>${esc(prof.name || 'Jugador')} ${esc(flag)}</strong>
            <span>ELO Clásico: ${elo}</span>
          </div>
        </button>
      `;

      aside.querySelector('#dt-sb-home')?.addEventListener('click', () => app.shell.navigate('home'));
      aside.querySelector('#dt-sb-prof')?.addEventListener('click', () => app.shell.navigate('profile'));
      aside.querySelectorAll('[data-dt-idx]').forEach(sbBtn => {
        sbBtn.addEventListener('click', () => {
          const idx = Number(sbBtn.dataset.dtIdx);
          const nav = sbBtn.dataset.dtNav;
          const liveBtns = app.shell?.drawerPanel?.querySelectorAll('.drawer-item');
          const orig = liveBtns?.[idx];
          if (orig) orig.click();
          else if (nav) app.shell.navigate(nav);
        });
      });
    };

    triggerSidebarSync = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(syncSidebar);
    };

    if (app.shell?.drawerPanel && typeof MutationObserver !== 'undefined') {
      const obs = new MutationObserver(triggerSidebarSync);
      obs.observe(app.shell.drawerPanel, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    if (app.shell?.navigate) {
      const origNav = app.shell.navigate.bind(app.shell);
      app.shell.navigate = (viewId) => {
        const res = origNav(viewId);
        triggerSidebarSync();
        return res;
      };
    }

    setTimeout(triggerSidebarSync, 120);
    setTimeout(triggerSidebarSync, 750);
  }
}
