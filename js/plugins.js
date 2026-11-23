import { PuzzleTrainer } from './puzzles.js';
import { AcademyTrainer } from './academy.js';

function attachPlugins() {
  const app = window.chessApp;
  if (!app || !app.shell) {
    setTimeout(attachPlugins, 60);
    return;
  }

  app.puzzles = new PuzzleTrainer(app);
  app.academy = new AcademyTrainer(app);

  // Detener voz o animaciones de entrenamiento al cambiar de sección
  const originalNavigate = app.shell.navigate.bind(app.shell);
  app.shell.navigate = (viewId) => {
    if (viewId !== 'puzzles') app.puzzles.stop();
    if (viewId !== 'learn') app.academy.stop();
    originalNavigate(viewId);
  };

  app.shell.onRenderPuzzles = (mountEl) => app.puzzles.mount(mountEl);
  app.shell.onRenderLearn = (mountEl) => app.academy.mount(mountEl);

  // Actualizar las etiquetas de la Pantalla de Inicio a "ACTIVO"
  if (app.shell.currentView !== 'play') {
    app.shell.renderCurrentView();
  }
}

attachPlugins();
