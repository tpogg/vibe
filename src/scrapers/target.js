const { fetchJSON, classifyProduct, detectPreorder, detectPrerelease } = require('./base-scraper');

const RETAILER = 'target';
const BASE_URL = 'https://www.target.com';

// Target's Redsky API for product searches
const API_URL = 'https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2';
const API_KEY = 'ff457966e64d5e877fdbad070f276d18ecec4a01';

const SEARCH_TERMS = [
  'Pokemon booster box',
  'Pokemon elite trainer box',
  'Pokemon booster bundle',
];

async function scrape() {
  const products = [];

  for (const term of SEARCH_TERMS) {
    try {
      const params = new URLSearchParams({
        key: API_KEY,
        channel: 'WEB',
        count: '24',
        default_purchasability_filter: 'true',
        keyword: term,
        offset: '0',
        page: '/s/' + encodeURIComponent(term),
        pricing_store_id: '3991',
        visitor_id: 'visitor_' + Date.now(),
      });

      const { data } = await fetchJSON(`${API_URL}?${params}`);
      const results = data?.data?.search?.products || [];

      for (const item of results) {
        const name = item.item?.product_description?.title || '';
        if (!name.toLowerCase().includes('pokemon') && !name.toLowerCase().includes('pokémon')) continue;

        const tcin = item.tcin || '';
        const url = `${BASE_URL}/p/-/A-${tcin}`;
        const price = item.price?.formatted_current_price
          ? parseFloat(item.price.formatted_current_price.replace(/[^0-9.]/g, ''))
          : 0;
        const imageUrl = item.item?.enrichment?.images?.primary_image_url || '';

        const availability = item.fulfillment?.shipping_options?.availability_status || '';
        const productFlags = (item.item?.product_description?.soft_bullets?.bullets || []).join(' ');

        let status = 'unknown';
        if (availability === 'IN_STOCK' || availability === 'AVAILABLE') status = 'in-stock';
        else if (availability === 'OUT_OF_STOCK') status = 'out-of-stock';

        if (detectPreorder(name, productFlags)) status = 'pre-order';

        products.push({
          retailer: RETAILER,
          name,
          product_type: classifyProduct(name),
          url,
          image_url: imageUrl,
          price,
          currency: 'USD',
          status,
          is_preorder: status === 'pre-order' ? 1 : 0,
          is_prerelease: detectPrerelease(name, productFlags) ? 1 : 0,
          release_date: '',
          set_name: '',
        });
      }
    } catch (err) {
      console.error(`[${RETAILER}] Error searching for "${term}":`, err.message);
    }
  }

  return products;
}

module.exports = { scrape, RETAILER };
