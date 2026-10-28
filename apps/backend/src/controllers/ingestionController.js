/**
 * Ingestion & ETL Controller
 * Handles CSV upload, validation, normalization, duplicate prevention, and DB persistence
 */

const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const db = require('../db');

const REQUIRED_COLUMNS = [
  'transaction_id',
  'sale_date',
  'product_id',
  'category',
  'quantity',
  'unit_price',
  'region',
];

const VALID_REGIONS = new Set(['North', 'South', 'East', 'West', 'Central']);

/**
 * Validate a single row from CSV
 */
function validateRow(row, rowIndex, validProductIds, seenBatchTxIds) {
  const errors = [];

  // 1. Required column presence & non-empty
  for (const col of REQUIRED_COLUMNS) {
    if (!row[col] || String(row[col]).trim() === '') {
      errors.push(`Row ${rowIndex}: Missing required column '${col}'.`);
    }
  }
  if (errors.length > 0) return { isValid: false, errors };

  const txId = String(row.transaction_id).trim();
  const dateStr = String(row.sale_date).trim();
  const prodId = String(row.product_id).trim();
  const cat = String(row.category).trim();
  const region = String(row.region).trim();
  const custSeg = row.customer_segment ? String(row.customer_segment).trim() : 'Retail';
  const payMethod = row.payment_method ? String(row.payment_method).trim() : 'UPI';

  // 2. Intra-batch duplicate check
  if (seenBatchTxIds.has(txId)) {
    return {
      isValid: false,
      isDuplicate: true,
      errors: [`Row ${rowIndex}: Duplicate transaction_id '${txId}' within this upload batch.`],
    };
  }

  // 3. Date validation
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr) || isNaN(Date.parse(dateStr))) {
    errors.push(`Row ${rowIndex}: Invalid date '${dateStr}'. Expected YYYY-MM-DD format.`);
  }

  // 4. Product existence validation
  if (!validProductIds.has(prodId)) {
    errors.push(`Row ${rowIndex}: Product ID '${prodId}' does not exist in product catalog.`);
  }

  // 5. Numeric validations
  const qty = parseInt(row.quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    errors.push(`Row ${rowIndex}: Quantity must be a positive integer (found '${row.quantity}').`);
  }

  const unitPrice = parseFloat(row.unit_price);
  if (isNaN(unitPrice) || unitPrice < 0) {
    errors.push(`Row ${rowIndex}: Unit price must be a non-negative number (found '${row.unit_price}').`);
  }

  // 6. Region validation
  if (!VALID_REGIONS.has(region)) {
    errors.push(
      `Row ${rowIndex}: Invalid region '${region}'. Allowed: North, South, East, West, Central.`
    );
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  seenBatchTxIds.add(txId);
  const revenue = parseFloat((qty * unitPrice).toFixed(2));

  return {
    isValid: true,
    data: {
      transaction_id: txId,
      sale_date: dateStr,
      product_id: prodId,
      category: cat,
      quantity: qty,
      unit_price: unitPrice,
      revenue,
      region,
      customer_segment: custSeg,
      payment_method: payMethod,
    },
  };
}

/**
 * Handle CSV Upload & Ingestion Process
 */
