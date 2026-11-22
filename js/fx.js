const DEFAULT_PALETTE = {
  P: '#38bdf8',
  N: '#f59e0b',
  B: '#c084fc',
  R: '#ef4444',
  Q: '#f472b6',
  K: '#facc15'
};

const ATTACK_LABELS = {
  P: '⚡ ESTOCADA RELÁMPAGO',
  N: '💥 SALTO SÍSMICO',
  B: '✦ RAYO DIAGONAL',
  R: '🔥 EMBESTIDA ARIETE',
  Q: '✧ NOVA REAL',
  K: '👑 JUICIO SOBERANO'
};

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function ensureFxStyles() {
  if (document.querySelector('style[data-fx-css]')) return;
  const style = document.createElement('style');
  style.dataset.fxCss = 'true';
  style.textContent = `
    .piece-wrap.king-defeated {
      transform: rotate(86deg) translateY(8%) !important;
      opacity: 0.52;
      filter: grayscale(0.45) drop-shadow(0 0 10px rgba(244, 63, 94, 0.85));
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
  `;
  document.head.appendChild(style);
}

export class CombatFX {
  constructor(canvas, boardWrapper) {
    ensureFxStyles();
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.boardWrapper = boardWrapper;
    this.palette = { ...DEFAULT_PALETTE };

    this.pieceLayer = document.createElement('div');
    Object.assign(this.pieceLayer.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '6',
      overflow: 'hidden'
    });
    this.boardWrapper.appendChild(this.pieceLayer);
    this.canvas.style.zIndex = '7';

    this.effects = [];
    this.particles = [];
    this.labels = [];
    this.flashes = [];
    this.rafId = null;
    this.lastTime = 0;
    this._animToken = 0;

