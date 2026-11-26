const SETUP_KEY = 'ajedrez960_game_setup_v1';

const ELO_PRESETS = [
  { elo: 600,  label: '600',    tag: 'Iniciación', skill: 0,  depth: 2,  movetime: 100 },
  { elo: 1000, label: '1000',   tag: 'Casual',     skill: 3,  depth: 4,  movetime: 140 },
  { elo: 1200, label: '1200',   tag: 'Club',       skill: 6,  depth: 6,  movetime: 180 },
  { elo: 1500, label: '1500',   tag: 'Intermedio', skill: 10, depth: 8,  movetime: 220 },
  { elo: 1800, label: '1800',   tag: 'Avanzado',   skill: 14, depth: 10, movetime: 280 },
  { elo: 2200, label: '2200',   tag: 'Maestro',    skill: 18, depth: 12, movetime: 360 },
  { elo: 2800, label: 'Máximo', tag: 'Stockfish',  skill: 20, depth: 15, movetime: 500 }
];

const CLOCK_PRESETS = [
  { id: 'none',  label: '∞ Sin reloj' },
  { id: '3+2',   label: '⚡ 3+2' },
  { id: '5+3',   label: '⚡ 5+3' },
  { id: '10+0',  label: '⏱ 10+0' },
  { id: '15+10', label: '👑 15+10' },
  { id: '30+0',  label: '👑 30+0' }
];

const PROMO_OPTIONS = [
  { type: 'Q', name: 'Dama',    w: '♕', b: '♛' },
  { type: 'R', name: 'Torre',   w: '♖', b: '♜' },
  { type: 'B', name: 'Alfil',   w: '♗', b: '♝' },
  { type: 'N', name: 'Caballo', w: '♘', b: '♞' }
];

const PIECE_VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

function getEloProfile(elo) {
  return ELO_PRESETS.find(p => p.elo === Number(elo)) || ELO_PRESETS[2];
}

function getNextEloProfile(elo) {
  const cur = Number(elo) || 1200;
  return ELO_PRESETS.find(p => p.elo > cur) || null;
}

function loadSavedSetup() {
  const def = {
    elo: 1200,
    color: 'random',
    clock: '10+0',
    mode: 'practice',
    f960Random: true,
    f960Pos: 518
  };
  try {
    return { ...def, ...JSON.parse(localStorage.getItem(SETUP_KEY) || '{}') };
  } catch {
    return def;
  }
}

function saveSetup(cfg) {
  try {
    localStorage.setItem(SETUP_KEY, JSON.stringify(cfg));
  } catch { /* ignorar */ }
}

function ensureSetupStyles() {
  if (document.querySelector('style[data-game-setup-css]')) return;
  const style = document.createElement('style');
  style.dataset.gameSetupCss = 'true';
  style.textContent = `
    .gs-backdrop {
      position: fixed; inset: 0; z-index: 1200;
      background: rgba(5, 8, 16, 0.78); backdrop-filter: blur(6px);
      display: grid; place-items: center; padding: 14px;
    }
    .gs-modal {
      width: 100%; max-width: 500px; max-height: 92vh; overflow-y: auto;
      background: linear-gradient(180deg, #131c31 0%, #0b1120 100%);
      border: 1.5px solid var(--border-color); border-radius: 18px;
      padding: 18px 20px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
      display: flex; flex-direction: column; gap: 14px; color: var(--text-main);
    }
    .gs-modal.gs-compact { max-width: 400px; }
    .gs-head {
      display: flex; justify-content: space-between; align-items: center; gap: 10px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.16); padding-bottom: 10px;
    }
    .gs-head h3 { margin: 0; font-size: 1.06rem; color: #f8fafc; }
    .gs-close {
      background: rgba(15, 23, 42, 0.9); border: 1px solid var(--border-color);
      color: var(--text-muted); width: 32px; height: 32px; border-radius: 9px;
      cursor: pointer; font-size: 1rem; font-weight: 800;
    }
    .gs-close:hover { border-color: var(--accent-cyan); color: #fff; }
    .gs-block { display: flex; flex-direction: column; gap: 7px; }
    .gs-label {
      font-size: 0.76rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.04em; color: var(--text-muted);
    }
    .gs-elo-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); gap: 7px;
    }
    .gs-opt {
      background: rgba(9, 13, 22, 0.78); border: 1px solid var(--border-color);
      border-radius: 10px; padding: 8px 6px; color: var(--text-main);
      cursor: pointer; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      transition: border-color 0.15s, background 0.15s;
    }
    .gs-opt:hover { border-color: var(--accent-cyan); }
    .gs-opt.active {
      border-color: var(--accent-cyan); background: rgba(56, 189, 248, 0.18);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.22);
    }
    .gs-opt strong { font-size: 0.86rem; color: #f8fafc; }
    .gs-opt span { font-size: 0.68rem; color: var(--text-muted); }
    .gs-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .gs-row-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .gs-clock-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
    .gs-pos-row { display: flex; gap: 8px; align-items: center; }
    .gs-pos-input {
      width: 110px; background: rgba(9, 13, 22, 0.9); color: #f8fafc;
      border: 1px solid var(--border-color); border-radius: 9px;
      padding: 8px 10px; font-weight: 700; font-size: 0.86rem;
    }
    .gs-pos-input:disabled { opacity: 0.45; }
    .gs-start-btn {
      width: 100%; padding: 12px; font-size: 0.96rem; font-weight: 800;
      border-radius: 12px; margin-top: 2px;
    }
    .gs-banner {
      display: flex; justify-content: space-between; align-items: center; gap: 8px;
      background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 11px; padding: 8px 11px; font-size: 0.78rem; margin-bottom: 10px;
    }
    .gs-banner-btn {
      background: rgba(56, 189, 248, 0.14); color: var(--accent-cyan);
      border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px;
      padding: 4px 9px; font-size: 0.74rem; font-weight: 700; cursor: pointer;
      white-space: nowrap;
    }
    .gs-banner-btn:hover { background: rgba(56, 189, 248, 0.25); }
    .gs-ai-locked { pointer-events: none !important; }
    body.gs-challenge-mode .gs-aid-blocked {
      opacity: 0.35 !important; pointer-events: none !important; filter: grayscale(0.8);
    }

    .gs-promo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .gs-promo-btn {
      background: rgba(9, 13, 22, 0.85); border: 1.5px solid var(--border-color);
      border-radius: 12px; padding: 10px 6px; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      color: var(--text-main); transition: transform 0.12s, border-color 0.15s, background 0.15s;
    }
    .gs-promo-btn:hover {
      border-color: var(--accent-cyan); background: rgba(56, 189, 248, 0.18); transform: translateY(-2px);
    }
    .gs-promo-icon { width: 48px; height: 48px; display: grid; place-items: center; font-size: 2rem; }
    .gs-promo-icon svg { width: 44px; height: 44px; }
    .gs-promo-btn span { font-size: 0.76rem; font-weight: 800; color: #f8fafc; }

    .gs-confirm-desc { font-size: 0.86rem; line-height: 1.5; color: var(--text-muted); margin: 0; }
    .gs-danger-btn {
      background: linear-gradient(135deg, #e11d48, #be123c) !important;
      border-color: #fb7185 !important; color: #fff !important;
    }

    .gs-rematch-card {
      background: linear-gradient(180deg, rgba(19, 28, 49, 0.96), rgba(9, 13, 22, 0.96));
      border: 1.5px solid rgba(56, 189, 248, 0.45);
      border-radius: 13px; padding: 12px; margin-bottom: 10px;
      display: flex; flex-direction: column; gap: 8px;
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
    }
    .gs-rematch-head {
      display: flex; justify-content: space-between; align-items: center; gap: 8px;
    }
    .gs-rematch-head strong { font-size: 0.88rem; color: #f8fafc; }
    .gs-rematch-actions { display: flex; flex-direction: column; gap: 7px; }
    .gs-rematch-row { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
    .gs-levelup-btn {
      background: linear-gradient(135deg, #16a34a, #059669) !important;
      border-color: #4ade80 !important; color: #fff !important;
    }
  `;
  document.head.appendChild(style);
}

