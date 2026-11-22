const PEER_PREFIX = 'aj960-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

function ensureMultiplayerStyles() {
  if (document.querySelector('style[data-mp-css]')) return;
  const style = document.createElement('style');
  style.dataset.mpCss = 'true';
  style.textContent = `
    .mp-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-color: rgba(56, 189, 248, 0.32);
    }
    .mp-card.hidden { display: none; }
    .mp-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.16);
      color: var(--text-muted);
    }
    .mp-badge.waiting {
      background: rgba(250, 204, 21, 0.18);
      color: #facc15;
    }
    .mp-badge.connected {
      background: rgba(34, 197, 94, 0.18);
      color: #4ade80;
    }
    .mp-badge.error {
      background: rgba(244, 63, 94, 0.18);
      color: #fb7185;
    }
    .mp-row {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
    .mp-row > * { flex: 1; }
    .mp-input {
      background: rgba(9, 13, 22, 0.72);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 7px 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.86rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      text-align: center;
      min-width: 110px;
    }
    .mp-code-box {
      background: rgba(9, 13, 22, 0.72);
      border: 1px dashed var(--accent-cyan);
      border-radius: 9px;
      padding: 8px 10px;
      text-align: center;
    }
    .mp-code-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    .mp-code-val {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      color: var(--accent-cyan);
    }
    .mp-info {
      font-size: 0.79rem;
      line-height: 1.4;
      color: var(--text-muted);
    }
    .mp-divider {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .mp-divider::before,
    .mp-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-color);
    }
    .btn-wa {
      background: #16a34a;
      color: #ffffff;
      border-color: #22c55e;
    }
    .btn-wa:hover { filter: brightness(1.08); }
  `;
  document.head.appendChild(style);
}

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function loadPeerJs() {
  if (window.Peer) return Promise.resolve(window.Peer);

  const cdns = [
    'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js',
    'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'
  ];

  const tryUrl = (index) =>
    new Promise((resolve, reject) => {
      if (index >= cdns.length) {
        reject(new Error('No se pudo cargar el motor de conexión WebRTC.'));
        return;
      }
      const script = document.createElement('script');
      script.src = cdns[index];
      script.async = true;
      script.onload = () => (window.Peer ? resolve(window.Peer) : tryUrl(index + 1).then(resolve, reject));
      script.onerror = () => tryUrl(index + 1).then(resolve, reject);
      document.head.appendChild(script);
    });

  return tryUrl(0);
}

export class MultiplayerManager {
  constructor({ modeSelectEl, sidePanelEl, getHostConfig, onMatchStart, onRemoteMove, onRemoteResign, onRemoteTimeout, onPeerDisconnect }) {
    ensureMultiplayerStyles();
    this.modeSelectEl = modeSelectEl;
    this.sidePanelEl = sidePanelEl;
    this.getHostConfig = getHostConfig;
    this.onMatchStart = onMatchStart;
    this.onRemoteMove = onRemoteMove;
    this.onRemoteResign = onRemoteResign;
    this.onRemoteTimeout = onRemoteTimeout;
    this.onPeerDisconnect = onPeerDisconnect;

    this.peer = null;
    this.conn = null;
    this.role = null;       // 'host' | 'guest'
    this.roomCode = null;
    this.myColor = null;    // 'w' | 'b'
    this.hostColorChoice = 'random';
    this.state = 'idle';    // idle | creating | waiting | joining | connected | error
    this.statusMessage = 'Crea una sala privada y comparte el enlace o pega el código de tu rival.';

    this._mountModeOption();
    this._mountPanel();
  }

  _mountModeOption() {
    if (!this.modeSelectEl || this.modeSelectEl.querySelector('option[value="online"]')) return;
    const opt = document.createElement('option');
    opt.value = 'online';
    opt.textContent = '🌐 Online (Sala Privada)';
    this.modeSelectEl.appendChild(opt);
  }

  _mountPanel() {
    if (!this.sidePanelEl) return;
    this.cardEl = document.createElement('div');
    this.cardEl.className = 'card mp-card hidden';
    this.cardEl.id = 'mp-card';

    const statusCard = this.sidePanelEl.querySelector('.status-card');
    if (statusCard && statusCard.nextSibling) {
      this.sidePanelEl.insertBefore(this.cardEl, statusCard.nextSibling);
    } else {
      this.sidePanelEl.prepend(this.cardEl);
    }
    this.renderPanel();
  }

