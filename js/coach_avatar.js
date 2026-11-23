const GENDER_PREF_KEY = 'ajedrez960_coach_avatar_v1';

const MALE_VOICE_RE = /alvaro|álvaro|jorge|pablo|raúl|raul|diego|carlos|alonso|tomás|tomas|enrique|sergio|emilio|gonzalo|gerardo|darío|dario|luciano|juan|mateo|nicolás|nicolas|andrés|andres|rodrigo|esteban|héctor|hector|luis|miguel|david|pedro|antonio|javier|ramón|ramon|male|hombre/i;
const FEMALE_VOICE_RE = /dalia|elena|sabina|paulina|salomé|salome|mónica|monica|camila|mía|mia|paloma|laura|lucía|lucia|sofía|sofia|helena|carmen|catalina|francisca|conchita|elisa|isabela|valentina|jimena|ximena|renata|tania|marisol|maría|maria|ana|lupe|angélica|angelica|elvira|irene|vera|triana|abril|female|mujer|google español/i;

const MOOD_META = {
  brilliant:  { color: '#22d3ee', tag: '✨ ¡Brillante!' },
  best:       { color: '#22c55e', tag: '★ Precisión' },
  excellent:  { color: '#4ade80', tag: '👍 Excelente' },
  good:       { color: '#38bdf8', tag: '♟ Sólida' },
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
    .coach-stage {
      display: flex; align-items: center; gap: 12px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(9, 13, 22, 0.92));
      border: 1px solid var(--border-color); border-radius: 12px;
      padding: 8px 11px; position: relative; overflow: hidden;
    }
    .coach-stage.speaking {
      border-color: var(--coach-aura, #38bdf8);
      box-shadow: 0 0 18px color-mix(in srgb, var(--coach-aura, #38bdf8) 28%, transparent);
    }
    .coach-portrait {
      width: 62px; height: 62px; flex-shrink: 0; border-radius: 50%;
      background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--coach-aura, #38bdf8) 26%, #1e293b), #090d16);
      border: 2px solid var(--coach-aura, #38bdf8);
      display: grid; place-items: center; overflow: hidden;
      animation: coachBreathe 3.2s ease-in-out infinite;
    }
    .coach-stage.speaking .coach-portrait {
      animation: coachTalkBob 0.55s ease-in-out infinite;
    }
    .coach-portrait svg { width: 58px; height: 58px; }
    .coach-eyes { transform-origin: 32px 27px; animation: coachBlink 4.6s infinite; }
    .coach-mouth-talk { opacity: 0; transform-origin: 32px 37px; }
    .coach-stage.speaking .coach-mouth-idle { opacity: 0; }
    .coach-stage.speaking .coach-mouth-talk {
      opacity: 1; animation: coachMouth 0.24s ease-in-out infinite alternate;
    }
    .coach-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .coach-name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .coach-name { font-size: 0.82rem; font-weight: 800; color: #f8fafc; }
    .coach-mood-pill {
      font-size: 0.67rem; font-weight: 800; padding: 1px 7px; border-radius: 999px;
      color: var(--coach-aura, #38bdf8);
      background: color-mix(in srgb, var(--coach-aura, #38bdf8) 16%, transparent);
    }
    .coach-wave-row { display: flex; align-items: center; gap: 6px; height: 16px; }
    .coach-eq { display: flex; align-items: flex-end; gap: 2.5px; height: 14px; }
    .coach-eq span {
      width: 3px; height: 3px; border-radius: 2px;
      background: var(--coach-aura, #38bdf8); opacity: 0.45;
      transition: height 0.15s ease;
    }
    .coach-stage.speaking .coach-eq span { opacity: 1; animation: coachEq 0.48s ease-in-out infinite alternate; }
    .coach-stage.speaking .coach-eq span:nth-child(2) { animation-delay: 0.1s; }
    .coach-stage.speaking .coach-eq span:nth-child(3) { animation-delay: 0.22s; }
    .coach-stage.speaking .coach-eq span:nth-child(4) { animation-delay: 0.08s; }
    .coach-stage.speaking .coach-eq span:nth-child(5) { animation-delay: 0.18s; }
    .coach-state-txt { font-size: 0.71rem; color: var(--text-muted); }
    .coach-swap-btn {
      background: rgba(15, 23, 42, 0.8); color: var(--text-muted);
      border: 1px solid var(--border-color); border-radius: 8px;
      padding: 5px 8px; font-size: 0.74rem; font-weight: 700; cursor: pointer;
    }
    .coach-swap-btn:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }

    @keyframes coachBreathe {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-1.5px); }
    }
    @keyframes coachTalkBob {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-2px) scale(1.03); }
    }
    @keyframes coachBlink {
      0%, 92%, 100% { transform: scaleY(1); }
      96% { transform: scaleY(0.12); }
    }
    @keyframes coachMouth {
      0% { transform: scaleY(0.45) scaleX(0.92); }
      100% { transform: scaleY(1.18) scaleX(1.06); }
    }
    @keyframes coachEq {
      0% { height: 3px; }
      100% { height: 14px; }
    }
  `;
  document.head.appendChild(style);
}

function detectVoiceGender(voiceObj) {
  const name = voiceObj?.name || '';
  if (MALE_VOICE_RE.test(name)) return 'male';
  if (FEMALE_VOICE_RE.test(name)) return 'female';
  return 'female';
}

function renderCoachSvg(gender, mood) {
  const isF = gender === 'female';
  const skin = isF ? '#f2c6a0' : '#eab892';
  const skinShade = isF ? '#d9a47c' : '#cf9a72';
  const hair = isF ? '#2b1b2e' : '#1e293b';
  const suit = isF ? '#312e81' : '#0f172a';
  const accent = (MOOD_META[mood] || MOOD_META.teach).color;

  // Cejas según emoción
  let brows = `<path d="M22 23.5q3-1.6 6 0M36 23.5q3-1.6 6 0" stroke="#1e1b24" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  if (mood === 'mistake' || mood === 'blunder') {
    brows = `<path d="M22 24.5l6-2M42 24.5l-6-2" stroke="#1e1b24" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'inaccuracy') {
    brows = `<path d="M22 24h6M36 22.5q3-2 6 0" stroke="#1e1b24" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'brilliant' || mood === 'mate') {
    brows = `<path d="M22 22.5q3-2.2 6-.4M36 22.1q3-1.8 6 .4" stroke="#1e1b24" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
  }

  // Boca en reposo según emoción
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

  let manualGender = null;
  try {
    const saved = localStorage.getItem(GENDER_PREF_KEY);
    if (saved === 'male' || saved === 'female') manualGender = saved;
  } catch { /* ignorar */ }

  let isSpeaking = false;
  let pollTimer = null;
  let graceUntil = 0;

  const getActiveGender = () => manualGender || detectVoiceGender(voice.voice);

  const syncSpeakingUI = (speaking) => {
    isSpeaking = speaking;
    document.querySelectorAll('.coach-stage').forEach((el) => {
      el.classList.toggle('speaking', speaking);
      const st = el.querySelector('.coach-state-txt');
      if (st) st.textContent = speaking ? 'Explicando jugada...' : 'Listo para analizar';
    });
  };

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const startSpeakingWatch = (text) => {
    stopPolling();
    const now = performance.now();
    graceUntil = now + 700;
    const maxEnd = now + Math.max(2500, Math.min(22000, (text || '').length * 95));
    syncSpeakingUI(true);

    pollTimer = setInterval(() => {
      const t = performance.now();
      const synthSpeaking = Boolean(window.speechSynthesis?.speaking);
      if (t > maxEnd || (t > graceUntil && !synthSpeaking)) {
        stopPolling();
        syncSpeakingUI(false);
      }
    }, 140);
  };

  // Envolver speak/stop para sincronizar boca y ondas con exactitud
  const origSpeak = voice.speak.bind(voice);
  voice.speak = (text, force = false) => {
    const willSpeak = voice.supported && (voice.enabled || force) && Boolean(text);
    const res = origSpeak(text, force);
    if (willSpeak) startSpeakingWatch(text);
    return res;
  };

  const origStop = voice.stop.bind(voice);
  voice.stop = () => {
    stopPolling();
    syncSpeakingUI(false);
    return origStop();
  };

  const origSelectVoice = voice.selectVoiceByName.bind(voice);
  voice.selectVoiceByName = (name) => {
    origSelectVoice(name);
    manualGender = null;
    try { localStorage.removeItem(GENDER_PREF_KEY); } catch { /* ignorar */ }
    refreshAllStages();
  };

  const swapAvatarAndVoice = () => {
    const next = getActiveGender() === 'female' ? 'male' : 'female';
    manualGender = next;
    try { localStorage.setItem(GENDER_PREF_KEY, next); } catch { /* ignorar */ }

    // Si el dispositivo tiene una voz en español de ese género, cambiarla también
    const matching = (voice.spanishVoices || []).find(v => detectVoiceGender(v) === next);
    if (matching) {
      origSelectVoice(matching.name);
      const sel = document.getElementById('an-voice-select');
      if (sel) sel.value = matching.name;
    }
    refreshAllStages();
  };

  const buildStageEl = (mood) => {
    const gender = getActiveGender();
    const meta = MOOD_META[mood] || MOOD_META.teach;
    const coachName = gender === 'female' ? 'Maestra Valeria' : 'Maestro Aurelio';

    const el = document.createElement('div');
    el.className = `coach-stage${isSpeaking ? ' speaking' : ''}`;
    el.dataset.mood = mood;
    el.style.setProperty('--coach-aura', meta.color);
    el.innerHTML = `
      <div class="coach-portrait">${renderCoachSvg(gender, mood)}</div>
      <div class="coach-meta">
        <div class="coach-name-row">
          <span class="coach-name">${coachName}</span>
          <span class="coach-mood-pill">${meta.tag}</span>
        </div>
        <div class="coach-wave-row">
          <div class="coach-eq"><span></span><span></span><span></span><span></span><span></span></div>
          <span class="coach-state-txt">${isSpeaking ? 'Explicando jugada...' : 'Listo para analizar'}</span>
        </div>
      </div>
      <button type="button" class="coach-swap-btn" title="Cambiar entre Maestro y Maestra">⇄</button>
    `;
    el.querySelector('.coach-swap-btn').addEventListener('click', swapAvatarAndVoice);
    return el;
  };

  const refreshAllStages = () => {
    document.querySelectorAll('.coach-stage').forEach((oldEl) => {
      const mood = oldEl.dataset.mood || 'teach';
      oldEl.replaceWith(buildStageEl(mood));
    });
  };

  // 1. Montar avatar en el Analizador Post-Partida
  const origReview = app.analyzer._renderReviewPanel.bind(app.analyzer);
  app.analyzer._renderReviewPanel = () => {
    origReview();
    const box = app.dom.postgameSlot?.querySelector('.an-box');
    const coachCard = box?.querySelector('.an-coach');
    if (!box || !coachCard) return;

    const ply = app.analyzer.currentPly;
    const item = ply > 0 ? app.analyzer.results[ply - 1] : null;
    let mood = 'teach';
    if (item) {
      mood = item.played?.san?.endsWith('#') ? 'mate' : item.classification;
    }
    box.insertBefore(buildStageEl(mood), coachCard);
  };

  // 2. Montar avatar en la Academia de Aperturas
  if (app.academy) {
    const origAcademy = app.academy._renderScaffold.bind(app.academy);
    app.academy._renderScaffold = () => {
      origAcademy();
      const panel = app.academy.container?.querySelector('.tr-panel');
      const textEl = panel?.querySelector('#ac-text');
      if (panel && textEl) {
        panel.insertBefore(buildStageEl('teach'), textEl);
      }
    };
  }
}