function findModeSelect() {
  const selects = document.querySelectorAll('header select, .topbar select, main.arena select, select');
  for (const sel of selects) {
    const hasAi = Array.from(sel.options).some(o =>
      /ai|ia|stockfish/i.test(`${o.value} ${o.textContent}`)
    );
    if (hasAi) return sel;
  }
  return null;
}

function findMatchingOption(sel, predicate) {
  if (!sel) return null;
  return Array.from(sel.options).find(o =>
    predicate(String(o.value || '').toLowerCase(), String(o.textContent || '').toLowerCase())
  ) || null;
}

function findBestAiOptionValue(sel, targetElo) {
  if (!sel) return `ai-elo-${targetElo}`;
  const exact = findMatchingOption(sel, (v) => v === `ai-elo-${targetElo}`);
  if (exact) return exact.value;

  const eloOpts = Array.from(sel.options)
    .map(o => {
      const m = `${o.value} ${o.textContent}`.match(/(\d{3,4})/);
      return m && /ai|ia|stockfish/i.test(`${o.value} ${o.textContent}`)
        ? { value: o.value, elo: parseInt(m[1], 10) }
        : null;
    })
    .filter(Boolean);

  if (eloOpts.length) {
    eloOpts.sort((a, b) => Math.abs(a.elo - targetElo) - Math.abs(b.elo - targetElo));
    return eloOpts[0].value;
  }

  const anyAi = findMatchingOption(sel, (v, t) => v.includes('ai') || t.includes('ia') || t.includes('stockfish'));
  return anyAi ? anyAi.value : 'ai-elo-1200';
}

function findLocalModeValue(sel) {
  if (!sel) return 'pvp';
  const explicit = findMatchingOption(sel, (v, t) =>
    /local|pvp|2p|human|frente|amigo|2 jug|jugador vs/i.test(`${v} ${t}`)
  );
  if (explicit) return explicit.value;
  const nonAi = findMatchingOption(sel, (v, t) =>
    !/ai|ia|stockfish|bot|elo|online|global|sala|red/i.test(`${v} ${t}`)
  );
  if (nonAi) return nonAi.value;
  return 'pvp';
}

