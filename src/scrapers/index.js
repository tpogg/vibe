const pokemoncenter = require('./pokemoncenter');
const amazon = require('./amazon');
const walmart = require('./walmart');
const target = require('./target');
const bestbuy = require('./bestbuy');
const gamestop = require('./gamestop');
const tcgplayer = require('./tcgplayer');
const { delay } = require('./base-scraper');
const config = require('../config');
const { stmts, db } = require('../db');

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

  // Upsert products and detect stock changes
  const upsertMany = db.transaction((items) => {
    for (const product of items) {
      // Check previous state
      const existing = stmts.getProduct.get(product.retailer, product.url);
      const wasOutOfStock = !existing || existing.status === 'out-of-stock' || existing.status === 'unknown';
      const nowAvailable = product.status === 'in-stock' || product.status === 'pre-order';

      stmts.upsertProduct.run(product);

      if (nowAvailable) {
        inStockCount++;
        if (wasOutOfStock) {
          // New stock alert!
          const updated = stmts.getProduct.get(product.retailer, product.url);
          if (updated) {
            const alertType = product.status === 'pre-order' ? 'pre-order-available' : 'back-in-stock';
            const msg = `${product.name} is now ${product.status === 'pre-order' ? 'available for pre-order' : 'IN STOCK'} at ${retailerName} — $${product.price}`;
            stmts.createAlert.run(updated.id, alertType, msg);
            console.log(`[ALERT] ${msg}`);
          }
        }
      }

      // Detect new pre-releases
      if (product.is_prerelease && (!existing || !existing.is_prerelease)) {
        const updated = stmts.getProduct.get(product.retailer, product.url);
        if (updated) {
          stmts.createAlert.run(updated.id, 'new-prerelease', `New pre-release spotted: ${product.name} at ${retailerName}`);
        }
      }
    }
  });

  upsertMany(products);

  // Log the scan
  stmts.logScan.run(
    retailerName,
    error ? 'error' : 'success',
    products.length,
    inStockCount,
    error,
    duration
  );

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
    // Be polite — delay between retailers
    await delay(config.REQUEST_DELAY_MS);
  }

  console.log('[SCAN] Full scan complete:', JSON.stringify(results.map(r => `${r.retailer}: ${r.products} found, ${r.inStock} in stock`)));
  return results;
}

module.exports = { scanRetailer, scanAll, scrapers };
