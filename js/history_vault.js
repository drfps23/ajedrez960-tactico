const VAULT_KEY = 'ajedrez960_saved_games_v1';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&').replace(/</g, '<')
    .replace(/>/g, '>').replace(/"/g, '"');
}

function ensureVaultStyles() {
  if (document.querySelector('style[data-vault-css]')) return;
  const style = document.createElement('style');
  style.dataset.vaultCss = 'true';
  style.textContent = `
    .vault-list { display: flex; flex-direction: column; gap: 8px; }
    .vault-row {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 13px; padding: 12px 15px;
      display: grid; grid-template-columns: 78px 1fr 90px 105px auto;
      align-items: center; gap: 12px;
    }
    .vault-row.win { border-left: 4px solid #22c55e; }
    .vault-row.loss { border-left: 4px solid #f43f5e; }
    .vault-row.draw { border-left: 4px solid #38bdf8; }
    .vault-clock-col { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 0.74rem; color: var(--text-muted); }
    .vault-score-col { display: flex; align-items: center; gap: 8px; font-family: ui-monospace, monospace; font-weight: 800; font-size: 0.86rem; }
    .vault-badge {
      width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center;
      font-size: 0.85rem; font-weight: 900; color: #090d16;
    }
    .vault-badge.win { background: #22c55e; }
    .vault-badge.loss { background: #f43f5e; color: #fff; }
    .vault-badge.draw { background: #94a3b8; }
    .vault-acc-col { text-align: center; font-size: 0.78rem; color: var(--text-muted); }
    .vault-acc-col strong { display: block; color: #f8fafc; font-size: 0.84rem; }
    .vault-actions { display: flex; gap: 6px; justify-content: flex-end; }
    @media (max-width: 780px) {
      .vault-row { grid-template-columns: 1fr auto; }
      .vault-clock-col, .vault-acc-col { display: none; }
    }
  `;
  document.head.appendChild(style);
}