  setVisible(visible) {
    if (!this.cardEl) return;
    this.cardEl.classList.toggle('hidden', !visible);
    if (visible) this.renderPanel();
  }

  isConnected() {
    return this.state === 'connected' && Boolean(this.conn && this.conn.open);
  }

  getInviteUrl() {
    if (!this.roomCode) return window.location.href;
    const url = new URL(window.location.href);
    url.searchParams.set('sala', this.roomCode);
    return url.toString();
  }

  getPendingRoomFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('sala');
      if (!raw) return null;
      const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      return clean.length >= 4 ? clean : null;
    } catch {
      return null;
    }
  }

  _clearUrlRoomParam() {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('sala')) {
        url.searchParams.delete('sala');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignorar
    }
  }

  async createRoom() {
    this.disconnect(true);
    this.role = 'host';
    this.state = 'creating';
    this.statusMessage = 'Abriendo sala privada...';
    this.renderPanel();

    try {
      const PeerCtor = await loadPeerJs();
      this.roomCode = generateRoomCode();
      const peerId = PEER_PREFIX + this.roomCode;

      this.peer = new PeerCtor(peerId, { config: ICE_CONFIG });

      this.peer.on('open', () => {
        this.state = 'waiting';
        this.statusMessage = 'Sala lista. Comparte el enlace o el código con tu rival para empezar.';
        this.renderPanel();
      });

      this.peer.on('connection', (connection) => {
        if (this.conn && this.conn.open) {
          connection.close();
          return;
        }
        this.conn = connection;
        this._setupConnection(connection, true);
      });

      this.peer.on('error', (err) => {
        this._handlePeerError(err);
      });
    } catch (err) {
      this.state = 'error';
      this.statusMessage = err.message || 'No se pudo iniciar la sala online.';
      this.renderPanel();
    }
  }

  async joinRoom(rawCode) {
    const clean = (rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length < 4) {
      this.state = 'error';
      this.statusMessage = 'Escribe un código de sala válido (ej. K7M2P9).';
      this.renderPanel();
      return;
    }

    this.disconnect(true);
    this.role = 'guest';
    this.roomCode = clean;
    this.state = 'joining';
    this.statusMessage = `Conectando a la sala ${clean}...`;
    this.renderPanel();

    try {
      const PeerCtor = await loadPeerJs();
      this.peer = new PeerCtor(undefined, { config: ICE_CONFIG });

      this.peer.on('open', () => {
        const connection = this.peer.connect(PEER_PREFIX + this.roomCode, { reliable: true });
        this.conn = connection;
        this._setupConnection(connection, false);
      });

      this.peer.on('error', (err) => {
        this._handlePeerError(err);
      });
    } catch (err) {
      this.state = 'error';
      this.statusMessage = err.message || 'Error al conectarse a la sala.';
      this.renderPanel();
    }
  }

  _setupConnection(connection, isHost) {
    connection.on('open', () => {
      this.state = 'connected';
      this.renderPanel();

      if (isHost) {
        const cfg = this.getHostConfig ? this.getHostConfig() : { positionId: Math.floor(Math.random() * 960), clockPresetId: '5+3' };
        const hostColor = this.hostColorChoice === 'random'
          ? (Math.random() < 0.5 ? 'w' : 'b')
          : this.hostColorChoice;

        this.myColor = hostColor;
        const payload = {
          type: 'init',
          positionId: cfg.positionId,
          hostColor,
          clockPresetId: cfg.clockPresetId
        };
        this.send(payload);
        this.statusMessage = `Conectado. Juegas con ${hostColor === 'w' ? 'Blancas' : 'Negras'}.`;
        this.renderPanel();

        if (this.onMatchStart) {
          this.onMatchStart({
            positionId: cfg.positionId,
            myColor: hostColor,
            clockPresetId: cfg.clockPresetId
          });
        }
      }
    });

    connection.on('data', (data) => {
      this._handleMessage(data);
    });

    connection.on('close', () => {
      if (this.state === 'connected') {
        this.state = 'idle';
        this.statusMessage = 'El rival se desconectó de la sala.';
        this.conn = null;
        this.renderPanel();
        if (this.onPeerDisconnect) this.onPeerDisconnect();
      }
    });

    connection.on('error', () => {
      this.state = 'error';
      this.statusMessage = 'Se perdió la conexión con el rival.';
      this.renderPanel();
    });
  }

  _handlePeerError(err) {
    const type = err?.type || '';
    if (type === 'peer-unavailable') {
      this.statusMessage = `La sala ${this.roomCode} no existe o ya se cerró. Verifica el código.`;
    } else if (type === 'unavailable-id') {
      this.statusMessage = 'Código en uso; intenta crear sala nuevamente.';
    } else {
      this.statusMessage = 'No se pudo conectar con el servidor de salas. Revisa tu conexión.';
    }
    this.state = 'error';
    this.renderPanel();
  }

  _handleMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'init' || msg.type === 'rematch') {
      const myColor = this.role === 'host'
        ? msg.hostColor
        : (msg.hostColor === 'w' ? 'b' : 'w');
      this.myColor = myColor;
      this.state = 'connected';
      this.statusMessage = `Partida en curso · Juegas con ${myColor === 'w' ? 'Blancas' : 'Negras'}.`;
      this.renderPanel();

      if (this.onMatchStart) {
        this.onMatchStart({
          positionId: msg.positionId,
          myColor,
          clockPresetId: msg.clockPresetId
        });
      }
    } else if (msg.type === 'move') {
      if (this.onRemoteMove) this.onRemoteMove(msg);
    } else if (msg.type === 'resign') {
      if (this.onRemoteResign) this.onRemoteResign(msg.loser);
    } else if (msg.type === 'timeout') {
      if (this.onRemoteTimeout) this.onRemoteTimeout(msg.loser, msg.winner);
    }
  }

  send(payload) {
    if (this.conn && this.conn.open) {
      this.conn.send(payload);
      return true;
    }
    return false;
  }

  sendMove(move, remaining) {
    return this.send({
      type: 'move',
      move: {
        from: move.from,
        to: move.to,
        promo: move.promo || null,
        castle: move.castle || null
      },
      remaining: remaining ? { w: remaining.w, b: remaining.b } : null
    });
  }

  sendResign(loserColor) {
    return this.send({ type: 'resign', loser: loserColor });
  }

  sendTimeout(loserColor, winnerColor) {
    return this.send({ type: 'timeout', loser: loserColor, winner: winnerColor });
  }

  requestRematch(positionId, clockPresetId) {
    if (!this.isConnected()) return false;
    // Alternar colores en la revancha
    const nextMyColor = this.myColor === 'w' ? 'b' : 'w';
    const nextHostColor = this.role === 'host'
      ? nextMyColor
      : (nextMyColor === 'w' ? 'b' : 'w');

    this.myColor = nextMyColor;
    this.send({
      type: 'rematch',
      positionId,
      hostColor: nextHostColor,
      clockPresetId
    });

    this.statusMessage = `Revancha iniciada · Juegas con ${nextMyColor === 'w' ? 'Blancas' : 'Negras'}.`;
    this.renderPanel();

    if (this.onMatchStart) {
      this.onMatchStart({
        positionId,
        myColor: nextMyColor,
        clockPresetId
      });
    }
    return true;
  }

  disconnect(silent = false) {
    if (this.conn) {
      try { this.conn.close(); } catch { /* ignorar */ }
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch { /* ignorar */ }
      this.peer = null;
    }
    this.role = null;
    this.roomCode = null;
    this.myColor = null;
    this.state = 'idle';
    this._clearUrlRoomParam();
    if (!silent) {
      this.statusMessage = 'Saliste de la sala. Puedes crear una nueva o unirte con un código.';
      this.renderPanel();
    }
  }

  renderPanel() {
    if (!this.cardEl) return;

    const badgeMap = {
      idle: { text: 'Desconectado', cls: '' },
      creating: { text: 'Creando...', cls: 'waiting' },
      waiting: { text: 'Esperando rival', cls: 'waiting' },
      joining: { text: 'Conectando...', cls: 'waiting' },
      connected: { text: 'En línea', cls: 'connected' },
      error: { text: 'Error', cls: 'error' }
    };
    const badge = badgeMap[this.state] || badgeMap.idle;

    if (this.state === 'waiting') {
      const inviteUrl = this.getInviteUrl();
      const waText = encodeURIComponent(
        `¡Te reto a una partida de Ajedrez 960 Táctico! Entra directo con este enlace: ${inviteUrl}`
      );

      this.cardEl.innerHTML = `
        <div class="card-header">
          <h2>🌐 Sala Privada</h2>
          <span class="mp-badge ${badge.cls}">${badge.text}</span>
        </div>
        <div class="mp-code-box">
          <div class="mp-code-label">CÓDIGO DE SALA</div>
          <div class="mp-code-val">${this.roomCode}</div>
        </div>
        <p class="mp-info">${this.statusMessage}</p>
        <div class="mp-row">
          <button id="mp-copy-link" class="btn btn-primary">📋 Copiar Enlace</button>
          <a href="https://wa.me/?text=${waText}" target="_blank" rel="noopener" class="btn btn-wa" style="text-align:center;text-decoration:none">💬 WhatsApp</a>
        </div>
        <button id="mp-cancel" class="btn btn-ghost">Cancelar Sala</button>
      `;

      this.cardEl.querySelector('#mp-copy-link')?.addEventListener('click', (e) => {
        navigator.clipboard?.writeText(inviteUrl).then(() => {
          e.target.textContent = '✓ Enlace Copiado';
          setTimeout(() => { e.target.textContent = '📋 Copiar Enlace'; }, 1600);
        });
      });
      this.cardEl.querySelector('#mp-cancel')?.addEventListener('click', () => this.disconnect());
      return;
    }

    if (this.state === 'connected') {
      const colorText = this.myColor === 'w' ? '⚪ Blancas' : '⚫ Negras';
      this.cardEl.innerHTML = `
        <div class="card-header">
          <h2>🌐 Sala ${this.roomCode}</h2>
          <span class="mp-badge ${badge.cls}">${badge.text}</span>
        </div>
        <p class="mp-info"><strong>Tu bando:</strong> ${colorText}<br/>${this.statusMessage}</p>
        <div class="mp-row">
          <button id="mp-rematch" class="btn btn-secondary">🔄 Revancha 960</button>
          <button id="mp-leave" class="btn btn-ghost">Salir</button>
        </div>
      `;

      this.cardEl.querySelector('#mp-rematch')?.addEventListener('click', () => {
        const cfg = this.getHostConfig ? this.getHostConfig() : { positionId: Math.floor(Math.random() * 960), clockPresetId: '5+3' };
        this.requestRematch(Math.floor(Math.random() * 960), cfg.clockPresetId);
      });
      this.cardEl.querySelector('#mp-leave')?.addEventListener('click', () => this.disconnect());
      return;
    }

    // Estado idle / creating / joining / error
    const busy = this.state === 'creating' || this.state === 'joining';
    this.cardEl.innerHTML = `
      <div class="card-header">
        <h2>🌐 Multijugador Online</h2>
        <span class="mp-badge ${badge.cls}">${badge.text}</span>
      </div>
      <p class="mp-info">${this.statusMessage}</p>
      <div class="mp-row">
        <select id="mp-color-select" class="ctrl-select" ${busy ? 'disabled' : ''}>
          <option value="random" ${this.hostColorChoice === 'random' ? 'selected' : ''}>Color: Aleatorio</option>
          <option value="w" ${this.hostColorChoice === 'w' ? 'selected' : ''}>Jugar Blancas</option>
          <option value="b" ${this.hostColorChoice === 'b' ? 'selected' : ''}>Jugar Negras</option>
        </select>
        <button id="mp-create" class="btn btn-primary" ${busy ? 'disabled' : ''}>✨ Crear Sala</button>
      </div>
      <div class="mp-divider">o únete a un amigo</div>
      <div class="mp-row">
        <input id="mp-join-input" class="mp-input" type="text" maxlength="8" placeholder="CÓDIGO" value="${this.roomCode || ''}" ${busy ? 'disabled' : ''} />
        <button id="mp-join-btn" class="btn btn-secondary" ${busy ? 'disabled' : ''}>🔗 Unirse</button>
      </div>
    `;

    this.cardEl.querySelector('#mp-color-select')?.addEventListener('change', (e) => {
      this.hostColorChoice = e.target.value;
    });
    this.cardEl.querySelector('#mp-create')?.addEventListener('click', () => this.createRoom());
    this.cardEl.querySelector('#mp-join-btn')?.addEventListener('click', () => {
      const code = this.cardEl.querySelector('#mp-join-input')?.value || '';
      this.joinRoom(code);
    });
    this.cardEl.querySelector('#mp-join-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.joinRoom(e.target.value);
      }
    });
  }
}
