export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCqbQKf64wUR1vfi8qMUwg7cHCpt9iU9Z8',
  authDomain: 'ajedrez-tactico.firebaseapp.com',
  databaseURL: 'https://ajedrez-tactico-default-rtdb.firebaseio.com',
  projectId: 'ajedrez-tactico',
  storageBucket: 'ajedrez-tactico.firebasestorage.app',
  messagingSenderId: '906442719173',
  appId: '1:906442719173:web:b5593eba5741dd115595ac'
};

export function isFirebaseConfigured() {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.databaseURL &&
    !FIREBASE_CONFIG.apiKey.startsWith('PEGA_AQUI') &&
    FIREBASE_CONFIG.databaseURL.startsWith('https://')
  );
}
