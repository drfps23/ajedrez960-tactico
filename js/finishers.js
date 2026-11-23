export const PIECE_LIST = [
  { id: 'P', icon: '♟', name: 'Peón' },
  { id: 'N', icon: '♞', name: 'Caballo' },
  { id: 'B', icon: '♝', name: 'Alfil' },
  { id: 'R', icon: '♜', name: 'Torre' },
  { id: 'Q', icon: '♛', name: 'Dama' },
  { id: 'K', icon: '♚', name: 'Rey' }
];

export const TRAILS = [
  { id: 'standard',  name: 'Clásica',          tier: 'free',   icon: '〰️', color: '#38bdf8', desc: 'Estela limpia del color del tema.' },
  { id: 'lightning', name: 'Relámpago Dorado', tier: 'pro',    icon: '⚡', color: '#facc15', desc: 'Arco eléctrico dorado con chispas.' },
  { id: 'frost',     name: 'Escarcha Azul',    tier: 'pro',    icon: '❄️', color: '#67e8f9', desc: 'Cristales helados al deslizarse.' },
  { id: 'phoenix',   name: 'Fuego Fénix',      tier: 'master', icon: '🔥', color: '#f97316', desc: 'Rastro ardiente de brasas vivas.' },
  { id: 'stardust',  name: 'Polvo Estelar',    tier: 'master', icon: '✨', color: '#c084fc', desc: 'Estela cósmica con destellos.' }
];

export const ATTACK_STYLES = [
  { id: 'theme',   name: 'Del Tema',       tier: 'free',   icon: '🎨', color: null,      desc: 'Usa el estilo base del tablero.' },
  { id: 'frost',   name: 'Hielo Glacial',  tier: 'pro',    icon: '❄️', color: '#67e8f9', desc: 'Explosión cristalina de escarcha.' },
  { id: 'inferno', name: 'Fuego Infernal', tier: 'pro',    icon: '🔥', color: '#f97316', desc: 'Anillo ardiente y cenizas vivas.' },
  { id: 'thunder', name: 'Rayo Dorado',    tier: 'master', icon: '⚡', color: '#facc15', desc: 'Descarga eléctrica de alto voltaje.' },
  { id: 'void',    name: 'Vacío Arcano',   tier: 'master', icon: '🔮', color: '#c084fc', desc: 'Implosión violeta dimensional.' },
  { id: 'plasma',  name: 'Ciber-Plasma',   tier: 'master', icon: '💠', color: '#22d3ee', desc: 'Doble pulso geométrico neón.' }
];

export const FINISHERS = [
  { id: 'royal_blast',      name: 'Explosión Real',   tier: 'free',   icon: '💥', desc: 'El Rey se agrieta, cae de costado y estalla.' },
  { id: 'celestial_pillar', name: 'Juicio Celestial', tier: 'pro',    icon: '☀️', desc: 'Un pilar de luz dorada vaporiza al Rey.' },
  { id: 'void_vortex',      name: 'Vórtice Oscuro',   tier: 'master', icon: '🌀', desc: 'Un agujero negro absorbe al Rey girando.' },
  { id: 'seismic_shatter',  name: 'Muro Sísmico',     tier: 'master', icon: '🌋', desc: 'Fisuras volcánicas destruyen la casilla del Rey.' }
];

