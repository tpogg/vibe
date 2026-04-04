import { Renderer, T, gridLayout, parseFontSize } from './engine.js';
import type { Technique } from './data.js';

// State
let activeTier: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
let xp = 150;
let level = 1;
let credits = 100;

// Arena state
let arenaActive = false;
let arenaTech: Technique | null = null;
let arenaScore = 0;
let arenaCombo = 0;
let arenaBestCombo = 0;
let arenaHits = 0;
let arenaMisses = 0;
let arenaTimeLeft = 30;
let arenaTimer: number | null = null;
let arenaMinions: Minion[] = [];
let arenaSpawnTimer = 0;
let arenaFloats: FloatText[] = [];
let arenaEnded = false;

type Minion = {
  x: number; y: number; w: number; h: number; speed: number;
  maxHp: number; hp: number; decay: number; isCannon: boolean;
  dead: boolean; deathAnim: number;
};

type FloatText = { text: string; x: number; y: number; color: string; life: number; };

export function renderTraining(r: Renderer, startY: number): number {
  if (arenaActive) return renderArena(r, startY);

  let y = startY + 40;
  const pad = Math.max(24, (r.W - 1200) / 2);
  const contentW = Math.min(1200, r.W - 48);

  // Title
  y += r.drawGlitchText('TRAINING ARENA', y, T.displayLg, T.green);
  y += 4;
  y += r.drawTextCentered('Master League of Legends techniques through interactive practice', y, T.monoSm, T.dim);
  y += 24;

  // XP Bar
  level = Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  r.drawTextCentered(`TRAINING LEVEL: ${level}`, y, T.monoSm, T.amber);
  y += 20;
  const barW = Math.min(400, contentW);
  const barX = (r.W - barW) / 2;
  r.drawProgressBar(barX, y, barW, 6, xpInLevel / 1000, T.green, T.surface2);
  y += 12;
  r.drawTextCentered(`${xpInLevel} / 1000 XP`, y, T.monoXs, T.dim);
  y += 32;

  // Tier tabs
  const tiers: Array<{ id: 'beginner' | 'intermediate' | 'advanced'; label: string; badge: string; badgeColor: string }> = [
    { id: 'beginner', label: '🟢 BEGINNER', badge: 'FREE', badgeColor: T.green },
    { id: 'intermediate', label: '🟡 INTERMEDIATE', badge: '25 CR', badgeColor: T.amber },
    { id: 'advanced', label: '🔴 ADVANCED', badge: 'PRO', badgeColor: T.cyan },
  ];

  const tabW = 180;
  const tabX = (r.W - tabW * 3 - 16) / 2;
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const tx = tabX + i * (tabW + 8);
    const active = activeTier === t.id;
    const hovered = r.hoveredId === 'tier_' + t.id;

    r.drawRect(tx, y, tabW, 36, active ? T.surface : hovered ? T.surface : 'transparent', active ? T.green : T.border);

    const ctx = r.ctx;
    const sy = y - r.scrollY;
    if (sy > -40 && sy < r.H + 40) {
      ctx.font = T.monoSm;
      ctx.fillStyle = active ? T.green : T.dim;
      ctx.fillText(t.label, tx + 12, sy + 23);
      // Badge
      ctx.font = T.monoXs;
      const bm = ctx.measureText(t.badge);
      ctx.fillStyle = t.badgeColor + '25';
      ctx.fillRect(tx + tabW - bm.width - 20, sy + 8, bm.width + 12, 18);
      ctx.fillStyle = t.badgeColor;
      ctx.fillText(t.badge, tx + tabW - bm.width - 14, sy + 22);
    }

    r.hitRegions.push({
      x: tx, y, w: tabW, h: 36, id: 'tier_' + t.id, cursor: 'pointer',
      onClick: () => { activeTier = t.id; }
    });
  }
  y += 52;

  // Technique cards
  const techniques = (globalThis.TECHNIQUES || []).filter((t: Technique) => t.tier === activeTier);
  const cols = r.W > 900 ? 3 : r.W > 600 ? 2 : 1;
  const g = gridLayout(contentW, cols, 14, 0);

  for (let i = 0; i < techniques.length; i++) {
    const t = techniques[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = pad + g.getX(col);
    const cardH = 150;
    const cy = y + row * (cardH + 14);
    const locked = t.tier !== 'beginner';
    const hovered = r.hoveredId === 'tech_' + t.id;

    r.drawPanel(cx, cy, g.colW, cardH, hovered ? { borderColor: T.border2 } : undefined);

    if (locked) {
      r.ctx.globalAlpha = 0.5;
    }

    let ty = cy + 16;
    r.drawText(t.icon + '  ' + t.name, cx + 16, ty, T.displaySm, T.green);
    ty += 28;
    ty += r.drawWrappedText(t.description, cx + 16, ty, g.colW - 32, T.bodySm, T.dim);
    ty += 8;

    // Meta
    const stars = t.tier === 'beginner' ? '★' : t.tier === 'intermediate' ? '★★' : '★★★';
    r.drawText(stars, cx + 16, ty, T.monoXs, T.amber);
    r.drawText('+' + t.xpReward + ' XP', cx + 80, ty, T.monoXs, T.cyan);
    r.drawText(t.category.toUpperCase(), cx + 160, ty, T.monoXs, T.dim);
    ty += 16;

    // Progress bar
    const pct = t.bestScore > 0 ? Math.min(1, t.bestScore / 200) : 0;
    r.drawProgressBar(cx + 16, ty, g.colW - 32, 3, pct, T.green);

    if (locked) {
      r.ctx.globalAlpha = 1;
      r.drawText('🔒', cx + g.colW - 30, cy + 12, '16px serif', T.white);
    }
    if (t.completed) {
      r.drawText('✓', cx + g.colW - 26, cy + 14, 'bold 16px monospace', T.green);
    }

    r.hitRegions.push({
      x: cx, y: cy, w: g.colW, h: cardH, id: 'tech_' + t.id, cursor: 'pointer',
      onClick: () => {
        if (locked) return; // Would show paywall
        startArena(t);
      }
    });
  }

  const techRows = Math.ceil(techniques.length / cols);
  y += techRows * 164 + 60;

  return y;
}

