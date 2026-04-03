const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure data directory exists
const dataDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(config.DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    retailer TEXT NOT NULL,
    name TEXT NOT NULL,
    product_type TEXT NOT NULL,
    url TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    price REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'unknown',
    is_preorder INTEGER DEFAULT 0,
    is_prerelease INTEGER DEFAULT 0,
    release_date TEXT DEFAULT '',
    set_name TEXT DEFAULT '',
    last_seen_in_stock TEXT DEFAULT '',
    first_seen TEXT DEFAULT '',
    last_checked TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(retailer, url)
  );

  CREATE TABLE IF NOT EXISTS scan_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    retailer TEXT NOT NULL,
    status TEXT NOT NULL,
    products_found INTEGER DEFAULT 0,
    in_stock_count INTEGER DEFAULT 0,
    error_message TEXT DEFAULT '',
    duration_ms INTEGER DEFAULT 0,
    scanned_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    notified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    product_type TEXT DEFAULT '',
    retailer TEXT DEFAULT '',
    notify_discord INTEGER DEFAULT 1,
    notify_email INTEGER DEFAULT 0,
    notify_browser INTEGER DEFAULT 1,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_products_retailer ON products(retailer);
  CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
  CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
  CREATE INDEX IF NOT EXISTS idx_alerts_notified ON alerts(notified);
`);

// Prepared statements
const stmts = {
  upsertProduct: db.prepare(`
    INSERT INTO products (retailer, name, product_type, url, image_url, price, currency, status, is_preorder, is_prerelease, release_date, set_name, first_seen, last_checked)
    VALUES (@retailer, @name, @product_type, @url, @image_url, @price, @currency, @status, @is_preorder, @is_prerelease, @release_date, @set_name, datetime('now'), datetime('now'))
    ON CONFLICT(retailer, url) DO UPDATE SET
      name = @name,
      price = @price,
      status = @status,
      is_preorder = @is_preorder,
      is_prerelease = @is_prerelease,
      release_date = @release_date,
      image_url = CASE WHEN @image_url != '' THEN @image_url ELSE products.image_url END,
      last_checked = datetime('now'),
      last_seen_in_stock = CASE WHEN @status = 'in-stock' OR @status = 'pre-order' THEN datetime('now') ELSE products.last_seen_in_stock END,
      updated_at = datetime('now')
  `),

  getProduct: db.prepare('SELECT * FROM products WHERE retailer = ? AND url = ?'),

  getAllProducts: db.prepare(`
    SELECT * FROM products ORDER BY
      CASE status WHEN 'in-stock' THEN 0 WHEN 'pre-order' THEN 1 WHEN 'pre-release' THEN 2 ELSE 3 END,
      updated_at DESC
  `),

  getProductsByRetailer: db.prepare('SELECT * FROM products WHERE retailer = ? ORDER BY updated_at DESC'),

  getProductsByType: db.prepare('SELECT * FROM products WHERE product_type = ? ORDER BY updated_at DESC'),

  getInStockProducts: db.prepare(`
    SELECT * FROM products WHERE status IN ('in-stock', 'pre-order')
    ORDER BY updated_at DESC
  `),

  searchProducts: db.prepare(`
    SELECT * FROM products WHERE name LIKE '%' || ? || '%'
    ORDER BY updated_at DESC
  `),

  logScan: db.prepare(`
    INSERT INTO scan_log (retailer, status, products_found, in_stock_count, error_message, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  getRecentScans: db.prepare('SELECT * FROM scan_log ORDER BY scanned_at DESC LIMIT 50'),

  createAlert: db.prepare(`
    INSERT INTO alerts (product_id, alert_type, message)
    VALUES (?, ?, ?)
  `),

  getPendingAlerts: db.prepare('SELECT a.*, p.name, p.url, p.retailer, p.price, p.status FROM alerts a JOIN products p ON a.product_id = p.id WHERE a.notified = 0'),

  markAlertNotified: db.prepare('UPDATE alerts SET notified = 1 WHERE id = ?'),

  addToWatchlist: db.prepare(`
    INSERT INTO watchlist (keyword, product_type, retailer) VALUES (?, ?, ?)
  `),

  getWatchlist: db.prepare('SELECT * FROM watchlist WHERE active = 1'),

  removeFromWatchlist: db.prepare('UPDATE watchlist SET active = 0 WHERE id = ?'),

  getStats: db.prepare(`
    SELECT
      COUNT(*) as total_products,
      SUM(CASE WHEN status = 'in-stock' THEN 1 ELSE 0 END) as in_stock,
      SUM(CASE WHEN status = 'pre-order' THEN 1 ELSE 0 END) as pre_orders,
      SUM(CASE WHEN status = 'pre-release' THEN 1 ELSE 0 END) as pre_releases,
      SUM(CASE WHEN status = 'out-of-stock' THEN 1 ELSE 0 END) as out_of_stock,
      COUNT(DISTINCT retailer) as retailers_tracked
    FROM products
  `),
};

module.exports = { db, stmts };
