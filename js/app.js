// ═══════════════════════════════════════════════════════════
// 1V9.AI — MAIN APPLICATION
// ═══════════════════════════════════════════════════════════

// ── State ─────────────────────────────────────────────────
const STATE = {
  credits: 100,
  xp: 150,
  level: 1,
  xpPerLevel: 1000,
  userTier: 'beginner', // 'beginner' | 'pro'
  unlockedTechniques: new Set(),
  currentTechnique: null,
  arenaActive: false,
  arenaScore: 0,
  arenaCombo: 0,
  arenaBestCombo: 0,
  arenaHits: 0,
  arenaMisses: 0,
  arenaTimer: null,
  arenaTimeLeft: 30,
  arenaEntities: [],
  coinPrice: 0.00847,
  activeTier: 'beginner',
  activeRole: 'all',
  activeTftTab: 'comps',
  activeCommTab: 'leaderboard',
};

// ── Utility ───────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
function showToast(msg, type = 'success') {
  const c = $('#toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ═══════════════════════════════════════════════════════════
// BOOT SEQUENCE
// ═══════════════════════════════════════════════════════════
function runBoot() {
  const logo = $('#boot-logo');
  const bar = $('#boot-bar');
  const text = $('#boot-text');
  logo.textContent =
`  ██╗██╗   ██╗ █████╗        █████╗ ██╗
 ███║██║   ██║██╔══██╗      ██╔══██╗██║
 ╚██║██║   ██║╚██████║      ███████║██║
  ██║╚██╗ ██╔╝ ╚═══██║      ██╔══██║██║
  ██║ ╚████╔╝  █████╔╝  ██╗ ██║  ██║██║
  ╚═╝  ╚═══╝   ╚════╝   ╚═╝ ╚═╝  ╚═╝╚═╝`;

  const msgs = [
    'INITIALIZING 1V9 NEURAL ENGINE...',
    'LOADING CHAMPION DATABASE [████░░] 60%',
    'CALIBRATING AI COACHING MODEL...',
    'CONNECTING TO MATCH SERVERS...',
    'LOADING CHAMPION DATABASE [██████] 100%',
    'NEURAL ENGINE ONLINE — READY'
  ];
  let i = 0;
  const step = () => {
    if (i < msgs.length) {
      text.textContent = msgs[i];
      bar.style.width = ((i + 1) / msgs.length * 100) + '%';
      i++;
      setTimeout(step, 350);
    } else {
      setTimeout(() => {
        $('#boot-screen').classList.add('hidden');
        initApp();
      }, 400);
    }
  };
  step();
}

// ═══════════════════════════════════════════════════════════
// PARTICLE BACKGROUND
// ═══════════════════════════════════════════════════════════
function initParticles() {
  const canvas = $('#particles-canvas');
  const ctx = canvas.getContext('2d');
  let w, h;
  const particles = [];
  const COUNT = 50;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? '0,255,65' : '0,229,255'
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.a})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════════════════
// SPA ROUTER
// ═══════════════════════════════════════════════════════════
const ROUTES = {
  home: 'page-home', train: 'page-train', champions: 'page-champions',
  tierlist: 'page-tierlist', coaching: 'page-coaching', tft: 'page-tft',
  coin: 'page-coin', news: 'page-news', community: 'page-community'
};

function navigate(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(ROUTES[page] || 'page-home');
  if (target) target.classList.add('active');

  $$('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });

  window.scrollTo(0, 0);
  // Close mobile nav
  $('#nav-links').classList.remove('open');
}

function initRouter() {
  function onHash() {
    const page = location.hash.replace('#', '') || 'home';
    navigate(page);
  }
  window.addEventListener('hashchange', onHash);
  onHash();

  // Handle all [data-page] clicks
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-page]');
    if (el) {
      e.preventDefault();
      location.hash = '#' + el.dataset.page;
    }
  });
}

// ═══════════════════════════════════════════════════════════
// NAV & AUTH
// ═══════════════════════════════════════════════════════════
function initNav() {
  $('#nav-burger').addEventListener('click', () => {
    $('#nav-links').classList.toggle('open');
  });

  $('#btn-signin').addEventListener('click', () => {
    $('#auth-modal').style.display = 'flex';
  });
  $('#auth-close').addEventListener('click', () => {
    $('#auth-modal').style.display = 'none';
  });
  $('#auth-modal').addEventListener('click', (e) => {
    if (e.target === $('#auth-modal')) $('#auth-modal').style.display = 'none';
  });

  // Auth tabs
  $$('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isRegister = tab.dataset.auth === 'register';
      $$('.register-only').forEach(el => el.style.display = isRegister ? 'block' : 'none');
      const btn = $('#auth-form button[type=submit]');
      btn.textContent = isRegister ? 'CREATE ACCOUNT' : 'SIGN IN';
    });
  });

  $('#auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    $('#auth-modal').style.display = 'none';
    showToast('Welcome to 1V9.AI, summoner!', 'success');
  });
}

