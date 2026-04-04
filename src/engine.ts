// ═══════════════════════════════════════════════════════════
// 1V9.AI — CANVAS RENDERING ENGINE (Pretext-powered)
// Full page layout computed via pure math, zero DOM reflow
// ═══════════════════════════════════════════════════════════

import { prepare, prepareWithSegments, layout, layoutWithLines, type PreparedText, type PreparedTextWithSegments } from '@chenglou/pretext';

// ── Theme ─────────────────────────────────────────────────
export const T = {
  bg: '#050508',
  bg2: '#0a0a10',
  bg3: '#0f0f18',
  green: '#00ff41',
  dimGreen: '#00aa2a',
  darkGreen: '#003b0e',
  cyan: '#00e5ff',
  magenta: '#ff00ff',
  amber: '#ffb000',
  red: '#ff3c3c',
  gold: '#ffd700',
  purple: '#b44aff',
  white: '#e0e0e0',
  dim: '#555555',
  border: 'rgba(0,255,65,0.12)',
  border2: 'rgba(0,255,65,0.25)',
  surface: 'rgba(10,255,65,0.03)',
  surface2: 'rgba(10,255,65,0.06)',
  glass: 'rgba(5,5,15,0.85)',
  // Fonts
  mono: '13px "Share Tech Mono", "Courier New", monospace',
  monoSm: '11px "Share Tech Mono", "Courier New", monospace',
  monoXs: '10px "Share Tech Mono", "Courier New", monospace',
  display: '900 28px "Orbitron", sans-serif',
  displayLg: '900 42px "Orbitron", sans-serif',
  displayXl: '900 72px "Orbitron", sans-serif',
  displaySm: '700 16px "Orbitron", sans-serif',
  body: '500 15px "Rajdhani", sans-serif',
  bodySm: '400 13px "Rajdhani", sans-serif',
};

// ── Pretext Cache ─────────────────────────────────────────
const ptCache = new Map<string, PreparedTextWithSegments>();

export function pt(text: string, font: string): PreparedTextWithSegments {
  const key = text + '||' + font;
  let cached = ptCache.get(key);
  if (!cached) {
    cached = prepareWithSegments(text, font);
    ptCache.set(key, cached);
    // Keep cache bounded
    if (ptCache.size > 2000) {
      const first = ptCache.keys().next().value!;
      ptCache.delete(first);
    }
  }
  return cached;
}

export function measureText(text: string, font: string, maxWidth: number, lineHeight: number) {
  const prepared = pt(text, font);
  return layoutWithLines(prepared, maxWidth, lineHeight);
}

export function measureHeight(text: string, font: string, maxWidth: number, lineHeight: number): number {
  const prepared = prepare(text, font);
  return layout(prepared, maxWidth, lineHeight).height;
}

// ── Hit Regions ───────────────────────────────────────────
export type HitRegion = {
  x: number; y: number; w: number; h: number;
  id: string;
  cursor?: string;
  onClick?: () => void;
  onHover?: () => void;
};

