import { Chess960Engine, FILES } from './engine.js';
import { SoundFX } from './audio.js';
import { CombatFX } from './fx.js';
import { THEMES } from './themes.js';

const COMPLETED_KEY = 'ajedrez960_academy_done_v1';

export const ACADEMY_CATEGORIES = [
  { id: 'basics',   label: '🎓 Principiantes' },
  { id: 'openings', label: '⚔️ Aperturas' },
  { id: 'defenses', label: '🛡️ Defensas' },
  { id: 'gambits',  label: '🔥 Gambitos' }
];

export const ACADEMY_LESSONS = [
  // === PRINCIPIANTES ===
  {
    id: 'bas-center',
    category: 'basics',
    tier: 'free',
    side: 'w',
    positionId: 518,
    title: 'Control del Centro y Enroque Rápido',
    summary: 'Las 3 reglas de oro para empezar cualquier partida: ocupa el centro, desarrolla piezas menores y resguarda al Rey.',
    steps: [
      { uci: 'e2e4', text: 'Peón a e4. Ocupa el centro de inmediato y abre paso a tu Dama y a tu Alfil.' },
      { uci: 'e7e5', text: 'Las negras contestan luchando también por las casillas centrales.' },
      { uci: 'g1f3', text: 'Caballo f3. Desarrolla atacando el peón enemigo de e5 y controla el centro.' },
      { uci: 'b8c6', text: 'Las negras defienden su peón central sacando su propio Caballo.' },
      { uci: 'f1c4', text: 'Alfil c4. Desarrolla apuntando directamente al punto más débil del rival: f7.' },
      { uci: 'f8c5', text: 'Las negras copian el desarrollo activo con su Alfil.' },
      { castle: 'K', text: 'Enroque corto. Resguardas al Rey y activas tu Torre hacia el centro en una sola jugada.' }
    ]
  },
  {
    id: 'bas-960-castle',
    category: 'basics',
    tier: 'free',
    side: 'w',
    positionId: 14,
    title: 'Cómo funciona el Enroque en Fischer 960',
    summary: 'En Ajedrez 960 el Rey y las Torres comienzan en columnas distintas, pero siempre terminan en las casillas clásicas.',
    steps: [
      { uci: 'c1b3', text: 'En la posición 14, tu Torre está en d1 y tu Rey en e1. Primero despeja la casilla c1 moviendo el Caballo a b3.' },
      { uci: 'c8b6', text: 'El rival hace lo mismo en su flanco de dama para liberar c8.' },
      { castle: 'Q', text: 'Enroque largo 960. Tocas tu Rey y luego tu Torre en d1: el Rey salta a c1 y la Torre queda firme en d1.' },
      { castle: 'Q', text: 'Ambos bandos quedan enrocados exactamente en las casillas clásicas aunque hayan partido de una formación 960.' }
    ]
  },
  {
    id: 'bas-pastor',
    category: 'basics',
    tier: 'free',
    side: 'b',
    positionId: 518,
    title: 'Cómo defenderte del Mate Pastor',
    summary: 'Aprende a castigar a los rivales que sacan la Dama demasiado pronto buscando mate en f7.',
    steps: [
      { uci: 'e2e4', text: 'Las blancas inician con e4.' },
      { uci: 'e7e5', text: 'Responde sólido ocupando el centro con e5.' },
      { uci: 'f1c4', text: 'El rival apunta a tu casilla f7 con el Alfil.' },
      { uci: 'b8c6', text: 'Desarrolla tu Caballo a c6 protegiendo e5.' },
      { uci: 'd1h5', text: 'Aquí viene la trampa del Mate Pastor: amenazan Dxf7 jaque mate.' },
      { uci: 'g7g6', text: 'Jugada clave: peón a g6. Bloqueas el ataque sobre f7 y expulsas a la Dama enemiga.' },
      { uci: 'h5f3', text: 'Si insisten en atacar f7 desde f3, ya estás listo para cerrar la puerta.' },
      { uci: 'g8f6', text: 'Caballo f6. Bloqueas definitivamente la columna f, desarrollas una pieza y quedas con mejor posición.' }
    ]
  },

  // === APERTURAS ===
  {
    id: 'op-italian',
    category: 'openings',
    tier: 'free',
    side: 'w',
    positionId: 518,
    title: 'Apertura Italiana (Giuoco Piano)',
    summary: 'Una de las aperturas más clásicas y agresivas: desarrollo rápido, presión sobre f7 y ruptura central con d4.',
    steps: [
      { uci: 'e2e4', text: 'Peón a e4, abriendo diagonales para tu Alfil y Dama.' },
      { uci: 'e7e5', text: 'Respuesta simétrica de las negras.' },
      { uci: 'g1f3', text: 'Caballo f3 presiona e5 y prepara el enroque.' },
      { uci: 'b8c6', text: 'Las negras defienden el centro con Cc6.' },
      { uci: 'f1c4', text: 'Alfil c4 define la Apertura Italiana, apuntando a f7.' },
      { uci: 'f8c5', text: 'Las negras responden con Ac5.' },
      { uci: 'c2c3', text: 'Peón a c3 prepara el golpe central d4 con apoyo.' },
      { uci: 'g8f6', text: 'El rival ataca tu peón de e4 con Cf6.' },
      { uci: 'd2d4', text: 'Ruptura d4. Tomas la iniciativa, abres líneas y dominas el centro.' }
    ]
  },
  {
    id: 'op-ruy',
    category: 'openings',
    tier: 'pro',
    side: 'w',
    positionId: 518,
    title: 'Apertura Española (Ruy López)',
    summary: 'La favorita de los Campeones Mundiales: ejerce presión duradera sobre el Caballo que defiende el centro negro.',
    steps: [
      { uci: 'e2e4', text: 'Peón a e4.' },
      { uci: 'e7e5', text: 'Las negras responden e5.' },
      { uci: 'g1f3', text: 'Caballo f3 ataca el peón de e5.' },
      { uci: 'b8c6', text: 'Las negras defienden con Cc6.' },
      { uci: 'f1b5', text: 'Alfil b5: la Apertura Española. Presionas directamente al defensor de e5.' },
      { uci: 'a7a6', text: 'Defensa Morphy: las negras preguntan al Alfil sus intenciones.' },
      { uci: 'b5a4', text: 'Alfil a4 mantiene la tensión en la diagonal sin ceder la pareja de alfiles.' },
      { uci: 'g8f6', text: 'Las negras contraatacan sobre e4.' },
      { castle: 'K', text: 'Enroque corto. Dejas al Rey seguro y preparas Te1 para defender e4 y dominar el centro.' }
    ]
  },
  {
    id: 'op-london',
    category: 'openings',
    tier: 'pro',
    side: 'w',
    positionId: 518,
    title: 'Sistema Londres',
    summary: 'Sistema sólido y fácil de aprender contra casi cualquier respuesta negra, formando una pirámide de peones.',
    steps: [
      { uci: 'd2d4', text: 'Peón a d4 para controlar el centro con solidez.' },
      { uci: 'd7d5', text: 'Las negras replican con d5.' },
      { uci: 'c1f4', text: 'Alfil f4 define el Sistema Londres: sacas el Alfil antes de cerrar la diagonal con e3.' },
      { uci: 'g8f6', text: 'Las negras desarrollan su Caballo.' },
      { uci: 'e2e3', text: 'Peón a e3 refuerza d4 y abre paso al Alfil de casillas claras.' },
      { uci: 'e7e6', text: 'Las negras consolidan su centro.' },
      { uci: 'g1f3', text: 'Caballo f3 toma control de la casilla estratégica e5.' },
      { uci: 'f8d6', text: 'El rival ofrece el cambio de tu Alfil de f4.' },
      { uci: 'f4g3', text: 'Alfil g3: si cambian en g3, recapturas con el peón de h y abres la columna h para tu Torre.' }
    ]
  },

  // === DEFENSAS ===
  {
    id: 'def-sicilian',
    category: 'defenses',
    tier: 'free',
    side: 'b',
    positionId: 518,
    title: 'Defensa Siciliana (Variante Najdorf)',
    summary: 'La respuesta más combativa contra e4: lucha asimétrica por el centro y contragolpe feroz en el flanco de dama.',
    steps: [
      { uci: 'e2e4', text: 'Las blancas abren con e4.' },
      { uci: 'c7c5', text: 'Peón a c5: la Defensa Siciliana. Impides d4 cómodo y buscas desequilibrio desde la jugada uno.' },
      { uci: 'g1f3', text: 'Las blancas preparan la ruptura d4.' },
      { uci: 'd7d6', text: 'Peón a d6 controla e5 y abre la diagonal de tu Alfil de c8.' },
      { uci: 'd2d4', text: 'Las blancas abren el centro.' },
      { uci: 'c5d4', text: 'Capturas en d4: cambias un peón lateral por un peón central blanco.' },
      { uci: 'f3d4', text: 'Las blancas retoman de Caballo.' },
      { uci: 'g8f6', text: 'Caballo f6 desarrolla atacando inmediatamente el peón de e4.' },
      { uci: 'b1c3', text: 'Las blancas defienden e4.' },
      { uci: 'a7a6', text: 'Peón a a6: la famosa Variante Najdorf. Evitas saltos molestos a b5 y preparas expansión con b5 o e5.' }
    ]
  },
  {
    id: 'def-french',
    category: 'defenses',
    tier: 'pro',
    side: 'b',
    positionId: 518,
    title: 'Defensa Francesa (Winawer)',
    summary: 'Estructura rocosa que invita a las blancas a avanzar en el centro para luego minar su cadena de peones con c5.',
    steps: [
      { uci: 'e2e4', text: 'Las blancas juegan e4.' },
      { uci: 'e7e6', text: 'Peón a e6 prepara un contragolpe inmediato con d5.' },
      { uci: 'd2d4', text: 'Las blancas construyen el centro completo.' },
      { uci: 'd7d5', text: 'Peón a d5 reta de frente al peón blanco de e4.' },
      { uci: 'b1c3', text: 'Las blancas defienden e4 desarrollando.' },
      { uci: 'f8b4', text: 'Alfil b4 clava al Caballo y renueva la amenaza sobre e4.' },
      { uci: 'e4e5', text: 'Las blancas ganan espacio cerrando el centro.' },
      { uci: 'c7c5', text: 'Ruptura temática c5: atacas la base de la cadena blanca en d4.' }
    ]
  },
  {
    id: 'def-carokann',
    category: 'defenses',
    tier: 'pro',
    side: 'b',
    positionId: 518,
    title: 'Defensa Caro-Kann',
    summary: 'Ultra sólida como la Francesa, pero manteniendo libre la diagonal de tu Alfil de casillas claras.',
    steps: [
      { uci: 'e2e4', text: 'Las blancas abren con e4.' },
      { uci: 'c7c6', text: 'Peón a c6 prepara d5 sin encerrar tu Alfil de c8.' },
      { uci: 'd2d4', text: 'Las blancas ocupan el centro.' },
      { uci: 'd7d5', text: 'Golpeas en el centro con d5.' },
      { uci: 'b1c3', text: 'Las blancas defienden e4.' },
      { uci: 'd5e4', text: 'Capturas en e4 para simplificar el centro.' },
      { uci: 'c3e4', text: 'Las blancas centralizan su Caballo.' },
      { uci: 'c8f5', text: 'Alfil f5: desarrollas tu Alfil fuera de la cadena de peones con ganancia de tiempo.' }
    ]
  },
  {
    id: 'def-kid',
    category: 'defenses',
    tier: 'pro',
    side: 'b',
    positionId: 518,
    title: 'Defensa India de Rey',
    summary: 'Estilo hipermoderno: cedes el centro al inicio, fianchetas tu Alfil en g7 y lanzas un ataque explosivo al Rey blanco.',
    steps: [
      { uci: 'd2d4', text: 'Las blancas abren con d4.' },
      { uci: 'g8f6', text: 'Caballo f6 evita que las blancas jueguen e4 de inmediato.' },
      { uci: 'c2c4', text: 'Las blancas expanden su centro.' },
      { uci: 'g7g6', text: 'Peón a g6 prepara el poderoso Alfil en fianchetto en g7.' },
      { uci: 'b1c3', text: 'Las blancas se preparan para e4.' },
      { uci: 'f8g7', text: 'Alfil g7: el corazón de la India de Rey, dominando toda la gran diagonal oscura.' },
      { uci: 'e2e4', text: 'Las blancas forman un centro amplio.' },
      { uci: 'd7d6', text: 'Peón a d6 frena e5 y prepara futuras rupturas con e5 o c5.' },
      { uci: 'g1f3', text: 'Las blancas completan su desarrollo.' },
      { castle: 'K', text: 'Enroque corto. Tu Rey está seguro y ahora preparas e5 para iniciar el contragolpe.' }
    ]
  },

  // === GAMBITOS ===
  {
    id: 'gam-queen',
    category: 'gambits',
    tier: 'free',
    side: 'w',
    positionId: 518,
    title: 'Gambito de Dama',
    summary: 'Ofreces el peón lateral de c4 para desviar al peón central negro y adueñarte del tablero.',
    steps: [
      { uci: 'd2d4', text: 'Peón a d4.' },
      { uci: 'd7d5', text: 'Las negras igualan en el centro.' },
      { uci: 'c2c4', text: 'Peón a c4: el Gambito de Dama. Ofreces el peón lateral para desestabilizar d5.' },
      { uci: 'd5c4', text: 'Si las negras aceptan el gambito, abandonan el centro.' },
      { uci: 'e2e3', text: 'Peón a e3 abre tu Alfil para recuperar el peón de c4 cómodamente.' },
      { uci: 'b7b5', text: 'Si el rival intenta aferrarse al peón extra con b5, cae en problemas.' },
      { uci: 'a2a4', text: 'Golpe a4: destruyes su cadena de peones del flanco de dama y recuperas el material con ventaja.' }
    ]
  },
  {
    id: 'gam-king',
    category: 'gambits',
    tier: 'pro',
    side: 'w',
    positionId: 518,
    title: 'Gambito de Rey',
    summary: 'Espíritu romántico puro: sacrificas el peón de f4 para abrir la columna f y lanzar un ataque relámpago.',
    steps: [
      { uci: 'e2e4', text: 'Peón a e4.' },
      { uci: 'e7e5', text: 'Las negras contestan e5.' },
      { uci: 'f2f4', text: 'Peón a f4: el Gambito de Rey. Atacas e5 y buscas abrir la columna f para tu Torre.' },
      { uci: 'e5f4', text: 'Las negras aceptan el peón.' },
      { uci: 'g1f3', text: 'Caballo f3 evita el molesto jaque de Dama en h4.' },
      { uci: 'g7g5', text: 'Las negras intentan sostener su peón de ventaja.' },
      { uci: 'f1c4', text: 'Alfil c4 apunta a f7, preparando el enroque rápido y un ataque explosivo sobre la columna f.' }
    ]
  },
  {
    id: 'gam-evans',
    category: 'gambits',
    tier: 'pro',
    side: 'w',
    positionId: 518,
    title: 'Gambito Evans',
    summary: 'Sacrificio táctico dentro de la Italiana para ganar tiempos de desarrollo y construir un centro imparable.',
    steps: [
      { uci: 'e2e4', text: 'Peón a e4.' },
      { uci: 'e7e5', text: 'Respuesta e5.' },
      { uci: 'g1f3', text: 'Caballo f3.' },
      { uci: 'b8c6', text: 'Caballo c6.' },
      { uci: 'f1c4', text: 'Alfil c4.' },
      { uci: 'f8c5', text: 'Alfil c5.' },
      { uci: 'b2b4', text: '¡Gambito Evans! Sacrificas el peón de b4 para desviar al Alfil negro y ganar velocidad.' },
      { uci: 'c5b4', text: 'Las negras capturan en b4.' },
      { uci: 'c2c3', text: 'Peón a c3 gana un tiempo atacando al Alfil y prepara d4.' },
      { uci: 'b4a5', text: 'El Alfil negro se retira a a5.' },
      { uci: 'd2d4', text: 'Peón a d4: consigues un centro dominante y ventaja de desarrollo a cambio de un solo peón.' }
    ]
  }
];

