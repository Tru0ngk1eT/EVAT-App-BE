// Verifies Prometheus is scraping the production health check and reports it as up.
const prom = process.argv[2] || 'http://localhost:9090';
const query = encodeURIComponent('probe_success{env="production"}');

async function productionIsUp() {
  const res = await fetch(`${prom}/api/v1/query?query=${query}`);
  const body = await res.json();
  const result = body?.data?.result || [];
  return result.length > 0 && result[0].value[1] === '1';
}

(async () => {
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      if (await productionIsUp()) {
        console.log('PASS: Prometheus reports the production health check is up');
        process.exit(0);
      }
      console.log(`Waiting for Prometheus to scrape production (attempt ${attempt}/12)...`);
    } catch (err) {
      console.log(`Prometheus not ready yet (attempt ${attempt}/12): ${err.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  console.error('FAIL: Prometheus did not report production as up within 60 seconds');
  process.exit(1);
})();