export function attachHistoryVault(app) {
  ensureVaultStyles();

  let activeVaultId = null;
  let lastSavedKey = '';

  const loadGames = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(VAULT_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  };

  const saveGames = (list) => {
    const limit = app.store.hasAccess('pro_history') ? 50 : 10;
    try { localStorage.setItem(VAULT_KEY, JSON.stringify(list.slice(0, limit))); } catch { /* ignorar */ }
  };

  const archiveCurrentGame = () => {
    const hist = app.engine?.history || [];
    if (hist.length < 2) return;

    const sig = `${app.engine.positionId}_${hist.length}_${hist[hist.length - 1]?.san}_${app.engine.status}`;
    if (sig === lastSavedKey) return;
    lastSavedKey = sig;

    const myColor = app.mode === 'online' ? (app.onlineColor || 'w') : 'w';
    let outcome = 'draw';
    if (app.engine.winner) outcome = app.engine.winner === myColor ? 'win' : 'loss';

    const oppRaw = app.mode === 'online'
      ? (app.dom.topName?.textContent || 'Rival Online')
      : app.mode === 'pvp'
        ? '2 Jugadores Local'
        : (app.dom.topName?.textContent || 'IA');
    const opponent = oppRaw.replace(/^(Blancas|Negras)\s*\(|\)$/g, '').trim() || 'Rival';

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const clockId = app.clock?.preset?.id || 'off';
    const clockShort = clockId === 'off' ? 'Sin reloj' : clockId === '10+0' ? '10 min' : clockId === '30+0' ? '30 min' : clockId;

    const entry = {
      id: `gm_${Date.now()}`,
      date: dateStr,
      variant: app.variant,
      positionId: app.engine.positionId,
      clockId,
      clockShort,
      opponent,
      myColor,
      outcome,
      status: app.engine.status,
      winner: app.engine.winner,
      plies: hist.length,
      whiteAcc: null,
      blackAcc: null,
      moves: hist.map(m => ({
        fr: m.from.r, fc: m.from.c, tr: m.to.r, tc: m.to.c,
        pr: m.promo || null, ca: m.castle || null
      }))
    };

    const list = loadGames();
    list.unshift(entry);
    saveGames(list);
    activeVaultId = entry.id;
  };

  ['_handleGameOver', '_finishResign', '_handleTimeout'].forEach((fn) => {
    const orig = app[fn].bind(app);
    app[fn] = (...args) => {
      const res = orig(...args);
      archiveCurrentGame();
      return res;
    };
  });

  // Guardar Precisión % automáticamente cuando Stockfish termine un análisis
  const savePrecisionToVault = () => {
    const sum = app.analyzer?.summary;
    if (!sum || sum.whiteAcc == null) return;
    const list = loadGames();
    if (!list.length) return;
    const target = list.find(g => g.id === activeVaultId) || list[0];
    if (!target) return;
    target.whiteAcc = sum.whiteAcc;
    target.blackAcc = sum.blackAcc;
    saveGames(list);
  };

  if (app.analyzer) {
    const origReady = app.analyzer.onAnalysisReady;
    app.analyzer.onAnalysisReady = (results) => {
      savePrecisionToVault();
      if (origReady) origReady(results);
    };
  }

  const openSavedForAnalysis = (entry) => {
    activeVaultId = entry.id;
    app.shell.navigate('play');
    app._setModeProgrammatically('pvp');
    app.setVariant(entry.variant, { startFresh: false });
    app.flipped = entry.myColor === 'b';
    app.startNewGame(entry.positionId);

    for (const m of entry.moves) {
      const legal = app.engine.getLegalMoves(app.engine.turn);
      const found = m.ca
        ? legal.find(x => x.castle === m.ca)
        : legal.find(x =>
            x.from.r === m.fr && x.from.c === m.fc &&
            x.to.r === m.tr && x.to.c === m.tc &&
            (x.promo || null) === (m.pr || null)
          );
      if (!found) break;
      app.engine.makeMove(found);
    }

    app.engine.status = entry.status;
    app.engine.winner = entry.winner;
    app.render();
    app.analyzer.onGameOver(app.engine);
    app.analyzer.startAnalysis(app.engine);
  };

  app.historyVault = { loadGames, openSavedForAnalysis };

  const renderVaultView = () => {
    const root = app.shell.viewRoot;
    const list = loadGames();
    const limit = app.store.hasAccess('pro_history') ? 50 : 10;
    const myName = app.store.data.profile.name || 'Tú';

    root.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>📜 Historial de Partidas (${list.length}/${limit})</h2>
          <p class="sec-sub">Precisión de Stockfish, ritmo de reloj y revisión completa en un toque.</p>
        </div>
        <button class="btn btn-secondary" id="vault-home">← Inicio</button>
      </div>

      ${list.length === 0 ? `
        <div class="settings-box" style="text-align:center;padding:28px">
          <div style="font-size:2rem;margin-bottom:6px">♟️</div>
          <strong>Aún no tienes partidas archivadas</strong>
          <p class="sec-sub">Al terminar tu próxima partida aparecerá aquí con su precisión y botón de resumen.</p>
        </div>
      ` : `
        <div class="vault-list">
          ${list.map(g => {
            const wScore = g.winner === 'w' ? '1' : g.winner === 'b' ? '0' : '½';
            const bScore = g.winner === 'b' ? '1' : g.winner === 'w' ? '0' : '½';
            const badgeSym = g.outcome === 'win' ? '+' : g.outcome === 'loss' ? '−' : '=';
            const whiteName = g.myColor === 'w' ? myName : g.opponent;
            const blackName = g.myColor === 'b' ? myName : g.opponent;
            const accHtml = (g.whiteAcc != null && g.blackAcc != null)
              ? `<strong>${g.whiteAcc}% / ${g.blackAcc}%</strong><span>Precisión</span>`
              : `<strong>—</strong><span>Sin analizar</span>`;
            return `
              <div class="vault-row ${g.outcome}">
                <div class="vault-clock-col">
                  <span style="font-size:1.1rem">⏱</span>
                  <strong>${esc(g.clockShort || 'Sin reloj')}</strong>
                </div>
                <div style="min-width:0">
                  <div style="font-size:0.84rem;font-weight:700">⬜ ${esc(whiteName)}</div>
                  <div style="font-size:0.84rem;color:var(--text-muted)">⬛ ${esc(blackName)}</div>
                  <div class="sec-sub" style="margin-top:2px">
                    ${g.variant === 'classic' ? '♟ Clásico' : `🎲 960 #${g.positionId}`} · ${Math.ceil(g.plies / 2)} jug. · ${esc(g.date)}
                  </div>
                </div>
                <div class="vault-score-col">
                  <div><div>${wScore}</div><div>${bScore}</div></div>
                  <span class="vault-badge ${g.outcome}">${badgeSym}</span>
                </div>
                <div class="vault-acc-col">${accHtml}</div>
                <div class="vault-actions">
                  <button class="btn btn-primary" data-analyze-id="${g.id}">📊 Resumen</button>
                  <button class="btn btn-ghost" data-del-id="${g.id}" title="Eliminar">🗑️</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    root.querySelector('#vault-home')?.addEventListener('click', () => app.shell.navigate('home'));
    root.querySelectorAll('[data-analyze-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const found = loadGames().find(x => x.id === btn.dataset.analyzeId);
        if (found) openSavedForAnalysis(found);
      });
    });
    root.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        saveGames(loadGames().filter(x => x.id !== btn.dataset.delId));
        renderVaultView();
      });
    });
  };

  const origRenderView = app.shell.renderCurrentView.bind(app.shell);
  app.shell.renderCurrentView = () => {
    if (app.shell.currentView === 'history') { renderVaultView(); return; }
    origRenderView();
  };

  const origDrawer = app.shell._renderDrawer.bind(app.shell);
  app.shell._renderDrawer = () => {
    origDrawer();
    const profItem = app.shell.drawerPanel?.querySelector('[data-nav="profile"]');
    if (!profItem || app.shell.drawerPanel.querySelector('[data-nav="history"]')) return;
    const btn = document.createElement('button');
    btn.className = `drawer-item ${app.shell.currentView === 'history' ? 'active' : ''}`;
    btn.dataset.nav = 'history';
    btn.innerHTML = `<span>📜 Mis Partidas</span><span class="sec-sub">${loadGames().length}</span>`;
    btn.addEventListener('click', () => { app.shell.closeDrawer(); app.shell.navigate('history'); });
    profItem.insertAdjacentElement('afterend', btn);
  };

  const origHome = app.shell._renderHome.bind(app.shell);
  app.shell._renderHome = () => {
    origHome();
    const strip = app.shell.viewRoot?.querySelector('.quick-strip');
    if (!strip || strip.querySelector('[data-nav="history"]')) return;
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.dataset.nav = 'history';
    btn.textContent = `📜 Mis Partidas (${loadGames().length})`;
    btn.addEventListener('click', () => app.shell.navigate('history'));
    strip.prepend(btn);
  };
}