// ═══════════════════════════════════════════════════════════
// HERO TERMINAL ANIMATION
// ═══════════════════════════════════════════════════════════
function runHeroTerminal() {
  const body = $('#hero-terminal-body');
  const lines = [
    { text: '$ 1v9 --analyze summoner', cls: 'dim', delay: 500 },
    { text: '> Connecting to neural engine...', cls: 'green', delay: 800 },
    { text: '> Loading match history... [████████] DONE', cls: 'green', delay: 600 },
    { text: '> Analyzing 847 games...', cls: 'green', delay: 700 },
    { text: '', cls: 'dim', delay: 200 },
    { text: '> RESULTS:', cls: 'cyan', delay: 400 },
    { text: '> ─────────────────────────', cls: 'dim', delay: 100 },
    { text: '> Main Role    : MID', cls: 'cyan', delay: 200 },
    { text: '> Best Champ   : Ahri (67% WR)', cls: 'green', delay: 200 },
    { text: '> CS/min       : 7.2 (Top 15%)', cls: 'green', delay: 200 },
    { text: '> Vision Score : Above Average', cls: 'amber', delay: 200 },
    { text: '> Weakness     : Early game deaths', cls: 'red', delay: 200 },
    { text: '', cls: 'dim', delay: 300 },
    { text: '> RECOMMENDATION: Practice "Trading Stance"', cls: 'amber', delay: 400 },
    { text: '> Navigate to TRAINING to enter the arena', cls: 'cyan', delay: 300 },
  ];

  body.innerHTML = '';
  let total = 0;
  lines.forEach(l => {
    total += l.delay;
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'terminal-line ' + l.cls;
      div.textContent = l.text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }, total);
  });
}

// ═══════════════════════════════════════════════════════════
// COUNTER ANIMATION
// ═══════════════════════════════════════════════════════════
function initCounters() {
  const nums = $$('[data-count]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        let current = 0;
        const step = Math.max(1, Math.floor(target / 60));
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = current.toLocaleString();
        }, 16);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  nums.forEach(n => observer.observe(n));
}

// ═══════════════════════════════════════════════════════════
// SCROLL ANIMATIONS
// ═══════════════════════════════════════════════════════════
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  setTimeout(() => {
    $$('.feature-card, .step-card, .token-card, .news-card, .tft-comp-card').forEach(el => {
      el.classList.add('fade-in');
      observer.observe(el);
    });
  }, 100);
}

