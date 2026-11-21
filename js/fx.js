const DEFAULT_PALETTE = {
  P: '#38bdf8', // Estocada Relámpago
  N: '#f59e0b', // Salto Sísmico
  B: '#a855f7', // Rayo Diagonal
  R: '#ef4444', // Embestida de Ariete
  Q: '#ec4899', // Nova Real
  K: '#facc15'  // Juicio Soberano
};

const ATTACK_LABELS = {
  P: 'ESTOCADA RELÁMPAGO',
  N: 'SALTO SÍSMICO',
  B: 'RAYO DIAGONAL',
  R: 'EMBESTIDA ARIETE',
  Q: 'NOVA REAL',
  K: 'JUICIO SOBERANO'
};

export class CombatFX {
  constructor(canvas, boardWrapper) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.boardWrapper = boardWrapper;
    this.palette = { ...DEFAULT_PALETTE };

    this.effects = [];
    this.particles = [];
    this.labels = [];
    this.rafId = null;
    this.lastTime = 0;

    this._resize();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this._resize()).observe(boardWrapper);
    }
    window.addEventListener('resize', () => this._resize());
  }

  setPalette(customPalette) {
    this.palette = { ...DEFAULT_PALETTE, ...customPalette };
  }

  _resize() {
    const rect = this.boardWrapper.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width || 500;
    this.height = rect.height || 500;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _sqToPx(r, c, flipped) {
    const vr = flipped ? 7 - r : r;
    const vc = flipped ? 7 - c : c;
    const cell = this.width / 8;
    return {
      x: (vc + 0.5) * cell,
      y: (vr + 0.5) * cell
    };
  }

  _shake(intensity = 6, duration = 220) {
    const start = performance.now();
    const step = (now) => {
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

  triggerAttack({ pieceType, from, to, flipped = false }) {
    const p1 = this._sqToPx(from.r, from.c, flipped);
    const p2 = this._sqToPx(to.r, to.c, flipped);
    const color = this.palette[pieceType] || '#38bdf8';

    this.effects.push({
      type: pieceType,
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      color,
      age: 0,
      duration: pieceType === 'Q' || pieceType === 'K' ? 0.65 : 0.48
    });

    const burstCount = pieceType === 'Q' ? 42 : pieceType === 'K' ? 34 : pieceType === 'R' ? 30 : 22;
    this._spawnParticles(p2.x, p2.y, color, burstCount, pieceType);

    this.labels.push({
      text: ATTACK_LABELS[pieceType] || 'IMPACTO',
      x: p2.x,
      y: Math.max(28, p2.y - 18),
      color,
      age: 0,
      duration: 0.9
    });

    const shakePower = { P: 3, N: 7, B: 4, R: 8, Q: 10, K: 8 }[pieceType] || 4;
    this._shake(shakePower, pieceType === 'Q' ? 300 : 210);

    this._ensureLoop();
  }

  triggerPreview(pieceType, flipped = false) {
    const samples = {
      P: { from: { r: 5, c: 3 }, to: { r: 4, c: 4 } },
      N: { from: { r: 5, c: 2 }, to: { r: 3, c: 3 } },
      B: { from: { r: 6, c: 1 }, to: { r: 2, c: 5 } },
      R: { from: { r: 6, c: 3 }, to: { r: 2, c: 3 } },
      Q: { from: { r: 6, c: 4 }, to: { r: 3, c: 4 } },
      K: { from: { r: 4, c: 3 }, to: { r: 3, c: 4 } }
    };
    const s = samples[pieceType] || samples.Q;
    this.triggerAttack({ pieceType, from: s.from, to: s.to, flipped });
  }

  _spawnParticles(x, y, color, count, pieceType) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = (pieceType === 'Q' ? 170 : 120) * (0.4 + Math.random() * 0.9);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * (pieceType === 'R' ? 4.5 : 3.2),
        color: i % 3 === 0 ? '#ffffff' : color,
        age: 0,
        duration: 0.35 + Math.random() * 0.38
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

      if (this.effects.length || this.particles.length || this.labels.length) {
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

    this.particles.forEach(p => {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
    });
    this.particles = this.particles.filter(p => p.age < p.duration);

    this.labels.forEach(l => {
      l.age += dt;
      l.y -= 26 * dt;
    });
    this.labels = this.labels.filter(l => l.age < l.duration);
  }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const cell = this.width / 8;

    for (const e of this.effects) {
      const t = Math.min(1, e.age / e.duration);
      const alpha = 1 - t;
      ctx.save();

      if (e.type === 'P') {
        // Estocada cortante + destello X
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 6 * alpha;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();

        const slash = cell * 0.42 * (0.5 + t * 0.7);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 * alpha;
        ctx.beginPath();
        ctx.moveTo(e.x2 - slash, e.y2 - slash);
        ctx.lineTo(e.x2 + slash, e.y2 + slash);
        ctx.moveTo(e.x2 + slash, e.y2 - slash);
        ctx.lineTo(e.x2 - slash, e.y2 + slash);
        ctx.stroke();
      } else if (e.type === 'N') {
        // Arco parabólico + ondas sísmicas concéntricas
        const mx = (e.x1 + e.x2) / 2;
        const my = Math.min(e.y1, e.y2) - cell * 1.1;
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 16;
        ctx.lineWidth = 5 * alpha;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.quadraticCurveTo(mx, my, e.x2, e.y2);
        ctx.stroke();

        for (let ring = 0; ring < 3; ring++) {
          const rt = Math.max(0, t - ring * 0.12);
          if (rt <= 0) continue;
          ctx.beginPath();
          ctx.arc(e.x2, e.y2, cell * 1.25 * rt, 0, Math.PI * 2);
          ctx.strokeStyle = ring === 0 ? '#ffffff' : e.color;
          ctx.globalAlpha = Math.max(0, 1 - rt * 1.15);
          ctx.lineWidth = 4 * (1 - rt);
          ctx.stroke();
        }
      } else if (e.type === 'B') {
        // Rayo láser prismático diagonal
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 22;
        ctx.lineWidth = 14 * alpha;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4 * alpha;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(e.x2, e.y2, cell * 0.55 * (0.3 + t), 0, Math.PI * 2);
        ctx.fillStyle = e.color;
        ctx.globalAlpha = alpha * 0.4;
        ctx.fill();
      } else if (e.type === 'R') {
        // Corredor de ariete + muro de choque
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = cell * 0.45 * alpha;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5 * alpha;
        ctx.strokeRect(
          e.x2 - cell * (0.35 + t * 0.4),
          e.y2 - cell * (0.35 + t * 0.4),
          cell * (0.7 + t * 0.8),
          cell * (0.7 + t * 0.8)
        );
      } else if (e.type === 'Q') {
        // Rayo real + explosión Nova radial
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 26;
        ctx.lineWidth = 16 * alpha;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();

        const grad = ctx.createRadialGradient(e.x2, e.y2, 2, e.x2, e.y2, cell * 1.45 * (0.25 + t));
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, e.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(e.x2, e.y2, cell * 1.45 * (0.25 + t), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 * alpha;
        ctx.beginPath();
        ctx.arc(e.x2, e.y2, cell * 1.5 * t, 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.type === 'K') {
        // Pilar descendente de luz soberana + halo dorado
        const grad = ctx.createLinearGradient(e.x2, 0, e.x2, e.y2 + cell * 0.4);
        grad.addColorStop(0, 'rgba(250, 204, 21, 0)');
        grad.addColorStop(0.7, e.color);
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillRect(e.x2 - cell * 0.32 * alpha, 0, cell * 0.64 * alpha, e.y2 + cell * 0.25);

        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 20;
        ctx.lineWidth = 5 * alpha;
        ctx.beginPath();
        ctx.arc(e.x2, e.y2, cell * (0.3 + t * 0.85), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Partículas
    for (const p of this.particles) {
      const alpha = Math.max(0, 1 - p.age / p.duration);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Etiquetas flotantes
    for (const l of this.labels) {
      const alpha = Math.max(0, 1 - l.age / l.duration);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '800 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#090d16';
      ctx.fillText(l.text, l.x + 1, l.y + 1);
      ctx.fillStyle = l.color;
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 10;
      ctx.fillText(l.text, l.x, l.y);
      ctx.restore();
    }
  }
}
