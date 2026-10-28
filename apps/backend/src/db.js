/**
 * PostgreSQL Database Connection Pool
 * Enterprise Decision Intelligence Engine
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: parseInt(process.env.PGPORT || '5433', 10),
  database: process.env.PGDATABASE || 'enterprise_bi',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[Database Pool Error]:', err.message);
});

/**
 * Execute parameterized query with automatic error wrapping
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 200) {
      console.log(`[Slow Query] (${duration}ms):`, text.substring(0, 80));
    }
    return res;
  } catch (error) {
    console.error('[DB Query Error]:', { query: text, params, message: error.message });
    throw error;
  }
}

/**
 * Test connectivity
 */
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db;');
    return {
      connected: true,
      time: res.rows[0].current_time,
      database: res.rows[0].db,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
}

module.exports = {
  pool,
  query,
  testConnection,
};
