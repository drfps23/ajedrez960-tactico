import { REPERTOIRE } from './data/repertoire_data.js';
import { Chess960Engine } from './engine.js';
import { detectOpening } from './openings.js';

const SCOUT_USER_KEY = 'ajedrez960_scout_last_user_v1';
const VAULT_KEY = 'ajedrez960_saved_games_v1';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&').replace(/</g, '<')
    .replace(/>/g, '>').replace(/"/g, '"');
}

function parseOpeningFromPgn(pgn) {
  if (!pgn) return { eco: '', name: 'Apertura General' };
  const ecoM = pgn.match(/\[ECO\s+"([^"]+)"\]/);
  const urlM = pgn.match(/\[ECOUrl\s+"([^"]+)"\]/);
  const nameM = pgn.match(/\[Opening\s+"([^"]+)"\]/);
  const eco = ecoM ? ecoM[1] : '';

  if (nameM && nameM[1]) return { eco, name: nameM[1] };
  if (urlM && urlM[1]) {
    const slug = urlM[1].split('/openings/')[1] || '';
    const clean = slug
      .replace(/-\d+\..*$/, '')
      .replace(/-/g, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join(' ');
    if (clean) return { eco, name: clean };
  }
  return { eco, name: eco ? `Apertura ${eco}` : 'Apertura General' };
}

export function matchRepertoireOpening(name, eco, color) {
  const hay = `${name} ${eco}`.toLowerCase();
  const sameColor = REPERTOIRE.filter(o => o.color === color);
  const hit = sameColor.find(o => o.keywords.some(kw => hay.includes(kw)));
  return hit || sameColor[0] || null;
}

function fetchLocalAppGames() {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(VAULT_KEY) || '[]'); } catch { saved = []; }
  const classics = saved.filter(g => g && g.variant === 'classic' && Array.isArray(g.moves) && g.moves.length >= 2);
  if (!classics.length) {
    throw new Error('Aún no tienes partidas de Ajedrez Clásico guardadas en esta app. Juega 1 o 2 partidas clásicas o elige Chess.com / Lichess.');
  }

  return classics.map(g => {
    const sim = new Chess960Engine(518);
    const limit = Math.min(12, g.moves.length);
    for (let i = 0; i < limit; i++) {
      const m = g.moves[i];
      const legal = sim.getLegalMoves(sim.turn);
      const found = m.ca
        ? legal.find(x => x.castle === m.ca)
        : legal.find(x =>
            x.from.r === m.fr && x.from.c === m.fc &&
            x.to.r === m.tr && x.to.c === m.tc &&
            (x.promo || null) === (m.pr || null)
          );
      if (!found) break;
      sim.makeMove(found);
    }
    const op = detectOpening(sim.history);
    return {
      color: g.myColor || 'w',
      outcome: g.outcome || 'draw',
      opening: op?.name || 'Apertura General',
      eco: op?.eco || ''
    };
  });
}

