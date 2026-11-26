import { CLASS_META } from './analyzer.js';

const GENDER_PREF_KEY = 'ajedrez960_coach_avatar_v1';

const MALE_VOICE_RE = /alvaro|álvaro|jorge|pablo|raúl|raul|diego|carlos|alonso|tomás|tomas|enrique|sergio|emilio|gonzalo|gerardo|darío|dario|luciano|juan|mateo|nicolás|nicolas|andrés|andres|rodrigo|esteban|héctor|hector|luis|miguel|david|pedro|antonio|javier|ramón|ramon|eddy|reed|rocko|grandpa|male|hombre/i;
const FEMALE_VOICE_RE = /dalia|elena|sabina|paulina|salomé|salome|mónica|monica|camila|mía|mia|paloma|laura|lucía|lucia|sofía|sofia|helena|carmen|catalina|francisca|conchita|elisa|isabela|valentina|jimena|ximena|renata|tania|marisol|maría|maria|ana|lupe|angélica|angelica|elvira|irene|vera|triana|abril|flo|sandy|shelley|grandma|female|mujer|google español/i;

const MOOD_META = {
  book:       { color: '#c084fc', tag: '📖 Teoría',        pose: 'point',     gaze: 'board' },
  brilliant:  { color: '#22d3ee', tag: '✨ ¡Brillante!',   pose: 'celebrate', gaze: 'user' },
  best:       { color: '#22c55e', tag: '★ Mejor jugada',   pose: 'point',     gaze: 'board' },
  excellent:  { color: '#4ade80', tag: '👍 Excelente',     pose: 'point',     gaze: 'board' },
  good:       { color: '#38bdf8', tag: '♟ Buena',          pose: 'point',     gaze: 'board' },
  inaccuracy: { color: '#facc15', tag: '🤔 Imprecisión',   pose: 'think',     gaze: 'up' },
  mistake:    { color: '#fb923c', tag: '⚠ Error',          pose: 'think',     gaze: 'board' },
  blunder:    { color: '#f43f5e', tag: '❗ Error grave',   pose: 'shock',     gaze: 'user' },
  mate:       { color: '#facc15', tag: '👑 ¡Jaque Mate!',  pose: 'celebrate', gaze: 'user' },
  teach:      { color: '#38bdf8', tag: '🎓 Enseñando',     pose: 'point',     gaze: 'board' }
};