function applyClockPreset(app, clockId) {
  try {
    if (clockId === 'none') {
      if (typeof app.clock?.setPreset === 'function') app.clock.setPreset('none');
      else if (typeof app.clock?.disable === 'function') app.clock.disable();
      else app.clock?.stop?.();
    } else {
      if (typeof app.clock?.setPreset === 'function') app.clock.setPreset(clockId);
      else if (typeof app.clock?.selectPreset === 'function') app.clock.selectPreset(clockId);
    }
  } catch { /* ignorar */ }

  document.querySelectorAll('select').forEach(sel => {
    const opt = Array.from(sel.options).find(o => o.value === clockId || (clockId === 'none' && /sin reloj|off|none/i.test(`${o.value} ${o.textContent}`)));
    if (opt && sel.value !== opt.value) {
      sel.value = opt.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

function findArenaButton(keyword) {
  const kw = keyword.toLowerCase();
  const arenaBtns = document.querySelectorAll('main.arena button');
  const direct = Array.from(arenaBtns).find(b => (b.textContent || '').toLowerCase().includes(kw));
  if (direct) return direct;
  const fallbackBtns = document.querySelectorAll('button');
  return Array.from(fallbackBtns).find(b =>
    !b.closest('.gs-backdrop, #dt-sidebar, .drawer-panel, header') &&
    b.offsetParent !== null &&
    (b.textContent || '').toLowerCase().includes(kw)
  ) || null;
}

function isBoardFlipped(app) {
  const grid = document.querySelector('main.arena .board-grid');
  if (grid) {
    const firstRank = grid.querySelector('.square .coord-rank');
    if (firstRank) {
      const txt = (firstRank.textContent || '').trim();
      if (txt === '1') return true;
      if (txt === '8') return false;
    }
  }
  return Boolean(app.flipped);
}

function applyAssistMode(mode) {
  const isChallenge = mode === 'challenge';
  document.body.classList.toggle('gs-challenge-mode', isChallenge);

  ['deshacer', 'mapa de ataque', 'mira al seleccionar'].forEach(kw => {
    const btn = findArenaButton(kw);
    if (!btn) return;
    btn.classList.toggle('gs-aid-blocked', isChallenge);
    if (isChallenge && btn.classList.contains('active') && kw !== 'deshacer') {
      btn.click();
    }
  });
}

function fallbackPickMove(engine) {
  const legal = engine.getLegalMoves(engine.turn);
  if (!legal.length) return null;
  let best = legal[0];
  let bestScore = -99999;
  for (const m of legal) {
    const sim = engine.clone();
    const rec = sim.makeMove(m);
    let score = Math.random() * 15;
    if (sim.status === 'checkmate') score += 50000;
    if (rec.captured) score += (PIECE_VAL[rec.captured] || 100);
    if (rec.inCheck) score += 45;
    if (m.to.r >= 2 && m.to.r <= 5 && m.to.c >= 2 && m.to.c <= 5) score += 20;
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}

export function attachGameSetup(app) {
  if (app._gameSetupAttached) return;
  app._gameSetupAttached = true;
  ensureSetupStyles();

  let savedCfg = loadSavedSetup();
  let activeMatch = null;
  let whiteAiElo = null;
  let blackSession = { active: false, elo: 1200, thinking: false, token: 0 };
  let undoInProgress = false;
  let rematchSignature = '';

  const isOnlineGameActive = () => {
    const sel = findModeSelect();
    const selVal = String(sel?.value || '').toLowerCase();
    return Boolean(
      selVal.includes('online') ||
      app.online?.inMatch ||
      app.matchmaking?.inMatch ||
      app.online?.activeRoom
    );
  };

  const isGameFinished = () => {
    if (!app.engine) return false;
    if (app.engine.status && app.engine.status !== 'playing') return true;
    const slot = app.dom?.postgameSlot;
    if (slot && (app.engine.history?.length || 0) >= 2 && !app.analyzer?.inReview && !app.analyzer?.analyzing) {
      const txt = (slot.textContent || '').toLowerCase();
      if (txt.includes('revisar') || txt.includes('analizar') || txt.includes('victoria') || txt.includes('derrota') || txt.includes('tablas') || txt.includes('rendic')) {
        return true;
      }
    }
    return false;
  };

  const isActiveHumanGameInProgress = () => {
    if (app.shell?.currentView !== 'play') return false;
    if (app.analyzer?.inReview || app.analyzer?.analyzing) return false;
    if (!app.engine || isGameFinished()) return false;
    return (app.engine.history?.length || 0) >= 4;
  };

  // 1. Calibrar fuerza real de Stockfish según el ELO elegido (solo en partidas vs IA)
  if (app.stockfish?.evaluatePosition && !app.stockfish._gsWrapped) {
    const origEval = app.stockfish.evaluatePosition.bind(app.stockfish);
    app.stockfish._gsWrapped = true;
    app.stockfish.evaluatePosition = (eng, opts = {}) => {
      if (
        !opts?._gsDirect &&
        whiteAiElo &&
        app.shell?.currentView === 'play' &&
        !app.analyzer?.analyzing &&
        !app.analyzer?.inReview
      ) {
        const prof = getEloProfile(whiteAiElo);
        return origEval(eng, { ...opts, skill: prof.skill, depth: prof.depth, movetime: prof.movetime });
      }
      return origEval(eng, opts);
    };
  }

  // 2. Corregir registro de partidas cuando juegas con Negras vs Stockfish
  if (app.store?.recordGame && !app.store._gsWrapped) {
    const origRec = app.store.recordGame.bind(app.store);
    app.store._gsWrapped = true;
    app.store.recordGame = (payload) => {
      if (blackSession.active && payload) {
        const prof = getEloProfile(blackSession.elo);
        const winner = app.engine?.winner;
        const result = winner === 'b' ? 'win' : winner === 'w' ? 'loss' : (payload.result || 'draw');
        return origRec({
          ...payload,
          mode: `ai-elo-${prof.elo}`,
          opponent: `Stockfish ${prof.label}`,
          result
        });
      }
      return origRec(payload);
    };
  }

  const clearSessions = () => {
    blackSession.active = false;
    blackSession.thinking = false;
    blackSession.token++;
    whiteAiElo = null;
    activeMatch = null;
    rematchSignature = '';
    document.body.classList.remove('gs-challenge-mode');
    document.querySelector('main.arena .board-grid')?.classList.remove('gs-ai-locked');
    document.getElementById('gs-active-banner')?.remove();
    document.getElementById('gs-rematch-card')?.remove();
  };

  const renderActiveBanner = () => {
    const existing = document.getElementById('gs-active-banner');
    if (!activeMatch || app.shell?.currentView !== 'play' || app.analyzer?.inReview) {
      existing?.remove();
      return;
    }
    const sidePanel = document.querySelector('main.arena .side-panel');
    if (!sidePanel) return;

    const prof = getEloProfile(activeMatch.elo);
    const colorTxt = activeMatch.resolvedColor === 'b' ? '♚ Negras' : '♔ Blancas';
    const modeTxt = activeMatch.mode === 'challenge' ? '🔥 Reto' : '🎓 Práctica';
    const statusTxt = blackSession.thinking ? ' · Pensando...' : '';

    const el = existing || document.createElement('div');
    el.id = 'gs-active-banner';
    el.className = 'gs-banner';
    el.innerHTML = `
      <span>🤖 <strong>Stockfish ${prof.label}</strong> · ${colorTxt} · ${modeTxt}${statusTxt}</span>
      <button type="button" class="gs-banner-btn" id="gs-reconfig">⚙ Configurar</button>
    `;
    if (!existing) sidePanel.prepend(el);
    el.querySelector('#gs-reconfig')?.addEventListener('click', () => {
      openSetupModal(activeMatch.variant);
    });
  };

  const ensureBoardOrientation = (wantFlipped) => {
    if (isBoardFlipped(app) === wantFlipped) return;
    const flipBtn = findArenaButton('voltear');
    if (flipBtn) {
      flipBtn.click();
    }
    if (isBoardFlipped(app) !== wantFlipped) {
      app.flipped = wantFlipped;
      app.renderBoard?.();
    }
  };

  const triggerInvertedRematch = () => {
    const variant = activeMatch?.variant || (app.engine?.positionId === 518 ? 'classic' : 'fischer960');
    const curColor = activeMatch?.resolvedColor || (isBoardFlipped(app) ? 'b' : 'w');
    const nextColor = curColor === 'w' ? 'b' : 'w';
    const curElo = activeMatch?.elo || savedCfg.elo || 1200;

    launchConfiguredGame(
      variant,
      {
        ...savedCfg,
        elo: curElo,
        clock: activeMatch?.clock || savedCfg.clock,
        mode: activeMatch?.mode || savedCfg.mode,
        color: nextColor
      },
      { persistColor: false }
    );
  };

  // Tarjeta de Revancha Inteligente al terminar partida
  const syncRematchCard = () => {
    const existing = document.getElementById('gs-rematch-card');
    const shouldShow =
      app.shell?.currentView === 'play' &&
      !app.analyzer?.inReview &&
      !app.analyzer?.analyzing &&
      !isOnlineGameActive() &&
      isGameFinished();

    if (!shouldShow) {
      if (existing) existing.remove();
      rematchSignature = '';
      return;
    }

    const sig = `${app.engine.positionId}_${app.engine.history?.length || 0}_${app.engine.status}_${app.engine.winner || 'n'}_${activeMatch?.resolvedColor || 'x'}`;
    if (existing && rematchSignature === sig) return;
    rematchSignature = sig;

    const sidePanel = document.querySelector('main.arena .side-panel');
    if (!sidePanel) return;

    const variant = activeMatch?.variant || (app.engine.positionId === 518 ? 'classic' : 'fischer960');
    const curColor = activeMatch?.resolvedColor || (isBoardFlipped(app) ? 'b' : 'w');
    const nextColor = curColor === 'w' ? 'b' : 'w';
    const curElo = activeMatch?.elo || savedCfg.elo || 1200;
    const nextEloProf = getNextEloProfile(curElo);

    const winner = app.engine.winner;
    const humanWon = Boolean(winner && winner === curColor);
    const headline = humanWon
      ? '🏆 ¡Victoria! ¿Subimos el desafío?'
      : (winner && winner !== curColor)
        ? '⚔️ Partida terminada · ¿Revancha?'
        : '🤝 Partida finalizada · ¿Otra ronda?';

    const card = existing || document.createElement('div');
    card.id = 'gs-rematch-card';
    card.className = 'gs-rematch-card';
    card.innerHTML = `
      <div class="gs-rematch-head">
        <strong>${headline}</strong>
        <span class="mode-card-tag">${variant === 'fischer960' ? '960' : 'CLÁSICO'}</span>
      </div>
      <div class="gs-rematch-actions">
        <button type="button" class="btn btn-primary" id="gs-rematch-swap" style="width:100%">
          🔄 Revancha con ${nextColor === 'b' ? '♚ Negras' : '♔ Blancas'}
        </button>
        <div class="gs-rematch-row">
          ${nextEloProf ? `
            <button type="button" class="btn ${humanWon ? 'gs-levelup-btn' : 'btn-secondary'}" id="gs-rematch-up">
              ⬆ Subir a ${nextEloProf.label}
            </button>
          ` : `
            <button type="button" class="btn btn-secondary" id="gs-rematch-same">
              🔁 Repetir Máximo
            </button>
          `}
          <button type="button" class="btn btn-ghost" id="gs-rematch-cfg">
            ⚙ Configurar
          </button>
        </div>
      </div>
    `;

    if (!existing) {
      const banner = document.getElementById('gs-active-banner');
      if (banner) banner.insertAdjacentElement('afterend', card);
      else sidePanel.prepend(card);
    }

    const baseCfg = {
      ...savedCfg,
      elo: curElo,
      clock: activeMatch?.clock || savedCfg.clock,
      mode: activeMatch?.mode || savedCfg.mode
    };

    card.querySelector('#gs-rematch-swap')?.addEventListener('click', () => {
      triggerInvertedRematch();
    });
    card.querySelector('#gs-rematch-up')?.addEventListener('click', () => {
      if (nextEloProf) {
        launchConfiguredGame(variant, { ...baseCfg, elo: nextEloProf.elo, color: curColor }, { persistColor: false });
      }
    });
    card.querySelector('#gs-rematch-same')?.addEventListener('click', () => {
      launchConfiguredGame(variant, { ...baseCfg, color: curColor }, { persistColor: false });
    });
    card.querySelector('#gs-rematch-cfg')?.addEventListener('click', () => {
      openSetupModal(variant);
    });
  };

  // Modal completo de coronación (Dama / Torre / Alfil / Caballo)
  const openPromotionModal = (color, onPick) => {
    document.getElementById('gs-promo-backdrop')?.remove();
    const backdrop = document.createElement('div');
    backdrop.id = 'gs-promo-backdrop';
    backdrop.className = 'gs-backdrop';

    const renderPieceIcon = (type) => {
      try {
        if (typeof app.pieceRenderer === 'function') {
          return app.pieceRenderer(type, color);
        }
      } catch { /* usar símbolo */ }
      const item = PROMO_OPTIONS.find(p => p.type === type);
      return item ? item[color] : '♕';
    };

    backdrop.innerHTML = `
      <div class="gs-modal gs-compact" role="dialog" aria-modal="true">
        <div class="gs-head">
          <div>
            <span class="mode-card-tag">👑 CORONACIÓN DE PEÓN</span>
            <h3>Elige tu nueva pieza</h3>
          </div>
          <button type="button" class="gs-close" id="gs-promo-cancel" title="Cancelar">✕</button>
        </div>
        <div class="gs-promo-grid">
          ${PROMO_OPTIONS.map(p => `
            <button type="button" class="gs-promo-btn" data-gs-promo="${p.type}">
              <div class="gs-promo-icon">${renderPieceIcon(p.type)}</div>
              <span>${p.name}</span>
            </button>
          `).join('')}
        </div>
        <button type="button" class="btn btn-ghost" id="gs-promo-back" style="width:100%">
          Cancelar jugada
        </button>
      </div>
    `;

    const close = () => backdrop.remove();
    backdrop.querySelector('#gs-promo-cancel')?.addEventListener('click', close);
    backdrop.querySelector('#gs-promo-back')?.addEventListener('click', close);
    backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });

    backdrop.querySelectorAll('[data-gs-promo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = btn.dataset.gsPromo;
        close();
        onPick(chosen);
      });
    });

    document.body.appendChild(backdrop);
  };

  // Modal de confirmación rápida
  const openConfirmModal = ({ tag, title, desc, confirmLabel, danger = true, onConfirm }) => {
    document.getElementById('gs-confirm-backdrop')?.remove();
    const backdrop = document.createElement('div');
    backdrop.id = 'gs-confirm-backdrop';
    backdrop.className = 'gs-backdrop';
    backdrop.innerHTML = `
      <div class="gs-modal gs-compact" role="dialog" aria-modal="true">
        <div class="gs-head">
          <div>
            <span class="mode-card-tag">${tag}</span>
            <h3>${title}</h3>
          </div>
          <button type="button" class="gs-close" id="gs-cf-x" title="Cerrar">✕</button>
        </div>
        <p class="gs-confirm-desc">${desc}</p>
        <div class="gs-row-2">
          <button type="button" class="btn btn-secondary" id="gs-cf-cancel">Seguir jugando</button>
          <button type="button" class="btn ${danger ? 'gs-danger-btn' : 'btn-primary'}" id="gs-cf-ok">${confirmLabel}</button>
        </div>
      </div>
    `;

    const close = () => backdrop.remove();
    backdrop.querySelector('#gs-cf-x')?.addEventListener('click', close);
    backdrop.querySelector('#gs-cf-cancel')?.addEventListener('click', close);
    backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });
    backdrop.querySelector('#gs-cf-ok')?.addEventListener('click', () => {
      close();
      onConfirm();
    });

    document.body.appendChild(backdrop);
  };

  const getBoardSquareEl = (r, c) => {
    const grid = document.querySelector('main.arena .board-grid');
    if (!grid) return null;
    const squares = grid.querySelectorAll('.square');
    if (squares.length !== 64) return null;
    const flipped = isBoardFlipped(app);
    const vr = flipped ? 7 - r : r;
    const vc = flipped ? 7 - c : c;
    return squares[vr * 8 + vc] || null;
  };

  const squareElToCoords = (grid, sqEl) => {
    const squares = Array.from(grid.querySelectorAll('.square'));
    const idx = squares.indexOf(sqEl);
    if (idx < 0 || squares.length !== 64) return null;
    const vr = Math.floor(idx / 8);
    const vc = idx % 8;
    const flipped = isBoardFlipped(app);
    return {
      r: flipped ? 7 - vr : vr,
      c: flipped ? 7 - vc : vc
    };
  };

  const executeWhiteMoveByClick = (move, token) => {
    const grid = document.querySelector('main.arena .board-grid');
    if (!grid || !move) return false;

    const fromSq = getBoardSquareEl(move.from.r, move.from.c);
    if (!fromSq || !fromSq.querySelector('.piece-wrap')) return false;
    fromSq.click();

    setTimeout(() => {
      if (token !== blackSession.token || !blackSession.active) return;

      let toSq = null;
      if (move.castle) {
        const destCol = typeof move.kingToCol === 'number' ? move.kingToCol : move.to.c;
        const candA = getBoardSquareEl(move.from.r, destCol);
        const candB = getBoardSquareEl(move.to.r, move.to.c);
        if (candB?.classList.contains('castle-target')) toSq = candB;
        else if (candA?.classList.contains('castle-target')) toSq = candA;
        else toSq = candA || candB;
      } else {
        toSq = getBoardSquareEl(move.to.r, move.to.c);
      }

      if (toSq) toSq.click();

      setTimeout(() => {
        if (token !== blackSession.token || !blackSession.active) return;
        const wantPromo = (move.promo || 'Q').toUpperCase();
        const promoBtn = document.querySelector(
          `[data-promo="${wantPromo}"], [data-piece="${wantPromo}"], .promo-modal button, .promotion-modal button`
        );
        if (promoBtn && promoBtn.offsetParent !== null) {
          promoBtn.click();
        }
      }, 110);
    }, 105);

    return true;
  };

  const runBlackSessionAiTurn = async () => {
    if (!blackSession.active || blackSession.thinking) return;
    if (app.shell?.currentView !== 'play') return;
    if (app.analyzer?.inReview || app.analyzer?.analyzing) return;
    if (!app.engine || app.engine.status !== 'playing' || app.engine.turn !== 'w') return;

    const token = blackSession.token;
    const grid = document.querySelector('main.arena .board-grid');
    blackSession.thinking = true;
    grid?.classList.add('gs-ai-locked');
    renderActiveBanner();

    let chosenMove = null;
    const prof = getEloProfile(blackSession.elo);
    try {
      if (app.stockfish) {
        const ok = await app.stockfish.init();
        if (ok && token === blackSession.token) {
          const res = await app.stockfish.evaluatePosition(app.engine, {
            _gsDirect: true,
            skill: prof.skill,
            depth: prof.depth,
            movetime: prof.movetime
          });
          if (res?.move) chosenMove = res.move;
        }
      }
    } catch { /* usar respaldo local */ }

    if (token !== blackSession.token || !blackSession.active) {
      blackSession.thinking = false;
      grid?.classList.remove('gs-ai-locked');
      return;
    }

    if (!chosenMove) chosenMove = fallbackPickMove(app.engine);
    if (!chosenMove || app.engine.turn !== 'w' || app.engine.status !== 'playing') {
      blackSession.thinking = false;
      grid?.classList.remove('gs-ai-locked');
      renderActiveBanner();
      return;
    }

    const prevLen = app.engine.history.length;
    const okClick = executeWhiteMoveByClick(chosenMove, token);

    setTimeout(() => {
      if (token !== blackSession.token) return;
      blackSession.thinking = false;
      grid?.classList.remove('gs-ai-locked');
      renderActiveBanner();
      if (!okClick || (app.engine?.status === 'playing' && app.engine?.turn === 'w' && app.engine.history.length === prevLen)) {
        // Reintento limpio en el siguiente ciclo del vigilante
      }
    }, 500);
  };

  // Vigilante liviano: turno de Stockfish con Blancas + tarjeta de Revancha Inteligente
  setInterval(() => {
    syncRematchCard();
    if (!blackSession.active) return;
    if (app.shell?.currentView !== 'play' || app.analyzer?.inReview || app.analyzer?.analyzing) return;
    if (app.engine?.status === 'playing' && app.engine?.turn === 'w' && !blackSession.thinking && !undoInProgress) {
      runBlackSessionAiTurn();
    }
  }, 320);

  // Interceptor unificado en fase de captura
  document.addEventListener('click', (e) => {
    if (!e.isTrusted) return;
    if (e.target.closest('.gs-backdrop')) return;

    // 0) Bloquear clics manuales sobre el tablero mientras es turno de Stockfish (Blancas)
    if (
      blackSession.active &&
      app.shell?.currentView === 'play' &&
      !app.analyzer?.inReview &&
      app.engine?.status === 'playing' &&
      app.engine?.turn === 'w' &&
      e.target.closest('main.arena .board-grid')
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 1) Interceptar botón nativo de "Revancha" al terminar partida para que también invierta colores
    if (
      app.shell?.currentView === 'play' &&
      !app.analyzer?.inReview &&
      !isOnlineGameActive() &&
      isGameFinished()
    ) {
      const revBtn = e.target.closest('main.arena button');
      if (revBtn && !revBtn.closest('#gs-rematch-card, #gs-active-banner')) {
        const txt = (revBtn.textContent || '').toLowerCase();
        if (txt.includes('revancha')) {
          e.preventDefault();
          e.stopPropagation();
          triggerInvertedRematch();
          return;
        }
      }
    }

    // 2) Selector de coronación completo (Dama / Torre / Alfil / Caballo)
    if (
      app.shell?.currentView === 'play' &&
      !app.analyzer?.inReview &&
      !app.analyzer?.analyzing &&
      app.engine?.status === 'playing'
    ) {
      const grid = document.querySelector('main.arena .board-grid');
      const toSq = grid && e.target.closest('.square');
      if (grid && toSq && grid.contains(toSq)) {
        const fromSq = grid.querySelector('.square.selected');
        if (fromSq && fromSq !== toSq) {
          const from = squareElToCoords(grid, fromSq);
          const to = squareElToCoords(grid, toSq);
          if (from && to) {
            const piece = app.engine.board?.[from.r]?.[from.c];
            const isPromoRank = piece && piece.type === 'P' && piece.color === app.engine.turn &&
              ((piece.color === 'w' && to.r === 0) || (piece.color === 'b' && to.r === 7));
            if (isPromoRank) {
              const promoMoves = app.engine.getLegalMovesFrom(from.r, from.c)
                .filter(m => m.to.r === to.r && m.to.c === to.c && m.promo);
              if (promoMoves.length > 1) {
                e.preventDefault();
                e.stopPropagation();
                openPromotionModal(piece.color, (chosenType) => {
                  const eng = app.engine;
                  if (!eng) return;
                  const hadOwn = Object.prototype.hasOwnProperty.call(eng, 'makeMove');
                  const prevMake = eng.makeMove;
                  const restore = () => {
                    if (eng.makeMove === patchedMake) {
                      if (hadOwn) eng.makeMove = prevMake;
                      else delete eng.makeMove;
                    }
                  };
                  const patchedMake = function (mv) {
                    restore();
                    if (mv && mv.promo) mv.promo = chosenType;
                    return prevMake.call(this, mv);
                  };
                  eng.makeMove = patchedMake;
                  setTimeout(restore, 700);

                  toSq.click();

                  setTimeout(() => {
                    const nativeBtn = document.querySelector(
                      `[data-promo="${chosenType}"], [data-piece="${chosenType}"]`
                    );
                    if (nativeBtn && !nativeBtn.closest('.gs-backdrop') && nativeBtn.offsetParent !== null) {
                      nativeBtn.click();
                    }
                  }, 50);
                });
                return;
              }
            }
          }
        }
      }
    }

    // 3) Confirmación de seguridad en partida activa (>= 2 jugadas completas)
    if (isActiveHumanGameInProgress()) {
      const btn = e.target.closest('button, .dt-sb-brand');
      if (btn && !btn.closest('#gs-active-banner, #gs-rematch-card')) {
        const txt = (btn.textContent || '').trim().toLowerCase();

        if (btn.closest('main.arena') && txt.includes('rendirse')) {
          e.preventDefault();
          e.stopPropagation();
          openConfirmModal({
            tag: '⚠ CONFIRMAR RENDICIÓN',
            title: '¿Rendirse en esta partida?',
            desc: 'La partida finalizará como derrota y podrás revisarla con Stockfish de inmediato.',
            confirmLabel: 'Sí, rendirme',
            danger: true,
            onConfirm: () => btn.click()
          });
          return;
        }

        if (btn.closest('header, .topbar, .app-header') && (txt.includes('nueva 960') || txt.includes('nueva partida'))) {
          e.preventDefault();
          e.stopPropagation();
          openConfirmModal({
            tag: '⚠ PARTIDA EN CURSO',
            title: '¿Iniciar una nueva partida?',
            desc: 'Se reiniciará el tablero actual y perderás el avance de las jugadas en curso.',
            confirmLabel: 'Sí, reiniciar',
            danger: true,
            onConfirm: () => btn.click()
          });
          return;
        }

        const isSidebarExit = btn.classList.contains('dt-sb-brand') ||
          btn.classList.contains('dt-sb-profile') ||
          (btn.classList.contains('dt-sb-item') && btn.dataset.dtNav && btn.dataset.dtNav !== 'play');
        const isDrawerExit = btn.classList.contains('drawer-item') && btn.dataset.nav && btn.dataset.nav !== 'play';
        const isTopHomeExit = Boolean(btn.closest('header, .topbar, .app-header') && txt.includes('inicio'));

        if (isSidebarExit || isDrawerExit || isTopHomeExit) {
          e.preventDefault();
          e.stopPropagation();
          openConfirmModal({
            tag: '♟ PARTIDA EN CURSO',
            title: '¿Salir del tablero actual?',
            desc: 'Tienes una partida activa. Si hay reloj corriendo podría seguir descontando tiempo mientras estés fuera.',
            confirmLabel: 'Sí, salir',
            danger: false,
            onConfirm: () => btn.click()
          });
          return;
        }
      }
    }

    // 4) Interceptar tarjetas de Ajedrez Clásico y Fischer 960 en Inicio
    if (app.shell?.currentView !== 'home') return;
    const viewRoot = app.shell?.viewRoot;
    if (!viewRoot || !viewRoot.contains(e.target)) return;
    if (e.target.closest('.mm-card, .dp-grid, .dp-card')) return;

    let node = e.target;
    let targetCard = null;
    while (node && node !== viewRoot) {
      const txt = node.textContent || '';
      if (txt.length < 360 && (txt.includes('Jugar Clásico') || txt.includes('Jugar Fischer 960') || txt.includes('Jugar Frente a Frente') || txt.includes('Abrir Sala Privada'))) {
        targetCard = node;
        break;
      }
      node = node.parentElement;
    }
    if (!targetCard) return;

    const text = targetCard.textContent || '';
    if (text.includes('Jugar Clásico')) {
      e.preventDefault();
      e.stopPropagation();
      openSetupModal('classic');
    } else if (text.includes('Jugar Fischer 960')) {
      e.preventDefault();
      e.stopPropagation();
      openSetupModal('fischer960');
    } else if (text.includes('Jugar Frente a Frente') || text.includes('Abrir Sala Privada')) {
      clearSessions();
    }
  }, true);

  // Manejar Deshacer doble cuando juegas con Negras (para volver a tu turno)
  document.addEventListener('click', (e) => {
    if (!blackSession.active) return;
    const btn = e.target.closest('main.arena button');
    if (!btn || !(btn.textContent || '').toLowerCase().includes('deshacer')) return;
    if (undoInProgress) return;
    undoInProgress = true;
    setTimeout(() => {
      if (blackSession.active && app.engine?.turn === 'w' && app.engine.history.length > 0) {
        btn.click();
      }
      setTimeout(() => { undoInProgress = false; }, 220);
    }, 180);
  });

  // Si el usuario cambia manualmente el modo desde el desplegable superior, limpiar sesión especial
  document.addEventListener('change', (e) => {
    if (!e.isTrusted) return;
    const sel = findModeSelect();
    if (sel && e.target === sel) clearSessions();
  });

  const launchConfiguredGame = (variant, cfg, opts = { persistColor: true }) => {
    const toSave = opts?.persistColor === false
      ? { ...savedCfg, elo: cfg.elo, clock: cfg.clock, mode: cfg.mode, f960Random: cfg.f960Random, f960Pos: cfg.f960Pos }
      : { ...cfg };
    saveSetup(toSave);
    savedCfg = { ...toSave };

    const resolvedColor = cfg.color === 'random'
      ? (Math.random() < 0.5 ? 'w' : 'b')
      : cfg.color;

    const posId = variant === 'classic'
      ? 518
      : (cfg.f960Random
        ? Math.floor(Math.random() * 960)
        : Math.max(0, Math.min(959, parseInt(cfg.f960Pos, 10) || 0)));

    blackSession.token++;
    blackSession.thinking = false;
    rematchSignature = '';
    document.getElementById('gs-rematch-card')?.remove();

    const sel = findModeSelect();
    app.shell.navigate('play');
    if (app.analyzer?.inReview) app.analyzer.exitReview();

    if (resolvedColor === 'b') {
      whiteAiElo = null;
      blackSession.active = true;
      blackSession.elo = cfg.elo;
      const localVal = findLocalModeValue(sel);
      if (typeof app._setModeProgrammatically === 'function') {
        app._setModeProgrammatically(localVal);
      }
      if (sel && sel.value !== localVal) {
        const hasOpt = Array.from(sel.options).some(o => o.value === localVal);
        if (hasOpt) {
          sel.value = localVal;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    } else {
      blackSession.active = false;
      whiteAiElo = cfg.elo;
      const aiVal = findBestAiOptionValue(sel, cfg.elo);
      if (typeof app._setModeProgrammatically === 'function') {
        app._setModeProgrammatically(aiVal);
      }
      if (sel && sel.value !== aiVal) {
        const hasOpt = Array.from(sel.options).some(o => o.value === aiVal);
        if (hasOpt) {
          sel.value = aiVal;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    if (typeof app.setVariant === 'function') {
      app.setVariant(variant, { startFresh: false });
    }
    applyClockPreset(app, cfg.clock);
    if (typeof app.startNewGame === 'function') {
      app.startNewGame(posId);
    }

    activeMatch = { variant, resolvedColor, elo: cfg.elo, clock: cfg.clock, mode: cfg.mode, posId };
    const wantFlipped = resolvedColor === 'b';

    setTimeout(() => {
      ensureBoardOrientation(wantFlipped);
      applyAssistMode(cfg.mode);
      renderActiveBanner();
    }, 100);

    setTimeout(() => {
      ensureBoardOrientation(wantFlipped);
      if (resolvedColor === 'b') {
        runBlackSessionAiTurn();
      }
    }, 340);
  };

  const openSetupModal = (variant = 'classic') => {
    document.querySelector('.gs-backdrop')?.remove();

    const draft = { ...savedCfg };
    const is960 = variant === 'fischer960';

    const backdrop = document.createElement('div');
    backdrop.className = 'gs-backdrop';

    const renderModal = () => {
      backdrop.innerHTML = `
        <div class="gs-modal" role="dialog" aria-modal="true">
          <div class="gs-head">
            <div>
              <span class="mode-card-tag">${is960 ? '🎲 FISCHER 960' : '♟ AJEDREZ CLÁSICO'}</span>
              <h3>Configurar Partida vs. Stockfish</h3>
            </div>
            <button type="button" class="gs-close" id="gs-close" title="Cerrar">✕</button>
          </div>

          <div class="gs-block">
            <span class="gs-label">1. Nivel de Stockfish (ELO)</span>
            <div class="gs-elo-grid">
              ${ELO_PRESETS.map(p => `
                <button type="button" class="gs-opt ${draft.elo === p.elo ? 'active' : ''}" data-gs-elo="${p.elo}">
                  <strong>${p.label}</strong>
                  <span>${p.tag}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="gs-block">
            <span class="gs-label">2. Elige tu color</span>
            <div class="gs-row-3">
              <button type="button" class="gs-opt ${draft.color === 'w' ? 'active' : ''}" data-gs-color="w">
                <strong>♔ Blancas</strong>
                <span>Mueves primero</span>
              </button>
              <button type="button" class="gs-opt ${draft.color === 'random' ? 'active' : ''}" data-gs-color="random">
                <strong>🎲 Aleatorio</strong>
                <span>Al azar</span>
              </button>
              <button type="button" class="gs-opt ${draft.color === 'b' ? 'active' : ''}" data-gs-color="b">
                <strong>♚ Negras</strong>
                <span>IA abre</span>
              </button>
            </div>
          </div>

          <div class="gs-block">
            <span class="gs-label">3. Control de tiempo</span>
            <div class="gs-clock-grid">
              ${CLOCK_PRESETS.map(c => `
                <button type="button" class="gs-opt ${draft.clock === c.id ? 'active' : ''}" data-gs-clock="${c.id}">
                  <strong>${c.label}</strong>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="gs-block">
            <span class="gs-label">4. Estilo de partida</span>
            <div class="gs-row-2">
              <button type="button" class="gs-opt ${draft.mode === 'practice' ? 'active' : ''}" data-gs-mode="practice">
                <strong>🎓 Práctica</strong>
                <span>Con Deshacer y Mapa</span>
              </button>
              <button type="button" class="gs-opt ${draft.mode === 'challenge' ? 'active' : ''}" data-gs-mode="challenge">
                <strong>🔥 Modo Reto</strong>
                <span>Sin ayudas en partida</span>
              </button>
            </div>
          </div>

          ${is960 ? `
            <div class="gs-block">
              <span class="gs-label">5. Posición inicial Fischer 960</span>
              <div class="gs-pos-row">
                <button type="button" class="gs-opt ${draft.f960Random ? 'active' : ''}" data-gs-f960="rand" style="flex:1">
                  <strong>🎲 Aleatoria (0–959)</strong>
                </button>
                <button type="button" class="gs-opt ${!draft.f960Random ? 'active' : ''}" data-gs-f960="custom" style="flex:1">
                  <strong># Elegir número</strong>
                </button>
                <input type="number" min="0" max="959" class="gs-pos-input" id="gs-f960-num"
                  value="${draft.f960Pos}" ${draft.f960Random ? 'disabled' : ''} />
              </div>
            </div>
          ` : ''}

          <button type="button" class="btn btn-primary gs-start-btn" id="gs-start">
            ⚔️ ¡Jugar Ahora!
          </button>
        </div>
      `;

      backdrop.querySelector('#gs-close')?.addEventListener('click', () => backdrop.remove());
      backdrop.querySelectorAll('[data-gs-elo]').forEach(b => b.addEventListener('click', () => {
        draft.elo = Number(b.dataset.gsElo);
        renderModal();
      }));
      backdrop.querySelectorAll('[data-gs-color]').forEach(b => b.addEventListener('click', () => {
        draft.color = b.dataset.gsColor;
        renderModal();
      }));
      backdrop.querySelectorAll('[data-gs-clock]').forEach(b => b.addEventListener('click', () => {
        draft.clock = b.dataset.gsClock;
        renderModal();
      }));
      backdrop.querySelectorAll('[data-gs-mode]').forEach(b => b.addEventListener('click', () => {
        draft.mode = b.dataset.gsMode;
        renderModal();
      }));
      backdrop.querySelectorAll('[data-gs-f960]').forEach(b => b.addEventListener('click', () => {
        draft.f960Random = b.dataset.gsF960 === 'rand';
        renderModal();
      }));
      backdrop.querySelector('#gs-f960-num')?.addEventListener('input', (e) => {
        draft.f960Pos = Math.max(0, Math.min(959, parseInt(e.target.value, 10) || 0));
      });
      backdrop.querySelector('#gs-start')?.addEventListener('click', () => {
        backdrop.remove();
        launchConfiguredGame(variant, draft);
      });
    };

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.remove();
    });

    renderModal();
    document.body.appendChild(backdrop);
  };

  if (app.shell?.navigate) {
    const origNav = app.shell.navigate.bind(app.shell);
    app.shell.navigate = (viewId) => {
      const res = origNav(viewId);
      setTimeout(() => {
        renderActiveBanner();
        syncRematchCard();
      }, 60);
      return res;
    };
  }

  app.gameSetup = { openSetupModal, clearSessions };
}