async function fetchChessComGames(username) {
  const user = username.trim().toLowerCase();
  const archRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(user)}/games/archives`);
  if (!archRes.ok) throw new Error('Usuario no encontrado en Chess.com.');
  const archData = await archRes.json();
  const archives = archData.archives || [];
  if (!archives.length) throw new Error('Esta cuenta no tiene partidas públicas recientes.');

  const rawGames = [];
  for (let i = archives.length - 1; i >= Math.max(0, archives.length - 2); i--) {
    const gRes = await fetch(archives[i]);
    if (!gRes.ok) continue;
    const gJson = await gRes.json();
    rawGames.push(...(gJson.games || []).reverse());
    if (rawGames.length >= 45) break;
  }

  const DRAW_RESULTS = new Set(['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient']);
  return rawGames.slice(0, 45).map(g => {
    const isWhite = (g.white?.username || '').toLowerCase() === user;
    const myRes = isWhite ? g.white?.result : g.black?.result;
    const outcome = myRes === 'win' ? 'win' : DRAW_RESULTS.has(myRes) ? 'draw' : 'loss';
    const op = parseOpeningFromPgn(g.pgn);
    return { color: isWhite ? 'w' : 'b', outcome, opening: op.name, eco: op.eco };
  });
}

async function fetchLichessGames(username) {
  const user = username.trim();
  const res = await fetch(
    `https://lichess.org/api/games/user/${encodeURIComponent(user)}?max=45&opening=true`,
    { headers: { Accept: 'application/x-ndjson' } }
  );
  if (!res.ok) throw new Error('Usuario no encontrado en Lichess.');
  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim().startsWith('{'));
  if (!lines.length) throw new Error('Esta cuenta no tiene partidas públicas en Lichess.');

  const lowUser = user.toLowerCase();
  return lines.map(line => {
    const g = JSON.parse(line);
    const wName = (g.players?.white?.user?.name || '').toLowerCase();
    const isWhite = wName === lowUser;
    const mySide = isWhite ? 'white' : 'black';
    const outcome = !g.winner ? 'draw' : (g.winner === mySide ? 'win' : 'loss');
    return {
      color: isWhite ? 'w' : 'b',
      outcome,
      opening: (g.opening?.name || 'Apertura General').split(':')[0].trim(),
      eco: g.opening?.eco || ''
    };
  });
}

function aggregateByColor(games, color) {
  const map = new Map();
  games.filter(g => g.color === color).forEach(g => {
    const key = g.opening;
    if (!map.has(key)) map.set(key, { name: key, eco: g.eco, w: 0, d: 0, l: 0, total: 0 });
    const row = map.get(key);
    row.total++;
    if (g.outcome === 'win') row.w++;
    else if (g.outcome === 'draw') row.d++;
    else row.l++;
  });
  return [...map.values()]
    .map(r => ({ ...r, winPct: Math.round(((r.w + r.d * 0.5) / r.total) * 100) }))
    .sort((a, b) => b.total - a.total);
}

