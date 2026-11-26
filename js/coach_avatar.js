import { CLASS_META } from './analyzer.js';

const GENDER_PREF_KEY = 'ajedrez960_coach_avatar_v1';

const MALE_VOICE_RE = /alvaro|álvaro|jorge|pablo|raúl|raul|diego|carlos|alonso|tomás|tomas|enrique|sergio|emilio|gonzalo|gerardo|darío|dario|luciano|juan|mateo|nicolás|nicolas|andrés|andres|rodrigo|esteban|héctor|hector|luis|miguel|david|pedro|antonio|javier|ramón|ramon|hombre|male/i;
const FEMALE_VOICE_RE = /dalia|elena|sabina|paulina|salomé|salome|mónica|monica|camila|mía|mia|paloma|laura|lucía|lucia|sofía|sofia|helena|carmen|catalina|francisca|conchita|elisa|isabela|valentina|jimena|ximena|renata|tania|marisol|maría|maria|ana|lupe|angélica|angelica|elvira|irene|vera|triana|abril|mujer|female|google español/i;

const QUALITY_VOICE_RE = /natural|online|neural|google|dalia|alvaro|álvaro|elena|jorge|sabina|paulina|helena|pablo|monica|mónica/i;

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

const CADENCE_SEQ = ['mid', 'wide', 'mid', 'round', 'wide', 'mid', 'idle', 'round', 'wide', 'mid'];

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

    .coach-stage {
      width: 100%; height: 162px; border-radius: 14px; position: relative; overflow: hidden;
      background:
        radial-gradient(circle at 50% 26%, color-mix(in srgb, var(--coach-aura, #38bdf8) 28%, #1e293b) 0%, #0b1222 72%, #070b15 100%);
      border: 1.5px solid color-mix(in srgb, var(--coach-aura, #38bdf8) 44%, rgba(148, 163, 184, 0.22));
      box-shadow: inset 0 -20px 28px rgba(4, 7, 15, 0.78), 0 8px 22px rgba(0, 0, 0, 0.36);
      display: grid; place-items: end center; flex-shrink: 0;
    }
    .coach-stage svg { width: 100%; height: 100%; display: block; }

    /* Capas articuladas suaves */
    .ca-body-root { transform-origin: 80px 154px; animation: caBreathe 3.8s ease-in-out infinite; }
    .ca-head { transform-origin: 80px 92px; transition: transform 0.36s cubic-bezier(0.22, 1, 0.36, 1); }
    .ca-eyes { transform-origin: 80px 58px; animation: caBlink 4.7s infinite; }
    .ca-pupils { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
    .ca-brows { transform-origin: 80px 47px; transition: transform 0.22s ease; }
    .ca-arm-point { transform-origin: 112px 118px; animation: caPointIdle 3.2s ease-in-out infinite; }
    .ca-arm-think { transform-origin: 106px 124px; animation: caThinkIdle 3s ease-in-out infinite; }
    .ca-arm-shock { transform-origin: 108px 126px; animation: caShockPop 0.55s ease-out; }
    .ca-arm-celebrate { transform-origin: 112px 122px; animation: caCelebrate 0.95s ease-in-out infinite; }
    .ca-spark { transform-origin: center; animation: caSparkle 1.3s ease-in-out infinite; }

    /* Mirada y postura por emoción */
    .coach-dock-panel[data-gaze="board"] .ca-pupils { transform: translate(2.4px, 0.5px); }
    .coach-dock-panel[data-gaze="up"] .ca-pupils { transform: translate(1.6px, -1.7px); }
    .coach-dock-panel[data-gaze="user"] .ca-pupils { transform: translate(0px, 0px); }

    .coach-dock-panel[data-pose="point"] .ca-head { transform: rotate(2.2deg) translateX(1px); }
    .coach-dock-panel[data-pose="think"] .ca-head { transform: rotate(-4deg) translateY(1px); }
    .coach-dock-panel[data-pose="shock"] .ca-head { animation: caHeadShake 0.65s ease-out; }
    .coach-dock-panel[data-pose="celebrate"] .ca-head { transform: rotate(-1.8deg) translateY(-1.5px); }

    /* Animaciones activas durante todo el habla */
    .coach-dock-panel.speaking .ca-head { animation: caHeadTalk 1.75s ease-in-out infinite; }
    .coach-dock-panel.speaking .ca-brows { animation: caBrowTalk 1.25s ease-in-out infinite; }
    .coach-dock-panel.speaking .ca-arm-point { animation: caPointTalk 1.05s ease-in-out infinite; }
    .coach-dock-panel.speaking .ca-arm-think { animation: caThinkTalk 1.45s ease-in-out infinite; }
    .coach-dock-panel.speaking[data-gaze="board"] .ca-pupils { animation: caGlanceTalk 3.8s ease-in-out infinite; }

    /* 4 formas de boca para lip-sync continuo */
    .ca-mouth-shape { opacity: 0; transition: opacity 0.05s linear; }
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
      .coach-stage { width: 118px; height: 108px; }
      .coach-identity { flex: 1; flex-direction: column; align-items: flex-start; gap: 4px; }
      .coach-bubble { flex: 1 1 100%; }
    }

    @keyframes caBreathe { 0%, 100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-1.4px) scaleY(1.01); } }
    @keyframes caBlink { 0%, 91%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
    @keyframes caHeadTalk {
      0%, 100% { transform: rotate(1.4deg) translateY(0); }
      35% { transform: rotate(-2deg) translateY(-1.4px); }
      70% { transform: rotate(2.6deg) translateY(-0.4px); }
    }
    @keyframes caBrowTalk {
      0%, 100% { transform: translateY(0); }
      45% { transform: translateY(-1.5px); }
    }
    @keyframes caGlanceTalk {
      0%, 42%, 100% { transform: translate(2.4px, 0.5px); }
      56%, 80% { transform: translate(0px, 0px); }
    }
    @keyframes caPointIdle { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-2.5deg); } }
    @keyframes caPointTalk {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      40% { transform: rotate(-7deg) translateY(-2.5px); }
      75% { transform: rotate(1.8deg) translateY(-0.8px); }
    }
    @keyframes caThinkIdle { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(1.8deg); } }
    @keyframes caThinkTalk { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-3.8deg) translateY(-1.4px); } }
    @keyframes caHeadShake {
      0% { transform: rotate(0deg); }
      22% { transform: rotate(-6.5deg); }
      52% { transform: rotate(5.5deg); }
      78% { transform: rotate(-3deg); }
      100% { transform: rotate(-2deg); }
    }
    @keyframes caShockPop { 0% { transform: translateY(10px) rotate(10deg); opacity: 0.75; } 100% { transform: translateY(0) rotate(0deg); opacity: 1; } }
    @keyframes caCelebrate {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      50% { transform: rotate(-6.5deg) translateY(-3.5px); }
    }
    @keyframes caSparkle { 0%, 100% { opacity: 0.45; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.18); } }
    @keyframes coachEq { 0% { height: 3px; } 100% { height: 14px; } }
  `;
  document.head.appendChild(style);
}

function isSpanishVoice(v) {
  if (!v) return false;
  const lang = String(v.lang || '').toLowerCase();
  const name = String(v.name || '').toLowerCase();
  if (!/^es([-_]|$)/.test(lang)) return false;
  if (/\b(english|inglés|ingles|en-us|en-gb)\b/.test(name)) return false;
  return true;
}

function getStrictSpanishVoices() {
  const all = window.speechSynthesis?.getVoices?.() || [];
  const es = all.filter(isSpanishVoice);
  return es.sort((a, b) => {
    const qa = QUALITY_VOICE_RE.test(a.name || '') ? 1 : 0;
    const qb = QUALITY_VOICE_RE.test(b.name || '') ? 1 : 0;
    return qb - qa;
  });
}

function detectVoiceGender(voiceObj) {
  const name = voiceObj?.name || '';
  if (MALE_VOICE_RE.test(name) && !FEMALE_VOICE_RE.test(name)) return 'male';
  if (FEMALE_VOICE_RE.test(name)) return 'female';
  return 'neutral';
}

function cleanSpeechText(raw) {
  return String(raw || '')
    .replace(/O-O-O|0-0-0/g, 'enroque largo')
    .replace(/O-O|0-0/g, 'enroque corto')
    .replace(/→/g, ' a ')
    .replace(/·/g, ', ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[✓✕★▶◀⏭]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickVisemeForWord(word, prevViseme) {
  const clean = String(word || '').toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
  if (!clean) return 'idle';
  const hasRound = /[ouóú]/.test(clean);
  const hasWide = /[aá]/.test(clean);
  if (hasRound && !hasWide) return 'round';
  if (hasWide && !hasRound) return 'wide';
  if (hasRound && hasWide) return prevViseme === 'wide' ? 'round' : 'wide';
  return prevViseme === 'mid' ? 'wide' : 'mid';
}

function renderCoachSvg(gender, mood, uid = 'ca') {
  const isF = gender === 'female';
  const meta = MOOD_META[mood] || MOOD_META.teach;
  const accent = meta.color;
  const pose = meta.pose;
  const g = `${uid}-${gender}`;

  const skinTop = isF ? '#f8d2b4' : '#edc09c';
  const skinBot = isF ? '#e3ac86' : '#d39a72';
  const skinShade = isF ? '#c88c66' : '#b77d56';
  const hair = isF ? '#261529' : '#182130';
  const hairHi = isF ? '#52305a' : '#334155';
  const suitTop = isF ? '#37307a' : '#182947';
  const suitBot = isF ? '#1e1947' : '#0d172a';
  const suitEdge = isF ? '#5c52b3' : '#2f4875';
  const iris = isF ? '#1e3a5f' : '#1e293b';

  // Cejas por emoción
  let brows = `<path d="M62 49.5q5-2.8 10-.4M88 49.1q5-2.4 10 .4" stroke="#1b1620" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  if (mood === 'blunder') {
    brows = `<path d="M61 52l11-4M99 52l-11-4" stroke="#1b1620" stroke-width="2.7" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'mistake') {
    brows = `<path d="M62 51l10-2.4M98 51l-10-2.4" stroke="#1b1620" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'inaccuracy') {
    brows = `<path d="M62 51h10M88 48q5-3.4 10 0" stroke="#1b1620" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'brilliant' || mood === 'mate') {
    brows = `<path d="M61 47.5q5.5-3.6 11-.8M88 46.7q5.5-2.8 11 .8" stroke="#1b1620" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }

  // Boca en reposo según emoción
  let idleMouth = `<path d="M72.5 76q7.5 4.8 15 0" stroke="#7c2d12" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  if (mood === 'blunder') {
    idleMouth = `<ellipse cx="80" cy="77.2" rx="4.4" ry="3.5" fill="#6b1d24" stroke="#9f3a3a" stroke-width="1"/>`;
  } else if (mood === 'mistake' || mood === 'inaccuracy') {
    idleMouth = `<path d="M73 78q7-3.2 14 0" stroke="#7c2d12" stroke-width="2.3" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'brilliant' || mood === 'mate') {
    idleMouth = `<path d="M71 75q9 7.8 18 0z" fill="#ffffff" stroke="#7c2d12" stroke-width="1.5"/>`;
  }

  const hairBack = isF
    ? `<path d="M46 58c0-22 14-35 34-35s34 13 34 35v36c-7 5-15 6-21 4V66H67v32c-6 2-14 1-21-4V58z" fill="${hair}"/>`
    : `<path d="M53 52c0-18 11-29 27-29s27 11 27 29v10H53V52z" fill="${hair}"/>`;

  const hairFront = isF
    ? `<path d="M54 50c4-15 13-22 26-22 12 0 21 6 26 20-8-6-16-9-25-9-11 0-20 4-27 11z" fill="${hair}"/>
       <path d="M62 34q16-6 32 3" stroke="${hairHi}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.7"/>
       <circle cx="56.5" cy="67" r="2.5" fill="${accent}"/>
       <circle cx="103.5" cy="67" r="2.5" fill="${accent}"/>`
    : `<path d="M54 47c2-14 12-21 26-21 13 0 23 7 26 21-8-8-17-10-26-10-9 0-18 2-26 10z" fill="${hair}"/>
       <path d="M64 32q15-5 29 2" stroke="${hairHi}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.65"/>
       <path d="M60 72c3 11 10 17 20 17s17-6 20-17c-4 6-11 9.5-20 9.5s-16-3.5-20-9.5z" fill="${hair}" opacity="0.56"/>`;

  // Brazos y manos articuladas
  let armMarkup = '';
  if (pose === 'point') {
    armMarkup = `
      <g class="ca-arm-point">
        <path d="M108 116c11 4 20 2 27-6" stroke="url(#${g}-suit)" stroke-width="15" stroke-linecap="round" fill="none"/>
        <path d="M108 116c11 4 20 2 27-6" stroke="${suitEdge}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <ellipse cx="136" cy="108" rx="7.5" ry="6.4" fill="url(#${g}-skin)"/>
        <path d="M140 106.5l10-3.2" stroke="${skinTop}" stroke-width="4" stroke-linecap="round"/>
        <path d="M135 103.5l5-4.8" stroke="${skinTop}" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M137 111.5l7.2-.8" stroke="${skinShade}" stroke-width="3" stroke-linecap="round"/>
      </g>
    `;
  } else if (pose === 'think') {
    armMarkup = `
      <g class="ca-arm-think">
        <path d="M111 124c4-14 2-26-11-36" stroke="url(#${g}-suit)" stroke-width="14" stroke-linecap="round" fill="none"/>
        <path d="M111 124c4-14 2-26-11-36" stroke="${suitEdge}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <ellipse cx="95" cy="86" rx="7.2" ry="6" fill="url(#${g}-skin)"/>
        <path d="M89 85.2l-6 1.4M92 81.2l-4-5" stroke="${skinTop}" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M90 88q5 2 9-1" stroke="${skinShade}" stroke-width="1.5" fill="none"/>
      </g>
    `;
  } else if (pose === 'shock') {
    armMarkup = `
      <g class="ca-arm-shock">
        <path d="M113 125c10-16 11-37 0-56" stroke="url(#${g}-suit)" stroke-width="14" stroke-linecap="round" fill="none"/>
        <path d="M113 125c10-16 11-37 0-56" stroke="${suitEdge}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <ellipse cx="107" cy="61" rx="7" ry="8.2" transform="rotate(-14 107 61)" fill="url(#${g}-skin)"/>
        <path d="M101 55l-6-4M104 52l-3-6M109 53l1-6" stroke="${skinTop}" stroke-width="3.1" stroke-linecap="round"/>
      </g>
    `;
  } else {
    armMarkup = `
      <g class="ca-arm-celebrate">
        <path d="M112 119c14-9 21-22 21-38" stroke="url(#${g}-suit)" stroke-width="14.5" stroke-linecap="round" fill="none"/>
        <path d="M112 119c14-9 21-22 21-38" stroke="${suitEdge}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <circle cx="133" cy="76" r="7.8" fill="url(#${g}-skin)"/>
        <path d="M132 69l1-9" stroke="${skinTop}" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M128 74h9M128 78h8" stroke="${skinShade}" stroke-width="1.5" stroke-linecap="round"/>
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
      <defs>
        <linearGradient id="${g}-skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${skinTop}"/>
          <stop offset="100%" stop-color="${skinBot}"/>
        </linearGradient>
        <linearGradient id="${g}-suit" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${suitTop}"/>
          <stop offset="100%" stop-color="${suitBot}"/>
        </linearGradient>
      </defs>

      <circle cx="80" cy="68" r="56" fill="${accent}" opacity="0.09"/>
      <text x="14" y="136" font-size="38" fill="${accent}" opacity="0.11" font-family="serif">♞</text>

      <g class="ca-body-root">
        <g class="ca-torso">
          <path d="M30 155c4-31 20-46 50-46s46 15 50 46H30z" fill="url(#${g}-suit)" stroke="${accent}" stroke-width="1.6"/>
          <path d="M65 109l15 26 15-26" fill="#f8fafc" opacity="0.95"/>
          <path d="M58 111l14 25-6 19M102 111l-14 25 6 19" stroke="${suitEdge}" stroke-width="2" fill="none"/>
          ${neckAccent}
          <path d="M46 121c-6 11-9 22-9 34" stroke="${suitEdge}" stroke-width="2.2" fill="none" opacity="0.72"/>
        </g>

        <rect x="70" y="87" width="20" height="24" rx="9" fill="${skinShade}"/>

        <g class="ca-head">
          ${hairBack}
          <ellipse cx="56.5" cy="61" rx="4" ry="6" fill="${skinShade}"/>
          <ellipse cx="103.5" cy="61" rx="4" ry="6" fill="${skinShade}"/>
          <!-- Rostro con mandíbula definida -->
          <path d="M57 58c0-15.5 10-25.5 23-25.5s23 10 23 25.5c0 14.5-8.5 28.5-23 29.5-14.5-1-23-15-23-29.5z" fill="url(#${g}-skin)"/>
          <ellipse cx="64.5" cy="67.5" rx="4.4" ry="2.1" fill="#fb7185" opacity="0.22"/>
          <ellipse cx="95.5" cy="67.5" rx="4.4" ry="2.1" fill="#fb7185" opacity="0.22"/>
          ${hairFront}

          <g class="ca-brows">${brows}</g>

          <g class="ca-eyes">
            <ellipse cx="68" cy="58.5" rx="5.4" ry="4.4" fill="#ffffff"/>
            <ellipse cx="92" cy="58.5" rx="5.4" ry="4.4" fill="#ffffff"/>
            <g class="ca-pupils">
              <circle cx="68" cy="58.5" r="2.9" fill="${iris}"/>
              <circle cx="92" cy="58.5" r="2.9" fill="${iris}"/>
              <circle cx="68" cy="58.5" r="1.45" fill="#090d16"/>
              <circle cx="92" cy="58.5" r="1.45" fill="#090d16"/>
              <circle cx="66.8" cy="57.2" r="1" fill="#ffffff"/>
              <circle cx="90.8" cy="57.2" r="1" fill="#ffffff"/>
            </g>
            <path d="M62.5 57q5.5-3.1 11 0M86.5 57q5.5-3.1 11 0" stroke="#1b1620" stroke-width="1.4" fill="none" stroke-linecap="round"/>
          </g>

          <path d="M80 60.5v7l-2.2 1.1" stroke="${skinShade}" stroke-width="1.8" fill="none" stroke-linecap="round"/>

          <!-- 4 formas de boca sincronizadas -->
          <g class="ca-mouth-shape ca-m-idle">${idleMouth}</g>
          <g class="ca-mouth-shape ca-m-mid">
            <path d="M72.5 75.5q7.5 1.8 15 0c-1 4.2-4 6.2-7.5 6.2s-6.5-2-7.5-6.2z" fill="#7f1d1d" stroke="#5b1515" stroke-width="1"/>
            <path d="M74.5 76.2h11" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>
          </g>
          <g class="ca-mouth-shape ca-m-wide">
            <path d="M71.5 74.8q8.5 1.9 17 0c-1.1 7-4.4 9.8-8.5 9.8s-7.4-2.8-8.5-9.8z" fill="#6b161b" stroke="#5b1515" stroke-width="1"/>
            <path d="M73.8 75.6h12.4" stroke="#ffffff" stroke-width="1.9" stroke-linecap="round"/>
            <ellipse cx="80" cy="82.8" rx="4.2" ry="1.7" fill="#fb7185" opacity="0.85"/>
          </g>
          <g class="ca-mouth-shape ca-m-round">
            <ellipse cx="80" cy="77.8" rx="4.4" ry="4.6" fill="#6b161b" stroke="#7c2d12" stroke-width="1.2"/>
            <ellipse cx="80" cy="80.6" rx="2.2" ry="1.1" fill="#fb7185" opacity="0.7"/>
          </g>
        </g>

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
    else if (isSpanishVoice(voice.voice) && detectVoiceGender(voice.voice) === 'male') activeGender = 'male';
  } catch { /* ignorar */ }

  let cachedEsVoices = getStrictSpanishVoices();
  if (window.speechSynthesis?.addEventListener) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      cachedEsVoices = getStrictSpanishVoices();
    });
  }

  let isSpeaking = false;
  let currentViseme = 'idle';
  let speakToken = 0;
  let activeUtter = null;
  let pollTimer = null;
  let speakDelayTimer = null;
  let mouthCloseTimer = null;
  let cadenceTimer = null;

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
    if (cadenceTimer) { clearInterval(cadenceTimer); cadenceTimer = null; }
    if (speakDelayTimer) { clearTimeout(speakDelayTimer); speakDelayTimer = null; }
    if (mouthCloseTimer) { clearTimeout(mouthCloseTimer); mouthCloseTimer = null; }
  };

  // Selección estricta SOLO en español (nunca cae en voces inglesas)
  const resolveSpanishVoiceProfile = (targetGender) => {
    const fresh = getStrictSpanishVoices();
    if (fresh.length) cachedEsVoices = fresh;
    const esList = cachedEsVoices;

    const currentEs = isSpanishVoice(voice.voice) ? voice.voice : null;
    if (currentEs && detectVoiceGender(currentEs) === targetGender) {
      return {
        voiceObj: currentEs,
        lang: currentEs.lang || 'es-ES',
        pitch: targetGender === 'male' ? 0.94 : 1.04,
        rate: targetGender === 'male' ? 0.98 : 1.02
      };
    }

    const genderMatch = esList.find(v => detectVoiceGender(v) === targetGender);
    if (genderMatch) {
      return {
        voiceObj: genderMatch,
        lang: genderMatch.lang || 'es-ES',
        pitch: targetGender === 'male' ? 0.94 : 1.04,
        rate: targetGender === 'male' ? 0.98 : 1.02
      };
    }

    const anyEs = currentEs || esList[0] || null;
    return {
      voiceObj: anyEs,
      lang: anyEs?.lang || 'es-ES',
      pitch: targetGender === 'male' ? 0.76 : 1.18,
      rate: targetGender === 'male' ? 0.95 : 1.03
    };
  };

  const origStop = voice.stop.bind(voice);
  voice.stop = () => {
    speakToken++;
    activeUtter = null;
    stopAllTimers();
    syncSpeakingUI(false);
    return origStop();
  };

  voice.speak = (rawText, force = false) => {
    const text = cleanSpeechText(rawText);
    if (!voice.supported || (!voice.enabled && !force) || !text) return;
    voice.stop();

    const myToken = ++speakToken;
    const prof = resolveSpanishVoiceProfile(activeGender);
    const maxMs = Math.max(6500, Math.min(45000, text.length * 165));

    speakDelayTimer = setTimeout(() => {
      if (myToken !== speakToken) return;
      speakDelayTimer = null;

      try {
        if (window.speechSynthesis?.paused) window.speechSynthesis.resume();
      } catch { /* ignorar */ }

      const utter = new SpeechSynthesisUtterance(text);
      activeUtter = utter;
      utter.lang = prof.lang || 'es-ES';
      if (prof.voiceObj) utter.voice = prof.voiceObj;
      utter.pitch = prof.pitch;
      utter.rate = prof.rate;

      let started = false;
      let startAt = 0;
      let lastBoundaryAt = 0;
      let cadenceIdx = 0;
      let silentPolls = 0;

      const beginSpeaking = () => {
        if (started || myToken !== speakToken) return;
        started = true;
        startAt = performance.now();
        syncSpeakingUI(true);
        setViseme('mid');

        // Pulso continuo: si onboundary deja de disparar a mitad de frase, la boca sigue viva hasta onend
        cadenceTimer = setInterval(() => {
          if (myToken !== speakToken || !isSpeaking) {
            if (cadenceTimer) { clearInterval(cadenceTimer); cadenceTimer = null; }
            return;
          }
          if (performance.now() - lastBoundaryAt < 300) return;
          const next = CADENCE_SEQ[cadenceIdx % CADENCE_SEQ.length];
          cadenceIdx++;
          setViseme(next);
        }, 125);
      };

      const finishSpeaking = () => {
        if (myToken !== speakToken) return;
        activeUtter = null;
        stopAllTimers();
        syncSpeakingUI(false);
      };

      utter.onstart = beginSpeaking;

      utter.onboundary = (ev) => {
        if (myToken !== speakToken) return;
        if (!started) beginSpeaking();
        if (ev.name && ev.name !== 'word') return;

        lastBoundaryAt = performance.now();
        if (mouthCloseTimer) { clearTimeout(mouthCloseTimer); mouthCloseTimer = null; }

        const slice = text.slice(ev.charIndex || 0);
        const match = slice.match(/^[^\s]+/);
        const word = match ? match[0] : '';
        const vis = pickVisemeForWord(word, currentViseme);
        setViseme(vis);

        const closeAfter = Math.max(115, Math.min(230, word.length * 32));
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
          if (!synthSpeaking) silentPolls++;
          else silentPolls = 0;

          if (elapsed > maxMs || (elapsed > 750 && silentPolls >= 3)) {
            finishSpeaking();
          }
        } else if (now - queuedAt > 3500 && !synthSpeaking) {
          finishSpeaking();
        }
      }, 150);

      try {
        window.speechSynthesis.speak(utter);
      } catch {
        finishSpeaking();
      }
    }, 75);
  };

  const origSelectVoice = voice.selectVoiceByName.bind(voice);
  voice.selectVoiceByName = (name) => {
    const picked = getStrictSpanishVoices().find(v => v.name === name);
    if (!picked) return;
    origSelectVoice(picked.name);
    const detected = detectVoiceGender(picked);
    if (detected === 'male' || detected === 'female') {
      activeGender = detected;
      try { localStorage.setItem(GENDER_PREF_KEY, activeGender); } catch { /* ignorar */ }
    }
    refreshAllDocks();
  };

  const swapAvatarAndVoice = () => {
    activeGender = activeGender === 'female' ? 'male' : 'female';
    try { localStorage.setItem(GENDER_PREF_KEY, activeGender); } catch { /* ignorar */ }

    const prof = resolveSpanishVoiceProfile(activeGender);
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
    el.dataset.gender = activeGender;
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
      <div class="coach-stage">${renderCoachSvg(activeGender, mood, id)}</div>
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

  // Actualiza en el sitio sin cortar animaciones si la emoción y género no cambiaron
  const mountOrUpdateDock = (parentEl, spec) => {
    const existing = document.getElementById(spec.id);
    if (!existing) {
      const panel = buildDockPanel(spec);
      parentEl.prepend(panel);
      return panel;
    }

    const meta = MOOD_META[spec.mood] || MOOD_META.teach;
    const visualChanged = existing.dataset.mood !== spec.mood || existing.dataset.gender !== activeGender;
    if (visualChanged) {
      const panel = buildDockPanel(spec);
      existing.replaceWith(panel);
      return panel;
    }

    existing.dataset.titleText = spec.titleText || '';
    existing.dataset.bodyText = spec.bodyText || '';
    existing.dataset.bestText = spec.bestText || '';
    existing.style.setProperty('--coach-aura', meta.color);

    const bubble = existing.querySelector('.coach-bubble');
    if (bubble) {
      bubble.innerHTML = `
        ${spec.titleText ? `<div class="coach-bubble-head">${spec.titleText}</div>` : ''}
        <div class="coach-bubble-text">${spec.bodyText || ''}</div>
        ${spec.bestText ? `<div class="coach-bubble-best">💡 ${spec.bestText}</div>` : ''}
      `;
    }
    return existing;
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

    mountOrUpdateDock(arena, { id: 'review-coach-dock', mood, titleText, bodyText, bestText });

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

      mountOrUpdateDock(layout, {
        id: 'academy-coach-dock',
        mood: 'teach',
        titleText,
        bodyText,
        bestText: ''
      });
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

  // Exponer motor del avatar para el Paso 4 (Laboratorio de Repertorio)
  app.coachAvatar = {
    buildDockPanel,
    mountOrUpdateDock,
    refreshAllDocks,
    syncSpeakingUI,
    getGender: () => activeGender
  };
}
