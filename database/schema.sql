-- ============================================================================
-- Enterprise Decision Intelligence Engine: PostgreSQL Database Schema
-- Currency: INR (₹)
-- ============================================================================

-- Drop tables if resetting schema
DROP TABLE IF EXISTS sales_transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS ingestion_jobs CASCADE;

-- ----------------------------------------------------------------------------
-- 1. Products Table
-- ----------------------------------------------------------------------------
CREATE TABLE products (
    product_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products (category);

-- ----------------------------------------------------------------------------
-- 2. Sales Transactions Table
-- Note on revenue: Calculated explicitly as (quantity * unit_price).
-- Stored at ingestion to lock historical transaction value against future price changes.
-- ----------------------------------------------------------------------------
CREATE TABLE sales_transactions (
    transaction_id VARCHAR(100) PRIMARY KEY,
    sale_date DATE NOT NULL,
    product_id VARCHAR(50) NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    category VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    revenue NUMERIC(12, 2) NOT NULL CHECK (revenue >= 0),
    region VARCHAR(50) NOT NULL CHECK (region IN ('North', 'South', 'East', 'West', 'Central')),
    customer_segment VARCHAR(50) DEFAULT 'Retail' CHECK (customer_segment IN ('Retail', 'Wholesale', 'Corporate')),
    payment_method VARCHAR(50) DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance dashboard filtering and aggregations
CREATE INDEX idx_sales_sale_date ON sales_transactions (sale_date);
CREATE INDEX idx_sales_product_id ON sales_transactions (product_id);
CREATE INDEX idx_sales_category ON sales_transactions (category);
CREATE INDEX idx_sales_region ON sales_transactions (region);
CREATE INDEX idx_sales_composite ON sales_transactions (sale_date, region, category);

-- ----------------------------------------------------------------------------
-- 3. Ingestion History Table
-- Tracks every batch CSV upload, audit trail, validation metrics, and errors
-- ----------------------------------------------------------------------------
CREATE TABLE ingestion_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(64) UNIQUE NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    total_records INTEGER NOT NULL DEFAULT 0,
    accepted_records INTEGER NOT NULL DEFAULT 0,
    rejected_records INTEGER NOT NULL DEFAULT 0,
    skipped_records INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL')),
    error_summary TEXT,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ingestion_jobs_status ON ingestion_jobs (status);
CREATE INDEX idx_ingestion_jobs_created_at ON ingestion_jobs (created_at DESC);
