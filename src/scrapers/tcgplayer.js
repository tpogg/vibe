const cheerio = require('cheerio');
const { fetchPage, fetchJSON, classifyProduct, detectPreorder, detectPrerelease, parsePrice } = require('./base-scraper');

const RETAILER = 'tcgplayer';
const BASE_URL = 'https://www.tcgplayer.com';

// TCGPlayer has a well-structured site for Pokemon products
const SEARCH_URLS = [
  `${BASE_URL}/search/pokemon/product?productLineName=pokemon&productTypeName=Booster%20Box&view=grid`,
  `${BASE_URL}/search/pokemon/product?productLineName=pokemon&productTypeName=Elite%20Trainer%20Boxes&view=grid`,
  `${BASE_URL}/search/pokemon/product?productLineName=pokemon&productTypeName=Booster%20Bundle&view=grid`,
];

async function scrape() {
  const products = [];

  for (const searchUrl of SEARCH_URLS) {
    try {
      const { body } = await fetchPage(searchUrl);
      const $ = cheerio.load(body);

      // TCGPlayer uses search result listings
      $('.search-result, [class*="product-card"], [data-testid="search-result"]').each((_, el) => {
        const $el = $(el);
        const name = $el.find('.search-result__title, [class*="product-card__name"], a[class*="title"]').first().text().trim();
        if (!name) return;

        const href = $el.find('a[href*="/product/"], a[href*="/pokemon/"]').first().attr('href') || '';
        if (!href) return;
        const url = href.startsWith('http') ? href : BASE_URL + href;

        const marketPrice = $el.find('[class*="market-price"], [class*="price"]').first().text();
        const lowPrice = $el.find('[class*="low-price"]').text();
        const priceText = lowPrice || marketPrice;

        const imageUrl = $el.find('img[class*="product"], img[class*="result"]').attr('src')
          || $el.find('img').first().attr('src') || '';

        const statusText = $el.find('[class*="badge"], [class*="stock"], [class*="listing-count"]').text().toLowerCase();

        let status = 'in-stock'; // TCGPlayer marketplace usually has sellers
        if (statusText.includes('no listings') || statusText.includes('0 listing')) {
          status = 'out-of-stock';
        }
        if (detectPreorder(name, statusText)) status = 'pre-order';
        if (detectPrerelease(name, statusText)) status = 'pre-release';

        // Determine product type from the URL or name
        let productType = 'booster-box';
        if (searchUrl.includes('Elite%20Trainer')) productType = 'elite-trainer-box';
        else if (searchUrl.includes('Booster%20Bundle')) productType = 'booster-bundle';
        else productType = classifyProduct(name);

        products.push({
          retailer: RETAILER,
          name: `Pokemon TCG ${name}`,
          product_type: productType,
          url,
          image_url: imageUrl,
          price: parsePrice(priceText),
          currency: 'USD',
          status,
          is_preorder: status === 'pre-order' ? 1 : 0,
          is_prerelease: status === 'pre-release' ? 1 : 0,
          release_date: '',
          set_name: extractSetFromName(name),
        });
      });
    } catch (err) {
      console.error(`[${RETAILER}] Error fetching ${searchUrl}:`, err.message);
    }
  }

  return products;
}

function extractSetFromName(name) {
  // TCGPlayer names are usually like "Scarlet & Violet - Obsidian Flames Booster Box"
  const match = name.match(/^(.+?)\s+(booster box|elite trainer|booster bundle)/i);
  return match ? match[1].trim() : '';
}

module.exports = { scrape, RETAILER };