// ═══════════════════════════════════════════════════════════
// TRAINING PAGE
// ═══════════════════════════════════════════════════════════
function renderTechniques() {
  const grid = $('#technique-grid');
  const tier = STATE.activeTier;
  const filtered = TECHNIQUES.filter(t => t.tier === tier);
  grid.innerHTML = filtered.map(t => {
    const locked = t.tier !== 'beginner' && !STATE.unlockedTechniques.has(t.id) && STATE.userTier !== 'pro';
    const pct = t.bestScore > 0 ? Math.min(100, Math.round(t.bestScore / 5)) : 0;
    return `
      <div class="technique-card ${locked ? 'locked' : ''} ${t.completed ? 'completed' : ''}" data-tech-id="${t.id}">
        <div class="technique-header">
          <span class="technique-icon">${t.icon}</span>
          <span class="technique-name">${t.name}</span>
        </div>
        <div class="technique-desc">${t.description}</div>
        <div class="technique-meta">
          <span class="difficulty">${'★'.repeat(t.tier==='beginner'?1:t.tier==='intermediate'?2:3)}</span>
          <span class="xp-reward">+${t.xpReward} XP</span>
          <span>${t.category.toUpperCase()}</span>
        </div>
        <div class="technique-progress"><div class="technique-progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');

  // Click handlers
  grid.querySelectorAll('.technique-card').forEach(card => {
    card.addEventListener('click', () => {
      const tech = TECHNIQUES.find(t => t.id === card.dataset.techId);
      if (!tech) return;
      const locked = tech.tier !== 'beginner' && !STATE.unlockedTechniques.has(tech.id) && STATE.userTier !== 'pro';
      if (locked) {
        openPaywall(tech);
      } else {
        startArena(tech);
      }
    });
  });
}

function initTrainingTabs() {
  $$('.train-tab[data-tier]').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.train-tab[data-tier]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      STATE.activeTier = tab.dataset.tier;
      renderTechniques();
    });
  });
}

function updateXpDisplay() {
  STATE.level = Math.floor(STATE.xp / STATE.xpPerLevel) + 1;
  const xpInLevel = STATE.xp % STATE.xpPerLevel;
  $('#train-level').textContent = STATE.level;
  $('#xp-current').textContent = xpInLevel;
  $('#xp-max').textContent = STATE.xpPerLevel;
  $('#xp-fill').style.width = (xpInLevel / STATE.xpPerLevel * 100) + '%';
  $('#credits-amount').textContent = STATE.credits;
}

function openPaywall(tech) {
  const modal = $('#paywall-modal');
  modal.style.display = 'flex';
  $('#paywall-cost').textContent = tech.cost;
  $('#paywall-text').textContent = `"${tech.name}" requires ${tech.cost} credits or a Pro subscription.`;
}

function initPaywall() {
  $('#paywall-close').addEventListener('click', () => {
    $('#paywall-modal').style.display = 'none';
  });
  $('#paywall-modal').addEventListener('click', (e) => {
    if (e.target === $('#paywall-modal')) $('#paywall-modal').style.display = 'none';
  });
  $('#paywall-credits-btn').addEventListener('click', () => {
    const cost = parseInt($('#paywall-cost').textContent);
    if (STATE.credits >= cost) {
      STATE.credits -= cost;
      // Find the technique from the paywall context
      const techName = $('#paywall-text').textContent.match(/"([^"]+)"/)?.[1];
      const tech = TECHNIQUES.find(t => t.name === techName);
      if (tech) {
        STATE.unlockedTechniques.add(tech.id);
        showToast(`Unlocked: ${tech.name}!`, 'success');
        startArena(tech);
      }
      $('#paywall-modal').style.display = 'none';
      updateXpDisplay();
      renderTechniques();
    } else {
      showToast('Not enough credits!', 'error');
    }
  });
  $('#paywall-sub-btn').addEventListener('click', () => {
    STATE.userTier = 'pro';
    $('#paywall-modal').style.display = 'none';
    showToast('PRO activated! All techniques unlocked.', 'success');
    renderTechniques();
  });
}

// ═══════════════════════════════════════════════════════════
// TRAINING ARENA ENGINE
// ═══════════════════════════════════════════════════════════
function startArena(tech) {
  STATE.currentTechnique = tech;
  STATE.arenaActive = true;
  STATE.arenaScore = 0;
  STATE.arenaCombo = 0;
  STATE.arenaBestCombo = 0;
  STATE.arenaHits = 0;
  STATE.arenaMisses = 0;
  STATE.arenaTimeLeft = 30;
  STATE.arenaEntities = [];

  const overlay = $('#arena-overlay');
  overlay.classList.add('active');
  $('#arena-technique-name').textContent = tech.name;
  $('#arena-tier').textContent = tech.tier.toUpperCase();
  $('#arena-result').style.display = 'none';
  document.querySelector('.arena-viewport').style.display = 'block';
  document.querySelector('.arena-hud').style.display = 'flex';

  if (tech.category === 'cs') {
    $('#arena-prompt').textContent = 'Click minions when their health bar turns RED to last hit them! Timing is everything.';
    runCSArena();
  } else {
    $('#arena-prompt').textContent = tech.tips[0] + ' — Read each scenario and select the correct answer.';
    runQuizArena(tech);
  }

  updateArenaHud();
  startArenaTimer();
}

function updateArenaHud() {
  $('#arena-score').textContent = STATE.arenaScore;
  $('#arena-combo').textContent = STATE.arenaCombo + 'x';
  const total = STATE.arenaHits + STATE.arenaMisses;
  $('#arena-accuracy').textContent = total > 0 ? Math.round(STATE.arenaHits / total * 100) + '%' : '100%';
  const m = Math.floor(STATE.arenaTimeLeft / 60);
  const s = STATE.arenaTimeLeft % 60;
  $('#arena-timer').textContent = m + ':' + String(s).padStart(2, '0');
}

function startArenaTimer() {
  clearInterval(STATE.arenaTimer);
  STATE.arenaTimer = setInterval(() => {
    STATE.arenaTimeLeft--;
    updateArenaHud();
    if (STATE.arenaTimeLeft <= 0) {
      endArena();
    }
  }, 1000);
}

function endArena() {
  STATE.arenaActive = false;
  clearInterval(STATE.arenaTimer);

  const total = STATE.arenaHits + STATE.arenaMisses;
  const accuracy = total > 0 ? Math.round(STATE.arenaHits / total * 100) : 0;
  let grade, gradeClass;
  if (STATE.arenaScore >= 200) { grade = 'S+'; gradeClass = 'grade-s'; }
  else if (STATE.arenaScore >= 150) { grade = 'S'; gradeClass = 'grade-s'; }
  else if (STATE.arenaScore >= 100) { grade = 'A'; gradeClass = 'grade-a'; }
  else if (STATE.arenaScore >= 60) { grade = 'B'; gradeClass = 'grade-b'; }
  else if (STATE.arenaScore >= 30) { grade = 'C'; gradeClass = 'grade-c'; }
  else { grade = 'D'; gradeClass = 'grade-d'; }

  const xpEarned = Math.round(STATE.currentTechnique.xpReward * (STATE.arenaScore / 100));
  STATE.xp += xpEarned;

  if (STATE.arenaScore > STATE.currentTechnique.bestScore) {
    STATE.currentTechnique.bestScore = STATE.arenaScore;
  }
  if (STATE.arenaScore >= 100) {
    STATE.currentTechnique.completed = true;
  }

  document.querySelector('.arena-viewport').style.display = 'none';
  document.querySelector('.arena-hud').style.display = 'none';

  const result = $('#arena-result');
  result.style.display = 'block';
  const gradeEl = $('#result-grade');
  gradeEl.textContent = grade;
  gradeEl.className = 'result-grade ' + gradeClass;
  $('#result-score').textContent = STATE.arenaScore;
  $('#result-accuracy').textContent = accuracy + '%';
  $('#result-combo').textContent = STATE.arenaBestCombo + 'x';
  $('#result-xp').textContent = '+' + xpEarned + ' XP';

  const tips = STATE.currentTechnique.tips;
  $('#result-tip').textContent = 'TIP: ' + tips[Math.floor(Math.random() * tips.length)];

  updateXpDisplay();
  renderTechniques();
}

function closeArena() {
  STATE.arenaActive = false;
  clearInterval(STATE.arenaTimer);
  $('#arena-overlay').classList.remove('active');
}

function initArenaControls() {
  $('#arena-close').addEventListener('click', closeArena);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && STATE.arenaActive) closeArena();
  });
  $('#retry-btn').addEventListener('click', () => {
    if (STATE.currentTechnique) startArena(STATE.currentTechnique);
  });
  $('#back-to-list-btn').addEventListener('click', closeArena);
}

// ── CS Arena (Last Hitting Game) ──────────────────────────
function runCSArena() {
  const canvas = $('#arena-canvas');
  const ctx = canvas.getContext('2d');
  const W = 800, H = 500;
  canvas.width = W;
  canvas.height = H;

  const minions = [];
  let spawnTimer = 0;
  let animId;

  function spawnMinion() {
    const isCannon = Math.random() < 0.15;
    minions.push({
      x: -30,
      y: 340 + Math.random() * 80,
      w: isCannon ? 36 : 26,
      h: isCannon ? 36 : 26,
      speed: 0.4 + Math.random() * 0.3,
      maxHp: isCannon ? 120 : 60,
      hp: isCannon ? 120 : 60,
      decayRate: isCannon ? 0.6 : 0.8 + Math.random() * 0.4,
      isCannon,
      dead: false,
      deathAnim: 0,
      scored: false,
    });
  }

  function getHpColor(ratio) {
    if (ratio < 0.2) return '#ff3c3c';
    if (ratio < 0.45) return '#ffb000';
    return '#00ff41';
  }

  canvas.onclick = (e) => {
    if (!STATE.arenaActive) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let hit = false;
    for (const m of minions) {
      if (m.dead) continue;
      if (mx >= m.x && mx <= m.x + m.w && my >= m.y && my <= m.y + m.h) {
        const ratio = m.hp / m.maxHp;
        if (ratio < 0.2) {
          // Perfect last hit
          STATE.arenaScore += m.isCannon ? 20 : 10;
          STATE.arenaCombo++;
          STATE.arenaHits++;
          m.dead = true;
          m.deathAnim = 1;
          showFloatingText(ctx, '+' + (m.isCannon ? 20 : 10), m.x, m.y, '#00ff41');
        } else if (ratio < 0.45) {
          // Too early but ok
          STATE.arenaScore += 5;
          STATE.arenaCombo++;
          STATE.arenaHits++;
          m.dead = true;
          m.deathAnim = 1;
          showFloatingText(ctx, '+5', m.x, m.y, '#ffb000');
        } else {
          // Way too early
          STATE.arenaScore = Math.max(0, STATE.arenaScore - 5);
          STATE.arenaCombo = 0;
          STATE.arenaMisses++;
          showFloatingText(ctx, 'TOO EARLY', m.x, m.y, '#ff3c3c');
        }
        if (STATE.arenaCombo > STATE.arenaBestCombo) STATE.arenaBestCombo = STATE.arenaCombo;
        updateArenaHud();
        hit = true;
        break;
      }
    }
    if (!hit) {
      STATE.arenaMisses++;
      STATE.arenaCombo = 0;
      updateArenaHud();
    }
  };

  const floatingTexts = [];
  function showFloatingText(ctx, text, x, y, color) {
    floatingTexts.push({ text, x, y, color, life: 40 });
  }

  function draw() {
    if (!STATE.arenaActive) { cancelAnimationFrame(animId); return; }
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = '#0f1a0f';
    ctx.fillRect(0, 320, W, 180);

    // Lane lines
    ctx.strokeStyle = 'rgba(0,255,65,0.08)';
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(0, 320);
    ctx.lineTo(W, 320);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tower
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(720, 280, 50, 120);
    ctx.fillStyle = '#00ff41';
    ctx.font = '10px monospace';
    ctx.fillText('TOWER', 724, 346);

    // Spawn minions
    spawnTimer++;
    if (spawnTimer % 60 === 0) spawnMinion();

    // Update & draw minions
    for (let i = minions.length - 1; i >= 0; i--) {
      const m = minions[i];
      if (m.dead) {
        m.deathAnim -= 0.05;
        if (m.deathAnim <= 0) { minions.splice(i, 1); continue; }
        ctx.globalAlpha = m.deathAnim;
        ctx.fillStyle = '#00ff41';
        ctx.fillRect(m.x, m.y, m.w, m.h);
        ctx.globalAlpha = 1;
        continue;
      }

      m.x += m.speed;
      m.hp -= m.decayRate * 0.1;

      if (m.hp <= 0 && !m.scored) {
        m.dead = true;
        m.deathAnim = 1;
        m.scored = true;
        STATE.arenaMisses++;
        STATE.arenaCombo = 0;
        showFloatingText(ctx, 'MISSED', m.x, m.y, '#ff3c3c');
        updateArenaHud();
        continue;
      }

      if (m.x > W + 50) { minions.splice(i, 1); continue; }

      // Minion body
      const color = m.isCannon ? '#aa44ff' : '#cc6600';
      ctx.fillStyle = color;
      ctx.fillRect(m.x, m.y, m.w, m.h);

      // HP bar
      const hpRatio = m.hp / m.maxHp;
      const barW = m.w + 4;
      ctx.fillStyle = '#333';
      ctx.fillRect(m.x - 2, m.y - 10, barW, 6);
      ctx.fillStyle = getHpColor(hpRatio);
      ctx.fillRect(m.x - 2, m.y - 10, barW * Math.max(0, hpRatio), 6);

      // Last hit zone indicator
      if (hpRatio < 0.2) {
        ctx.strokeStyle = '#ff3c3c';
        ctx.lineWidth = 2;
        ctx.strokeRect(m.x - 2, m.y - 2, m.w + 4, m.h + 4);
        ctx.lineWidth = 1;
      }
    }

    // Floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 1;
      ft.life--;
      ctx.globalAlpha = ft.life / 40;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px monospace';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.globalAlpha = 1;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // HUD on canvas
    ctx.fillStyle = '#00ff41';
    ctx.font = '11px monospace';
    ctx.fillText('LAST HIT when health bar is RED for max points', 10, 20);
    ctx.fillStyle = '#ffb000';
    ctx.fillText('CANNON minions (purple) = 2x points', 10, 36);

    animId = requestAnimationFrame(draw);
  }

  spawnMinion();
  spawnMinion();
  draw();
}

// ── Quiz Arena (for non-CS techniques) ────────────────────
function runQuizArena(tech) {
  const canvas = $('#arena-canvas');
  const ctx = canvas.getContext('2d');
  const W = 800, H = 500;
  canvas.width = W;
  canvas.height = H;

  const scenarios = generateScenarios(tech);
  let currentQ = 0;
  let answered = false;
  let feedback = '';
  let feedbackColor = '';

  function generateScenarios(tech) {
    const base = [
      { q: `In ${tech.name}, what is the FIRST thing you should do?`, options: [tech.tips[0] || 'Assess the situation', 'All-in immediately', 'Recall to base'], correct: 0 },
      { q: 'Your opponent just used their main ability. What do you do?', options: ['Wait for yours to come off cooldown', 'Trade aggressively while they are on cooldown', 'Run away'], correct: 1 },
      { q: 'You see 3 enemies missing from the map. Best action?', options: ['Push up further for plates', 'Play safe near your tower and ward', 'Try to solo dragon'], correct: 1 },
      { q: 'Your wave is pushing toward enemy tower. You should:', options: ['Hard push and crash it to roam or back', 'Let it freeze in the middle', 'Ignore it and fight'], correct: 0 },
      { q: 'Best time to ward river?', options: ['When minions first clash', 'Before 3:00 for first gank', 'After you die once'], correct: 1 },
      { q: 'Enemy jungler ganks your lane. Best response?', options: ['Fight them both', 'Walk toward your tower calmly', 'Flash forward aggressively'], correct: 1 },
      { q: 'You just got a kill bot lane. Priority?', options: ['Recall immediately', 'Push wave then take dragon', 'Chase enemy into fog of war'], correct: 1 },
      { q: 'Teamfight is about to start. As an ADC, you should:', options: ['Flash forward to engage', 'Stay at max range and attack closest target', 'Split push a side lane'], correct: 1 },
    ];
    // Shuffle and return 6
    return base.sort(() => Math.random() - 0.5).slice(0, 6);
  }

  function drawQuiz() {
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, W, H);

    if (currentQ >= scenarios.length) {
      endArena();
      return;
    }

    const sc = scenarios[currentQ];

    // Question number
    ctx.fillStyle = '#555';
    ctx.font = '12px monospace';
    ctx.fillText(`QUESTION ${currentQ + 1} / ${scenarios.length}`, 20, 30);

    // Question
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 16px monospace';
    wrapText(ctx, sc.q, 40, 70, W - 80, 22);

    // Options
    const optionY = [180, 260, 340];
    sc.options.forEach((opt, i) => {
      const y = optionY[i];
      const isCorrect = i === sc.correct;
      let bg = 'rgba(0,255,65,0.05)';
      let border = 'rgba(0,255,65,0.2)';
      let textCol = '#e0e0e0';

      if (answered) {
        if (isCorrect) { bg = 'rgba(0,255,65,0.15)'; border = '#00ff41'; textCol = '#00ff41'; }
        else { bg = 'rgba(255,60,60,0.08)'; border = 'rgba(255,60,60,0.3)'; textCol = '#666'; }
      }

      ctx.fillStyle = bg;
      ctx.fillRect(40, y, W - 80, 55);
      ctx.strokeStyle = border;
      ctx.strokeRect(40, y, W - 80, 55);

      ctx.fillStyle = textCol;
      ctx.font = '14px monospace';
      ctx.fillText(`${String.fromCharCode(65 + i)}) ${opt}`, 60, y + 33);
    });

    // Feedback
    if (feedback) {
      ctx.fillStyle = feedbackColor;
      ctx.font = 'bold 18px monospace';
      ctx.fillText(feedback, 40, 440);
    }
  }

  function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, x, y);
        line = word + ' ';
        y += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, y);
  }

  canvas.onclick = (e) => {
    if (!STATE.arenaActive) return;
    if (currentQ >= scenarios.length) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const optionY = [180, 260, 340];

    if (!answered) {
      for (let i = 0; i < 3; i++) {
        if (mx >= 40 && mx <= W - 40 && my >= optionY[i] && my <= optionY[i] + 55) {
          answered = true;
          const sc = scenarios[currentQ];
          if (i === sc.correct) {
            STATE.arenaScore += 30;
            STATE.arenaCombo++;
            STATE.arenaHits++;
            feedback = '✓ CORRECT! +30';
            feedbackColor = '#00ff41';
          } else {
            STATE.arenaScore = Math.max(0, STATE.arenaScore - 10);
            STATE.arenaCombo = 0;
            STATE.arenaMisses++;
            feedback = '✗ WRONG — Answer: ' + String.fromCharCode(65 + sc.correct);
            feedbackColor = '#ff3c3c';
          }
          if (STATE.arenaCombo > STATE.arenaBestCombo) STATE.arenaBestCombo = STATE.arenaCombo;
          updateArenaHud();
          drawQuiz();

          setTimeout(() => {
            answered = false;
            feedback = '';
            currentQ++;
            if (currentQ >= scenarios.length) endArena();
            else drawQuiz();
          }, 1200);
          break;
        }
      }
    }
  };

  drawQuiz();
}

// ═══════════════════════════════════════════════════════════
// CHAMPIONS PAGE
// ═══════════════════════════════════════════════════════════
function renderChampions() {
  const grid = $('#champ-grid');
  const search = ($('#champ-search')?.value || '').toLowerCase();
  const role = STATE.activeRole;
  const filtered = CHAMPIONS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search)) return false;
    if (role !== 'all' && !c.roles.includes(role)) return false;
    return true;
  });
  grid.innerHTML = filtered.map(c => {
    const wr = parseFloat(c.winRate);
    const wrClass = wr >= 51 ? 'wr-high' : wr >= 49 ? 'wr-mid' : 'wr-low';
    return `<div class="champ-card" data-champ="${c.name}">
      <div class="champ-avatar">${c.icon}</div>
      <div class="champ-card-name">${c.name.toUpperCase()}</div>
      <div class="champ-card-role">${c.roles.map(r=>r.toUpperCase()).join(' / ')}</div>
      <div class="champ-card-wr ${wrClass}">${c.winRate} WR</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.champ-card').forEach(card => {
    card.addEventListener('click', () => openChampModal(card.dataset.champ));
  });
}

