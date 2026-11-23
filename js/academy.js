import { Chess960Engine, FILES } from './engine.js';
import { CombatFX } from './fx.js';
import { THEMES } from './themes.js';

function toUci(from, to) {
  return FILES[from.c] + (8 - from.r) + FILES[to.c] + (8 - to.r);
}

export const ACADEMY_LESSONS = [
  // === FUNDAMENTOS ===
  {
    id: 'bas-1',
    category: 'fundamentos',
    title: 'Reglas de Oro de la Apertura',
    positionId: 518,
    flipped: false,
    intro: 'Controla el centro, desarrolla Caballos y Alfiles rápido y protege a tu Rey con el enroque.',
    steps: [
      { uci: 'e2e4', text: 'Peón e 4. Toma el centro inmediatamente y abre diagonales para Dama y Alfil.' },
      { uci: 'e7e5', text: 'Las negras luchan por el mismo espacio central.' },
      { uci: 'g1f3', text: 'Caballo efe 3. Desarrolla una pieza menor atacando el peón central.' },
      { uci: 'b8c6', text: 'Caballo ce 6 defiende el peón y controla las casillas centrales.' },
      { uci: 'f1c4', text: 'Alfil ce 4. Apunta directo al punto más débil del rival: efe 7.' },
      { uci: 'f8c5', text: 'Alfil ce 5. Las negras replican el desarrollo activo.' },
      { uci: 'e1h1', text: 'Enroque corto. Resguardas al Rey y activas la Torre hacia el centro.' }
    ]
  },
  {
    id: 'bas-2',
    category: 'fundamentos',
    title: 'Cómo funciona el Enroque en Fischer 960',
    positionId: 230,
    flipped: false,
    intro: 'En Fischer 960 el Rey y la Torre siempre terminan en las mismas casillas clásicas (g1/f1 o c1/d1), sin importar dónde empezaron.',
    steps: [
      { uci: 'd2d4', text: 'En la posición 230 la Torre blanca empieza en be 1. Abrimos el centro.' },
      { uci: 'd7d5', text: 'Las negras ocupan el centro con peón de 5.' },
      { uci: 'c1f4', text: 'Desarrollamos el Alfil para despejar la primera fila.' },
      { uci: 'c8f5', text: 'Las negras imitan el desarrollo.' },
      { uci: 'd1d2', text: 'Movemos la Dama para dejar libres las casillas ce 1 y de 1.' },
      { uci: 'd8d7', text: 'Las negras preparan su propio enroque largo.' },
      { uci: 'e1b1', text: 'Enroque largo 960. Tocando el Rey y luego la Torre de be 1, el Rey aterriza en ce 1 y la Torre en de 1.' }
    ]
  },

  // === APERTURAS ===
  {
    id: 'ap-1',
    category: 'aperturas',
    title: 'Apertura Italiana',
    positionId: 518,
    flipped: false,
    intro: 'Una de las aperturas más clásicas y agresivas: busca ataque directo sobre f7 y ruptura central rápida.',
    steps: [
      { uci: 'e2e4', text: 'Peón e 4, apertura abierta clásica.' },
      { uci: 'e7e5', text: 'Respuesta simétrica en el centro.' },
      { uci: 'g1f3', text: 'Caballo efe 3 desarrolla con ganancia de tiempo.' },
      { uci: 'b8c6', text: 'Caballo ce 6 defiende e 5.' },
      { uci: 'f1c4', text: 'Alfil ce 4 define la Apertura Italiana, presionando efe 7.' },
      { uci: 'f8c5', text: 'Alfil ce 5 completa el Giuoco Piano.' },
      { uci: 'c2c3', text: 'Peón ce 3 prepara el avance central de 4 con apoyo.' },
      { uci: 'g8f6', text: 'Caballo efe 6 contraataca el peón de e 4.' },
      { uci: 'd2d4', text: 'Ruptura central de 4 abriendo líneas para todas las piezas blancas.' },
      { uci: 'e5d4', text: 'Las negras capturan para aliviar la tensión.' },
      { uci: 'c3d4', text: 'Recuperas con un centro poderoso y ventaja de espacio.' }
    ]
  },
  {
    id: 'ap-2',
    category: 'aperturas',
    title: 'Apertura Española (Ruy López)',
    positionId: 518,
    flipped: false,
    intro: 'Favorita de los Campeones Mundiales: presiona al defensor del peón central para lograr ventaja estratégica duradera.',
    steps: [
      { uci: 'e2e4', text: 'Peón e 4 domina el centro.' },
      { uci: 'e7e5', text: 'Peón e 5 responde.' },
      { uci: 'g1f3', text: 'Caballo efe 3 ataca e 5.' },
      { uci: 'b8c6', text: 'Caballo ce 6 protege el peón.' },
      { uci: 'f1b5', text: 'Alfil be 5 define la Española, presionando indirectamente el centro.' },
      { uci: 'a7a6', text: 'Peón a 6 cuestiona de inmediato al Alfil blanco.' },
      { uci: 'b5a4', text: 'El Alfil retrocede manteniendo la presión sobre la diagonal.' },
      { uci: 'g8f6', text: 'Caballo efe 6 desarrolla y ataca e 4.' },
      { uci: 'e1h1', text: 'Enroque corto. El peón de e 4 queda protegido tácticamente por la futura Torre en e 1.' }
    ]
  },
  {
    id: 'ap-3',
    category: 'aperturas',
    title: 'Sistema Londres',
    positionId: 518,
    flipped: false,
    intro: 'Esquema sólido y universal con Blancas: fácil de recordar y muy difícil de refutar.',
    steps: [
      { uci: 'd2d4', text: 'Peón de 4 controla las casillas centrales oscuras.' },
      { uci: 'd7d5', text: 'Las negras contestan en el centro.' },
      { uci: 'c1f4', text: 'Alfil efe 4 sale antes de cerrar la cadena de peones.' },
      { uci: 'g8f6', text: 'Caballo efe 6 desarrolla hacia el centro.' },
      { uci: 'e2e3', text: 'Peón e 3 consolida el triángulo central.' },
      { uci: 'e7e6', text: 'Las negras abren su Alfil de casillas oscuras.' },
      { uci: 'g1f3', text: 'Caballo efe 3 controla la casilla clave e 5.' },
      { uci: 'f8d6', text: 'Alfil de 6 ofrece el cambio del Alfil blanco.' },
      { uci: 'f4g3', text: 'Retrocedes a ge 3: si capturan, abres la columna hache para tu Torre.' }
    ]
  },

  // === DEFENSAS ===
  {
    id: 'def-1',
    category: 'defensas',
    title: 'Defensa Siciliana (Najdorf)',
    positionId: 518,
    flipped: true,
    intro: 'La defensa más combativa con Negras contra e4: rompe la simetría y busca contrajuego en el flanco de Dama.',
    steps: [
      { uci: 'e2e4', text: 'Las blancas inician con e 4.' },
      { uci: 'c7c5', text: 'Peón ce 5 plantea la Defensa Siciliana, luchando por de 4 con un peón lateral.' },
      { uci: 'g1f3', text: 'Caballo efe 3 prepara la ruptura central.' },
      { uci: 'd7d6', text: 'Peón de 6 controla e 5 y prepara desarrollo flexible.' },
      { uci: 'd2d4', text: 'Las blancas abren el centro.' },
      { uci: 'c5d4', text: 'Cambias peón lateral por peón central, quedando con mayoría en el centro.' },
      { uci: 'f3d4', text: 'El Caballo blanco retoma en el centro.' },
      { uci: 'g8f6', text: 'Caballo efe 6 ataca el peón de e 4.' },
      { uci: 'b1c3', text: 'Caballo ce 3 defiende e 4.' },
      { uci: 'a7a6', text: 'Peón a 6 define la variante Najdorf, evitando saltos rivales a be 5.' }
    ]
  },
  {
    id: 'def-2',
    category: 'defensas',
    title: 'Defensa Francesa',
    positionId: 518,
    flipped: true,
    intro: 'Estructura sólida con Negras diseñada para contraatacar la cadena central blanca.',
    steps: [
      { uci: 'e2e4', text: 'Las blancas abren con e 4.' },
      { uci: 'e7e6', text: 'Peón e 6 prepara el golpe central de 5 con respaldo.' },
      { uci: 'd2d4', text: 'Las blancas toman el centro completo.' },
      { uci: 'd7d5', text: 'Peón de 5 desafía de inmediato al peón blanco de e 4.' },
      { uci: 'b1c3', text: 'Caballo ce 3 defiende el centro.' },
      { uci: 'g8f6', text: 'Caballo efe 6 presiona todavía más sobre e 4.' },
      { uci: 'e4e5', text: 'Las blancas ganan espacio avanzando.' },
      { uci: 'f6d7', text: 'El Caballo se reagrupa preparando la ruptura típica con ce 5.' }
    ]
  },
  {
    id: 'def-3',
    category: 'defensas',
    title: 'Defensa Caro-Kann',
    positionId: 518,
    flipped: true,
    intro: 'Defensa sumamente sólida que permite activar el Alfil de casillas claras sin quedar encerrado.',
    steps: [
      { uci: 'e2e4', text: 'Las blancas juegan e 4.' },
      { uci: 'c7c6', text: 'Peón ce 6 define la Caro-Kann preparando de 5.' },
      { uci: 'd2d4', text: 'Las blancas ocupan el centro.' },
      { uci: 'd7d5', text: 'Golpe central inmediato en de 5.' },
      { uci: 'b1c3', text: 'Caballo ce 3 defiende e 4.' },
      { uci: 'd5e4', text: 'Liquidas la tensión en el centro.' },
      { uci: 'c3e4', text: 'El Caballo blanco centraliza.' },
      { uci: 'c8f5', text: 'Alfil efe 5 sale activamente atacando al Caballo antes de cerrar con e 6.' }
    ]
  },
  {
    id: 'def-4',
    category: 'defensas',
    title: 'Defensa India de Rey',
    positionId: 518,
    flipped: true,
    intro: 'Defensa hipermoderna: dejas que el rival ocupe el centro para destruirlo después con un fianchetto fulminante.',
    steps: [
      { uci: 'd2d4', text: 'Las blancas abren con de 4.' },
      { uci: 'g8f6', text: 'Caballo efe 6 impide e 4 inmediato.' },
      { uci: 'c2c4', text: 'Peón ce 4 gana espacio.' },
      { uci: 'g7g6', text: 'Peón ge 6 prepara el fianchetto del Alfil negro.' },
      { uci: 'b1c3', text: 'Caballo ce 3 apoya el avance e 4.' },
      { uci: 'f8g7', text: 'El Alfil en ge 7 domina toda la gran diagonal oscura.' },
      { uci: 'e2e4', text: 'Las blancas construyen un gran centro.' },
      { uci: 'd7d6', text: 'Peón de 6 frena e 5 y prepara el contragolpe.' },
      { uci: 'g1f3', text: 'Desarrollo natural blanco.' },
      { uci: 'e8h8', text: 'Enroque corto rápido; ahora las negras atacarán con e 5 o ce 5.' }
    ]
  },

  // === GAMBITOS ===
  {
    id: 'gam-1',
    category: 'gambitos',
    title: 'Gambito de Dama',
    positionId: 518,
    flipped: false,
    intro: 'El gambito más respetado del ajedrez: ofreces un peón lateral para desviar al peón central negro.',
    steps: [
      { uci: 'd2d4', text: 'Peón de 4 ocupa el centro.' },
      { uci: 'd7d5', text: 'Las negras igualan el espacio central.' },
      { uci: 'c2c4', text: 'Peón ce 4 plantea el Gambito de Dama, atacando de 5.' },
      { uci: 'e7e6', text: 'Gambito de Dama Declinado: las negras mantienen su centro firme.' },
      { uci: 'b1c3', text: 'Caballo ce 3 aumenta la presión sobre de 5.' },
      { uci: 'g8f6', text: 'Caballo efe 6 refuerza el centro negro.' },
      { uci: 'c1g5', text: 'Alfil ge 5 clava al Caballo, intensificando la presión.' },
      { uci: 'f8e7', text: 'Alfil e 7 rompe la clavada y prepara el enroque.' }
    ]
  },
  {
    id: 'gam-2',
    category: 'gambitos',
    title: 'Gambito de Rey',
    positionId: 518,
    flipped: false,
    intro: 'Sacrificio romántico y explosivo para abrir la columna f y lanzar un ataque directo al Rey.',
    steps: [
      { uci: 'e2e4', text: 'Peón e 4 inicia la lucha.' },
      { uci: 'e7e5', text: 'Las negras responden e 5.' },
      { uci: 'f2f4', text: 'Peón efe 4 lanza el Gambito de Rey, sacrificando un peón por ataque.' },
      { uci: 'e5f4', text: 'Las negras aceptan el gambito.' },
      { uci: 'g1f3', text: 'Caballo efe 3 impide el jaque de Dama en hache 4.' },
      { uci: 'g7g5', text: 'Las negras intentan sostener el peón extra.' },
      { uci: 'f1c4', text: 'Alfil ce 4 apunta a efe 7 con desarrollo relámpago.' }
    ]
  },
  {
    id: 'gam-3',
    category: 'gambitos',
    title: 'Gambito Evans',
    positionId: 518,
    flipped: false,
    intro: 'Sacrificio táctico dentro de la Italiana para ganar tiempos de desarrollo y apoderarte del centro.',
    steps: [
      { uci: 'e2e4', text: 'Peón e 4.' },
      { uci: 'e7e5', text: 'Peón e 5.' },
      { uci: 'g1f3', text: 'Caballo efe 3.' },
      { uci: 'b8c6', text: 'Caballo ce 6.' },
      { uci: 'f1c4', text: 'Alfil ce 4.' },
      { uci: 'f8c5', text: 'Alfil ce 5.' },
      { uci: 'b2b4', text: 'Peón be 4, el famoso Gambito Evans: desvías al Alfil negro ganando iniciativa.' },
      { uci: 'c5b4', text: 'El Alfil negro captura el peón.' },
      { uci: 'c2c3', text: 'Peón ce 3 ataca al Alfil y prepara de 4.' },
      { uci: 'b4a5', text: 'El Alfil retrocede.' },
      { uci: 'd2d4', text: 'Golpe central de 4 con ataque fulminante y líneas abiertas.' }
    ]
  }
];

