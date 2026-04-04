const express = require('express');
const path = require('path');
const cron = require('node-cron');
const config = require('./config');
const routes = require('./api/routes');
const { scanAll } = require('./scrapers');
const { processPendingAlerts, sendSSE } = require('./notifications');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(routes);

// Serve the existing terminal page at /terminal
app.get('/terminal', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// SPA fallback — serve dashboard for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Scheduled scanning ───────────────────────────────────────────────────────
const cronExpression = `*/${config.SCAN_INTERVAL_MINUTES} * * * *`;

cron.schedule(cronExpression, async () => {
  console.log(`[CRON] Scheduled scan starting (every ${config.SCAN_INTERVAL_MINUTES} min)...`);
  try {
    sendSSE({ type: 'scan-start', timestamp: new Date().toISOString() });
    await scanAll();
    await processPendingAlerts();
    sendSSE({ type: 'scan-complete', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[CRON] Scan error:', err.message);
    sendSSE({ type: 'scan-error', error: err.message });
  }
});

// ── Self-ping keepalive (prevents Render free tier spin-down) ────────────────
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
  cron.schedule('*/4 * * * *', () => {
    const https = require('https');
    const http = require('http');
    const client = RENDER_URL.startsWith('https') ? https : http;
    client.get(`${RENDER_URL}/api/scan/status`, (res) => {
      console.log(`[KEEPALIVE] Pinged ${RENDER_URL} — ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('[KEEPALIVE] Ping failed:', err.message);
    });
  });
  console.log('[KEEPALIVE] Self-ping enabled every 4 minutes');
}

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(config.PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║       POKEMON CARD TRACKER v1.0                     ║
  ║       Scanning ${config.RETAILERS.length} retailers every ${config.SCAN_INTERVAL_MINUTES} minutes         ║
  ╠══════════════════════════════════════════════════════╣
  ║  Dashboard : http://localhost:${config.PORT}                  ║
  ║  API       : http://localhost:${config.PORT}/api              ║
  ║  Terminal  : http://localhost:${config.PORT}/terminal         ║
  ╚══════════════════════════════════════════════════════╝
  `);
});
