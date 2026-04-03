const cheerio = require('cheerio');
const { fetchPage, classifyProduct, detectPreorder, detectPrerelease, parsePrice, isPokemonTCGProduct } = require('./base-scraper');

const RETAILER = 'bestbuy';
const BASE_URL = 'https://www.bestbuy.com';

const SEARCH_URLS = [
  `${BASE_URL}/site/searchpage.jsp?st=pokemon+booster+box&cp=1`,
  `${BASE_URL}/site/searchpage.jsp?st=pokemon+elite+trainer+box&cp=1`,
];

async function scrape() {
  const products = [];

  for (const searchUrl of SEARCH_URLS) {
    try {
      const { body } = await fetchPage(searchUrl);
      const $ = cheerio.load(body);

      $('[class*="sku-item"], .list-item').each((_, el) => {
        const $el = $(el);
        const name = $el.find('[class*="sku-title"] a, .sku-header a, h4.sku-title a').first().text().trim();
        if (!name || !isPokemonTCGProduct(name)) return;

        const href = $el.find('[class*="sku-title"] a, .sku-header a, h4.sku-title a').attr('href') || '';
        const url = href.startsWith('http') ? href : BASE_URL + href;
        const priceText = $el.find('[class*="priceView-customer-price"] span, .priceView-hero-price span').first().text();
        const imageUrl = $el.find('img[class*="product-image"], img.product-image').attr('src') || '';

        const btnText = $el.find('button[class*="add-to-cart"], .add-to-cart-button').text().toLowerCase();
        const statusBadge = $el.find('[class*="badge"], [class*="status"]').text().toLowerCase();
        const combined = btnText + ' ' + statusBadge;

        let status = 'unknown';
        if (combined.includes('add to cart') || combined.includes('in stock')) {
          status = 'in-stock';
        } else if (combined.includes('sold out') || combined.includes('unavailable') || combined.includes('coming soon')) {
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
