require('dotenv').config();
const path = require('path');

module.exports = {
  // Server
  PORT: process.env.PORT || 3000,

  // Database
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'tracker.db'),

  // Scan interval in minutes (default: every 5 minutes)
  SCAN_INTERVAL_MINUTES: parseInt(process.env.SCAN_INTERVAL_MINUTES || '5', 10),

  // Notifications
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || '',
  EMAIL_ENABLED: process.env.EMAIL_ENABLED === 'true',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_TO: process.env.EMAIL_TO || '',

  // Twilio SMS
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER || '',
  TWILIO_TO_NUMBER: process.env.TWILIO_TO_NUMBER || '',

  // Request settings
  REQUEST_TIMEOUT_MS: 15000,
  REQUEST_DELAY_MS: 2000, // delay between retailer requests to be polite

  // Product categories we track
  PRODUCT_TYPES: ['booster-box', 'elite-trainer-box', 'booster-bundle'],
  PRODUCT_STATUSES: ['in-stock', 'out-of-stock', 'pre-order', 'pre-release', 'unknown'],

  // Retailers
  RETAILERS: [
    'pokemoncenter',
    'amazon',
    'walmart',
    'target',
    'bestbuy',
    'gamestop',
    'tcgplayer',
  ],
};