async function uploadCsv(req, res, next) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No CSV file uploaded. Please attach a .csv file.' });
  }

  const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const filename = file.originalname;
  const fileSize = file.size;

  try {
    // 1. Fetch valid products for foreign key validation
    const prodRes = await db.query('SELECT product_id FROM products;');
    const validProductIds = new Set(prodRes.rows.map((p) => p.product_id));

    // 2. Fetch existing transaction IDs to detect duplicates against DB
    const existingTxRes = await db.query('SELECT transaction_id FROM sales_transactions;');
    const existingTxIds = new Set(existingTxRes.rows.map((t) => t.transaction_id));

    // 3. Parse CSV rows
    const rawRows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csvParser())
        .on('data', (data) => rawRows.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const totalRecords = rawRows.length;
    if (totalRecords === 0) {
      // Clean up temp file
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        status: 'FAILED',
        error: 'The uploaded CSV file is empty.',
      });
    }

    const seenBatchTxIds = new Set();
    const validRecords = [];
    const rejectedErrors = [];
    let skippedDuplicatesCount = 0;

    // 4. Validate each row
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowIndex = i + 2; // +2 for 1-based index and header row

      const validation = validateRow(row, rowIndex, validProductIds, seenBatchTxIds);
      if (!validation.isValid) {
        if (validation.isDuplicate) {
          skippedDuplicatesCount++;
        }
        rejectedErrors.push(...validation.errors);
        continue;
      }

      // Check against DB duplicate
      if (existingTxIds.has(validation.data.transaction_id)) {
        skippedDuplicatesCount++;
        rejectedErrors.push(
          `Row ${rowIndex}: Transaction '${validation.data.transaction_id}' already exists in database (duplicate skipped).`
        );
        continue;
      }

      validRecords.push(validation.data);
    }

    // 5. Insert valid records in a single database transaction
    let acceptedCount = 0;
    if (validRecords.length > 0) {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        for (const r of validRecords) {
          const insertSql = `
            INSERT INTO sales_transactions 
              (transaction_id, sale_date, product_id, category, quantity, unit_price, revenue, region, customer_segment, payment_method)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (transaction_id) DO NOTHING;
          `;
          const values = [
            r.transaction_id,
            r.sale_date,
            r.product_id,
            r.category,
            r.quantity,
            r.unit_price,
            r.revenue,
            r.region,
            r.customer_segment,
            r.payment_method,
          ];
          const insertRes = await client.query(insertSql, values);
          if (insertRes.rowCount > 0) {
            acceptedCount++;
          } else {
            skippedDuplicatesCount++;
          }
        }

        await client.query('COMMIT');
      } catch (insertErr) {
        await client.query('ROLLBACK');
        throw insertErr;
      } finally {
        client.release();
      }
    }

    const rejectedCount = rejectedErrors.length - skippedDuplicatesCount;
    let jobStatus = 'COMPLETED';
    if (acceptedCount === 0 && rejectedErrors.length > 0) {
      jobStatus = 'FAILED';
    } else if (rejectedErrors.length > 0) {
      jobStatus = 'PARTIAL';
    }

    // 6. Record ingestion job audit history
    const summaryMsg = `Ingested ${acceptedCount} of ${totalRecords} records (${skippedDuplicatesCount} skipped/duplicates, ${rejectedCount} rejected).`;
    const jobSql = `
      INSERT INTO ingestion_jobs 
        (job_id, filename, file_size_bytes, total_records, accepted_records, rejected_records, skipped_records, status, error_summary, error_details, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW());
    `;
    await db.query(jobSql, [
      jobId,
      filename,
      fileSize,
      totalRecords,
      acceptedCount,
      rejectedCount,
      skippedDuplicatesCount,
      jobStatus,
      summaryMsg,
      JSON.stringify(rejectedErrors.slice(0, 50)), // store top 50 errors
    ]);

    // Clean up temp file
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    res.json({
      status: jobStatus,
      job_id: jobId,
      filename,
      total_records: totalRecords,
      accepted_records: acceptedCount,
      rejected_records: rejectedCount,
      skipped_records: skippedDuplicatesCount,
      summary: summaryMsg,
      errors: rejectedErrors.slice(0, 20), // return first 20 errors to frontend
    });
  } catch (err) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    next(err);
  }
}

/**
 * Ingestion History
 */
async function getIngestionHistory(req, res, next) {
  try {
    const sql = `
      SELECT 
        id,
        job_id,
        filename,
        file_size_bytes,
        total_records,
        accepted_records,
        rejected_records,
        skipped_records,
        status,
        error_summary,
        error_details,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM ingestion_jobs
      ORDER BY created_at DESC
      LIMIT 25;
    `;
    const result = await db.query(sql);
    res.json({
      status: 'SUCCESS',
      count: result.rows.length,
      history: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Serve Sample CSV file for live interview demonstration
 */
function downloadSampleCsv(req, res) {
  const samplePath = path.resolve(__dirname, '../../../../data/sample_retail_sales.csv');
  if (!fs.existsSync(samplePath)) {
    return res.status(404).json({ error: 'Sample CSV file not found on server.' });
  }
  res.download(samplePath, 'sample_retail_sales.csv');
}

module.exports = {
  uploadCsv,
  getIngestionHistory,
  downloadSampleCsv,
};