const CATEGORIES = [
  { id: 'fundamentos', label: '📘 Principiantes' },
  { id: 'aperturas',   label: '⚔️ Aperturas' },
  { id: 'defensas',    label: '🛡️ Defensas' },
  { id: 'gambitos',    label: '🔥 Gambitos' }
];

function ensureAcademyStyles() {
  if (document.querySelector('style[data-academy-css]')) return;
  const style = document.createElement('style');
  style.dataset.academyCss = 'true';
  style.textContent = `
    .ac-layout {
      display: grid;
      grid-template-columns: minmax(280px, 520px) minmax(260px, 1fr);
      gap: 20px;
      align-items: start;
    }
    .ac-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
    .ac-note {
      background: rgba(9, 13, 22, 0.68);
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--accent-cyan);
      border-radius: 10px;
      padding: 12px;
      font-size: 0.86rem;
      line-height: 1.5;
      min-height: 76px;
    }
    .ac-controls {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .ac-list { display: flex; flex-direction: column; gap: 7px; }
    .ac-item {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 10px 12px;
      cursor: pointer;
      color: var(--text-main);
      text-align: left;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ac-item:hover, .ac-item.active {
      border-color: var(--accent-cyan);
      background: rgba(56, 189, 248, 0.14);
    }
    @media (max-width: 860px) {
      .ac-layout { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

export class AcademyView {
  constructor({ container, sound, getThemeId, onBack }) {
    ensureAcademyStyles();
    this.container = container;
    this.sound = sound;
    this.getThemeId = getThemeId;
    this.onBack = onBack;

    this.category = 'aperturas';
    this.lesson = ACADEMY_LESSONS.find(l => l.category === this.category) || ACADEMY_LESSONS[0];
    this.stepIdx = 0;
    this.voiceOn = true;
    this.hiddenSquares = new Set();
    this._token = 0;
    this.engine = new Chess960Engine(518);
    this.fx = null;

    this._mountLayout();
    this.loadLesson(this.lesson);
  }

  destroy() {
    this._token++;
    this.fx?.cancelActive();
    this._stopSpeech();
  }

  _getTheme() {
    const id = this.getThemeId?.() || 'neon';
    return THEMES[id] || THEMES.neon;
  }

  _stopSpeech() {
    try { window.speechSynthesis?.cancel(); } catch { /* ignorar */ }
  }

  _speak(text) {
    if (!this.voiceOn || !text || !('speechSynthesis' in window)) return;
    this._stopSpeech();
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices() || [];
      const es = voices.find(v => /natural|google|online/i.test(v.name) && (v.lang || '').toLowerCase().startsWith('es'))
        || voices.find(v => (v.lang || '').toLowerCase().startsWith('es'));
      if (es) u.voice = es;
      u.lang = es?.lang || 'es-ES';
      u.rate = 1.04;
      try { window.speechSynthesis.speak(u); } catch { /* ignorar */ }
    }, 45);
  }

  _mountLayout() {
    this.container.innerHTML = `
      <div class="sec-head">
        <div>
          <h2>🎓 Academia: Aprender, Aperturas, Defensas y Gambitos</h2>
          <p class="sec-sub">Explora los planes clave jugada por jugada con animaciones y explicación hablada.</p>
        </div>
        <button id="ac-back" class="btn btn-secondary">← Volver al Inicio</button>
      </div>

      <div class="ac-tabs">
        ${CATEGORIES.map(c => `
          <button class="btn ${c.id === this.category ? 'btn-primary' : 'btn-secondary'}" data-ac-cat="${c.id}">${c.label}</button>
        `).join('')}
      </div>

      <div class="ac-layout">
        <div class="board-column">
          <div class="board-wrapper" id="ac-board-wrapper">
            <div class="board-grid" id="ac-board-grid"></div>
            <canvas class="fx-canvas" id="ac-fx-canvas"></canvas>
          </div>
        </div>

        <div class="side-panel">
          <div class="card" style="display:flex;flex-direction:column;gap:10px">
            <div class="status-row">
              <span class="pos-badge" id="ac-badge"></span>
              <span class="turn-pill" id="ac-step-label"></span>
            </div>
            <h3 id="ac-title" style="font-size:1.05rem"></h3>
            <div class="ac-note" id="ac-note"></div>
            <div class="ac-controls">
              <button id="ac-first" class="btn btn-secondary" title="Inicio">⏮</button>
              <button id="ac-prev" class="btn btn-secondary" title="Anterior">◀</button>
              <button id="ac-next" class="btn btn-primary" title="Siguiente">▶</button>
              <button id="ac-voice" class="btn btn-secondary active" title="Voz del profesor">🔊 Voz</button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2>Lecciones</h2>
              <span class="mini-hint" id="ac-count"></span>
            </div>
            <div class="ac-list" id="ac-list"></div>
          </div>
        </div>
      </div>
    `;

    this.dom = {
      wrapper: this.container.querySelector('#ac-board-wrapper'),
      grid: this.container.querySelector('#ac-board-grid'),
      canvas: this.container.querySelector('#ac-fx-canvas'),
      badge: this.container.querySelector('#ac-badge'),
      stepLabel: this.container.querySelector('#ac-step-label'),
      title: this.container.querySelector('#ac-title'),
      note: this.container.querySelector('#ac-note'),
      list: this.container.querySelector('#ac-list'),
      count: this.container.querySelector('#ac-count'),
      btnVoice: this.container.querySelector('#ac-voice')
    };

    this.fx = new CombatFX(this.dom.canvas, this.dom.wrapper);
    this.fx.setPalette(this._getTheme().fxPalette);

    this.container.querySelector('#ac-back').addEventListener('click', () => {
      this.destroy();
      this.onBack?.();
    });

    this.container.querySelectorAll('[data-ac-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.category = btn.dataset.acCat;
        this.container.querySelectorAll('[data-ac-cat]').forEach(b => {
          b.className = b.dataset.acCat === this.category ? 'btn btn-primary' : 'btn btn-secondary';
        });
        const first = ACADEMY_LESSONS.find(l => l.category === this.category);
        if (first) this.loadLesson(first);
      });
    });

    this.container.querySelector('#ac-first').addEventListener('click', () => this.goToStep(0, false));
    this.container.querySelector('#ac-prev').addEventListener('click', () => this.goToStep(this.stepIdx - 1, false));
    this.container.querySelector('#ac-next').addEventListener('click', () => this.goToStep(this.stepIdx + 1, true));
    this.dom.btnVoice.addEventListener('click', () => {
      this.voiceOn = !this.voiceOn;
      this.dom.btnVoice.classList.toggle('active', this.voiceOn);
      this.dom.btnVoice.textContent = this.voiceOn ? '🔊 Voz' : '🔇 Voz';
      if (!this.voiceOn) this._stopSpeech();
    });
  }

  loadLesson(lesson) {
    this._token++;
    this.fx?.cancelActive();
    this._stopSpeech();
    this.lesson = lesson;
    this.stepIdx = 0;
    this.hiddenSquares.clear();
    this.engine.reset(lesson.positionId || 518);
    this.fx?.setPalette(this._getTheme().fxPalette);
    this._renderAll();
  }

  goToStep(targetStep, animateForward = false) {
    const clamped = Math.max(0, Math.min(this.lesson.steps.length, targetStep));
    const token = ++this._token;
    this.fx?.cancelActive();
    this._stopSpeech();
    this.hiddenSquares.clear();

    // Si avanzamos 1 paso desde el estado actual, animamos la jugada en vivo
    if (animateForward && clamped === this.stepIdx + 1) {
      const stepObj = this.lesson.steps[this.stepIdx];
      const legal = this.engine.getLegalMoves(this.engine.turn);
      const match = legal.find(m => toUci(m.from, m.to) === stepObj.uci);
      if (match) {
        this.stepIdx = clamped;
        this._animateMove(match, () => {
          if (token !== this._token) return;
          this._renderInfo();
          this._speak(stepObj.text);
        });
        return;
      }
    }

    // Salto directo o retroceso
    this.engine.reset(this.lesson.positionId || 518);
    for (let i = 0; i < clamped; i++) {
      const uci = this.lesson.steps[i].uci;
      const legal = this.engine.getLegalMoves(this.engine.turn);
      const match = legal.find(m => toUci(m.from, m.to) === uci);
      if (match) this.engine.makeMove(match);
    }
    this.stepIdx = clamped;
    this._renderAll();
    if (clamped > 0) {
      this._speak(this.lesson.steps[clamped - 1].text);
    }
  }

  _animateMove(move, onDone) {
    const theme = this._getTheme();
    const moverColor = this.engine.turn;
    const enemyColor = moverColor === 'w' ? 'b' : 'w';
    const record = this.engine.makeMove(move);
    const flipped = Boolean(this.lesson.flipped);

    const finish = () => {
      this.hiddenSquares.clear();
      this._renderBoard();
      onDone?.();
    };

    if (record.castle) {
      const row = record.from.r;
      this.hiddenSquares.add(`${row},${record.kingToCol}`);
      this.hiddenSquares.add(`${row},${record.rookToCol}`);
      this._renderBoard();
      this.sound?.playCastle();
      this.fx.animateCastle({
        kingHtml: theme.renderPiece('K', moverColor),
        rookHtml: theme.renderPiece('R', moverColor),
        row,
        kingFrom: record.from.c,
        kingTo: record.kingToCol,
        rookFrom: record.rookFromCol,
        rookTo: record.rookToCol,
        flipped,
        onComplete: finish
      });
      return;
    }

    if (record.captured) {
      this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
      this._renderBoard();
      this.fx.playCombatSequence({
        pieceType: record.piece,
        attackerHtml: theme.renderPiece(record.promo || record.piece, moverColor),
        victimHtml: theme.renderPiece(record.captured, enemyColor),
        from: record.from,
        to: record.to,
        flipped,
        onCharge: () => this.sound?.playCharge(record.piece),
        onImpact: () => this.sound?.playAttack(record.piece),
        onComplete: finish
      });
      return;
    }

    this.hiddenSquares.add(`${record.to.r},${record.to.c}`);
    this._renderBoard();
    this.sound?.playMove(record.piece);
    this.fx.animateRegularMove({
      pieceHtml: theme.renderPiece(record.promo || record.piece, moverColor),
      pieceType: record.piece,
      from: record.from,
      to: record.to,
      flipped,
      onComplete: finish
    });
  }

  _renderAll() {
    this._renderBoard();
    this._renderInfo();
    this._renderList();
  }

  _renderInfo() {
    const l = this.lesson;
    this.dom.badge.textContent = l.positionId === 518 ? '♟ CLÁSICO' : `🎲 FISCHER #${l.positionId}`;
    this.dom.stepLabel.textContent = `Paso ${this.stepIdx} / ${l.steps.length}`;
    this.dom.title.textContent = l.title;
    this.dom.note.textContent = this.stepIdx === 0
      ? `${l.intro} Pulsa ▶ para comenzar la demostración.`
      : l.steps[this.stepIdx - 1].text;
  }

  _renderList() {
    const subset = ACADEMY_LESSONS.filter(l => l.category === this.category);
    this.dom.count.textContent = `${subset.length} lecciones`;

    this.dom.list.innerHTML = subset.map(l => `
      <button class="ac-item ${l.id === this.lesson.id ? 'active' : ''}" data-ac-id="${l.id}">
        <span style="font-weight:700;font-size:0.86rem">${l.title}</span>
        <span class="mini-hint">${l.steps.length} jugadas</span>
      </button>
    `).join('');

    this.dom.list.querySelectorAll('[data-ac-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const found = ACADEMY_LESSONS.find(x => x.id === btn.dataset.acId);
        if (found) this.loadLesson(found);
      });
    });
  }

  _renderBoard() {
    const theme = this._getTheme();
    const grid = this.dom.grid;
    const flipped = Boolean(this.lesson.flipped);
    grid.innerHTML = '';

    const lastMove = this.engine.history[this.engine.history.length - 1] || null;

    for (let vr = 0; vr < 8; vr++) {
      for (let vc = 0; vc < 8; vc++) {
        const r = flipped ? 7 - vr : vr;
        const c = flipped ? 7 - vc : vc;

        const sq = document.createElement('div');
        sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;

        if (lastMove) {
          const toCol = lastMove.castle ? lastMove.kingToCol : lastMove.to.c;
          if (lastMove.from.r === r && lastMove.from.c === c) sq.classList.add('last-from');
          if (lastMove.to.r === r && toCol === c) sq.classList.add('last-to');
        }

        if (vc === 0) {
          const rk = document.createElement('span');
          rk.className = 'coord-rank';
          rk.textContent = 8 - r;
          sq.appendChild(rk);
        }
        if (vr === 7) {
          const fl = document.createElement('span');
          fl.className = 'coord-file';
          fl.textContent = FILES[c];
          sq.appendChild(fl);
        }

        const piece = this.engine.board[r][c];
        if (piece && !this.hiddenSquares.has(`${r},${c}`)) {
          const wrap = document.createElement('div');
          wrap.className = 'piece-wrap';
          wrap.innerHTML = theme.renderPiece(piece.type, piece.color);
          sq.appendChild(wrap);
        }

        grid.appendChild(sq);
      }
    }
  }
}
