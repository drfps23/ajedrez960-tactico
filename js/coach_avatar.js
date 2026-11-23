import { CLASS_META } from './analyzer.js';

const GENDER_PREF_KEY = 'ajedrez960_coach_avatar_v1';

const MALE_VOICE_RE = /alvaro|álvaro|jorge|pablo|raúl|raul|diego|carlos|alonso|tomás|tomas|enrique|sergio|emilio|gonzalo|gerardo|darío|dario|luciano|juan|mateo|nicolás|nicolas|andrés|andres|rodrigo|esteban|héctor|hector|luis|miguel|david|pedro|antonio|javier|ramón|ramon|eddy|reed|rocko|grandpa|male|hombre/i;
const FEMALE_VOICE_RE = /dalia|elena|sabina|paulina|salomé|salome|mónica|monica|camila|mía|mia|paloma|laura|lucía|lucia|sofía|sofia|helena|carmen|catalina|francisca|conchita|elisa|isabela|valentina|jimena|ximena|renata|tania|marisol|maría|maria|ana|lupe|angélica|angelica|elvira|irene|vera|triana|abril|flo|sandy|shelley|grandma|female|mujer|google español/i;

const MOOD_META = {
  book:       { color: '#c084fc', tag: '📖 Teoría' },
  brilliant:  { color: '#22d3ee', tag: '✨ ¡Brillante!' },
  best:       { color: '#22c55e', tag: '★ Mejor jugada' },
  excellent:  { color: '#4ade80', tag: '👍 Excelente' },
  good:       { color: '#38bdf8', tag: '♟ Buena' },
  inaccuracy: { color: '#facc15', tag: '🤔 Imprecisión' },
  mistake:    { color: '#fb923c', tag: '⚠ Error' },
  blunder:    { color: '#f43f5e', tag: '❗ Error grave' },
  mate:       { color: '#facc15', tag: '👑 ¡Jaque Mate!' },
  teach:      { color: '#38bdf8', tag: '🎓 Enseñando' }
};