function openChampModal(name) {
  const c = CHAMPIONS.find(ch => ch.name === name);
  if (!c) return;
  const modal = $('#champ-modal');
  modal.style.display = 'flex';
  $('#champ-modal-content').innerHTML = `
    <button class="champ-close-btn" id="champ-close-x">✕</button>
    <div class="champ-detail-header">
      <div class="champ-detail-avatar">${c.icon}</div>
      <div class="champ-detail-info">
        <h2>${c.name.toUpperCase()}</h2>
        <p>${c.roles.map(r=>r.toUpperCase()).join(' / ')} — Tier ${c.tier} — Difficulty ${'★'.repeat(c.difficulty)}</p>
      </div>
    </div>
    <div class="champ-detail-stats">
      <div class="champ-stat-box"><div class="champ-stat-label">WIN RATE</div><div class="champ-stat-val">${c.winRate}</div></div>
      <div class="champ-stat-box"><div class="champ-stat-label">PICK RATE</div><div class="champ-stat-val">${c.pickRate}</div></div>
      <div class="champ-stat-box"><div class="champ-stat-label">BAN RATE</div><div class="champ-stat-val">${c.banRate}</div></div>
    </div>
    <div class="champ-build-section">
      <h3>CORE BUILD</h3>
      <div class="build-items">${c.coreItems.map(i=>`<span class="build-item">${i}</span>`).join('')}</div>
      <h3>COUNTERS</h3>
      <div class="build-items">${c.counters.map(i=>`<span class="build-item" style="border-color:rgba(255,60,60,0.3)">${i}</span>`).join('')}</div>
      <h3>SYNERGIES</h3>
      <div class="build-items">${c.synergies.map(i=>`<span class="build-item" style="border-color:rgba(0,229,255,0.3)">${i}</span>`).join('')}</div>
      <h3>PRO TIP</h3>
      <p style="color:var(--amber);font-size:14px;margin-top:8px">${c.tips}</p>
    </div>`;
  $('#champ-close-x').addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; }, { once: true });
}