function ensureAvatarStyles() {
  if (document.querySelector('style[data-coach-avatar-css]')) return;
  const style = document.createElement('style');
  style.dataset.coachAvatarCss = 'true';
  style.textContent = `
    main.arena.hidden { display: none !important; }
    body.review-coach-open main.arena:not(.hidden) {
      display: grid !important;
      grid-template-columns: 274px minmax(360px, 560px) minmax(280px, 350px) !important;
      max-width: 1330px !important;
      justify-content: center;
      align-items: start;
      gap: 18px;
    }
    body.review-coach-open .an-coach { display: none !important; }
    body.review-coach-open .side-panel .card:has(#fx-preview-grid) { display: none !important; }

    .tr-layout.tr-with-coach {
      grid-template-columns: 262px minmax(320px, 500px) minmax(240px, 1fr) !important;
      align-items: start;
    }
    .tr-layout.tr-with-coach #ac-text { display: none !important; }

    .coach-dock-panel {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      background: linear-gradient(180deg, rgba(17, 25, 44, 0.96) 0%, rgba(8, 12, 22, 0.98) 100%);
      border: 1.5px solid var(--border-color); border-radius: 16px; padding: 14px 13px;
      position: sticky; top: 14px; box-shadow: 0 14px 36px rgba(0, 0, 0, 0.48);
      transition: border-color 0.22s ease, box-shadow 0.22s ease;
    }
    .coach-dock-panel.speaking {
      border-color: var(--coach-aura, #38bdf8);
      box-shadow: 0 0 28px color-mix(in srgb, var(--coach-aura, #38bdf8) 32%, transparent);
    }
    .coach-dock-top { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 6px; }

    /* Escenario panorámico de medio cuerpo */
    .coach-stage {
      width: 100%; height: 158px; border-radius: 14px; position: relative; overflow: hidden;
      background:
        radial-gradient(circle at 50% 28%, color-mix(in srgb, var(--coach-aura, #38bdf8) 26%, #1e293b) 0%, #0b1222 72%, #070b15 100%);
      border: 1.5px solid color-mix(in srgb, var(--coach-aura, #38bdf8) 42%, rgba(148, 163, 184, 0.22));
      box-shadow: inset 0 -18px 26px rgba(4, 7, 15, 0.72), 0 8px 22px rgba(0, 0, 0, 0.35);
      display: grid; place-items: end center; flex-shrink: 0;
    }
    .coach-stage svg { width: 100%; height: 100%; display: block; }

    /* Capas articuladas del avatar */
    .ca-body-root { transform-origin: 80px 152px; animation: caBreathe 3.8s ease-in-out infinite; }
    .ca-head { transform-origin: 80px 92px; transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1); }
    .ca-eyes { transform-origin: 80px 58px; animation: caBlink 4.8s infinite; }
    .ca-pupils { transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1); }
    .ca-brows { transform-origin: 80px 48px; transition: transform 0.22s ease; }
    .ca-arm-point { transform-origin: 112px 118px; animation: caPointIdle 3.2s ease-in-out infinite; }
    .ca-arm-think { transform-origin: 106px 124px; animation: caThinkIdle 2.9s ease-in-out infinite; }
    .ca-arm-shock { transform-origin: 108px 126px; animation: caShockPop 0.55s ease-out; }
    .ca-arm-celebrate { transform-origin: 112px 122px; animation: caCelebrate 0.9s ease-in-out infinite; }
    .ca-spark { transform-origin: center; animation: caSparkle 1.3s ease-in-out infinite; }

    /* Orientación de cabeza y mirada según el estado */
    .coach-dock-panel[data-gaze="board"] .ca-pupils { transform: translate(2.5px, 0.6px); }
    .coach-dock-panel[data-gaze="up"] .ca-pupils { transform: translate(1.8px, -1.8px); }
    .coach-dock-panel[data-gaze="user"] .ca-pupils { transform: translate(0px, 0px); }

    .coach-dock-panel[data-pose="point"] .ca-head { transform: rotate(2.5deg) translateX(1px); }
    .coach-dock-panel[data-pose="think"] .ca-head { transform: rotate(-4.5deg) translateY(1px); }
    .coach-dock-panel[data-pose="shock"] .ca-head { animation: caHeadShake 0.65s ease-out; }
    .coach-dock-panel[data-pose="celebrate"] .ca-head { transform: rotate(-2deg) translateY(-1.5px); }

    /* Dinamismo real al hablar (se activa SOLO en onstart) */
    .coach-dock-panel.speaking .ca-head { animation: caHeadTalk 1.65s ease-in-out infinite; }
    .coach-dock-panel.speaking .ca-brows { animation: caBrowTalk 1.2s ease-in-out infinite; }
    .coach-dock-panel.speaking .ca-arm-point { animation: caPointTalk 0.95s ease-in-out infinite; }
    .coach-dock-panel.speaking .ca-arm-think { animation: caThinkTalk 1.4s ease-in-out infinite; }
    .coach-dock-panel.speaking[data-gaze="board"] .ca-pupils { animation: caGlanceTalk 3.6s ease-in-out infinite; }

    /* 4 visemas sincronizados por palabra */
    .ca-mouth-shape { opacity: 0; transition: opacity 0.055s linear; }
    .coach-dock-panel[data-viseme="idle"] .ca-m-idle { opacity: 1; }
    .coach-dock-panel[data-viseme="mid"] .ca-m-mid { opacity: 1; }
    .coach-dock-panel[data-viseme="wide"] .ca-m-wide { opacity: 1; }
    .coach-dock-panel[data-viseme="round"] .ca-m-round { opacity: 1; }

    .coach-identity {
      width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 8px;
      padding: 0 2px;
    }
    .coach-name { font-size: 0.92rem; font-weight: 800; color: #f8fafc; }
    .coach-mood-pill {
      font-size: 0.72rem; font-weight: 800; padding: 2px 9px; border-radius: 999px;
      color: var(--coach-aura, #38bdf8);
      background: color-mix(in srgb, var(--coach-aura, #38bdf8) 18%, transparent);
      border: 1px solid color-mix(in srgb, var(--coach-aura, #38bdf8) 38%, transparent);
    }
    .coach-wave-row { display: flex; align-items: center; gap: 5px; height: 18px; }
    .coach-eq { display: flex; align-items: flex-end; gap: 2.5px; height: 14px; }
    .coach-eq span { width: 3px; height: 3px; border-radius: 2px; background: var(--coach-aura, #38bdf8); opacity: 0.35; }
    .coach-dock-panel.speaking .coach-eq span { opacity: 1; animation: coachEq 0.42s ease-in-out infinite alternate; }
    .coach-dock-panel.speaking .coach-eq span:nth-child(2) { animation-delay: 0.1s; }
    .coach-dock-panel.speaking .coach-eq span:nth-child(3) { animation-delay: 0.2s; }
    .coach-dock-panel.speaking .coach-eq span:nth-child(4) { animation-delay: 0.08s; }
    .coach-state-txt { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; }

    .coach-bubble {
      width: 100%; background: rgba(9, 13, 22, 0.8); border: 1px solid var(--border-color);
      border-top: 3px solid var(--coach-aura, #38bdf8); border-radius: 12px; padding: 11px 12px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .coach-bubble-head { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8rem; font-weight: 800; color: #f8fafc; }
    .coach-bubble-text { font-size: 0.84rem; line-height: 1.5; color: var(--text-main); }
    .coach-bubble-best { font-size: 0.78rem; font-weight: 700; color: #4ade80; }

    .coach-swap-btn {
      background: rgba(15, 23, 42, 0.88); color: var(--text-muted);
      border: 1px solid var(--border-color); border-radius: 8px;
      padding: 4px 9px; font-size: 0.72rem; font-weight: 700; cursor: pointer;
    }
    .coach-swap-btn:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }

    @media (max-width: 1140px) {
      body.review-coach-open main.arena:not(.hidden) { grid-template-columns: 1fr !important; max-width: 640px !important; }
      .tr-layout.tr-with-coach { grid-template-columns: 1fr !important; }
      .coach-dock-panel { position: static; flex-direction: row; flex-wrap: wrap; align-items: center; padding: 12px; }
      .coach-dock-top { flex: 1 1 100%; }
      .coach-stage { width: 116px; height: 106px; }
      .coach-identity { flex: 1; flex-direction: column; align-items: flex-start; gap: 4px; }
      .coach-bubble { flex: 1 1 100%; }
    }

    @keyframes caBreathe { 0%, 100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-1.5px) scaleY(1.012); } }
    @keyframes caBlink { 0%, 91%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
    @keyframes caHeadTalk {
      0%, 100% { transform: rotate(1.5deg) translateY(0); }
      35% { transform: rotate(-2.2deg) translateY(-1.5px); }
      70% { transform: rotate(3deg) translateY(-0.5px); }
    }
    @keyframes caBrowTalk {
      0%, 100% { transform: translateY(0); }
      45% { transform: translateY(-1.6px); }
    }
    @keyframes caGlanceTalk {
      0%, 42%, 100% { transform: translate(2.6px, 0.5px); }
      56%, 80% { transform: translate(0px, 0px); }
    }
    @keyframes caPointIdle { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-2.8deg); } }
    @keyframes caPointTalk {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      40% { transform: rotate(-8deg) translateY(-3px); }
      75% { transform: rotate(2deg) translateY(-1px); }
    }
    @keyframes caThinkIdle { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(2deg); } }
    @keyframes caThinkTalk { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-4deg) translateY(-1.5px); } }
    @keyframes caHeadShake {
      0% { transform: rotate(0deg); }
      22% { transform: rotate(-7deg); }
      52% { transform: rotate(6deg); }
      78% { transform: rotate(-3deg); }
      100% { transform: rotate(-2deg); }
    }
    @keyframes caShockPop { 0% { transform: translateY(12px) rotate(12deg); opacity: 0.7; } 100% { transform: translateY(0) rotate(0deg); opacity: 1; } }
    @keyframes caCelebrate {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      50% { transform: rotate(-7deg) translateY(-4px); }
    }
    @keyframes caSparkle { 0%, 100% { opacity: 0.45; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.18); } }
    @keyframes coachEq { 0% { height: 3px; } 100% { height: 14px; } }
  `;
  document.head.appendChild(style);
}

