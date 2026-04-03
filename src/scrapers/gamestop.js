const cheerio = require('cheerio');
const { fetchPage, classifyProduct, detectPreorder, detectPrerelease, parsePrice, isPokemonTCGProduct } = require('./base-scraper');

const RETAILER = 'gamestop';
const BASE_URL = 'https://www.gamestop.com';

const SEARCH_URLS = [
  `${BASE_URL}/search/?q=pokemon+booster+box&lang=default&start=0&sz=48`,
  `${BASE_URL}/search/?q=pokemon+elite+trainer+box&lang=default&start=0&sz=48`,
];

async function scrape() {
  const products = [];

  for (const searchUrl of SEARCH_URLS) {
    try {
      const { body } = await fetchPage(searchUrl);
      const $ = cheerio.load(body);

      $('.product-grid-tile, [class*="product-tile"]').each((_, el) => {
        const $el = $(el);
        const name = $el.find('.product-tile-title a, .tile-title a, [class*="pdp-link"] a').first().text().trim();
        if (!name || !isPokemonTCGProduct(name)) return;

        const href = $el.find('.product-tile-title a, .tile-title a, [class*="pdp-link"] a').attr('href') || '';
        const url = href.startsWith('http') ? href : BASE_URL + href;
        const priceText = $el.find('.product-tile-price, [class*="sales"] .value, .price .value').first().text();
        const imageUrl = $el.find('img.tile-image, img[class*="product-image"]').attr('src')
          || $el.find('img.tile-image, img[class*="product-image"]').attr('data-src') || '';

        const badge = $el.find('[class*="badge"], [class*="flag"], [class*="label"]').text().toLowerCase();
        const availability = $el.find('[class*="availability"], [class*="stock"]').text().toLowerCase();
        const combined = badge + ' ' + availability;

        let status = 'unknown';
        if (combined.includes('add to cart') || combined.includes('available') || combined.includes('in stock')) {
          status = 'in-stock';
        } else if (combined.includes('out of stock') || combined.includes('sold out') || combined.includes('unavailable')) {
          status = 'out-of-stock';
        }
        if (detectPreorder(name, combined)) status = 'pre-order';
        if (detectPrerelease(name, combined)) status = 'pre-release';

        products.push({
          retailer: RETAILER,
          name,
          product_type: classifyProduct(name),
          url,
          image_url: imageUrl,
          price: parsePrice(priceText),
          currency: 'USD',
          status,
          is_preorder: status === 'pre-order' ? 1 : 0,
          is_prerelease: status === 'pre-release' ? 1 : 0,
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