export function mountScoutPanel(container, { onTrainOpening }) {
  let saved = { platform: 'app', username: '' };
  try { saved = { ...saved, ...JSON.parse(localStorage.getItem(SCOUT_USER_KEY) || '{}') }; } catch { /* ignorar */ }

  container.innerHTML = `
    <div class="rep-scout-box">
      <div class="rep-scout-head">
        <div>
          <h3>🔎 Diagnóstico de Debilidades por Apertura</h3>
          <p class="sec-sub">Analiza tus partidas jugadas en esta app o importa opcionalmente tu historial público de Chess.com / Lichess.</p>
        </div>
      </div>

      <form class="rep-scout-form" id="scout-form">
        <select class="ctrl-select" id="scout-platform">
          <option value="app" ${saved.platform === 'app' ? 'selected' : ''}>♛ Mis Partidas en Esta App</option>
          <option value="chesscom" ${saved.platform === 'chesscom' ? 'selected' : ''}>♟ Chess.com (Cuenta externa)</option>
          <option value="lichess" ${saved.platform === 'lichess' ? 'selected' : ''}>♞ Lichess (Cuenta externa)</option>
        </select>
        <input type="text" class="rep-scout-input" id="scout-user" placeholder="Tu usuario de Chess.com o Lichess" value="${esc(saved.username)}" />
        <button type="submit" class="btn btn-primary" id="scout-btn">⚡ Analizar Partidas</button>
      </form>

      <div id="scout-output"></div>
    </div>
  `;

  const form = container.querySelector('#scout-form');
  const platEl = container.querySelector('#scout-platform');
  const userEl = container.querySelector('#scout-user');
  const btnEl = container.querySelector('#scout-btn');
  const outEl = container.querySelector('#scout-output');

  const syncInputVisibility = () => {
    const isLocal = platEl.value === 'app';
    userEl.style.display = isLocal ? 'none' : '';
    userEl.required = !isLocal;
  };
  syncInputVisibility();
  platEl.addEventListener('change', syncInputVisibility);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const platform = platEl.value;
    const username = userEl.value.trim();
    if (platform !== 'app' && !username) return;

    try { localStorage.setItem(SCOUT_USER_KEY, JSON.stringify({ platform, username })); } catch { /* ignorar */ }

    btnEl.disabled = true;
    btnEl.textContent = '⏳ Analizando...';
    outEl.innerHTML = '<p class="sec-sub">Calculando rendimiento por apertura...</p>';

    try {
      const games = platform === 'app'
        ? fetchLocalAppGames()
        : platform === 'chesscom'
          ? await fetchChessComGames(username)
          : await fetchLichessGames(username);

      const labelSource = platform === 'app' ? 'tu historial en esta app' : username;
      const wStats = aggregateByColor(games, 'w');
      const bStats = aggregateByColor(games, 'b');

      const combined = [...wStats.map(x => ({ ...x, color: 'w' })), ...bStats.map(x => ({ ...x, color: 'b' }))];
      const withMin = combined.filter(x => x.total >= 2);
      const pool = withMin.length ? withMin : combined;
      const weakest = pool.sort((a, b) => a.winPct - b.winPct)[0] || null;
      const weakTarget = weakest ? matchRepertoireOpening(weakest.name, weakest.eco, weakest.color) : null;

      const renderCol = (title, color, list) => `
        <div class="rep-scout-col">
          <strong>${title}</strong>
          ${list.length === 0 ? '<p class="sec-sub">Sin partidas registradas con este color.</p>' : list.slice(0, 5).map(r => {
            const rec = matchRepertoireOpening(r.name, r.eco, color);
            const barColor = r.winPct >= 55 ? '#22c55e' : r.winPct >= 42 ? '#facc15' : '#f43f5e';
            return `
              <div class="rep-scout-row">
                <div style="min-width:0;flex:1">
                  <div style="font-size:0.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.name)}</div>
                  <div class="sec-sub">${r.total} part. · ${r.w}G / ${r.d}E / ${r.l}P · <strong style="color:${barColor}">${r.winPct}%</strong></div>
                </div>
                ${rec ? `<button type="button" class="tr-pill" data-train-op="${rec.id}" data-train-color="${color}">🎯 Entrenar</button>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;

      outEl.innerHTML = `
        <div class="rep-scout-summary">
          <span>✅ <strong>${games.length} partida(s)</strong> analizadas de <strong>${esc(labelSource)}</strong></span>
          ${weakest ? `
            <div class="rep-weak-alert">
              <span>⚠️ Punto a reforzar (${weakest.color === 'w' ? 'Blancas' : 'Negras'}): <strong>${esc(weakest.name)}</strong> (${weakest.winPct}% en ${weakest.total} part.)</span>${weakTarget ? `<button type="button" class="btn btn-primary" data-train-op="${weakTarget.id}" data-train-color="${weakest.color}">🔥 Entrenar ${esc(weakTarget.name)}</button>` : ''}
            </div>
          ` : ''}
        </div>
        <div class="rep-scout-cols">
          ${renderCol('⬜ Rendimiento con Blancas', 'w', wStats)}
          ${renderCol('⬛ Rendimiento con Negras', 'b', bStats)}
        </div>
      `;

      outEl.querySelectorAll('[data-train-op]').forEach(b => {
        b.addEventListener('click', () => onTrainOpening(b.dataset.trainColor, b.dataset.trainOp));
      });
    } catch (err) {
      outEl.innerHTML = `<div class="tr-feedback err">✕ ${esc(err.message || 'No se pudieron analizar las partidas.')}</div>`;
    } finally {
      btnEl.disabled = false;
      btnEl.textContent = '⚡ Analizar Partidas';
    }
  });
}