function initChampFilters() {
  $('#champ-search').addEventListener('input', renderChampions);
  $$('#role-filters .role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#role-filters .role-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.activeRole = btn.dataset.role;
      renderChampions();
    });
  });
}

// ═══════════════════════════════════════════════════════════
// TIER LIST PAGE
// ═══════════════════════════════════════════════════════════
function renderTierList() {
  const list = $('#tier-list');
  const role = STATE.activeRole;
  const tiers = ['S', 'A', 'B', 'C', 'D'];
  const tierClasses = { S: 'tier-s', A: 'tier-a', B: 'tier-b', C: 'tier-c', D: 'tier-d' };

  list.innerHTML = tiers.map(tier => {
    let champs = TIER_LIST[tier] || [];
    if (role !== 'all') {
      champs = champs.filter(name => {
        const c = CHAMPIONS.find(ch => ch.name === name);
        return c && c.roles.includes(role);
      });
    }
    if (champs.length === 0 && tier === 'D') return '';
    return `<div class="tier-row">
      <div class="tier-label ${tierClasses[tier]}">${tier}</div>
      <div class="tier-champs">${champs.map(name => {
        const c = CHAMPIONS.find(ch => ch.name === name);
        const icon = c ? c.icon : '?';
        return `<div class="tier-champ" data-champ="${name}"><span class="tier-champ-icon">${icon}</span>${name}</div>`;
      }).join('')}${champs.length===0?'<span style="color:var(--dim);font-size:12px">No champions in this tier</span>':''}</div>
    </div>`;
  }).join('');

  list.querySelectorAll('.tier-champ').forEach(el => {
    el.addEventListener('click', () => openChampModal(el.dataset.champ));
  });
}

