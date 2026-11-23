const VAULT_KEY = 'ajedrez960_saved_games_v1';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function ensureVaultStyles() {
  if (document.querySelector('style[data-vault-css]')) return;
  const style = document.createElement('style');
  style.dataset.vaultCss = 'true';
  style.textContent = `
    .vault-list { display: flex; flex-direction: column; gap: 10px; }
    .vault-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 13px; padding: 14px 16px;
      display: flex; flex-wrap: wrap; justify-content: space-between;
      align-items: center; gap: 12px;
    }
    .vault-card.win { border-left: 4px solid #22c55e; }
    .vault-card.loss { border-left: 4px solid #f43f5e; }
    .vault-card.draw { border-left: 4px solid #38bdf8; }
    .vault-meta { display: flex; flex-direction: column; gap: 4px; }
    .vault-tags { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .vault-pill {
      font-size: 0.69rem; font-weight: 800; padding: 2px 8px;
      border-radius: 999px; background: rgba(56, 189, 248, 0.14); color: var(--accent-cyan);
    }
    .vault-pill.win { background: rgba(34, 197, 94, 0.16); color: #4ade80; }
    .vault-pill.loss { background: rgba(244, 63, 94, 0.16); color: #fb7185; }
    .vault-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  `;
  document.head.appendChild(style);
}

export function attachHistoryVault(app) {
  ensureVaultStyles();

  const loadGames = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(VAULT_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const saveGames = (list) => {
    const limit = app.store.hasAccess('pro_history') ? 50 : 10;
    try {
      localStorage.setItem(VAULT_KEY, JSON.stringify(list.slice(0, limit)));
    } catch { /* ignorar */ }
  };

  let lastSavedKey = '';

  const archiveCurrentGame = () => {
    const hist = app.engine?.history || [];
    if (hist.length < 2) return;

    const sig = `${app.engine.positionId}_${hist.length}_${hist[hist.length - 1]?.san}_${app.engine.status}`;
    if (sig === lastSavedKey) return;
    lastSavedKey = sig;

    const myColor = app.mode === 'online' ? (app.onlineColor || 'w') : 'w';
    let outcome = 'draw';
    if (app.engine.winner) outcome = app.engine.winner === myColor ? 'win' : 'loss';

    const oppText = app.mode === 'online'
      ? 'Rival Online'
      : app.mode === 'pvp'
        ? '2 Jugadores Local'
        : (app.dom.topName?.textContent || 'IA').replace(/^Negras\s*\(|\)$/g, '');

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) +
      ' · ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const compactMoves = hist.map(m => ({
      fr: m.from.r, fc: m.from.c, tr: m.to.r, tc: m.to.c,
      pr: m.promo || null, ca: m.castle || null
    }));

    const entry = {
      id: `gm_${Date.now()}`,
      date: dateStr,
      variant: app.variant,
      positionId: app.engine.positionId,
      opponent: oppText,
      myColor,
      outcome,
      status: app.engine.status,
      winner: app.engine.winner,
      plies: hist.length,
      moves: compactMoves
    };

    const list = loadGames();
    list.unshift(entry);
    saveGames(list);
  };

  // Guardar automáticamente al concluir cualquier partida
  ['_handleGameOver', '_finishResign', '_handleTimeout'].forEach((fn) => {
    const orig = app[fn].bind(app);
    app[fn] = (...args) => {
      const res = orig(...args);
      archiveCurrentGame();
      return res;
    };
  });

  const openSavedForAnalysis = (entry) => {
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

  const renderVaultView = () => {
    const root = app.shell.viewRoot;
    const list = loadGames();
    const limit = app.store.hasAccess('pro_history') ? 50 : 10;
    const outcomeText = { win: 'Victoria', loss: 'Derrota', draw: 'Tablas' };
    const reasonText = { checkmate: 'Jaque Mate', timeout: 'Tiempo', resigned: 'Rendición', stalemate: 'Ahogado' };

    root.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>📜 Mis Partidas Guardadas (${list.length}/${limit})</h2>
          <p class="sec-sub">Reabre cualquier partida para revivirla y analizarla jugada por jugada con Stockfish.</p>
        </div>
        <button class="btn btn-secondary" id="vault-home">← Inicio</button>
      </div>

      ${list.length === 0 ? `
        <div class="settings-box" style="text-align:center;padding:28px">
          <div style="font-size:2rem;margin-bottom:6px">♟️</div>
          <strong>Aún no tienes partidas archivadas</strong>
          <p class="sec-sub">Al terminar tu próxima partida (Clásico, Fischer 960 u Online) se guardará aquí automáticamente.</p>
        </div>
      ` : `
        <div class="vault-list">
          ${list.map(g => `
            <div class="vault-card ${g.outcome}">
              <div class="vault-meta">
                <div class="vault-tags">
                  <span class="vault-pill ${g.outcome}">${outcomeText[g.outcome] || 'Final'}</span>
                  <span class="vault-pill">${g.variant === 'classic' ? '♟ Clásico' : `🎲 960 #${g.positionId}`}</span>
                  <span class="sec-sub">${esc(g.date)}</span>
                </div>
                <strong>vs. ${esc(g.opponent)}</strong>
                <span class="sec-sub">${Math.ceil(g.plies / 2)} jugadas · ${reasonText[g.status] || 'Finalizada'}</span>
              </div>
              <div class="vault-actions">
                <button class="btn btn-primary" data-analyze-id="${g.id}">📊 Analizar</button>
                <button class="btn btn-ghost" data-del-id="${g.id}" title="Eliminar partida">🗑️</button>
              </div>
            </div>
          `).join('')}
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
        const next = loadGames().filter(x => x.id !== btn.dataset.delId);
        saveGames(next);
        renderVaultView();
      });
    });
  };

  // Registrar vista 'history' en AppShell
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
