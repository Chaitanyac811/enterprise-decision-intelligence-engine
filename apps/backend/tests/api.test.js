/**
 * Comprehensive Backend API Test Suite
 * Tests all key REST endpoints, filters, calculations, and DB integrity
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const app = require('../src/server');
const db = require('../src/db');

let server;
const TEST_PORT = 5099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function runTests() {
  console.log('==========================================================');
  console.log('Running Backend API Integration Tests');
  console.log('==========================================================');

  // Start server on test port
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, '127.0.0.1', resolve);
  });

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    await test('GET /api/health should return 200 with DB connected', async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'healthy');
      assert.strictEqual(data.database.connected, true);
    });

    // 2. KPI Summary
    await test('GET /api/analytics/kpi should return valid calculated metrics', async () => {
      const res = await fetch(`${BASE_URL}/api/analytics/kpi`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.ok(data.kpis.total_revenue > 0, 'Total revenue should be greater than zero');
      assert.ok(data.kpis.total_orders > 0, 'Total orders should be greater than zero');
      assert.ok(data.kpis.total_units > 0, 'Total units should be greater than zero');
      assert.strictEqual(data.kpis.currency, 'INR');
      assert.strictEqual(data.kpis.currency_symbol, '₹');
      // Verify AOV = revenue / orders
      const expectedAov = parseFloat((data.kpis.total_revenue / data.kpis.total_orders).toFixed(2));
      assert.strictEqual(data.kpis.average_order_value, expectedAov);
    });

    // 3. Filtered KPI Summary
    await test('GET /api/analytics/kpi with category & region filter', async () => {
      const res = await fetch(`${BASE_URL}/api/analytics/kpi?category=Electronics&region=North`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.ok(data.kpis.total_revenue > 0);
    });

    // 4. Trends
    await test('GET /api/analytics/trends should return daily aggregated series', async () => {
      const res = await fetch(`${BASE_URL}/api/analytics/trends`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.ok(data.trends.length > 30, 'Should have over 30 daily data points');
      assert.ok(data.trends[0].date);
      assert.ok(typeof data.trends[0].revenue === 'number');
    });

    // 5. Categories breakdown
    await test('GET /api/analytics/categories should return all product categories', async () => {
      const res = await fetch(`${BASE_URL}/api/analytics/categories`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.ok(data.categories.length >= 4);
      const totalShare = data.categories.reduce((acc, c) => acc + c.share_percent, 0);
      assert.ok(Math.abs(totalShare - 100.0) < 0.5, 'Category shares should sum to ~100%');
    });

    // 6. Regional breakdown
    await test('GET /api/analytics/regions should return all 5 regions', async () => {
      const res = await fetch(`${BASE_URL}/api/analytics/regions`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.strictEqual(data.regions.length, 5);
    });

    // 7. Top products
    await test('GET /api/analytics/top-products should return top 10 products', async () => {
      const res = await fetch(`${BASE_URL}/api/analytics/top-products?limit=10`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.strictEqual(data.products.length, 10);
      assert.ok(data.products[0].revenue >= data.products[1].revenue, 'Should be sorted by revenue DESC');
    });

    // 8. Paginated transactions
    await test('GET /api/transactions should support pagination and search', async () => {
      const res = await fetch(`${BASE_URL}/api/transactions?page=1&limit=5`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.strictEqual(data.transactions.length, 5);
      assert.ok(data.pagination.total_records > 1000);
      assert.strictEqual(data.pagination.page, 1);
    });

    // 9. Ingestion history
    await test('GET /api/ingest/history should return ingestion logs', async () => {
      const res = await fetch(`${BASE_URL}/api/ingest/history`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.ok(data.history.length >= 1);
    });

    // 10. Sample CSV download
    await test('GET /api/data/sample-csv should serve downloadable CSV', async () => {
      const res = await fetch(`${BASE_URL}/api/data/sample-csv`);
      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.ok(text.includes('transaction_id,sale_date,product_id'));
    });

    // 11. Inspect Anomaly Date
    await test('GET /api/analytics/anomalies/inspect should return transactions on injected anomaly date', async () => {
      const res = await fetch(`${BASE_URL}/api/analytics/anomalies/inspect?date=2026-06-15`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.strictEqual(data.date, '2026-06-15');
      assert.ok(data.transactions.length > 0);
      assert.ok(data.total_revenue_on_date > 500000); // Injected bulk flash sale
    });

    // 12. Full Anomaly Detection via Python
    await test('GET /api/analytics/anomalies should return IQR/Z-score anomaly detection results from Python service', async () => {
      const res = await fetch(`${BASE_URL}/api/analytics/anomalies`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.ok(data.summary.anomalies_detected >= 2);
      assert.ok(data.anomalies.length > 0);
      assert.ok(data.parameters.iqr > 0);
    });

    // 13. Sales Forecast via Python
    await test('GET /api/analytics/forecast should return 7-day forecast with holdout MAE evaluation', async () => {
      const res = await fetch(`${BASE_URL}/api/analytics/forecast?horizon=7`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.strictEqual(data.forecast.length, 7);
      assert.ok(data.evaluation.mae > 0);
      assert.ok(data.evaluation.mae_interpretation);
    });

    // 14. Recommendations via Python
    await test('GET /api/analytics/recommendations should return grounded business recommendations', async () => {
      const res = await fetch(`${BASE_URL}/api/analytics/recommendations`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'SUCCESS');
      assert.ok(data.recommendations.length > 0);
      assert.ok(data.recommendations[0].title);
      assert.ok(data.recommendations[0].priority);
      assert.ok(data.recommendations[0].suggested_action);
    });

  } finally {
    if (server) {
      server.close();
    }
    await db.pool.end();
  }

  console.log('==========================================================');
  console.log(`Backend API Test Results: ${passed} passed, ${failed} failed`);
  console.log('==========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
