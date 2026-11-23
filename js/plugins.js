import { PuzzleTrainer } from './puzzles.js';
import { AcademyTrainer } from './academy.js';
import { attachEloSystem } from './elo.js';
import { attachOpeningBook } from './openings.js';
import { attachTouchControls } from './touch.js';
import { attachStockfishLevels } from './ai_levels.js';
import { attachStockfishAnalyzer } from './sf_analyzer.js';
import { attachMobileAndStoreReady } from './mobile.js';
import { runCinematicIntro } from './intro.js';
import { attachAuthSystem } from './auth.js';
import { attachCoachAvatar } from './coach_avatar.js';
import { attachArmory } from './armory.js';
import { attachSocialFeatures } from './social.js';
import { attachHistoryVault } from './history_vault.js';
import { attachDailyMissions } from './missions.js';

// Lanza la pantalla de entrada de inmediato al abrir la app
const introPromise = runCinematicIntro();

function attachPlugins() {
  const app = window.chessApp;
  if (!app || !app.shell) {
    setTimeout(attachPlugins, 60);
    return;
  }

  // Fase 7: Problemas y Academia (4 niveles interactivos)
  app.puzzles = new PuzzleTrainer(app);
  app.academy = new AcademyTrainer(app);

  const originalNavigate = app.shell.navigate.bind(app.shell);
  app.shell.navigate = (viewId) => {
    if (viewId !== 'puzzles') app.puzzles.stop();
    if (viewId !== 'learn') app.academy.stop();
    originalNavigate(viewId);
  };

  app.shell.onRenderPuzzles = (mountEl) => app.puzzles.mount(mountEl);
  app.shell.onRenderLearn = (mountEl) => app.academy.mount(mountEl);

  // Fase 8: ELO Online oficial, Detector de Aperturas y Drag & Drop Táctil
  attachEloSystem(app);
  attachOpeningBook(app);
  attachTouchControls(app);

  // Fase 9 + Calibración: Stockfish en IA y Análisis Post-Partida automático
  attachStockfishLevels(app);
  attachStockfishAnalyzer(app);

  // Fase 10: Háptica móvil, PWA Offline y puente Capacitor/RevenueCat
  attachMobileAndStoreReady(app);

  // Fase 11: Sistema de Cuentas e Invitado tras finalizar la intro
  const auth = attachAuthSystem(app);
  introPromise.then(() => auth.ensureSession({ skipIfInvite: true }));

  // Fase 12: Cabina izquierda del Entrenador con voz diferenciada
  attachCoachAvatar(app);

  // Fase 13: Armería FX personalizable por cada pieza
  attachArmory(app);

  // Fase 14: Reacciones Rápidas Online + Tarjeta de Victoria compartible
  attachSocialFeatures(app);

  // Fase 15: Archivo de Partidas Guardadas + Misiones Diarias y XP
  attachHistoryVault(app);
  attachDailyMissions(app);

  if (app.shell.currentView !== 'play') {
    app.shell.renderCurrentView();
  }
}

attachPlugins();
