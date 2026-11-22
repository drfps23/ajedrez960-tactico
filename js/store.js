const STORE_KEY = 'ajedrez960_app_store_v1';

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Gratis',
    price: '$0',
    period: 'para siempre',
    badge: 'GRATIS',
    color: '#94a3b8',
    perks: [
      'Ajedrez Clásico y Fischer 960 ilimitados',
      'Multijugador Online en salas privadas con reloj Fischer',
      'Temas Neón y Madera Clásica',
      '2 análisis post-partida con voz al día',
      '3 problemas tácticos diarios y lecciones básicas'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Táctico Pro',
    price: '$3.99',
    period: '/ mes',
    badge: 'PRO',
    color: '#38bdf8',
    popular: true,
    perks: [
      'Todo lo incluido en Gratis sin anuncios',
      'Todos los sets de piezas (Marfil, Gótico y Esculturas de Piedra)',
      'Análisis post-partida con voz ilimitado',
      'Problemas tácticos ilimitados en Clásico y 960',
      'Academia completa de Aperturas, Defensas y Gambitos'
    ]
  },
  master: {
    id: 'master',
    name: 'Gran Maestro',
    price: '$6.99',
    period: '/ mes',
    badge: 'LEYENDA',
    color: '#facc15',
    perks: [
      'Todo lo incluido en Táctico Pro',
      'Motor de análisis profundo nivel Gran Maestro',
      'Efectos exclusivos de Jaque Mate y animaciones premium',
      'Historial ilimitado de partidas guardadas y estadísticas avanzadas',
      'Insignia dorada de perfil en partidas online'
    ]
  }
};

export const ACHIEVEMENT_DEFS = [
  { id: 'first_win',     icon: '🥇', title: 'Primera Victoria',       desc: 'Gana tu primera partida en cualquier modo.' },
  { id: 'checkmate_art', icon: '👑', title: 'Verdugo del Rey',        desc: 'Finaliza una partida con jaque mate.' },
  { id: 'classic_start', icon: '♟️', title: 'Tradición Clásica',      desc: 'Completa una partida en Ajedrez Clásico.' },
  { id: 'fischer_mind',  icon: '🎲', title: 'Mente Fischer 960',      desc: 'Completa una partida en modalidad Fischer 960.' },
  { id: 'castle_master', icon: '🛡️', title: 'Fortaleza Real',         desc: 'Ejecuta un enroque durante una partida.' },
  { id: 'precision_85',  icon: '🎯', title: 'Precisión Quirúrgica',   desc: 'Consigue 85% o más de precisión en un análisis.' },
  { id: 'theme_switch',  icon: '🎨', title: 'Coleccionista Visual',   desc: 'Prueba 3 o más temas distintos del tablero.' },
  { id: 'streak_3',      icon: '🔥', title: 'Racha Imparable',        desc: 'Consigue 3 victorias consecutivas.' }
];

