import { Renderer, T, gridLayout } from './engine.js';
import { drawFooter } from './pages-home.js';

// ── State ────────────────────────────────────────────────
let champSearch = '';
let champRole = 'all';
let selectedChamp: number = -1;
let tierRole = 'all';
let coachMessages: { from: string; text: string }[] = [
  { from: 'ai', text: 'Welcome to 1V9 AI Coach. Ask me anything about League of Legends — builds, matchups, macro, mechanics.' },
];
let coachInput = '';
let tftTab = 'comps';
let coinPrice = 0.0847;
let coinDir = 1;
let communityTab = 'leaderboard';

// ══════════════════════════════════════════════════════════
// CHAMPIONS PAGE
// ══════════════════════════════════════════════════════════
export function renderChampions(r: Renderer, startY: number): number {
  let y = startY + 20;
  const pad = Math.max(24, (r.W - 1200) / 2);
  const contentW = Math.min(1200, r.W - 48);

  y += r.drawGlitchText('CHAMPION DATABASE', y, T.display, T.green);
  y += 8;
  y += r.drawTextCentered('Every champion. Every build. Every counter. AI-analyzed.', y, T.monoSm, T.dim);
  y += 24;

  // Role filters
  const roles = ['all', 'top', 'jungle', 'mid', 'adc', 'support'];
  let rx = pad;
  for (const role of roles) {
    const label = role.toUpperCase();
    const bw = 90;
    const active = champRole === role;
    const id = 'champ_role_' + role;
    if (active) {
      r.drawRect(rx, y, bw, 32, T.surface2, T.green);
    } else {
      r.drawRect(rx, y, bw, 32, T.surface, T.border);
    }
    r.drawText(label, rx + 12, y + 6, T.monoSm, active ? T.green : T.dim);
    r.hitRegions.push({ x: rx, y, w: bw, h: 32, id, cursor: 'pointer', onClick: () => { champRole = role; selectedChamp = -1; } });
    rx += bw + 8;
  }
  y += 48;

  // Filter champions
  const champs = globalThis.CHAMPIONS || [];
  const filtered = champs.filter((c: any) => {
    if (champRole !== 'all' && !c.roles.includes(champRole)) return false;
    if (champSearch && !c.name.toLowerCase().includes(champSearch.toLowerCase())) return false;
    return true;
  });

  // Grid
  const cols = r.W > 900 ? 5 : r.W > 600 ? 3 : 2;
  const g = gridLayout(contentW, cols, 12, 0);
  const cardH = 100;

  for (let i = 0; i < filtered.length; i++) {
    const c = filtered[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = pad + g.getX(col);
    const cy = y + row * (cardH + 12);
    const id = 'champ_' + i;
    const hovered = r.hoveredId === id;
    const selected = selectedChamp === i;
    const tierColor = c.tier === 'S' ? T.gold : c.tier === 'A' ? T.green : c.tier === 'B' ? T.cyan : T.dim;

    r.drawPanel(cx, cy, g.colW, cardH, hovered || selected ? { glow: 'rgba(0,255,65,0.06)', borderColor: tierColor } : undefined);

    r.drawText(c.icon + ' ' + c.name, cx + 10, cy + 8, T.monoSm, T.white);
    r.drawText(c.roles.join('/').toUpperCase(), cx + 10, cy + 30, T.monoXs, T.dim);
    r.drawText('WR: ' + c.winRate, cx + 10, cy + 50, T.monoXs, T.green);
    r.drawText('Tier: ' + c.tier, cx + 10, cy + 68, T.monoXs, tierColor);

    r.hitRegions.push({ x: cx, y: cy, w: g.colW, h: cardH, id, cursor: 'pointer', onClick: () => { selectedChamp = selectedChamp === i ? -1 : i; } });
  }

  const rows = Math.ceil(filtered.length / cols);
  y += rows * (cardH + 12) + 16;

  // Detail panel
  if (selectedChamp >= 0 && selectedChamp < filtered.length) {
    const c = filtered[selectedChamp];
    const detH = 220;
    r.drawPanel(pad, y, contentW, detH, { glow: 'rgba(0,229,255,0.05)', borderColor: T.cyan });
    let dy = y + 16;
    r.drawText(c.icon + '  ' + c.name, pad + 20, dy, T.display, T.green);
    dy += 40;
    r.drawText('WIN RATE: ' + c.winRate + '  |  PICK: ' + c.pickRate + '  |  BAN: ' + c.banRate, pad + 20, dy, T.monoSm, T.cyan);
    dy += 24;
    r.drawText('CORE BUILD: ' + c.coreItems.join(' → '), pad + 20, dy, T.monoSm, T.amber);
    dy += 24;
    r.drawText('COUNTERS: ' + c.counters.join(', '), pad + 20, dy, T.monoSm, T.red);
    dy += 24;
    r.drawText('SYNERGIES: ' + c.synergies.join(', '), pad + 20, dy, T.monoSm, T.green);
    dy += 24;
    r.drawWrappedText('TIP: ' + c.tips, pad + 20, dy, contentW - 40, T.bodySm, T.dim);
    y += detH + 16;
  }

  y += 40;
  y = drawFooter(r, y, pad, contentW);
  return y;
}

// ══════════════════════════════════════════════════════════
// TIER LIST PAGE
// ══════════════════════════════════════════════════════════
export function renderTierList(r: Renderer, startY: number): number {
  let y = startY + 20;
  const pad = Math.max(24, (r.W - 1200) / 2);
  const contentW = Math.min(1200, r.W - 48);

  y += r.drawGlitchText('AI TIER LIST', y, T.display, T.green);
  y += 8;
  y += r.drawTextCentered('Neural engine analyzes patch data and predicts the meta.', y, T.monoSm, T.dim);
  y += 24;

  // Role filter
  const roles = ['all', 'top', 'jungle', 'mid', 'adc', 'support'];
  let rx = pad;
  for (const role of roles) {
    const bw = 90;
    const active = tierRole === role;
    const id = 'tier_role_' + role;
    if (active) {
      r.drawRect(rx, y, bw, 32, T.surface2, T.green);
    } else {
      r.drawRect(rx, y, bw, 32, T.surface, T.border);
    }
    r.drawText(role.toUpperCase(), rx + 12, y + 6, T.monoSm, active ? T.green : T.dim);
    r.hitRegions.push({ x: rx, y, w: bw, h: 32, id, cursor: 'pointer', onClick: () => { tierRole = role; } });
    rx += bw + 8;
  }
  y += 52;

  const tierList = globalThis.TIER_LIST || {};
  const tiers = ['S', 'A', 'B', 'C', 'D'];
  const tierColors: Record<string, string> = { S: T.gold, A: T.green, B: T.cyan, C: T.amber, D: T.dim };

  const champs = globalThis.CHAMPIONS || [];

  for (const tier of tiers) {
    const names: string[] = tierList[tier] || [];
    let filteredNames = names;
    if (tierRole !== 'all') {
      filteredNames = names.filter(name => {
        const ch = champs.find((c: any) => c.name === name);
        return ch && ch.roles.includes(tierRole);
      });
    }
    if (filteredNames.length === 0) continue;

    const rowH = 48;
    const color = tierColors[tier] || T.dim;

    // Tier label
    r.drawRect(pad, y, 50, rowH, color + '20', color);
    r.drawText(tier, pad + 16, y + 12, '900 20px "Orbitron", sans-serif', color);

    // Champion chips
    let cx = pad + 62;
    for (const name of filteredNames) {
      const ch = champs.find((c: any) => c.name === name);
      const icon = ch ? ch.icon : '?';
      const chipW = Math.min(120, (contentW - 70) / 6);
      r.drawRect(cx, y + 4, chipW, rowH - 8, T.surface, T.border);
      r.drawText(icon + ' ' + name, cx + 6, y + 12, T.monoXs, T.white);
      cx += chipW + 6;
      if (cx + chipW > pad + contentW) break;
    }
    y += rowH + 10;
  }

  y += 40;
  y = drawFooter(r, y, pad, contentW);
  return y;
}

// ══════════════════════════════════════════════════════════
// AI COACHING PAGE
// ══════════════════════════════════════════════════════════
export function renderCoaching(r: Renderer, startY: number): number {
  let y = startY + 20;
  const pad = Math.max(24, (r.W - 1200) / 2);
  const contentW = Math.min(1200, r.W - 48);

  y += r.drawGlitchText('AI COACH', y, T.display, T.cyan);
  y += 8;
  y += r.drawTextCentered('Neural network trained on 10M+ games. Ask anything.', y, T.monoSm, T.dim);
  y += 30;

  // Chat area
  const chatW = Math.min(700, contentW);
  const chatX = (r.W - chatW) / 2;
  r.drawPanel(chatX, y, chatW, 400, { borderColor: T.border2 });

  let cy = y + 16;
  for (const msg of coachMessages) {
    const isAi = msg.from === 'ai';
    const msgX = isAi ? chatX + 16 : chatX + chatW - 320;
    const msgW = 300;
    const msgColor = isAi ? T.surface2 : 'rgba(0,229,255,0.08)';
    const textColor = isAi ? T.green : T.cyan;

    const h = r.drawWrappedText(msg.text, msgX + 10, cy + 10, msgW - 20, T.bodySm, textColor);
    r.drawRect(msgX, cy, msgW, h + 16, msgColor, isAi ? T.border : 'rgba(0,229,255,0.2)');
    r.drawWrappedText(msg.text, msgX + 10, cy + 10, msgW - 20, T.bodySm, textColor);
    cy += h + 24;
  }
  y += 420;

  // Quick prompts
  y += r.drawTextCentered('QUICK PROMPTS', y, T.displaySm, T.dim);
  y += 16;
  const prompts = ['How to CS better?', 'Best mid laners?', 'Climbing out of Silver', 'Wave management tips', 'Team fight positioning', 'When to roam?'];
  const promptCols = r.W > 700 ? 3 : 2;
  const pg = gridLayout(chatW, promptCols, 10, 0);
  for (let i = 0; i < prompts.length; i++) {
    const col = i % promptCols;
    const row = Math.floor(i / promptCols);
    const px = chatX + pg.getX(col);
    const py = y + row * 44;
    r.drawButton(prompts[i], px, py, pg.colW, 36, 'prompt_' + i);
    r.hitRegions[r.hitRegions.length - 1].onClick = () => {
      const responses = globalThis.AI_RESPONSES || {};
      coachMessages.push({ from: 'user', text: prompts[i] });
      const keys = Object.keys(responses);
      const resp = responses[keys[i % keys.length]] || 'Great question! Focus on fundamentals and you will climb.';
      setTimeout(() => coachMessages.push({ from: 'ai', text: resp }), 500);
    };
  }
  y += Math.ceil(prompts.length / promptCols) * 44 + 32;

  // Performance Stats
  y += r.drawTextCenteredGlow('PERFORMANCE ANALYSIS', y, T.display, T.green, 'rgba(0,255,65,0.3)');
  y += 24;

  const stats = [
    { label: 'CS/MIN', value: '7.2', grade: 'A', color: T.green },
    { label: 'VISION SCORE', value: '1.4/min', grade: 'B', color: T.cyan },
    { label: 'KDA', value: '3.8', grade: 'A', color: T.green },
    { label: 'WIN RATE', value: '56%', grade: 'S', color: T.gold },
    { label: 'DAMAGE/MIN', value: '812', grade: 'B+', color: T.cyan },
    { label: 'OBJ CONTROL', value: '72%', grade: 'A-', color: T.green },
  ];

  const statCols = r.W > 800 ? 3 : 2;
  const sg = gridLayout(contentW, statCols, 12, 0);
  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    const col = i % statCols;
    const row = Math.floor(i / statCols);
    const sx = pad + sg.getX(col);
    const sy = y + row * 100;
    r.drawPanel(sx, sy, sg.colW, 88);
    r.drawText(s.label, sx + 16, sy + 12, T.monoXs, T.dim);
    r.drawText(s.value, sx + 16, sy + 34, '700 22px "Orbitron", sans-serif', s.color);
    r.drawText('GRADE: ' + s.grade, sx + sg.colW - 90, sy + 38, T.monoSm, s.color);
  }
  y += Math.ceil(stats.length / statCols) * 100 + 40;

  y = drawFooter(r, y, pad, contentW);
  return y;
}

