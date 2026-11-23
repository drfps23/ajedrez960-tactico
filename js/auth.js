import { APP_BRAND } from './intro.js';

const AUTH_KEY = 'ajedrez960_auth_session_v1';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function randomTag() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function ensureAuthStyles() {
  if (document.querySelector('style[data-auth-css]')) return;
  const style = document.createElement('style');
  style.dataset.authCss = 'true';
  style.textContent = `
    .auth-backdrop {
      position: fixed; inset: 0; z-index: 150;
      background: rgba(2, 6, 23, 0.84); backdrop-filter: blur(6px);
      display: grid; place-items: center; padding: 16px;
    }
    .auth-card {
      width: min(420px, 100%); max-height: 92vh; overflow-y: auto;
      background: linear-gradient(180deg, #131b2e 0%, #0b101d 100%);
      border: 1px solid rgba(56, 189, 248, 0.32); border-radius: 18px;
      padding: 24px 20px; display: flex; flex-direction: column; gap: 14px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.72);
    }
    .auth-head { text-align: center; }
    .auth-logo { font-size: 2.3rem; line-height: 1; margin-bottom: 6px; }
    .auth-head h2 { font-size: 1.2rem; font-weight: 800; color: #f8fafc; }
    .auth-head p { font-size: 0.82rem; color: var(--text-muted); margin-top: 4px; }
    .auth-providers { display: flex; flex-direction: column; gap: 8px; }
    .auth-btn {
      width: 100%; padding: 11px 14px; border-radius: 10px;
      font-size: 0.88rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 9px;
      border: 1px solid var(--border-color); transition: filter 0.15s, transform 0.1s;
    }
    .auth-btn:hover { filter: brightness(1.08); }
    .auth-btn:active { transform: scale(0.98); }
    .auth-btn-google { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
    .auth-btn-apple { background: #000000; color: #ffffff; border-color: #334155; }
    .auth-btn-email { background: linear-gradient(135deg, #0284c7, #6366f1); color: #fff; border: none; }
    .auth-btn-guest { background: rgba(15, 23, 42, 0.7); color: var(--text-main); }
    .auth-sep {
      display: flex; align-items: center; gap: 10px;
      font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;
    }
    .auth-sep::before, .auth-sep::after {
      content: ''; flex: 1; height: 1px; background: var(--border-color);
    }
    .auth-form { display: flex; flex-direction: column; gap: 9px; }
    .auth-input {
      width: 100%; padding: 10px 12px; border-radius: 9px;
      background: rgba(9, 13, 22, 0.8); color: #f8fafc;
      border: 1px solid var(--border-color); font-size: 0.94rem;
    }
    .auth-input:focus { outline: none; border-color: var(--accent-cyan); }
    .auth-err { font-size: 0.78rem; color: #fb7185; min-height: 16px; text-align: center; }
    .auth-note { font-size: 0.72rem; color: var(--text-muted); text-align: center; line-height: 1.4; }
    .auth-account-card {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(15, 23, 42, 0.75));
      border: 1px solid rgba(56, 189, 248, 0.32); border-radius: 14px;
      padding: 16px; display: flex; flex-wrap: wrap; justify-content: space-between;
      align-items: center; gap: 12px;
    }
    .auth-pill {
      display: inline-block; font-size: 0.7rem; font-weight: 800; padding: 2px 8px;
      border-radius: 999px; background: rgba(34, 197, 94, 0.16); color: #4ade80;
    }
    .auth-pill.guest { background: rgba(250, 204, 21, 0.16); color: #facc15; }
  `;
  document.head.appendChild(style);
}

const PROVIDER_LABELS = {
  guest: 'Invitado (Local)',
  email: 'Cuenta Correo',
  google: 'Google',
  apple: 'Apple ID'
};

export class AuthManager {
  constructor(app) {
    ensureAuthStyles();
    this.app = app;
    this.session = this._load();
    this._modalEl = null;

    if (this.session) {
      this._syncProfile();
    }
    this._hookProfileView();
    this._exposeBridge();
  }

  _load() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  _save() {
    try {
      if (this.session) localStorage.setItem(AUTH_KEY, JSON.stringify(this.session));
      else localStorage.removeItem(AUTH_KEY);
    } catch { /* ignorar */ }
  }

  _syncProfile() {
    if (!this.session) return;
    this.app.store.updateProfile({ name: this.session.handle });
  }

  _setSession({ provider, handle, email = '' }) {
    const cleanHandle = (handle || 'Jugador').trim().slice(0, 20) || 'Jugador';
    this.session = {
      uid: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      tag: randomTag(),
      provider,
      handle: cleanHandle,
      email: email.trim().slice(0, 60),
      createdAt: new Date().toISOString()
    };
    this._save();
    this._syncProfile();

    this.app.store.addMessage({
      icon: provider === 'guest' ? '♟️' : '✅',
      title: provider === 'guest'
        ? `Sesión de invitado: ${cleanHandle}`
        : `Cuenta conectada (${PROVIDER_LABELS[provider]})`,
      body: provider === 'guest'
        ? 'Puedes jugar offline o vincular tu cuenta cuando quieras desde Perfil para guardar tu ELO en la nube.'
        : `Bienvenido, ${cleanHandle}#${this.session.tag}. Tu perfil está listo para partidas online.`
    });
    this.app.store.save();
    this.closeModal();
  }

  signOut() {
    this.session = null;
    this._save();
    this.openModal({ allowDismiss: false });
  }

  ensureSession({ skipIfInvite = true } = {}) {
    if (this.session) return;
    if (skipIfInvite && this.app.mp?.getPendingRoomFromUrl?.()) {
      this._setSession({ provider: 'guest', handle: `Invitado${randomTag().slice(0, 2)}` });
      return;
    }
    this.openModal({ allowDismiss: false });
  }