const DEFAULT_DATA = {
  profile: {
    name: 'Jugador',
    avatar: '♛',
    title: 'Estratega'
  },
  tier: 'pro', // Inicia en Pro durante pruebas; editable en Suscripción
  stats: {
    classic:    { played: 0, wins: 0, losses: 0, draws: 0, elo: 1200 },
    fischer960: { played: 0, wins: 0, losses: 0, draws: 0, elo: 1200 },
    checkmates: 0,
    currentStreak: 0,
    bestStreak: 0,
    bestAccuracy: 0
  },
  achievements: [],
  themesTried: ['neon'],
  settings: {
    defaultVariant: 'classic',
    showCoords: true
  },
  messages: [
    {
      id: 'welcome-1',
      icon: '♛',
      title: '¡Bienvenido a Ajedrez Táctico!',
      body: 'Ya puedes alternar entre Ajedrez Clásico y Fischer 960 con todas las animaciones de combate, reloj Fischer, modo online y entrenador con voz.',
      date: 'Hoy',
      read: false
    },
    {
      id: 'welcome-2',
      icon: '👑',
      title: 'Simulador de Suscripción activo',
      body: 'En el menú Suscripción puedes probar cómo se comportan los planes Gratis, Pro y Gran Maestro antes de publicar en Google Play y App Store.',
      date: 'Hoy',
      read: false
    }
  ]
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export class AppStore {
  constructor() {
    this.data = this._load();
    this.listeners = new Set();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return deepClone(DEFAULT_DATA);
      const parsed = JSON.parse(raw);
      return {
        ...deepClone(DEFAULT_DATA),
        ...parsed,
        profile: { ...DEFAULT_DATA.profile, ...(parsed.profile || {}) },
        stats: {
          ...deepClone(DEFAULT_DATA.stats),
          ...(parsed.stats || {}),
          classic: { ...DEFAULT_DATA.stats.classic, ...(parsed.stats?.classic || {}) },
          fischer960: { ...DEFAULT_DATA.stats.fischer960, ...(parsed.stats?.fischer960 || {}) }
        },
        settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        themesTried: Array.isArray(parsed.themesTried) ? parsed.themesTried : ['neon'],
        messages: Array.isArray(parsed.messages) && parsed.messages.length ? parsed.messages : deepClone(DEFAULT_DATA.messages)
      };
    } catch {
      return deepClone(DEFAULT_DATA);
    }
  }

  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
    } catch { /* ignorar */ }
    this.listeners.forEach(fn => fn(this.data));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getUnreadCount() {
    return this.data.messages.filter(m => !m.read).length;
  }

  hasAccess(feature) {
    const tier = this.data.tier;
    if (tier === 'master') return true;
    if (tier === 'pro') return feature !== 'master_only';
    // Plan Gratis
    const freeFeatures = new Set(['classic', 'fischer960', 'online', 'basic_themes', 'basic_puzzles']);
    return freeFeatures.has(feature);
  }

  setTier(tierId) {
    if (!SUBSCRIPTION_PLANS[tierId]) return;
    this.data.tier = tierId;
    this.addMessage({
      icon: '👑',
      title: `Plan actualizado: ${SUBSCRIPTION_PLANS[tierId].name}`,
      body: `Ahora estás probando la experiencia con las ventajas del nivel ${SUBSCRIPTION_PLANS[tierId].name}.`
    });
    this.save();
  }

  updateProfile({ name, avatar, title }) {
    if (typeof name === 'string' && name.trim()) this.data.profile.name = name.trim().slice(0, 24);
    if (typeof avatar === 'string' && avatar) this.data.profile.avatar = avatar;
    if (typeof title === 'string' && title.trim()) this.data.profile.title = title.trim().slice(0, 24);
    this.save();
  }

  updateSettings(patch) {
    this.data.settings = { ...this.data.settings, ...patch };
    this.save();
  }

  addMessage({ icon = '📩', title, body }) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    this.data.messages.unshift({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      icon,
      title,
      body,
      date: `Hoy ${hh}:${mm}`,
      read: false
    });
    this.data.messages = this.data.messages.slice(0, 30);
  }

  markAllMessagesRead() {
    let changed = false;
    this.data.messages.forEach(m => {
      if (!m.read) {
        m.read = true;
        changed = true;
      }
    });
    if (changed) this.save();
  }

  unlockAchievement(id) {
    if (this.data.achievements.includes(id)) return false;
    const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
    if (!def) return false;
    this.data.achievements.push(id);
    this.addMessage({
      icon: def.icon,
      title: `Logro desbloqueado: ${def.title}`,
      body: def.desc
    });
    this.save();
    return true;
  }

  recordThemeUsed(themeId) {
    if (!this.data.themesTried.includes(themeId)) {
      this.data.themesTried.push(themeId);
      if (this.data.themesTried.length >= 3) {
        this.unlockAchievement('theme_switch');
      } else {
        this.save();
      }
    }
  }

  recordCastle() {
    this.unlockAchievement('castle_master');
  }

  recordAccuracy(acc) {
    if (acc > this.data.stats.bestAccuracy) {
      this.data.stats.bestAccuracy = acc;
      this.save();
    }
    if (acc >= 85) {
      this.unlockAchievement('precision_85');
    }
  }

  /**
   * Registra resultado de partida para actualizar estadísticas, ELO local y logros.
   * outcome: 'win' | 'loss' | 'draw'
   */
  recordGame({ variant, outcome, byCheckmate = false }) {
    const bucket = variant === 'classic' ? this.data.stats.classic : this.data.stats.fischer960;
    bucket.played += 1;

    if (outcome === 'win') {
      bucket.wins += 1;
      bucket.elo = Math.min(2800, bucket.elo + 18);
      this.data.stats.currentStreak += 1;
      if (this.data.stats.currentStreak > this.data.stats.bestStreak) {
        this.data.stats.bestStreak = this.data.stats.currentStreak;
      }
      if (byCheckmate) this.data.stats.checkmates += 1;
    } else if (outcome === 'loss') {
      bucket.losses += 1;
      bucket.elo = Math.max(400, bucket.elo - 14);
      this.data.stats.currentStreak = 0;
    } else {
      bucket.draws += 1;
      bucket.elo += 2;
    }

    this.save();

    if (variant === 'classic') this.unlockAchievement('classic_start');
    if (variant === 'fischer960') this.unlockAchievement('fischer_mind');
    if (outcome === 'win') this.unlockAchievement('first_win');
    if (outcome === 'win' && byCheckmate) this.unlockAchievement('checkmate_art');
    if (this.data.stats.currentStreak >= 3) this.unlockAchievement('streak_3');
  }

  resetStats() {
    this.data.stats = deepClone(DEFAULT_DATA.stats);
    this.data.achievements = [];
    this.save();
  }
}
