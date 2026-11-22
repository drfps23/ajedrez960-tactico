import { THEMES } from './themes.js';
import { SUBSCRIPTION_PLANS, ACHIEVEMENT_DEFS } from './store.js';

const AVATAR_OPTIONS = ['♛', '♚', '♞', '♜', '♝', '⚡', '🦁', '🛡️'];

function ensureShellStyles() {
  if (document.querySelector('style[data-shell-css]')) return;
  const style = document.createElement('style');
  style.dataset.shellCss = 'true';
  style.textContent = `
    /* Navegación global en Topbar */
    .shell-nav-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }
    .shell-menu-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-card);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      border-radius: 9px;
      padding: 7px 12px;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
    }
    .shell-menu-btn:hover { border-color: var(--accent-cyan); }
    .shell-unread-dot {
      position: absolute;
      top: -5px;
      right: -5px;
      min-width: 18px;
      height: 18px;
      border-radius: 999px;
      background: #f43f5e;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      display: grid;
      place-items: center;
      padding: 0 4px;
    }
    .shell-tier-pill {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      padding: 4px 9px;
      border-radius: 999px;
      cursor: pointer;
      border: 1px solid currentColor;
      background: rgba(15, 23, 42, 0.75);
    }

    /* Selector Clásico vs Fischer 960 */
    .variant-switch {
      display: inline-flex;
      background: rgba(9, 13, 22, 0.75);
      border: 1px solid var(--border-color);
      border-radius: 9px;
      padding: 2px;
      gap: 2px;
    }
    .variant-btn {
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.78rem;
      font-weight: 700;
      padding: 5px 10px;
      border-radius: 7px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .variant-btn.active {
      background: linear-gradient(135deg, #0284c7, #6366f1);
      color: #ffffff;
    }

    /* Ocultar controles de partida fuera de la vista Tablero */
    body.shell-mode .top-controls,
    body.shell-mode main.arena {
      display: none !important;
    }
    body.hide-coords .coord-rank,
    body.hide-coords .coord-file {
      display: none !important;
    }

    /* Contenedor de vistas App (Inicio, Perfil, Suscripción, etc.) */
    .shell-view-root {
      flex: 1;
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      padding: 22px 18px 42px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .shell-view-root.hidden { display: none; }

    /* Hero Pantalla de Inicio */
    .home-hero {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.14), rgba(168, 85, 247, 0.14) 55%, rgba(15, 23, 42, 0.85));
      border: 1px solid var(--border-color);
      border-radius: 18px;
      padding: 26px 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
    }
    .home-hero h2 {
      font-size: 1.55rem;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .home-hero p {
      color: var(--text-muted);
      font-size: 0.92rem;
      max-width: 560px;
      line-height: 1.5;
    }
    .home-stats-mini {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .home-stat-pill {
      background: rgba(9, 13, 22, 0.65);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 10px 14px;
      text-align: center;
      min-width: 100px;
    }
    .home-stat-pill strong {
      display: block;
      font-size: 1.15rem;
      color: var(--accent-cyan);
    }
    .home-stat-pill span {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    /* Tarjetas de modos principales */
    .home-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
      gap: 14px;
    }
    .mode-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 15px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      cursor: pointer;
      transition: transform 0.14s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      text-align: left;
      color: var(--text-main);
    }
    .mode-card:hover {
      transform: translateY(-3px);
      border-color: var(--accent-cyan);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
    }
    .mode-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mode-card-icon {
      width: 44px;
      height: 44px;
      border-radius: 11px;
      display: grid;
      place-items: center;
      font-size: 1.4rem;
      background: rgba(56, 189, 248, 0.14);
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .mode-card-tag {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(34, 197, 94, 0.16);
      color: #4ade80;
    }
    .mode-card-tag.soon {
      background: rgba(250, 204, 21, 0.16);
      color: #facc15;
    }
    .mode-card h3 { font-size: 1.04rem; font-weight: 700; }
    .mode-card p { font-size: 0.82rem; color: var(--text-muted); line-height: 1.45; flex: 1; }
    .mode-card-cta {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--accent-cyan);
    }

    /* Accesos rápidos inferiores en Inicio */
    .quick-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }
    .quick-btn {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 12px;
      color: var(--text-main);
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .quick-btn:hover { border-color: var(--accent-cyan); }

    /* Drawer Menú Lateral */
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.72);
      backdrop-filter: blur(3px);
      z-index: 80;
      display: flex;
      justify-content: flex-end;
    }
    .drawer-backdrop.hidden { display: none; }
    .drawer-panel {
      width: min(320px, 88vw);
      height: 100%;
      background: var(--bg-panel);
      border-left: 1px solid var(--border-color);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }
    .drawer-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
    }
    .drawer-user {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .drawer-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--accent-cyan), var(--accent-violet));
      display: grid;
      place-items: center;
      font-size: 1.25rem;
    }
    .drawer-nav {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .drawer-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-main);
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
    }
    .drawer-item:hover,
    .drawer-item.active {
      background: rgba(56, 189, 248, 0.14);
      border-color: rgba(56, 189, 248, 0.35);
    }
    .drawer-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 999px;
      background: #f43f5e;
      color: #fff;
    }

    /* Secciones internas */
    .sec-head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .sec-head h2 { font-size: 1.35rem; font-weight: 800; }
    .sec-sub { font-size: 0.86rem; color: var(--text-muted); }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
    }
    .plan-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 15px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .plan-card.current {
      border-color: var(--accent-cyan);
      box-shadow: 0 0 24px rgba(56, 189, 248, 0.2);
    }
    .plan-price { font-size: 1.7rem; font-weight: 800; }
    .plan-price span { font-size: 0.82rem; color: var(--text-muted); font-weight: 500; }
    .plan-list { list-style: none; display: flex; flex-direction: column; gap: 7px; font-size: 0.83rem; color: var(--text-muted); flex: 1; }
    .plan-list li::before { content: '✓ '; color: #4ade80; font-weight: 800; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 13px;
      padding: 16px;
    }
    .stat-card h3 { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px; }
    .stat-big { font-size: 1.65rem; font-weight: 800; color: var(--accent-cyan); }
    .stat-detail { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }

    .ach-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
    }
    .ach-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      gap: 12px;
      align-items: center;
      opacity: 0.52;
    }
    .ach-card.unlocked {
      opacity: 1;
      border-color: rgba(250, 204, 21, 0.45);
      background: linear-gradient(135deg, rgba(250, 204, 21, 0.08), var(--bg-card));
    }
    .ach-icon { font-size: 1.7rem; }

    .msg-list { display: flex; flex-direction: column; gap: 10px; }
    .msg-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .msg-card.unread { border-left: 4px solid var(--accent-cyan); }

    .theme-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 12px;
    }
    .theme-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 13px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }
    .theme-card.active { border-color: var(--accent-cyan); box-shadow: 0 0 16px rgba(56, 189, 248, 0.25); }
    .theme-preview-pieces { display: flex; gap: 6px; height: 48px; }
    .theme-preview-pieces svg { width: 42px; height: 42px; }

    .settings-box {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
    }
    .setting-row:last-child { border-bottom: none; padding-bottom: 0; }
    .avatar-picker { display: flex; gap: 6px; flex-wrap: wrap; }
    .avatar-opt {
      width: 38px;
      height: 38px;
      border-radius: 9px;
      border: 1px solid var(--border-color);
      background: rgba(9, 13, 22, 0.65);
      font-size: 1.15rem;
      cursor: pointer;
    }
    .avatar-opt.selected { border-color: var(--accent-cyan); background: rgba(56, 189, 248, 0.2); }

    .curriculum-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }
    .curr-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 13px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .curr-card h3 { font-size: 0.96rem; }
    .curr-card p { font-size: 0.8rem; color: var(--text-muted); line-height: 1.45; }
    .curr-pill {
      align-self: flex-start;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.14);
      color: var(--accent-cyan);
    }
  `;
  document.head.appendChild(style);
}

