import { Renderer, T, gridLayout } from './engine.js';
import type { Technique } from './data.js';

// Terminal animation state
let termLines: { text: string; color: string }[] = [];
let termLineIdx = 0;
let termTimer = 0;
let termStarted = false;

const TERM_SCRIPT = [
  { text: '$ 1v9 --analyze summoner', color: T.dimGreen, delay: 40 },
  { text: '> Connecting to neural engine...', color: T.green, delay: 50 },
  { text: '> Loading match history... [████████] DONE', color: T.green, delay: 40 },
  { text: '> Analyzing 847 games...', color: T.green, delay: 50 },
  { text: '', color: T.dim, delay: 10 },
  { text: '> RESULTS:', color: T.cyan, delay: 25 },
  { text: '> ─────────────────────────', color: T.dim, delay: 5 },
  { text: '> Main Role    : MID', color: T.cyan, delay: 15 },
  { text: '> Best Champ   : Ahri (67% WR)', color: T.green, delay: 15 },
  { text: '> CS/min       : 7.2 (Top 15%)', color: T.green, delay: 15 },
  { text: '> Vision Score : Above Average', color: T.amber, delay: 15 },
  { text: '> Weakness     : Early game deaths', color: T.red, delay: 15 },
  { text: '', color: T.dim, delay: 20 },
  { text: '> RECOMMENDATION: Practice "Trading Stance"', color: T.amber, delay: 30 },
  { text: '> Click TRAINING to enter the arena', color: T.cyan, delay: 20 },
];

// Stats counter animation
let statsAnimated = false;
let statValues = [0, 0, 0];
const STAT_TARGETS = [847392, 12847, 94];
const STAT_LABELS = ['TECHNIQUES PRACTICED', 'PLAYERS CLIMBING', '% WIN RATE BOOST'];

