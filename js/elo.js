export function attachEloSystem(app) {
  let opponentMeta = null;
  let lastEloNote = '';

  const getMyElo = (variant) => {
    const b = variant === 'classic' ? app.store.data.stats.classic : app.store.data.stats.fischer960;
    return Number(b?.elo) || 1200;
  };

  const getOpponentElo = (variant) => {
    if (!opponentMeta) return 1200;
    return Number(opponentMeta[variant]) || 1200;
  };

  const sendMyMeta = () => {
    if (!app.mp?.isConnected()) return;
    app.mp.send({
      type: 'player_meta',
      name: app.store.data.profile.name || 'Jugador',
      classic: getMyElo('classic'),
      fischer960: getMyElo('fischer960')
    });
  };

  // 1. Intercambiar nombre y ELO real al iniciar partida online
  if (app.mp) {
    const origHandleMsg = app.mp._handleMessage.bind(app.mp);
    app.mp._handleMessage = (msg) => {
      if (msg && msg.type === 'player_meta') {
        opponentMeta = {
          name: String(msg.name || 'Rival Online').slice(0, 24),
          classic: Number(msg.classic) || 1200,
          fischer960: Number(msg.fischer960) || 1200
        };
        app._updatePlayerLabels();
        return;
      }
      return origHandleMsg(msg);
    };

    const origDisconnect = app.mp.disconnect.bind(app.mp);
    app.mp.disconnect = (...args) => {
      opponentMeta = null;
      return origDisconnect(...args);
    };
  }

  const origStartOnline = app._startOnlineMatch.bind(app);
  app._startOnlineMatch = (positionId, myColor, clockPresetId) => {
    origStartOnline(positionId, myColor, clockPresetId);
    sendMyMeta();
  };

  // 2. Mostrar ELO real en las barras de jugadores durante partidas online
  const origUpdateLabels = app._updatePlayerLabels.bind(app);
  app._updatePlayerLabels = () => {
    origUpdateLabels();
    if (app.mode !== 'online' || !app.mp?.isConnected() || !app.onlineColor) return;

    const myName = app.store.data.profile.name || 'Tú';
    const oppName = opponentMeta?.name || 'Rival Online';
    const myElo = getMyElo(app.variant);
    const oppElo = getOpponentElo(app.variant);

    const whiteLabel = app.onlineColor === 'w'
      ? `Blancas (${myName} · ${myElo})`
      : `Blancas (${oppName} · ${oppElo})`;
    const blackLabel = app.onlineColor === 'b'
      ? `Negras (${myName} · ${myElo})`
      : `Negras (${oppName} · ${oppElo})`;

    const topIsBlack = !app.flipped;
    app.dom.topName.textContent = topIsBlack ? blackLabel : whiteLabel;
    app.dom.bottomName.textContent = topIsBlack ? whiteLabel : blackLabel;
  };

  // 3. Regla estricta: el ELO solo cambia en partidas Online reales
  const origRecordGame = app.store.recordGame.bind(app.store);
  app.store.recordGame = ({ variant, outcome, byCheckmate = false }) => {
    const bucket = variant === 'classic'
      ? app.store.data.stats.classic
      : app.store.data.stats.fischer960;
    const prevElo = bucket.elo;
    const isOnline = app.mode === 'online' && Boolean(app.onlineColor);

    origRecordGame({ variant, outcome, byCheckmate });

    if (!isOnline) {
      bucket.elo = prevElo;
      app.store.save();
      lastEloNote = 'Partida de práctica · Sin cambios de ELO';
      return;
    }

    const oppElo = getOpponentElo(variant);
    const onlineCount = (bucket.onlinePlayed || 0) + 1;
    bucket.onlinePlayed = onlineCount;

    const k = onlineCount <= 20 ? 32 : 24;
    const score = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
    const expected = 1 / (1 + Math.pow(10, (oppElo - prevElo) / 400));
    const delta = Math.round(k * (score - expected));
    const newElo = Math.max(400, Math.min(3000, prevElo + delta));

    bucket.elo = newElo;
    const sign = delta >= 0 ? '+' : '';
    const label = variant === 'classic' ? 'Clásico' : 'Fischer 960';

    app.store.addMessage({
      icon: delta >= 0 ? '📈' : '📉',
      title: `ELO ${label}: ${newElo} (${sign}${delta})`,
      body: `Partida online contra ${opponentMeta?.name || 'Rival Online'} (${oppElo} ELO).`
    });
    app.store.save();
    lastEloNote = `ELO ${label}: ${prevElo} → ${newElo} (${sign}${delta})`;
  };

  // 4. Mostrar resultado de ELO en el modal de Fin de Partida
  const appendNote = () => {
    if (!lastEloNote || !app.dom?.gameoverSubtitle) return;
    app.dom.gameoverSubtitle.textContent = `${app.dom.gameoverSubtitle.textContent} · ${lastEloNote}`;
    lastEloNote = '';
  };

  ['_handleGameOver', '_finishResign', '_handleTimeout'].forEach((fnName) => {
    const orig = app[fnName].bind(app);
    app[fnName] = (...args) => {
      const res = orig(...args);
      appendNote();
      return res;
    };
  });
}
