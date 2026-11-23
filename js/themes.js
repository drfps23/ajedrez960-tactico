const STORAGE_KEY = 'ajedrez960_theme_v1';

function ensureThemesStylesheet() {
  if (!document.querySelector('link[data-themes-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/themes.css';
    link.dataset.themesCss = 'true';
    document.head.appendChild(link);
  }

  if (!document.querySelector('style[data-lewis-theme]')) {
    const style = document.createElement('style');
    style.dataset.lewisTheme = 'true';
    style.textContent = `
      html[data-theme="magic"] {
        --bg-main: #0d0c10;
        --bg-panel: #17141a;
        --bg-card: #201b22;
        --border-color: rgba(217, 165, 68, 0.30);
        --text-main: #f4eee1;
        --text-muted: #b8aa96;

        --sq-light: #cfc5b1;
        --sq-dark: #2c2a30;
        --sq-selected: rgba(217, 165, 68, 0.52);
        --sq-last-from: rgba(185, 28, 28, 0.28);
        --sq-last-to: rgba(217, 165, 68, 0.44);
        --sq-castle: rgba(234, 179, 8, 0.58);

        --accent-cyan: #eab308;
        --accent-crimson: #dc2626;
        --accent-gold: #facc15;
        --accent-violet: #991b1b;

        --board-border: #6e5326;
        --board-shadow: 0 26px 60px rgba(0, 0, 0, 0.85), 0 0 32px rgba(217, 165, 68, 0.18);
      }
      html[data-theme="magic"] body {
        background: radial-gradient(circle at top, #291d1a 0%, #0b0a0e 70%);
      }
      html[data-theme="magic"] .square.light {
        background-image:
          linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(120,104,80,0.16) 100%),
          repeating-linear-gradient(45deg, rgba(80,68,52,0.04) 0px, rgba(80,68,52,0.04) 2px, transparent 2px, transparent 10px);
      }
      html[data-theme="magic"] .square.dark {
        background-image:
          linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.34) 100%),
          radial-gradient(circle at 25% 25%, rgba(217, 165, 68, 0.08), transparent 65%);
      }
      html[data-theme="magic"] .square.light .coord-rank,
      html[data-theme="magic"] .square.light .coord-file { color: #3d3224; opacity: 0.78; }
      html[data-theme="magic"] .square.dark .coord-rank,
      html[data-theme="magic"] .square.dark .coord-file { color: #dfd4be; opacity: 0.72; }
      html[data-theme="magic"] .move-dot {
        background: rgba(217, 165, 68, 0.85);
        box-shadow: 0 0 12px rgba(234, 179, 8, 0.75);
      }
    `;
    document.head.appendChild(style);
  }
}

function renderClassicSculptedSvg(type, color, pal) {
  const c = color === 'w' ? pal.w : pal.b;
  const shapes = {
    P: `<ellipse cx="22.5" cy="39" rx="12" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <path d="M12 37.5c0-4.2 4.5-6.5 10.5-6.5S33 33.3 33 37.5v2H12v-2z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.9"/>
        <path d="M16.5 21h12l-2 10h-8l-2-10z" fill="${c.shade}" stroke="${c.stroke}" stroke-width="1.9"/>
        <circle cx="22.5" cy="14" r="6" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.9"/>
        <circle cx="20.6" cy="12" r="1.8" fill="${c.hi}" opacity="0.65"/>
        <rect x="15" y="19.5" width="15" height="2.6" rx="1.2" fill="${c.accent}" stroke="${c.stroke}" stroke-width="1.1"/>`,
    R: `<ellipse cx="22.5" cy="39.5" rx="13.5" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <path d="M10.5 9.5h5v4.2h4.2V9.5h5.6v4.2h4.2V9.5h5v7.5l-3.8 3.2v11.8l3.3 3v4H11v-4l3.3-3V20.2l-3.8-3.2V9.5z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <rect x="14.5" y="20" width="16" height="12" fill="${c.shade}" opacity="0.7"/>
        <rect x="13" y="18.2" width="19" height="2.6" rx="1" fill="${c.accent}"/>
        <rect x="13" y="32" width="19" height="2.6" rx="1" fill="${c.accent}"/>`,
    N: `<ellipse cx="22.5" cy="39.5" rx="13.5" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <path d="M12 38.5v-3.8l4.5-4.8c-2.5-1.4-4.5-4.6-3.8-8.2l-3.2-1.8 4.2-7.5 4.8-4.2 3.2 2.6c5-.4 10.2 3.5 11.4 10.6 1 5.6-1 10.5-3.4 13.5l3.3 3.6H12z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M24 12.5c3.5 1.8 5.8 6.5 5.2 12.5-.5 4.5-2.6 7.4-5.2 9.2" fill="none" stroke="${c.accent}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="19.5" cy="16.5" r="1.8" fill="${c.accent}"/>
        <rect x="11.5" y="35.5" width="22" height="3.5" rx="1.4" fill="${c.shade}" stroke="${c.stroke}" stroke-width="1.6"/>`,
    B: `<ellipse cx="22.5" cy="39.5" rx="13" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <circle cx="22.5" cy="8.2" r="2.8" fill="${c.accent}" stroke="${c.stroke}" stroke-width="1.5"/>
        <path d="M22.5 11.2c-6 3.5-8.5 9.5-6.8 15.8h13.6c1.7-6.3-.8-12.3-6.8-15.8z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.9"/>
        <path d="M18.8 19.2h7.4M22.5 15.5v7.4" stroke="${c.accent}" stroke-width="2.3" stroke-linecap="round"/>
        <rect x="15" y="27" width="15" height="3" rx="1.2" fill="${c.accent}" stroke="${c.stroke}" stroke-width="1.2"/>
        <path d="M11.5 36.2c2.2-3.5 6.2-5 11-5s8.8 1.5 11 5v3.2h-22v-3.2z" fill="${c.shade}" stroke="${c.stroke}" stroke-width="1.9"/>`,
    Q: `<ellipse cx="22.5" cy="39.5" rx="14" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <path d="M8.5 14.5l6.2 13.5 7.8-16.5L30.3 28l6.2-13.5-3.2 19.5H11.7L8.5 14.5z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <circle cx="8.5" cy="12.5" r="2.5" fill="${c.accent}" stroke="${c.stroke}" stroke-width="1.2"/>
        <circle cx="15.5" cy="10.2" r="2.2" fill="${c.accent}" stroke="${c.stroke}" stroke-width="1.2"/>
        <circle cx="22.5" cy="8.5" r="2.8" fill="${c.accent}" stroke="${c.stroke}" stroke-width="1.2"/>
        <circle cx="29.5" cy="10.2" r="2.2" fill="${c.accent}" stroke="${c.stroke}" stroke-width="1.2"/>
        <circle cx="36.5" cy="12.5" r="2.5" fill="${c.accent}" stroke="${c.stroke}" stroke-width="1.2"/>
        <rect x="11" y="33.8" width="23" height="5.4" rx="2" fill="${c.shade}" stroke="${c.stroke}" stroke-width="1.9"/>
        <line x1="13" y1="31.2" x2="32" y2="31.2" stroke="${c.accent}" stroke-width="2.2"/>`,
    K: `<ellipse cx="22.5" cy="39.5" rx="14" ry="2.6" fill="rgba(0,0,0,0.35)"/>
        <path d="M22.5 5.2v9.2M18 9.2h9" stroke="${c.accent}" stroke-width="3" stroke-linecap="round"/>
        <path d="M13.5 30c-4.5-4.5-4.5-11.8 2-14.2 3.2-1.2 5.4.8 7 3.2 1.6-2.4 3.8-4.4 7-3.2 6.5 2.4 6.5 9.7 2 14.2l1.2 4.2H12.3l1.2-4.2z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <line x1="22.5" y1="18.5" x2="22.5" y2="31" stroke="${c.accent}" stroke-width="2"/>
        <rect x="11" y="34" width="23" height="5.4" rx="2" fill="${c.shade}" stroke="${c.stroke}" stroke-width="1.9"/>`
  };
  return `<svg viewBox="0 0 45 45" aria-hidden="true">${shapes[type] || ''}</svg>`;
}

function renderGothicSvg(type, color) {
  const isW = color === 'w';
  const fill = isW ? '#e5e2dc' : '#141219';
  const shade = isW ? '#b6b0a8' : '#261c28';
  const stroke = isW ? '#18141c' : '#e11d48';
  const accent = isW ? '#991b1b' : '#f43f5e';

  const shapes = {
    P: `<path d="M22.5 8l5 8-2.5 3 4 13 4 4v3H12v-3l4-4 4-13-2.5-3 5-8z" fill="${fill}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M22.5 13v18M18.5 21h8" stroke="${accent}" stroke-width="2"/>`,
    R: `<path d="M11 8l3 4 3-5 5.5 5L28 7l3 5 3-4v10l-3 3v12l3 3v3H11v-3l3-3V21l-3-3V8z" fill="${fill}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M19 33v-9c0-2.5 1.8-4.5 3.5-5.5 1.7 1 3.5 3 3.5 5.5v9" fill="${shade}" stroke="${accent}" stroke-width="1.8"/>`,
    N: `<path d="M12 39v-4l5-6c-3-2-4-6-2-10l-5-1 6-8 6-4 1 4c6 0 11 5 11 12 0 6-2 10-4 13l3 4H12z" fill="${fill}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M19 15l3 1.5-2 2.5" fill="none" stroke="${accent}" stroke-width="2.2"/>
        <path d="M26 12l4 5-3 4 3 4-4 6" fill="none" stroke="${accent}" stroke-width="2"/>`,
    B: `<path d="M22.5 5l5.5 9c3 5 2 11 0 15l5 7v3H12v-3l5-7c-2-4-3-10 0-15l5.5-9z" fill="${fill}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M22.5 12v14M18 18h9" stroke="${accent}" stroke-width="2.2"/>
        <path d="M16 29h13" stroke="${accent}" stroke-width="2"/>`,
    Q: `<path d="M7 11l6 12 4-14 5.5 11L28 9l4 14 6-12-4 23H11L7 11z" fill="${fill}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <polygon points="22.5,5 25,9 22.5,12 20,9" fill="${accent}" stroke="${stroke}" stroke-width="1.2"/>
        <rect x="10.5" y="34" width="24" height="5" fill="${shade}" stroke="${stroke}" stroke-width="1.9"/>
        <line x1="12" y1="31" x2="33" y2="31" stroke="${accent}" stroke-width="2.2"/>`,
    K: `<path d="M22.5 4v11M17.5 8.5h10M19.5 5.5l6 6M25.5 5.5l-6 6" stroke="${accent}" stroke-width="2.1"/>
        <path d="M11 16l6 4 5.5-5 5.5 5 6-4-3 18H14l-3-18z" fill="${fill}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M22.5 19v13M17 25h11" stroke="${accent}" stroke-width="2"/>
        <rect x="10.5" y="34" width="24" height="5" fill="${shade}" stroke="${stroke}" stroke-width="1.9"/>`
  };
  return `<svg viewBox="0 0 45 45" aria-hidden="true">${shapes[type] || ''}</svg>`;
}

/**
 * Esculturas medievales de piedra inspiradas en el histórico Ajedrez de la Isla de Lewis (siglo XII).
 */
function renderLewisSvg(type, color) {
  const isW = color === 'w';
  const stone = isW ? '#f2ead7' : '#232229';
  const shade = isW ? '#c8ba9c' : '#121116';
  const stroke = isW ? '#2c2216' : '#d4a64a';
  const metal = isW ? '#9a6b26' : '#e11d48';
  const gold = isW ? '#d97706' : '#f59e0b';
  const visor = isW ? '#4b3b28' : '#09090b';

  const shapes = {
    P: `<ellipse cx="22.5" cy="40" rx="12.5" ry="2.4" fill="rgba(0,0,0,0.4)"/>
        <path d="M31 8l2 3-3 12-2.5-1 3.5-14z" fill="${gold}" stroke="${stroke}" stroke-width="1.3"/>
        <rect x="11" y="35.5" width="23" height="4" rx="1.4" fill="${shade}" stroke="${stroke}" stroke-width="1.8"/>
        <path d="M16 14.5c0-4.2 3-6.8 6.5-6.8s6.5 2.6 6.5 6.8v4.5H16v-4.5z" fill="${stone}" stroke="${stroke}" stroke-width="1.8"/>
        <path d="M17.5 14h10M22.5 11.5v5.5" stroke="${visor}" stroke-width="2" stroke-linecap="round"/>
        <path d="M13.5 19.5h18v7.5c0 4.8-4 8-9 9.5-5-1.5-9-4.7-9-9.5v-7.5z" fill="${stone}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M22.5 21v13M16.5 25.5h12" stroke="${metal}" stroke-width="2.4" stroke-linecap="round"/>`,
    R: `<ellipse cx="22.5" cy="40" rx="14" ry="2.4" fill="rgba(0,0,0,0.4)"/>
        <path d="M9.5 8h5.5v4.5h4.2V8h6.6v4.5H30V8h5.5v8.5l-3.5 3V33l3.2 3v3.5H9.8V36L13 33V19.5l-3.5-3V8z" fill="${stone}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M13 18.5h19M13.5 24h18M13.5 29.5h18" stroke="${shade}" stroke-width="1.4" opacity="0.8"/>
        <path d="M18 35.5V26c0-2.8 2-4.8 4.5-6 2.5 1.2 4.5 3.2 4.5 6v9.5z" fill="${visor}" stroke="${gold}" stroke-width="1.8"/>
        <line x1="22.5" y1="20.5" x2="22.5" y2="35.5" stroke="${metal}" stroke-width="1.6"/>
        <rect x="9.5" y="35.5" width="26" height="4" rx="1.2" fill="${shade}" stroke="${stroke}" stroke-width="1.8"/>`,
    N: `<ellipse cx="22.5" cy="40" rx="14" ry="2.4" fill="rgba(0,0,0,0.4)"/>
        <path d="M11 38.5v-3.5l5-5.5c-2.8-1.4-5.2-4.4-4.8-8.2l-3.2-1.8 3.6-7.6 5.2-4.8 2.8-1.6 1.6 3.2c6.2-.5 11.8 3.8 13.2 11.2 1.1 5.6-.8 10.8-3.4 14.5l3 4.1H11z" fill="${stone}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M13 13.5l5.5-3.2 3 5.5-5.2 4.2-4.2-2.2z" fill="${shade}" stroke="${gold}" stroke-width="1.5"/>
        <circle cx="17.8" cy="14.5" r="1.6" fill="${metal}"/>
        <path d="M11.8 21l8.5 3.5 5.5-2.5" fill="none" stroke="${gold}" stroke-width="2" stroke-linecap="round"/>
        <path d="M23.5 11.2c4.5 2 7.2 7.2 6.5 13.8-.5 4.2-2.2 7.2-4.8 9.2" fill="none" stroke="${metal}" stroke-width="2.5" stroke-dasharray="4 2"/>
        <rect x="10.5" y="35.5" width="24" height="4" rx="1.4" fill="${shade}" stroke="${stroke}" stroke-width="1.8"/>`,
    B: `<ellipse cx="22.5" cy="40" rx="13.5" ry="2.4" fill="rgba(0,0,0,0.4)"/>
        <path d="M33.5 36V12.5c0-2.6-2-4.2-4-4.2-1.8 0-3 1.3-3 2.8 0 1.3 1 2.2 2.2 2.2" fill="none" stroke="${gold}" stroke-width="2.3" stroke-linecap="round"/>
        <path d="M12 36l2.5-14c.8-3 3.8-4.5 8-4.5s7.2 1.5 8 4.5l2.5 14H12z" fill="${stone}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M15.5 17.5l7-11.5 7 11.5H15.5z" fill="${stone}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M22.5 8.5v8.5M19 13.5h7" stroke="${metal}" stroke-width="2.1" stroke-linecap="round"/>
        <path d="M17.5 18.5h10v3.5h-10z" fill="${shade}" stroke="${stroke}" stroke-width="1.3"/>
        <path d="M22.5 23.5v9M19 27h7" stroke="${gold}" stroke-width="2.2" stroke-linecap="round"/>
        <rect x="10.5" y="35.5" width="24" height="4" rx="1.4" fill="${shade}" stroke="${stroke}" stroke-width="1.8"/>`,
    Q: `<ellipse cx="22.5" cy="40" rx="14.5" ry="2.4" fill="rgba(0,0,0,0.4)"/>
        <path d="M11 16.5l2.2-9 5.3 4.8L22.5 5l4 7.3 5.3-4.8 2.2 9H11z" fill="${gold}" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M14.5 16.5h16v6.5c0 2-3.5 3.5-8 3.5s-8-1.5-8-3.5v-6.5z" fill="${stone}" stroke="${stroke}" stroke-width="1.8"/>
        <path d="M18.5 19.5h2.2M24.3 19.5h2.2" stroke="${visor}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M10.5 36l3-11.5c2-1.8 5.2-2.5 9-2.5s7 .7 9 2.5l3 11.5H10.5z" fill="${stone}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M22.5 24v11.5" stroke="${metal}" stroke-width="2.6" stroke-linecap="round"/>
        <polygon points="22.5,22 25.2,25.5 22.5,29 19.8,25.5" fill="${gold}" stroke="${stroke}" stroke-width="1.2"/>
        <rect x="9.5" y="35.5" width="26" height="4" rx="1.4" fill="${shade}" stroke="${stroke}" stroke-width="1.8"/>`,
    K: `<ellipse cx="22.5" cy="40" rx="14.5" ry="2.4" fill="rgba(0,0,0,0.4)"/>
        <path d="M22.5 3.5v5.5M20 5.8h5" stroke="${gold}" stroke-width="2.3" stroke-linecap="round"/>
        <path d="M12.5 15l1.5-6.5 4.2 3.2L22.5 8l4.3 3.7 4.2-3.2 1.5 6.5h-20z" fill="${gold}" stroke="${stroke}" stroke-width="1.7" stroke-linejoin="round"/>
        <path d="M15.5 15h14v5.5c0 2.5-3 4.2-7 4.2s-7-1.7-7-4.2V15z" fill="${stone}" stroke="${stroke}" stroke-width="1.8"/>
        <path d="M18.5 18h2M24.5 18h2" stroke="${visor}" stroke-width="1.9" stroke-linecap="round"/>
        <path d="M10 36l2.5-12c2.2-1.8 5.8-2.6 10-2.6s7.8.8 10 2.6l2.5 12H10z" fill="${stone}" stroke="${stroke}" stroke-width="1.9" stroke-linejoin="round"/>
        <path d="M22.5 20.5v15.5" stroke="${metal}" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M16.5 25.5h12" stroke="${gold}" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="22.5" cy="21" r="2.2" fill="${gold}" stroke="${stroke}" stroke-width="1.2"/>
        <rect x="9.5" y="35.5" width="26" height="4" rx="1.4" fill="${shade}" stroke="${stroke}" stroke-width="1.8"/>`
  };
  return `<svg viewBox="0 0 45 45" aria-hidden="true">${shapes[type] || ''}</svg>`;
}

export const THEMES = {
  neon: {
    id: 'neon',
    label: '⚡ Táctico Neón',
    fxPalette: { P: '#38bdf8', N: '#f59e0b', B: '#c084fc', R: '#ef4444', Q: '#f472b6', K: '#facc15' },
    renderPiece: (type, color) =>
      renderClassicSculptedSvg(type, color, {
        w: { fill: '#f8fafc', shade: '#cbd5e1', stroke: '#0f172a', accent: '#0284c7', hi: '#ffffff' },
        b: { fill: '#111827', shade: '#1e293b', stroke: '#38bdf8', accent: '#f43f5e', hi: '#64748b' }
      })
  },
  wood: {
    id: 'wood',
    label: '🪵 Madera Clásica',
    fxPalette: { P: '#fbbf24', N: '#f97316', B: '#eab308', R: '#dc2626', Q: '#f59e0b', K: '#fde047' },
    renderPiece: (type, color) =>
      renderClassicSculptedSvg(type, color, {
        w: { fill: '#f9ecd2', shade: '#dfc292', stroke: '#4a2c12', accent: '#b45309', hi: '#ffffff' },
        b: { fill: '#472613', shade: '#2d1609', stroke: '#160903', accent: '#d97706', hi: '#8c5a32' }
      })
  },
  ivory: {
    id: 'ivory',
    label: '🏛️ Marfil y Ébano',
    fxPalette: { P: '#e2e8f0', N: '#e2c275', B: '#93c5fd', R: '#f87171', Q: '#fde68a', K: '#facc15' },
    renderPiece: (type, color) =>
      renderClassicSculptedSvg(type, color, {
        w: { fill: '#fbf8f1', shade: '#dfd7c5', stroke: '#27241d', accent: '#b08d3c', hi: '#ffffff' },
        b: { fill: '#181a1f', shade: '#0d0e11', stroke: '#d4af37', accent: '#e2c275', hi: '#525866' }
      })
  },
  gothic: {
    id: 'gothic',
    label: '🦇 Catedral Gótica',
    fxPalette: { P: '#e5e7eb', N: '#ef4444', B: '#c026d3', R: '#b91c1c', Q: '#f43f5e', K: '#fbbf24' },
    renderPiece: renderGothicSvg
  },
  magic: {
    id: 'magic',
    label: '🗿 Esculturas de Lewis',
    fxPalette: { P: '#fbbf24', N: '#f97316', B: '#dc2626', R: '#eab308', Q: '#ef4444', K: '#fde047' },
    renderPiece: renderLewisSvg
  }
};

export class ThemeManager {
  constructor({ slotEl, onThemeChange }) {
    ensureThemesStylesheet();
    this.slotEl = slotEl;
    this.onThemeChange = onThemeChange;
    this.currentId = this._loadSaved();

    this._mountSelector();
    this.apply(this.currentId);
  }

  _loadSaved() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES[saved]) return saved;
    } catch { /* ignorar */ }
    return 'neon';
  }

  _mountSelector() {
    if (!this.slotEl) return;
    const select = document.createElement('select');
    select.id = 'theme-select';
    select.className = 'ctrl-select theme-select';
    select.title = 'Tema y estilo de fichas';

    Object.values(THEMES).forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.label;
      if (t.id === this.currentId) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => this.apply(e.target.value));
    this.slotEl.innerHTML = '';
    this.slotEl.appendChild(select);
  }

  apply(themeId) {
    const theme = THEMES[themeId] || THEMES.neon;
    this.currentId = theme.id;
    document.documentElement.dataset.theme = theme.id;
    try { localStorage.setItem(STORAGE_KEY, theme.id); } catch { /* ignorar */ }
    if (this.onThemeChange) this.onThemeChange(theme);
  }
}
