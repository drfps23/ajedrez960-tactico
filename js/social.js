import { APP_BRAND } from './intro.js';

const REACTIONS = [
  { emoji: '👏', label: '¡Buena!' },
  { emoji: '🔥', label: '¡Brutal!' },
  { emoji: '🤔', label: 'Hmm...' },
  { emoji: '😅', label: '¡Casi!' },
  { emoji: '🤝', label: '¡Buen juego!' },
  { emoji: '👑', label: '¡GG!' }
];

const PIECE_GLYPH = {
  w: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  b: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' }
};

function ensureSocialStyles() {
  if (document.querySelector('style[data-social-css]')) return;
  const style = document.createElement('style');
  style.dataset.socialCss = 'true';
  style.textContent = `
    .rx-bar {
      display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;
      padding: 6px 8px; border-radius: 10px;
      background: rgba(15, 23, 42, 0.72); border: 1px solid var(--border-color);
    }
    .rx-bar.hidden { display: none; }
    .rx-btn {
      background: rgba(9, 13, 22, 0.75); color: var(--text-main);
      border: 1px solid var(--border-color); border-radius: 999px;
      padding: 5px 10px; font-size: 0.76rem; font-weight: 700; cursor: pointer;
      transition: transform 0.12s, border-color 0.15s;
    }
    .rx-btn:hover { border-color: var(--accent-cyan); transform: translateY(-1px); }
    .rx-btn:active { transform: scale(0.94); }
    .rx-toast {
      position: absolute; left: 50%; transform: translateX(-50%);
      z-index: 30; pointer-events: none;
      background: rgba(9, 13, 22, 0.94); color: #f8fafc;
      border: 1.5px solid var(--accent-gold); border-radius: 999px;
      padding: 7px 16px; font-size: 0.9rem; font-weight: 800;
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.6);
      animation: rxPop 2.2s ease forwards;
      white-space: nowrap;
    }
    .rx-toast.top { top: 14px; }
    .rx-toast.bottom { bottom: 14px; }
    @keyframes rxPop {
      0% { opacity: 0; transform: translate(-50%, 10px) scale(0.85); }
      14% { opacity: 1; transform: translate(-50%, 0) scale(1.04); }
      24% { transform: translate(-50%, 0) scale(1); }
      82% { opacity: 1; transform: translate(-50%, 0); }
      100% { opacity: 0; transform: translate(-50%, -10px) scale(0.95); }
    }
  `;
  document.head.appendChild(style);
}

