export class SoundFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  _ensureCtx() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playMove() {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.08);
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  playCastle() {
    this.playMove();
    setTimeout(() => this.playMove(), 90);
  }

  playCheck() {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    [520, 740].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.07);
      gain.gain.setValueAtTime(0.09, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.16);
    });
  }

  playAttack(pieceType) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    const profiles = {
      P: { type: 'sawtooth', f1: 720, f2: 180, dur: 0.16, vol: 0.16 },
      N: { type: 'sine',     f1: 140, f2: 42,  dur: 0.30, vol: 0.28 },
      B: { type: 'sine',     f1: 1180, f2: 320, dur: 0.24, vol: 0.16 },
      R: { type: 'square',   f1: 180, f2: 55,  dur: 0.28, vol: 0.20 },
      Q: { type: 'sawtooth', f1: 880, f2: 95,  dur: 0.38, vol: 0.22 },
      K: { type: 'triangle', f1: 440, f2: 110, dur: 0.34, vol: 0.24 }
    };

    const p = profiles[pieceType] || profiles.P;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = p.type;
    osc.frequency.setValueAtTime(p.f1, t);
    osc.frequency.exponentialRampToValueAtTime(p.f2, t + p.dur);

    gain.gain.setValueAtTime(p.vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + p.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + p.dur);

    // Impacto de ruido corto para dar sensación física al choque
    const bufSize = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.14, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    noise.connect(nGain).connect(ctx.destination);
    noise.start(t);
  }

  playGameOver(victory = true) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = victory ? [392, 493.88, 587.33, 783.99] : [330, 293.66, 246.94, 196];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + idx * 0.11);
      gain.gain.setValueAtTime(0.13, t + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.11 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t + idx * 0.11);
      osc.stop(t + idx * 0.11 + 0.3);
    });
  }
}