// ── Renderer ──────────────────────────────────────────────
export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  W: number = 0;
  H: number = 0;
  dpr: number = 1;
  scrollY: number = 0;
  maxScroll: number = 0;
  contentHeight: number = 0;
  hitRegions: HitRegion[] = [];
  hoveredId: string | null = null;
  mouseX: number = 0;
  mouseY: number = 0;
  animFrame: number = 0;
  pages: Map<string, (r: Renderer, y: number) => number> = new Map();
  currentPage: string = 'home';
  onNavigate: ((page: string) => void) | null = null;
  time: number = 0;
  particles: Particle[] = [];
  scanlineAlpha: number = 0.06;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    this.initParticles();
    this.bindEvents();
  }

  resize() {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W * this.dpr;
    this.canvas.height = this.H * this.dpr;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  // ── Particles ─────────────────────────────────────────
  initParticles() {
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * 2000,
        y: Math.random() * 5000,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1.2 + 0.4,
        a: Math.random() * 0.25 + 0.05,
        color: Math.random() > 0.5 ? '0,255,65' : '0,229,255',
      });
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = this.W;
      if (p.x > this.W) p.x = 0;
      if (p.y < 0) p.y = this.H;
      if (p.y > this.H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.a})`;
      ctx.fill();
    }
  }

  // ── Scanlines ─────────────────────────────────────────
  drawScanlines() {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(0,0,0,${this.scanlineAlpha})`;
    for (let y = 0; y < this.H; y += 4) {
      ctx.fillRect(0, y + 2, this.W, 2);
    }
    // CRT vignette
    const g = ctx.createRadialGradient(this.W / 2, this.H / 2, this.W * 0.3, this.W / 2, this.H / 2, this.W * 0.8);
    g.addColorStop(0, 'transparent');
    g.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.H);
  }

  // ── Drawing Primitives ────────────────────────────────
  clear() {
    this.ctx.fillStyle = T.bg;
    this.ctx.fillRect(0, 0, this.W, this.H);
    this.hitRegions = [];
  }

  drawText(text: string, x: number, y: number, font: string, color: string, maxWidth?: number): number {
    const ctx = this.ctx;
    const screenY = y - this.scrollY;
    // Cull off-screen
    if (screenY > this.H + 50 || screenY < -200) {
      if (maxWidth) {
        const h = measureHeight(text, font, maxWidth, parseFontSize(font) * 1.5);
        return h;
      }
      return parseFontSize(font) * 1.5;
    }

    ctx.font = font;
    ctx.fillStyle = color;

    if (maxWidth && text.length > 0) {
      const result = measureText(text, font, maxWidth, parseFontSize(font) * 1.5);
      let ly = screenY;
      for (const line of result.lines) {
        ctx.fillText(line.text, x, ly + parseFontSize(font));
        ly += parseFontSize(font) * 1.5;
      }
      return result.height;
    } else {
      ctx.fillText(text, x, screenY + parseFontSize(font));
      return parseFontSize(font) * 1.5;
    }
  }

  drawTextGlow(text: string, x: number, y: number, font: string, color: string, glowColor: string): number {
    const ctx = this.ctx;
    const screenY = y - this.scrollY;
    if (screenY > this.H + 50 || screenY < -100) return parseFontSize(font) * 1.5;

    ctx.save();
    ctx.font = font;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.fillText(text, x, screenY + parseFontSize(font));
    ctx.shadowBlur = 0;
    ctx.restore();
    return parseFontSize(font) * 1.5;
  }

  drawTextCentered(text: string, y: number, font: string, color: string): number {
    const ctx = this.ctx;
    const screenY = y - this.scrollY;
    if (screenY > this.H + 50 || screenY < -100) return parseFontSize(font) * 1.5;

    ctx.font = font;
    const m = ctx.measureText(text);
    ctx.fillStyle = color;
    ctx.fillText(text, (this.W - m.width) / 2, screenY + parseFontSize(font));
    return parseFontSize(font) * 1.5;
  }

  drawTextCenteredGlow(text: string, y: number, font: string, color: string, glowColor: string): number {
    const ctx = this.ctx;
    const screenY = y - this.scrollY;
    if (screenY > this.H + 50 || screenY < -100) return parseFontSize(font) * 1.5;

    ctx.save();
    ctx.font = font;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    const m = ctx.measureText(text);
    ctx.fillStyle = color;
    ctx.fillText(text, (this.W - m.width) / 2, screenY + parseFontSize(font));
    ctx.shadowBlur = 0;
    ctx.restore();
    return parseFontSize(font) * 1.5;
  }

  drawWrappedText(text: string, x: number, y: number, maxWidth: number, font: string, color: string, lineHeight?: number): number {
    const lh = lineHeight || parseFontSize(font) * 1.5;
    const screenY = y - this.scrollY;
    const result = measureText(text, font, maxWidth, lh);

    if (screenY > this.H + 50 || screenY + result.height < -50) return result.height;

    const ctx = this.ctx;
    ctx.font = font;
    ctx.fillStyle = color;
    let ly = screenY;
    for (const line of result.lines) {
      if (ly > -30 && ly < this.H + 30) {
        ctx.fillText(line.text, x, ly + parseFontSize(font));
      }
      ly += lh;
    }
    return result.height;
  }

  drawWrappedTextCentered(text: string, y: number, maxWidth: number, font: string, color: string): number {
    const lh = parseFontSize(font) * 1.5;
    const result = measureText(text, font, maxWidth, lh);
    const screenY = y - this.scrollY;
    if (screenY > this.H + 50 || screenY + result.height < -50) return result.height;

    const ctx = this.ctx;
    ctx.font = font;
    ctx.fillStyle = color;
    let ly = screenY;
    for (const line of result.lines) {
      const m = ctx.measureText(line.text);
      if (ly > -30 && ly < this.H + 30) {
        ctx.fillText(line.text, (this.W - m.width) / 2, ly + parseFontSize(font));
      }
      ly += lh;
    }
    return result.height;
  }

  // ── Boxes & Panels ────────────────────────────────────
  drawRect(x: number, y: number, w: number, h: number, fill: string, strokeColor?: string) {
    const sy = y - this.scrollY;
    if (sy > this.H + 10 || sy + h < -10) return;
    const ctx = this.ctx;
    ctx.fillStyle = fill;
    ctx.fillRect(x, sy, w, h);
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, sy + 0.5, w - 1, h - 1);
    }
  }

  drawPanel(x: number, y: number, w: number, h: number, opts?: { glow?: string; borderColor?: string }) {
    const sy = y - this.scrollY;
    if (sy > this.H + 10 || sy + h < -10) return;
    const ctx = this.ctx;

    if (opts?.glow) {
      ctx.save();
      ctx.shadowColor = opts.glow;
      ctx.shadowBlur = 20;
      ctx.fillStyle = T.glass;
      ctx.fillRect(x, sy, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = T.glass;
      ctx.fillRect(x, sy, w, h);
    }

    ctx.strokeStyle = opts?.borderColor || T.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, sy + 0.5, w - 1, h - 1);
  }

  drawButton(text: string, x: number, y: number, w: number, h: number, id: string, opts?: { primary?: boolean; glow?: boolean; disabled?: boolean }) {
    const sy = y - this.scrollY;
    if (sy > this.H + 10 || sy + h < -10) return;
    const ctx = this.ctx;
    const hovered = this.hoveredId === id;
    const primary = opts?.primary;

    if (primary) {
      ctx.fillStyle = hovered ? '#33ff66' : T.green;
      if (opts?.glow) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,255,65,0.4)';
        ctx.shadowBlur = hovered ? 25 : 15;
        ctx.fillRect(x, sy, w, h);
        ctx.restore();
      } else {
        ctx.fillRect(x, sy, w, h);
      }
      ctx.font = T.monoSm;
      ctx.fillStyle = T.bg;
      const m = ctx.measureText(text);
      ctx.fillText(text, x + (w - m.width) / 2, sy + h / 2 + 4);
    } else {
      ctx.fillStyle = hovered ? T.surface2 : T.surface;
      ctx.fillRect(x, sy, w, h);
      ctx.strokeStyle = hovered ? T.green : T.border2;
      ctx.strokeRect(x + 0.5, sy + 0.5, w - 1, h - 1);
      ctx.font = T.monoSm;
      ctx.fillStyle = hovered ? T.green : T.cyan;
      const m = ctx.measureText(text);
      ctx.fillText(text, x + (w - m.width) / 2, sy + h / 2 + 4);
    }

    this.hitRegions.push({ x, y, w, h, id, cursor: 'pointer' });
  }

  drawProgressBar(x: number, y: number, w: number, h: number, pct: number, color: string, bg?: string) {
    const sy = y - this.scrollY;
    if (sy > this.H + 10 || sy + h < -10) return;
    const ctx = this.ctx;
    ctx.fillStyle = bg || T.surface2;
    ctx.fillRect(x, sy, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, sy, w * Math.min(1, pct), h);
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color: string, width: number = 1) {
    const sy1 = y1 - this.scrollY;
    const sy2 = y2 - this.scrollY;
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, sy1);
    ctx.lineTo(x2, sy2);
    ctx.stroke();
  }

  // ── Glitch Text Effect ────────────────────────────────
  drawGlitchText(text: string, y: number, font: string, color: string): number {
    const ctx = this.ctx;
    const screenY = y - this.scrollY;
    if (screenY > this.H + 50 || screenY < -100) return parseFontSize(font) * 1.5;

    ctx.font = font;
    const m = ctx.measureText(text);
    const cx = (this.W - m.width) / 2;
    const fs = parseFontSize(font);

    // Glitch layers
    const t = this.time * 0.001;
    const glitchAmt = Math.sin(t * 3) * 2;

    ctx.save();
    // Cyan offset
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = T.cyan;
    ctx.fillText(text, cx + glitchAmt, screenY + fs + 1);
    // Magenta offset
    ctx.fillStyle = T.magenta;
    ctx.fillText(text, cx - glitchAmt, screenY + fs - 1);
    // Main
    ctx.globalAlpha = 1;
    ctx.shadowColor = color === T.green ? 'rgba(0,255,65,0.4)' : 'rgba(255,255,255,0.2)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.fillText(text, cx, screenY + fs);
    ctx.restore();

    return fs * 1.5;
  }

  // ── Nav Bar ───────────────────────────────────────────
  drawNav(links: { id: string; label: string }[]) {
    const ctx = this.ctx;
    const navH = 50;

    // Nav background
    ctx.fillStyle = 'rgba(5,5,8,0.95)';
    ctx.fillRect(0, 0, this.W, navH);
    ctx.strokeStyle = T.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, navH);
    ctx.lineTo(this.W, navH);
    ctx.stroke();

    // Logo
    ctx.font = '700 18px "Share Tech Mono", monospace';
    ctx.fillStyle = T.dim;
    ctx.fillText('[', 20, 32);
    ctx.fillStyle = T.green;
    ctx.save();
    ctx.shadowColor = 'rgba(0,255,65,0.3)';
    ctx.shadowBlur = 10;
    ctx.fillText('1V9', 30, 32);
    ctx.restore();
    ctx.fillStyle = T.dim;
    ctx.fillText('.', 68, 32);
    ctx.fillStyle = T.cyan;
    ctx.save();
    ctx.shadowColor = 'rgba(0,229,255,0.3)';
    ctx.shadowBlur = 10;
    ctx.fillText('AI', 74, 32);
    ctx.restore();
    ctx.fillStyle = T.dim;
    ctx.fillText(']', 94, 32);

    // Nav links
    ctx.font = T.monoXs;
    let nx = 130;
    for (const link of links) {
      const m = ctx.measureText(link.label);
      const lw = m.width + 24;
      const active = this.currentPage === link.id;
      const hovered = this.hoveredId === 'nav_' + link.id;

      if (active) {
        ctx.fillStyle = T.surface2;
        ctx.fillRect(nx, 10, lw, 30);
        ctx.strokeStyle = T.border;
        ctx.strokeRect(nx + 0.5, 10.5, lw - 1, 29);
      } else if (hovered) {
        ctx.fillStyle = T.surface;
        ctx.fillRect(nx, 10, lw, 30);
      }

      ctx.fillStyle = active ? T.green : hovered ? T.green : T.dim;
      ctx.fillText(link.label, nx + 12, 30);

      this.hitRegions.push({
        x: nx, y: 0, w: lw, h: navH,
        id: 'nav_' + link.id,
        cursor: 'pointer',
        onClick: () => this.navigateTo(link.id)
      });
      nx += lw + 4;
    }
  }

  drawScrollbar() {
    if (this.maxScroll <= 0) return;
    const ctx = this.ctx;
    const trackH = this.H - 50;
    const thumbH = Math.max(30, (this.H / this.contentHeight) * trackH);
    const thumbY = 50 + (this.scrollY / this.maxScroll) * (trackH - thumbH);
    ctx.fillStyle = 'rgba(0,255,65,0.08)';
    ctx.fillRect(this.W - 6, 50, 4, trackH);
    ctx.fillStyle = 'rgba(0,255,65,0.25)';
    ctx.fillRect(this.W - 6, thumbY, 4, thumbH);
  }

  // ── Navigation ────────────────────────────────────────
  navigateTo(page: string) {
    this.currentPage = page;
    this.scrollY = 0;
    if (this.onNavigate) this.onNavigate(page);
  }

  // ── Events ────────────────────────────────────────────
  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      const worldY = e.clientY + this.scrollY;
      let found: HitRegion | null = null;
      for (const r of this.hitRegions) {
        if (e.clientX >= r.x && e.clientX <= r.x + r.w && worldY >= r.y && worldY <= r.y + r.h) {
          found = r;
          break;
        }
      }
      this.hoveredId = found?.id || null;
      this.canvas.style.cursor = found?.cursor || 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      const worldY = e.clientY + this.scrollY;
      for (const r of this.hitRegions) {
        if (e.clientX >= r.x && e.clientX <= r.x + r.w && worldY >= r.y && worldY <= r.y + r.h) {
          if (r.onClick) r.onClick();
          break;
        }
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + e.deltaY));
    }, { passive: false });

    // Touch scroll
    let touchY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      touchY = e.touches[0].clientY;
    }, { passive: true });
    this.canvas.addEventListener('touchmove', (e) => {
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + dy));
    }, { passive: true });
    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const worldY = touch.clientY + this.scrollY;
        for (const r of this.hitRegions) {
          if (touch.clientX >= r.x && touch.clientX <= r.x + r.w && worldY >= r.y && worldY <= r.y + r.h) {
            if (r.onClick) r.onClick();
            break;
          }
        }
      }
    });
  }

  // ── Render Loop ───────────────────────────────────────
  start() {
    const loop = (ts: number) => {
      this.time = ts;
      this.render();
      this.animFrame = requestAnimationFrame(loop);
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  render() {
    this.clear();
    this.drawParticles();

    const pageRenderer = this.pages.get(this.currentPage);
    if (pageRenderer) {
      this.contentHeight = pageRenderer(this, 60);
      this.maxScroll = Math.max(0, this.contentHeight - this.H + 100);
    }

    this.drawNav([
      { id: 'home', label: 'HOME' },
      { id: 'train', label: 'TRAINING' },
      { id: 'champions', label: 'CHAMPIONS' },
      { id: 'tierlist', label: 'TIER LIST' },
      { id: 'coaching', label: 'AI COACH' },
      { id: 'tft', label: 'TFT' },
      { id: 'coin', label: '$1V9' },
      { id: 'news', label: 'NEWS' },
      { id: 'community', label: 'COMMUNITY' },
    ]);

    this.drawScrollbar();
    this.drawScanlines();
  }
}

// ── Helpers ───────────────────────────────────────────────
type Particle = {
  x: number; y: number; vx: number; vy: number;
  r: number; a: number; color: string;
};

const fontSizeCache = new Map<string, number>();
export function parseFontSize(font: string): number {
  let cached = fontSizeCache.get(font);
  if (cached) return cached;
  const match = font.match(/(\d+)px/);
  cached = match ? parseInt(match[1]) : 14;
  fontSizeCache.set(font, cached);
  return cached;
}

// Grid layout helper
export function gridLayout(totalWidth: number, cols: number, gap: number, padding: number): { colW: number; getX: (col: number) => number } {
  const colW = (totalWidth - padding * 2 - gap * (cols - 1)) / cols;
  return {
    colW,
    getX: (col: number) => padding + col * (colW + gap),
  };
}
