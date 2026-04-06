const pokemoncenter = require('./pokemoncenter');
const amazon = require('./amazon');
const walmart = require('./walmart');
const target = require('./target');
const bestbuy = require('./bestbuy');
const gamestop = require('./gamestop');
const tcgplayer = require('./tcgplayer');
const { delay } = require('./base-scraper');
const config = require('../config');
const db = require('../db');

const scrapers = {
  pokemoncenter,
  amazon,
  walmart,
  target,
  bestbuy,
  gamestop,
  tcgplayer,
};

async function scanRetailer(retailerName) {
  const scraper = scrapers[retailerName];
  if (!scraper) throw new Error(`Unknown retailer: ${retailerName}`);

  const start = Date.now();
  let products = [];
  let error = '';

  try {
    console.log(`[SCAN] Starting scan of ${retailerName}...`);
    products = await scraper.scrape();
    console.log(`[SCAN] ${retailerName}: found ${products.length} products`);
  } catch (err) {
    error = err.message;
    console.error(`[SCAN] ${retailerName} failed:`, err.message);
  }

  const duration = Date.now() - start;
  let inStockCount = 0;

  for (const product of products) {
    const existing = db.getProduct(product.retailer, product.url);
    const wasOutOfStock = !existing || existing.status === 'out-of-stock' || existing.status === 'unknown';
    const nowAvailable = product.status === 'in-stock' || product.status === 'pre-order';

    db.upsertProduct(product);

    if (nowAvailable) {
      inStockCount++;
      if (wasOutOfStock) {
        const updated = db.getProduct(product.retailer, product.url);
        if (updated) {
          const alertType = product.status === 'pre-order' ? 'pre-order-available' : 'back-in-stock';
          const msg = `${product.name} is now ${product.status === 'pre-order' ? 'available for pre-order' : 'IN STOCK'} at ${retailerName} — $${product.price}`;
          db.createAlert(updated.id, alertType, msg);
          console.log(`[ALERT] ${msg}`);
        }
      }
    }

    if (product.is_prerelease && (!existing || !existing.is_prerelease)) {
      const updated = db.getProduct(product.retailer, product.url);
      if (updated) {
        db.createAlert(updated.id, 'new-prerelease', `New pre-release spotted: ${product.name} at ${retailerName}`);
      }
    }
  }

  db.logScan(retailerName, error ? 'error' : 'success', products.length, inStockCount, error, duration);

  return { retailer: retailerName, products: products.length, inStock: inStockCount, error, duration };
}

async function scanAll() {
  console.log('[SCAN] Starting full scan of all retailers...');
  const results = [];

  for (const retailerName of config.RETAILERS) {
    try {
      const result = await scanRetailer(retailerName);
      results.push(result);
    } catch (err) {
      results.push({ retailer: retailerName, products: 0, inStock: 0, error: err.message, duration: 0 });
    }
    await delay(config.REQUEST_DELAY_MS);
  }

  console.log('[SCAN] Full scan complete:', JSON.stringify(results.map(r => `${r.retailer}: ${r.products} found, ${r.inStock} in stock`)));
  return results;
}

module.exports = { scanRetailer, scanAll, scrapers };
