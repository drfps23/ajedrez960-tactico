export const CLOCK_PRESETS = [
  { id: 'off',   label: '⏱ Sin reloj',        baseSec: 0,    incSec: 0 },
  { id: '3+2',   label: '⚡ 3 + 2 Blitz',      baseSec: 180,  incSec: 2 },
  { id: '5+3',   label: '🔥 5 + 3 Blitz',      baseSec: 300,  incSec: 3 },
  { id: '10+0',  label: '⏱ 10 min Rápida',    baseSec: 600,  incSec: 0 },
  { id: '10+5',  label: '♟ 10 + 5 Rápida',    baseSec: 600,  incSec: 5 },
  { id: '15+10', label: '🏛 15 + 10 Clásica',  baseSec: 900,  incSec: 10 },
  { id: '30+0',  label: '👑 30 min Clásica',   baseSec: 1800, incSec: 0 }
];

function ensureClockStyles() {
  if (document.querySelector('style[data-clock-css]')) return;
  const style = document.createElement('style');
  style.dataset.clockCss = 'true';
  style.textContent = `
    .clock-select { min-width: 152px; }
    .clock-slot { display: flex; align-items: center; margin-left: auto; }
    .clock-box {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
      font-size: 1.05rem; font-weight: 800; letter-spacing: 0.04em;
      padding: 5px 12px; border-radius: 8px;
      background: rgba(9, 13, 22, 0.72); border: 1px solid var(--border-color);
      color: var(--text-muted); min-width: 88px; text-align: center;
      transition: border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    }
    .clock-box.hidden { display: none; }
    .clock-box.active {
      color: var(--text-main); border-color: var(--accent-cyan);
      background: rgba(56, 189, 248, 0.14); box-shadow: 0 0 12px rgba(56, 189, 248, 0.28);
    }
    .clock-box.low-time {
      color: #fecdd3; border-color: #f43f5e; background: rgba(244, 63, 94, 0.24);
      box-shadow: 0 0 14px rgba(244, 63, 94, 0.45); animation: clockPulse 0.8s ease-in-out infinite;
    }
    .clock-box.flagged { color: #ffffff; border-color: #ef4444; background: #dc2626; animation: none; }
    .clock-inc-tag {
      display: inline-block; font-size: 0.68rem; font-weight: 700;
      color: var(--accent-gold); margin-left: 5px; vertical-align: middle;
    }
    @keyframes clockPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
  `;
  document.head.appendChild(style);
}

