import { THEMES } from './themes.js';

const HAPTICS_KEY = 'ajedrez960_haptics_v1';

const ATTACK_VIBRATION = {
  P: [24, 18, 24],
  N: [55, 28, 36],
  B: [20, 14, 38],
  R: [65, 24, 42],
  Q: [44, 22, 68, 22, 38],
  K: [48, 28, 56]
};

function ensureMobileStyles() {
  if (document.querySelector('style[data-mobile-css]')) return;
  const style = document.createElement('style');
  style.dataset.mobileCss = 'true';
  style.textContent = `
    body {
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      -webkit-tap-highlight-color: transparent;
      overscroll-behavior-y: contain;
    }
    .pwa-install-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(2, 132, 199, 0.16));
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 14px;
      padding: 12px 16px;
    }
    .pwa-install-banner strong { font-size: 0.9rem; }
    .pwa-install-banner span { display: block; font-size: 0.78rem; color: var(--text-muted); }
  `;
  document.head.appendChild(style);
}

class HapticEngine {
  constructor() {
    this.enabled = this._load();
  }

  _load() {
    try {
      return localStorage.getItem(HAPTICS_KEY) !== 'off';
    } catch {
      return true;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(HAPTICS_KEY, this.enabled ? 'on' : 'off');
    } catch { /* ignorar */ }
    if (this.enabled) this.pulse('medium');
    return this.enabled;
  }

  pulse(pattern) {
    if (!this.enabled) return;

    // 1. Modo App Nativa (Capacitor Haptics en iOS y Android)
    const capHaptics = window.Capacitor?.Plugins?.Haptics;
    if (capHaptics) {
      try {
        if (pattern === 'heavy' || Array.isArray(pattern)) {
          capHaptics.impact({ style: 'HEAVY' });
        } else if (pattern === 'medium') {
          capHaptics.impact({ style: 'MEDIUM' });
        } else {
          capHaptics.impact({ style: 'LIGHT' });
        }
        return;
      } catch { /* continuar con respaldo web */ }
    }

    // 2. Respaldo Web / Android Chrome
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      const ms = pattern === 'light' ? 12 : pattern === 'medium' ? 28 : pattern === 'heavy' ? 60 : pattern;
      try { navigator.vibrate(ms); } catch { /* ignorar */ }
    }
  }
}

export function attachMobileAndStoreReady(app) {
  ensureMobileStyles();
  const haptics = new HapticEngine();
  app.haptics = haptics;

  // 1. Renombre seguro para revisión en App Store y Google Play (dominio público: Ajedrez de Lewis)
  if (THEMES.magic) {
    THEMES.magic.label = '🗿 Esculturas de Lewis';
    const opt = document.querySelector('#theme-select option[value="magic"]');
    if (opt) opt.textContent = THEMES.magic.label;
  }

  // 2. Sincronizar vibración háptica con movimientos, ataques y jaque mate
  if (app.sound) {
    const wrap = (method, fn) => {
      const orig = app.sound[method]?.bind(app.sound);
      if (!orig) return;
      app.sound[method] = (...args) => {
        fn(...args);
        return orig(...args);
      };
    };

    wrap('playMove', () => haptics.pulse('light'));
    wrap('playCastle', () => haptics.pulse([18, 42, 24]));
    wrap('playCheck', () => haptics.pulse([30, 38, 30]));
    wrap('playAttack', (pieceType) => haptics.pulse(ATTACK_VIBRATION[pieceType] || 'medium'));
    wrap('playCheckmateDefeat', () => haptics.pulse([40, 55, 40, 55, 110, 35, 150]));
  }

  // 3. Registrar Service Worker para modo instalable y juego offline
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // 4. Capturar botón nativo "Instalar App" en Android / escritorio
  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    if (app.shell.currentView === 'home') app.shell.renderCurrentView();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    app.store.addMessage({
      icon: '📱',
      title: 'App instalada en tu dispositivo',
      body: 'Ya puedes abrir Ajedrez Táctico desde tu pantalla principal incluso sin conexión.'
    });
    app.store.save();
  });

  // Inyectar banner de instalación en Inicio cuando el navegador lo ofrezca
  const origHome = app.shell._renderHome.bind(app.shell);
  app.shell._renderHome = () => {
    origHome();
    if (!deferredInstall) return;
    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <div>
        <strong>📱 Instalar Ajedrez Táctico en tu dispositivo</strong>
        <span>Acceso directo a pantalla completa y soporte sin internet.</span>
      </div>
      <button id="pwa-install-btn" class="btn btn-primary">Instalar Ahora</button>
    `;
    app.shell.viewRoot.prepend(banner);
    banner.querySelector('#pwa-install-btn')?.addEventListener('click', async () => {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      await deferredInstall.userChoice;
      deferredInstall = null;
      banner.remove();
    });
  };

  // 5. Añadir control de Vibración Háptica en el menú Ajustes
  const origSettings = app.shell._renderSettingsView.bind(app.shell);
  app.shell._renderSettingsView = () => {
    origSettings();
    const box = app.shell.viewRoot.querySelector('.settings-box');
    if (!box) return;
    const row = document.createElement('div');
    row.className = 'setting-row';
    row.innerHTML = `
      <div>
        <strong>Vibración háptica en combates</strong>
        <div class="sec-sub">Respuesta táctil en el teléfono al mover, capturar y dar jaque mate</div>
      </div>
      <button id="set-toggle-haptics" class="btn ${haptics.enabled ? 'btn-primary' : 'btn-secondary'}">
        ${haptics.enabled ? 'Activada' : 'Desactivada'}
      </button>
    `;
    box.prepend(row);
    row.querySelector('#set-toggle-haptics')?.addEventListener('click', () => {
      haptics.toggle();
      app.shell._renderSettingsView();
    });
  };

  // 6. Puente nativo listo para Capacitor + RevenueCat al compilar a tiendas
  window.NativeBridge = {
    isNative: () => Boolean(window.Capacitor?.isNativePlatform?.()),
    syncRevenueCatEntitlement: (entitlements) => {
      if (entitlements?.master) app.store.setTier('master');
      else if (entitlements?.pro) app.store.setTier('pro');
      else app.store.setTier('free');
    }
  };
}
