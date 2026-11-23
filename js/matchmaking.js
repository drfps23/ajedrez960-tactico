import { FIREBASE_CONFIG, isFirebaseConfigured } from './firebase_config.js';

const FB_APP_URL = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
const FB_DB_URL  = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function cleanObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function ensureMatchmakingStyles() {
  if (document.querySelector('style[data-mm-css]')) return;
  const style = document.createElement('style');
  style.dataset.mmCss = 'true';
  style.textContent = `
    .mm-card {
      background: linear-gradient(135deg, rgba(2, 132, 199, 0.16), rgba(99, 102, 241, 0.14), rgba(15, 23, 42, 0.9));
      border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 15px;
      padding: 16px 18px; display: flex; flex-direction: column; gap: 12px;
    }
    .mm-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; }
    .mm-head h3 { font-size: 1.02rem; font-weight: 800; }
    .mm-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .mm-chip {
      background: rgba(9, 13, 22, 0.72); color: var(--text-main);
      border: 1px solid var(--border-color); border-radius: 9px;
      padding: 7px 11px; font-size: 0.8rem; font-weight: 700; cursor: pointer;
    }
    .mm-chip.active { border-color: var(--accent-cyan); background: rgba(56, 189, 248, 0.18); color: var(--accent-cyan); }
    .mm-status {
      font-size: 0.82rem; color: #fde68a; background: rgba(9, 13, 22, 0.65);
      border: 1px solid var(--border-color); border-left: 3px solid var(--accent-cyan);
      border-radius: 9px; padding: 9px 12px; display: flex;
      justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .mm-status.hidden { display: none; }
    .mm-pulse {
      display: inline-block; width: 9px; height: 9px; border-radius: 50%;
      background: #4ade80; margin-right: 6px; animation: mmPulse 1.1s infinite;
    }
    .mm-top-list {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
      gap: 8px; margin-top: 2px;
    }
    .mm-rank-pill {
      background: rgba(9, 13, 22, 0.58); border: 1px solid var(--border-color);
      border-radius: 10px; padding: 7px 10px; font-size: 0.76rem;
      display: flex; justify-content: space-between; align-items: center; gap: 6px;
    }
    @keyframes mmPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(1.4); } }
  `;
  document.head.appendChild(style);
}