function initTierFilters() {
  $$('#tier-role-filters .role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#tier-role-filters .role-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.activeRole = btn.dataset.role;
      renderTierList();
      renderChampions();
    });
  });
}

// ═══════════════════════════════════════════════════════════
// AI COACHING CHAT
// ═══════════════════════════════════════════════════════════
function initChat() {
  const send = () => {
    const input = $('#chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    appendChat(msg, 'user');

    // Typing indicator
    const typing = appendChat('...', 'bot');

    setTimeout(() => {
      typing.remove();
      const response = getAIResponse(msg);
      appendChat(response, 'bot');
    }, 800 + Math.random() * 600);
  };

  $('#chat-send').addEventListener('click', send);
  $('#chat-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
}

function appendChat(text, who) {
  const container = $('#chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + who;
  div.innerHTML = `<div class="chat-avatar">${who === 'bot' ? '🧠' : '👤'}</div><div class="chat-bubble">${text}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function getAIResponse(msg) {
  const lower = msg.toLowerCase();
  const keys = Object.keys(AI_RESPONSES);
  for (const key of keys) {
    if (key !== 'default' && lower.includes(key)) return AI_RESPONSES[key];
  }
  // Check for champion names
  const champ = CHAMPIONS.find(c => lower.includes(c.name.toLowerCase()));
  if (champ) return `${champ.name} (${champ.roles.join('/')}) — Tier ${champ.tier} with ${champ.winRate} win rate. ${champ.tips} Core build: ${champ.coreItems.join(' → ')}. Countered by: ${champ.counters.join(', ')}.`;
  return AI_RESPONSES.default;
}

// ═══════════════════════════════════════════════════════════
// REPLAY ANALYSIS
// ═══════════════════════════════════════════════════════════
function initReplayAnalysis() {
  $('#analyze-replay-btn').addEventListener('click', () => {
    const url = $('#replay-url').value.trim();
    if (!url) { showToast('Paste a match URL or ID first', 'warning'); return; }

    $('#analyze-replay-btn').textContent = 'ANALYZING...';
    setTimeout(() => {
      $('#analyze-replay-btn').textContent = 'ANALYZE';
      $('#replay-results').style.display = 'block';
      $('#analysis-cards').innerHTML = `
        <div class="analysis-card"><h5>CS EFFICIENCY</h5><p>7.2 CS/min — Top 15%. Missed 12 cannon minions. Focus on cannon last-hits under tower.</p></div>
        <div class="analysis-card"><h5>VISION SCORE</h5><p>42 — Above average. Good ward placement in river. Consider sweeping dragon pit more before objectives.</p></div>
        <div class="analysis-card"><h5>DEATH ANALYSIS</h5><p>3 deaths were avoidable. 2 were overextending without vision. 1 was a bad dive attempt.</p></div>
        <div class="analysis-card"><h5>DAMAGE OUTPUT</h5><p>Top 2 on team. Good damage timing in fights. Could improve by poking more before all-ins.</p></div>
        <div class="analysis-card"><h5>OBJECTIVE CONTROL</h5><p>Participated in 3/4 dragons. Missed herald contest. Improve timer tracking.</p></div>
        <div class="analysis-card"><h5>AI RECOMMENDATION</h5><p>Your biggest improvement area is wave management. Practice "Wave Freezing" and "Slow Push Setup" in the Training Arena.</p></div>`;
      showToast('Replay analysis complete!', 'success');
    }, 2000);
  });
}

// ═══════════════════════════════════════════════════════════
// TFT PAGE
// ═══════════════════════════════════════════════════════════
function renderTft() {
  const content = $('#tft-content');
  const tab = STATE.activeTftTab;

  if (tab === 'comps') {
    content.innerHTML = TFT_COMPS.map(c => {
      const tierClass = c.tier === 'S' ? 'tft-tier-s' : c.tier === 'A' ? 'tft-tier-a' : 'tft-tier-b';
      return `<div class="tft-comp-card fade-in visible">
        <div class="tft-comp-header">
          <span class="tft-comp-name">${c.name}</span>
          <span class="tft-comp-tier ${tierClass}">TIER ${c.tier}</span>
        </div>
        <div class="tft-units">${c.units.map(u => `<span class="tft-unit">${u}</span>`).join('')}</div>
        <div class="tft-comp-desc" style="margin-bottom:8px">${c.description}</div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--amber)">${c.items}</div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--dim);margin-top:6px">Avg Placement: ${c.winRate}</div>
      </div>`;
    }).join('');
  } else if (tab === 'items') {
    content.innerHTML = `<div class="tft-comp-card"><div class="tft-comp-header"><span class="tft-comp-name">ITEM CHEAT SHEET</span></div>
      <div style="color:var(--dim);padding:16px 0">
        <p><strong style="color:var(--cyan)">AD CARRY:</strong> IE + LW + BT — Standard crit carry</p>
        <p><strong style="color:var(--cyan)">AP CARRY:</strong> JG + Rabadons + Gunblade — Burst mage</p>
        <p><strong style="color:var(--cyan)">TANK:</strong> Warmogs + Gargoyle + Redemption — Frontline</p>
        <p><strong style="color:var(--cyan)">UTILITY:</strong> Zephyr + Shroud + Chalice — Support items</p>
        <p style="margin-top:12px;color:var(--amber)">TIP: Slam early items for winstreak. Don't hold components past stage 2.</p>
      </div></div>`;
  } else if (tab === 'augments') {
    content.innerHTML = `<div class="tft-comp-card"><div class="tft-comp-header"><span class="tft-comp-name">TOP AUGMENTS THIS PATCH</span></div>
      <div style="color:var(--dim);padding:16px 0">
        <p>🥇 <strong style="color:var(--gold)">Jeweled Lotus</strong> — Abilities can crit. S-tier on any AP comp.</p>
        <p>🥈 <strong style="color:#c0c0c0">Cybernetic Uplink</strong> — Health and mana regen. Universally good.</p>
        <p>🥉 <strong style="color:#cd7f32">Celestial Blessing</strong> — Omnivamp for team. Great for sustain comps.</p>
        <p>4. <strong style="color:var(--cyan)">Trade Sector</strong> — Free rerolls. Economy augment for reroll comps.</p>
        <p>5. <strong style="color:var(--cyan)">Metabolic Accelerator</strong> — Extra HP per round. Winstreak enabler.</p>
      </div></div>`;
  } else {
    content.innerHTML = `<div class="tft-comp-card"><div class="tft-comp-header"><span class="tft-comp-name">TEAM BUILDER</span><span class="pro-badge">COMING SOON</span></div>
      <div style="color:var(--dim);padding:40px;text-align:center">
        <p style="font-size:32px;margin-bottom:16px">🔨</p>
        <p>Drag-and-drop team builder with AI optimization coming in the next update.</p>
        <p style="margin-top:8px;color:var(--cyan)">Get notified: subscribe to our newsletter</p>
      </div></div>`;
  }
}

function initTftTabs() {
  $$('.tft-tabs .train-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tft-tabs .train-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      STATE.activeTftTab = tab.dataset.tft;
      renderTft();
    });
  });
}

// ═══════════════════════════════════════════════════════════
// $1V9 COIN TICKER
// ═══════════════════════════════════════════════════════════
function initCoinTicker() {
  setInterval(() => {
    const change = (Math.random() - 0.48) * 0.0003;
    STATE.coinPrice = Math.max(0.001, STATE.coinPrice + change);
    $('#coin-price').textContent = '$' + STATE.coinPrice.toFixed(5);
    const pct = ((STATE.coinPrice - 0.00847) / 0.00847 * 100).toFixed(1);
    const delta = $('#coin-delta');
    if (pct >= 0) {
      delta.textContent = `▲ ${pct}% (24h)`;
      delta.className = 'coin-delta positive';
    } else {
      delta.textContent = `▼ ${Math.abs(pct)}% (24h)`;
      delta.className = 'coin-delta negative';
    }
  }, 2000);

  $('#connect-wallet').addEventListener('click', () => {
    showToast('Wallet connection simulated — $1V9 tokens loaded!', 'info');
  });
}

// ═══════════════════════════════════════════════════════════
// NEWS PAGE
// ═══════════════════════════════════════════════════════════
function renderNews() {
  $('#news-grid').innerHTML = NEWS_ITEMS.map(n => `
    <div class="news-card">
      <span class="news-tag ${n.tag}">${n.tag.toUpperCase()}</span>
      <h3>${n.title}</h3>
      <p>${n.excerpt}</p>
      <span class="news-date">${n.date}</span>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
// COMMUNITY PAGE
// ═══════════════════════════════════════════════════════════
function renderCommunity() {
  const content = $('#community-content');
  const tab = STATE.activeCommTab;

  if (tab === 'leaderboard') {
    content.innerHTML = `<table class="leaderboard-table">
      <tr><th>RANK</th><th>PLAYER</th><th>SCORE</th><th>LEVEL</th><th>TITLE</th></tr>
      ${LEADERBOARD.map(p => `<tr>
        <td><span class="lb-rank lb-rank-${p.rank<=3?p.rank:''}">#${p.rank}</span></td>
        <td class="lb-name">${p.name}</td>
        <td class="lb-score">${p.score.toLocaleString()}</td>
        <td>${p.level}</td>
        <td>${p.title}</td>
      </tr>`).join('')}
    </table>`;
  } else if (tab === 'clips') {
    content.innerHTML = `<div class="clip-grid">${CLIPS.map(c => `
      <div class="clip-card">
        <div class="clip-thumb">${c.icon}<div class="clip-play">▶</div></div>
        <div class="clip-info">
          <h4>${c.title}</h4>
          <p>${c.description}</p>
          <div class="clip-meta"><span>👤 ${c.author}</span><span>👁 ${c.views}</span><span>❤ ${c.likes}</span></div>
        </div>
      </div>`).join('')}</div>`;
  } else {
    content.innerHTML = DISCUSSIONS.map(d => `
      <div class="discussion-card">
        <h4>${d.title}</h4>
        <p>${d.preview}</p>
        <div class="discussion-meta"><span>👤 ${d.author}</span><span>💬 ${d.replies} replies</span><span>👁 ${d.views}</span></div>
      </div>`).join('');
  }
}

function initCommunityTabs() {
  $$('.community-tabs .train-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.community-tabs .train-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      STATE.activeCommTab = tab.dataset.comm;
      renderCommunity();
    });
  });
}

