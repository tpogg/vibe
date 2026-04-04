const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'vibe.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function initDatabase() {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS xp (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      messages INTEGER DEFAULT 0,
      last_xp_at INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS starboard (
      message_id TEXT PRIMARY KEY,
      starboard_message_id TEXT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      stars INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      welcome_channel_id TEXT,
      log_channel_id TEXT,
      starboard_channel_id TEXT,
      ticket_category_id TEXT,
      autorole_id TEXT,
      setup_complete INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);
}

// ─── XP Helpers ──────────────────────────────────────────────────────────────
function getXp(userId, guildId) {
  return getDb().prepare('SELECT * FROM xp WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
}

function addXp(userId, guildId, amount) {
  const d = getDb();
  d.prepare(`
    INSERT INTO xp (user_id, guild_id, xp, messages, last_xp_at)
    VALUES (?, ?, ?, 1, unixepoch())
    ON CONFLICT(user_id, guild_id) DO UPDATE SET
      xp = xp + ?,
      messages = messages + 1,
      last_xp_at = unixepoch()
  `).run(userId, guildId, amount, amount);
  return getXp(userId, guildId);
}

function setLevel(userId, guildId, level) {
  getDb().prepare('UPDATE xp SET level = ? WHERE user_id = ? AND guild_id = ?').run(level, userId, guildId);
}

function getLeaderboard(guildId, limit = 10) {
  return getDb().prepare('SELECT * FROM xp WHERE guild_id = ? ORDER BY xp DESC LIMIT ?').all(guildId, limit);
}

// ─── Guild Settings ──────────────────────────────────────────────────────────
function getGuildSettings(guildId) {
  const d = getDb();
  d.prepare('INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)').run(guildId);
  return d.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
}

function updateGuildSetting(guildId, key, value) {
  const d = getDb();
  d.prepare('INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)').run(guildId);
  d.prepare(`UPDATE guild_settings SET ${key} = ? WHERE guild_id = ?`).run(value, guildId);
}

// ─── Starboard ───────────────────────────────────────────────────────────────
function getStarboardEntry(messageId) {
  return getDb().prepare('SELECT * FROM starboard WHERE message_id = ?').get(messageId);
}

function upsertStarboardEntry(messageId, data) {
  getDb().prepare(`
    INSERT INTO starboard (message_id, starboard_message_id, guild_id, channel_id, author_id, stars)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(message_id) DO UPDATE SET
      stars = ?,
      starboard_message_id = COALESCE(?, starboard_message_id)
  `).run(messageId, data.starboardMessageId, data.guildId, data.channelId, data.authorId, data.stars, data.stars, data.starboardMessageId);
}

// ─── Tickets ─────────────────────────────────────────────────────────────────
function createTicket(guildId, channelId, userId) {
  return getDb().prepare('INSERT INTO tickets (guild_id, channel_id, user_id) VALUES (?, ?, ?)').run(guildId, channelId, userId);
}

function closeTicket(channelId) {
  getDb().prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?").run(channelId);
}

function getOpenTickets(guildId, userId) {
  return getDb().prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'").all(guildId, userId);
}

// ─── Warnings ────────────────────────────────────────────────────────────────
function addWarning(guildId, userId, moderatorId, reason) {
  return getDb().prepare('INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)').run(guildId, userId, moderatorId, reason);
}

function getWarnings(guildId, userId) {
  return getDb().prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
}

module.exports = {
  initDatabase, getDb,
  getXp, addXp, setLevel, getLeaderboard,
  getGuildSettings, updateGuildSetting,
  getStarboardEntry, upsertStarboardEntry,
  createTicket, closeTicket, getOpenTickets,
  addWarning, getWarnings,
};