  closeModal() {
    if (this._modalEl) {
      this._modalEl.remove();
      this._modalEl = null;
    }
  }

  openModal({ allowDismiss = true } = {}) {
    this.closeModal();
    const wrap = document.createElement('div');
    wrap.className = 'auth-backdrop';

    const currentName = this.app.store.data.profile.name;
    const prefill = currentName && currentName !== 'Jugador' ? currentName : '';

    wrap.innerHTML = `
      <div class="auth-card">
        <div class="auth-head">
          <div class="auth-logo">♛</div>
          <h2>${esc(APP_BRAND.name)}</h2>
          <p>Inicia sesión para guardar tu ELO online y logros, o entra directo como invitado.</p>
        </div>

        <form class="auth-form" id="auth-email-form">
          <input id="auth-handle" class="auth-input" type="text" maxlength="20" placeholder="Tu nombre de jugador (ej. GranTactico)" value="${esc(prefill)}" required />
          <input id="auth-email" class="auth-input" type="email" maxlength="60" placeholder="Correo electrónico (opcional para cuenta rápida)" />
          <div class="auth-err" id="auth-err"></div>
          <button type="submit" class="auth-btn auth-btn-email">✉️ Entrar / Crear Cuenta</button>
        </form>

        <div class="auth-sep">o acceso rápido</div>

        <div class="auth-providers">
          <button type="button" class="auth-btn auth-btn-google" id="auth-google">🔵 Continuar con Google</button>
          <button type="button" class="auth-btn auth-btn-apple" id="auth-apple"> Continuar con Apple</button>
          <button type="button" class="auth-btn auth-btn-guest" id="auth-guest">♟️ Jugar como Invitado</button>
          ${allowDismiss ? '<button type="button" class="btn btn-ghost" id="auth-cancel">Cancelar</button>' : ''}
        </div>

        <p class="auth-note">En esta versión web tu cuenta se guarda localmente. Al publicar en tiendas se vinculará automáticamente con Google Sign-In y Sign in with Apple.</p>
      </div>
    `;

    document.body.appendChild(wrap);
    this._modalEl = wrap;

    const handleInput = wrap.querySelector('#auth-handle');
    const emailInput = wrap.querySelector('#auth-email');
    const errEl = wrap.querySelector('#auth-err');

    wrap.querySelector('#auth-email-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const handle = handleInput.value.trim();
      if (handle.length < 2) {
        errEl.textContent = 'Escribe un nombre de al menos 2 caracteres.';
        return;
      }
      this._setSession({ provider: 'email', handle, email: emailInput.value });
    });

    wrap.querySelector('#auth-google').addEventListener('click', () => {
      const handle = handleInput.value.trim() || `Jugador${randomTag().slice(0, 3)}`;
      this._setSession({ provider: 'google', handle, email: emailInput.value || 'google-account@local' });
    });

    wrap.querySelector('#auth-apple').addEventListener('click', () => {
      const handle = handleInput.value.trim() || `Jugador${randomTag().slice(0, 3)}`;
      this._setSession({ provider: 'apple', handle, email: emailInput.value || 'apple-id@local' });
    });

    wrap.querySelector('#auth-guest').addEventListener('click', () => {
      const handle = handleInput.value.trim() || `Invitado${randomTag().slice(0, 3)}`;
      this._setSession({ provider: 'guest', handle });
    });

    wrap.querySelector('#auth-cancel')?.addEventListener('click', () => this.closeModal());
  }

  _hookProfileView() {
    const orig = this.app.shell._renderProfileView.bind(this.app.shell);
    this.app.shell._renderProfileView = () => {
      orig();
      const root = this.app.shell.viewRoot;
      const head = root.querySelector('.sec-head');
      if (!head) return;

      const s = this.session;
      const isGuest = !s || s.provider === 'guest';
      const card = document.createElement('div');
      card.className = 'auth-account-card';
      card.innerHTML = `
        <div>
          <span class="auth-pill ${isGuest ? 'guest' : ''}">${s ? PROVIDER_LABELS[s.provider] : 'Sin sesión'}</span>
          <div style="font-weight:800;font-size:1rem;margin-top:4px">
            ${s ? `${esc(s.handle)} <span style="color:var(--text-muted);font-weight:600">#${s.tag}</span>` : 'Sin cuenta activa'}
          </div>
          <div class="sec-sub">${s?.email ? esc(s.email) : 'Vincula tu cuenta para conservar tu ELO online entre dispositivos.'}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${isGuest ? '<button id="auth-link-btn" class="btn btn-primary">🔗 Vincular Cuenta</button>' : ''}
          <button id="auth-logout-btn" class="btn btn-ghost">🚪 Cambiar / Salir</button>
        </div>
      `;
      head.insertAdjacentElement('afterend', card);

      card.querySelector('#auth-link-btn')?.addEventListener('click', () => this.openModal({ allowDismiss: true }));
      card.querySelector('#auth-logout-btn')?.addEventListener('click', () => this.signOut());
    };
  }

  _exposeBridge() {
    window.AuthBridge = {
      getSession: () => this.session,
      applyExternalUser: ({ uid, handle, email, provider }) => {
        this.session = {
          uid: uid || `ext_${Date.now()}`,
          tag: randomTag(),
          provider: provider || 'google',
          handle: (handle || 'Jugador').slice(0, 20),
          email: email || '',
          createdAt: new Date().toISOString()
        };
        this._save();
        this._syncProfile();
        this.closeModal();
      }
    };
  }
}

export function attachAuthSystem(app) {
  const auth = new AuthManager(app);
  app.auth = auth;
  return auth;
}
