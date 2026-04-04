const { createCanvas } = require('@napi-rs/canvas');

// ─── Generate Server Banner (960x540) ────────────────────────────────────────
function generateBanner(serverName = 'VIBE') {
  const w = 960, h = 540;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Background — dark gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0a0a0a');
  bg.addColorStop(0.5, '#0d1a0f');
  bg.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = 'rgba(0, 255, 65, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Scanlines
  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, y, w, 2);
  }

  // Glow circles
  const glow1 = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, 300);
  glow1.addColorStop(0, 'rgba(0, 255, 65, 0.08)');
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, w, h);

  const glow2 = ctx.createRadialGradient(w * 0.7, h * 0.6, 0, w * 0.7, h * 0.6, 250);
  glow2.addColorStop(0, 'rgba(0, 229, 255, 0.06)');
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, w, h);

  // Main title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title shadow/glow
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#00ff41';
  ctx.font = 'bold 120px "Courier New", monospace';
  ctx.fillText(serverName.toUpperCase(), w / 2, h / 2 - 30);

  // Subtitle
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#00aa2a';
  ctx.font = '24px "Courier New", monospace';
  ctx.fillText('T E R M I N A L  ·  v 2 . 0', w / 2, h / 2 + 50);

  // Bottom line
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0, 255, 65, 0.3)';
  ctx.fillRect(w * 0.2, h - 80, w * 0.6, 1);

  ctx.fillStyle = '#00aa2a';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText('[ THE FUTURE IS NOW ]', w / 2, h - 55);

  // Corner decorations
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur = 10;

  // Top-left corner
  ctx.beginPath(); ctx.moveTo(30, 60); ctx.lineTo(30, 30); ctx.lineTo(60, 30); ctx.stroke();
  // Top-right corner
  ctx.beginPath(); ctx.moveTo(w - 30, 60); ctx.lineTo(w - 30, 30); ctx.lineTo(w - 60, 30); ctx.stroke();
  // Bottom-left corner
  ctx.beginPath(); ctx.moveTo(30, h - 60); ctx.lineTo(30, h - 30); ctx.lineTo(60, h - 30); ctx.stroke();
  // Bottom-right corner
  ctx.beginPath(); ctx.moveTo(w - 30, h - 60); ctx.lineTo(w - 30, h - 30); ctx.lineTo(w - 60, h - 30); ctx.stroke();

  ctx.shadowBlur = 0;

  return canvas.toBuffer('image/png');
}

// ─── Generate Server Icon (512x512) ─────────────────────────────────────────
function generateIcon(letter = 'V') {
  const s = 512;
  const canvas = createCanvas(s, s);
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  bg.addColorStop(0, '#0d1a0f');
  bg.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s, s);

  // Grid
  ctx.strokeStyle = 'rgba(0, 255, 65, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < s; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
  }

  // Outer ring
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - 40, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.strokeStyle = '#00aa2a';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - 60, 0, Math.PI * 2);
  ctx.stroke();

  // Letter
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur = 50;
  ctx.fillStyle = '#00ff41';
  ctx.font = 'bold 260px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter.toUpperCase(), s / 2, s / 2 + 10);

  // Scanlines
  for (let y = 0; y < s; y += 4) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, y, s, 2);
  }

  ctx.shadowBlur = 0;

  return canvas.toBuffer('image/png');
}

// ─── Generate Welcome Card ──────────────────────────────────────────────────
function generateWelcomeCard(username, memberNumber) {
  const w = 800, h = 250;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = 'rgba(0, 255, 65, 0.04)';
  for (let x = 0; x < w; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }

  // Glow
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 400);
  glow.addColorStop(0, 'rgba(0, 255, 65, 0.05)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Border
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  // Text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#00ff41';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillText('> INCOMING TRANSMISSION', w / 2, 50);

  ctx.shadowBlur = 30;
  ctx.font = 'bold 42px "Courier New", monospace';
  ctx.fillText(username.toUpperCase(), w / 2, h / 2);

  ctx.shadowBlur = 10;
  ctx.fillStyle = '#00aa2a';
  ctx.font = '20px "Courier New", monospace';
  ctx.fillText(`MEMBER #${memberNumber} · CONNECTED TO THE GRID`, w / 2, h / 2 + 50);

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0, 170, 42, 0.5)';
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText('VIBE TERMINAL v2.0', w / 2, h - 30);

  return canvas.toBuffer('image/png');
}

module.exports = { generateBanner, generateIcon, generateWelcomeCard };
