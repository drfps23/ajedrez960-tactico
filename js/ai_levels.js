import { StockfishBridge } from './stockfish.js';

export const AI_LEVELS = {
  'ai-elo-800':  { label: '🤖 Principiante (800 ELO)',  short: 'Stockfish 800',  skill: 0,  depth: 2,  movetime: 220,  fallback: 'ai-easy',   proOnly: false },
  'ai-elo-1200': { label: '🤖 Aficionado (1200 ELO)',   short: 'Stockfish 1200', skill: 4,  depth: 5,  movetime: 340,  fallback: 'ai-easy',   proOnly: false },
  'ai-elo-1600': { label: '🤖 Club (1600 ELO)',         short: 'Stockfish 1600', skill: 10, depth: 8,  movetime: 520,  fallback: 'ai-normal', proOnly: false },
  'ai-elo-2000': { label: '🤖 Maestro (2000 ELO)',      short: 'Stockfish 2000', skill: 16, depth: 11, movetime: 750,  fallback: 'ai-normal', proOnly: true },
  'ai-elo-2600': { label: '👑 Gran Maestro (2600+)',    short: 'Stockfish GM',   skill: 20, depth: 14, movetime: 1100, fallback: 'ai-normal', proOnly: true }
};

function ensureAiLevelStyles() {
  if (document.querySelector('style[data-sf-css]')) return;
  const style = document.createElement('style');
  style.dataset.sfCss = 'true';
  style.textContent = `
    .sf-status-tag {
      font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;
      border: 1px solid var(--border-color); color: var(--text-muted);
      background: rgba(9, 13, 22, 0.55); margin-top: 6px; display: inline-block;
    }
    .sf-status-tag.ready { color: #4ade80; border-color: rgba(34, 197, 94, 0.4); }
    .sf-status-tag.offline { color: #facc15; border-color: rgba(250, 204, 21, 0.4); }
    .sf-deep-btn {
      width: 100%; padding: 7px 10px; font-size: 0.78rem; font-weight: 700;
      border-radius: 8px; cursor: pointer; color: #090d16;
      background: linear-gradient(135deg, #facc15, #f59e0b); border: none;
    }
    .sf-deep-btn:disabled { opacity: 0.55; cursor: wait; }
    .sf-deep-res {
      font-size: 0.77rem; line-height: 1.42; color: #fde68a;
      background: rgba(250, 204, 21, 0.1); border: 1px solid rgba(250, 204, 21, 0.35);
      border-radius: 8px; padding: 8px 10px;
    }
  `;
  document.head.appendChild(style);
}

function formatSfScore(res) {
  if (!res) return '';
  if (res.mateIn !== null) {
    return res.mateIn > 0 ? `Mate para Blancas en ${res.mateIn}` : `Mate para Negras en ${Math.abs(res.mateIn)}`;
  }
  const p = (res.scoreCp / 100).toFixed(2);
  return `${res.scoreCp >= 0 ? '+' : ''}${p}`;
}

function drawGoldArrow(svg, move, flipped) {
  if (!svg || !move) return;
  const ns = 'http://www.w3.org/2000/svg';
  const toC = (r, c) => ({
    x: (flipped ? 7 - c : c) * 100 + 50,
    y: (flipped ? 7 - r : r) * 100 + 50
  });
  const destCol = move.castle ? move.kingToCol : move.to.c;
  const p1 = toC(move.from.r, move.from.c);
  const p2 = toC(move.to.r, destCol);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < 10) return;

  const ux = dx / len, uy = dy / len;
  const line = document.createElementNS(ns, 'line');
  line.setAttribute('x1', p1.x + ux * 18);
  line.setAttribute('y1', p1.y + uy * 18);
  line.setAttribute('x2', p2.x - ux * 26);
  line.setAttribute('y2', p2.y - uy * 26);
  line.setAttribute('stroke', '#facc15');
  line.setAttribute('stroke-width', '13');
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('opacity', '0.9');
  svg.appendChild(line);

  const px = -uy * 15, py = ux * 15;
  const head = document.createElementNS(ns, 'polygon');
  head.setAttribute(
    'points',
    `${p2.x - ux * 5},${p2.y - uy * 5} ${p2.x - ux * 31 + px},${p2.y - uy * 31 + py} ${p2.x - ux * 31 - px},${p2.y - uy * 31 - py}`
  );
  head.setAttribute('fill', '#facc15');
  head.setAttribute('opacity', '0.92');
  svg.appendChild(head);
}

