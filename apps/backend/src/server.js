/**
 * Enterprise Decision Intelligence Engine: Backend API Server
 * Built with Node.js, Express, and PostgreSQL
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const db = require('./db');
const { checkAnalyticsHealth } = require('./analyticsClient');
const analyticsController = require('./controllers/analyticsController');
const ingestionController = require('./controllers/ingestionController');
const transactionController = require('./controllers/transactionController');

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Ensure temp uploads folder exists
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer upload configuration (limit 10MB, strictly .csv)
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const isCsvExt = file.originalname.toLowerCase().endsWith('.csv');
    const isCsvMime = file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.mimetype === 'text/plain';
    if (isCsvExt || isCsvMime) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only standard CSV (.csv) files are permitted.'));
    }
  },
});

// Middlewares
app.use(cors({
  origin: '*', // Allow frontend dev server and direct calls
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ----------------------------------------------------------------------------
// API Routes
// ----------------------------------------------------------------------------

// 1. Health Check
app.get('/api/health', async (req, res) => {
  const dbHealth = await db.testConnection();
  const analyticsHealth = await checkAnalyticsHealth();
  const overallHealthy = dbHealth.connected;

  res.status(overallHealthy ? 200 : 503).json({
    status: overallHealthy ? 'healthy' : 'degraded',
    service: 'enterprise-bi-backend',
    uptime_seconds: process.uptime(),
    database: dbHealth,
    analytics_microservice: analyticsHealth,
    timestamp: new Date().toISOString(),
  });
});

// 2. Analytics & KPIs
app.get('/api/analytics/kpi', analyticsController.getKpis);
app.get('/api/analytics/trends', analyticsController.getTrends);
app.get('/api/analytics/categories', analyticsController.getCategories);
app.get('/api/analytics/regions', analyticsController.getRegions);
app.get('/api/analytics/top-products', analyticsController.getTopProducts);

// 3. Anomaly Detection & Inspection
app.get('/api/analytics/anomalies', analyticsController.getAnomalies);
app.get('/api/analytics/anomalies/inspect', analyticsController.inspectAnomalyDate);

// 4. Sales Forecasting
app.get('/api/analytics/forecast', analyticsController.getForecast);

// 5. Business Recommendations
app.get('/api/analytics/recommendations', analyticsController.getRecommendations);

// 6. Data Ingestion & ETL
app.post('/api/ingest/upload', upload.single('file'), ingestionController.uploadCsv);
app.get('/api/ingest/history', ingestionController.getIngestionHistory);
app.get('/api/data/sample-csv', ingestionController.downloadSampleCsv);

// 7. Paginated Transaction Explorer
app.get('/api/transactions', transactionController.getTransactions);

// ----------------------------------------------------------------------------
// Error Handling Middlewares
// ----------------------------------------------------------------------------

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'NOT_FOUND',
    error: `Endpoint '${req.originalUrl}' does not exist on this server.`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    status: 'ERROR',
    error: err.message || 'Internal server error occurred.',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// ----------------------------------------------------------------------------
// Server Listen
// ----------------------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`==========================================================`);
    console.log(`Enterprise Decision Intelligence API Backend Started`);
    console.log(`Port: ${PORT} | Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
    console.log(`==========================================================`);
  });
}

module.exports = app;
