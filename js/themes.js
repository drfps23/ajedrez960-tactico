const STORAGE_KEY = 'ajedrez960_theme_v1';

/**
 * Inyecta css/themes.css automáticamente para no depender de cambios manuales en index.html.
 */
function ensureThemesStylesheet() {
  if (document.querySelector('link[data-themes-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/themes.css';
  link.dataset.themesCss = 'true';
  document.head.appendChild(link);
}

/* ---------- RENDERIZADORES SVG POR ESTILO DE PIEZA ---------- */

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

/**
 * Siluetas afiladas estilo Catedral Gótica (arcos ojivales, agujas y yelmos).
 */
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
 * Estatuas talladas en piedra con runas brillantes estilo Ajedrez Mágico / Arcano.
 */
function renderMagicSvg(type, color) {
  const isW = color === 'w';
  const stone = isW ? '#e9e2ce' : '#1f2623';
  const deep = isW ? '#bfb496' : '#121815';
  const stroke = isW ? '#3d331d' : '#10b981';
  const rune = isW ? '#d97706' : '#34d399';
  const glow = isW ? '#fde047' : '#6ee7b7';

  const shapes = {
    P: `<path d="M13 38l3-5 1-11-3-3 3-9h11l3 9-3 3 1 11 3 5H13z" fill="${stone}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M18 14h9l-4.5 5z" fill="${deep}" stroke="${stroke}" stroke-width="1.4"/>
        <path d="M22.5 22v10M19 26h7" stroke="${rune}" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="22.5" cy="11.5" r="2" fill="${glow}"/>`,
    R: `<path d="M10 9h6v5h3.5V9h6v5H29V9h6v9l-4 3v12l3 3v3H11v-3l3-3V21l-4-3V9z" fill="${stone}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        <polygon points="22.5,20 26.5,26 22.5,32 18.5,26" fill="${deep}" stroke="${rune}" stroke-width="2"/>
        <circle cx="22.5" cy="26" r="2" fill="${glow}"/>`,
    N: `<path d="M11 39l2-5 5-5c-3-2-5-5-4-9l-3-2 4-8 6-4 3 3c6 0 10 4 11 11 1 5-1 10-4 14l3 5H11z" fill="${stone}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M17 16l4 1-2 3z" fill="${glow}" stroke="${rune}" stroke-width="1"/>
        <path d="M24 12c4 3 6 8 4 16" fill="none" stroke="${rune}" stroke-width="2.4" stroke-dasharray="3 2"/>
        <line x1="14" y1="35" x2="31" y2="35" stroke="${rune}" stroke-width="2.2"/>`,
    B: `<path d="M22.5 6l7 10-2 15 5 5v3H12.5v-3l5-5-2-15 7-10z" fill="${stone}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="22.5" cy="17" r="3.4" fill="${deep}" stroke="${rune}" stroke-width="2"/>
        <circle cx="22.5" cy="17" r="1.4" fill="${glow}"/>
        <path d="M22.5 22v10M18.5 28l4-3 4 3" fill="none" stroke="${rune}" stroke-width="2.1"/>`,
    Q: `<path d="M8 14l6 13 4-15 4.5 11L27 12l4 15 6-13-4 20H12L8 14z" fill="${stone}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="22.5" cy="9" r="3.2" fill="${glow}" stroke="${rune}" stroke-width="1.6"/>
        <polygon points="22.5,22 26,27 22.5,31 19,27" fill="${rune}"/>
        <rect x="11" y="34" width="23" height="5" rx="1.5" fill="${deep}" stroke="${stroke}" stroke-width="2"/>`,
    K: `<path d="M22.5 5l3 5-3 4-3-4 3-5z" fill="${glow}" stroke="${rune}" stroke-width="1.5"/>
        <path d="M11 16l6 3 5.5-5 5.5 5 6-3-3 18H14l-3-18z" fill="${stone}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M22.5 19v13M18 24l4.5-3 4.5 3" fill="none" stroke="${rune}" stroke-width="2.3"/>
        <rect x="11" y="34" width="23" height="5" rx="1.5" fill="${deep}" stroke="${stroke}" stroke-width="2"/>`
  };
  return `<svg viewBox="0 0 45 45" aria-hidden="true">${shapes[type] || ''}</svg>`;
}

/* ---------- CATÁLOGO DE TEMAS ---------- */

export const THEMES = {
  neon: {
    id: 'neon',
    label: '⚡ Táctico Neón',
    fxPalette: {
      P: '#38bdf8',
      N: '#f59e0b',
      B: '#c084fc',
      R: '#ef4444',
      Q: '#f472b6',
      K: '#facc15'
    },
    renderPiece: (type, color) =>
      renderClassicSculptedSvg(type, color, {
        w: { fill: '#f8fafc', shade: '#cbd5e1', stroke: '#0f172a', accent: '#0284c7', hi: '#ffffff' },
        b: { fill: '#111827', shade: '#1e293b', stroke: '#38bdf8', accent: '#f43f5e', hi: '#64748b' }
      })
  },
  wood: {
    id: 'wood',
    label: '🪵 Madera Clásica',
    fxPalette: {
      P: '#fbbf24',
      N: '#f97316',
      B: '#eab308',
      R: '#dc2626',
      Q: '#f59e0b',
      K: '#fde047'
    },
    renderPiece: (type, color) =>
      renderClassicSculptedSvg(type, color, {
        w: { fill: '#f9ecd2', shade: '#dfc292', stroke: '#4a2c12', accent: '#b45309', hi: '#ffffff' },
        b: { fill: '#472613', shade: '#2d1609', stroke: '#160903', accent: '#d97706', hi: '#8c5a32' }
      })
  },
  ivory: {
    id: 'ivory',
    label: '🏛️ Marfil y Ébano',
    fxPalette: {
      P: '#e2e8f0',
      N: '#e2c275',
      B: '#93c5fd',
      R: '#f87171',
      Q: '#fde68a',
      K: '#facc15'
    },
    renderPiece: (type, color) =>
      renderClassicSculptedSvg(type, color, {
        w: { fill: '#fbf8f1', shade: '#dfd7c5', stroke: '#27241d', accent: '#b08d3c', hi: '#ffffff' },
        b: { fill: '#181a1f', shade: '#0d0e11', stroke: '#d4af37', accent: '#e2c275', hi: '#525866' }
      })
  },
  gothic: {
    id: 'gothic',
    label: '🦇 Catedral Gótica',
    fxPalette: {
      P: '#e5e7eb',
      N: '#ef4444',
      B: '#c026d3',
      R: '#b91c1c',
      Q: '#f43f5e',
      K: '#fbbf24'
    },
    renderPiece: renderGothicSvg
  },
  magic: {
    id: 'magic',
    label: '🪄 Ajedrez Mágico',
    fxPalette: {
      P: '#fde047',
      N: '#f97316',
      B: '#34d399',
      R: '#f59e0b',
      Q: '#a855f7',
      K: '#facc15'
    },
    renderPiece: renderMagicSvg
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
    } catch {
      // ignorar si localStorage está restringido
    }
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

    select.addEventListener('change', (e) => {
      this.apply(e.target.value);
    });

    this.slotEl.innerHTML = '';
    this.slotEl.appendChild(select);
  }

  apply(themeId) {
    const theme = THEMES[themeId] || THEMES.neon;
    this.currentId = theme.id;
    document.documentElement.dataset.theme = theme.id;

    try {
      localStorage.setItem(STORAGE_KEY, theme.id);
    } catch {
      // ignorar
    }

    if (this.onThemeChange) {
      this.onThemeChange(theme);
    }
  }
}
