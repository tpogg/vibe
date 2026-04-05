const { EmbedBuilder, MessageFlags } = require('discord.js');
const { colors, brand, feeds } = require('../config');
const { getGuildSettings } = require('../utils/database');

let lastNewsIds = new Set();

function startFeeds(client) {
  const interval = (feeds.intervalMinutes || 30) * 60_000;
  setTimeout(() => runAllFeeds(client), 60_000);
  setInterval(() => runAllFeeds(client), interval);
  console.log(`[FEEDS] Auto-feed started (every ${feeds.intervalMinutes}m)`);
}

async function safeFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

async function runAllFeeds(client) {
  for (const guild of client.guilds.cache.values()) {
    const settings = getGuildSettings(guild.id);
    if (!settings) continue;
    await postCrypto(guild, settings).catch(e => console.error('[FEED:CRYPTO]', e.message));
    await postNews(guild, settings).catch(e => console.error('[FEED:NEWS]', e.message));
    await postAI(guild, settings).catch(e => console.error('[FEED:AI]', e.message));
    await postStocks(guild, settings).catch(e => console.error('[FEED:STOCKS]', e.message));
  }
}

// Silent send — no notification ping
async function silentSend(ch, opts) {
  return ch.send({ ...opts, flags: [MessageFlags.SuppressNotifications] });
}

// ─── Crypto ──────────────────────────────────────────────────────────────────
async function postCrypto(guild, settings) {
  if (!settings.crypto_channel_id) return;
  const ch = guild.channels.cache.get(settings.crypto_channel_id);
  if (!ch) return;

  const coins = feeds.crypto.coins.join(',');
  const data = await safeFetch(`${feeds.crypto.apiUrl}/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`);

  const lines = Object.entries(data).map(([coin, info]) => {
    const price = info.usd?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || 'N/A';
    const change = info.usd_24h_change?.toFixed(2) || '0.00';
    const arrow = change >= 0 ? '▲' : '▼';
    const mcap = info.usd_market_cap ? `$${(info.usd_market_cap / 1e9).toFixed(2)}B` : '';
    return `**${coin.toUpperCase()}** · \`${price}\` ${arrow} \`${change}%\` ${mcap ? `· \`${mcap}\`` : ''}`;
  });

  await silentSend(ch, { embeds: [new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle('◉ CRYPTO')
    .setDescription(lines.join('\n'))
    .setFooter({ text: 'CoinGecko · auto-feed' })
    .setTimestamp()
  ] });
}

// ─── News ────────────────────────────────────────────────────────────────────
async function postNews(guild, settings) {
  if (!settings.news_channel_id) return;
  const ch = guild.channels.cache.get(settings.news_channel_id);
  if (!ch) return;

  const data = await safeFetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5');
  const articles = (data.hits || []).filter(a => !lastNewsIds.has(a.objectID)).slice(0, 5);
  if (!articles.length) return;

  articles.forEach(a => lastNewsIds.add(a.objectID));
  if (lastNewsIds.size > 200) lastNewsIds = new Set([...lastNewsIds].slice(-100));

  const lines = articles.map(a => {
    const url = a.url || `https://news.ycombinator.com/item?id=${a.objectID}`;
    return `[${a.title}](${url})\n↳ \`${a.points} pts\` · \`${a.num_comments} comments\``;
  });

  await silentSend(ch, { embeds: [new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle('◉ NEWS')
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: 'Hacker News · auto-feed' })
    .setTimestamp()
  ] });
}

// ─── AI ──────────────────────────────────────────────────────────────────────
async function postAI(guild, settings) {
  if (!settings.ai_channel_id) return;
  const ch = guild.channels.cache.get(settings.ai_channel_id);
  if (!ch) return;

  const data = await safeFetch('https://hn.algolia.com/api/v1/search?query=AI%20LLM%20GPT%20Claude%20OpenAI&tags=story&hitsPerPage=5');
  const articles = (data.hits || []).slice(0, 5);
  if (!articles.length) return;

  const lines = articles.map(a => {
    const url = a.url || `https://news.ycombinator.com/item?id=${a.objectID}`;
    return `[${a.title}](${url})\n↳ \`${a.points} pts\``;
  });

  await silentSend(ch, { embeds: [new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle('◉ AI DROPS')
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: 'AI News · auto-feed' })
    .setTimestamp()
  ] });
}

// ─── Stocks/Trending ─────────────────────────────────────────────────────────
async function postStocks(guild, settings) {
  if (!settings.stocks_channel_id) return;
  const ch = guild.channels.cache.get(settings.stocks_channel_id);
  if (!ch) return;

  const data = await safeFetch('https://api.coingecko.com/api/v3/search/trending');
  const coins = (data.coins || []).slice(0, 6);
  if (!coins.length) return;

  const lines = coins.map(c => {
    const item = c.item;
    const price = item.data?.price ? `$${parseFloat(item.data.price).toFixed(4)}` : '';
    return `**${item.symbol}** — ${item.name} ${price ? `· \`${price}\`` : ''} · Rank #${item.market_cap_rank || '?'}`;
  });

  await silentSend(ch, { embeds: [new EmbedBuilder()
    .setColor(colors.primary)
    .setTitle('◉ TRENDING')
    .setDescription(lines.join('\n'))
    .setFooter({ text: 'CoinGecko Trending · auto-feed' })
    .setTimestamp()
  ] });
}

module.exports = { startFeeds };
