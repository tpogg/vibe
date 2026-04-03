const https = require('https');
const nodemailer = require('nodemailer');
const config = require('../config');
const { stmts } = require('../db');

// Connected SSE clients for browser push
const sseClients = new Set();

function addSSEClient(res) {
  sseClients.add(res);
  res.on('close', () => sseClients.delete(res));
}

function sendSSE(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(msg);
  }
}

// Discord webhook notification
async function sendDiscord(message, embeds = []) {
  if (!config.DISCORD_WEBHOOK_URL) return;

  const payload = JSON.stringify({
    content: message,
    embeds: embeds.map(e => ({
      title: e.title || '',
      description: e.description || '',
      url: e.url || '',
      color: e.color || 0x00ff41,
      fields: e.fields || [],
      thumbnail: e.thumbnail ? { url: e.thumbnail } : undefined,
      timestamp: new Date().toISOString(),
    })),
  });

  return new Promise((resolve, reject) => {
    const url = new URL(config.DISCORD_WEBHOOK_URL);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Email notification
let emailTransport = null;
function getEmailTransport() {
  if (!emailTransport && config.EMAIL_ENABLED) {
    emailTransport = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_PORT === 465,
      auth: { user: config.EMAIL_USER, pass: config.EMAIL_PASS },
    });
  }
  return emailTransport;
}

async function sendEmail(subject, html) {
  const transport = getEmailTransport();
  if (!transport) return;

  await transport.sendMail({
    from: config.EMAIL_USER,
    to: config.EMAIL_TO,
    subject,
    html,
  });
}

// Process pending alerts and send notifications
async function processPendingAlerts() {
  const alerts = stmts.getPendingAlerts.all();
  if (alerts.length === 0) return;

  console.log(`[NOTIFY] Processing ${alerts.length} pending alerts...`);

  for (const alert of alerts) {
    try {
      // Browser push via SSE
      sendSSE({
        type: 'alert',
        alert: {
          id: alert.id,
          alertType: alert.alert_type,
          message: alert.message,
          product: {
            name: alert.name,
            url: alert.url,
            retailer: alert.retailer,
            price: alert.price,
            status: alert.status,
          },
          createdAt: alert.created_at,
        },
      });

      // Discord
      if (config.DISCORD_WEBHOOK_URL) {
        const color = alert.alert_type === 'back-in-stock' ? 0x00ff41
          : alert.alert_type === 'pre-order-available' ? 0xffb000
          : 0x00e5ff;

        await sendDiscord('', [{
          title: alertTypeLabel(alert.alert_type),
          description: alert.message,
          url: alert.url,
          color,
          fields: [
            { name: 'Retailer', value: alert.retailer, inline: true },
            { name: 'Price', value: alert.price ? `$${alert.price.toFixed(2)}` : 'N/A', inline: true },
            { name: 'Status', value: alert.status, inline: true },
          ],
        }]);
      }

      // Email
      if (config.EMAIL_ENABLED) {
        await sendEmail(
          `Pokemon TCG Alert: ${alert.name}`,
          buildEmailHTML(alert)
        );
      }

      stmts.markAlertNotified.run(alert.id);
    } catch (err) {
      console.error(`[NOTIFY] Failed to send alert ${alert.id}:`, err.message);
    }
  }
}

function alertTypeLabel(type) {
  switch (type) {
    case 'back-in-stock': return 'BACK IN STOCK!';
    case 'pre-order-available': return 'PRE-ORDER AVAILABLE!';
    case 'new-prerelease': return 'NEW PRE-RELEASE SPOTTED';
    default: return 'ALERT';
  }
}

function buildEmailHTML(alert) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: #00ff41; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">${alertTypeLabel(alert.alert_type)}</h1>
      </div>
      <div style="background: #16213e; color: #e0e0e0; padding: 20px;">
        <h2 style="color: #ffb000; margin-top: 0;">${alert.name}</h2>
        <p><strong>Retailer:</strong> ${alert.retailer}</p>
        <p><strong>Price:</strong> ${alert.price ? '$' + alert.price.toFixed(2) : 'N/A'}</p>
        <p><strong>Status:</strong> ${alert.status}</p>
        <a href="${alert.url}" style="display: inline-block; background: #00ff41; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px;">
          BUY NOW
        </a>
      </div>
      <div style="background: #0f3460; color: #888; padding: 12px 20px; border-radius: 0 0 8px 8px; font-size: 12px;">
        Pokemon Card Tracker | Sent at ${new Date().toISOString()}
      </div>
    </div>
  `;
}

module.exports = { addSSEClient, sendSSE, sendDiscord, sendEmail, processPendingAlerts };