function generateVictoryCardBlob(app) {
  const W = 900, H = 1120;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Fondo degradado oscuro
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#131d36'); bg.addColorStop(0.55, '#090d16'); bg.addColorStop(1, '#020617');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Marco exterior dorado/cian
  const frame = ctx.createLinearGradient(0, 0, W, H);
  frame.addColorStop(0, '#38bdf8'); frame.addColorStop(0.5, '#facc15'); frame.addColorStop(1, '#f43f5e');
  ctx.strokeStyle = frame; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.roundRect(24, 24, W - 48, H - 48, 32); ctx.stroke();

  // Encabezado
  ctx.textAlign = 'center';
  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 24px Inter, system-ui, sans-serif';
  ctx.fillText(`♛ ${APP_BRAND.name}`, W / 2, 82);

  const variantLabel = app.variant === 'classic'
    ? 'AJEDREZ CLÁSICO'
    : `FISCHER 960 · POSICIÓN #${app.engine.positionId}`;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 18px Inter, system-ui, sans-serif';
  ctx.fillText(variantLabel, W / 2, 114);

  // Resultado principal
  const myColor = app.mode === 'online' ? (app.onlineColor || 'w') : 'w';
  let headline = '🤝 TABLAS';
  let headColor = '#38bdf8';
  if (app.engine.winner) {
    const won = app.engine.winner === myColor;
    headline = won ? '👑 ¡VICTORIA!' : '⚔️ PARTIDA FINALIZADA';
    headColor = won ? '#facc15' : '#f43f5e';
  }
  ctx.fillStyle = headColor;
  ctx.font = '900 54px Inter, system-ui, sans-serif';
  ctx.fillText(headline, W / 2, 184);

  const reasonMap = { checkmate: 'Jaque Mate', timeout: 'Tiempo Agotado', resigned: 'Rendición', stalemate: 'Ahogado' };
  const reason = reasonMap[app.engine.status] || 'Final de partida';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText(`${reason} · ${Math.ceil(app.engine.history.length / 2)} jugadas`, W / 2, 224);

  // Mini tablero final en el centro (560x560)
  const bSize = 560, cell = bSize / 8, bx = (W - bSize) / 2, by = 262;
  const lastMove = app.engine.history[app.engine.history.length - 1] || null;
  const loserKing = app.engine.status === 'checkmate'
    ? app.engine.findKing(app.engine.winner === 'w' ? 'b' : 'w')
    : null;

  ctx.save();
  ctx.beginPath(); ctx.roundRect(bx - 6, by - 6, bSize + 12, bSize + 12, 14);
  ctx.fillStyle = '#334155'; ctx.fill();
  ctx.restore();

  for (let vr = 0; vr < 8; vr++) {
    for (let vc = 0; vc < 8; vc++) {
      const r = app.flipped ? 7 - vr : vr;
      const cIdx = app.flipped ? 7 - vc : vc;
      const sx = bx + vc * cell, sy = by + vr * cell;
      ctx.fillStyle = (r + cIdx) % 2 === 0 ? '#cbd5e1' : '#334155';
      ctx.fillRect(sx, sy, cell, cell);

      if (lastMove) {
        const toCol = lastMove.castle ? lastMove.kingToCol : lastMove.to.c;
        if ((lastMove.from.r === r && lastMove.from.c === cIdx) || (lastMove.to.r === r && toCol === cIdx)) {
          ctx.fillStyle = 'rgba(250, 204, 21, 0.36)';
          ctx.fillRect(sx, sy, cell, cell);
        }
      }
      if (loserKing && loserKing.r === r && loserKing.c === cIdx) {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.55)';
        ctx.fillRect(sx, sy, cell, cell);
      }

      const p = app.engine.board[r][cIdx];
      if (p) {
        ctx.font = '50px "Segoe UI Symbol", "Apple Color Emoji", serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = p.color === 'w' ? '#ffffff' : '#020617';
        ctx.strokeStyle = p.color === 'w' ? '#0f172a' : '#38bdf8';
        ctx.lineWidth = 2;
        const g = PIECE_GLYPH[p.color][p.type];
        ctx.strokeText(g, sx + cell / 2, sy + cell / 2 + 2);
        ctx.fillText(g, sx + cell / 2, sy + cell / 2 + 2);
      }
    }
  }

  // Tarjetas inferiores de métricas
  ctx.textBaseline = 'alphabetic';
  const profile = app.store.data.profile;
  const bucket = app.variant === 'classic' ? app.store.data.stats.classic : app.store.data.stats.fischer960;
  const summary = app.analyzer?.summary;
  const myAcc = summary ? (myColor === 'w' ? summary.whiteAcc : summary.blackAcc) : null;

  const cards = [
    { label: 'JUGADOR', val: `${profile.avatar} ${profile.name}` },
    { label: app.variant === 'classic' ? 'ELO CLÁSICO' : 'ELO 960', val: String(bucket.elo) },
    { label: myAcc ? 'PRECISIÓN' : 'MODO', val: myAcc ? `${myAcc}%` : (app.mode === 'online' ? 'Online' : 'Práctica') }
  ];

  const cardW = 250, gap = 22, startX = (W - (cardW * 3 + gap * 2)) / 2, cardY = 865;
  cards.forEach((item, idx) => {
    const cx = startX + idx * (cardW + gap);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(cx, cardY, cardW, 118, 16); ctx.fill(); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 16px Inter, system-ui, sans-serif';
    ctx.fillText(item.label, cx + cardW / 2, cardY + 38);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 28px Inter, system-ui, sans-serif';
    ctx.fillText(item.val.slice(0, 14), cx + cardW / 2, cardY + 84);
  });

  ctx.fillStyle = '#64748b';
  ctx.font = '600 17px Inter, system-ui, sans-serif';
  ctx.fillText('Jugado en Ajedrez Táctico · Clásico & Fischer 960', W / 2, 1054);

  return new Promise((resolve) => c.toBlob((blob) => resolve(blob), 'image/png'));
}

