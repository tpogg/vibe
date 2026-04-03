const cheerio = require('cheerio');
const { fetchPage, classifyProduct, detectPreorder, detectPrerelease, parsePrice, isPokemonTCGProduct } = require('./base-scraper');

const RETAILER = 'walmart';
const BASE_URL = 'https://www.walmart.com';

const SEARCH_URLS = [
  `${BASE_URL}/search?q=Pokemon+TCG+Booster+Box&cat_id=4191`,
  `${BASE_URL}/search?q=Pokemon+Elite+Trainer+Box&cat_id=4191`,
];

async function scrape() {
  const products = [];

  for (const searchUrl of SEARCH_URLS) {
    try {
      const { body } = await fetchPage(searchUrl);
      const $ = cheerio.load(body);

      // Try to extract from Next.js __NEXT_DATA__ or inline scripts
      $('script').each((_, el) => {
        const text = $(el).html() || '';
        if (!text.includes('searchResult') && !text.includes('itemStacks')) return;

        try {
          // Walmart embeds product data in script tags
          const jsonMatch = text.match(/window\.__NEXT_DATA__\s*=\s*({.+?});/s)
            || text.match(/"itemStacks"\s*:\s*(\[.+?\])/s);
          if (!jsonMatch) return;

          const data = JSON.parse(jsonMatch[1]);
          const items = extractItems(data);

          for (const item of items) {
            if (!isPokemonTCGProduct(item.name)) continue;

            let status = 'unknown';
            if (item.availabilityStatus === 'IN_STOCK' || item.canAddToCart) status = 'in-stock';
            else if (item.availabilityStatus === 'OUT_OF_STOCK') status = 'out-of-stock';
            if (detectPreorder(item.name, item.flag || '')) status = 'pre-order';

            products.push({
              retailer: RETAILER,
              name: item.name,
              product_type: classifyProduct(item.name),
              url: item.url.startsWith('http') ? item.url : BASE_URL + item.url,
              image_url: item.image || '',
              price: item.price || 0,
              currency: 'USD',
              status,
              is_preorder: status === 'pre-order' ? 1 : 0,
              is_prerelease: detectPrerelease(item.name) ? 1 : 0,
              release_date: '',
              set_name: '',
            });
          }
        } catch {}
      });

      // Fallback: parse HTML product cards
      $('[data-item-id], [class*="product-card"], [class*="search-result"]').each((_, el) => {
        const $el = $(el);
        const name = $el.find('[class*="product-title"], [data-automation-id="product-title"]').text().trim();
        if (!name || !isPokemonTCGProduct(name)) return;

        const href = $el.find('a[href*="/ip/"]').attr('href') || '';
        if (!href) return;
        const url = href.startsWith('http') ? href : BASE_URL + href;

        // Skip dupes
        if (products.find(p => p.url === url)) return;

        const priceText = $el.find('[class*="price"], [data-automation-id="product-price"]').first().text();
        const imageUrl = $el.find('img').attr('src') || '';

        products.push({
          retailer: RETAILER,
          name,
          product_type: classifyProduct(name),
          url,
          image_url: imageUrl,
          price: parsePrice(priceText),
          currency: 'USD',
          status: 'unknown',
          is_preorder: detectPreorder(name) ? 1 : 0,
          is_prerelease: detectPrerelease(name) ? 1 : 0,
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

function extractItems(data) {
  const items = [];
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.name && obj.canonicalUrl) {
      items.push({
        name: obj.name,
        url: obj.canonicalUrl || '',
        price: obj.priceInfo?.currentPrice?.price || obj.price || 0,
        image: obj.imageInfo?.thumbnailUrl || obj.image || '',
        availabilityStatus: obj.availabilityStatusV2?.value || obj.availabilityStatus || '',
        canAddToCart: obj.canAddToCart || false,
        flag: obj.flag || '',
      });
      return;
    }
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) val.forEach(v => walk(v));
      else if (typeof val === 'object') walk(val);
    }
  }
  walk(data);
  return items;
}

module.exports = { scrape, RETAILER };
