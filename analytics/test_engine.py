"""
Unit Tests for Python Analytics Engine
Tests:
1. IQR Anomaly detection on known synthetic outliers (both spikes and drops)
2. Constant values and small dataset edge cases
3. Forecasting with holdout MAE evaluation
4. Forecasting with insufficient data handling
5. Recommendation engine rule firing
"""

import unittest
import sys
import os
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engine import detect_anomalies, forecast_sales, generate_recommendations

class TestAnalyticsEngine(unittest.TestCase):

    def setUp(self):
        # 30 days of synthetic baseline data (~₹50,000 per day)
        base_date = datetime(2026, 9, 1)
        self.normal_data = []
        for i in range(30):
            d = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
            # Normal fluctuation around 50k
            rev = 50000.0 + (i % 5) * 2000.0
            self.normal_data.append({"date": d, "revenue": rev, "orders": 10, "units": 20})

    def test_anomaly_detection_with_known_outliers(self):
        # Inject one massive spike and one near-zero drop
        test_data = [d.copy() for d in self.normal_data]
        test_data[10]["revenue"] = 450000.0  # Massive spike
        test_data[20]["revenue"] = 1500.0    # Massive drop

        result = detect_anomalies(test_data)
        self.assertEqual(result["status"], "SUCCESS")
        self.assertGreaterEqual(result["summary"]["anomalies_detected"], 2)

        flagged_dates = [a["date"] for a in result["anomalies"]]
        self.assertIn(test_data[10]["date"], flagged_dates)
        self.assertIn(test_data[20]["date"], flagged_dates)

        # Verify spike and drop classification
        spike = next(a for a in result["anomalies"] if a["date"] == test_data[10]["date"])
        self.assertEqual(spike["anomaly_type"], "SPIKE")
        self.assertEqual(spike["severity"], "HIGH")

        drop = next(a for a in result["anomalies"] if a["date"] == test_data[20]["date"])
        self.assertEqual(drop["anomaly_type"], "DROP")

    def test_anomaly_small_dataset(self):
        small_data = self.normal_data[:3]
        result = detect_anomalies(small_data)
        self.assertEqual(result["status"], "INSUFFICIENT_DATA")
        self.assertEqual(len(result["anomalies"]), 0)

    def test_forecasting_with_holdout(self):
        result = forecast_sales(self.normal_data, forecast_horizon_days=7)
        self.assertEqual(result["status"], "SUCCESS")
        self.assertEqual(len(result["forecast"]), 7)
        self.assertIsNotNone(result["evaluation"])
        self.assertIn("mae", result["evaluation"])
        self.assertIn("mape_percent", result["evaluation"])
        self.assertGreaterEqual(result["evaluation"]["mae"], 0.0)

    def test_forecasting_insufficient_data(self):
        insufficient = self.normal_data[:8]
        result = forecast_sales(insufficient, forecast_horizon_days=7)
        self.assertEqual(result["status"], "INSUFFICIENT_DATA")
        self.assertEqual(len(result["forecast"]), 0)

    def test_recommendation_rules(self):
        payload = {
            "kpi": {
                "total_revenue": 1000000.0,
                "revenue_growth_percent": -15.5,
                "total_orders": 500,
                "average_order_value": 2000.0
            },
            "categories": [
                {"category": "Electronics", "revenue": 550000.0},
                {"category": "Apparel", "revenue": 250000.0},
                {"category": "FMCG", "revenue": 200000.0}
            ],
            "regions": [
                {"region": "North", "revenue": 450000.0},
                {"region": "South", "revenue": 350000.0},
                {"region": "West", "revenue": 150000.0},
                {"region": "Central", "revenue": 50000.0} # Underperformer
            ],
            "anomalies": [
                {"date": "2026-09-20", "observed_revenue": 1200.0, "severity": "HIGH", "anomaly_type": "DROP"}
            ]
        }
        recs = generate_recommendations(payload)
        self.assertGreater(len(recs), 0)

        titles = [r["title"] for r in recs]
        # Should detect contraction
        self.assertTrue(any("Revenue Contraction" in t for t in titles))
        # Should detect category concentration (> 40% in Electronics)
        self.assertTrue(any("Category Concentration Risk" in t for t in titles))
        # Should detect underperforming region
        self.assertTrue(any("Central Region" in t for t in titles))

if __name__ == "__main__":
    unittest.main()