function ensureAvatarStyles() {
  if (document.querySelector('style[data-coach-avatar-css]')) return;
  const style = document.createElement('style');
  style.dataset.coachAvatarCss = 'true';
  style.textContent = `
    /* Layout de 3 columnas en Revisión: Entrenador (Izq) · Tablero (Centro) · Controles (Der) */
    body.review-coach-open main.arena {
      display: grid !important;
      grid-template-columns: 270px minmax(360px, 560px) minmax(280px, 350px) !important;
      max-width: 1320px !important;
      justify-content: center;
      align-items: start;
      gap: 18px;
    }
    body.review-coach-open .an-coach { display: none !important; }
    body.review-coach-open .side-panel .card:has(#fx-preview-grid) { display: none !important; }

    /* Layout de 3 columnas en Academia */
    .tr-layout.tr-with-coach {
      grid-template-columns: 255px minmax(320px, 500px) minmax(240px, 1fr) !important;
      align-items: start;
    }
    .tr-layout.tr-with-coach #ac-text { display: none !important; }

    /* Cabina lateral del Entrenador */
    .coach-dock-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      background: linear-gradient(180deg, rgba(19, 27, 46, 0.94) 0%, rgba(9, 13, 22, 0.96) 100%);
      border: 1.5px solid var(--border-color);
      border-radius: 16px;
      padding: 18px 14px;
      position: sticky;
      top: 14px;
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .coach-dock-panel.speaking {
      border-color: var(--coach-aura, #38bdf8);
      box-shadow: 0 0 28px color-mix(in srgb, var(--coach-aura, #38bdf8) 32%, transparent);
    }
    .coach-dock-top {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }
    .coach-portrait {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--coach-aura, #38bdf8) 28%, #1e293b), #090d16);
      border: 3px solid var(--coach-aura, #38bdf8);
      box-shadow: 0 0 24px color-mix(in srgb, var(--coach-aura, #38bdf8) 28%, transparent);
      display: grid;
      place-items: center;
      overflow: hidden;
      flex-shrink: 0;
      animation: coachBreathe 3.2s ease-in-out infinite;
    }
    .coach-dock-panel.speaking .coach-portrait {
      animation: coachTalkBob 0.52s ease-in-out infinite;
    }
    .coach-portrait svg { width: 112px; height: 112px; }
    .coach-eyes { transform-origin: 32px 27px; animation: coachBlink 4.6s infinite; }
    .coach-mouth-talk { opacity: 0; transform-origin: 32px 37px; }
    .coach-dock-panel.speaking .coach-mouth-idle { opacity: 0; }
    .coach-dock-panel.speaking .coach-mouth-talk {
      opacity: 1;
      animation: coachMouth 0.24s ease-in-out infinite alternate;
    }

    .coach-identity { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .coach-name { font-size: 0.96rem; font-weight: 800; color: #f8fafc; }
    .coach-mood-pill {
      font-size: 0.72rem; font-weight: 800; padding: 2px 9px; border-radius: 999px;
      color: var(--coach-aura, #38bdf8);
      background: color-mix(in srgb, var(--coach-aura, #38bdf8) 18%, transparent);
      border: 1px solid color-mix(in srgb, var(--coach-aura, #38bdf8) 38%, transparent);
    }
    .coach-wave-row { display: flex; align-items: center; justify-content: center; gap: 6px; height: 18px; }
    .coach-eq { display: flex; align-items: flex-end; gap: 3px; height: 15px; }
    .coach-eq span {
      width: 3.5px; height: 3px; border-radius: 2px;
      background: var(--coach-aura, #38bdf8); opacity: 0.4;
    }
    .coach-dock-panel.speaking .coach-eq span { opacity: 1; animation: coachEq 0.45s ease-in-out infinite alternate; }
    .coach-dock-panel.speaking .coach-eq span:nth-child(2) { animation-delay: 0.1s; }
    .coach-dock-panel.speaking .coach-eq span:nth-child(3) { animation-delay: 0.22s; }
    .coach-dock-panel.speaking .coach-eq span:nth-child(4) { animation-delay: 0.08s; }
    .coach-dock-panel.speaking .coach-eq span:nth-child(5) { animation-delay: 0.18s; }
    .coach-state-txt { font-size: 0.74rem; color: var(--text-muted); }

    .coach-bubble {
      width: 100%;
      background: rgba(9, 13, 22, 0.78);
      border: 1px solid var(--border-color);
      border-top: 3px solid var(--coach-aura, #38bdf8);
      border-radius: 12px;
      padding: 11px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .coach-bubble-head {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.8rem; font-weight: 800; color: #f8fafc;
    }
    .coach-bubble-text { font-size: 0.84rem; line-height: 1.5; color: var(--text-main); }
    .coach-bubble-best { font-size: 0.78rem; font-weight: 700; color: #4ade80; }

    .coach-swap-btn {
      background: rgba(15, 23, 42, 0.85); color: var(--text-muted);
      border: 1px solid var(--border-color); border-radius: 8px;
      padding: 4px 9px; font-size: 0.72rem; font-weight: 700; cursor: pointer;
    }
    .coach-swap-btn:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }

    /* Tablet / Móvil: tarjeta horizontal compacta arriba del tablero */
    @media (max-width: 1140px) {
      body.review-coach-open main.arena {
        grid-template-columns: 1fr !important;
        max-width: 640px !important;
      }
      .tr-layout.tr-with-coach {
        grid-template-columns: 1fr !important;
      }
      .coach-dock-panel {
        position: static;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        padding: 12px;
      }
      .coach-portrait { width: 76px; height: 76px; }
      .coach-portrait svg { width: 70px; height: 70px; }
      .coach-identity { align-items: flex-start; text-align: left; flex: 1; }
      .coach-bubble { flex: 1 1 100%; }
    }

    @keyframes coachBreathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
    @keyframes coachTalkBob { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-2.5px) scale(1.03); } }
    @keyframes coachBlink { 0%, 92%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.12); } }
    @keyframes coachMouth { 0% { transform: scaleY(0.45) scaleX(0.92); } 100% { transform: scaleY(1.2) scaleX(1.06); } }
    @keyframes coachEq { 0% { height: 3px; } 100% { height: 15px; } }
  `;
  document.head.appendChild(style);
}

function detectVoiceGender(voiceObj) {
  const name = voiceObj?.name || '';
  if (MALE_VOICE_RE.test(name) && !FEMALE_VOICE_RE.test(name)) return 'male';
  if (FEMALE_VOICE_RE.test(name)) return 'female';
  return 'neutral';
}

