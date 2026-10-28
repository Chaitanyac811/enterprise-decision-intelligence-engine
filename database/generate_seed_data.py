"""
Deterministic Seed Data Generator for Enterprise Decision Intelligence Engine
Generates:
1. database/seed.sql: 1,500+ realistic retail transactions with injected explainable anomalies
2. data/sample_retail_sales.csv: 100 clean & valid records for live presentation CSV upload
3. data/sample_invalid_sales.csv: Sample CSV containing validation errors (missing fields, negative qty) for testing error handling
"""

import random
from datetime import datetime, timedelta
import os
import json

random.seed(42)  # Deterministic seed for reproducible results

PRODUCTS = [
    # Electronics
    ("PROD-ELEC-01", "UltraBook Pro 14-inch Laptop", "Electronics", 64999.00, 48000.00),
    ("PROD-ELEC-02", "SmartPhone Nova 5G 128GB", "Electronics", 24999.00, 18500.00),
    ("PROD-ELEC-03", "Noise Cancelling Wireless Earbuds", "Electronics", 4499.00, 2600.00),
    ("PROD-ELEC-04", "Smart Health & Fitness Tracker Band", "Electronics", 2999.00, 1700.00),
    ("PROD-ELEC-05", "4K Ultra HD Streaming Stick", "Electronics", 3499.00, 2100.00),

    # Apparel & Fashion
    ("PROD-APP-01", "Premium Linen Casual Shirt", "Apparel", 1899.00, 950.00),
    ("PROD-APP-02", "Slim Fit Denim Jeans", "Apparel", 2299.00, 1100.00),
    ("PROD-APP-03", "Lightweight All-Weather Running Shoes", "Apparel", 3499.00, 1800.00),
    ("PROD-APP-04", "Formal Executive Navy Blazer", "Apparel", 5999.00, 3200.00),
    ("PROD-APP-05", "Athletic Cotton Joggers", "Apparel", 1299.00, 650.00),

    # Home & Kitchen
    ("PROD-HOME-01", "Digital Smart Air Fryer 4.5L", "Home & Kitchen", 6499.00, 3900.00),
    ("PROD-HOME-02", "Barista Espresso & Cappuccino Maker", "Home & Kitchen", 8999.00, 5600.00),
    ("PROD-HOME-03", "Robotic Smart Vacuum & Mop Cleaner", "Home & Kitchen", 18499.00, 12000.00),
    ("PROD-HOME-04", "Hard Anodized 5-Piece Cookware Set", "Home & Kitchen", 3999.00, 2200.00),
    ("PROD-HOME-05", "UV + UF Multi-Stage Water Purifier", "Home & Kitchen", 11499.00, 7500.00),

    # FMCG & Groceries
    ("PROD-FMCG-01", "Himalayan Organic Green Tea (200g)", "FMCG", 499.00, 260.00),
    ("PROD-FMCG-02", "Royal Aged Basmati Rice (5kg Bag)", "FMCG", 799.00, 520.00),
    ("PROD-FMCG-03", "Cold Pressed Extra Virgin Olive Oil (1L)", "FMCG", 1199.00, 780.00),
    ("PROD-FMCG-04", "Premium Dry Fruits & Nuts Combo (1kg)", "FMCG", 1499.00, 980.00),
    ("PROD-FMCG-05", "Pure Whey Protein Isolate (1kg)", "FMCG", 2899.00, 1900.00),

    # Beauty & Personal Care
    ("PROD-BEAU-01", "Vitamin C Radiance Face Serum (30ml)", "Beauty & Personal Care", 799.00, 380.00),
    ("PROD-BEAU-02", "Organic Argan Oil Herbal Shampoo (500ml)", "Beauty & Personal Care", 599.00, 290.00),
    ("PROD-BEAU-03", "Long-Wear Matte Lip Velvet Trio", "Beauty & Personal Care", 1299.00, 550.00),
    ("PROD-BEAU-04", "Broad Spectrum Sunscreen Gel SPF 50", "Beauty & Personal Care", 649.00, 310.00),
    ("PROD-BEAU-05", "Complete Precision Beard Grooming Kit", "Beauty & Personal Care", 1899.00, 990.00),
]

REGIONS = ["North", "South", "East", "West", "Central"]
REGION_WEIGHTS = [0.30, 0.28, 0.15, 0.17, 0.10]

CUSTOMER_SEGMENTS = ["Retail", "Wholesale", "Corporate"]
CUSTOMER_WEIGHTS = [0.75, 0.18, 0.07]

PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "Net Banking", "Cash"]
PAYMENT_WEIGHTS = [0.45, 0.25, 0.15, 0.10, 0.05]