function detectVoiceGender(voiceObj) {
  const name = voiceObj?.name || '';
  if (MALE_VOICE_RE.test(name) && !FEMALE_VOICE_RE.test(name)) return 'male';
  if (FEMALE_VOICE_RE.test(name)) return 'female';
  return 'neutral';
}

function pickVisemeForWord(word, prevViseme) {
  const clean = String(word || '').toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
  if (!clean) return 'idle';
  const hasRound = /[ouóú]/.test(clean);
  const hasWide = /[aá]/.test(clean);
  let next = 'mid';
  if (hasRound && !hasWide) next = 'round';
  else if (hasWide && !hasRound) next = 'wide';
  else if (hasRound && hasWide) next = prevViseme === 'wide' ? 'round' : 'wide';
  else next = prevViseme === 'mid' ? 'wide' : 'mid';
  return next;
}

function renderCoachSvg(gender, mood) {
  const isF = gender === 'female';
  const meta = MOOD_META[mood] || MOOD_META.teach;
  const accent = meta.color;
  const pose = meta.pose;

  const skin = isF ? '#f4c7a3' : '#e8b38c';
  const skinShade = isF ? '#d89f78' : '#ca9169';
  const hair = isF ? '#2a182d' : '#1b2434';
  const hairHi = isF ? '#4c2c52' : '#334155';
  const suit = isF ? '#2e2768' : '#132038';
  const suitEdge = isF ? '#4c429c' : '#263a5e';
  const iris = isF ? '#1e3a5f' : '#1e293b';

  // Cejas expresivas por emoción
  let brows = `<path d="M62 50q5-3 10-.5M88 49.5q5-2.5 10 .5" stroke="#1b1620" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  if (mood === 'blunder') {
    brows = `<path d="M61 52l11-4M99 52l-11-4" stroke="#1b1620" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'mistake') {
    brows = `<path d="M62 51.5l10-2.5M98 51.5l-10-2.5" stroke="#1b1620" stroke-width="2.7" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'inaccuracy') {
    brows = `<path d="M62 51.5h10M88 48.5q5-3.4 10 0" stroke="#1b1620" stroke-width="2.7" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'brilliant' || mood === 'mate') {
    brows = `<path d="M61 48q5.5-3.8 11-.8M88 47.2q5.5-3 11 .8" stroke="#1b1620" stroke-width="2.7" fill="none" stroke-linecap="round"/>`;
  }

  // Boca en reposo según emoción (visema idle)
  let idleMouth = `<path d="M72 76.5q8 5.2 16 0" stroke="#7c2d12" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  if (mood === 'blunder') {
    idleMouth = `<ellipse cx="80" cy="77.5" rx="4.6" ry="3.8" fill="#6b1d24" stroke="#9f3a3a" stroke-width="1"/>`;
  } else if (mood === 'mistake' || mood === 'inaccuracy') {
    idleMouth = `<path d="M73 78.5q7-3.4 14 0" stroke="#7c2d12" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'brilliant' || mood === 'mate') {
    idleMouth = `<path d="M70.5 75.5q9.5 8.2 19 0z" fill="#ffffff" stroke="#7c2d12" stroke-width="1.6"/>`;
  }

  // Cabello trasero y delantero
  const hairBack = isF
    ? `<path d="M47 58c0-21 13-34 33-34s33 13 33 34v34c-7 5-14 6-20 4V66H67v30c-6 2-13 1-20-4V58z" fill="${hair}"/>`
    : `<path d="M53 53c0-18 11-29 27-29s27 11 27 29v10H53V53z" fill="${hair}"/>`;

  const hairFront = isF
    ? `<path d="M54 50c4-15 13-22 26-22 12 0 21 6 26 20-8-6-16-9-25-9-11 0-20 4-27 11z" fill="${hair}"/>
       <path d="M62 35q16-6 32 3" stroke="${hairHi}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.65"/>
       <circle cx="56.5" cy="68" r="2.6" fill="${accent}"/>
       <circle cx="103.5" cy="68" r="2.6" fill="${accent}"/>`
    : `<path d="M54 48c2-14 12-21 26-21 13 0 23 7 26 21-8-8-17-10-26-10-9 0-18 2-26 10z" fill="${hair}"/>
       <path d="M64 33q15-5 29 2" stroke="${hairHi}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.6"/>
       <path d="M60 72c3 12 10 18 20 18s17-6 20-18c-4 6.5-11 10-20 10s-16-3.5-20-10z" fill="${hair}" opacity="0.62"/>`;

  // Brazos y manos articuladas según pose
  let armMarkup = '';
  if (pose === 'point') {
    // Brazo derecho extendido señalando el tablero a la derecha
    armMarkup = `
      <g class="ca-arm-point">
        <path d="M108 116c12 4 21 2 28-6" stroke="${suit}" stroke-width="15" stroke-linecap="round" fill="none"/>
        <path d="M108 116c12 4 21 2 28-6" stroke="${suitEdge}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <circle cx="137" cy="108" r="7.5" fill="${skin}"/>
        <path d="M141 106l10-3.5" stroke="${skin}" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M135 103l5-5" stroke="${skin}" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M138 111l7-1" stroke="${skinShade}" stroke-width="3.2" stroke-linecap="round"/>
      </g>
    `;
  } else if (pose === 'think') {
    // Mano apoyada en el mentón pensando
    armMarkup = `
      <g class="ca-arm-think">
        <path d="M111 124c4-14 2-26-11-36" stroke="${suit}" stroke-width="14" stroke-linecap="round" fill="none"/>
        <path d="M111 124c4-14 2-26-11-36" stroke="${suitEdge}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <ellipse cx="95" cy="86" rx="7.5" ry="6.2" fill="${skin}"/>
        <path d="M89 85l-6 1.5M92 81l-4-5" stroke="${skin}" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M90 88q5 2 9-1" stroke="${skinShade}" stroke-width="1.6" fill="none"/>
      </g>
    `;
  } else if (pose === 'shock') {
    // Mano a la sien/frente por error grave
    armMarkup = `
      <g class="ca-arm-shock">
        <path d="M113 125c10-16 11-37 0-56" stroke="${suit}" stroke-width="14" stroke-linecap="round" fill="none"/>
        <path d="M113 125c10-16 11-37 0-56" stroke="${suitEdge}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <ellipse cx="107" cy="61" rx="7.2" ry="8.5" transform="rotate(-14 107 61)" fill="${skin}"/>
        <path d="M101 55l-6-4M104 52l-3-6M109 53l1-6" stroke="${skin}" stroke-width="3.2" stroke-linecap="round"/>
      </g>
    `;
  } else {
    // Celebración con brazo arriba y destellos
    armMarkup = `
      <g class="ca-arm-celebrate">
        <path d="M112 119c14-9 21-22 21-38" stroke="${suit}" stroke-width="14.5" stroke-linecap="round" fill="none"/>
        <path d="M112 119c14-9 21-22 21-38" stroke="${suitEdge}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <circle cx="133" cy="76" r="8" fill="${skin}"/>
        <path d="M132 69l1-9" stroke="${skin}" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M128 74h9M128 78h8" stroke="${skinShade}" stroke-width="1.6" stroke-linecap="round"/>
      </g>
    `;
  }

  const sparkles = (mood === 'brilliant' || mood === 'mate')
    ? `<g class="ca-spark">
         <path d="M26 28l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="${accent}"/>
         <path d="M136 26l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" fill="#facc15"/>
         <circle cx="40" cy="48" r="2.2" fill="#f8fafc" opacity="0.8"/>
       </g>`
    : '';

  const neckAccent = isF
    ? `<path d="M68 103l12 15 12-15" fill="none" stroke="${accent}" stroke-width="2.4"/>
       <circle cx="80" cy="121" r="3" fill="${accent}"/>`
    : `<path d="M77 109h6l2 22h-10z" fill="${accent}"/>`;

  return `
    <svg viewBox="0 0 160 155" aria-hidden="true">
      <!-- Fondo sutil con silueta de pieza -->
      <circle cx="80" cy="68" r="56" fill="${accent}" opacity="0.08"/>
      <text x="16" y="136" font-size="38" fill="${accent}" opacity="0.11" font-family="serif">♞</text>

      <g class="ca-body-root">
        <!-- Torso y chaqueta -->
        <g class="ca-torso">
          <path d="M32 155c4-31 19-46 48-46s44 15 48 46H32z" fill="${suit}" stroke="${accent}" stroke-width="1.8"/>
          <path d="M65 109l15 26 15-26" fill="#f8fafc" opacity="0.94"/>
          <path d="M58 111l14 25-6 19M102 111l-14 25 6 19" stroke="${suitEdge}" stroke-width="2" fill="none"/>
          ${neckAccent}
          <!-- Hombro izquierdo relajado -->
          <path d="M46 122c-6 10-8 21-8 33" stroke="${suitEdge}" stroke-width="2" fill="none" opacity="0.7"/>
        </g>

        <!-- Cuello -->
        <rect x="70" y="88" width="20" height="23" rx="9" fill="${skinShade}"/>

        <!-- Cabeza articulada -->
        <g class="ca-head">
          ${hairBack}
          <!-- Orejas -->
          <ellipse cx="56" cy="61" rx="4.2" ry="6.2" fill="${skinShade}"/>
          <ellipse cx="104" cy="61" rx="4.2" ry="6.2" fill="${skinShade}"/>
          <!-- Rostro -->
          <ellipse cx="80" cy="60" rx="23.5" ry="26.5" fill="${skin}"/>
          <!-- Rubor sutil -->
          <ellipse cx="64" cy="68" rx="4.5" ry="2.2" fill="#fb7185" opacity="0.22"/>
          <ellipse cx="96" cy="68" rx="4.5" ry="2.2" fill="#fb7185" opacity="0.22"/>
          ${hairFront}

          <!-- Cejas -->
          <g class="ca-brows">${brows}</g>

          <!-- Ojos con seguimiento visual independiente -->
          <g class="ca-eyes">
            <ellipse cx="68" cy="59" rx="5.5" ry="4.5" fill="#ffffff"/>
            <ellipse cx="92" cy="59" rx="5.5" ry="4.5" fill="#ffffff"/>
            <g class="ca-pupils">
              <circle cx="68" cy="59" r="3" fill="${iris}"/>
              <circle cx="92" cy="59" r="3" fill="${iris}"/>
              <circle cx="68" cy="59" r="1.5" fill="#090d16"/>
              <circle cx="92" cy="59" r="1.5" fill="#090d16"/>
              <circle cx="66.8" cy="57.7" r="1.05" fill="#ffffff"/>
              <circle cx="90.8" cy="57.7" r="1.05" fill="#ffffff"/>
            </g>
            <path d="M62.5 57.5q5.5-3.2 11 0M86.5 57.5q5.5-3.2 11 0" stroke="#1b1620" stroke-width="1.4" fill="none" stroke-linecap="round"/>
          </g>

          <!-- Nariz -->
          <path d="M80 61v7.2l-2.3 1.1" stroke="${skinShade}" stroke-width="1.9" fill="none" stroke-linecap="round"/>

          <!-- 4 formas de boca para lip-sync real -->
          <g class="ca-mouth-shape ca-m-idle">${idleMouth}</g>
          <g class="ca-mouth-shape ca-m-mid">
            <path d="M72.5 76q7.5 1.8 15 0c-1 4.2-4 6.2-7.5 6.2s-6.5-2-7.5-6.2z" fill="#7f1d1d" stroke="#5b1515" stroke-width="1"/>
            <path d="M74.5 76.6h11" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round"/>
          </g>
          <g class="ca-mouth-shape ca-m-wide">
            <path d="M71 75q9 2 18 0c-1.2 7.2-4.6 10.2-9 10.2S72.2 82.2 71 75z" fill="#6b161b" stroke="#5b1515" stroke-width="1"/>
            <path d="M73.5 75.9h13" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="80" cy="83.4" rx="4.5" ry="1.8" fill="#fb7185" opacity="0.85"/>
          </g>
          <g class="ca-mouth-shape ca-m-round">
            <ellipse cx="80" cy="78.2" rx="4.5" ry="4.8" fill="#6b161b" stroke="#7c2d12" stroke-width="1.3"/>
            <ellipse cx="80" cy="81.2" rx="2.3" ry="1.2" fill="#fb7185" opacity="0.7"/>
          </g>
        </g>

        <!-- Brazos y manos articuladas -->
        ${armMarkup}
      </g>

      ${sparkles}
    </svg>
  `;
}

