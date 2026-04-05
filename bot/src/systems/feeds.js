const { EmbedBuilder } = require('discord.js');
const { colors, brand, feeds } = require('../config');
const { getGuildSettings } = require('../utils/database');

let lastNewsIds = new Set();
let lastCryptoPost = 0;

function startFeeds(client) {
  const interval = (feeds.intervalMinutes || 30) * 60_000;

  // Initial post after 60s delay (let bot fully load)
  setTimeout(() => runAllFeeds(client), 60_000);
  // Then on interval
  setInterval(() => runAllFeeds(client), interval);
  console.log(`[FEEDS] Auto-feed started (every ${feeds.intervalMinutes}m)`);
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

// ─── Crypto Feed ─────────────────────────────────────────────────────────────
async function postCrypto(guild, settings) {
  if (!settings.crypto_channel_id) return;
  const ch = guild.channels.cache.get(settings.crypto_channel_id);
  if (!ch) return;

  const coins = feeds.crypto.coins.join(',');
  const res = await fetch(`${feeds.crypto.apiUrl}/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`);
  const data = await res.json();

  const lines = Object.entries(data).map(([coin, info]) => {
    const price = info.usd?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || 'N/A';
    const change = info.usd_24h_change?.toFixed(2) || '0.00';
    const arrow = change >= 0 ? '▲' : '▼';
    const mcap = info.usd_market_cap ? `$${(info.usd_market_cap / 1e9).toFixed(2)}B` : '';
    return `**${coin.toUpperCase()}** · \`${price}\` ${arrow} \`${change}%\` ${mcap ? `· \`${mcap}\`` : ''}`;
  });

  const embed = new EmbedBuilder()
    .setColor(colors.warning)
    .setDescription(lines.join('\n'))
    .setFooter({ text: `CoinGecko · auto-feed` })
    .setTimestamp();

  await ch.send({ embeds: [embed] });
}

// ─── News Feed ───────────────────────────────────────────────────────────────
async function postNews(guild, settings) {
  if (!settings.news_channel_id) return;
  const ch = guild.channels.cache.get(settings.news_channel_id);
  if (!ch) return;

  const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5');
  const data = await res.json();
  const articles = (data.hits || []).filter(a => !lastNewsIds.has(a.objectID)).slice(0, 5);

  if (!articles.length) return;

  articles.forEach(a => lastNewsIds.add(a.objectID));
  // Keep set from growing forever
  if (lastNewsIds.size > 200) lastNewsIds = new Set([...lastNewsIds].slice(-100));

  const lines = articles.map(a => {
    const url = a.url || `https://news.ycombinator.com/item?id=${a.objectID}`;
    return `[${a.title}](${url})\n↳ \`${a.points} pts\` · \`${a.num_comments} comments\``;
  });

  const embed = new EmbedBuilder()
    .setColor(colors.secondary)
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: 'Hacker News · auto-feed' })
    .setTimestamp();

  await ch.send({ embeds: [embed] });
}

// ─── AI Feed ─────────────────────────────────────────────────────────────────
async function postAI(guild, settings) {
  if (!settings.ai_channel_id) return;
  const ch = guild.channels.cache.get(settings.ai_channel_id);
  if (!ch) return;

  const res = await fetch('https://hn.algolia.com/api/v1/search?query=AI%20LLM%20GPT%20Claude%20OpenAI&tags=story&hitsPerPage=5');
  const data = await res.json();
  const articles = (data.hits || []).slice(0, 5);

  if (!articles.length) return;

  const lines = articles.map(a => {
    const url = a.url || `https://news.ycombinator.com/item?id=${a.objectID}`;
    return `[${a.title}](${url})\n↳ \`${a.points} pts\``;
  });

  const embed = new EmbedBuilder()
    .setColor(colors.accent)
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: 'AI News · auto-feed' })
    .setTimestamp();

  await ch.send({ embeds: [embed] });
}

// ─── Stocks/Trending Feed ────────────────────────────────────────────────────
async function postStocks(guild, settings) {
  if (!settings.stocks_channel_id) return;
  const ch = guild.channels.cache.get(settings.stocks_channel_id);
  if (!ch) return;

  const res = await fetch('https://api.coingecko.com/api/v3/search/trending');
  const data = await res.json();
  const coins = (data.coins || []).slice(0, 6);

  if (!coins.length) return;

  const lines = coins.map(c => {
    const item = c.item;
    const price = item.data?.price ? `$${parseFloat(item.data.price).toFixed(4)}` : '';
    return `**${item.symbol}** — ${item.name} ${price ? `· \`${price}\`` : ''} · Rank #${item.market_cap_rank || '?'}`;
  });

  const embed = new EmbedBuilder()
    .setColor(colors.primary)
    .setDescription(lines.join('\n'))
    .setFooter({ text: 'CoinGecko Trending · auto-feed' })
    .setTimestamp();

  await ch.send({ embeds: [embed] });
}

module.exports = { startFeeds };