function drawCustomCanvasEffects(fx) {
  const ctx = fx.ctx;
  const cell = fx.width / 8;

  for (const e of fx.effects) {
    const t = Math.min(1, e.age / e.duration);
    const alpha = Math.max(0, 1 - t);

    if (e.type === 'TR_LIGHTNING') {
      ctx.save();
      ctx.strokeStyle = '#facc15'; ctx.shadowColor = '#facc15'; ctx.shadowBlur = 18;
      ctx.globalAlpha = alpha; ctx.lineWidth = 4.5 * alpha;
      ctx.beginPath(); ctx.moveTo(e.x1, e.y1);
      for (let s = 1; s < 5; s++) {
        const k = s / 5;
        ctx.lineTo(e.x1 + (e.x2 - e.x1) * k + Math.sin(s * 9 + e.seed) * 10, e.y1 + (e.y2 - e.y1) * k + Math.cos(s * 7 + e.seed) * 10);
      }
      ctx.lineTo(e.x2, e.y2); ctx.stroke(); ctx.restore();
    } else if (e.type === 'TR_FROST') {
      ctx.save();
      ctx.strokeStyle = '#67e8f9'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 16;
      ctx.globalAlpha = alpha * 0.85; ctx.lineWidth = cell * 0.24 * alpha; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke();
      for (let s = 1; s <= 3; s++) {
        const k = s / 4, sx = e.x1 + (e.x2 - e.x1) * k, sy = e.y1 + (e.y2 - e.y1) * k, r = 7 * alpha;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * alpha;
        ctx.beginPath();
        ctx.moveTo(sx - r, sy); ctx.lineTo(sx + r, sy);
        ctx.moveTo(sx, sy - r); ctx.lineTo(sx, sy + r);
        ctx.stroke();
      }
      ctx.restore();
    } else if (e.type === 'TR_PHOENIX') {
      ctx.save();
      const grad = ctx.createLinearGradient(e.x1, e.y1, e.x2, e.y2);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0)'); grad.addColorStop(0.5, '#f97316'); grad.addColorStop(1, '#fde047');
      ctx.strokeStyle = grad; ctx.shadowColor = '#f97316'; ctx.shadowBlur = 20;
      ctx.globalAlpha = alpha * 0.9; ctx.lineWidth = cell * 0.34 * alpha; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke(); ctx.restore();
    } else if (e.type === 'TR_STARDUST') {
      ctx.save();
      ctx.strokeStyle = '#c084fc'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 16;
      ctx.globalAlpha = alpha * 0.78; ctx.lineWidth = cell * 0.22 * alpha; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke();
      for (let s = 1; s <= 4; s++) {
        const k = s / 5, sx = e.x1 + (e.x2 - e.x1) * k, sy = e.y1 + (e.y2 - e.y1) * k, r = 6 * alpha;
        ctx.fillStyle = s % 2 ? '#ffffff' : '#38bdf8';
        ctx.fillRect(sx - r, sy - 1, r * 2, 2); ctx.fillRect(sx - 1, sy - r, 2, r * 2);
      }
      ctx.restore();
    } else if (e.type === 'ATK_BURST') {
      ctx.save();
      ctx.strokeStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 22;
      ctx.globalAlpha = alpha; ctx.lineWidth = 4.5 * alpha;
      const r = cell * (0.3 + t * 1.35);
      if (e.style === 'frost') {
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI * k) / 3;
          ctx.beginPath(); ctx.moveTo(e.x2, e.y2); ctx.lineTo(e.x2 + Math.cos(a) * r, e.y2 + Math.sin(a) * r); ctx.stroke();
        }
      } else if (e.style === 'plasma') {
        ctx.strokeRect(e.x2 - r * 0.7, e.y2 - r * 0.7, r * 1.4, r * 1.4);
      } else {
        ctx.beginPath(); ctx.arc(e.x2, e.y2, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    } else if (e.type === 'FIN_CELESTIAL') {
      ctx.save();
      const w = cell * (1.55 * (1 - t * 0.45));
      const grad = ctx.createLinearGradient(e.x2, 0, e.x2, e.y2 + cell * 0.6);
      grad.addColorStop(0, 'rgba(250, 204, 21, 0.08)'); grad.addColorStop(0.65, '#facc15'); grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad; ctx.globalAlpha = alpha * 0.92;
      ctx.fillRect(e.x2 - w / 2, 0, w, e.y2 + cell * 0.45);
      ctx.strokeStyle = '#ffffff'; ctx.shadowColor = '#facc15'; ctx.shadowBlur = 26; ctx.lineWidth = 6 * alpha;
      ctx.beginPath(); ctx.arc(e.x2, e.y2, cell * (0.4 + t * 2.6), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    } else if (e.type === 'FIN_VORTEX') {
      ctx.save();
      const maxR = Math.max(8, cell * (1.75 - Math.abs(t - 0.5) * 1.4));
      const grad = ctx.createRadialGradient(e.x2, e.y2, 2, e.x2, e.y2, maxR);
      grad.addColorStop(0, '#020617'); grad.addColorStop(0.55, '#7e22ce'); grad.addColorStop(0.85, '#38bdf8'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = Math.min(1, alpha * 1.35); ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(e.x2, e.y2, maxR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e879f9'; ctx.lineWidth = 3.5 * alpha;
      for (let arm = 0; arm < 5; arm++) {
        const base = (Math.PI * 2 * arm) / 5 + t * 9;
        ctx.beginPath(); ctx.arc(e.x2, e.y2, maxR * 0.72, base, base + 1.15); ctx.stroke();
      }
      ctx.restore();
    } else if (e.type === 'FIN_SEISMIC') {
      ctx.save();
      ctx.strokeStyle = '#f97316'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 22; ctx.globalAlpha = alpha;
      for (let k = 0; k < 10; k++) {
        const ang = (Math.PI * 2 * k) / 10 + 0.15, len = cell * 2.5 * Math.min(1, t * 2.1);
        ctx.lineWidth = 5 * alpha;
        ctx.beginPath(); ctx.moveTo(e.x2, e.y2);
        ctx.lineTo(e.x2 + Math.cos(ang) * len * 0.45 + 7, e.y2 + Math.sin(ang) * len * 0.45 - 6);
        ctx.lineTo(e.x2 + Math.cos(ang) * len, e.y2 + Math.sin(ang) * len); ctx.stroke();
      }
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 7 * alpha;
      ctx.beginPath(); ctx.arc(e.x2, e.y2, cell * 2.6 * t, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  }
}

export function playCustomFinisher(fx, finisherId, opts, fallbackFn) {
  if (finisherId === 'royal_blast' || !finisherId) return fallbackFn(opts);

  const { kingHtml, kingSq, flipped = false, winnerColor = 'w', onComplete } = opts;
  const token = ++fx._animToken;
  const pk = fx._sqToPx(kingSq.r, kingSq.c, flipped);
  const ghost = fx._createGhostPiece(kingHtml, pk.cell);
  fx._positionGhost(ghost, pk.x, pk.y, 1, 0);

  const phaseMs = 460, totalMs = 1220, start = performance.now();
  let triggered = false;
  const winText = winnerColor === 'w' ? 'BLANCAS GANAN' : 'NEGRAS GANAN';

  if (finisherId === 'void_vortex') {
    fx.effects.push({ type: 'FIN_VORTEX', x2: pk.x, y2: pk.y, age: 0, duration: 1.25 });
    fx._ensureLoop();
  }

  const step = (now) => {
    if (token !== fx._animToken) { ghost.el.remove(); return; }
    const elapsed = now - start;
    if (!triggered) {
      const t = Math.min(1, elapsed / phaseMs);
      if (finisherId === 'celestial_pillar') {
        ghost.el.style.filter = `brightness(${1 + t * 2.4}) drop-shadow(0 0 ${24 * t}px #facc15)`;
        fx._positionGhost(ghost, pk.x, pk.y - t * pk.cell * 0.35, 1 + t * 0.18, (Math.random() - 0.5) * 8);
      } else if (finisherId === 'void_vortex') {
        ghost.el.style.filter = `hue-rotate(${t * 140}deg) drop-shadow(0 0 18px #c084fc)`;
        fx._positionGhost(ghost, pk.x, pk.y, Math.max(0.12, 1 - t * 0.88), t * 620);
      } else {
        ghost.el.style.filter = 'drop-shadow(0 0 18px #ef4444)';
        fx._positionGhost(ghost, pk.x + (Math.random() * 2 - 1) * 7, pk.y + t * 8, 1 + t * 0.12, t * 82);
      }
      if (elapsed >= phaseMs) {
        triggered = true; ghost.el.remove();
        if (finisherId === 'celestial_pillar') {
          fx.effects.push({ type: 'FIN_CELESTIAL', x2: pk.x, y2: pk.y, age: 0, duration: 1.15 });
          fx._spawnParticles(pk.x, pk.y, '#facc15', 56, 'MATE_GOLD');
          fx.labels.push({ text: `☀️ JUICIO CELESTIAL · ${winText}`, x: fx.width / 2, y: Math.max(46, pk.y - pk.cell * 0.7), color: '#facc15', big: true, age: 0, duration: 1.7 });
          fx._shake(12, 420);
        } else if (finisherId === 'void_vortex') {
          fx._spawnParticles(pk.x, pk.y, '#c084fc', 54, 'MATE_GOLD');
          fx._spawnParticles(pk.x, pk.y, '#38bdf8', 36, 'MATE_SHARD');
          fx.labels.push({ text: `🌀 VÓRTICE OSCURO · ${winText}`, x: fx.width / 2, y: Math.max(46, pk.y - pk.cell * 0.7), color: '#c084fc', big: true, age: 0, duration: 1.7 });
          fx._shake(14, 460);
        } else {
          fx.effects.push({ type: 'FIN_SEISMIC', x2: pk.x, y2: pk.y, age: 0, duration: 1.15 });
          fx._spawnParticles(pk.x, pk.y, '#f97316', 54, 'MATE_SHARD');
          fx._spawnParticles(pk.x, pk.y, '#fde047', 34, 'MATE_GOLD');
          fx.labels.push({ text: `🌋 MURO SÍSMICO · ${winText}`, x: fx.width / 2, y: Math.max(46, pk.y - pk.cell * 0.7), color: '#f97316', big: true, age: 0, duration: 1.7 });
          fx._shake(18, 520);
        }
        fx._ensureLoop();
      }
    }
    if (elapsed < totalMs) requestAnimationFrame(step);
    else { ghost.el.remove(); onComplete?.(); }
  };
  requestAnimationFrame(step);
}

export function upgradeFxInstance(fx, getLoadout) {
  if (!fx || fx._armoryUpgraded) return;
  fx._armoryUpgraded = true;

  const origDraw = fx._draw.bind(fx);
  fx._draw = () => {
    origDraw();
    drawCustomCanvasEffects(fx);
  };

  // Estela individual según la pieza que se mueve
  const origMove = fx.animateRegularMove.bind(fx);
  fx.animateRegularMove = (opts) => {
    const trailId = getLoadout()?.pieceTrails?.[opts.pieceType] || 'standard';
    if (trailId !== 'standard') {
      const p1 = fx._sqToPx(opts.from.r, opts.from.c, opts.flipped);
      const p2 = fx._sqToPx(opts.to.r, opts.to.c, opts.flipped);
      const map = { lightning: 'TR_LIGHTNING', frost: 'TR_FROST', phoenix: 'TR_PHOENIX', stardust: 'TR_STARDUST' };
      const tObj = TRAILS.find(t => t.id === trailId);
      if (map[trailId]) {
        fx.effects.push({ type: map[trailId], x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, seed: Math.random() * 10, age: 0, duration: 0.56 });
        fx._spawnParticles(p2.x, p2.y, tObj?.color || '#facc15', 14, 'SOFT');
        fx._ensureLoop();
      }
    }
    return origMove(opts);
  };

  // Energía de ataque individual según la pieza atacante
  const origCombat = fx.playCombatSequence.bind(fx);
  fx.playCombatSequence = (opts) => {
    const styleId = getLoadout()?.pieceAttacks?.[opts.pieceType] || 'theme';
    const styleObj = ATTACK_STYLES.find(s => s.id === styleId);
    const wrappedOpts = { ...opts };

    if (styleObj && styleObj.color) {
      const prevOnImpact = opts.onImpact;
      wrappedOpts.onImpact = () => {
        const pv = fx._sqToPx((opts.victimSq || opts.to).r, (opts.victimSq || opts.to).c, opts.flipped);
        fx.effects.push({ type: 'ATK_BURST', style: styleId, x2: pv.x, y2: pv.y, color: styleObj.color, age: 0, duration: 0.65 });
        fx._ensureLoop();
        prevOnImpact?.();
      };
    }
    return origCombat(wrappedOpts);
  };

  const origMate = fx.playCheckmateSequence.bind(fx);
  fx.playCheckmateSequence = (opts) => {
    const fin = getLoadout()?.finisher || 'royal_blast';
    return playCustomFinisher(fx, fin, opts, origMate);
  };
}