// ══════════════════════════════════════════════════════════
// TFT PAGE
// ══════════════════════════════════════════════════════════
export function renderTft(r: Renderer, startY: number): number {
  let y = startY + 20;
  const pad = Math.max(24, (r.W - 1200) / 2);
  const contentW = Math.min(1200, r.W - 48);

  y += r.drawGlitchText('TFT LAB', y, T.display, T.magenta);
  y += 8;
  y += r.drawTextCentered('Teamfight Tactics comps, items, and AI-powered team builder.', y, T.monoSm, T.dim);
  y += 24;

  // Tabs
  const tabs = ['comps', 'items', 'augments', 'builder'];
  let tx = pad;
  for (const tab of tabs) {
    const bw = 110;
    const active = tftTab === tab;
    const id = 'tft_tab_' + tab;
    if (active) {
      r.drawRect(tx, y, bw, 34, T.surface2, T.magenta);
    } else {
      r.drawRect(tx, y, bw, 34, T.surface, T.border);
    }
    r.drawText(tab.toUpperCase(), tx + 12, y + 8, T.monoSm, active ? T.magenta : T.dim);
    r.hitRegions.push({ x: tx, y, w: bw, h: 34, id, cursor: 'pointer', onClick: () => { tftTab = tab; } });
    tx += bw + 8;
  }
  y += 52;

  if (tftTab === 'comps') {
    const comps = globalThis.TFT_COMPS || [];
    for (let i = 0; i < comps.length; i++) {
      const c = comps[i];
      const cardH = 150;
      const tierColor = c.tier === 'S' ? T.gold : c.tier === 'A' ? T.green : T.cyan;
      r.drawPanel(pad, y, contentW, cardH, { borderColor: tierColor + '60' });

      r.drawText(c.name, pad + 16, y + 12, T.displaySm, T.white);
      r.drawText('TIER: ' + c.tier, pad + contentW - 100, y + 14, T.monoSm, tierColor);
      r.drawText('WIN RATE: ' + c.winRate, pad + contentW - 100, y + 34, T.monoXs, T.green);

      r.drawText('UNITS: ' + c.units.join(' • '), pad + 16, y + 42, T.monoXs, T.cyan);
      r.drawText('ITEMS: ' + c.items, pad + 16, y + 62, T.monoXs, T.amber);
      r.drawWrappedText(c.description, pad + 16, y + 84, contentW - 32, T.bodySm, T.dim);

      y += cardH + 12;
    }
  } else if (tftTab === 'items') {
    r.drawPanel(pad, y, contentW, 200);
    r.drawTextCentered('ITEM COMBINATIONS', y + 20, T.displaySm, T.amber);
    const items = ['B.F. Sword', 'Recurve Bow', 'Needlessly Large Rod', 'Tear of the Goddess', 'Chain Vest', 'Negatron Cloak', 'Giants Belt', 'Sparring Gloves', 'Spatula'];
    for (let i = 0; i < items.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      r.drawText('◆ ' + items[i], pad + 30 + col * 220, y + 56 + row * 24, T.monoSm, T.cyan);
    }
    y += 220;
  } else if (tftTab === 'augments') {
    r.drawPanel(pad, y, contentW, 180);
    r.drawTextCentered('TOP AUGMENTS THIS PATCH', y + 20, T.displaySm, T.purple);
    const augments = ['Jeweled Lotus', 'Cybernetic Uplink', 'Celestial Blessing', 'Metabolic Accelerator', 'Thrill of the Hunt', 'First Aid Kit'];
    for (let i = 0; i < augments.length; i++) {
      r.drawText((i + 1) + '. ' + augments[i], pad + 30, y + 56 + i * 20, T.monoSm, T.green);
    }
    y += 200;
  } else {
    r.drawPanel(pad, y, contentW, 160);
    r.drawTextCentered('TEAM BUILDER', y + 30, T.displaySm, T.cyan);
    r.drawTextCentered('Drag and drop units to build your comp.', y + 70, T.bodySm, T.dim);
    r.drawTextCentered('[ COMING SOON ]', y + 110, T.mono, T.dim);
    y += 180;
  }

  y += 40;
  y = drawFooter(r, y, pad, contentW);
  return y;
}

