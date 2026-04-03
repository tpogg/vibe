const cheerio = require('cheerio');
const { fetchPage, classifyProduct, detectPreorder, detectPrerelease, parsePrice, isPokemonTCGProduct } = require('./base-scraper');

const RETAILER = 'pokemoncenter';
const BASE_URL = 'https://www.pokemoncenter.com';

const SEARCH_URLS = [
  `${BASE_URL}/category/trading-card-game?refinementList%5Bproduct_type%5D%5B0%5D=Booster%20Box&refinementList%5Bproduct_type%5D%5B1%5D=Elite%20Trainer%20Box`,
  `${BASE_URL}/category/trading-card-game?refinementList%5Bproduct_type%5D%5B0%5D=Booster%20Bundle`,
];

async function scrape() {
  const products = [];

  for (const searchUrl of SEARCH_URLS) {
    try {
      const { body } = await fetchPage(searchUrl);
      const $ = cheerio.load(body);

      // Pokemon Center uses dynamic rendering; parse what we can from SSR
      $('a[href*="/product/"]').each((_, el) => {
        const $el = $(el);
        const name = $el.find('[class*="product-name"], [class*="title"], h3, h2').first().text().trim()
          || $el.attr('aria-label') || '';

        if (!name || !isPokemonTCGProduct(name)) return;

        const url = BASE_URL + ($el.attr('href') || '');
        const priceText = $el.find('[class*="price"]').first().text().trim();
        const imageUrl = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';
        const statusText = $el.find('[class*="status"], [class*="availability"], [class*="badge"]').text().trim();

        let status = 'unknown';
        const lower = statusText.toLowerCase();
        if (lower.includes('add to') || lower.includes('in stock') || lower.includes('available')) {
          status = 'in-stock';
        } else if (lower.includes('out of stock') || lower.includes('sold out')) {
          status = 'out-of-stock';
        } else if (detectPreorder(name, statusText)) {
          status = 'pre-order';
        } else if (detectPrerelease(name, statusText)) {
          status = 'pre-release';
        }

        products.push({
          retailer: RETAILER,
          name,
          product_type: classifyProduct(name),
          url,
          image_url: imageUrl,
          price: parsePrice(priceText),
          currency: 'USD',
          status,
          is_preorder: detectPreorder(name, statusText) ? 1 : 0,
          is_prerelease: detectPrerelease(name, statusText) ? 1 : 0,
          release_date: '',
          set_name: extractSetName(name),
        });
      });

      // Also try to parse JSON-LD structured data
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html());
          const items = Array.isArray(data) ? data : data['@graph'] || [data];
          for (const item of items) {
            if (item['@type'] !== 'Product') continue;
            const name = item.name || '';
            if (!isPokemonTCGProduct(name)) continue;

            const offer = item.offers || {};
            const availability = offer.availability || '';
            let status = 'unknown';
            if (availability.includes('InStock')) status = 'in-stock';
            else if (availability.includes('OutOfStock')) status = 'out-of-stock';
            else if (availability.includes('PreOrder')) status = 'pre-order';

            const url = item.url || offer.url || '';
            if (!url) continue;

            const exists = products.find(p => p.url === url);
            if (exists) continue;

            products.push({
              retailer: RETAILER,
              name,
              product_type: classifyProduct(name),
              url: url.startsWith('http') ? url : BASE_URL + url,
              image_url: item.image || '',
              price: parsePrice(String(offer.price || '')),
              currency: offer.priceCurrency || 'USD',
              status,
              is_preorder: status === 'pre-order' ? 1 : 0,
              is_prerelease: detectPrerelease(name) ? 1 : 0,
              release_date: '',
              set_name: extractSetName(name),
            });
          }
        } catch {}
      });
    } catch (err) {
      console.error(`[${RETAILER}] Error fetching ${searchUrl}:`, err.message);
    }
  }

  return products;
}

function extractSetName(name) {
  // Common Pokemon set names often appear before the product type
  const patterns = [
    /pok[eé]mon\s+tcg[:\s]+(.+?)\s+(booster|elite|etb)/i,
    /pok[eé]mon[:\s]+(.+?)\s+(booster|elite|etb)/i,
    /^(.+?)\s+(booster box|elite trainer)/i,
  ];
  for (const p of patterns) {
    const m = name.match(p);
    if (m) return m[1].trim();
  }
  return '';
}

module.exports = { scrape, RETAILER };