    this._resize();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this._resize()).observe(boardWrapper);
    }
    window.addEventListener('resize', () => this._resize());
  }

  setPalette(customPalette) {
    this.palette = { ...DEFAULT_PALETTE, ...customPalette };
  }

  /**
   * Cancela limpiamente cualquier animación de piezas en curso (útil al navegar rápido en revisión).
   */
  cancelActive() {
    this._animToken++;
    this.pieceLayer.innerHTML = '';
    this.boardWrapper.style.transform = '';
    this.effects = [];
    this.flashes = [];
    this.labels = [];
    this.particles = [];
    if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
  }

  _resize() {
    const rect = this.boardWrapper.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width || 520;
    this.height = rect.height || 520;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _ensureSize() {
    const w = this.boardWrapper.clientWidth;
    if (w > 20 && Math.abs(w - this.width) > 2) {
      this._resize();
    }
  }

  _sqToPx(r, c, flipped) {
    this._ensureSize();
    const vr = flipped ? 7 - r : r;
    const vc = flipped ? 7 - c : c;
    const cell = this.width / 8;
    return {
      x: (vc + 0.5) * cell,
      y: (vr + 0.5) * cell,
      cell
    };
  }

  _createGhostPiece(svgHtml, cell) {
    const el = document.createElement('div');
    const size = cell * 0.86;
    Object.assign(el.style, {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      left: '0px',
      top: '0px',
      transformOrigin: 'center center',
      willChange: 'transform, opacity, filter',
      display: 'grid',
      placeItems: 'center'
    });
    el.innerHTML = svgHtml;
    const svg = el.querySelector('svg');
    if (svg) {
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.filter = 'drop-shadow(0 6px 8px rgba(0,0,0,0.65))';
    }
    this.pieceLayer.appendChild(el);
    return { el, size };
  }

  _positionGhost(ghost, x, y, scale = 1, rotDeg = 0) {
    const half = ghost.size / 2;
    ghost.el.style.transform =
      `translate3d(${(x - half).toFixed(1)}px, ${(y - half).toFixed(1)}px, 0) scale(${scale.toFixed(3)}) rotate(${rotDeg.toFixed(1)}deg)`;
  }

  _shake(intensity = 8, duration = 280) {
    const start = performance.now();
    const token = this._animToken;
    const step = (now) => {
      if (token !== this._animToken) {
        this.boardWrapper.style.transform = '';
        return;
      }
      const elapsed = now - start;
      if (elapsed >= duration) {
        this.boardWrapper.style.transform = '';
        return;
      }
      const decay = 1 - elapsed / duration;
      const dx = (Math.random() * 2 - 1) * intensity * decay;
      const dy = (Math.random() * 2 - 1) * intensity * decay;
      this.boardWrapper.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  animateRegularMove({ pieceHtml, pieceType, from, to, flipped = false, onComplete }) {
    const token = ++this._animToken;
    const p1 = this._sqToPx(from.r, from.c, flipped);
    const p2 = this._sqToPx(to.r, to.c, flipped);
    const ghost = this._createGhostPiece(pieceHtml, p1.cell);
    const duration = pieceType === 'N' ? 300 : 215;
    const start = performance.now();
    const color = this.palette[pieceType] || '#38bdf8';

    this.effects.push({
      type: 'TRAIL',
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      color,
      age: 0,
      duration: 0.34
    });
    this._ensureLoop();

    const step = (now) => {
      if (token !== this._animToken) {
        ghost.el.remove();
        return;
      }
      const raw = Math.min(1, (now - start) / duration);
      const t = easeOutCubic(raw);
      let x = p1.x + (p2.x - p1.x) * t;
      let y = p1.y + (p2.y - p1.y) * t;
      let scale = 1;

      if (pieceType === 'N') {
        const arc = Math.sin(Math.PI * raw);
        y -= arc * p1.cell * 0.72;
        scale = 1 + arc * 0.32;
      } else {
        scale = 1 + Math.sin(Math.PI * raw) * 0.1;
      }

      this._positionGhost(ghost, x, y, scale);

      if (raw < 1) {
        requestAnimationFrame(step);
      } else {
        ghost.el.remove();
        this._spawnParticles(p2.x, p2.y, color, 8, 'SOFT');
        this._ensureLoop();
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(step);
  }

  animateCastle({ kingHtml, rookHtml, row, kingFrom, kingTo, rookFrom, rookTo, flipped = false, onComplete }) {
    const token = ++this._animToken;
    const k1 = this._sqToPx(row, kingFrom, flipped);
    const k2 = this._sqToPx(row, kingTo, flipped);
    const r1 = this._sqToPx(row, rookFrom, flipped);
    const r2 = this._sqToPx(row, rookTo, flipped);

    const kGhost = this._createGhostPiece(kingHtml, k1.cell);
    const rGhost = this._createGhostPiece(rookHtml, k1.cell);
    const duration = 340;
    const start = performance.now();

    const step = (now) => {
      if (token !== this._animToken) {
        kGhost.el.remove();
        rGhost.el.remove();
        return;
      }
      const raw = Math.min(1, (now - start) / duration);
      const t = easeInOutQuad(raw);
      const arc = Math.sin(Math.PI * raw) * k1.cell * 0.3;

      this._positionGhost(kGhost, k1.x + (k2.x - k1.x) * t, k1.y - arc, 1 + Math.sin(Math.PI * raw) * 0.15);
      this._positionGhost(rGhost, r1.x + (r2.x - r1.x) * t, r1.y + arc, 1 + Math.sin(Math.PI * raw) * 0.12);

      if (raw < 1) {
        requestAnimationFrame(step);
      } else {
        kGhost.el.remove();
        rGhost.el.remove();
        this._spawnParticles(k2.x, k2.y, '#facc15', 16, 'K');
        this._spawnParticles(r2.x, r2.y, '#f59e0b', 14, 'R');
        this.labels.push({
          text: '🛡 ENROQUE 960',
          x: k2.x,
          y: Math.max(32, k2.y - k1.cell * 0.6),
          color: '#facc15',
          age: 0,
          duration: 1.0
        });
        this._ensureLoop();
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(step);
  }

  playCombatSequence({
    pieceType,
    attackerHtml,
    victimHtml,
    from,
    to,
    victimSq = null,
    flipped = false,
    onCharge,
    onImpact,
    onComplete,
    isPreview = false
  }) {
    const token = ++this._animToken;
    if (isPreview) this.pieceLayer.innerHTML = '';

    const p1 = this._sqToPx(from.r, from.c, flipped);
    const p2 = this._sqToPx(to.r, to.c, flipped);
    const pv = victimSq ? this._sqToPx(victimSq.r, victimSq.c, flipped) : p2;
    const color = this.palette[pieceType] || '#38bdf8';

    const attacker = this._createGhostPiece(attackerHtml, p1.cell);
    const victim = victimHtml ? this._createGhostPiece(victimHtml, p1.cell) : null;

    this._positionGhost(attacker, p1.x, p1.y, 1);
    if (victim) this._positionGhost(victim, pv.x, pv.y, 1);

    const timings = {
      P: { impactMs: 210, totalMs: 440 },
      N: { impactMs: 360, totalMs: 600 },
      B: { impactMs: 270, totalMs: 610 },
      R: { impactMs: 290, totalMs: 540 },
      Q: { impactMs: 300, totalMs: 650 },
      K: { impactMs: 290, totalMs: 590 }
    };
    const { impactMs, totalMs } = timings[pieceType] || timings.P;

    if (onCharge) onCharge();

    this.effects.push({
      type: 'CHARGE',
      pieceType,
      x1: p1.x,
      y1: p1.y,
      x2: pv.x,
      y2: pv.y,
      color,
      age: 0,
      duration: impactMs / 1000
    });
    this._ensureLoop();

    const start = performance.now();
    let impacted = false;

    const step = (now) => {
      if (token !== this._animToken) {
        attacker.el.remove();
        if (victim) victim.el.remove();
        return;
      }

      const elapsed = now - start;
      const preT = Math.min(1, elapsed / impactMs);
      const postT = Math.max(0, Math.min(1, (elapsed - impactMs) / (totalMs - impactMs)));

      if (pieceType === 'N') {
        const moveT = easeInOutQuad(preT);
        const arc = Math.sin(Math.PI * preT);
        const x = p1.x + (p2.x - p1.x) * moveT;
        const y = p1.y + (p2.y - p1.y) * moveT - arc * p1.cell * 1.35;
        const scale = 1 + arc * 0.58;
        const rot = (p2.x >= p1.x ? 1 : -1) * Math.sin(Math.PI * preT) * 18;
        this._positionGhost(attacker, x, y, impacted ? 1 + (1 - postT) * 0.2 : scale, impacted ? 0 : rot);
      } else if (pieceType === 'B' || pieceType === 'Q') {
        if (!impacted) {
          const pulse = 1 + Math.sin(preT * Math.PI) * 0.25;
          attacker.el.style.filter = `drop-shadow(0 0 ${14 * preT}px ${color})`;
          this._positionGhost(attacker, p1.x, p1.y, pulse);
        } else {
          const glide = easeOutCubic(postT);
          const x = p1.x + (p2.x - p1.x) * glide;
          const y = p1.y + (p2.y - p1.y) * glide;
          attacker.el.style.filter = `drop-shadow(0 0 ${12 * (1 - postT)}px ${color})`;
          this._positionGhost(attacker, x, y, 1 + (1 - postT) * 0.15);
        }
      } else if (pieceType === 'R') {
        if (preT < 0.35) {
          const vib = (Math.random() * 2 - 1) * 4;
          this._positionGhost(attacker, p1.x + vib, p1.y + vib, 1.08);
        } else {
          const chargeT = easeOutCubic((preT - 0.35) / 0.65);
          const x = p1.x + (p2.x - p1.x) * chargeT;
          const y = p1.y + (p2.y - p1.y) * chargeT;
          this._positionGhost(attacker, x, y, 1.15);
        }
      } else {
        const moveT = easeOutCubic(preT);
        const x = p1.x + (p2.x - p1.x) * moveT;
        const y = p1.y + (p2.y - p1.y) * moveT;
        const scale = impacted ? 1 + (1 - postT) * 0.22 : 1 + preT * 0.2;
        this._positionGhost(attacker, x, y, scale);
      }

      if (victim && !impacted && preT > 0.65) {
        const j = (Math.random() * 2 - 1) * 5;
        victim.el.style.filter = 'brightness(1.8)';
        this._positionGhost(victim, pv.x + j, pv.y + j, 1);
      }

      if (!impacted && elapsed >= impactMs) {
        impacted = true;
        if (victim) victim.el.remove();
        if (onImpact) onImpact();
        this._triggerImpactCanvas(pieceType, p1, pv, color, p1.cell);
      }

      if (elapsed < totalMs) {
        requestAnimationFrame(step);
      } else {
        attacker.el.remove();
        if (victim) victim.el.remove();
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(step);
  }

  /**
   * Animación cinematográfica de Jaque Mate:
   * El Rey derrotado tiembla, se agrieta en fuego/oro, se desploma de costado y estalla en pedazos.
   */
  playCheckmateSequence({ kingHtml, kingSq, flipped = false, winnerColor = 'w', onShatter, onComplete }) {
    const token = ++this._animToken;
    const pk = this._sqToPx(kingSq.r, kingSq.c, flipped);
    const ghost = this._createGhostPiece(kingHtml, pk.cell);
    this._positionGhost(ghost, pk.x, pk.y, 1, 0);

    const fallMs = 420;
    const totalMs = 1150;
    const start = performance.now();
    let shattered = false;

    // Grietas iniciales creciendo bajo el Rey antes de caer
    this.effects.push({
      type: 'MATE_CRACK',
      x2: pk.x,
      y2: pk.y,
      color: '#f43f5e',
      cell: pk.cell,
      age: 0,
      duration: fallMs / 1000
    });
    this._ensureLoop();

    const step = (now) => {
      if (token !== this._animToken) {
        ghost.el.remove();
        return;
      }

      const elapsed = now - start;

      if (!shattered) {
        const t = Math.min(1, elapsed / fallMs);
        const tilt = easeInOutQuad(t) * 86;
        const vib = (1 - t * 0.4) * 5;
        const jx = (Math.random() * 2 - 1) * vib;
        const jy = (Math.random() * 2 - 1) * vib + t * pk.cell * 0.12;
        const scale = 1 + Math.sin(t * Math.PI) * 0.16;

        ghost.el.style.filter = `brightness(${1 + t * 1.4}) drop-shadow(0 0 ${12 + t * 24}px #f43f5e)`;
        this._positionGhost(ghost, pk.x + jx, pk.y + jy, scale, tilt);

        if (elapsed >= fallMs) {
          shattered = true;
          ghost.el.remove();
          if (onShatter) onShatter();
          this._triggerCheckmateExplosion(pk, winnerColor);
        }
      }

      if (elapsed < totalMs) {
        requestAnimationFrame(step);
      } else {
        ghost.el.remove();
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(step);
  }

  _triggerCheckmateExplosion(pk, winnerColor) {
    const primary = '#f43f5e';
    const gold = '#facc15';

    this.effects.push({
      type: 'CHECKMATE',
      x2: pk.x,
      y2: pk.y,
      color: primary,
      gold,
      cell: pk.cell,
      age: 0,
      duration: 1.25
    });

    this.flashes.push({
      x: pk.x,
      y: pk.y,
      radius: pk.cell * 2.8,
      color: gold,
      age: 0,
      duration: 0.48
    });

    // Lluvia masiva de fragmentos de piedra/corona y chispas doradas
    this._spawnParticles(pk.x, pk.y, primary, 48, 'MATE_SHARD');
    this._spawnParticles(pk.x, pk.y, gold, 38, 'MATE_GOLD');

    const winnerLabel = winnerColor === 'w' ? 'BLANCAS GANAN' : 'NEGRAS GANAN';
    this.labels.push({
      text: `👑 ¡JAQUE MATE! · ${winnerLabel}`,
      x: this.width / 2,
      y: Math.max(48, Math.min(this.height - 48, pk.y - pk.cell * 0.7)),
      color: gold,
      big: true,
      age: 0,
      duration: 1.75
    });

    this._shake(16, 480);
    this._ensureLoop();
  }

  _triggerImpactCanvas(pieceType, p1, pv, color, cell) {
    this.effects.push({
      type: pieceType,
      x1: p1.x,
      y1: p1.y,
      x2: pv.x,
      y2: pv.y,
      color,
      cell,
      age: 0,
      duration: pieceType === 'Q' || pieceType === 'K' ? 0.92 : 0.76
    });

    this.flashes.push({
      x: pv.x,
      y: pv.y,
      radius: cell * (pieceType === 'Q' ? 1.8 : 1.25),
      color,
      age: 0,
      duration: 0.32
    });

    const burstCount = { P: 30, N: 42, B: 38, R: 44, Q: 64, K: 52 }[pieceType] || 32;
    this._spawnParticles(pv.x, pv.y, color, burstCount, pieceType);

    this.labels.push({
      text: ATTACK_LABELS[pieceType] || 'IMPACTO',
      x: Math.max(95, Math.min(this.width - 95, pv.x)),
      y: Math.max(38, pv.y - cell * 0.55),
      color,
      age: 0,
      duration: 1.3
    });

    const shakePower = { P: 5, N: 12, B: 7, R: 11, Q: 14, K: 12 }[pieceType] || 6;
    this._shake(shakePower, pieceType === 'Q' || pieceType === 'N' ? 360 : 250);
    this._ensureLoop();
  }

  _spawnParticles(x, y, color, count, pieceType) {
    const isMate = pieceType === 'MATE_SHARD' || pieceType === 'MATE_GOLD';
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const baseSpeed = pieceType === 'SOFT' ? 65 : isMate ? 290 : pieceType === 'Q' ? 240 : 180;
      const speed = baseSpeed * (0.3 + Math.random() * 1.15);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isMate ? 55 : 0),
        gravity: isMate ? 240 : 0,
        size: pieceType === 'SOFT' ? 2.2 : (isMate ? 3.5 + Math.random() * 6.5 : 2.5 + Math.random() * (pieceType === 'R' ? 6 : 4.5)),
        shape: (pieceType === 'R' || pieceType === 'N' || pieceType === 'MATE_SHARD') ? 'shard' : 'dot',
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 14,
        color: i % 3 === 0 ? '#ffffff' : color,
        age: 0,
        duration: pieceType === 'SOFT' ? 0.32 : (isMate ? 0.8 + Math.random() * 0.7 : 0.55 + Math.random() * 0.55)
      });
    }
  }

  _ensureLoop() {
    if (this.rafId) return;
    this.lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      this._update(dt);
      this._draw();

      if (this.effects.length || this.particles.length || this.labels.length || this.flashes.length) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  _update(dt) {
    this.effects.forEach(e => { e.age += dt; });
    this.effects = this.effects.filter(e => e.age < e.duration);

    this.flashes.forEach(f => { f.age += dt; });
    this.flashes = this.flashes.filter(f => f.age < f.duration);

    this.particles.forEach(p => {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.vx *= 0.94;
      p.vy *= 0.95;
      p.rot += p.vrot * dt;
    });
    this.particles = this.particles.filter(p => p.age < p.duration);

    this.labels.forEach(l => {
      l.age += dt;
      l.y -= (l.big ? 16 : 24) * dt;
    });
    this.labels = this.labels.filter(l => l.age < l.duration);
  }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const cell = this.width / 8;

    for (const f of this.flashes) {
      const t = f.age / f.duration;
      const alpha = 1 - t;
      ctx.save();
      const grad = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, f.radius * (0.4 + t * 0.9));
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.45, f.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = alpha * 0.92;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius * (0.4 + t * 0.9), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const e of this.effects) {
      const t = Math.min(1, e.age / e.duration);
      const alpha = 1 - t;
      ctx.save();

      if (e.type === 'TRAIL') {
        ctx.strokeStyle = e.color;
        ctx.globalAlpha = alpha * 0.45;
        ctx.lineWidth = cell * 0.22 * alpha;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();
      } else if (e.type === 'CHARGE') {
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 18;
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(e.x1, e.y1, cell * (0.75 - t * 0.45), 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(e.x2, e.y2, cell * (0.52 - t * 0.12), 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.type === 'MATE_CRACK') {
        // Fisuras incandescentes creciendo bajo el Rey antes de estallar
        ctx.strokeStyle = '#f43f5e';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 2 + t * 3;
        for (let k = 0; k < 8; k++) {
          const ang = (Math.PI * 2 * k) / 8 + 0.2;
          const len = cell * 0.85 * t;
          ctx.beginPath();
          ctx.moveTo(e.x2, e.y2);
          ctx.lineTo(e.x2 + Math.cos(ang) * len * 0.55 + 4, e.y2 + Math.sin(ang) * len * 0.55 - 4);
          ctx.lineTo(e.x2 + Math.cos(ang) * len, e.y2 + Math.sin(ang) * len);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(e.x2, e.y2, cell * (0.25 + t * 0.45), 0, Math.PI * 2);
        ctx.strokeStyle = '#facc15';
        ctx.stroke();
      } else if (e.type === 'CHECKMATE') {
        // Gran explosión real: triple onda expansiva + destello de 12 rayos + cráter dorado
        for (let ring = 0; ring < 3; ring++) {
          const rt = Math.max(0, t - ring * 0.11);
          if (rt <= 0) continue;
          ctx.beginPath();
          ctx.arc(e.x2, e.y2, cell * 3.1 * rt, 0, Math.PI * 2);
          ctx.strokeStyle = ring === 0 ? '#ffffff' : ring === 1 ? e.gold : e.color;
          ctx.shadowColor = ring === 1 ? e.gold : e.color;
          ctx.shadowBlur = 24;
          ctx.globalAlpha = Math.max(0, 1 - rt * 1.1);
          ctx.lineWidth = (9 - ring * 2) * (1 - rt);
          ctx.stroke();
        }

        // Rayos solares de coronación
        const rayLen = cell * (0.6 + t * 2.4);
        ctx.globalAlpha = alpha * 0.9;
        ctx.strokeStyle = e.gold;
        ctx.lineWidth = 4 * alpha;
        for (let k = 0; k < 12; k++) {
          const ang = (Math.PI * 2 * k) / 12 + t * 0.7;
          ctx.beginPath();
          ctx.moveTo(e.x2 + Math.cos(ang) * cell * 0.18, e.y2 + Math.sin(ang) * cell * 0.18);
          ctx.lineTo(e.x2 + Math.cos(ang) * rayLen, e.y2 + Math.sin(ang) * rayLen);
          ctx.stroke();
        }
      } else if (e.type === 'P') {
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 20;
        ctx.lineWidth = 8 * alpha;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo((e.x1 + e.x2) / 2 + 12, (e.y1 + e.y2) / 2 - 12);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();

        const slash = cell * 0.65 * (0.45 + t * 0.75);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5 * alpha;
        ctx.beginPath();
        ctx.moveTo(e.x2 - slash, e.y2 - slash);
        ctx.lineTo(e.x2 + slash, e.y2 + slash);
        ctx.moveTo(e.x2 + slash, e.y2 - slash);
        ctx.lineTo(e.x2 - slash, e.y2 + slash);
        ctx.stroke();
      } else if (e.type === 'N') {
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 18;
        ctx.globalAlpha = alpha;
        for (let k = 0; k < 6; k++) {
          const ang = (Math.PI * 2 * k) / 6 + 0.3;
          const len = cell * 0.95 * Math.min(1, t * 2.2);
          ctx.lineWidth = 3 * alpha;
          ctx.beginPath();
          ctx.moveTo(e.x2, e.y2);
          ctx.lineTo(e.x2 + Math.cos(ang) * len * 0.5 + 5, e.y2 + Math.sin(ang) * len * 0.5 - 4);
          ctx.lineTo(e.x2 + Math.cos(ang) * len, e.y2 + Math.sin(ang) * len);
          ctx.stroke();
        }
        for (let ring = 0; ring < 3; ring++) {
          const rt = Math.max(0, t - ring * 0.13);
          if (rt <= 0) continue;
          ctx.beginPath();
          ctx.arc(e.x2, e.y2, cell * 1.75 * rt, 0, Math.PI * 2);
          ctx.strokeStyle = ring === 0 ? '#ffffff' : e.color;
          ctx.globalAlpha = Math.max(0, 1 - rt * 1.15);
          ctx.lineWidth = 6 * (1 - rt);
          ctx.stroke();
        }
      } else if (e.type === 'B') {
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 28;
        ctx.lineWidth = 22 * alpha;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 7 * alpha;
        ctx.stroke();

        const r = cell * (0.35 + t * 0.9);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5 * alpha;
        ctx.beginPath();
        ctx.moveTo(e.x2, e.y2 - r);
        ctx.lineTo(e.x2 + r, e.y2);
        ctx.lineTo(e.x2, e.y2 + r);
        ctx.lineTo(e.x2 - r, e.y2);
        ctx.closePath();
        ctx.stroke();
      } else if (e.type === 'R') {
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 24;
        ctx.lineWidth = cell * 0.62 * alpha;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();

        const s = cell * (0.65 + t * 1.25);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6 * alpha;
        ctx.strokeRect(e.x2 - s / 2, e.y2 - s / 2, s, s);
      } else if (e.type === 'Q') {
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 32;
        ctx.lineWidth = 24 * alpha;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 7 * alpha;
        ctx.stroke();

        const starR = cell * (0.5 + t * 1.45);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4 * alpha;
        for (let k = 0; k < 8; k++) {
          const ang = (Math.PI * k) / 4 + t * 1.2;
          ctx.beginPath();
          ctx.moveTo(e.x2, e.y2);
          ctx.lineTo(e.x2 + Math.cos(ang) * starR, e.y2 + Math.sin(ang) * starR);
          ctx.stroke();
        }

        ctx.strokeStyle = e.color;
        ctx.lineWidth = 5 * alpha;
        ctx.beginPath();
        ctx.arc(e.x2, e.y2, cell * 1.9 * t, 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.type === 'K') {
        const w = cell * 0.9 * alpha;
        const grad = ctx.createLinearGradient(e.x2, 0, e.x2, e.y2 + cell * 0.45);
        grad.addColorStop(0, 'rgba(250, 204, 21, 0)');
        grad.addColorStop(0.65, e.color);
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.globalAlpha = alpha * 0.92;
        ctx.fillRect(e.x2 - w / 2, 0, w, e.y2 + cell * 0.35);

        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 24;
        ctx.lineWidth = 6 * alpha;
        ctx.beginPath();
        ctx.arc(e.x2, e.y2, cell * (0.35 + t * 1.25), 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 * alpha;
        ctx.beginPath();
        ctx.arc(e.x2, e.y2, cell * (0.2 + t * 0.8), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    for (const p of this.particles) {
      const alpha = Math.max(0, 1 - p.age / p.duration);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      if (p.shape === 'shard') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const s = p.size * (0.5 + alpha * 0.7);
        ctx.fillRect(-s / 2, -s / 2, s, s * 1.4);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (const l of this.labels) {
      const alpha = Math.min(1, (1 - l.age / l.duration) * 1.6);
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = l.big ? '900 17px Inter, system-ui, sans-serif' : '800 13px Inter, system-ui, sans-serif';
      const padX = l.big ? 18 : 12;
      const tw = ctx.measureText(l.text).width;
      const bw = tw + padX * 2;
      const bh = l.big ? 36 : 26;

      ctx.fillStyle = l.big ? 'rgba(15, 10, 18, 0.94)' : 'rgba(9, 13, 22, 0.88)';
      ctx.strokeStyle = l.color;
      ctx.lineWidth = l.big ? 2.5 : 1.8;
      ctx.beginPath();
      ctx.roundRect(l.x - bw / 2, l.y - bh / 2, bw, bh, 999);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = l.color;
      ctx.shadowBlur = l.big ? 16 : 10;
      ctx.fillText(l.text, l.x, l.y + 0.5);
      ctx.restore();
    }
  }
}
