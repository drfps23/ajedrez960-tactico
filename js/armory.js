import { CombatFX } from './fx.js';
import { THEMES } from './themes.js';
import { TRAILS, COMBAT_PACKS, FINISHERS, upgradeFxInstance } from './finishers.js';

const ARMORY_KEY = 'ajedrez960_armory_loadout_v1';

const TIER_RANK = { free: 0, pro: 1, master: 2 };
const TIER_TAG = { free: 'GRATIS', pro: 'PRO', master: 'LEYENDA' };

function ensureArmoryStyles() {
  if (document.querySelector('style[data-armory-css]')) return;
  const style = document.createElement('style');
  style.dataset.armoryCss = 'true';
  style.textContent = `
    .arm-stage-wrap {
      display: grid; grid-template-columns: minmax(220px, 270px) 1fr; gap: 16px; align-items: center;
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 15px; padding: 16px;
    }
    .arm-preview-box {
      position: relative; width: 100%; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden;
      border: 2px solid var(--board-border);
      background-image: conic-gradient(var(--sq-dark) 90deg, var(--sq-light) 90deg 180deg, var(--sq-dark) 180deg 270deg, var(--sq-light) 270deg);
      background-size: 25% 25%;
    }
    .arm-sec-title { font-size: 1rem; font-weight: 800; margin-top: 4px; color: var(--text-main); }
    .arm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 11px; }
    .arm-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 13px;
      padding: 14px; display: flex; flex-direction: column; gap: 7px; cursor: pointer;
      transition: transform 0.14s ease, border-color 0.16s ease;
    }
    .arm-card:hover { transform: translateY(-2px); border-color: var(--accent-cyan); }
    .arm-card.equipped { border-color: #facc15; box-shadow: 0 0 18px rgba(250, 204, 21, 0.22); }
    .arm-card-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .arm-card p { font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; flex: 1; }
    @media (max-width: 720px) { .arm-stage-wrap { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);
}

export function attachArmory(app) {
  ensureArmoryStyles();

  let loadout = { trail: 'standard', pack: 'theme', finisher: 'royal_blast' };
  try {
    const saved = JSON.parse(localStorage.getItem(ARMORY_KEY) || '{}');
    loadout = { ...loadout, ...saved };
  } catch { /* ignorar */ }

  const saveLoadout = () => {
    try { localStorage.setItem(ARMORY_KEY, JSON.stringify(loadout)); } catch { /* ignorar */ }
  };

  const canUse = (itemTier) => {
    const userTier = app.store.data.tier || 'free';
    return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[itemTier] ?? 0);
  };

  const getEffectiveLoadout = () => ({
    trail: canUse((TRAILS.find(x => x.id === loadout.trail) || TRAILS[0]).tier) ? loadout.trail : 'standard',
    pack: canUse((COMBAT_PACKS.find(x => x.id === loadout.pack) || COMBAT_PACKS[0]).tier) ? loadout.pack : 'theme',
    finisher: canUse((FINISHERS.find(x => x.id === loadout.finisher) || FINISHERS[0]).tier) ? loadout.finisher : 'royal_blast'
  });

  const applyCombatPalette = () => {
    const eff = getEffectiveLoadout();
    const packObj = COMBAT_PACKS.find(p => p.id === eff.pack);
    const themeObj = THEMES[app.themes.currentId] || THEMES.neon;
    const pal = packObj?.palette || themeObj.fxPalette;
    app.fx.setPalette(pal);
  };

  // Enchufar estelas y remates al tablero principal
  upgradeFxInstance(app.fx, getEffectiveLoadout);
  applyCombatPalette();

  // Mantener el pack elegido aunque el usuario cambie de tema de tablero
  const origThemeApply = app.themes.apply.bind(app.themes);
  app.themes.apply = (id) => {
    origThemeApply(id);
    applyCombatPalette();
  };

  let previewFx = null;

  const renderArmoryView = () => {
    const root = app.shell.viewRoot;
    const eff = getEffectiveLoadout();

    const renderGroup = (title, kind, list, activeId) => `
      <div class="arm-sec-title">${title}</div>
      <div class="arm-grid">
        ${list.map((it) => {
          const unlocked = canUse(it.tier);
          const equipped = it.id === activeId;
          return `
            <div class="arm-card ${equipped ? 'equipped' : ''}" data-kind="${kind}" data-id="${it.id}" data-locked="${!unlocked}">
              <div class="arm-card-head">
                <span style="font-size:1.35rem">${it.icon}</span>
                <span class="mode-card-tag ${!unlocked ? 'soon' : ''}">
                  ${equipped ? '✓ EQUIPADO' : (!unlocked ? `🔒 ${TIER_TAG[it.tier]}` : TIER_TAG[it.tier])}
                </span>
              </div>
              <strong style="font-size:0.92rem">${it.name}</strong>
              <p>${it.desc}</p>
            </div>
          `;
        }).join('')}
      </div>
    `;

    root.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>⚔️ Armería FX · Modo Leyenda</h2>
          <p class="sec-sub">Personaliza tus estelas de movimiento, energía de combate y remate de Jaque Mate.</p>
        </div>
        <button class="btn btn-secondary" id="arm-home">← Inicio</button>
      </div>

      <div class="arm-stage-wrap">
        <div class="arm-preview-box" id="arm-preview-wrap">
          <canvas class="fx-canvas" id="arm-preview-canvas"></canvas>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <h3>Vista Previa en Vivo</h3>
          <p class="sec-sub">Toca cualquier efecto abajo para equiparlo y pruébalo al instante sobre el tablero de demostración.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" id="arm-test-finisher">👑 Probar Remate</button>
            <button class="btn btn-secondary" id="arm-test-trail">⚡ Probar Estela</button>
            <button class="btn btn-secondary" id="arm-test-attack">💥 Probar Ataque</button>
          </div>
        </div>
      </div>

      ${renderGroup('👑 Remates de Jaque Mate (Finishers)', 'finisher', FINISHERS, eff.finisher)}
      ${renderGroup('✨ Estelas de Movimiento', 'trail', TRAILS, eff.trail)}
      ${renderGroup('💥 Packs de Energía en Combate', 'pack', COMBAT_PACKS, eff.pack)}
    `;

    const pWrap = root.querySelector('#arm-preview-wrap');
    const pCanvas = root.querySelector('#arm-preview-canvas');
    previewFx = new CombatFX(pCanvas, pWrap);
    upgradeFxInstance(previewFx, getEffectiveLoadout);
    const packObj = COMBAT_PACKS.find(p => p.id === eff.pack);
    previewFx.setPalette(packObj?.palette || (THEMES[app.themes.currentId] || THEMES.neon).fxPalette);

    const runFinisherDemo = () => {
      previewFx.cancelActive();
      app.sound.playCheckmateDefeat();
      previewFx.playCheckmateSequence({
        kingHtml: app.pieceRenderer('K', 'b'),
        kingSq: { r: 3, c: 3 },
        winnerColor: 'w'
      });
    };

    const runTrailDemo = () => {
      previewFx.cancelActive();
      app.sound.playMove('N');
      previewFx.animateRegularMove({
        pieceHtml: app.pieceRenderer('Q', 'w'),
        pieceType: 'Q',
        from: { r: 6, c: 1 },
        to: { r: 2, c: 5 }
      });
    };

    const runAttackDemo = () => {
      previewFx.cancelActive();
      previewFx.playCombatSequence({
        pieceType: 'Q',
        attackerHtml: app.pieceRenderer('Q', 'w'),
        victimHtml: app.pieceRenderer('R', 'b'),
        from: { r: 6, c: 2 },
        to: { r: 2, c: 5 },
        onCharge: () => app.sound.playCharge('Q'),
        onImpact: () => app.sound.playAttack('Q')
      });
    };

    root.querySelector('#arm-home')?.addEventListener('click', () => app.shell.navigate('home'));
    root.querySelector('#arm-test-finisher')?.addEventListener('click', runFinisherDemo);
    root.querySelector('#arm-test-trail')?.addEventListener('click', runTrailDemo);
    root.querySelector('#arm-test-attack')?.addEventListener('click', runAttackDemo);

    root.querySelectorAll('.arm-card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.dataset.locked === 'true') {
          app.shell.navigate('subscription');
          return;
        }
        const kind = card.dataset.kind;
        loadout[kind] = card.dataset.id;
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

  // Registrar vista 'armory' en AppShell sin modificar appShell.js
  const origRenderView = app.shell.renderCurrentView.bind(app.shell);
  app.shell.renderCurrentView = () => {
    if (app.shell.currentView === 'armory') {
      renderArmoryView();
      return;
    }
    origRenderView();
  };

  // Añadir acceso directo en el Menú lateral
  const origDrawer = app.shell._renderDrawer.bind(app.shell);
  app.shell._renderDrawer = () => {
    origDrawer();
    const themesItem = app.shell.drawerPanel?.querySelector('[data-nav="themes"]');
    if (!themesItem || app.shell.drawerPanel.querySelector('[data-nav="armory"]')) return;
    const btn = document.createElement('button');
    btn.className = `drawer-item ${app.shell.currentView === 'armory' ? 'active' : ''}`;
    btn.dataset.nav = 'armory';
    btn.innerHTML = '<span>⚔️ Armería FX</span><span class="mode-card-tag soon">LEYENDA</span>';
    btn.addEventListener('click', () => {
      app.shell.closeDrawer();
      app.shell.navigate('armory');
    });
    themesItem.insertAdjacentElement('afterend', btn);
  };

  // Añadir botón rápido en la Pantalla de Inicio
  const origHome = app.shell._renderHome.bind(app.shell);
  app.shell._renderHome = () => {
    origHome();
    const strip = app.shell.viewRoot?.querySelector('.quick-strip');
    if (!strip || strip.querySelector('[data-nav="armory"]')) return;
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.dataset.nav = 'armory';
    btn.textContent = '⚔️ Armería FX (Leyenda)';
    btn.addEventListener('click', () => app.shell.navigate('armory'));
    strip.prepend(btn);
  };

  app.store.subscribe(() => applyCombatPalette());
}