export class AppShell {
  constructor({ store, onLaunchGame, onVariantChange, onThemeSelect, getCurrentThemeId, getCurrentVariant, onSettingsChanged }) {
    ensureShellStyles();
    this.store = store;
    this.onLaunchGame = onLaunchGame;
    this.onVariantChange = onVariantChange;
    this.onThemeSelect = onThemeSelect;
    this.getCurrentThemeId = getCurrentThemeId;
    this.getCurrentVariant = getCurrentVariant;
    this.onSettingsChanged = onSettingsChanged;

    this.currentView = 'home';
    this._mountTopNav();
    this._mountVariantToggle();
    this._mountViewRoot();
    this._mountDrawer();

    this.store.subscribe(() => {
      this._updateTopNavBadges();
      if (this.currentView !== 'play') this.renderCurrentView();
    });

    this._applySettingsToDom();
    this.navigate('home');
  }

  _mountTopNav() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    // Hacer clic en el logo regresa al Inicio
    const brand = topbar.querySelector('.brand');
    if (brand) {
      brand.style.cursor = 'pointer';
      brand.title = 'Volver a la Pantalla de Inicio';
      brand.addEventListener('click', () => this.navigate('home'));
    }

    const nav = document.createElement('div');
    nav.className = 'shell-nav-bar';
    nav.innerHTML = `
      <button id="shell-home-btn" class="shell-menu-btn" title="Pantalla de Inicio">🏠 Inicio</button>
      <button id="shell-tier-pill" class="shell-tier-pill" title="Ver planes de suscripción"></button>
      <button id="shell-drawer-btn" class="shell-menu-btn" title="Abrir menú principal">
        ☰ Menú
        <span id="shell-unread-dot" class="shell-unread-dot" style="display:none">0</span>
      </button>
    `;
    topbar.appendChild(nav);

