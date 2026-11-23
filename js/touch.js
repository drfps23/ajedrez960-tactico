function ensureTouchStyles() {
  if (document.querySelector('style[data-touch-css]')) return;
  const style = document.createElement('style');
  style.dataset.touchCss = 'true';
  style.textContent = `
    .board-grid {
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
    }
    .square.drag-over {
      box-shadow: inset 0 0 0 3px var(--accent-gold);
    }
    .drag-ghost {
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%) scale(1.16);
      filter: drop-shadow(0 12px 14px rgba(0, 0, 0, 0.72));
      will-change: left, top;
    }
    .drag-ghost svg {
      width: 100%;
      height: 100%;
    }
    @media (max-width: 640px) {
      .topbar { padding: 10px 12px; gap: 8px; }
      .brand h1 { font-size: 0.94rem; }
      .brand .subtitle { display: none; }
      .arena { padding: 10px; gap: 12px; }
      .board-toolbar { gap: 6px; }
      .board-toolbar .btn { padding: 7px 9px; font-size: 0.76rem; flex: 1 1 auto; text-align: center; }
      .player-bar { padding: 6px 10px; }
      .player-name { font-size: 0.8rem; }
      .top-controls { width: 100%; justify-content: space-between; }
    }
  `;
  document.head.appendChild(style);
}

export function attachTouchControls(app) {
  ensureTouchStyles();
  const grid = app.dom?.boardGrid;
  if (!grid) return;

  let drag = null;
  let suppressClickUntil = 0;

  const canInteract = () => {
    if (app.reviewFrame || app.aiBusy || app.isAnimating) return false;
    if (app.engine.status !== 'playing' || app._isAiTurn()) return false;
    if (app.mode === 'online') {
      if (!app.mp?.isConnected() || app.engine.turn !== app.onlineColor) return false;
    }
    return true;
  };

  const clientToSquare = (clientX, clientY) => {
    const rect = grid.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const vc = Math.floor(((clientX - rect.left) / rect.width) * 8);
    const vr = Math.floor(((clientY - rect.top) / rect.height) * 8);
    if (vr < 0 || vr > 7 || vc < 0 || vc > 7) return null;
    return {
      r: app.flipped ? 7 - vr : vr,
      c: app.flipped ? 7 - vc : vc,
      cell: rect.width / 8
    };
  };

  const clearHover = () => {
    grid.querySelectorAll('.square.drag-over').forEach(el => el.classList.remove('drag-over'));
  };

  const highlightHover = (sq) => {
    clearHover();
    if (!sq) return;
    const vr = app.flipped ? 7 - sq.r : sq.r;
    const vc = app.flipped ? 7 - sq.c : sq.c;
    const el = grid.children[vr * 8 + vc];
    if (el) el.classList.add('drag-over');
  };

  // Bloquea el clic sintético que dispara el navegador justo al soltar un arrastre
  grid.addEventListener('click', (e) => {
    if (performance.now() < suppressClickUntil) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  grid.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (!canInteract()) return;

    const sq = clientToSquare(e.clientX, e.clientY);
    if (!sq) return;

    const piece = app.engine.board[sq.r][sq.c];
    if (!piece || piece.color !== app.engine.turn) return;

    const legal = app.engine.getLegalMovesFrom(sq.r, sq.c);
    if (legal.length === 0) return;

    drag = {
      from: { r: sq.r, c: sq.c },
      piece,
      legal,
      cell: sq.cell,
      pointerId: e.pointerId,
      isTouch: e.pointerType === 'touch',
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      ghost: null
    };
  });

  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;

    const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (!drag.moved && dist > 6) {
      drag.moved = true;
      app.selected = { ...drag.from };
      app.legalForSelected = drag.legal;
      app.hiddenSquares.add(`${drag.from.r},${drag.from.c}`);
      app.render();

      const ghost = document.createElement('div');
      ghost.className = 'drag-ghost';
      const size = Math.max(44, drag.cell * 0.92);
      ghost.style.width = `${size}px`;
      ghost.style.height = `${size}px`;
      ghost.innerHTML = app.pieceRenderer(drag.piece.type, drag.piece.color);
      document.body.appendChild(ghost);
      drag.ghost = ghost;
    }

    if (drag.moved && drag.ghost) {
      const liftY = drag.isTouch ? drag.cell * 0.48 : 0;
      drag.ghost.style.left = `${e.clientX}px`;
      drag.ghost.style.top = `${e.clientY - liftY}px`;
      highlightHover(clientToSquare(e.clientX, e.clientY - liftY * 0.4));
    }
  });

  const finishDrag = (e, cancelled = false) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const st = drag;
    drag = null;

    clearHover();
    if (st.ghost) st.ghost.remove();

    if (!st.moved) return; // Fue un toque normal: dejar que handleSquareClick actúe

    suppressClickUntil = performance.now() + 260;
    app.hiddenSquares.delete(`${st.from.r},${st.from.c}`);

    if (cancelled) {
      app.render();
      return;
    }

    const liftY = st.isTouch ? st.cell * 0.48 : 0;
    const dropSq = clientToSquare(e.clientX, e.clientY - liftY * 0.4);

    if (dropSq && (dropSq.r !== st.from.r || dropSq.c !== st.from.c)) {
      const candidates = app._matchMovesForClick(dropSq.r, dropSq.c);
      if (candidates.length > 0) {
        if (candidates.length > 1 && candidates[0].promo) {
          app.render();
          app._openPromoModal(candidates);
        } else {
          app._executeMove(candidates[0], { fromRemote: false });
        }
        return;
      }
    }

    app.render();
  };

  window.addEventListener('pointerup', (e) => finishDrag(e, false));
  window.addEventListener('pointercancel', (e) => finishDrag(e, true));
}
