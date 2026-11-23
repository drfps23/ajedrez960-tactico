import { PuzzleTrainer } from './puzzles.js';
import { AcademyTrainer } from './academy.js';
import { attachEloSystem } from './elo.js';
import { attachOpeningBook } from './openings.js';
import { attachTouchControls } from './touch.js';

function attachPlugins() {
  const app = window.chessApp;
  if (!app || !app.shell) {
    setTimeout(attachPlugins, 60);
    return;
  }

  // Fase 7: Problemas y Academia
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

  if (app.shell.currentView !== 'play') {
    app.shell.renderCurrentView();
  }
}

attachPlugins();
