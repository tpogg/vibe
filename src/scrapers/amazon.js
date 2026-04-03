const cheerio = require('cheerio');
const { fetchPage, classifyProduct, detectPreorder, detectPrerelease, parsePrice, isPokemonTCGProduct } = require('./base-scraper');

const RETAILER = 'amazon';
const BASE_URL = 'https://www.amazon.com';

const SEARCH_QUERIES = [
  'Pokemon+TCG+Booster+Box',
  'Pokemon+Elite+Trainer+Box',
  'Pokemon+TCG+Booster+Bundle',
];

async function scrape() {
  const products = [];

  for (const query of SEARCH_QUERIES) {
    const searchUrl = `${BASE_URL}/s?k=${query}&rh=n%3A165793011`;

    try {
      const { body } = await fetchPage(searchUrl);
      const $ = cheerio.load(body);

      $('[data-component-type="s-search-result"]').each((_, el) => {
        const $el = $(el);
        const name = $el.find('h2 a span, h2 span.a-text-normal').first().text().trim();
        if (!name || !isPokemonTCGProduct(name)) return;

        const linkEl = $el.find('h2 a').first();
        const href = linkEl.attr('href') || '';
        const url = href.startsWith('http') ? href : BASE_URL + href;

        const priceWhole = $el.find('.a-price .a-price-whole').first().text().trim();
        const priceFraction = $el.find('.a-price .a-price-fraction').first().text().trim();
        const priceText = priceWhole ? `${priceWhole}${priceFraction}` : '';

        const imageUrl = $el.find('img.s-image').attr('src') || '';
        const badgeText = $el.find('.a-badge-text, [class*="badge"]').text().trim();
        const availText = $el.find('[class*="availability"], [class*="delivery"]').text().trim();

        let status = 'unknown';
        const combined = (badgeText + ' ' + availText).toLowerCase();
        if (combined.includes('in stock') || combined.includes('get it') || combined.includes('free delivery') || priceText) {
          status = 'in-stock';
        }
        if (combined.includes('out of stock') || combined.includes('unavailable')) {
          status = 'out-of-stock';
        }
        if (detectPreorder(name, combined)) {
          status = 'pre-order';
        }

        products.push({
          retailer: RETAILER,
          name,
          product_type: classifyProduct(name),
          url: url.split('?')[0], // clean tracking params
          image_url: imageUrl,
          price: parsePrice(priceText),
          currency: 'USD',
          status,
          is_preorder: detectPreorder(name, combined) ? 1 : 0,
          is_prerelease: detectPrerelease(name, combined) ? 1 : 0,
          release_date: '',
          set_name: '',
        });
      });
    } catch (err) {
      console.error(`[${RETAILER}] Error fetching ${searchUrl}:`, err.message);
    }
  }

  return products;
}

module.exports = { scrape, RETAILER };