export function attachGlobalMatchmaking(app) {
  ensureMatchmakingStyles();

  let fb = null;
  let dbInitPromise = null;
  let selectedVariant = 'classic';
  let selectedClock = '5+3';

  let searching = false;
  let searchStartedAt = 0;
  let searchTimer = null;
  let myQueueRef = null;
  let unsubQueue = null;

  let activeMatch = null;
  let statusMessage = '';
  let showFallbackPractice = false;
  let topPlayers = [];

  const getMyUid = () => {
    const s = app.auth?.session;
    if (s?.uid) return s.uid;
    let id = localStorage.getItem('ajedrez960_anon_uid');
    if (!id) {
      id = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('ajedrez960_anon_uid', id);
    }
    return id;
  };

  const getMyElo = (variant) => {
    const b = variant === 'classic' ? app.store.data.stats.classic : app.store.data.stats.fischer960;
    return Number(b?.elo) || 1200;
  };

  const ensureFirebase = async () => {
    if (fb) return fb;
    if (!isFirebaseConfigured()) return null;
    if (!dbInitPromise) {
      dbInitPromise = Promise.all([import(FB_APP_URL), import(FB_DB_URL)])
        .then(([appMod, dbMod]) => {
          const existing = appMod.getApps();
          const fbApp = existing.length ? existing[0] : appMod.initializeApp(FIREBASE_CONFIG);
          const db = dbMod.getDatabase(fbApp);
          fb = { db, mod: dbMod };
          syncCloudPlayer();
          refreshLeaderboard();
          return fb;
        })
        .catch(() => null);
    }
    return dbInitPromise;
  };

  const syncCloudPlayer = async () => {
    const ctx = fb;
    if (!ctx) return;
    const { db, mod } = ctx;
    const uid = getMyUid();
    const prof = app.store.data.profile;
    try {
      await mod.set(mod.ref(db, `players/${uid}`), cleanObj({
        uid,
        name: prof.name || 'Jugador',
        avatar: prof.avatar || '♛',
        classicElo: getMyElo('classic'),
        f960Elo: getMyElo('fischer960'),
        updatedAt: Date.now()
      }));
    } catch { /* ignorar */ }
  };

  const refreshLeaderboard = async () => {
    if (!fb) return;
    const { db, mod } = fb;
    try {
      const snap = await mod.get(mod.ref(db, 'players'));
      const val = snap.val() || {};
      const field = selectedVariant === 'classic' ? 'classicElo' : 'f960Elo';
      topPlayers = Object.values(val)
        .filter(p => p && p.name)
        .sort((a, b) => (b[field] || 1200) - (a[field] || 1200))
        .slice(0, 5);
      updateMatchmakingWidgets();
    } catch { /* ignorar */ }
  };

  if (app.mp) {
    const origIsConn = app.mp.isConnected.bind(app.mp);
    app.mp.isConnected = () => Boolean(activeMatch) || origIsConn();

    const pushEvent = (payload) => {
      if (!activeMatch || !fb) return false;
      const { db, mod } = fb;
      mod.push(
        mod.ref(db, `matches/${activeMatch.id}/events`),
        cleanObj({ ...payload, sender: getMyUid(), ts: Date.now() })
      ).catch(() => {});
      return true;
    };

    const origSend = app.mp.send.bind(app.mp);
    app.mp.send = (payload) => activeMatch ? pushEvent(payload) : origSend(payload);

    const origSendMove = app.mp.sendMove.bind(app.mp);
    app.mp.sendMove = (move, remaining) =>
      activeMatch ? pushEvent({ type: 'move', move, remaining }) : origSendMove(move, remaining);

    const origSendResign = app.mp.sendResign.bind(app.mp);
    app.mp.sendResign = (loser) =>
      activeMatch ? pushEvent({ type: 'resign', loser }) : origSendResign(loser);

    const origSendTimeout = app.mp.sendTimeout.bind(app.mp);
    app.mp.sendTimeout = (loser, winner) =>
      activeMatch ? pushEvent({ type: 'timeout', loser, winner }) : origSendTimeout(loser, winner);

    const origRematch = app.mp.requestRematch.bind(app.mp);
    app.mp.requestRematch = (positionId, clockPresetId) => {
      if (!activeMatch) return origRematch(positionId, clockPresetId);
      const nextColor = activeMatch.myColor === 'w' ? 'b' : 'w';
      pushEvent({ type: 'rematch', positionId, clockPresetId, hostNewColor: nextColor });
      activeMatch.myColor = nextColor;
      app._startOnlineMatch(positionId, nextColor, clockPresetId);
    };

    const origDisconnect = app.mp.disconnect.bind(app.mp);
    app.mp.disconnect = (silent = false) => {
      leaveActiveMatch();
      return origDisconnect(silent);
    };
  }

  const leaveActiveMatch = () => {
    if (!activeMatch) return;
    try { activeMatch.unsubEvents?.(); } catch { /* ignorar */ }
    activeMatch = null;
  };

  const enterMatch = async (matchId, myColor, matchData) => {
    await cancelSearch();
    leaveActiveMatch();
    if (!fb) return;

    const { db, mod } = fb;
    const myUid = getMyUid();
    const seen = new Set();
    const eventsRef = mod.ref(db, `matches/${matchId}/events`);

    activeMatch = {
      id: matchId,
      myColor,
      variant: matchData.variant || selectedVariant,
      clock: matchData.clock || selectedClock,
      seen,
      unsubEvents: null
    };

    activeMatch.unsubEvents = mod.onChildAdded(eventsRef, (snap) => {
      const key = snap.key;
      if (!key || seen.has(key)) return;
      seen.add(key);

      const ev = snap.val();
      if (!ev || ev.sender === myUid) return;

      if (ev.type === 'move') {
        app._handleRemoteMove({ move: ev.move, remaining: ev.remaining });
      } else if (ev.type === 'resign') {
        app._finishResign(ev.loser, true);
      } else if (ev.type === 'timeout') {
        app._handleTimeout(ev.loser, ev.winner, true);
      } else if (ev.type === 'rematch') {
        const myNewColor = ev.hostNewColor === 'w' ? 'b' : 'w';
        activeMatch.myColor = myNewColor;
        app._startOnlineMatch(ev.positionId, myNewColor, ev.clockPresetId);
      } else {
        app.mp?._handleMessage(ev);
      }
    });

    app.shell.navigate('play');
    app._setModeProgrammatically('online');
    app._startOnlineMatch(matchData.positionId, myColor, matchData.clock);
    app.haptics?.pulse('heavy');
  };

  const cancelSearch = async () => {
    searching = false;
    showFallbackPractice = false;
    statusMessage = '';
    if (searchTimer) { clearInterval(searchTimer); searchTimer = null; }
    if (unsubQueue) { try { unsubQueue(); } catch { /* ignorar */ } unsubQueue = null; }
    if (myQueueRef && fb) {
      try { await fb.mod.remove(myQueueRef); } catch { /* ignorar */ }
      myQueueRef = null;
    }
    updateMatchmakingWidgets();
  };

  const tryPairWithWaitingPlayer = async (bucket, maxDiff) => {
    if (!fb || !searching) return false;
    const { db, mod } = fb;
    const myUid = getMyUid();
    const myElo = getMyElo(selectedVariant);
    const now = Date.now();

    const snap = await mod.get(mod.ref(db, `queue/${bucket}`));
    const entries = Object.values(snap.val() || {});
    const candidate = entries.find(e =>
      e &&
      e.uid !== myUid &&
      e.status === 'waiting' &&
      (now - (e.ts || 0)) < 45000 &&
      Math.abs((e.elo || 1200) - myElo) <= maxDiff
    );
    if (!candidate) return false;

    const matchId = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const positionId = selectedVariant === 'classic' ? 518 : Math.floor(Math.random() * 960);
    const iAmWhite = Math.random() < 0.5;
    const matchData = {
      id: matchId,
      variant: selectedVariant,
      clock: selectedClock,
      positionId,
      whiteUid: iAmWhite ? myUid : candidate.uid,
      blackUid: iAmWhite ? candidate.uid : myUid,
      createdAt: Date.now()
    };

    const candRef = mod.ref(db, `queue/${bucket}/${candidate.uid}`);
    const tx = await mod.runTransaction(candRef, (cur) => {
      if (!cur || cur.status !== 'waiting') return;
      return { ...cur, status: 'matched', matchId, matchedBy: myUid };
    });

    if (!tx.committed) return false;

    await mod.set(mod.ref(db, `matches/${matchId}`), cleanObj(matchData));
    await enterMatch(matchId, iAmWhite ? 'w' : 'b', matchData);
    return true;
  };

  const startSearch = async () => {
    if (searching) { await cancelSearch(); return; }
    const ctx = await ensureFirebase();
    if (!ctx) {
      statusMessage = '⚙️ Conecta tus claves en js/firebase_config.js para activar la búsqueda global.';
      updateMatchmakingWidgets();
      return;
    }

    const { db, mod } = ctx;
    const bucket = `${selectedVariant}_${selectedClock}`;
    const myUid = getMyUid();
    const myElo = getMyElo(selectedVariant);

    searching = true;
    showFallbackPractice = false;
    searchStartedAt = Date.now();
    statusMessage = `Buscando rival (${selectedVariant === 'classic' ? 'Clásico' : '960'} · ${selectedClock}) cerca de ${myElo} ELO...`;
    updateMatchmakingWidgets();

    if (await tryPairWithWaitingPlayer(bucket, 150)) return;

    myQueueRef = mod.ref(db, `queue/${bucket}/${myUid}`);
    await mod.set(myQueueRef, {
      uid: myUid,
      name: app.store.data.profile.name || 'Jugador',
      elo: myElo,
      status: 'waiting',
      ts: Date.now()
    });
    mod.onDisconnect(myQueueRef).remove().catch(() => {});

    unsubQueue = mod.onValue(myQueueRef, async (snap) => {
      const val = snap.val();
      if (!val || val.status !== 'matched' || !val.matchId) return;
      const mSnap = await mod.get(mod.ref(db, `matches/${val.matchId}`));
      const mData = mSnap.val();
      if (!mData) return;
      const myColor = mData.whiteUid === myUid ? 'w' : 'b';
      await enterMatch(val.matchId, myColor, mData);
    });

    searchTimer = setInterval(async () => {
      if (!searching) return;
      const sec = Math.floor((Date.now() - searchStartedAt) / 1000);
      const maxDiff = sec < 8 ? 150 : sec < 16 ? 350 : 9999;
      if (sec >= 18) showFallbackPractice = true;
      statusMessage = sec < 8
        ? `Buscando rival cerca de ${myElo} ELO (±150)... ${sec}s`
        : sec < 16
          ? `Ampliando búsqueda (±350 ELO)... ${sec}s`
          : `Buscando cualquier rival conectado en ${selectedClock}... ${sec}s`;
      updateMatchmakingWidgets();
      await tryPairWithWaitingPlayer(bucket, maxDiff);
    }, 3000);
  };

  const origRecord = app.store.recordGame.bind(app.store);
  app.store.recordGame = (payload) => {
    const res = origRecord(payload);
    syncCloudPlayer();
    return res;
  };

  const buildWidgetHtml = () => {
    const configured = isFirebaseConfigured();
    const eloField = selectedVariant === 'classic' ? 'classicElo' : 'f960Elo';
    return `
      <div class="mm-head">
        <div>
          <h3>🌍 Emparejamiento Global por ELO</h3>
          <span class="sec-sub">${configured ? 'Conectado a Firebase Realtime · Búsqueda automática' : 'Listo para conectar: pega tus claves en js/firebase_config.js'}</span>
        </div>
        <button type="button" class="btn ${searching ? 'btn-secondary' : 'btn-primary'}" data-mm-action="toggle">
          ${searching ? '✕ Cancelar Búsqueda' : '🔍 Buscar Rival Ahora'}
        </button>
      </div>

      <div class="mm-controls">
        <button type="button" class="mm-chip ${selectedVariant === 'classic' ? 'active' : ''}" data-mm-var="classic">♟ Clásico</button>
        <button type="button" class="mm-chip ${selectedVariant === 'fischer960' ? 'active' : ''}" data-mm-var="fischer960">🎲 Fischer 960</button>
        <button type="button" class="mm-chip ${selectedClock === '3+2' ? 'active' : ''}" data-mm-clk="3+2">⚡ 3+2 Blitz</button>
        <button type="button" class="mm-chip ${selectedClock === '5+3' ? 'active' : ''}" data-mm-clk="5+3">⏱ 5+3 Rápida</button>
      </div>

      <div class="mm-status ${statusMessage ? '' : 'hidden'}">
        <span>${searching ? '<span class="mm-pulse"></span>' : ''}${esc(statusMessage)}</span>
        ${showFallbackPractice ? '<button type="button" class="btn btn-secondary" data-mm-action="practice">🤖 Practicar mientras tanto</button>' : ''}
      </div>

      ${topPlayers.length > 0 ? `
        <div class="mm-top-list">
          ${topPlayers.map((p, idx) => `
            <div class="mm-rank-pill">
              <span>#${idx + 1} ${esc(p.avatar || '♛')} ${esc(p.name)}</span>
              <strong style="color:var(--accent-cyan)">${p[eloField] || 1200}</strong>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  };

  const bindWidgetEvents = (box) => {
    box.querySelectorAll('[data-mm-var]').forEach(b => b.addEventListener('click', () => {
      if (searching) return;
      selectedVariant = b.dataset.mmVar;
      refreshLeaderboard();
      updateMatchmakingWidgets();
    }));
    box.querySelectorAll('[data-mm-clk]').forEach(b => b.addEventListener('click', () => {
      if (searching) return;
      selectedClock = b.dataset.mmClk;
      updateMatchmakingWidgets();
    }));
    box.querySelector('[data-mm-action="toggle"]')?.addEventListener('click', () => startSearch());
    box.querySelector('[data-mm-action="practice"]')?.addEventListener('click', async () => {
      await cancelSearch();
      app.shell.navigate('play');
      app._setModeProgrammatically('ai-elo-1200');
      app.setVariant(selectedVariant, { startFresh: true });
    });
  };

  const updateMatchmakingWidgets = () => {
    document.querySelectorAll('.mm-card').forEach((box) => {
      box.innerHTML = buildWidgetHtml();
      bindWidgetEvents(box);
    });
  };

  const origHome = app.shell._renderHome.bind(app.shell);
  app.shell._renderHome = () => {
    origHome();
    const grid = app.shell.viewRoot?.querySelector('.home-grid');
    if (!grid || app.shell.viewRoot.querySelector('.mm-card')) return;
    const card = document.createElement('section');
    card.className = 'mm-card';
    card.innerHTML = buildWidgetHtml();
    bindWidgetEvents(card);
    grid.insertAdjacentElement('beforebegin', card);
  };

  if (isFirebaseConfigured()) {
    ensureFirebase();
  }
}