// ── Arena ─────────────────────────────────────────────────
function startArena(tech: Technique) {
  arenaTech = tech;
  arenaActive = true;
  arenaScore = 0;
  arenaCombo = 0;
  arenaBestCombo = 0;
  arenaHits = 0;
  arenaMisses = 0;
  arenaTimeLeft = 30;
  arenaMinions = [];
  arenaSpawnTimer = 0;
  arenaFloats = [];
  arenaEnded = false;

  if (arenaTimer) clearInterval(arenaTimer);
  arenaTimer = window.setInterval(() => {
    arenaTimeLeft--;
    if (arenaTimeLeft <= 0) {
      arenaEnded = true;
      if (arenaTimer) clearInterval(arenaTimer);
    }
  }, 1000);

  // Spawn initial minions
  spawnMinion();
  spawnMinion();
}

function spawnMinion() {
  const isCannon = Math.random() < 0.15;
  arenaMinions.push({
    x: -30,
    y: 200 + Math.random() * 100,
    w: isCannon ? 34 : 24,
    h: isCannon ? 34 : 24,
    speed: 0.4 + Math.random() * 0.3,
    maxHp: isCannon ? 120 : 60,
    hp: isCannon ? 120 : 60,
    decay: isCannon ? 0.6 : 0.8 + Math.random() * 0.4,
    isCannon,
    dead: false,
    deathAnim: 0,
  });
}

