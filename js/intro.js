// Cambia aquí el nombre comercial cuando elijas el definitivo
export const APP_BRAND = {
  name: 'AJEDREZ TÁCTICO',
  tagline: 'CLÁSICO · FISCHER 960 · COMBATE ANIMADO'
};

function ensureIntroStyles() {
  if (document.querySelector('style[data-intro-css]')) return;
  const style = document.createElement('style');
  style.dataset.introCss = 'true';
  style.textContent = `
    .intro-screen {
      position: fixed; inset: 0; z-index: 220;
      background: radial-gradient(circle at 50% 42%, #172554 0%, #090d16 62%, #020617 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 18px; padding: 24px; text-align: center; cursor: pointer;
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .intro-screen.fade-out { opacity: 0; transform: scale(1.04); pointer-events: none; }
    .intro-stage {
      position: relative; width: 152px; height: 152px;
      display: grid; place-items: center;
    }
    .intro-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 2px solid rgba(56, 189, 248, 0.35);
      box-shadow: 0 0 38px rgba(56, 189, 248, 0.35), inset 0 0 28px rgba(250, 204, 21, 0.2);
      animation: introSpin 5s linear infinite;
    }
    .intro-ring::after {
      content: ''; position: absolute; top: -5px; left: 50%;
      width: 10px; height: 10px; border-radius: 50%;
      background: #facc15; box-shadow: 0 0 14px #facc15;
    }
    .intro-crest {
      font-size: 4.2rem; line-height: 1;
      background: linear-gradient(135deg, #38bdf8, #facc15 55%, #f59e0b);
      -webkit-background-clip: text; background-clip: text; color: transparent;
      filter: drop-shadow(0 0 22px rgba(250, 204, 21, 0.45));
      animation: introPop 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .intro-clash { position: absolute; font-size: 1.95rem; opacity: 0; }
    .intro-clash.left { left: -14px; color: #38bdf8; animation: clashL 1.1s 0.25s ease forwards; }
    .intro-clash.right { right: -14px; color: #f43f5e; animation: clashR 1.1s 0.25s ease forwards; }
    .intro-title {
      font-size: clamp(1.6rem, 5vw, 2.3rem); font-weight: 900; letter-spacing: 0.14em;
      color: #f8fafc; text-shadow: 0 0 24px rgba(56, 189, 248, 0.45);
      opacity: 0; animation: introFadeUp 0.75s 0.35s ease forwards;
    }
    .intro-tag {
      font-size: 0.78rem; font-weight: 700; letter-spacing: 0.22em; color: #94a3b8;
      opacity: 0; animation: introFadeUp 0.75s 0.55s ease forwards;
    }
    .intro-bar {
      width: min(250px, 70vw); height: 4px; border-radius: 999px;
      background: rgba(148, 163, 184, 0.2); overflow: hidden; margin-top: 8px;
    }
    .intro-bar-fill {
      height: 100%; width: 0%;
      background: linear-gradient(90deg, #38bdf8, #facc15);
      animation: introLoad 3.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    .intro-skip {
      position: absolute; bottom: 26px; font-size: 0.74rem;
      color: rgba(148, 163, 184, 0.72); letter-spacing: 0.08em;
    }
    @keyframes introSpin { to { transform: rotate(360deg); } }
    @keyframes introPop {
      0% { transform: scale(0.4) rotate(-12deg); opacity: 0; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    @keyframes clashL {
      0% { transform: translateX(-34px) rotate(-25deg); opacity: 0; }
      55% { transform: translateX(12px) rotate(10deg); opacity: 1; }
      100% { transform: translateX(0) rotate(-6deg); opacity: 0.85; }
    }
    @keyframes clashR {
      0% { transform: translateX(34px) rotate(25deg); opacity: 0; }
      55% { transform: translateX(-12px) rotate(-10deg); opacity: 1; }
      100% { transform: translateX(0) rotate(6deg); opacity: 0.85; }
    }
    @keyframes introFadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes introLoad { to { width: 100%; } }
  `;
  document.head.appendChild(style);
}

export function runCinematicIntro() {
  ensureIntroStyles();

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'intro-screen';
    overlay.id = 'intro-screen';
    overlay.innerHTML = `
      <div class="intro-stage">
        <div class="intro-ring"></div>
        <span class="intro-clash left">♞</span>
        <span class="intro-crest">♛</span>
        <span class="intro-clash right">♜</span>
      </div>
      <div class="intro-title">${APP_BRAND.name}</div>
      <div class="intro-tag">${APP_BRAND.tagline}</div>
      <div class="intro-bar"><div class="intro-bar-fill"></div></div>
      <div class="intro-skip">Toca en cualquier parte para saltar</div>
    `;
    document.body.appendChild(overlay);

    let closed = false;
    const dismiss = () => {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 450);
    };

    const timer = setTimeout(dismiss, 3400);
    overlay.addEventListener('click', dismiss);
  });
}
