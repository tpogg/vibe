// ═══════════════════════════════════════════════════════════
// 1V9.AI — MAIN ENTRY POINT
// Full canvas-rendered SPA powered by Pretext
// ═══════════════════════════════════════════════════════════

import { Renderer, T } from './engine.js';
import { renderHome } from './pages-home.js';
import { renderTraining } from './pages-train.js';
import { renderChampions, renderTierList, renderCoaching, renderTft, renderCoin, renderNews, renderCommunity } from './pages-other.js';

// ── Boot Sequence ─────────────────────────────────────────
function boot() {
  const bootEl = document.getElementById('boot-screen')!;
  const logoEl = document.getElementById('boot-logo')!;
  const barEl = document.getElementById('boot-bar')!;
  const textEl = document.getElementById('boot-text')!;

  logoEl.textContent = `
  ██╗██╗   ██╗ █████╗        █████╗ ██╗
 ███║██║   ██║██╔══██╗      ██╔══██╗██║
 ╚██║██║   ██║╚██████║      ███████║██║
  ██║╚██╗ ██╔╝ ╚═══██║      ██╔══██║██║
  ██║ ╚████╔╝  █████╔╝  ██╗ ██║  ██║██║
  ╚═╝  ╚═══╝   ╚════╝   ╚═╝ ╚═╝  ╚═╝╚═╝`;

  const msgs = [
    'INITIALIZING 1V9 NEURAL ENGINE...',
    'LOADING CHAMPION DATABASE...',
    'CALIBRATING AI COACHING MODEL...',
    'PREPARING TRAINING ARENA...',
    'CONNECTING TO MATCH SERVERS...',
    'NEURAL ENGINE ONLINE — READY',
  ];

  let i = 0;
  const step = () => {
    if (i < msgs.length) {
      textEl.textContent = msgs[i];
      barEl.style.width = ((i + 1) / msgs.length * 100) + '%';
      i++;
      setTimeout(step, 300);
    } else {
      setTimeout(() => {
        bootEl.classList.add('hidden');
        startApp();
      }, 400);
    }
  };
  step();
}

// ── App ───────────────────────────────────────────────────
function startApp() {
  const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
  canvas.style.display = 'block';
  const r = new Renderer(canvas);

  // Register pages
  r.pages.set('home', renderHome);
  r.pages.set('train', renderTraining);
  r.pages.set('champions', renderChampions);
  r.pages.set('tierlist', renderTierList);
  r.pages.set('coaching', renderCoaching);
  r.pages.set('tft', renderTft);
  r.pages.set('coin', renderCoin);
  r.pages.set('news', renderNews);
  r.pages.set('community', renderCommunity);

  // Hash routing
  function onHash() {
    const page = location.hash.replace('#', '') || 'home';
    r.navigateTo(page);
  }
  window.addEventListener('hashchange', onHash);
  r.onNavigate = (page) => {
    location.hash = '#' + page;
  };
  onHash();

  r.start();
}

// ── Launch ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', boot);