def generate_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    database_dir = os.path.join(base_dir, "database")
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(database_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)

    # 1. Generate Product SQL
    product_sql = []
    for p in PRODUCTS:
        pid, name, cat, price, cost = p
        name_esc = name.replace("'", "''")
        cat_esc = cat.replace("'", "''")
        product_sql.append(
            f"('{pid}', '{name_esc}', '{cat_esc}', {price:.2f}, {cost:.2f})"
        )

    # 2. Generate Historical Sales from 2026-03-01 to 2026-10-25 (~240 days)
    start_date = datetime(2026, 3, 1)
    end_date = datetime(2026, 10, 25)
    delta_days = (end_date - start_date).days

    sales_records = []
    tx_counter = 10001

    # Injected Anomalies:
    # Anomaly 1: 2026-06-15 (Mid-Year Flash Sale / B2B bulk buy) -> Massive revenue spike
    # Anomaly 2: 2026-08-14 (Independence Eve Super Deal) -> Spike
    # Anomaly 3: 2026-09-02 (Severe Gateway Downtime / Regional Weather Disruption) -> Near zero revenue drop
    # Anomaly 4: 2026-10-10 (Pre-Diwali Festival Push) -> High revenue spike

    curr = start_date
    while curr <= end_date:
        d_str = curr.strftime("%Y-%m-%d")
        day_of_week = curr.weekday()  # 5=Sat, 6=Sun
        
        # Base transaction count per day: 5 to 12
        if day_of_week in (5, 6):
            daily_tx_count = random.randint(8, 16)
        else:
            daily_tx_count = random.randint(5, 10)

        # Check for anomaly dates
        if d_str == "2026-06-15":
            # Bulk corporate order + flash sale
            daily_tx_count = 28
            # Add a massive corporate transaction
            p = PRODUCTS[0] # UltraBook
            qty = 15
            unit_price = p[3]
            rev = qty * unit_price
            sales_records.append((
                f"TXN-{tx_counter}", d_str, p[0], p[2], qty, unit_price, rev,
                "North", "Corporate", "Net Banking"
            ))
            tx_counter += 1
        elif d_str == "2026-08-14":
            daily_tx_count = 25
            p = PRODUCTS[10] # Robotic Vacuum
            qty = 12
            unit_price = p[3]
            rev = qty * unit_price
            sales_records.append((
                f"TXN-{tx_counter}", d_str, p[0], p[2], qty, unit_price, rev,
                "South", "Wholesale", "Credit Card"
            ))
            tx_counter += 1
        elif d_str == "2026-09-02":
            # Gateway outage - only 1 minor transaction occurred
            daily_tx_count = 1
        elif d_str == "2026-10-10":
            daily_tx_count = 26

        for _ in range(daily_tx_count):
            p = random.choice(PRODUCTS)
            pid, _, cat, unit_price, _ = p
            region = random.choices(REGIONS, weights=REGION_WEIGHTS)[0]
            cust_seg = random.choices(CUSTOMER_SEGMENTS, weights=CUSTOMER_WEIGHTS)[0]
            pay_method = random.choices(PAYMENT_METHODS, weights=PAYMENT_WEIGHTS)[0]

            if cust_seg == "Corporate":
                qty = random.randint(3, 8)
            elif cust_seg == "Wholesale":
                qty = random.randint(4, 12)
            else:
                qty = random.randint(1, 3)

            rev = round(qty * unit_price, 2)
            sales_records.append((
                f"TXN-{tx_counter}", d_str, pid, cat, qty, unit_price, rev,
                region, cust_seg, pay_method
            ))
            tx_counter += 1

        curr += timedelta(days=1)

    print(f"Total historical sales records generated: {len(sales_records)}")

    # Write database/seed.sql
    seed_sql_path = os.path.join(database_dir, "seed.sql")
    with open(seed_sql_path, "w", encoding="utf-8") as f:
        f.write("-- Deterministic Seed Data for Enterprise Decision Intelligence Engine\n")
        f.write("-- Generated deterministically with realistic trends and explainable anomalies\n\n")
        f.write("BEGIN;\n\n")
        f.write("-- 1. Insert Products\n")
        f.write("INSERT INTO products (product_id, name, category, unit_price, cost_price) VALUES\n")
        f.write(",\n".join(product_sql) + "\nON CONFLICT (product_id) DO NOTHING;\n\n")

        f.write("-- 2. Insert Sales Transactions\n")
        batch_size = 500
        for i in range(0, len(sales_records), batch_size):
            batch = sales_records[i:i+batch_size]
            f.write("INSERT INTO sales_transactions (transaction_id, sale_date, product_id, category, quantity, unit_price, revenue, region, customer_segment, payment_method) VALUES\n")
            lines = [
                f"('{r[0]}', '{r[1]}', '{r[2]}', '{r[3]}', {r[4]}, {r[5]:.2f}, {r[6]:.2f}, '{r[7]}', '{r[8]}', '{r[9]}')"
                for r in batch
            ]
            f.write(",\n".join(lines) + "\nON CONFLICT (transaction_id) DO NOTHING;\n\n")

        # Ingestion job initial record
        f.write("-- 3. Log initial system seeding job\n")
        f.write(f"""INSERT INTO ingestion_jobs 
            (job_id, filename, file_size_bytes, total_records, accepted_records, rejected_records, skipped_records, status, error_summary, created_at, completed_at)
            VALUES 
            ('seed-job-001', 'system_seed_data.sql', 128500, {len(sales_records)}, {len(sales_records)}, 0, 0, 'COMPLETED', 'Initial historical dataset seeded successfully', NOW(), NOW());
        """)
        f.write("\nCOMMIT;\n")

    print(f"Wrote {seed_sql_path}")

    # 3. Generate data/sample_retail_sales.csv (for presentation demo upload)
    # Range: 2026-10-26 to 2026-10-28 (100 fresh records to import during demo)
    upload_records = []
    demo_tx_counter = 50001
    demo_start = datetime(2026, 10, 26)
    for i in range(100):
        d = demo_start + timedelta(hours=i * 0.7)
        d_str = d.strftime("%Y-%m-%d")
        p = random.choice(PRODUCTS)
        pid, _, cat, unit_price, _ = p
        region = random.choices(REGIONS, weights=REGION_WEIGHTS)[0]
        cust_seg = random.choices(CUSTOMER_SEGMENTS, weights=CUSTOMER_WEIGHTS)[0]
        pay_method = random.choices(PAYMENT_METHODS, weights=PAYMENT_WEIGHTS)[0]
        qty = random.randint(1, 4) if cust_seg == "Retail" else random.randint(5, 10)
        upload_records.append({
            "transaction_id": f"TXN-{demo_tx_counter}",
            "sale_date": d_str,
            "product_id": pid,
            "category": cat,
            "quantity": qty,
            "unit_price": f"{unit_price:.2f}",
            "region": region,
            "customer_segment": cust_seg,
            "payment_method": pay_method
        })
        demo_tx_counter += 1

    sample_csv_path = os.path.join(data_dir, "sample_retail_sales.csv")
    with open(sample_csv_path, "w", encoding="utf-8") as f:
        headers = ["transaction_id", "sale_date", "product_id", "category", "quantity", "unit_price", "region", "customer_segment", "payment_method"]
        f.write(",".join(headers) + "\n")
        for r in upload_records:
            f.write(f"{r['transaction_id']},{r['sale_date']},{r['product_id']},{r['category']},{r['quantity']},{r['unit_price']},{r['region']},{r['customer_segment']},{r['payment_method']}\n")

    print(f"Wrote {sample_csv_path} (100 records)")

    # 4. Generate data/sample_invalid_sales.csv for demonstrating error validation
    invalid_csv_path = os.path.join(data_dir, "sample_invalid_sales.csv")
    with open(invalid_csv_path, "w", encoding="utf-8") as f:
        f.write("transaction_id,sale_date,product_id,category,quantity,unit_price,region,customer_segment,payment_method\n")
        f.write("TXN-ERR-01,2026-10-28,PROD-ELEC-01,Electronics,2,64999.00,North,Retail,UPI\n")  # valid
        f.write("TXN-ERR-02,INVALID_DATE,PROD-ELEC-02,Electronics,1,24999.00,South,Retail,UPI\n")  # invalid date
        f.write("TXN-ERR-03,2026-10-28,NON_EXISTENT_PROD,Electronics,1,1000.00,West,Retail,UPI\n")  # missing product
        f.write("TXN-ERR-04,2026-10-28,PROD-APP-01,Apparel,-5,1899.00,East,Retail,UPI\n")  # negative quantity
        f.write(",2026-10-28,PROD-HOME-01,Home & Kitchen,1,6499.00,Central,Retail,UPI\n")  # missing transaction_id
        f.write("TXN-ERR-06,2026-10-28,PROD-FMCG-01,FMCG,3,-499.00,North,Retail,UPI\n")  # negative price
        f.write("TXN-ERR-07,2026-10-28,PROD-BEAU-01,Beauty,2,799.00,InvalidRegion,Retail,UPI\n")  # invalid region
        f.write("TXN-ERR-08,2026-10-28,PROD-BEAU-02,Beauty & Personal Care,1,599.00,South,Retail,UPI\n")  # valid

    print(f"Wrote {invalid_csv_path} for testing validation errors")

if __name__ == "__main__":
    generate_data()