function renderArena(r: Renderer, startY: number): number {
  const ctx = r.ctx;
  const aW = Math.min(800, r.W - 48);
  const aH = 340;
  const aX = (r.W - aW) / 2;
  let y = 60;

  // Header
  r.drawText(arenaTech?.icon + ' ' + (arenaTech?.name || ''), aX, y, T.displaySm, T.green);
  r.drawButton('✕ EXIT', aX + aW - 80, y - 4, 80, 30, 'arena_exit');
  r.hitRegions[r.hitRegions.length - 1].onClick = () => {
    arenaActive = false;
    if (arenaTimer) clearInterval(arenaTimer);
  };
  y += 36;

  // Prompt
  r.drawRect(aX, y, aW, 32, T.surface, T.border);
  r.drawRect(aX, y, 3, 32, T.cyan);
  r.drawText('Click minions when HP bar turns RED to last hit!', aX + 12, y + 4, T.monoSm, T.cyan);
  y += 44;

  if (arenaEnded) {
    return renderArenaResult(r, y, aX, aW);
  }

  // Arena viewport
  r.drawRect(aX, y, aW, aH, '#0a0a10', T.border);
  const avSy = y;

  // Ground
  r.drawRect(aX, y + 180, aW, aH - 180, '#0f1a0f');

  // Tower
  r.drawRect(aX + aW - 60, y + 140, 45, 120, '#1a2a1a');
  ctx.font = T.monoXs;
  ctx.fillStyle = T.dimGreen;
  ctx.fillText('TOWER', aX + aW - 56, y + 206);

  // Spawn
  arenaSpawnTimer++;
  if (arenaSpawnTimer % 50 === 0) spawnMinion();

  // Update & draw minions
  for (let i = arenaMinions.length - 1; i >= 0; i--) {
    const m = arenaMinions[i];
    if (m.dead) {
      m.deathAnim -= 0.05;
      if (m.deathAnim <= 0) { arenaMinions.splice(i, 1); continue; }
      ctx.globalAlpha = m.deathAnim;
      ctx.fillStyle = T.green;
      ctx.fillRect(aX + m.x, avSy + m.y, m.w, m.h);
      ctx.globalAlpha = 1;
      continue;
    }

    m.x += m.speed;
    m.hp -= m.decay * 0.1;

    if (m.hp <= 0) {
      m.dead = true;
      m.deathAnim = 1;
      arenaMisses++;
      arenaCombo = 0;
      arenaFloats.push({ text: 'MISSED', x: m.x, y: m.y - 10, color: T.red, life: 40 });
      continue;
    }
    if (m.x > aW + 50) { arenaMinions.splice(i, 1); continue; }

    // Draw minion
    ctx.fillStyle = m.isCannon ? T.purple : '#cc6600';
    ctx.fillRect(aX + m.x, avSy + m.y, m.w, m.h);

    // HP bar
    const hpR = m.hp / m.maxHp;
    const bw = m.w + 4;
    ctx.fillStyle = '#333';
    ctx.fillRect(aX + m.x - 2, avSy + m.y - 10, bw, 6);
    ctx.fillStyle = hpR < 0.2 ? T.red : hpR < 0.45 ? T.amber : T.green;
    ctx.fillRect(aX + m.x - 2, avSy + m.y - 10, bw * Math.max(0, hpR), 6);

    // Red outline when in last-hit zone
    if (hpR < 0.2) {
      ctx.strokeStyle = T.red;
      ctx.lineWidth = 2;
      ctx.strokeRect(aX + m.x - 2, avSy + m.y - 2, m.w + 4, m.h + 4);
      ctx.lineWidth = 1;
    }
  }

  // Floating text
  for (let i = arenaFloats.length - 1; i >= 0; i--) {
    const ft = arenaFloats[i];
    ft.y -= 1;
    ft.life--;
    ctx.globalAlpha = ft.life / 40;
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, aX + ft.x, avSy + ft.y);
    ctx.globalAlpha = 1;
    if (ft.life <= 0) arenaFloats.splice(i, 1);
  }

  // HUD text
  ctx.font = T.monoXs;
  ctx.fillStyle = T.dimGreen;
  ctx.fillText('LAST HIT when health bar is RED for max points', aX + 8, avSy + 16);
  ctx.fillStyle = T.amber;
  ctx.fillText('CANNON minions (purple) = 2x points', aX + 8, avSy + 30);

  // Click handler for arena
  r.hitRegions.push({
    x: aX, y: avSy, w: aW, h: aH, id: 'arena_viewport', cursor: 'crosshair',
    onClick: () => {
      const mx = r.mouseX - aX;
      const my = r.mouseY - avSy;
      let hit = false;
      for (const m of arenaMinions) {
        if (m.dead) continue;
        if (mx >= m.x && mx <= m.x + m.w && my >= m.y && my <= m.y + m.h) {
          const hpR = m.hp / m.maxHp;
          if (hpR < 0.2) {
            arenaScore += m.isCannon ? 20 : 10;
            arenaCombo++;
            arenaHits++;
            arenaFloats.push({ text: '+' + (m.isCannon ? 20 : 10), x: m.x, y: m.y - 10, color: T.green, life: 40 });
          } else if (hpR < 0.45) {
            arenaScore += 5;
            arenaCombo++;
            arenaHits++;
            arenaFloats.push({ text: '+5', x: m.x, y: m.y - 10, color: T.amber, life: 40 });
          } else {
            arenaScore = Math.max(0, arenaScore - 5);
            arenaCombo = 0;
            arenaMisses++;
            arenaFloats.push({ text: 'TOO EARLY', x: m.x, y: m.y - 10, color: T.red, life: 40 });
          }
          m.dead = true;
          m.deathAnim = 1;
          if (arenaCombo > arenaBestCombo) arenaBestCombo = arenaCombo;
          hit = true;
          break;
        }
      }
      if (!hit) { arenaMisses++; arenaCombo = 0; }
    }
  });

  y += aH + 16;

  // HUD
  const hudItems = [
    { label: 'SCORE', value: String(arenaScore), color: T.green },
    { label: 'COMBO', value: arenaCombo + 'x', color: T.amber },
    { label: 'ACCURACY', value: (arenaHits + arenaMisses > 0 ? Math.round(arenaHits / (arenaHits + arenaMisses) * 100) : 100) + '%', color: T.cyan },
    { label: 'TIME', value: Math.floor(arenaTimeLeft / 60) + ':' + String(arenaTimeLeft % 60).padStart(2, '0'), color: T.magenta },
  ];

  const hudW = (aW - 12 * 3) / 4;
  for (let i = 0; i < 4; i++) {
    const hx = aX + i * (hudW + 12);
    r.drawPanel(hx, y, hudW, 60);
    r.drawTextCentered(hudItems[i].label, y + 8, T.monoXs, T.dim);
    const ctx2 = r.ctx;
    ctx2.font = '700 22px "Orbitron", sans-serif';
    ctx2.fillStyle = hudItems[i].color;
    const hm = ctx2.measureText(hudItems[i].value);
    ctx2.fillText(hudItems[i].value, hx + (hudW - hm.width) / 2, (y - r.scrollY) + 48);
  }

  y += 80;
  return y;
}

