/**
 * Ingestion Upload & Duplicate Prevention Test
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:5000'; // Target running server or test port

async function testUpload() {
  console.log('Testing CSV Upload & Ingestion Validation...');

  const validCsvPath = path.resolve(__dirname, '../../../data/sample_retail_sales.csv');
  const invalidCsvPath = path.resolve(__dirname, '../../../data/sample_invalid_sales.csv');

  // Test 1: Uploading invalid CSV with row validation errors
  const invalidContent = fs.readFileSync(invalidCsvPath);
  const blobInvalid = new Blob([invalidContent], { type: 'text/csv' });
  const formInvalid = new FormData();
  formInvalid.append('file', blobInvalid, 'sample_invalid_sales.csv');

  const res1 = await fetch(`${BASE_URL}/api/ingest/upload`, {
    method: 'POST',
    body: formInvalid,
  });
  const data1 = await res1.json();
  console.log('Invalid upload response:', data1.status, data1.summary);
  assert.ok(data1.rejected_records > 0, 'Should reject invalid rows');
  assert.ok(data1.accepted_records > 0, 'Should accept valid rows');

  // Test 2: Uploading valid sample CSV
  const validContent = fs.readFileSync(validCsvPath);
  const blobValid = new Blob([validContent], { type: 'text/csv' });
  const formValid = new FormData();
  formValid.append('file', blobValid, 'sample_retail_sales.csv');

  const res2 = await fetch(`${BASE_URL}/api/ingest/upload`, {
    method: 'POST',
    body: formValid,
  });
  const data2 = await res2.json();
  console.log('Valid upload response 1:', data2.status, data2.summary);
  assert.strictEqual(data2.status, 'COMPLETED');
  assert.strictEqual(data2.accepted_records, 100);

  // Test 3: Uploading the exact same valid sample CSV again -> Should skip all 100 as duplicates!
  const formDuplicate = new FormData();
  formDuplicate.append('file', blobValid, 'sample_retail_sales.csv');

  const res3 = await fetch(`${BASE_URL}/api/ingest/upload`, {
    method: 'POST',
    body: formDuplicate,
  });
  const data3 = await res3.json();
  console.log('Duplicate upload response:', data3.status, data3.summary);
  assert.strictEqual(data3.accepted_records, 0, 'Should accept 0 records on duplicate upload');
  assert.strictEqual(data3.skipped_records, 100, 'Should skip all 100 records as duplicates');

  console.log('All CSV Ingestion & Duplicate Tests Passed Successfully!');
}

testUpload().catch((err) => {
  console.error('Upload Test Error:', err);
  process.exit(1);
});
