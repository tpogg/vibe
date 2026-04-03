const https = require('https');
const http = require('http');
const config = require('../config');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function fetchPage(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      timeout: config.REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        ...options.headers,
      },
    };

    const req = client.request(reqOptions, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href;
        return fetchPage(redirectUrl, options).then(resolve).catch(reject);
      }

      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });

    req.on('timeout', () => { req.destroy(); reject(new Error(`Request timed out: ${url}`)); });
    req.on('error', reject);
    req.end();
  });
}

function fetchJSON(url, options = {}) {
  return fetchPage(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
  }).then(res => ({
    ...res,
    data: JSON.parse(res.body),
  }));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function classifyProduct(name) {
  const lower = name.toLowerCase();
  if (lower.includes('elite trainer box') || lower.includes('etb')) return 'elite-trainer-box';
  if (lower.includes('booster box') || lower.includes('booster display')) return 'booster-box';
  if (lower.includes('booster bundle') || lower.includes('booster pack bundle')) return 'booster-bundle';
  if (lower.includes('booster')) return 'booster-box';
  return 'booster-box';
}

function detectPreorder(name, statusText = '') {
  const combined = (name + ' ' + statusText).toLowerCase();
  return combined.includes('pre-order') || combined.includes('preorder') || combined.includes('pre order');
}

function detectPrerelease(name, statusText = '') {
  const combined = (name + ' ' + statusText).toLowerCase();
  return combined.includes('pre-release') || combined.includes('prerelease') || combined.includes('coming soon');
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const match = priceStr.replace(/[^0-9.]/g, '');
  return parseFloat(match) || 0;
}

function isPokemonTCGProduct(name) {
  const lower = name.toLowerCase();
  const hasPokemon = lower.includes('pokemon') || lower.includes('pokémon') || lower.includes('pok\u00e9mon');
  const hasCard = lower.includes('booster') || lower.includes('elite trainer') || lower.includes('etb') ||
    lower.includes('display') || lower.includes('tcg') || lower.includes('trading card');
  return hasPokemon && hasCard;
}

module.exports = {
  fetchPage,
  fetchJSON,
  delay,
  classifyProduct,
  detectPreorder,
  detectPrerelease,
  parsePrice,
  isPokemonTCGProduct,
  randomUA,
};