function renderCoachSvg(gender, mood) {
  const isF = gender === 'female';
  const skin = isF ? '#f2c6a0' : '#eab892';
  const skinShade = isF ? '#d9a47c' : '#cf9a72';
  const hair = isF ? '#2b1b2e' : '#1e293b';
  const suit = isF ? '#312e81' : '#0f172a';
  const accent = (MOOD_META[mood] || MOOD_META.teach).color;

  let brows = `<path d="M22 23.5q3-1.6 6 0M36 23.5q3-1.6 6 0" stroke="#1e1b24" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  if (mood === 'mistake' || mood === 'blunder') {
    brows = `<path d="M22 24.5l6-2M42 24.5l-6-2" stroke="#1e1b24" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'inaccuracy') {
    brows = `<path d="M22 24h6M36 22.5q3-2 6 0" stroke="#1e1b24" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'brilliant' || mood === 'mate') {
    brows = `<path d="M22 22.5q3-2.2 6-.4M36 22.1q3-1.8 6 .4" stroke="#1e1b24" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
  }

  let idleMouth = `<path d="M27.5 36.5q4.5 3 9 0" stroke="#7c2d12" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
  if (mood === 'blunder') {
    idleMouth = `<ellipse cx="32" cy="37" rx="3.4" ry="2.6" fill="#7f1d1d"/>`;
  } else if (mood === 'mistake' || mood === 'inaccuracy') {
    idleMouth = `<path d="M28 37.5q4-2 8 0" stroke="#7c2d12" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'brilliant' || mood === 'mate') {
    idleMouth = `<path d="M26.5 35.8q5.5 4.8 11 0z" fill="#ffffff" stroke="#7c2d12" stroke-width="1.3"/>`;
  }

  const hairBack = isF
    ? `<path d="M14 28c0-11 7-19 18-19s18 8 18 19v17c-4 2-7 2-10 1V32H24v14c-3 1-6 1-10-1V28z" fill="${hair}"/>`
    : `<path d="M17 25c0-9 6.5-15 15-15s15 6 15 15v5H17v-5z" fill="${hair}"/>`;

  const hairFront = isF
    ? `<path d="M18 23c2-8 7-12 14-12 6 0 11 3 14 11-4-3-8-5-13-5-6 0-11 2-15 6z" fill="${hair}"/>
       <circle cx="19" cy="32" r="1.7" fill="${accent}"/>
       <circle cx="45" cy="32" r="1.7" fill="${accent}"/>`
    : `<path d="M18 22c1-7 7-11 14-11 7 0 12 4 14 11-4-4-9-5-14-5-5 0-10 1-14 5z" fill="${hair}"/>
       <path d="M21 35c2 6 6.5 9 11 9s9-3 11-9c-2 3.2-6 5.2-11 5.2S23 38.2 21 35z" fill="${hair}" opacity="0.72"/>`;

  const sparkle = (mood === 'brilliant' || mood === 'mate')
    ? `<path d="M53 10l1.4 3.4L58 15l-3.6 1.4L53 20l-1.4-3.6L48 15l3.6-1.6z" fill="${accent}"/>`
    : '';

  return `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      ${hairBack}
      <path d="M12 62c2-11 9-16 20-16s18 5 20 16H12z" fill="${suit}" stroke="${accent}" stroke-width="1.4"/>
      <path d="M27 46l5 9 5-9" fill="#f8fafc" opacity="0.9"/>
      <path d="M31 49h2l1 7h-4z" fill="${accent}"/>
      <rect x="27.5" y="40" width="9" height="8" rx="4" fill="${skinShade}"/>
      <ellipse cx="32" cy="29" rx="13" ry="14.5" fill="${skin}"/>
      ${hairFront}
      ${brows}
      <g class="coach-eyes">
        <circle cx="25.5" cy="27.5" r="2.2" fill="#0f172a"/>
        <circle cx="38.5" cy="27.5" r="2.2" fill="#0f172a"/>
        <circle cx="24.8" cy="26.8" r="0.75" fill="#ffffff"/>
        <circle cx="37.8" cy="26.8" r="0.75" fill="#ffffff"/>
      </g>
      <path d="M32 29v4l-1.2.6" stroke="${skinShade}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <g class="coach-mouth-idle">${idleMouth}</g>
      <g class="coach-mouth-talk">
        <ellipse cx="32" cy="36.8" rx="4.2" ry="3.2" fill="#7f1d1d" stroke="#f8fafc" stroke-width="0.9"/>
      </g>
      ${sparkle}
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
  let pollTimer = null;
  let speakDelayTimer = null;

  const syncSpeakingUI = (speaking) => {
    isSpeaking = speaking;
    document.querySelectorAll('.coach-dock-panel').forEach((el) => {
      el.classList.toggle('speaking', speaking);
      const st = el.querySelector('.coach-state-txt');
      if (st) st.textContent = speaking ? 'Explicando...' : 'Listo';
    });
  };

  const stopPolling = () => {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (speakDelayTimer) { clearTimeout(speakDelayTimer); speakDelayTimer = null; }
  };

  const resolveVoiceProfile = (targetGender) => {
    if (!voice.spanishVoices || voice.spanishVoices.length === 0) voice._refreshVoices();
    const list = voice.spanishVoices || [];
    const current = voice.voice || list[0] || null;
    const currentG = detectVoiceGender(current);

    if (current && currentG === targetGender) {
      return { voiceObj: current, pitch: targetGender === 'male' ? 0.94 : 1.06, rate: targetGender === 'male' ? 0.99 : 1.04 };
    }
    const nativeMatch = list.find(v => detectVoiceGender(v) === targetGender);
    if (nativeMatch) {
      return { voiceObj: nativeMatch, pitch: targetGender === 'male' ? 0.94 : 1.06, rate: targetGender === 'male' ? 0.99 : 1.04 };
    }
    return { voiceObj: current, pitch: targetGender === 'male' ? 0.64 : 1.28, rate: targetGender === 'male' ? 0.94 : 1.06 };
  };

  const origStop = voice.stop.bind(voice);
  voice.stop = () => {
    stopPolling();
    syncSpeakingUI(false);
    return origStop();
  };

  voice.speak = (text, force = false) => {
    if (!voice.supported || (!voice.enabled && !force) || !text) return;
    voice.stop();

    const prof = resolveVoiceProfile(activeGender);
    const maxMs = Math.max(2400, Math.min(22000, text.length * 95));

    speakDelayTimer = setTimeout(() => {
      speakDelayTimer = null;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = prof.voiceObj?.lang || 'es-ES';
      if (prof.voiceObj) utter.voice = prof.voiceObj;
      utter.pitch = prof.pitch;
      utter.rate = prof.rate;

      const startAt = performance.now();
      syncSpeakingUI(true);

      utter.onend = () => { stopPolling(); syncSpeakingUI(false); };
      utter.onerror = () => { stopPolling(); syncSpeakingUI(false); };

      pollTimer = setInterval(() => {
        const elapsed = performance.now() - startAt;
        if (elapsed > maxMs || (elapsed > 750 && !window.speechSynthesis?.speaking)) {
          stopPolling();
          syncSpeakingUI(false);
        }
      }, 150);

      try { window.speechSynthesis.speak(utter); } catch { syncSpeakingUI(false); }
    }, 50);
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
    el.dataset.titleText = titleText || '';
    el.dataset.bodyText = bodyText || '';
    el.dataset.bestText = bestText || '';
    el.style.setProperty('--coach-aura', meta.color);

    el.innerHTML = `
      <div class="coach-dock-top">
        <span class="coach-mood-pill">${meta.tag}</span>
        <button type="button" class="coach-swap-btn" title="Cambiar entre Maestro y Maestra">⇄ Voz</button>
      </div>
      <div class="coach-portrait">${renderCoachSvg(activeGender, mood)}</div>
      <div class="coach-identity">
        <span class="coach-name">${coachName}</span>
        <div class="coach-wave-row">
          <div class="coach-eq"><span></span><span></span><span></span><span></span><span></span></div>
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

  // 1. Montar cabina izquierda en el Analizador Post-Partida
  const origReview = app.analyzer._renderReviewPanel.bind(app.analyzer);
  app.analyzer._renderReviewPanel = () => {
    origReview();
    const arena = document.querySelector('main.arena');
    if (!arena || !app.analyzer.inReview) return;

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

    if (!wasOpen) {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    }
  };

  const origExit = app.analyzer.exitReview.bind(app.analyzer);
  app.analyzer.exitReview = () => { closeReviewDock(); return origExit(); };

  const origReset = app.analyzer.reset.bind(app.analyzer);
  app.analyzer.reset = () => { closeReviewDock(); return origReset(); };

  // 2. Montar cabina izquierda en la Academia de Aperturas
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
}