export function renderHome(r: Renderer, startY: number): number {
  let y = startY + 40;
  const pad = Math.max(24, (r.W - 1200) / 2);
  const contentW = Math.min(1200, r.W - 48);

  // ── Hero Section ──────────────────────────────────────
  const heroY = y;

  // Glitch title
  y += r.drawGlitchText('1V9.AI', y, T.displayXl, T.green);
  y += 8;

  // Tagline
  y += r.drawTextCenteredGlow('NEURAL-POWERED LEAGUE TRAINING', y, T.monoSm, T.cyan, 'rgba(0,229,255,0.3)');
  y += 8;

  // Subtitle
  y += r.drawWrappedTextCentered('Master every technique. Climb every rank. Carry every game.', y, contentW, T.body, T.dim);
  y += 24;

  // CTA Buttons
  const btnW = 220;
  const btnH = 44;
  const btnGap = 16;
  const btnX = (r.W - btnW * 2 - btnGap) / 2;
  r.drawButton('START TRAINING — FREE', btnX, y, btnW, btnH, 'cta_train', { primary: true, glow: true });
  r.hitRegions[r.hitRegions.length - 1].onClick = () => r.navigateTo('train');
  r.drawButton('AI COACHING', btnX + btnW + btnGap, y, btnW, btnH, 'cta_coach');
  r.hitRegions[r.hitRegions.length - 1].onClick = () => r.navigateTo('coaching');
  y += btnH + 40;

  // Stats
  if (!statsAnimated) {
    statsAnimated = true;
    const step = () => {
      let done = true;
      for (let i = 0; i < 3; i++) {
        const inc = Math.max(1, Math.floor(STAT_TARGETS[i] / 80));
        statValues[i] = Math.min(STAT_TARGETS[i], statValues[i] + inc);
        if (statValues[i] < STAT_TARGETS[i]) done = false;
      }
      if (!done) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const statW = Math.min(200, contentW / 3 - 16);
  const statStartX = (r.W - statW * 3 - 32) / 2;
  for (let i = 0; i < 3; i++) {
    const sx = statStartX + i * (statW + 16);
    r.drawTextCentered(statValues[i].toLocaleString(), y, `700 24px "Orbitron", sans-serif`, T.green);
    // Draw each stat individually
    const ctx = r.ctx;
    ctx.font = '700 24px "Orbitron", sans-serif';
    const numText = statValues[i].toLocaleString();
    const nm = ctx.measureText(numText);
    const numX = sx + (statW - nm.width) / 2;
    const screenY = y - r.scrollY;
    if (screenY > -50 && screenY < r.H + 50) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,255,65,0.3)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = T.green;
      ctx.fillText(numText, numX, screenY + 24);
      ctx.restore();
      ctx.font = T.monoXs;
      ctx.fillStyle = T.dim;
      const lm = ctx.measureText(STAT_LABELS[i]);
      ctx.fillText(STAT_LABELS[i], sx + (statW - lm.width) / 2, screenY + 42);
    }
  }
  y += 60;

  // ── Terminal ──────────────────────────────────────────
  const termW = Math.min(500, contentW);
  const termX = (r.W - termW) / 2;
  const termH = 320;

  // Terminal header
  r.drawRect(termX, y, termW, 32, T.surface2, T.border);
  const tsy = y - r.scrollY;
  if (tsy > -40 && tsy < r.H + 40) {
    const ctx = r.ctx;
    // Dots
    ctx.fillStyle = T.red;
    ctx.beginPath(); ctx.arc(termX + 16, tsy + 16, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = T.amber;
    ctx.beginPath(); ctx.arc(termX + 32, tsy + 16, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = T.green;
    ctx.beginPath(); ctx.arc(termX + 48, tsy + 16, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = T.monoXs;
    ctx.fillStyle = T.dim;
    ctx.fillText('1v9@neural:~', termX + 64, tsy + 20);
  }
  y += 32;

  // Terminal body
  r.drawRect(termX, y, termW, termH - 32, T.bg2, T.border);

  // Animate terminal
  if (!termStarted) {
    termStarted = true;
    let delay = 0;
    TERM_SCRIPT.forEach((line, i) => {
      delay += line.delay;
      setTimeout(() => {
        termLines.push({ text: line.text, color: line.color });
        termLineIdx = i;
      }, delay * 16);
    });
  }

  let ty = y + 12;
  const termBodySy = ty - r.scrollY;
  if (termBodySy > -termH && termBodySy < r.H + termH) {
    for (const line of termLines) {
      r.drawText(line.text, termX + 12, ty, T.monoSm, line.color);
      ty += 18;
    }
  }
  y += termH - 32 + 60;

  // ── Features Section ──────────────────────────────────
  y += r.drawTextCenteredGlow('WEAPON SYSTEMS', y, T.display, T.green, 'rgba(0,255,65,0.3)');
  y += 4;
  y += r.drawTextCentered('Everything you need to go from hardstuck to challenger', y, T.monoSm, T.dim);
  y += 32;

  const features = [
    { icon: '⚔️', title: 'TRAINING ARENA', desc: 'Interactive click-based practice. Learn last-hitting, combos, wave management through hands-on drills.', tag: 'FREE', tagColor: T.green, page: 'train' },
    { icon: '🧠', title: 'AI COACH', desc: 'Neural network trained on 10M+ games. Personalized advice, replay analysis, strategy suggestions.', tag: 'PRO', tagColor: T.cyan, page: 'coaching' },
    { icon: '👑', title: 'CHAMPION DATABASE', desc: 'Every champion. Every build. Every counter. Updated live with AI-analyzed win rates.', tag: 'FREE', tagColor: T.green, page: 'champions' },
    { icon: '📊', title: 'AI TIER LISTS', desc: 'Neural engine analyzes patch data in real-time and predicts the meta before it forms.', tag: 'FREE', tagColor: T.green, page: 'tierlist' },
    { icon: '🎲', title: 'TFT LAB', desc: 'Teamfight Tactics comps, augment analysis, item optimization, and AI-powered team builder.', tag: 'FREE', tagColor: T.green, page: 'tft' },
    { icon: '💎', title: '$1V9 TOKEN', desc: 'The meme coin for carries. Earn tokens through training, refer friends, spend on premium.', tag: '$1V9', tagColor: T.gold, page: 'coin' },
  ];

  const cols = r.W > 900 ? 3 : r.W > 600 ? 2 : 1;
  const g = gridLayout(contentW, cols, 16, 0);
  const cardPad = 20;

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = pad + g.getX(col);
    const cardH = 180;
    const cy = y + row * (cardH + 16);

    const hovered = r.hoveredId === 'feat_' + i;
    r.drawPanel(cx, cy, g.colW, cardH, hovered ? { glow: 'rgba(0,255,65,0.08)', borderColor: T.border2 } : undefined);

    // Top accent line on hover
    if (hovered) {
      r.drawRect(cx, cy, g.colW, 2, T.green);
    }

    let fy = cy + cardPad;
    r.drawText(f.icon + '  ' + f.title, cx + cardPad, fy, T.displaySm, T.green);
    fy += 30;
    fy += r.drawWrappedText(f.desc, cx + cardPad, fy, g.colW - cardPad * 2, T.bodySm, T.dim);
    fy += 8;

    // Tag
    const tagSy = fy - r.scrollY;
    if (tagSy > 0 && tagSy < r.H) {
      const ctx = r.ctx;
      ctx.font = T.monoXs;
      const tm = ctx.measureText(f.tag);
      ctx.fillStyle = f.tagColor + '18';
      ctx.fillRect(cx + cardPad, tagSy, tm.width + 16, 20);
      ctx.strokeStyle = f.tagColor + '40';
      ctx.strokeRect(cx + cardPad + 0.5, tagSy + 0.5, tm.width + 15, 19);
      ctx.fillStyle = f.tagColor;
      ctx.fillText(f.tag, cx + cardPad + 8, tagSy + 14);
    }

    r.hitRegions.push({
      x: cx, y: cy, w: g.colW, h: cardH,
      id: 'feat_' + i, cursor: 'pointer',
      onClick: () => r.navigateTo(f.page)
    });
  }

  const featureRows = Math.ceil(features.length / cols);
  y += featureRows * 196 + 60;

  // ── How It Works ──────────────────────────────────────
  y += r.drawTextCenteredGlow('HOW THE ARENA WORKS', y, T.display, T.green, 'rgba(0,255,65,0.3)');
  y += 32;

  const steps = [
    { num: '01', title: 'PICK A TECHNIQUE', desc: 'Browse 30+ techniques from beginner to challenger-level mechanics.' },
    { num: '02', title: 'ENTER THE ARENA', desc: 'A visual scene loads with champions, minions, and abilities.' },
    { num: '03', title: 'EXECUTE', desc: 'Click targets in the right sequence and timing. Practice it all.' },
    { num: '04', title: 'GET SCORED', desc: 'Perfect, Good, or Miss. Track your improvement over time.' },
  ];

  const stepCols = r.W > 800 ? 4 : 2;
  const sg = gridLayout(contentW, stepCols, 16, 0);

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const col = i % stepCols;
    const row = Math.floor(i / stepCols);
    const sx = pad + sg.getX(col);
    const sy = y + row * 160;

    r.drawPanel(sx, sy, sg.colW, 140);
    r.drawTextCentered(s.num, sy + 16, '900 32px "Orbitron", sans-serif', T.green + '60');
    // Centered within card
    const ctx = r.ctx;
    const ssy = sy - r.scrollY;
    if (ssy > -160 && ssy < r.H + 160) {
      ctx.font = '700 12px "Orbitron", sans-serif';
      ctx.fillStyle = T.cyan;
      const tm = ctx.measureText(s.title);
      ctx.fillText(s.title, sx + (sg.colW - tm.width) / 2, ssy + 80);
      ctx.font = T.bodySm;
      ctx.fillStyle = T.dim;
    }
    r.drawWrappedText(s.desc, sx + 16, sy + 92, sg.colW - 32, T.bodySm, T.dim);
  }

  const stepRows = Math.ceil(steps.length / stepCols);
  y += stepRows * 176 + 60;

  // ── Referral Banner ───────────────────────────────────
  r.drawPanel(pad, y, contentW, 160, { glow: 'rgba(0,229,255,0.05)' });
  r.drawTextCenteredGlow('REFER FRIENDS. EARN $1V9.', y + 24, '900 20px "Orbitron", sans-serif', T.cyan, 'rgba(0,229,255,0.3)');
  r.drawTextCentered('Every friend who signs up earns you 50 credits + 100 $1V9 tokens.', y + 60, T.bodySm, T.dim);

  // Referral link box
  const rlW = Math.min(400, contentW - 80);
  const rlX = (r.W - rlW) / 2;
  r.drawRect(rlX, y + 90, rlW, 36, T.bg, T.border2);
  r.drawText('https://1v9.ai/ref/USER_7X92K', rlX + 12, y + 92, T.monoSm, T.green);
  r.drawButton('COPY', rlX + rlW + 8, y + 90, 70, 36, 'copy_ref');

  y += 220;

  // Footer
  y = drawFooter(r, y, pad, contentW);

  return y;
}

export function drawFooter(r: Renderer, y: number, pad: number, contentW: number): number {
  r.drawRect(0, y, r.W, 1, T.border);
  y += 32;
  r.drawText('[1V9.AI]', pad, y, T.mono, T.green);
  y += 24;
  r.drawText('Neural-powered League training.', pad, y, T.bodySm, T.dim);
  y += 20;
  r.drawText('© 2026 1V9.AI — All rights reserved.', pad, y, T.monoXs, T.dim);
  y += 30;
  r.drawRect(0, y, r.W, 1, T.border);
  y += 4;
  r.drawTextCentered('1V9.AI is not affiliated with Riot Games. League of Legends is a trademark of Riot Games, Inc.', y, T.monoXs, T.dim);
  y += 30;
  return y;
}
