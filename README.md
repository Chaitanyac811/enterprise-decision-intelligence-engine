# Enterprise Decision Intelligence Engine

[![Node.js](https://img.shields.io/badge/Node.js-v24-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0-teal.svg)](https://fastapi.tiangolo.com/)

An end-to-end business intelligence and prescriptive decision-support platform designed for retail enterprises. Bridges raw transactional ingestion, analytical storage, statistical anomaly detection, time-series forecasting, and grounded operational recommendations.

---

## Quick Start (One Command)

To initialize the database, seed data, and start all services simultaneously:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1
```

Once executed, open your browser:
- **Interactive Web Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Node.js Backend Health API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Python Analytics Health API:** [http://127.0.0.1:5001/health](http://127.0.0.1:5001/health)

---

## System Architecture

```
enterprise-decision-engine/
├── apps/
│   ├── frontend/         # React.js 18 + Vite + Tailwind CSS + Recharts (Port 3000)
│   └── backend/          # Node.js + Express + pg connection pool + Multer ETL (Port 5000)
├── analytics/            # Python 3.11 + FastAPI + pandas + NumPy microservice (Port 5001)
├── database/             # PostgreSQL schema, migrations, and deterministic seed generator
├── data/                 # Sample retail sales CSV (100 rows) & validation error test files
├── docs/                 # Detailed interview guide & 5-minute presentation demo script
├── scripts/              # Automated PowerShell scripts (start, stop, test, reset DB)
├── .env.example          # Environment variable template
└── README.md
```

---

## Core Capabilities

1. **Executive Overview Dashboard:**
   - Real-time calculations of Total Revenue in INR (₹), Total Orders, Total Units Sold, and Average Order Value (AOV).
   - Period-over-period growth benchmarking against immediately preceding equivalent time windows.
   - Recharts daily velocity curves, departmental category donut charts, and regional performance bars.
2. **Sales Analytics & Explorer:**
   - Multi-parameter filtering by date range, territory (North, South, East, West, Central), and category.
   - Paginated, searchable transaction ledger with search by transaction ID or product name.
3. **Statistical Anomaly Detection:**
   - Python microservice computing Tukey's Interquartile Range (IQR = Q3 - Q1) and rolling Z-score dispersion at the daily revenue level.
   - Interactive threshold lines (upper and lower bounds) on the revenue timeline.
   - Granular drill-down drawer to inspect underlying line-item transactions for any flagged anomaly date.
4. **Sales Forecasting & Holdout Evaluation:**
   - 7-day future projections based on a Day-of-Week Seasonal Moving Average baseline.
   - Evaluated using an out-of-sample 7-day historical holdout set, reporting Mean Absolute Error (MAE), MAPE, and RMSE.
   - 90% confidence uncertainty intervals.
5. **Prescriptive Recommendations:**
   - Grounded rule-based decision engine evaluating actual computed metrics (growth decline, category dominance, regional disparity, anomaly signals).
   - Prioritized operational action cards with supporting metric evidence.
6. **Data Ingestion & ETL:**
   - Drag-and-drop CSV upload with server-side validation (file size, required columns, ISO dates, foreign keys).
   - Deduplication strategy preventing duplicate transactions via unique constraint and in-memory set.
   - Downloadable sample CSV provided directly on the UI for live demonstrations.

---

## Running the Automated Test Suite

To run all unit tests, backend integration tests, CSV upload tests, and verify the frontend build:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-all-tests.ps1
```

---

## Interview & Presentation Documentation

- **Comprehensive Technical Guide:** [`docs/PROJECT_GUIDE.md`](docs/PROJECT_GUIDE.md)  
  *Contains architecture diagrams, mathematical formulas, ETL rules, 20 placement interview Q&As, and 60-second pitch.*
- **5-Minute Live Demonstration Script:** [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)  
  *Step-by-step presentation walkthrough with reset commands for interview demonstrations.*

---

## Database Reset Command

To restore the clean baseline dataset (2,183 historical records) before or after a demonstration:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\reset-db.ps1
```
