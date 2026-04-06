const fs = require('fs');
const path = require('path');
const config = require('../config');

const dataDir = path.dirname(config.DB_PATH);
const dbFile = config.DB_PATH.replace('.db', '.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory store with JSON file persistence
let store = {
  products: [],
  scanLog: [],
  alerts: [],
  watchlist: [],
  nextId: { products: 1, scanLog: 1, alerts: 1, watchlist: 1 },
};

// Load from disk if exists
function load() {
  try {
    if (fs.existsSync(dbFile)) {
      store = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    }
  } catch (err) {
    console.error('[DB] Failed to load:', err.message);
  }
}

// Save to disk (debounced)
let saveTimeout = null;
function save() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(store, null, 2));
    } catch (err) {
      console.error('[DB] Failed to save:', err.message);
    }
  }, 500);
}

function saveSync() {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('[DB] Failed to save:', err.message);
  }
}

load();

// ── Product operations ─────────────────────────────────────────────────────
function upsertProduct(product) {
  const now = new Date().toISOString();
  const idx = store.products.findIndex(p => p.retailer === product.retailer && p.url === product.url);

  if (idx >= 0) {
    const existing = store.products[idx];
    store.products[idx] = {
      ...existing,
      name: product.name,
      price: product.price,
      status: product.status,
      is_preorder: product.is_preorder,
      is_prerelease: product.is_prerelease,
      release_date: product.release_date,
      image_url: product.image_url || existing.image_url,
      last_checked: now,
      last_seen_in_stock: (product.status === 'in-stock' || product.status === 'pre-order') ? now : existing.last_seen_in_stock,
      updated_at: now,
    };
    save();
    return existing; // return previous state
  } else {
    const newProduct = {
      id: store.nextId.products++,
      ...product,
      first_seen: now,
      last_checked: now,
      last_seen_in_stock: (product.status === 'in-stock' || product.status === 'pre-order') ? now : '',
      created_at: now,
      updated_at: now,
    };
    store.products.push(newProduct);
    save();
    return null; // no previous state
  }
}

function getProduct(retailer, url) {
  return store.products.find(p => p.retailer === retailer && p.url === url) || null;
}

function getAllProducts() {
  const order = { 'in-stock': 0, 'pre-order': 1, 'pre-release': 2, 'out-of-stock': 3, 'unknown': 4 };
  return [...store.products].sort((a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4) || b.updated_at?.localeCompare(a.updated_at));
}

function getProductsByRetailer(retailer) {
  return store.products.filter(p => p.retailer === retailer).sort((a, b) => b.updated_at?.localeCompare(a.updated_at));
}

function getProductsByType(type) {
  return store.products.filter(p => p.product_type === type).sort((a, b) => b.updated_at?.localeCompare(a.updated_at));
}

function getInStockProducts() {
  return store.products.filter(p => p.status === 'in-stock' || p.status === 'pre-order').sort((a, b) => b.updated_at?.localeCompare(a.updated_at));
}

function searchProducts(query) {
  const q = query.toLowerCase();
  return store.products.filter(p => p.name.toLowerCase().includes(q)).sort((a, b) => b.updated_at?.localeCompare(a.updated_at));
}

// ── Scan log ───────────────────────────────────────────────────────────────
function logScan(retailer, status, productsFound, inStockCount, errorMessage, durationMs) {
  const entry = {
    id: store.nextId.scanLog++,
    retailer,
    status,
    products_found: productsFound,
    in_stock_count: inStockCount,
    error_message: errorMessage,
    duration_ms: durationMs,
    scanned_at: new Date().toISOString(),
  };
  store.scanLog.unshift(entry);
  // Keep only last 200 entries
  if (store.scanLog.length > 200) store.scanLog = store.scanLog.slice(0, 200);
  save();
  return entry;
}

function getRecentScans() {
  return store.scanLog.slice(0, 50);
}

// ── Alerts ─────────────────────────────────────────────────────────────────
function createAlert(productId, alertType, message) {
  const alert = {
    id: store.nextId.alerts++,
    product_id: productId,
    alert_type: alertType,
    message,
    notified: 0,
    created_at: new Date().toISOString(),
  };
  store.alerts.unshift(alert);
  if (store.alerts.length > 500) store.alerts = store.alerts.slice(0, 500);
  save();
  return alert;
}

function getPendingAlerts() {
  return store.alerts
    .filter(a => a.notified === 0)
    .map(a => {
      const product = store.products.find(p => p.id === a.product_id) || {};
      return { ...a, name: product.name, url: product.url, retailer: product.retailer, price: product.price, status: product.status };
    });
}

function markAlertNotified(id) {
  const alert = store.alerts.find(a => a.id === id);
  if (alert) { alert.notified = 1; save(); }
}

// ── Watchlist ──────────────────────────────────────────────────────────────
function addToWatchlist(keyword, productType, retailer) {
  const item = {
    id: store.nextId.watchlist++,
    keyword,
    product_type: productType || '',
    retailer: retailer || '',
    active: 1,
    created_at: new Date().toISOString(),
  };
  store.watchlist.push(item);
  save();
  return item;
}

function getWatchlist() {
  return store.watchlist.filter(w => w.active === 1);
}

function removeFromWatchlist(id) {
  const item = store.watchlist.find(w => w.id === id);
  if (item) { item.active = 0; save(); }
}

// ── Stats ──────────────────────────────────────────────────────────────────
function getStats() {
  const products = store.products;
  return {
    total_products: products.length,
    in_stock: products.filter(p => p.status === 'in-stock').length,
    pre_orders: products.filter(p => p.status === 'pre-order').length,
    pre_releases: products.filter(p => p.status === 'pre-release').length,
    out_of_stock: products.filter(p => p.status === 'out-of-stock').length,
    retailers_tracked: new Set(products.map(p => p.retailer)).size,
  };
}

module.exports = {
  upsertProduct,
  getProduct,
  getAllProducts,
  getProductsByRetailer,
  getProductsByType,
  getInStockProducts,
  searchProducts,
  logScan,
  getRecentScans,
  createAlert,
  getPendingAlerts,
  markAlertNotified,
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  getStats,
  saveSync,
};