function renderArenaResult(r: Renderer, y: number, aX: number, aW: number): number {
  const total = arenaHits + arenaMisses;
  const accuracy = total > 0 ? Math.round(arenaHits / total * 100) : 0;
  let grade: string;
  let gradeColor: string;
  if (arenaScore >= 200) { grade = 'S+'; gradeColor = T.gold; }
  else if (arenaScore >= 150) { grade = 'S'; gradeColor = T.gold; }
  else if (arenaScore >= 100) { grade = 'A'; gradeColor = T.green; }
  else if (arenaScore >= 60) { grade = 'B'; gradeColor = T.cyan; }
  else if (arenaScore >= 30) { grade = 'C'; gradeColor = T.amber; }
  else { grade = 'D'; gradeColor = T.red; }

  const xpEarned = Math.round((arenaTech?.xpReward || 50) * arenaScore / 100);
  xp += xpEarned;

  r.drawPanel(aX, y, aW, 300);

  y += 20;
  r.drawTextCenteredGlow(grade, y, '900 64px "Orbitron", sans-serif', gradeColor, gradeColor + '60');
  y += 80;

  r.drawTextCentered(`Score: ${arenaScore}    Accuracy: ${accuracy}%    Best Combo: ${arenaBestCombo}x    XP: +${xpEarned}`, y, T.mono, T.dim);
  y += 32;

  if (arenaTech?.tips?.[0]) {
    r.drawRect(aX + 24, y, aW - 48, 40, 'rgba(255,176,0,0.06)', 'rgba(255,176,0,0.15)');
    r.drawText('TIP: ' + arenaTech.tips[0], aX + 36, y + 8, T.monoSm, T.amber);
    y += 56;
  }

  const btnY = y;
  r.drawButton('RETRY', aX + aW / 2 - 130, btnY, 120, 40, 'arena_retry', { primary: true });
  r.hitRegions[r.hitRegions.length - 1].onClick = () => { if (arenaTech) startArena(arenaTech); };
  r.drawButton('BACK TO LIST', aX + aW / 2 + 10, btnY, 120, 40, 'arena_back');
  r.hitRegions[r.hitRegions.length - 1].onClick = () => { arenaActive = false; };

  y += 80;
  return y + 100;
}