export function attachSocialFeatures(app) {
  ensureSocialStyles();

  // 1. Barra de Reacciones Rápidas Online bajo el tablero
  const boardCol = document.querySelector('.board-column');
  const rxBar = document.createElement('div');
  rxBar.className = 'rx-bar hidden';
  rxBar.id = 'online-rx-bar';
  rxBar.innerHTML = REACTIONS.map((r, i) =>
    `<button type="button" class="rx-btn" data-rx="${i}">${r.emoji} ${r.label}</button>`
  ).join('');
  if (boardCol) boardCol.appendChild(rxBar);

  let lastSentAt = 0;

  const showToast = (text, position = 'top') => {
    const wrap = app.dom?.boardWrapper;
    if (!wrap) return;
    wrap.querySelectorAll(`.rx-toast.${position}`).forEach(el => el.remove());
    const toast = document.createElement('div');
    toast.className = `rx-toast ${position}`;
    toast.textContent = text;
    wrap.appendChild(toast);
    setTimeout(() => toast.remove(), 2250);
  };

  rxBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-rx]');
    if (!btn || !app.mp?.isConnected()) return;
    const now = performance.now();
    if (now - lastSentAt < 1400) return;
    lastSentAt = now;

    const r = REACTIONS[Number(btn.dataset.rx)];
    if (!r) return;
    app.mp.send({ type: 'reaction', emoji: r.emoji, label: r.label });
    showToast(`${r.emoji} ${r.label}`, 'bottom');
    app.haptics?.pulse('light');
  });

  // Recibir reacciones del rival en tiempo real
  if (app.mp) {
    const origMsg = app.mp._handleMessage.bind(app.mp);
    app.mp._handleMessage = (msg) => {
      if (msg && msg.type === 'reaction') {
        showToast(`${msg.emoji || '👏'} ${msg.label || ''}`, 'top');
        app.haptics?.pulse('light');
        return;
      }
      return origMsg(msg);
    };
  }

  // Mostrar/ocultar barra de reacciones según conexión online
  const origRenderStatus = app._renderStatusAndHistory.bind(app);
  app._renderStatusAndHistory = () => {
    origRenderStatus();
    const showRx = app.mode === 'online' && Boolean(app.mp?.isConnected()) && !app.reviewFrame;
    rxBar.classList.toggle('hidden', !showRx);
  };

  // 2. Botón "Compartir Tarjeta" en el modal de Fin de Partida
  const ensureShareButton = () => {
    const actions = app.dom?.gameoverActions;
    if (!actions || actions.querySelector('#btn-share-card')) return;
    const btn = document.createElement('button');
    btn.id = 'btn-share-card';
    btn.className = 'btn btn-secondary';
    btn.textContent = '📸 Compartir Tarjeta';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '⏳ Creando tarjeta...';
      try {
        const blob = await generateVictoryCardBlob(app);
        if (!blob) return;
        const file = new File([blob], 'ajedrez-tactico-resultado.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: APP_BRAND.name,
            text: `¡Mira mi partida en ${APP_BRAND.name}!`
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'ajedrez-tactico-resultado.png';
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        }
      } catch {
        // Usuario canceló compartir
      } finally {
        btn.disabled = false;
        btn.textContent = '📸 Compartir Tarjeta';
      }
    });
    actions.appendChild(btn);
  };

  ['_handleGameOver', '_finishResign', '_handleTimeout'].forEach((fn) => {
    const orig = app[fn].bind(app);
    app[fn] = (...args) => {
      const res = orig(...args);
      ensureShareButton();
      return res;
    };
  });
}