    this.homeBtn = nav.querySelector('#shell-home-btn');
    this.tierPill = nav.querySelector('#shell-tier-pill');
    this.unreadDot = nav.querySelector('#shell-unread-dot');

    this.homeBtn.addEventListener('click', () => {
      this.navigate(this.currentView === 'home' ? 'play' : 'home');
    });
    this.tierPill.addEventListener('click', () => this.navigate('subscription'));
    nav.querySelector('#shell-drawer-btn').addEventListener('click', () => this.openDrawer());

    this._updateTopNavBadges();
  }

  _mountVariantToggle() {
    const controls = document.querySelector('.top-controls');
    if (!controls) return;

    const wrap = document.createElement('div');
    wrap.className = 'variant-switch';
    wrap.id = 'variant-switch';
    wrap.innerHTML = `
      <button type="button" class="variant-btn" data-variant="classic">♟ Clásico</button>
      <button type="button" class="variant-btn" data-variant="fischer960">🎲 960</button>
    `;
    controls.prepend(wrap);

    this.variantSwitch = wrap;
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.variant-btn');
      if (!btn) return;
      const v = btn.dataset.variant;
      if (this.onVariantChange) this.onVariantChange(v);
      this.syncVariantUI(v);
    });
  }

  syncVariantUI(variant) {
    if (!this.variantSwitch) return;
    this.variantSwitch.querySelectorAll('.variant-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.variant === variant);
    });
  }

  _mountViewRoot() {
    const arena = document.querySelector('main.arena');
    this.viewRoot = document.createElement('section');
    this.viewRoot.className = 'shell-view-root hidden';
    this.viewRoot.id = 'shell-view-root';
    if (arena && arena.parentNode) {
      arena.parentNode.insertBefore(this.viewRoot, arena);
    } else {
      document.body.appendChild(this.viewRoot);
    }
  }

  _mountDrawer() {
    this.drawerBackdrop = document.createElement('div');
    this.drawerBackdrop.className = 'drawer-backdrop hidden';
    this.drawerBackdrop.innerHTML = `<aside class="drawer-panel" id="shell-drawer-panel"></aside>`;
    document.body.appendChild(this.drawerBackdrop);

    this.drawerPanel = this.drawerBackdrop.querySelector('#shell-drawer-panel');
    this.drawerBackdrop.addEventListener('click', (e) => {
      if (e.target === this.drawerBackdrop) this.closeDrawer();
    });
  }

  openDrawer() {
    this._renderDrawer();
    this.drawerBackdrop.classList.remove('hidden');
  }

  closeDrawer() {
    this.drawerBackdrop.classList.add('hidden');
  }

  _renderDrawer() {
    const { profile, tier } = this.store.data;
    const plan = SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.free;
    const unread = this.store.getUnreadCount();

    const items = [
      { id: 'home',         label: '🏠 Pantalla de Inicio' },
      { id: 'play',         label: '♟️ Tablero (Partida Actual)' },
      { id: 'puzzles',      label: '🧩 Problemas Tácticos' },
      { id: 'learn',        label: '🎓 Aprender y Aperturas' },
      { id: 'themes',       label: '🎨 Temas y Piezas' },
      { id: 'profile',      label: '👤 Perfil y Estadísticas' },
      { id: 'achievements', label: '🏆 Logros' },
      { id: 'messages',     label: '✉️ Mensajes', badge: unread > 0 ? unread : null },
      { id: 'subscription', label: '👑 Suscripción' },
      { id: 'settings',     label: '⚙️ Ajustes' }
    ];

    this.drawerPanel.innerHTML = `
      <div class="drawer-head">
        <div class="drawer-user">
          <div class="drawer-avatar">${profile.avatar}</div>
          <div>
            <div style="font-weight:700;font-size:0.92rem">${profile.name}</div>
            <div style="font-size:0.74rem;color:${plan.color};font-weight:700">${plan.badge} · ${profile.title}</div>
          </div>
        </div>
        <button id="drawer-close" class="btn btn-ghost" style="padding:5px 9px">✕</button>
      </div>
      <nav class="drawer-nav">
        ${items.map(it => `
          <button class="drawer-item ${this.currentView === it.id ? 'active' : ''}" data-nav="${it.id}">
            <span>${it.label}</span>
            ${it.badge ? `<span class="drawer-badge">${it.badge}</span>` : ''}
          </button>
        `).join('')}
      </nav>
    `;

    this.drawerPanel.querySelector('#drawer-close')?.addEventListener('click', () => this.closeDrawer());
    this.drawerPanel.querySelectorAll('.drawer-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeDrawer();
        this.navigate(btn.dataset.nav);
      });
    });
  }

  _updateTopNavBadges() {
    const plan = SUBSCRIPTION_PLANS[this.store.data.tier] || SUBSCRIPTION_PLANS.free;
    if (this.tierPill) {
      this.tierPill.textContent = `👑 ${plan.badge}`;
      this.tierPill.style.color = plan.color;
    }
    const unread = this.store.getUnreadCount();
    if (this.unreadDot) {
      this.unreadDot.style.display = unread > 0 ? 'grid' : 'none';
      this.unreadDot.textContent = String(unread);
    }
    if (this.homeBtn) {
      this.homeBtn.textContent = this.currentView === 'home' ? '♟ Tablero' : '🏠 Inicio';
    }
  }

  _applySettingsToDom() {
    const { showCoords } = this.store.data.settings;
    document.body.classList.toggle('hide-coords', !showCoords);
  }

  navigate(viewId) {
    this.currentView = viewId;
    const isPlay = viewId === 'play';

    document.body.classList.toggle('shell-mode', !isPlay);
    this.viewRoot.classList.toggle('hidden', isPlay);

    if (viewId === 'messages') {
      this.store.markAllMessagesRead();
    }

    this._updateTopNavBadges();
    if (!isPlay) {
      this.renderCurrentView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.dispatchEvent(new Event('resize'));
    }
  }

  renderCurrentView() {
    const views = {
      home: () => this._renderHome(),
      puzzles: () => this._renderPuzzlesHub(),
      learn: () => this._renderLearnHub(),
      themes: () => this._renderThemesView(),
      profile: () => this._renderProfileView(),
      achievements: () => this._renderAchievementsView(),
      messages: () => this._renderMessagesView(),
      subscription: () => this._renderSubscriptionView(),
      settings: () => this._renderSettingsView()
    };
    const fn = views[this.currentView] || views.home;
    fn();
  }

  _renderHome() {
    const { profile, stats, achievements } = this.store.data;
    const totalGames = stats.classic.played + stats.fischer960.played;

    this.viewRoot.innerHTML = `
      <div class="home-hero">
        <div>
          <h2>${profile.avatar} Hola, ${profile.name}</h2>
          <p>Elige entre <strong>Ajedrez Clásico</strong> o <strong>Fischer 960</strong>, juega online con reloj sincronizado y revisa cada jugada con animaciones de combate y entrenador por voz.</p>
        </div>
        <div class="home-stats-mini">
          <div class="home-stat-pill"><strong>${stats.classic.elo}</strong><span>ELO Clásico</span></div>
          <div class="home-stat-pill"><strong>${stats.fischer960.elo}</strong><span>ELO 960</span></div>
          <div class="home-stat-pill"><strong>${totalGames}</strong><span>Partidas</span></div>
          <div class="home-stat-pill"><strong>${achievements.length}/${ACHIEVEMENT_DEFS.length}</strong><span>Logros</span></div>
        </div>
      </div>

      <div class="home-grid">
        <button class="mode-card" data-launch="classic-ai">
          <div class="mode-card-top">
            <div class="mode-card-icon">♟️</div>
            <span class="mode-card-tag">ACTIVO</span>
          </div>
          <h3>Ajedrez Clásico</h3>
          <p>Formación tradicional oficial con tus animaciones de combate, 5 temas visuales y análisis hablado al terminar.</p>
          <span class="mode-card-cta">Jugar Clásico →</span>
        </button>

        <button class="mode-card" data-launch="fischer-ai">
          <div class="mode-card-top">
            <div class="mode-card-icon">🎲</div>
            <span class="mode-card-tag">ACTIVO</span>
          </div>
          <h3>Fischer 960 (Ajedrez Aleatorio)</h3>
          <p>960 posiciones iniciales oficiales (Scharnagl #0–#959) con enroque 960 auténtico para entrenar creatividad pura.</p>
          <span class="mode-card-cta">Jugar Fischer 960 →</span>
        </button>

        <button class="mode-card" data-launch="online">
          <div class="mode-card-top">
            <div class="mode-card-icon">🌐</div>
            <span class="mode-card-tag">EN VIVO</span>
          </div>
          <h3>Multijugador Online</h3>
          <p>Crea una sala privada en Clásico o 960, envía el enlace por WhatsApp y juega con reloj Fischer sincronizado.</p>
          <span class="mode-card-cta">Abrir Sala Privada →</span>
        </button>

        <button class="mode-card" data-nav="puzzles">
          <div class="mode-card-top">
            <div class="mode-card-icon">🧩</div>
            <span class="mode-card-tag soon">FASE 7</span>
          </div>
          <h3>Problemas Tácticos</h3>
          <p>Mates en 1, 2 y 3 jugadas, ataques dobles y sacrificios tanto en Ajedrez Clásico como en posiciones Fischer 960.</p>
          <span class="mode-card-cta">Ver Zona de Problemas →</span>
        </button>

        <button class="mode-card" data-nav="learn">
          <div class="mode-card-top">
            <div class="mode-card-icon">🎓</div>
            <span class="mode-card-tag soon">FASE 7</span>
          </div>
          <h3>Aprender y Aperturas</h3>
          <p>Guía para principiantes más laboratorio de Aperturas, Defensas y Gambitos explicados paso a paso con voz.</p>
          <span class="mode-card-cta">Explorar Academia →</span>
        </button>

        <button class="mode-card" data-launch="pvp">
          <div class="mode-card-top">
            <div class="mode-card-icon">👥</div>
            <span class="mode-card-tag">ACTIVO</span>
          </div>
          <h3>2 Jugadores Local</h3>
          <p>Comparte el dispositivo con un amigo y el reloj Fischer 5+3 activado automáticamente.</p>
          <span class="mode-card-cta">Jugar Frente a Frente →</span>
        </button>
      </div>

      <div class="quick-strip">
        <button class="quick-btn" data-nav="themes">🎨 Cambiar Tema y Fichas</button>
        <button class="quick-btn" data-nav="profile">📊 Perfil y Estadísticas</button>
        <button class="quick-btn" data-nav="achievements">🏆 Logros (${achievements.length})</button>
        <button class="quick-btn" data-nav="messages">✉️ Mensajes</button>
        <button class="quick-btn" data-nav="subscription">👑 Suscripción</button>
        <button class="quick-btn" data-nav="settings">⚙️ Ajustes</button>
      </div>
    `;

    this.viewRoot.querySelectorAll('[data-launch]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.launch;
        if (key === 'classic-ai') this.onLaunchGame({ variant: 'classic', mode: 'ai-normal' });
        else if (key === 'fischer-ai') this.onLaunchGame({ variant: 'fischer960', mode: 'ai-normal' });
        else if (key === 'online') this.onLaunchGame({ variant: this.getCurrentVariant(), mode: 'online' });
        else if (key === 'pvp') this.onLaunchGame({ variant: this.getCurrentVariant(), mode: 'pvp' });
        this.navigate('play');
      });
    });

    this.viewRoot.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.nav));
    });
  }

  _renderPuzzlesHub() {
    this.viewRoot.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>🧩 Problemas Tácticos (Clásico y Fischer 960)</h2>
          <p class="sec-sub">Módulo interactivo listo para activarse en la Fase 7 sobre este mismo tablero y con tus animaciones de ataque.</p>
        </div>
        <button class="btn btn-secondary" data-nav="home">← Volver al Inicio</button>
      </div>
      <div class="curriculum-grid">
        <div class="curr-card">
          <span class="curr-pill">CLÁSICO</span>
          <h3>Reto Diario · Mate en 2</h3>
          <p>Encuentra la secuencia forzada y detona la animación de Jaque Mate. (3 diarios gratis / ilimitados en Pro).</p>
        </div>
        <div class="curr-card">
          <span class="curr-pill">FISCHER 960</span>
          <h3>Táctica en Posiciones Asimétricas</h3>
          <p>Entrena clavadas, ataques dobles y enroques tácticos donde la teoría clásica no aplica.</p>
        </div>
        <div class="curr-card">
          <span class="curr-pill">MODO SUPERVIVENCIA</span>
          <h3>Racha Táctica contra Reloj</h3>
          <p>Resuelve problemas de dificultad creciente antes de cometer 3 fallos y sube tu puntuación táctica.</p>
        </div>
      </div>
    `;
    this.viewRoot.querySelector('[data-nav="home"]')?.addEventListener('click', () => this.navigate('home'));
  }

  _renderLearnHub() {
    this.viewRoot.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>🎓 Academia: Aprender, Aperturas, Defensas y Gambitos</h2>
          <p class="sec-sub">Estructura preparada para la Fase 7: cada lección se reproducirá en el tablero interactivo con explicación hablada.</p>
        </div>
        <button class="btn btn-secondary" data-nav="home">← Volver al Inicio</button>
      </div>
      <div class="curriculum-grid">
        <div class="curr-card">
          <span class="curr-pill">PRINCIPIANTES · GRATIS</span>
          <h3>Fundamentos del Ajedrez y Reglas 960</h3>
          <p>Cómo mueve cada pieza, valor relativo, jaque, ahogado y guía práctica del enroque clásico y enroque 960.</p>
        </div>
        <div class="curr-card">
          <span class="curr-pill">APERTURAS</span>
          <h3>Apertura Italiana, Española (Ruy López) y Londres</h3>
          <p>Planes típicos de desarrollo rápido, dominio del centro y ataques directos sobre el punto f7.</p>
        </div>
        <div class="curr-card">
          <span class="curr-pill">DEFENSAS</span>
          <h3>Defensa Siciliana, Francesa, Caro-Kann e India de Rey</h3>
          <p>Cómo responder con Negras contra 1.e4 y 1.d4, estructuras de peones y contragolpes clave.</p>
        </div>
        <div class="curr-card">
          <span class="curr-pill">GAMBITOS</span>
          <h3>Gambito de Dama, Gambito de Rey y Gambito Evans</h3>
          <p>Cuándo sacrificar un peón para abrir líneas y lanzar ataques fulminantes sobre el Rey enemigo.</p>
        </div>
      </div>
    `;
    this.viewRoot.querySelector('[data-nav="home"]')?.addEventListener('click', () => this.navigate('home'));
  }

  _renderThemesView() {
    const activeId = this.getCurrentThemeId();
    const isPro = this.store.hasAccess('pro_themes');
    const freeIds = new Set(['neon', 'wood']);

    this.viewRoot.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>🎨 Temas y Sets de Piezas</h2>
          <p class="sec-sub">El tema elegido cambia el tablero, las esculturas de piezas y la paleta de explosiones en combate.</p>
        </div>
        <button class="btn btn-primary" data-nav="play">Ir al Tablero →</button>
      </div>
      <div class="theme-cards-grid">
        ${Object.values(THEMES).map(t => {
          const locked = !freeIds.has(t.id) && !isPro;
          return `
            <div class="theme-card ${t.id === activeId ? 'active' : ''}" data-theme-pick="${t.id}" data-locked="${locked}">
              <div class="theme-preview-pieces">
                ${t.renderPiece('K', 'w')}
                ${t.renderPiece('Q', 'b')}
                ${t.renderPiece('N', 'w')}
              </div>
              <strong>${t.label}</strong>
              <span class="mode-card-tag ${locked ? 'soon' : ''}">
                ${t.id === activeId ? 'ACTIVO' : (locked ? '🔒 PLAN PRO' : 'DISPONIBLE')}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.viewRoot.querySelector('[data-nav="play"]')?.addEventListener('click', () => this.navigate('play'));
    this.viewRoot.querySelectorAll('[data-theme-pick]').forEach(card => {
      card.addEventListener('click', () => {
        if (card.dataset.locked === 'true') {
          this.navigate('subscription');
          return;
        }
        const id = card.dataset.themePick;
        this.onThemeSelect(id);
        this.renderCurrentView();
      });
    });
  }

  _renderProfileView() {
    const { profile, stats } = this.store.data;
    const totalW = stats.classic.wins + stats.fischer960.wins;
    const totalP = stats.classic.played + stats.fischer960.played;
    const winRate = totalP ? Math.round((totalW / totalP) * 100) : 0;

    this.viewRoot.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>👤 Perfil y Estadísticas</h2>
          <p class="sec-sub">Tus datos se guardan localmente en este dispositivo.</p>
        </div>
        <button class="btn btn-secondary" data-nav="home">← Inicio</button>
      </div>

      <div class="settings-box">
        <div class="setting-row">
          <div>
            <strong>Nombre de jugador</strong>
            <div class="sec-sub">Se muestra en tu perfil y menú principal</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <input id="prof-name-input" class="ctrl-select" type="text" maxlength="24" value="${profile.name}" />
            <button id="prof-save-btn" class="btn btn-primary">Guardar</button>
          </div>
        </div>
        <div class="setting-row">
          <div>
            <strong>Insignia / Avatar</strong>
            <div class="sec-sub">Elige tu emblema</div>
          </div>
          <div class="avatar-picker">
            ${AVATAR_OPTIONS.map(av => `<button class="avatar-opt ${av === profile.avatar ? 'selected' : ''}" data-av="${av}">${av}</button>`).join('')}
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>♟️ Ajedrez Clásico</h3>
          <div class="stat-big">${stats.classic.elo} ELO</div>
          <div class="stat-detail">${stats.classic.played} partidas · ${stats.classic.wins}G / ${stats.classic.draws}E / ${stats.classic.losses}P</div>
        </div>
        <div class="stat-card">
          <h3>🎲 Fischer 960</h3>
          <div class="stat-big">${stats.fischer960.elo} ELO</div>
          <div class="stat-detail">${stats.fischer960.played} partidas · ${stats.fischer960.wins}G / ${stats.fischer960.draws}E / ${stats.fischer960.losses}P</div>
        </div>
        <div class="stat-card">
          <h3>🔥 Rendimiento Global</h3>
          <div class="stat-big">${winRate}% Victorias</div>
          <div class="stat-detail">Mejor racha: ${stats.bestStreak} · Mates dados: ${stats.checkmates}</div>
        </div>
        <div class="stat-card">
          <h3>🎯 Mejor Precisión</h3>
          <div class="stat-big">${stats.bestAccuracy ? stats.bestAccuracy + '%' : '—'}</div>
          <div class="stat-detail">Registrada en tus análisis post-partida</div>
        </div>
      </div>
    `;

    this.viewRoot.querySelector('[data-nav="home"]')?.addEventListener('click', () => this.navigate('home'));
    this.viewRoot.querySelector('#prof-save-btn')?.addEventListener('click', () => {
      const val = this.viewRoot.querySelector('#prof-name-input')?.value || '';
      this.store.updateProfile({ name: val });
    });
    this.viewRoot.querySelectorAll('[data-av]').forEach(btn => {
      btn.addEventListener('click', () => this.store.updateProfile({ avatar: btn.dataset.av }));
    });
  }

  _renderAchievementsView() {
    const unlocked = new Set(this.store.data.achievements);
    this.viewRoot.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>🏆 Logros (${unlocked.size} / ${ACHIEVEMENT_DEFS.length})</h2>
          <p class="sec-sub">Desbloquea insignias jugando en Clásico, Fischer 960 y mejorando tu precisión.</p>
        </div>
        <button class="btn btn-secondary" data-nav="home">← Inicio</button>
      </div>
      <div class="ach-grid">
        ${ACHIEVEMENT_DEFS.map(a => {
          const ok = unlocked.has(a.id);
          return `
            <div class="ach-card ${ok ? 'unlocked' : ''}">
              <div class="ach-icon">${a.icon}</div>
              <div>
                <div style="font-weight:700;font-size:0.9rem">${a.title} ${ok ? '✓' : '🔒'}</div>
                <div class="sec-sub">${a.desc}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    this.viewRoot.querySelector('[data-nav="home"]')?.addEventListener('click', () => this.navigate('home'));
  }

  _renderMessagesView() {
    const msgs = this.store.data.messages;
    this.viewRoot.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>✉️ Mensajes y Notificaciones</h2>
          <p class="sec-sub">Avisos de logros, novedades de torneos y estado de tu cuenta.</p>
        </div>
        <button class="btn btn-secondary" data-nav="home">← Inicio</button>
      </div>
      <div class="msg-list">
        ${msgs.map(m => `
          <div class="msg-card ${m.read ? '' : 'unread'}">
            <div style="font-size:1.5rem">${m.icon || '📩'}</div>
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px">
                <strong>${m.title}</strong>
                <span class="sec-sub">${m.date}</span>
              </div>
              <p class="sec-sub" style="color:var(--text-main);opacity:0.86">${m.body}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    this.viewRoot.querySelector('[data-nav="home"]')?.addEventListener('click', () => this.navigate('home'));
  }

  _renderSubscriptionView() {
    const current = this.store.data.tier;
    this.viewRoot.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>👑 Planes de Suscripción</h2>
          <p class="sec-sub">Aplicación gratuita con mejoras opcionales. En esta versión web puedes alternar planes libremente para probar la experiencia antes de conectar Google Play y App Store.</p>
        </div>
        <button class="btn btn-secondary" data-nav="home">← Inicio</button>
      </div>
      <div class="plans-grid">
        ${Object.values(SUBSCRIPTION_PLANS).map(p => {
          const isCurrent = p.id === current;
          return `
            <div class="plan-card ${isCurrent ? 'current' : ''}">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <h3 style="color:${p.color}">${p.name}</h3>
                <span class="mode-card-tag" style="color:${p.color};background:rgba(255,255,255,0.06)">${p.badge}</span>
              </div>
              <div class="plan-price">${p.price} <span>${p.period}</span></div>
              <ul class="plan-list">
                ${p.perks.map(perk => `<li>${perk}</li>`).join('')}
              </ul>
              <button class="btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}" data-pick-tier="${p.id}" ${isCurrent ? 'disabled' : ''}>
                ${isCurrent ? '✓ Plan Activo (Simulador)' : `Probar Plan ${p.name}`}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
    this.viewRoot.querySelector('[data-nav="home"]')?.addEventListener('click', () => this.navigate('home'));
    this.viewRoot.querySelectorAll('[data-pick-tier]').forEach(btn => {
      btn.addEventListener('click', () => this.store.setTier(btn.dataset.pickTier));
    });
  }

  _renderSettingsView() {
    const { settings } = this.store.data;
    this.viewRoot.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>⚙️ Ajustes</h2>
          <p class="sec-sub">Configuración general del tablero y preferencias locales.</p>
        </div>
        <button class="btn btn-secondary" data-nav="home">← Inicio</button>
      </div>
      <div class="settings-box">
        <div class="setting-row">
          <div>
            <strong>Modalidad por defecto</strong>
            <div class="sec-sub">Variante que se abre al iniciar partida rápida</div>
          </div>
          <select id="set-default-variant" class="ctrl-select">
            <option value="classic" ${settings.defaultVariant === 'classic' ? 'selected' : ''}>♟ Ajedrez Clásico</option>
            <option value="fischer960" ${settings.defaultVariant === 'fischer960' ? 'selected' : ''}>🎲 Fischer 960</option>
          </select>
        </div>
        <div class="setting-row">
          <div>
            <strong>Mostrar coordenadas (a–h, 1–8)</strong>
            <div class="sec-sub">Útil para aprender notación algebraica</div>
          </div>
          <button id="set-toggle-coords" class="btn ${settings.showCoords ? 'btn-primary' : 'btn-secondary'}">
            ${settings.showCoords ? 'Activadas' : 'Ocultas'}
          </button>
        </div>
        <div class="setting-row">
          <div>
            <strong>Reiniciar estadísticas y logros locales</strong>
            <div class="sec-sub">Devuelve tu ELO local a 1200 y limpia el progreso de pruebas</div>
          </div>
          <button id="set-reset-stats" class="btn btn-ghost" style="border-color:#f43f5e;color:#fb7185">Reiniciar Datos</button>
        </div>
      </div>
    `;

    this.viewRoot.querySelector('[data-nav="home"]')?.addEventListener('click', () => this.navigate('home'));
    this.viewRoot.querySelector('#set-default-variant')?.addEventListener('change', (e) => {
      this.store.updateSettings({ defaultVariant: e.target.value });
      if (this.onSettingsChanged) this.onSettingsChanged();
    });
    this.viewRoot.querySelector('#set-toggle-coords')?.addEventListener('click', () => {
      this.store.updateSettings({ showCoords: !this.store.data.settings.showCoords });
      this._applySettingsToDom();
      this.renderCurrentView();
    });
    this.viewRoot.querySelector('#set-reset-stats')?.addEventListener('click', () => {
      this.store.resetStats();
      this.renderCurrentView();
    });
  }
}
