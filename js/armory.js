import { CombatFX } from './fx.js';
import { THEMES } from './themes.js';
import { PIECE_LIST, TRAILS, ATTACK_STYLES, FINISHERS, upgradeFxInstance } from './finishers.js';

const ARMORY_KEY = 'ajedrez960_armory_v2';
const TIER_RANK = { free: 0, pro: 1, master: 2 };
const TIER_TAG = { free: 'GRATIS', pro: 'PRO', master: 'LEYENDA' };

function ensureArmoryStyles() {
  if (document.querySelector('style[data-armory-css]')) return;
  const style = document.createElement('style');
  style.dataset.armoryCss = 'true';
  style.textContent = `
    .arm-piece-tabs {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); gap: 8px;
    }
    .arm-piece-tab {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      padding: 10px 8px; color: var(--text-main); cursor: pointer;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      transition: border-color 0.15s, transform 0.12s;
    }
    .arm-piece-tab:hover { border-color: var(--accent-cyan); transform: translateY(-2px); }
    .arm-piece-tab.active {
      border-color: #facc15; background: rgba(250, 204, 21, 0.12);
      box-shadow: 0 0 16px rgba(250, 204, 21, 0.22);
    }
    .arm-piece-tab svg { width: 34px; height: 34px; }
    .arm-piece-mini { font-size: 0.68rem; color: var(--text-muted); }

    .arm-stage-wrap {
      display: grid; grid-template-columns: minmax(220px, 265px) 1fr; gap: 16px; align-items: center;
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 15px; padding: 16px;
    }
    .arm-preview-box {
      position: relative; width: 100%; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden;
      border: 2px solid var(--board-border);
      background-image: conic-gradient(var(--sq-dark) 90deg, var(--sq-light) 90deg 180deg, var(--sq-dark) 180deg 270deg, var(--sq-light) 270deg);
      background-size: 25% 25%;
    }
    .arm-sec-title { font-size: 0.98rem; font-weight: 800; margin-top: 4px; color: var(--text-main); }
    .arm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(195px, 1fr)); gap: 10px; }
    .arm-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 13px;
      padding: 13px; display: flex; flex-direction: column; gap: 6px; cursor: pointer;
      transition: transform 0.14s ease, border-color 0.16s ease;
    }
    .arm-card:hover { transform: translateY(-2px); border-color: var(--accent-cyan); }
    .arm-card.equipped { border-color: #facc15; box-shadow: 0 0 16px rgba(250, 204, 21, 0.22); }
    .arm-card-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .arm-card p { font-size: 0.77rem; color: var(--text-muted); line-height: 1.4; flex: 1; }
    @media (max-width: 720px) { .arm-stage-wrap { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);
}

function defaultLoadout() {
  return {
    finisher: 'royal_blast',
    pieceTrails:  { P: 'standard', N: 'standard', B: 'standard', R: 'standard', Q: 'standard', K: 'standard' },
    pieceAttacks: { P: 'theme',    N: 'theme',    B: 'theme',    R: 'theme',    Q: 'theme',    K: 'theme' }
  };
}

export function attachArmory(app) {
  ensureArmoryStyles();

  let selectedPiece = 'Q';
  let loadout = defaultLoadout();
  try {
    const saved = JSON.parse(localStorage.getItem(ARMORY_KEY) || '{}');
    loadout = {
      finisher: saved.finisher || 'royal_blast',
      pieceTrails: { ...loadout.pieceTrails, ...(saved.pieceTrails || {}) },
      pieceAttacks: { ...loadout.pieceAttacks, ...(saved.pieceAttacks || {}) }
    };
  } catch { /* ignorar */ }

  const saveLoadout = () => {
    try { localStorage.setItem(ARMORY_KEY, JSON.stringify(loadout)); } catch { /* ignorar */ }
  };

  const canUse = (itemTier) => {
    const userTier = app.store.data.tier || 'free';
    return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[itemTier] ?? 0);
  };

  const getEffectiveLoadout = () => {
    const eff = defaultLoadout();
    const finObj = FINISHERS.find(f => f.id === loadout.finisher) || FINISHERS[0];
    eff.finisher = canUse(finObj.tier) ? finObj.id : 'royal_blast';

    PIECE_LIST.forEach(({ id }) => {
      const tObj = TRAILS.find(t => t.id === loadout.pieceTrails[id]) || TRAILS[0];
      const aObj = ATTACK_STYLES.find(a => a.id === loadout.pieceAttacks[id]) || ATTACK_STYLES[0];
      eff.pieceTrails[id] = canUse(tObj.tier) ? tObj.id : 'standard';
      eff.pieceAttacks[id] = canUse(aObj.tier) ? aObj.id : 'theme';
    });
    return eff;
  };

  const buildPiecePalette = () => {
    const eff = getEffectiveLoadout();
    const base = (THEMES[app.themes.currentId] || THEMES.neon).fxPalette;
    const merged = { ...base };
    PIECE_LIST.forEach(({ id }) => {
      const aObj = ATTACK_STYLES.find(a => a.id === eff.pieceAttacks[id]);
      if (aObj && aObj.color) merged[id] = aObj.color;
    });
    return merged;
  };

  const applyCombatPalette = () => app.fx.setPalette(buildPiecePalette());

  upgradeFxInstance(app.fx, getEffectiveLoadout);
  applyCombatPalette();

  const origThemeApply = app.themes.apply.bind(app.themes);
  app.themes.apply = (id) => {
    origThemeApply(id);
    applyCombatPalette();
  };

  let previewFx = null;

  const renderArmoryView = () => {
    const root = app.shell.viewRoot;
    const eff = getEffectiveLoadout();
    const pieceInfo = PIECE_LIST.find(p => p.id === selectedPiece) || PIECE_LIST[4];

    const renderGroup = (title, kind, list, activeId) => `
      <div class="arm-sec-title">${title}</div>
      <div class="arm-grid">
        ${list.map((it) => {
          const unlocked = canUse(it.tier);
          const equipped = it.id === activeId;
          return `
            <div class="arm-card ${equipped ? 'equipped' : ''}" data-kind="${kind}" data-id="${it.id}" data-locked="${!unlocked}">
              <div class="arm-card-head">
                <span style="font-size:1.3rem">${it.icon}</span>
                <span class="mode-card-tag ${!unlocked ? 'soon' : ''}">
                  ${equipped ? '✓ EQUIPADO' : (!unlocked ? `🔒 ${TIER_TAG[it.tier]}` : TIER_TAG[it.tier])}
                </span>
              </div>
              <strong style="font-size:0.9rem">${it.name}</strong>
              <p>${it.desc}</p>
            </div>
          `;
        }).join('')}
      </div>
    `;

    root.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>⚔️ Armería FX por Pieza · Modo Leyenda</h2>
          <p class="sec-sub">Selecciona cada pieza y asigna su propia estela y energía de ataque independiente.</p>
        </div>
        <button class="btn btn-secondary" id="arm-home">← Inicio</button>
      </div>

      <div class="arm-piece-tabs">
        ${PIECE_LIST.map((p) => {
          const tObj = TRAILS.find(t => t.id === eff.pieceTrails[p.id]) || TRAILS[0];
          const aObj = ATTACK_STYLES.find(a => a.id === eff.pieceAttacks[p.id]) || ATTACK_STYLES[0];
          return `
            <button type="button" class="arm-piece-tab ${p.id === selectedPiece ? 'active' : ''}" data-piece="${p.id}">
              ${app.pieceRenderer(p.id, 'w')}
              <strong style="font-size:0.82rem">${p.name}</strong>
              <span class="arm-piece-mini">${tObj.icon} ${aObj.icon}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="arm-stage-wrap">
        <div class="arm-preview-box" id="arm-preview-wrap">
          <canvas class="fx-canvas" id="arm-preview-canvas"></canvas>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <h3>Configurando: ${pieceInfo.icon} ${pieceInfo.name}</h3>
          <p class="sec-sub">Los cambios que elijas abajo se aplican solo a tu <strong>${pieceInfo.name}</strong>. Pruébalo en vivo o cambia de pieza arriba.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" id="arm-test-attack">💥 Probar Ataque (${pieceInfo.name})</button>
            <button class="btn btn-secondary" id="arm-test-trail">✨ Probar Estela (${pieceInfo.name})</button>
            <button class="btn btn-secondary" id="arm-test-finisher">👑 Probar Remate Mate</button>
          </div>
        </div>
      </div>

      ${renderGroup(`✨ Estela de Movimiento para ${pieceInfo.name}`, 'trail', TRAILS, eff.pieceTrails[selectedPiece])}
      ${renderGroup(`💥 Energía de Ataque para ${pieceInfo.name}`, 'attack', ATTACK_STYLES, eff.pieceAttacks[selectedPiece])}
      ${renderGroup('👑 Remate de Jaque Mate (Global)', 'finisher', FINISHERS, eff.finisher)}
    `;

    const pWrap = root.querySelector('#arm-preview-wrap');
    const pCanvas = root.querySelector('#arm-preview-canvas');
    previewFx = new CombatFX(pCanvas, pWrap);
    upgradeFxInstance(previewFx, getEffectiveLoadout);
    previewFx.setPalette(buildPiecePalette());

    const runTrailDemo = () => {
      previewFx.cancelActive();
      app.sound.playMove(selectedPiece);
      const dest = selectedPiece === 'N' ? { r: 3, c: 3 } : selectedPiece === 'P' ? { r: 4, c: 3 } : { r: 2, c: 5 };
      const orig = selectedPiece === 'N' ? { r: 5, c: 2 } : selectedPiece === 'P' ? { r: 6, c: 3 } : { r: 6, c: 1 };
      previewFx.animateRegularMove({
        pieceHtml: app.pieceRenderer(selectedPiece, 'w'),
        pieceType: selectedPiece,
        from: orig,
        to: dest
      });
    };

    const runAttackDemo = () => {
      previewFx.cancelActive();
      const samples = {
        P: { from: { r: 5, c: 3 }, to: { r: 4, c: 4 }, victim: 'P' },
        N: { from: { r: 5, c: 2 }, to: { r: 3, c: 3 }, victim: 'B' },
        B: { from: { r: 6, c: 1 }, to: { r: 2, c: 5 }, victim: 'N' },
        R: { from: { r: 6, c: 3 }, to: { r: 2, c: 3 }, victim: 'R' },
        Q: { from: { r: 6, c: 4 }, to: { r: 2, c: 4 }, victim: 'Q' },
        K: { from: { r: 4, c: 3 }, to: { r: 3, c: 4 }, victim: 'R' }
      };
      const s = samples[selectedPiece] || samples.Q;
      previewFx.playCombatSequence({
        pieceType: selectedPiece,
        attackerHtml: app.pieceRenderer(selectedPiece, 'w'),
        victimHtml: app.pieceRenderer(s.victim, 'b'),
        from: s.from,
        to: s.to,
        onCharge: () => app.sound.playCharge(selectedPiece),
        onImpact: () => app.sound.playAttack(selectedPiece)
      });
    };

    const runFinisherDemo = () => {
      previewFx.cancelActive();
      app.sound.playCheckmateDefeat();
      previewFx.playCheckmateSequence({
        kingHtml: app.pieceRenderer('K', 'b'),
        kingSq: { r: 3, c: 3 },
        winnerColor: 'w'
      });
    };

    root.querySelector('#arm-home')?.addEventListener('click', () => app.shell.navigate('home'));
    root.querySelector('#arm-test-attack')?.addEventListener('click', runAttackDemo);
    root.querySelector('#arm-test-trail')?.addEventListener('click', runTrailDemo);
    root.querySelector('#arm-test-finisher')?.addEventListener('click', runFinisherDemo);

    root.querySelectorAll('[data-piece]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedPiece = btn.dataset.piece;
        renderArmoryView();
      });
    });

    root.querySelectorAll('.arm-card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.dataset.locked === 'true') {
          app.shell.navigate('subscription');
          return;
        }
        const kind = card.dataset.kind;
        if (kind === 'trail') loadout.pieceTrails[selectedPiece] = card.dataset.id;
        else if (kind === 'attack') loadout.pieceAttacks[selectedPiece] = card.dataset.id;
        else loadout.finisher = card.dataset.id;

        saveLoadout();
        applyCombatPalette();
        renderArmoryView();
        setTimeout(() => {
          if (kind === 'finisher') runFinisherDemo();
          else if (kind === 'trail') runTrailDemo();
          else runAttackDemo();
        }, 60);
      });
    });
  };

  const origRenderView = app.shell.renderCurrentView.bind(app.shell);
  app.shell.renderCurrentView = () => {
    if (app.shell.currentView === 'armory') { renderArmoryView(); return; }
    origRenderView();
  };

  const origDrawer = app.shell._renderDrawer.bind(app.shell);
  app.shell._renderDrawer = () => {
    origDrawer();
    const themesItem = app.shell.drawerPanel?.querySelector('[data-nav="themes"]');
    if (!themesItem || app.shell.drawerPanel.querySelector('[data-nav="armory"]')) return;
    const btn = document.createElement('button');
    btn.className = `drawer-item ${app.shell.currentView === 'armory' ? 'active' : ''}`;
    btn.dataset.nav = 'armory';
    btn.innerHTML = '<span>⚔️ Armería FX</span><span class="mode-card-tag soon">POR PIEZA</span>';
    btn.addEventListener('click', () => { app.shell.closeDrawer(); app.shell.navigate('armory'); });
    themesItem.insertAdjacentElement('afterend', btn);
  };

  const origHome = app.shell._renderHome.bind(app.shell);
  app.shell._renderHome = () => {
    origHome();
    const strip = app.shell.viewRoot?.querySelector('.quick-strip');
    if (!strip || strip.querySelector('[data-nav="armory"]')) return;
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.dataset.nav = 'armory';
    btn.textContent = '⚔️ Armería FX por Pieza';
    btn.addEventListener('click', () => app.shell.navigate('armory'));
    strip.prepend(btn);
  };

  app.store.subscribe(() => applyCombatPalette());
}