function formatMs(ms) {
  const clamped = Math.max(0, ms);
  const totalSec = clamped / 1000;
  if (totalSec < 20) {
    const secs = Math.floor(totalSec);
    const tenths = Math.floor((clamped % 1000) / 100);
    return `0:${String(secs).padStart(2, '0')}.${tenths}`;
  }
  const mins = Math.floor(totalSec / 60);
  const secs = Math.floor(totalSec % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export class FischerClock {
  constructor({ topSlotEl, bottomSlotEl, controlsHostEl, onTimeout }) {
    ensureClockStyles();
    this.topSlotEl = topSlotEl;
    this.bottomSlotEl = bottomSlotEl;
    this.controlsHostEl = controlsHostEl;
    this.onTimeout = onTimeout;

    this.preset = CLOCK_PRESETS[0];
    this.remaining = { w: 0, b: 0 };
    this.activeColor = null;
    this.running = false;
    this.pausedForAnim = false;
    this.started = false;
    this.flipped = false;
    this.flaggedColor = null;
    this.lastTick = 0;
    this.timerId = null;

    this._mountUI();
    this.render();
  }

  _mountUI() {
    this.selectEl = document.createElement('select');
    this.selectEl.id = 'clock-select';
    this.selectEl.className = 'ctrl-select clock-select';
    this.selectEl.title = 'Control de tiempo';

    CLOCK_PRESETS.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      this.selectEl.appendChild(opt);
    });

    this.selectEl.addEventListener('change', (e) => this.setPreset(e.target.value));
    if (this.controlsHostEl) this.controlsHostEl.appendChild(this.selectEl);

    this.topBox = document.createElement('div');
    this.topBox.className = 'clock-box hidden';
    this.bottomBox = document.createElement('div');
    this.bottomBox.className = 'clock-box hidden';

    if (this.topSlotEl) { this.topSlotEl.innerHTML = ''; this.topSlotEl.appendChild(this.topBox); }
    if (this.bottomSlotEl) { this.bottomSlotEl.innerHTML = ''; this.bottomSlotEl.appendChild(this.bottomBox); }
  }

  isEnabled() { return this.preset.baseSec > 0; }

  applyModeDefault(mode) {
    const defaultId = (mode === 'pvp' || mode === 'online') ? '10+0' : 'off';
    this.setPreset(defaultId);
  }

  setPreset(presetId) {
    const found = CLOCK_PRESETS.find(p => p.id === presetId) || CLOCK_PRESETS[0];
    this.preset = found;
    if (this.selectEl) this.selectEl.value = found.id;
    this.reset();
  }

  reset() {
    this.stop();
    const baseMs = this.preset.baseSec * 1000;
    this.remaining = { w: baseMs, b: baseMs };
    this.activeColor = 'w';
    this.started = false;
    this.pausedForAnim = false;
    this.flaggedColor = null;
    this.render();
  }

  syncOrientation(flipped) { this.flipped = flipped; this.render(); }

  pause() {
    if (!this.running) return;
    this._consumeElapsed();
    this.pausedForAnim = true;
    this._clearInterval();
  }

  resume() {
    if (!this.isEnabled() || !this.started || !this.pausedForAnim || this.flaggedColor) return;
    this.pausedForAnim = false;
    this.running = true;
    this.lastTick = performance.now();
    this._startInterval();
  }

  onMoveCompleted(moverColor, nextTurnColor) {
    if (!this.isEnabled() || this.flaggedColor) return;
    if (this.started) {
      this._consumeElapsed();
      this.remaining[moverColor] += this.preset.incSec * 1000;
    } else {
      this.started = true;
    }
    this.activeColor = nextTurnColor;
    this.pausedForAnim = false;
    this.running = true;
    this.lastTick = performance.now();
    this._startInterval();
    this.render();
  }

  syncTurnAfterUndo(turnColor) {
    if (!this.isEnabled()) return;
    this.flaggedColor = null;
    this.activeColor = turnColor;
    if (this.remaining.w <= 0) this.remaining.w = 10000;
    if (this.remaining.b <= 0) this.remaining.b = 10000;
    if (this.started) {
      this.running = true;
      this.pausedForAnim = false;
      this.lastTick = performance.now();
      this._startInterval();
    }
    this.render();
  }

  stop() {
    if (this.running) this._consumeElapsed();
    this.running = false;
    this.pausedForAnim = false;
    this._clearInterval();
    this.render();
  }

  _startInterval() { this._clearInterval(); this.timerId = setInterval(() => this._tick(), 100); }
  _clearInterval() { if (this.timerId) { clearInterval(this.timerId); this.timerId = null; } }

  _consumeElapsed() {
    if (!this.running || !this.activeColor) return;
    const now = performance.now();
    const dt = Math.max(0, now - this.lastTick);
    this.lastTick = now;
    this.remaining[this.activeColor] = Math.max(0, this.remaining[this.activeColor] - dt);
  }

  _tick() {
    if (!this.running || !this.activeColor) return;
    this._consumeElapsed();
    if (this.remaining[this.activeColor] <= 0) {
      const loser = this.activeColor;
      const winner = loser === 'w' ? 'b' : 'w';
      this.flaggedColor = loser;
      this.running = false;
      this._clearInterval();
      this.render();
      if (this.onTimeout) this.onTimeout(loser, winner);
      return;
    }
    this.render();
  }

  render() {
    const enabled = this.isEnabled();
    this.topBox.classList.toggle('hidden', !enabled);
    this.bottomBox.classList.toggle('hidden', !enabled);
    if (!enabled) return;
    this._renderBox(this.topBox, this.flipped ? 'w' : 'b');
    this._renderBox(this.bottomBox, this.flipped ? 'b' : 'w');
  }

  _renderBox(boxEl, color) {
    const ms = this.remaining[color];
    const isActive = this.started && this.running && this.activeColor === color && !this.flaggedColor;
    const isLow = ms > 0 && ms < 20000;
    const isFlagged = this.flaggedColor === color;

    boxEl.className = 'clock-box';
    if (isFlagged) boxEl.classList.add('flagged');
    else if (isActive && isLow) boxEl.classList.add('low-time');
    else if (isActive) boxEl.classList.add('active');

    const incHtml = this.preset.incSec > 0 ? `<span class="clock-inc-tag">+${this.preset.incSec}</span>` : '';
    boxEl.innerHTML = `${formatMs(ms)}${incHtml}`;
  }
}