function ensureAcademyStyles() {
  if (document.querySelector('style[data-academy-css]')) return;
  const style = document.createElement('style');
  style.dataset.academyCss = 'true';
  style.textContent = `
    .ac-studio {
      display: grid;
      grid-template-columns: minmax(290px, 560px) minmax(270px, 1fr);
      gap: 20px;
      align-items: start;
    }
    .ac-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ac-mode-switch {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .ac-step-box {
      background: rgba(9, 13, 22, 0.65);
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--accent-cyan);
      border-radius: 10px;
      padding: 12px;
      font-size: 0.85rem;
      line-height: 1.5;
      color: var(--text-main);
    }
    .ac-step-box.ok {
      border-left-color: #22c55e;
      background: rgba(34, 197, 94, 0.12);
    }
    .ac-step-box.err {
      border-left-color: #f43f5e;
      background: rgba(244, 63, 94, 0.14);
    }
    .ac-line-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.76rem;
    }
    .ac-move-pill {
      padding: 2px 7px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }
    .ac-move-pill.done {
      color: var(--text-main);
      border-color: rgba(56, 189, 248, 0.45);
    }
    .ac-move-pill.now {
      background: rgba(56, 189, 248, 0.22);
      color: var(--accent-cyan);
      border-color: var(--accent-cyan);
      font-weight: 800;
    }
    @media (max-width: 880px) {
      .ac-studio { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

function speakSpanish(text, enabled) {
  if (!enabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices() || [];
    const es = voices.filter(v => (v.lang || '').toLowerCase().startsWith('es'));
    const best = es.find(v => /natural|online|google|neural/i.test(v.name)) || es[0] || null;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = best?.lang || 'es-ES';
    if (best) u.voice = best;
    u.rate = 1.03;
    setTimeout(() => window.speechSynthesis.speak(u), 40);
  } catch { /* ignorar */ }
}

function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch { /* ignorar */ }
  }
}

function resolveStepMove(engine, step) {
  const legal = engine.getLegalMoves(engine.turn);
  if (step.castle) {
    return legal.find(m => m.castle === step.castle) || null;
  }
  const f = { r: 8 - parseInt(step.uci[1], 10), c: FILES.indexOf(step.uci[0]) };
  const t = { r: 8 - parseInt(step.uci[3], 10), c: FILES.indexOf(step.uci[2]) };
  return legal.find(m => m.from.r === f.r && m.from.c === f.c && m.to.r === t.r && m.to.c === t.c) || null;
}

export class AcademyView {
  constructor({ rootEl, store, getCurrentThemeId, onBackHome, onOpenSubscription }) {
    ensureAcademyStyles();
    this.rootEl = rootEl;
    this.store = store;
    this.getCurrentThemeId = getCurrentThemeId;
    this.onBackHome = onBackHome;
    this.onOpenSubscription = onOpenSubscription;

    this.sound = new SoundFX();
    this.category = 'basics';
    this.completed = this._loadCompleted();
    this.voiceOn = true;

    this.activeLesson = null;
    this.practiceMode = false;
    this.engine = null;
    this.fx = null;
    this.stepIdx = 0;
    this.playedSans = [];
    this.selected = null;
    this.legalForSelected = [];
    this.hiddenSquares = new Set();
    this.isAnimating = false;
    this.customFeedback = null;
    this._animToken = 0;
  }

  _loadCompleted() {
    try {
      const raw = localStorage.getItem(COMPLETED_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  _saveCompleted() {
    try {
      localStorage.setItem(COMPLETED_KEY, JSON.stringify([...this.completed]));
    } catch { /* ignorar */ }
  }

  _theme() {
    const id = this.getCurrentThemeId ? this.getCurrentThemeId() : 'neon';
    return THEMES[id] || THEMES.neon;
  }

  destroy() {
    this._animToken++;
    stopSpeech();
    if (this.fx) this.fx.cancelActive();
    this.fx = null;
  }

  render() {
    if (this.activeLesson) {
      this._renderStudioShell();
    } else {
      this._renderCatalog();
    }
  }

  _renderCatalog() {
    this.destroy();
    const hasPro = this.store.hasAccess('pro_academy');
    const lessons = ACADEMY_LESSONS.filter(l => l.category === this.category);

    this.rootEl.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>🎓 Academia (${this.completed.size}/${ACADEMY_LESSONS.length} completadas)</h2>
          <p class="sec-sub">Aprende fundamentos, Aperturas, Defensas y Gambitos paso a paso con voz y práctica interactiva.</p>
        </div>
        <button class="btn btn-secondary" id="ac-back-home">← Volver al Inicio</button>
      </div>

      <div class="pz-tabs">
        ${ACADEMY_CATEGORIES.map(cat => `
          <button class="pz-tab ${this.category === cat.id ? 'active' : ''}" data-cat="${cat.id}">${cat.label}</button>
        `).join('')}
      </div>

      <div class="pz-grid">
        ${lessons.map(l => {
          const done = this.completed.has(l.id);
          const locked = l.tier === 'pro' && !hasPro;
          return `
            <button class="pz-card ${done ? 'solved' : ''}" data-open-lesson="${l.id}" data-locked="${locked}">
              <div class="pz-card-top">
                <span class="curr-pill">${l.side === 'w' ? '⚪ Blancas' : '⚫ Negras'} · ${l.steps.length} jugadas</span>
                <span class="mode-card-tag ${locked ? 'soon' : ''}">
                  ${locked ? '🔒 PRO' : (done ? '✓ COMPLETADA' : 'ESTUDIAR')}
                </span>
              </div>
              <h3 style="font-size:0.98rem">${l.title}</h3>
              <p class="sec-sub">${l.summary}</p>
            </button>
          `;
        }).join('')}
      </div>
    `;

    this.rootEl.querySelector('#ac-back-home')?.addEventListener('click', () => this.onBackHome());
    this.rootEl.querySelectorAll('.pz-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.category = btn.dataset.cat;
        this._renderCatalog();
      });
    });
    this.rootEl.querySelectorAll('[data-open-lesson]').forEach(card => {
      card.addEventListener('click', () => {
        if (card.dataset.locked === 'true') {
          this.onOpenSubscription();
          return;
        }
        const lesson = ACADEMY_LESSONS.find(x => x.id === card.dataset.openLesson);
        if (lesson) this.openLesson(lesson, false);
      });
    });
  }

  openLesson(lesson, practiceMode = false) {
    this.destroy();
    this.activeLesson = lesson;
    this.practiceMode = practiceMode;
    this.flipped = lesson.side === 'b';
    this.engine = new Chess960Engine(lesson.positionId);
    this.stepIdx = 0;
    this.playedSans = [];
    this.selected = null;
    this.legalForSelected = [];
    this.hiddenSquares.clear();
    this.isAnimating = false;
    this.customFeedback = null;

    this._renderStudioShell();
    speakSpanish(`${lesson.title}.${lesson.summary}`, this.voiceOn);

    // En modo práctica, si el usuario juega con Negras, ejecutar automáticamente la jugada 1 de Blancas
    if (this.practiceMode && this.engine.turn !== this.activeLesson.side) {
      this._scheduleOpponentPracticeMove();
    }
  }

  _renderStudioShell() {
    const l = this.activeLesson;
    const theme = this._theme();

    this.rootEl.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>🎓 ${l.title}</h2>
          <p class="sec-sub">${l.summary}</p>
        </div>
        <button class="btn btn-secondary" id="ac-back-list">← Catálogo Academia</button>
      </div>

      <div class="ac-studio">
        <div class="board-stage">
          <div class="board-wrapper" id="ac-board-wrapper">
            <div class="board-grid" id="ac-board-grid"></div>
            <svg class="tactical-svg" id="ac-svg" viewBox="0 0 800 800" preserveAspectRatio="none"></svg>
            <canvas class="fx-canvas" id="ac-fx-canvas"></canvas>
          </div>
        </div>

        <div class="ac-panel">
          <div class="card">
            <div class="ac-mode-switch">
              <button class="btn ${!this.practiceMode ? 'btn-primary' : 'btn-secondary'}" id="ac-mode-guided">📖 Guiado</button>
              <button class="btn ${this.practiceMode ? 'btn-primary' : 'btn-secondary'}" id="ac-mode-practice">🎯 Practicar Yo</button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 id="ac-step-counter">Paso 0 / ${l.steps.length}</h2>
              <button class="btn-tiny" id="ac-voice-toggle">${this.voiceOn ? '🔊 Voz: ON' : '🔇 Voz: OFF'}</button>
            </div>
            <div class="ac-step-box" id="ac-step-box"></div>
            <div class="ac-line-chips" id="ac-line-chips" style="margin-top:10px"></div>
          </div>

          <div class="card">
            <div class="pz-actions" id="ac-controls">
              <button class="btn btn-secondary" id="ac-prev">◀ Anterior</button>
              <button class="btn btn-primary" id="ac-next">Siguiente ▶</button>
              <button class="btn btn-secondary" id="ac-restart">↺ Reiniciar</button>
              <button class="btn btn-ghost" id="ac-replay-voice">🗣 Repetir</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.boardWrapper = this.rootEl.querySelector('#ac-board-wrapper');
    this.boardGrid = this.rootEl.querySelector('#ac-board-grid');
    this.svgEl = this.rootEl.querySelector('#ac-svg');
    this.fxCanvas = this.rootEl.querySelector('#ac-fx-canvas');
    this.stepBoxEl = this.rootEl.querySelector('#ac-step-box');
    this.counterEl = this.rootEl.querySelector('#ac-step-counter');
    this.chipsEl = this.rootEl.querySelector('#ac-line-chips');
    this.prevBtn = this.rootEl.querySelector('#ac-prev');
    this.nextBtn = this.rootEl.querySelector('#ac-next');

    this.fx = new CombatFX(this.fxCanvas, this.boardWrapper);
    this.fx.setPalette(theme.fxPalette);
    requestAnimationFrame(() => this.fx?._resize());

    this.rootEl.querySelector('#ac-back-list')?.addEventListener('click', () => {
      this.activeLesson = null;
      this._renderCatalog();
    });
    this.rootEl.querySelector('#ac-mode-guided')?.addEventListener('click', () => {
      if (this.practiceMode) this.openLesson(this.activeLesson, false);
    });
    this.rootEl.querySelector('#ac-mode-practice')?.addEventListener('click', () => {
      if (!this.practiceMode) this.openLesson(this.activeLesson, true);
    });
    this.rootEl.querySelector('#ac-voice-toggle')?.addEventListener('click', (e) => {
      this.voiceOn = !this.voiceOn;
      e.target.textContent = this.voiceOn ? '🔊 Voz: ON' : '🔇 Voz: OFF';
      if (!this.voiceOn) stopSpeech();
    });
    this.rootEl.querySelector('#ac-restart')?.addEventListener('click', () => {
      this.openLesson(this.activeLesson, this.practiceMode);
    });
    this.rootEl.querySelector('#ac-replay-voice')?.addEventListener('click', () => {
      const txt = this.stepIdx > 0
        ? this.activeLesson.steps[this.stepIdx - 1].text
        : `${this.activeLesson.title}.${this.activeLesson.summary}`;
      speakSpanish(txt, true);
    });
    this.prevBtn?.addEventListener('click', () => this._stepBack());
    this.nextBtn?.addEventListener('click', () => this._stepForward());

    this._renderStudioState();
  }

  _stepForward() {
    if (this.isAnimating || this.stepIdx >= this.activeLesson.steps.length) return;
    const step = this.activeLesson.steps[this.stepIdx];
    const move = resolveStepMove(this.engine, step);
    if (!move) return;

    this.customFeedback = null;
    this._executeLessonMove(move, step, () => {
      if (this.stepIdx >= this.activeLesson.steps.length) {
        this._markLessonCompleted();
      }
      speakSpanish(step.text, this.voiceOn);
    });
  }

  _stepBack() {
    if (this.isAnimating || this.stepIdx <= 0) return;
    stopSpeech();
    this.engine.undo();
    this.stepIdx--;
    this.playedSans.pop();
    this.selected = null;
    this.legalForSelected = [];
    this.customFeedback = null;
    this._renderStudioState();
  }

  _scheduleOpponentPracticeMove() {
    const token = this._animToken;
    setTimeout(() => {
      if (token !== this._animToken || !this.activeLesson || !this.practiceMode) return;
      if (this.stepIdx >= this.activeLesson.steps.length) return;
      if (this.engine.turn === this.activeLesson.side) return;

      const step = this.activeLesson.steps[this.stepIdx];
      const move = resolveStepMove(this.engine, step);
      if (!move) return;

      this._executeLessonMove(move, step, () => {
        if (this.stepIdx >= this.activeLesson.steps.length) {
          this._markLessonCompleted();
        }
      });
    }, 480);
  }

  _handleSquareClick(r, c) {
    if (!this.practiceMode || this.isAnimating) return;
    if (this.stepIdx >= this.activeLesson.steps.length) return;
    if (this.engine.turn !== this.activeLesson.side) return;

    if (this.selected) {
      const direct = this.legalForSelected.filter(m => m.to.r === r && m.to.c === c);
      const castleByDest = this.legalForSelected.filter(m => m.castle && m.from.r === r && m.kingToCol === c);
      const candidates = direct.length ? direct : castleByDest;

      if (candidates.length > 0) {
        const chosen = candidates[0];
        const step = this.activeLesson.steps[this.stepIdx];
        const expected = resolveStepMove(this.engine, step);

        const isMatch = expected && (
          (expected.castle && chosen.castle === expected.castle) ||
          (!expected.castle &&
            chosen.from.r === expected.from.r &&
            chosen.from.c === expected.from.c &&
            chosen.to.r === expected.to.r &&
            chosen.to.c === expected.to.c)
        );

        if (!isMatch) {
          this.selected = null;
          this.legalForSelected = [];
          this.sound.playCheck();
          this.customFeedback = {
            type: 'err',
            text: 'Sigue la flecha verde en el tablero para ejecutar la jugada de la lección.'
          };
          this._renderStudioState();
          return;
        }

        this.customFeedback = null;
        this._executeLessonMove(chosen, step, () => {
          speakSpanish(step.text, this.voiceOn);
          if (this.stepIdx >= this.activeLesson.steps.length) {
            this._markLessonCompleted();
            this._renderStudioState();
          } else {
            this._scheduleOpponentPracticeMove();
          }
        });
        return;
      }
    }

    const piece = this.engine.board[r][c];
    if (piece && piece.color === this.engine.turn) {
      if (this.selected && this.selected.r === r && this.selected.c === c) {
        this.selected = null;
        this.legalForSelected = [];
      } else {
        this.selected = { r, c };
        this.legalForSelected = this.engine.getLegalMovesFrom(r, c);
      }
      this._renderStudioState();
    } else {
      this.selected = null;
      this.legalForSelected = [];
      this._renderStudioState();
    }
  }

  _executeLessonMove(move, step, onDone) {
    const token = ++this._animToken;
    const theme = this._theme();
    const moverColor = this.engine.turn;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const record = this.engine.makeMove(move);

    this.stepIdx++;
    this.playedSans.push(record.san);
    this.selected = null;
    this.legalForSelected = [];
    this.isAnimating = true;
    this.hiddenSquares.clear();

    const finish = () => {
      if (token !== this._animToken) return;
      this.hiddenSquares.clear();
      this.isAnimating = false;
      this._renderStudioState();
      if (onDone) onDone();
    };

    if (record.castle) {
      const row = record.from.r;
      this.hiddenSquares.add(`${row},${record.kingToCol}`);
      this.hiddenSquares.add(`${row},${record.rookToCol}`);
      this._renderStudioState();
      this.sound.playCastle();

      this.fx.animateCastle({
        kingHtml: theme.renderPiece('K', moverColor),
        rookHtml: theme.renderPiece('R', moverColor),
        row,
        kingFrom: record.from.c,
        kingTo: record.kingToCol,
        rookFrom: record.rookFromCol,
        rookTo: record.rookToCol,
        flipped: this.flipped,
        onComplete: finish
      });
      return;
    }

    if (record.captured) {
      this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
      this._renderStudioState();

      this.fx.playCombatSequence({
        pieceType: record.piece,
        attackerHtml: theme.renderPiece(record.promo || record.piece, moverColor),
        victimHtml: theme.renderPiece(record.captured, enemyColor),
        from: record.from,
        to: record.to,
        flipped: this.flipped,
        onCharge: () => this.sound.playCharge(record.piece),
        onImpact: () => this.sound.playAttack(record.piece),
        onComplete: finish
      });
      return;
    }

    this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
    this._renderStudioState();
    this.sound.playMove(record.piece);

    this.fx.animateRegularMove({
      pieceHtml: theme.renderPiece(record.promo || record.piece, moverColor),
      pieceType: record.piece,
      from: record.from,
      to: record.to,
      flipped: this.flipped,
      onComplete: finish
    });
  }

  _markLessonCompleted() {
    if (!this.completed.has(this.activeLesson.id)) {
      this.completed.add(this.activeLesson.id);
      this._saveCompleted();
      this.store.addMessage({
        icon: '🎓',
        title: `Lección completada: ${this.activeLesson.title}`,
        body: 'Has completado esta guía de la Academia. Ya puedes practicarla libremente en el tablero.'
      });
      this.store.save();
    }
  }

  _renderStudioState() {
    if (!this.boardGrid || !this.engine) return;
    const theme = this._theme();
    const l = this.activeLesson;
    const total = l.steps.length;
    const lastMove = this.engine.history[this.engine.history.length - 1] || null;

    this.boardGrid.innerHTML = '';

    for (let vr = 0; vr < 8; vr++) {
      for (let vc = 0; vc < 8; vc++) {
        const r = this.flipped ? 7 - vr : vr;
        const c = this.flipped ? 7 - vc : vc;

        const sq = document.createElement('div');
        sq.className = `square ${(r + c) \% 2 === 0 ? 'light' : 'dark'}`;  if (lastMove) { const toCol = lastMove.castle ? lastMove.kingToCol : lastMove.to.c; if (lastMove.from.r === r && lastMove.from.c === c) sq.classList.add('last-from'); if (lastMove.to.r === r && toCol === c) sq.classList.add('last-to'); } if (this.selected && this.selected.r === r && this.selected.c === c) { sq.classList.add('selected'); }  if (this.practiceMode) { const matching = this.legalForSelected.filter(m => m.to.r === r && m.to.c === c); const castleMatch = matching.find(m => m.castle); if (castleMatch) { sq.classList.add('castle-target'); } else if (matching.length > 0) { const isCap = matching.some(m => m.captured \vert{}\vert{} m.ep); const marker = document.createElement('div'); marker.className = isCap ? 'capture-ring' : 'move-dot'; sq.appendChild(marker); } }  if (vc === 0) { const rankEl = document.createElement('span'); rankEl.className = 'coord-rank'; rankEl.textContent = 8 - r; sq.appendChild(rankEl); } if (vr === 7) { const fileEl = document.createElement('span'); fileEl.className = 'coord-file'; fileEl.textContent = FILES[c]; sq.appendChild(fileEl); }  const piece = this.engine.board[r][c]; if (piece && !this.hiddenSquares.has(`${r},${c}`)) { const wrap = document.createElement('div'); wrap.className = 'piece-wrap'; wrap.innerHTML = theme.renderPiece(piece.type, piece.color); sq.appendChild(wrap); }  sq.addEventListener('click', () => this._handleSquareClick(r, c)); this.boardGrid.appendChild(sq); } }  // Dibujar flecha verde guiando la siguiente jugada this.svgEl.innerHTML = ''; if (!this.isAnimating && this.stepIdx < total) { const showGuideArrow = !this.practiceMode \vert{}\vert{} this.engine.turn === l.side; if (showGuideArrow) { const nextMove = resolveStepMove(this.engine, l.steps[this.stepIdx]); if (nextMove) { const toCol = nextMove.castle ? nextMove.kingToCol : nextMove.to.c; const visualToCol = (nextMove.castle && toCol === nextMove.from.c) ? nextMove.rookFromCol : toCol; this._drawArrow(nextMove.from.r, nextMove.from.c, nextMove.to.r, visualToCol, '#22c55e'); } } }  // Textos y botones this.counterEl.textContent = `Paso ${this.stepIdx} / ${total}`; if (this.prevBtn) { this.prevBtn.style.display = this.practiceMode ? 'none' : 'inline-block'; this.prevBtn.disabled = this.stepIdx === 0; } if (this.nextBtn) { this.nextBtn.style.display = this.practiceMode ? 'none' : 'inline-block'; this.nextBtn.disabled = this.stepIdx >= total; }  if (this.customFeedback) { this.stepBoxEl.className = `ac-step-box ${this.customFeedback.type}`;
      this.stepBoxEl.textContent = this.customFeedback.text;
    } else if (this.stepIdx >= total) {
      this.stepBoxEl.className = 'ac-step-box ok';
      this.stepBoxEl.textContent = `✓ ¡Lección completada! ${l.steps[total - 1].text}`; } else if (this.stepIdx === 0) { this.stepBoxEl.className = 'ac-step-box'; this.stepBoxEl.textContent = this.practiceMode ? 'Modo Práctica: ejecuta en el tablero la jugada marcada con la flecha verde.' : 'Pulsa Siguiente ▶ para ver y escuchar cada jugada de la línea paso a paso.'; } else { this.stepBoxEl.className = 'ac-step-box'; this.stepBoxEl.textContent = l.steps[this.stepIdx - 1].text; }  this.chipsEl.innerHTML = this.playedSans.map((san, idx) => { const cls = idx === this.playedSans.length - 1 ? 'now' : 'done'; const prefix = idx \% 2 === 0 ? `${Math.floor(idx / 2) + 1}. ` : '';
      return `<span class="ac-move-pill ${cls}">${prefix}${san}</span>`;
    }).join('');
  }

  _drawArrow(fromR, fromC, toR, toC, color) {
    const ns = 'http://www.w3.org/2000/svg';
    const vr1 = this.flipped ? 7 - fromR : fromR;
    const vc1 = this.flipped ? 7 - fromC : fromC;
    const vr2 = this.flipped ? 7 - toR : toR;
    const vc2 = this.flipped ? 7 - toC : toC;

    const x1 = vc1 * 100 + 50;
    const y1 = vr1 * 100 + 50;
    const x2 = vc2 * 100 + 50;
    const y2 = vr2 * 100 + 50;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 10) return;

    const ux = dx / len;
    const uy = dy / len;

    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', x1 + ux * 18);
    line.setAttribute('y1', y1 + uy * 18);
    line.setAttribute('x2', x2 - ux * 26);
    line.setAttribute('y2', y2 - uy * 26);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '14');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('opacity', '0.86');
    this.svgEl.appendChild(line);

    const tipX = x2 - ux * 6;
    const tipY = y2 - uy * 6;
    const baseX = x2 - ux * 32;
    const baseY = y2 - uy * 32;
    const px = -uy * 16;
    const py = ux * 16;
    const head = document.createElementNS(ns, 'polygon');
    head.setAttribute('points', `${tipX},${tipY} ${baseX + px},${baseY + py} ${baseX - px},${baseY - py}`);
    head.setAttribute('fill', color);
    head.setAttribute('opacity', '0.86');
    this.svgEl.appendChild(head);
  }
}