// ═══════════════════════════════════════════════════════════
// REFERRAL
// ═══════════════════════════════════════════════════════════
function initReferral() {
  const btn = $('#copy-referral');
  if (btn) {
    btn.addEventListener('click', () => {
      const input = $('#referral-link');
      navigator.clipboard.writeText(input.value).then(() => {
        showToast('Referral link copied!', 'success');
        btn.textContent = 'COPIED!';
        setTimeout(() => btn.textContent = 'COPY', 2000);
      }).catch(() => {
        input.select();
        showToast('Select and copy the link manually', 'info');
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
function initApp() {
  initParticles();
  initRouter();
  initNav();
  initCounters();

  // Training
  renderTechniques();
  initTrainingTabs();
  initArenaControls();
  initPaywall();
  updateXpDisplay();

  // Champions
  renderChampions();
  initChampFilters();

  // Tier List
  renderTierList();
  initTierFilters();

  // Coaching
  initChat();
  initReplayAnalysis();

  // TFT
  renderTft();
  initTftTabs();

  // Coin
  initCoinTicker();

  // News
  renderNews();

  // Community
  renderCommunity();
  initCommunityTabs();

  // Referral
  initReferral();

  // Hero terminal
  setTimeout(runHeroTerminal, 500);

  // Scroll animations
  initScrollAnimations();
}

// ── Launch ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', runBoot);