export function attachCoachAvatar(app) {
  ensureAvatarStyles();
  const voice = app.analyzer?.voice;
  if (!voice) return;

  let activeGender = 'female';
  try {
    const saved = localStorage.getItem(GENDER_PREF_KEY);
    if (saved === 'male' || saved === 'female') activeGender = saved;
    else if (detectVoiceGender(voice.voice) === 'male') activeGender = 'male';
  } catch { /* ignorar */ }

  let isSpeaking = false;
  let currentViseme = 'idle';
  let speakToken = 0;
  let pollTimer = null;
  let speakDelayTimer = null;
  let mouthCloseTimer = null;
  let fallbackTimer = null;
  let fallbackStartTimer = null;

  const setViseme = (v) => {
    currentViseme = v;
    document.querySelectorAll('.coach-dock-panel').forEach((el) => {
      el.dataset.viseme = v;
    });
  };

  const syncSpeakingUI = (speaking) => {
    isSpeaking = speaking;
    if (!speaking) currentViseme = 'idle';
    document.querySelectorAll('.coach-dock-panel').forEach((el) => {
      el.classList.toggle('speaking', speaking);
      el.dataset.viseme = speaking ? currentViseme : 'idle';
      const st = el.querySelector('.coach-state-txt');
      if (st) st.textContent = speaking ? 'Explicando...' : 'Listo';
    });
  };

  const stopAllTimers = () => {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (speakDelayTimer) { clearTimeout(speakDelayTimer); speakDelayTimer = null; }
    if (mouthCloseTimer) { clearTimeout(mouthCloseTimer); mouthCloseTimer = null; }
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    if (fallbackStartTimer) { clearTimeout(fallbackStartTimer); fallbackStartTimer = null; }
  };

  const resolveVoiceProfile = (targetGender) => {
    if (!voice.spanishVoices || voice.spanishVoices.length === 0) voice._refreshVoices();
    const list = voice.spanishVoices || [];
    const current = voice.voice || list[0] || null;
    const currentG = detectVoiceGender(current);

    if (current && currentG === targetGender) {
      return { voiceObj: current, pitch: targetGender === 'male' ? 0.94 : 1.05, rate: targetGender === 'male' ? 0.99 : 1.03 };
    }
    const nativeMatch = list.find(v => detectVoiceGender(v) === targetGender);
    if (nativeMatch) {
      return { voiceObj: nativeMatch, pitch: targetGender === 'male' ? 0.94 : 1.05, rate: targetGender === 'male' ? 0.99 : 1.03 };
    }
    return { voiceObj: current, pitch: targetGender === 'male' ? 0.66 : 1.26, rate: targetGender === 'male' ? 0.95 : 1.05 };
  };

  const runSyllableFallback = (text, token) => {
    const tokens = String(text || '').split(/\s+/).filter(Boolean);
    let idx = 0;

    const step = () => {
      if (token !== speakToken || !isSpeaking) return;
      if (idx >= tokens.length) {
        setViseme('idle');
        return;
      }
      const w = tokens[idx++];
      const vis = pickVisemeForWord(w, currentViseme);
      setViseme(vis);

      const hasHardPause = /[.!?]$/.test(w);
      const hasSoftPause = /[,;:]$/.test(w);
      const speakDur = Math.max(95, Math.min(260, w.length * 36));

      mouthCloseTimer = setTimeout(() => {
        if (token !== speakToken || !isSpeaking) return;
        setViseme(hasHardPause || hasSoftPause ? 'idle' : 'mid');
      }, Math.round(speakDur * 0.72));

      const pauseExtra = hasHardPause ? 280 : hasSoftPause ? 150 : 45;
      fallbackTimer = setTimeout(step, speakDur + pauseExtra);
    };

    step();
  };

  const origStop = voice.stop.bind(voice);
  voice.stop = () => {
    speakToken++;
    stopAllTimers();
    syncSpeakingUI(false);
    return origStop();
  };

  voice.speak = (text, force = false) => {
    if (!voice.supported || (!voice.enabled && !force) || !text) return;
    voice.stop();

    const myToken = ++speakToken;
    const prof = resolveVoiceProfile(activeGender);
    const maxMs = Math.max(2600, Math.min(24000, text.length * 98));

    speakDelayTimer = setTimeout(() => {
      if (myToken !== speakToken) return;
      speakDelayTimer = null;

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = prof.voiceObj?.lang || 'es-ES';
      if (prof.voiceObj) utter.voice = prof.voiceObj;
      utter.pitch = prof.pitch;
      utter.rate = prof.rate;

      let started = false;
      let boundaryHits = 0;
      let startAt = 0;

      const beginSpeaking = () => {
        if (started || myToken !== speakToken) return;
        started = true;
        startAt = performance.now();
        syncSpeakingUI(true);
        setViseme('mid');

        // Si el navegador no dispara onboundary, arranca cadencia natural basada en el texto
        fallbackStartTimer = setTimeout(() => {
          if (myToken !== speakToken || !isSpeaking || boundaryHits > 0) return;
          runSyllableFallback(text, myToken);
        }, 340);
      };

      const finishSpeaking = () => {
        if (myToken !== speakToken) return;
        stopAllTimers();
        syncSpeakingUI(false);
      };

      utter.onstart = beginSpeaking;

      utter.onboundary = (ev) => {
        if (myToken !== speakToken) return;
        if (!started) beginSpeaking();
        if (ev.name && ev.name !== 'word') return;

        boundaryHits++;
        if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
        if (fallbackStartTimer) { clearTimeout(fallbackStartTimer); fallbackStartTimer = null; }
        if (mouthCloseTimer) { clearTimeout(mouthCloseTimer); mouthCloseTimer = null; }

        const slice = text.slice(ev.charIndex || 0);
        const match = slice.match(/^[^\s]+/);
        const word = match ? match[0] : '';
        const vis = pickVisemeForWord(word, currentViseme);
        setViseme(vis);

        const closeAfter = Math.max(115, Math.min(240, word.length * 32));
        mouthCloseTimer = setTimeout(() => {
          if (myToken !== speakToken || !isSpeaking) return;
          setViseme(/[.,;:!?]$/.test(word) ? 'idle' : 'mid');
        }, closeAfter);
      };

      utter.onend = finishSpeaking;
      utter.onerror = finishSpeaking;

      const queuedAt = performance.now();
      pollTimer = setInterval(() => {
        if (myToken !== speakToken) { stopAllTimers(); return; }
        const now = performance.now();
        const synthSpeaking = Boolean(window.speechSynthesis?.speaking);

        if (!started && synthSpeaking) {
          beginSpeaking();
        }
        if (started) {
          const elapsed = now - startAt;
          if (elapsed > maxMs || (elapsed > 850 && !synthSpeaking)) {
            finishSpeaking();
          }
        } else if (now - queuedAt > 2600 && !synthSpeaking) {
          finishSpeaking();
        }
      }, 120);

      try {
        window.speechSynthesis.speak(utter);
      } catch {
        finishSpeaking();
      }
    }, 45);
  };

  const origSelectVoice = voice.selectVoiceByName.bind(voice);
  voice.selectVoiceByName = (name) => {
    origSelectVoice(name);
    const detected = detectVoiceGender(voice.voice);
    if (detected === 'male' || detected === 'female') {
      activeGender = detected;
      try { localStorage.setItem(GENDER_PREF_KEY, activeGender); } catch { /* ignorar */ }
    }
    refreshAllDocks();
  };

  const swapAvatarAndVoice = () => {
    activeGender = activeGender === 'female' ? 'male' : 'female';
    try { localStorage.setItem(GENDER_PREF_KEY, activeGender); } catch { /* ignorar */ }

    const prof = resolveVoiceProfile(activeGender);
    if (prof.voiceObj) {
      origSelectVoice(prof.voiceObj.name);
      const sel = document.getElementById('an-voice-select');
      if (sel) sel.value = prof.voiceObj.name;
    }

    refreshAllDocks();
    const greeting = activeGender === 'male'
      ? 'Maestro Aurelio listo para analizar tus jugadas.'
      : 'Maestra Valeria lista para analizar tus jugadas.';
    voice.speak(greeting, true);
  };

  const buildDockPanel = ({ id, mood, titleText, bodyText, bestText }) => {
    const meta = MOOD_META[mood] || MOOD_META.teach;
    const coachName = activeGender === 'female' ? 'Maestra Valeria' : 'Maestro Aurelio';

    const el = document.createElement('aside');
    el.id = id;
    el.className = `coach-dock-panel${isSpeaking ? ' speaking' : ''}`;
    el.dataset.mood = mood;
    el.dataset.pose = meta.pose;
    el.dataset.gaze = meta.gaze;
    el.dataset.viseme = isSpeaking ? currentViseme : 'idle';
    el.dataset.titleText = titleText || '';
    el.dataset.bodyText = bodyText || '';
    el.dataset.bestText = bestText || '';
    el.style.setProperty('--coach-aura', meta.color);

    el.innerHTML = `
      <div class="coach-dock-top">
        <span class="coach-mood-pill">${meta.tag}</span>
        <button type="button" class="coach-swap-btn" title="Cambiar entre Maestro y Maestra">⇄ Voz</button>
      </div>
      <div class="coach-stage">${renderCoachSvg(activeGender, mood)}</div>
      <div class="coach-identity">
        <span class="coach-name">${coachName}</span>
        <div class="coach-wave-row">
          <div class="coach-eq"><span></span><span></span><span></span><span></span></div>
          <span class="coach-state-txt">${isSpeaking ? 'Explicando...' : 'Listo'}</span>
        </div>
      </div>
      <div class="coach-bubble">
        ${titleText ? `<div class="coach-bubble-head">${titleText}</div>` : ''}
        <div class="coach-bubble-text">${bodyText || ''}</div>
        ${bestText ? `<div class="coach-bubble-best">💡 ${bestText}</div>` : ''}
      </div>
    `;

    el.querySelector('.coach-swap-btn').addEventListener('click', swapAvatarAndVoice);
    return el;
  };

  const refreshAllDocks = () => {
    document.querySelectorAll('.coach-dock-panel').forEach((oldEl) => {
      oldEl.replaceWith(buildDockPanel({
        id: oldEl.id,
        mood: oldEl.dataset.mood || 'teach',
        titleText: oldEl.dataset.titleText,
        bodyText: oldEl.dataset.bodyText,
        bestText: oldEl.dataset.bestText
      }));
    });
  };

  const closeReviewDock = () => {
    document.body.classList.remove('review-coach-open');
    document.getElementById('review-coach-dock')?.remove();
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  };

  if (app.shell?.navigate) {
    const origNav = app.shell.navigate.bind(app.shell);
    app.shell.navigate = (viewId) => {
      if (viewId !== 'play') {
        if (app.analyzer?.inReview) app.analyzer.exitReview();
        else closeReviewDock();
      }
      return origNav(viewId);
    };
  }

  const origReview = app.analyzer._renderReviewPanel.bind(app.analyzer);
  app.analyzer._renderReviewPanel = () => {
    origReview();
    const arena = document.querySelector('main.arena');
    if (!arena || !app.analyzer.inReview || app.shell.currentView !== 'play') return;

    const ply = app.analyzer.currentPly;
    const item = ply > 0 ? app.analyzer.results[ply - 1] : null;
    let mood = 'teach';
    let titleText = `Posición inicial #${app.analyzer.positionId}`;
    let bodyText = 'Usa las flechas ◀ ▶ o toca una jugada del historial para revivirla y escuchar el análisis.';
    let bestText = '';

    if (item) {
      mood = item.played?.san?.endsWith('#') ? 'mate' : item.classification;
      const moveNum = Math.floor((ply - 1) / 2) + 1;
      const sideText = item.played.color === 'w' ? 'Blancas' : 'Negras';
      const meta = CLASS_META[item.classification] || { code: '', label: '' };
      titleText = `${moveNum}. ${sideText}: ${item.played.san} (${meta.code} ${meta.label})`;
      bodyText = item.comment;
      if (!item.isExactBest && ['inaccuracy', 'mistake', 'blunder'].includes(item.classification)) {
        bestText = `Mejor jugada: ${item.bestSan} (flecha verde)`;
      }
    }

    const wasOpen = document.body.classList.contains('review-coach-open');
    document.body.classList.add('review-coach-open');

    const panel = buildDockPanel({ id: 'review-coach-dock', mood, titleText, bodyText, bestText });
    const existing = document.getElementById('review-coach-dock');
    if (existing) existing.replaceWith(panel);
    else arena.prepend(panel);

    if (!wasOpen) requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  };

  const origExit = app.analyzer.exitReview.bind(app.analyzer);
  app.analyzer.exitReview = () => { closeReviewDock(); return origExit(); };

  const origReset = app.analyzer.reset.bind(app.analyzer);
  app.analyzer.reset = () => { closeReviewDock(); return origReset(); };

  if (app.academy) {
    const syncAcademyDock = () => {
      const layout = app.academy.container?.querySelector('.tr-layout');
      if (!layout) return;
      layout.classList.add('tr-with-coach');

      const stepIdx = app.academy.stepIdx || 0;
      const lesson = app.academy.lesson;
      const titleText = stepIdx === 0
        ? lesson.title
        : `${lesson.title} · Paso ${stepIdx}/${lesson.steps.length}`;
      const bodyText = stepIdx === 0
        ? lesson.summary
        : lesson.steps[stepIdx - 1].text;

      const panel = buildDockPanel({
        id: 'academy-coach-dock',
        mood: 'teach',
        titleText,
        bodyText,
        bestText: ''
      });
      const existing = document.getElementById('academy-coach-dock');
      if (existing) existing.replaceWith(panel);
      else layout.prepend(panel);
    };

    const origAcademy = app.academy._renderScaffold.bind(app.academy);
    app.academy._renderScaffold = () => {
      origAcademy();
      syncAcademyDock();
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    };

    const origSyncText = app.academy._syncText.bind(app.academy);
    app.academy._syncText = () => {
      origSyncText();
      syncAcademyDock();
    };
  }

  // Exponer motor del avatar para conectarlo en el Paso 4 (Laboratorio de Repertorio)
  app.coachAvatar = {
    buildDockPanel,
    refreshAllDocks,
    syncSpeakingUI,
    getGender: () => activeGender
  };
}