// ══════════════════════════════════════════════════════════
// $1V9 COIN PAGE
// ══════════════════════════════════════════════════════════
export function renderCoin(r: Renderer, startY: number): number {
  let y = startY + 20;
  const pad = Math.max(24, (r.W - 1200) / 2);
  const contentW = Math.min(1200, r.W - 48);

  // Fluctuate price
  coinPrice += (Math.random() - 0.48) * 0.002 * coinDir;
  if (coinPrice > 0.15) coinDir = -1;
  if (coinPrice < 0.04) coinDir = 1;
  coinPrice = Math.max(0.01, coinPrice);

  y += r.drawGlitchText('$1V9 TOKEN', y, T.display, T.gold);
  y += 8;
  y += r.drawTextCentered('The meme coin for carries. Earn. Trade. Dominate.', y, T.monoSm, T.dim);
  y += 40;

  // Price display
  const pricePanel = Math.min(500, contentW);
  const priceX = (r.W - pricePanel) / 2;
  r.drawPanel(priceX, y, pricePanel, 120, { glow: 'rgba(255,215,0,0.08)', borderColor: T.gold });
  r.drawTextCentered('$1V9 / USD', y + 14, T.monoXs, T.dim);
  r.drawTextCenteredGlow('$' + coinPrice.toFixed(4), y + 36, '900 42px "Orbitron", sans-serif', T.gold, 'rgba(255,215,0,0.3)');
  const change = ((coinPrice - 0.0847) / 0.0847 * 100);
  const changeColor = change >= 0 ? T.green : T.red;
  const changeSign = change >= 0 ? '+' : '';
  r.drawTextCentered(changeSign + change.toFixed(2) + '%  24H', y + 90, T.monoSm, changeColor);
  y += 140;

  // Stats row
  y += 20;
  const coinStats = [
    { label: 'MARKET CAP', value: '$4.2M' },
    { label: 'CIRCULATING', value: '50M $1V9' },
    { label: 'HOLDERS', value: '12,847' },
    { label: 'LIQUIDITY', value: '$890K' },
  ];
  const csCols = r.W > 700 ? 4 : 2;
  const csg = gridLayout(contentW, csCols, 12, 0);
  for (let i = 0; i < coinStats.length; i++) {
    const s = coinStats[i];
    const col = i % csCols;
    const row = Math.floor(i / csCols);
    const sx = pad + csg.getX(col);
    const sy = y + row * 80;
    r.drawPanel(sx, sy, csg.colW, 68);
    r.drawText(s.label, sx + 14, sy + 10, T.monoXs, T.dim);
    r.drawText(s.value, sx + 14, sy + 32, T.monoSm, T.gold);
  }
  y += Math.ceil(coinStats.length / csCols) * 80 + 24;

  // Tokenomics
  y += r.drawTextCenteredGlow('TOKENOMICS', y, T.displaySm, T.gold, 'rgba(255,215,0,0.2)');
  y += 20;
  const tokenomics = [
    { label: 'Training Rewards', pct: 40, color: T.green },
    { label: 'Liquidity Pool', pct: 25, color: T.cyan },
    { label: 'Team & Dev', pct: 15, color: T.amber },
    { label: 'Community Airdrops', pct: 10, color: T.magenta },
    { label: 'Reserve', pct: 10, color: T.dim },
  ];
  for (const t of tokenomics) {
    r.drawText(t.label + ' — ' + t.pct + '%', pad + 20, y + 4, T.monoSm, t.color);
    r.drawProgressBar(pad + 260, y + 6, contentW - 280, 16, t.pct / 100, t.color);
    y += 36;
  }
  y += 20;

  // CTA
  const btnW = 220;
  const btnX = (r.W - btnW) / 2;
  r.drawButton('CONNECT WALLET', btnX, y, btnW, 44, 'connect_wallet', { primary: true, glow: true });
  y += 70;

  y = drawFooter(r, y, pad, contentW);
  return y;
}

