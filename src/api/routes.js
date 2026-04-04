const express = require('express');
const { stmts } = require('../db');
const { scanAll, scanRetailer } = require('../scrapers');
const { addSSEClient, processPendingAlerts, sendDiscord, sendSMS } = require('../notifications');
const config = require('../config');

const router = express.Router();

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/api/stats', (req, res) => {
  const stats = stmts.getStats.get();
  res.json(stats);
});

// ── Products ─────────────────────────────────────────────────────────────────
router.get('/api/products', (req, res) => {
  const { retailer, type, status, search } = req.query;

  let products;
  if (search) {
    products = stmts.searchProducts.all(search);
  } else if (retailer) {
    products = stmts.getProductsByRetailer.all(retailer);
  } else if (type) {
    products = stmts.getProductsByType.all(type);
  } else if (status === 'in-stock') {
    products = stmts.getInStockProducts.all();
  } else {
    products = stmts.getAllProducts.all();
  }

  res.json(products);
});

// ── Scan controls ────────────────────────────────────────────────────────────
let scanning = false;

router.post('/api/scan', async (req, res) => {
  if (scanning) return res.status(409).json({ error: 'Scan already in progress' });
  scanning = true;
  try {
    const results = await scanAll();
    await processPendingAlerts();
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    scanning = false;
  }
});

router.post('/api/scan/:retailer', async (req, res) => {
  const { retailer } = req.params;
  if (!config.RETAILERS.includes(retailer)) {
    return res.status(400).json({ error: `Unknown retailer: ${retailer}` });
  }
  try {
    const result = await scanRetailer(retailer);
    await processPendingAlerts();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/scan/status', (req, res) => {
  res.json({ scanning });
});

// ── Scan logs ────────────────────────────────────────────────────────────────
router.get('/api/scans', (req, res) => {
  const scans = stmts.getRecentScans.all();
  res.json(scans);
});

// ── Watchlist ────────────────────────────────────────────────────────────────
router.get('/api/watchlist', (req, res) => {
  const items = stmts.getWatchlist.all();
  res.json(items);
});

router.post('/api/watchlist', (req, res) => {
  const { keyword, product_type, retailer } = req.body;
  if (!keyword) return res.status(400).json({ error: 'keyword is required' });
  stmts.addToWatchlist.run(keyword, product_type || '', retailer || '');
  res.json({ success: true });
});

router.delete('/api/watchlist/:id', (req, res) => {
  stmts.removeFromWatchlist.run(req.params.id);
  res.json({ success: true });
});

// ── SSE for live notifications ───────────────────────────────────────────────
router.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  addSSEClient(res);
});

// ── Test notifications ───────────────────────────────────────────────────────
router.post('/api/test/discord', async (req, res) => {
  if (!config.DISCORD_WEBHOOK_URL) return res.status(400).json({ error: 'DISCORD_WEBHOOK_URL not set' });
  try {
    await sendDiscord('', [{
      title: 'Pokemon Card Tracker — Test Alert',
      description: 'Your Discord webhook is working! Stock alerts will appear here.',
      color: 0x00ff41,
      fields: [
        { name: 'Retailers', value: 'Pokemon Center, Amazon, Walmart, Target, Best Buy, GameStop, TCGPlayer', inline: false },
        { name: 'Status', value: 'CONNECTED', inline: true },
      ],
    }]);
    res.json({ success: true, message: 'Test message sent to Discord' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/test/sms', async (req, res) => {
  if (!config.TWILIO_ACCOUNT_SID) return res.status(400).json({ error: 'Twilio not configured' });
  try {
    await sendSMS('Pokemon Card Tracker — Test alert! If you see this, SMS notifications are working.');
    res.json({ success: true, message: 'Test SMS sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Config (read-only, no secrets) ───────────────────────────────────────────
router.get('/api/config', (req, res) => {
  res.json({
    scanIntervalMinutes: config.SCAN_INTERVAL_MINUTES,
    retailers: config.RETAILERS,
    productTypes: config.PRODUCT_TYPES,
    discordEnabled: !!config.DISCORD_WEBHOOK_URL,
    smsEnabled: !!config.TWILIO_ACCOUNT_SID,
    emailEnabled: config.EMAIL_ENABLED,
  });
});

module.exports = router;
