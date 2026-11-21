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

  _noiseBurst(ctx, startTime, duration, volume, filterFreq = 1200, filterType = 'bandpass') {
    const bufSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.8);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(startTime);
  }

  playMove(pieceType = 'P') {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    if (pieceType === 'N') {
      // Doble golpe de cascos al saltar
      [0, 0.085].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 190 : 250, t + offset);
        osc.frequency.exponentialRampToValueAtTime(75, t + offset + 0.07);
        g.gain.setValueAtTime(0.22, t + offset);
        g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.08);
        osc.connect(g).connect(ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.085);
      });
      return;
    }

    const baseFreq = { P: 300, B: 260, R: 170, Q: 220, K: 190 }[pieceType] || 240;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.42, t + 0.09);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.11);

    this._noiseBurst(ctx, t, 0.055, 0.12, 900, 'lowpass');
  }

  playCastle() {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.playMove('R');
    setTimeout(() => this.playMove('K'), 110);

    // Acorde metálico breve de enroque
    [392, 587.33].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + 0.06 + i * 0.07);
      g.gain.setValueAtTime(0.14, t + 0.06 + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.32 + i * 0.07);
      osc.connect(g).connect(ctx.destination);
      osc.start(t + 0.06 + i * 0.07);
      osc.stop(t + 0.34 + i * 0.07);
    });
  }

  playCharge(pieceType) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    if (pieceType === 'B' || pieceType === 'Q') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pieceType === 'Q' ? 280 : 380, t);
      osc.frequency.exponentialRampToValueAtTime(pieceType === 'Q' ? 1120 : 1480, t + 0.24);
      g.gain.setValueAtTime(0.02, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.21);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.27);
    } else if (pieceType === 'N') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.16);
      osc.frequency.exponentialRampToValueAtTime(95, t + 0.32);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.33);
    } else if (pieceType === 'R') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.linearRampToValueAtTime(135, t + 0.24);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    } else if (pieceType === 'K') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.24);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    } else {
      // Peón: silbido de filo
      this._noiseBurst(ctx, t, 0.16, 0.22, 2800, 'highpass');
      return;
    }

    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.34);
  }

  playAttack(pieceType) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    if (pieceType === 'P') {
      // Estocada Relámpago: corte agudo + chispa eléctrica
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1350, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.19);
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.21);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
      this._noiseBurst(ctx, t, 0.16, 0.3, 3200, 'bandpass');
    } else if (pieceType === 'N') {
      // Salto Sísmico: sub-bajo telúrico + temblor
      const sub = ctx.createOscillator();
      const g = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(135, t);
      sub.frequency.exponentialRampToValueAtTime(30, t + 0.45);
      g.gain.setValueAtTime(0.45, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
      sub.connect(g).connect(ctx.destination);
      sub.start(t);
      sub.stop(t + 0.5);
      this._noiseBurst(ctx, t, 0.32, 0.35, 360, 'lowpass');
    } else if (pieceType === 'B') {
      // Rayo Diagonal: láser resonante + cristal roto
      [1560, 1040].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i === 0 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(210, t + 0.36);
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      });
      this._noiseBurst(ctx, t, 0.2, 0.22, 4200, 'highpass');
    } else if (pieceType === 'R') {
      // Embestida de Ariete: choque metálico pesado + derrumbe
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(195, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.38);
      g.gain.setValueAtTime(0.32, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.42);
      this._noiseBurst(ctx, t, 0.36, 0.38, 650, 'lowpass');
    } else if (pieceType === 'Q') {
      // Nova Real: acorde imperial + explosión supernova
      [880, 659.25, 440].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.25, t + 0.55);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.58);
        osc.connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.6);
      });
      const boom = ctx.createOscillator();
      const bg = ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(150, t);
      boom.frequency.exponentialRampToValueAtTime(34, t + 0.5);
      bg.gain.setValueAtTime(0.4, t);
      bg.gain.exponentialRampToValueAtTime(0.001, t + 0.52);
      boom.connect(bg).connect(ctx.destination);
      boom.start(t);
      boom.stop(t + 0.55);
      this._noiseBurst(ctx, t, 0.4, 0.34, 1500, 'bandpass');
    } else if (pieceType === 'K') {
      // Juicio Soberano: campana real + trueno
      [293.66, 440, 587.33].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.62);
        osc.connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.65);
      });
      this._noiseBurst(ctx, t, 0.42, 0.35, 500, 'lowpass');
    }
  }

  playCheck() {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    [620, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.085);
      g.gain.setValueAtTime(0.14, t + i * 0.085);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.085 + 0.22);
      osc.connect(g).connect(ctx.destination);
      osc.start(t + i * 0.085);
      osc.stop(t + i * 0.085 + 0.24);
    });
  }

  playGameOver(victory = true) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = victory ? [392, 493.88, 587.33, 783.99] : [330, 293.66, 246.94, 196];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + idx * 0.12);
      g.gain.setValueAtTime(0.18, t + idx * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.38);
      osc.connect(g).connect(ctx.destination);
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.4);
    });
  }
}