// ══════════════════════════════════════════════════════════
// NEWS PAGE
// ══════════════════════════════════════════════════════════
export function renderNews(r: Renderer, startY: number): number {
  let y = startY + 20;
  const pad = Math.max(24, (r.W - 1200) / 2);
  const contentW = Math.min(1200, r.W - 48);

  y += r.drawGlitchText('NEWS FEED', y, T.display, T.green);
  y += 8;
  y += r.drawTextCentered('Latest patches, meta shifts, and esports updates.', y, T.monoSm, T.dim);
  y += 32;

  const news = globalThis.NEWS_ITEMS || [];
  const cols = r.W > 800 ? 2 : 1;
  const g = gridLayout(contentW, cols, 16, 0);

  for (let i = 0; i < news.length; i++) {
    const n = news[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = pad + g.getX(col);
    const cardH = 140;
    const cy = y + row * (cardH + 16);
    const id = 'news_' + i;
    const hovered = r.hoveredId === id;

    r.drawPanel(cx, cy, g.colW, cardH, hovered ? { glow: 'rgba(0,255,65,0.05)', borderColor: T.border2 } : undefined);

    // Tag
    const tagColor = n.tag === 'PATCH' ? T.green : n.tag === 'META' ? T.cyan : n.tag === 'ESPORTS' ? T.magenta : T.amber;
    const sy = cy - r.scrollY;
    if (sy > -cardH && sy < r.H + cardH) {
      const ctx = r.ctx;
      ctx.font = T.monoXs;
      const tm = ctx.measureText(n.tag);
      ctx.fillStyle = tagColor + '20';
      ctx.fillRect(cx + 16, sy + 14, tm.width + 12, 18);
      ctx.fillStyle = tagColor;
      ctx.fillText(n.tag, cx + 22, sy + 27);
    }

    r.drawText(n.title, cx + 16, cy + 40, T.displaySm, T.white, g.colW - 32);
    r.drawWrappedText(n.excerpt, cx + 16, cy + 68, g.colW - 32, T.bodySm, T.dim);
    r.drawText(n.date, cx + g.colW - 90, cy + 114, T.monoXs, T.dim);

    r.hitRegions.push({ x: cx, y: cy, w: g.colW, h: cardH, id, cursor: 'pointer' });
  }

  const newsRows = Math.ceil(news.length / cols);
  y += newsRows * 156 + 40;

  y = drawFooter(r, y, pad, contentW);
  return y;
}

// ══════════════════════════════════════════════════════════
// COMMUNITY PAGE
// ══════════════════════════════════════════════════════════
export function renderCommunity(r: Renderer, startY: number): number {
  let y = startY + 20;
  const pad = Math.max(24, (r.W - 1200) / 2);
  const contentW = Math.min(1200, r.W - 48);

  y += r.drawGlitchText('COMMUNITY', y, T.display, T.green);
  y += 8;
  y += r.drawTextCentered('Leaderboards, clips, and discussions.', y, T.monoSm, T.dim);
  y += 24;

  // Tabs
  const tabs = ['leaderboard', 'clips', 'discussions'];
  let tx = pad;
  for (const tab of tabs) {
    const bw = 130;
    const active = communityTab === tab;
    const id = 'comm_tab_' + tab;
    if (active) {
      r.drawRect(tx, y, bw, 34, T.surface2, T.green);
    } else {
      r.drawRect(tx, y, bw, 34, T.surface, T.border);
    }
    r.drawText(tab.toUpperCase(), tx + 12, y + 8, T.monoSm, active ? T.green : T.dim);
    r.hitRegions.push({ x: tx, y, w: bw, h: 34, id, cursor: 'pointer', onClick: () => { communityTab = tab; } });
    tx += bw + 8;
  }
  y += 52;

  if (communityTab === 'leaderboard') {
    const lb = globalThis.LEADERBOARD || [];
    // Header
    r.drawRect(pad, y, contentW, 32, T.surface2, T.border);
    r.drawText('RANK', pad + 16, y + 6, T.monoXs, T.dim);
    r.drawText('PLAYER', pad + 80, y + 6, T.monoXs, T.dim);
    r.drawText('SCORE', pad + contentW - 240, y + 6, T.monoXs, T.dim);
    r.drawText('LEVEL', pad + contentW - 140, y + 6, T.monoXs, T.dim);
    r.drawText('TITLE', pad + contentW - 60, y + 6, T.monoXs, T.dim);
    y += 36;

    for (let i = 0; i < lb.length; i++) {
      const e = lb[i];
      const rowH = 32;
      const rowBg = i % 2 === 0 ? T.surface : 'transparent';
      r.drawRect(pad, y, contentW, rowH, rowBg);

      const rankColor = e.rank <= 3 ? T.gold : T.white;
      r.drawText('#' + e.rank, pad + 16, y + 6, T.monoSm, rankColor);
      r.drawText(e.name, pad + 80, y + 6, T.monoSm, T.cyan);
      r.drawText(e.score.toLocaleString(), pad + contentW - 240, y + 6, T.monoSm, T.green);
      r.drawText('Lv.' + e.level, pad + contentW - 140, y + 6, T.monoSm, T.amber);
      r.drawText(e.title, pad + contentW - 60, y + 6, T.monoXs, T.dim);
      y += rowH + 2;
    }
  } else if (communityTab === 'clips') {
    const clips = globalThis.CLIPS || [];
    const cols = r.W > 700 ? 2 : 1;
    const g = gridLayout(contentW, cols, 12, 0);

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = pad + g.getX(col);
      const cardH = 120;
      const cy = y + row * (cardH + 12);

      r.drawPanel(cx, cy, g.colW, cardH);
      r.drawText(c.icon + ' ' + c.title, cx + 16, cy + 12, T.displaySm, T.white);
      r.drawText('by ' + c.author, cx + 16, cy + 38, T.monoXs, T.cyan);
      r.drawText(c.views + ' views  •  ' + c.likes + ' likes', cx + 16, cy + 58, T.monoXs, T.dim);
      r.drawWrappedText(c.description, cx + 16, cy + 78, g.colW - 32, T.bodySm, T.dim);
    }
    y += Math.ceil(clips.length / cols) * 132;
  } else {
    const disc = globalThis.DISCUSSIONS || [];
    for (let i = 0; i < disc.length; i++) {
      const d = disc[i];
      const cardH = 100;
      r.drawPanel(pad, y, contentW, cardH);
      r.drawText(d.title, pad + 16, y + 12, T.displaySm, T.white);
      r.drawText('by ' + d.author + '  •  ' + d.replies + ' replies  •  ' + d.views + ' views', pad + 16, y + 38, T.monoXs, T.dim);
      r.drawWrappedText(d.preview, pad + 16, y + 60, contentW - 32, T.bodySm, T.dim);
      y += cardH + 10;
    }
  }

  y += 40;
  y = drawFooter(r, y, pad, contentW);
  return y;
}
