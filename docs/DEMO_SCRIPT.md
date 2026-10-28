# Five-Minute Live Demonstration Script — Enterprise Decision Intelligence Engine

> **Interview Presentation Cheat-Sheet**  
> Follow this exact step-by-step walkthrough to present the application in 5 minutes during a technical interview or college placement review.

---

## Pre-Demo Preparation: Database Reset & Startup

Before your presentation begins, ensure your services are running and the database is at its clean seeded state.

### 1. Reset Database to Clean Baseline (One Command)
Run in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\reset-db.ps1
```
*Output: `Database reset complete! Baseline sample data restored.` (2,183 records restored)*

### 2. Start Services (If Not Already Running)
Run in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1
```
*Dashboard opens automatically at `http://localhost:3000`.*

---

## 5-Minute Live Walkthrough Script

### Minute 0:00 – 0:45: Introduce the Business Problem & Objective
* **What to say:**  
  *"Good morning/afternoon. Today I am demonstrating the **Enterprise Decision Intelligence Engine**, an end-to-end analytics and decision-support platform designed for modern retail enterprises.  
  Retail operations generate large volumes of transactional data across physical regions and product categories. Typical business teams face three major problems: delayed reporting, undetected operational anomalies like checkout gateway outages, and descriptive dashboards that show charts but fail to tell leaders what specific actions to take.  
  Our platform solves this through an automated pipeline: CSV ingestion and validation, PostgreSQL storage, Python statistical anomaly detection, seasonal baseline forecasting, and a grounded rule-based recommendation engine."*

---

### Minute 0:45 – 1:30: Overview Dashboard & KPI Math
* **What to show on screen:**  
  Click on **Overview Dashboard** in the sidebar.
* **What to say:**  
  *"Here on the Executive Overview, we see live calculations computed directly from our PostgreSQL database:  
  1. **Total Revenue:** Evaluated in Indian Rupees (₹), showing period-over-period growth against an equivalent preceding window.  
  2. **Total Orders & Units Sold:** Capturing unique checkout IDs and fulfillment volumes.  
  3. **Average Order Value (AOV):** Explicitly calculated as Total Revenue divided by Total Orders, with zero-denominator safeguards.  
  Below the KPIs, we have the **Daily Revenue Velocity** area chart rendered in Recharts, a **Category Share** donut chart, and a **Regional Distribution** comparison across our 5 operating territories (North, South, East, West, Central)."*

---

### Minute 1:30 – 2:15: Interactive Filtering & Dynamic Re-calculation
* **What to do on screen:**  
  1. Click **"90 Days"** in the top filter bar. Point out how all KPIs and charts smoothly recalculate.
  2. In the **Region** dropdown, select **"North"**.
* **What to say:**  
  *"Notice the global filter bar. When I switch the time horizon to the last 90 days or filter specifically for the 'North' region, parameterized SQL queries execute on the backend, updating revenue totals, growth rates, and top-performing products instantaneously without full-page reloads."*
* **What to do:**  
  Switch Region back to **"All"** and time preset to **"All Data"**.

---

### Minute 2:15 – 3:00: Live CSV Upload & Validation Demonstration
* **What to do on screen:**  
  1. Click **"Data Ingestion & ETL"** in the sidebar (or the **"Upload CSV"** button in the header).
  2. Click the black button: **"Download Sample CSV (100 Rows)"**. The clean `sample_retail_sales.csv` will download to your machine.
  3. Drag and drop (or select) this downloaded file into the upload zone.
  4. Click **"Validate & Ingest File"**.
* **What to point out:**  
  *"Watch the Ingestion Validation Summary. The backend streaming parser validated all 100 records for data types, ISO date formatting, and product catalog foreign keys. All 100 rows were accepted and committed in an ACID transaction.*  
  *Now, if I try uploading the exact same file again...* (select file and click Ingest) *...notice that 0 rows are accepted and all 100 rows are skipped as duplicate transactions using our idempotent deduplication strategy.*  
  *Furthermore, the audit trail is recorded below in our PostgreSQL `ingestion_jobs` table."*

---

### Minute 3:00 – 3:45: Statistical Anomaly Detection & Line-Item Inspection
* **What to do on screen:**  
  Click **"Anomaly Detection"** in the sidebar.
* **What to say:**  
  *"Here is our statistical anomaly detection module, computed in Python using Tukey's Interquartile Range (IQR) and rolling Z-score dispersion at the daily revenue level.*  
  *The timeline chart shows our upper and lower statistical thresholds. The red and amber markers represent flagged outliers."*
* **What to do:**  
  1. Scroll down to the **Flagged Statistical Observations** table.
  2. Find the row for **2026-06-15** (High Severity Spike) and click **"Inspect"**.
* **What to say:**  
  *"Instead of treating anomalies as a black box, our platform allows an analyst to inspect the underlying line-item sales records. On June 15, we can see an exceptional corporate wholesale transaction for 15 UltraBook laptops at ₹64,999 each, totaling over ₹9.7 Lakhs. We also transparently remind business users that a statistical anomaly is a variance signal, not proof of fraud or defect."*
* **What to do:**  
  Click **"Close Audit"**.

---

### Minute 3:45 – 4:30: Sales Forecasting & Holdout MAE Evaluation
* **What to do on screen:**  
  Click **"Sales Forecasting"** in the sidebar.
* **What to say:**  
  *"Next is our 7-day sales forecasting module. Rather than claiming false precision with an overfitted deep neural network, we implement a Day-of-Week Seasonal Moving Average baseline.*  
  *Crucially, we evaluate this model honestly: the engine holds out the most recent 7 historical days as an unseen test set. We report a **Mean Absolute Error (MAE)** of approximately ₹8,000 to ₹10,000, which means: on average, our daily revenue predictions deviate by that amount from actuals on unseen data.*  
  *The chart visualizes our historical observations in solid dark slate and our 7-day forward trajectory with dashed lines and 90% confidence uncertainty intervals."*

---

### Minute 4:30 – 5:00: Prescriptive Recommendations & Architecture Wrap-Up
* **What to do on screen:**  
  Click **"Business Recommendations"** in the sidebar.
* **What to say:**  
  *"Finally, this is the bridge from analytics to operational impact: our Prescriptive Recommendation Engine.  
  Evaluating our empirical metrics triggers high-priority operational actions:  
  - For example, if a category contributes over 40% of revenue, it flags a **Category Concentration Risk** and suggests bundling strategies.  
  - If a region lags behind the regional average, it triggers an operational audit of logistics and fulfillment partner SLAs.*  
  *Technologically, the platform is cleanly decoupled: React with Vite and Tailwind on the client, Express.js with connection pooling on Node, PostgreSQL 18 for relational persistence, and FastAPI with pandas for Python analytical processing.*  
  *Thank you! I would be glad to answer any questions about the architecture or implementation."*

---

## Quick Reference: Reset Commands for Demo Re-runs

If you want to re-run the demo from the start during multiple interview rounds:
```powershell
# In PowerShell:
powershell -ExecutionPolicy Bypass -File scripts\reset-db.ps1
```
This restores all 2,183 initial historical sales records and clears any test uploads so the demo CSV is ready to upload again.
