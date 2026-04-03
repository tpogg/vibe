// CLI utility to run a one-off scan
const { scanAll, scanRetailer } = require('./scrapers');
const { processPendingAlerts } = require('./notifications');

const retailer = process.argv[2];

(async () => {
  console.log('Pokemon Card Tracker — Manual Scan');
  console.log('═'.repeat(50));

  if (retailer) {
    console.log(`Scanning: ${retailer}`);
    const result = await scanRetailer(retailer);
    console.log(result);
  } else {
    console.log('Scanning all retailers...');
    const results = await scanAll();
    console.table(results);
  }

  await processPendingAlerts();
  console.log('Done.');
  process.exit(0);
})();