export function attachStockfishLevels(app) {
  ensureAiLevelStyles();
  const sf = new StockfishBridge();
  app.stockfish = sf;

  let preferredAiMode = 'ai-elo-1200';
  let moveToken = 0;

  // 1. Indicador de estado del motor Stockfish
  const statusCard = document.querySelector('.status-card');
  const sfBadge = document.createElement('span');
  sfBadge.className = 'sf-status-tag';
  if (statusCard) {
    const postSlot = document.getElementById('postgame-slot');
    if (postSlot && postSlot.parentNode === statusCard) statusCard.insertBefore(sfBadge, postSlot);
    else statusCard.appendChild(sfBadge);
  }

  sf.onStatus((st) => {
    sfBadge.className = `sf-status-tag ${st}`;
    if (st === 'ready') sfBadge.textContent = '⚙ Stockfish: Listo (Offline/Web)';
    else if (st === 'loading') sfBadge.textContent = '⚙ Stockfish: Cargando motor...';
    else if (st === 'offline') sfBadge.textContent = '⚙ Motor Local Activo (Sin red)';
    else sfBadge.textContent = '⚙ Stockfish disponible';
  });

  // 2. Poblar menú de modos con niveles ELO reales + Local + Online
  const sel = app.dom.modeSelect;
  if (sel) {
    sel.innerHTML = '';
    Object.entries(AI_LEVELS).forEach(([id, cfg]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = cfg.label;
      sel.appendChild(opt);
    });
    const pvpOpt = document.createElement('option');
    pvpOpt.value = 'pvp';
    pvpOpt.textContent = '👥 2 Jugadores Local';
    sel.appendChild(pvpOpt);

    const onlOpt = document.createElement('option');
    onlOpt.value = 'online';
    onlOpt.textContent = '🌐 Online (Sala Privada)';
    sel.appendChild(onlOpt);

    if (app.mode === 'ai-normal' || app.mode === 'ai-easy') {
      app.mode = preferredAiMode;
      sel.value = preferredAiMode;
    } else {
      sel.value = app.mode;
    }
  }

  // 3. Validar suscripción en niveles Maestro/GM y mapear lanzamientos desde Inicio
  const origSetMode = app._setModeProgrammatically.bind(app);
  app._setModeProgrammatically = (newMode) => {
    let target = (newMode === 'ai-normal' || newMode === 'ai-easy') ? preferredAiMode : newMode;
    const cfg = AI_LEVELS[target];
    if (cfg && cfg.proOnly && !app.store.hasAccess('pro_ai')) {
      app.dom.modeSelect.value = app.mode;
      app.shell.navigate('subscription');
      return;
    }
    if (cfg) preferredAiMode = target;
    origSetMode(target);
  };

  app._isAiTurn = () =>
    Boolean(AI_LEVELS[app.mode]) &&
    app.engine.turn === 'b' &&
    app.engine.status === 'playing';

  const origUpdateLabels = app._updatePlayerLabels.bind(app);
  app._updatePlayerLabels = () => {
    origUpdateLabels();
    const cfg = AI_LEVELS[app.mode];
    if (!cfg) return;
    const blackEl = !app.flipped ? app.dom.topName : app.dom.bottomName;
    if (blackEl) blackEl.textContent = `Negras (${cfg.short})`;
  };

  // 4. Cancelar cálculos previos al reiniciar o deshacer
  const origStart = app.startNewGame.bind(app);
  app.startNewGame = (posId) => {
    moveToken++;
    sf.stop();
    return origStart(posId);
  };

  const origUndo = app.handleUndo.bind(app);
  app.handleUndo = () => {
    moveToken++;
    sf.stop();
    return origUndo();
  };

  // 5. Reemplazar cálculo de IA con Stockfish + respaldo automático local
  app._scheduleAiMove = () => {
    const cfg = AI_LEVELS[app.mode];
    if (!cfg || app.engine.status !== 'playing') return;

    const token = ++moveToken;
    app.aiBusy = true;
    app.dom.statusText.textContent = `${cfg.short} calculando jugada...`;

    sf.evaluatePosition(app.engine, cfg).then((res) => {
      if (token !== moveToken || app.engine.status !== 'playing' || !app._isAiTurn()) {
        app.aiBusy = false;
        return;
      }
      const chosen = (res && res.move) || app.ai.getBestMove(app.engine, cfg.fallback);
      app.aiBusy = false;
      if (chosen) app._executeMove(chosen, { fromRemote: false });
    });
  };

  // 6. Botón de Veredicto Profundo Stockfish dentro de la Revisión Post-Partida
  const origRenderReview = app.analyzer._renderReviewPanel.bind(app.analyzer);
  app.analyzer._renderReviewPanel = () => {
    origRenderReview();
    const box = app.dom.postgameSlot?.querySelector('.an-box');
    const ply = app.analyzer.currentPly;
    if (!box || ply <= 0) return;

    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '6px';
    wrap.innerHTML = `<button class="sf-deep-btn" id="sf-deep-btn">🔬 Veredicto Stockfish (Prof. 13)</button>`;

    const exitBtn = box.querySelector('#an-exit');
    if (exitBtn) box.insertBefore(wrap, exitBtn);
    else box.appendChild(wrap);

    wrap.querySelector('#sf-deep-btn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const prevEngine = app.analyzer.frames[ply - 1]?.engine;
      if (!prevEngine) return;

      btn.disabled = true;
      btn.textContent = '⚙ Stockfish analizando posición...';

      const res = await sf.evaluatePosition(prevEngine, { skill: 20, depth: 13, movetime: 1300 });
      btn.disabled = false;
      btn.textContent = '🔬 Veredicto Stockfish (Prof. 13)';

      wrap.querySelector('.sf-deep-res')?.remove();
      const out = document.createElement('div');
      out.className = 'sf-deep-res';

      if (res && res.move) {
        const sim = prevEngine.clone();
        const rec = sim.makeMove(res.move);
        out.innerHTML = `<strong>Stockfish (Prof. ${res.depth}):</strong> mejor jugada <strong>${rec.san}</strong> · Eval: <strong>${formatSfScore(res)}</strong> (flecha dorada).`;
        drawGoldArrow(app.dom.tacticalSvg, res.move, app.flipped);
      } else {
        out.textContent = 'Stockfish no está disponible sin conexión en este momento.';
      }
      wrap.appendChild(out);
    });
  };

  // Precargar Stockfish en segundo plano sin bloquear el arranque
  sf.init();
  app._updatePlayerLabels();
}
