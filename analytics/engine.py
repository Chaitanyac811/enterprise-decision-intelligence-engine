"""
Enterprise Decision Intelligence Engine: Analytics & ML Module
Contains:
1. Statistical Anomaly Detection (IQR + Z-Score)
2. Day-of-Week Seasonal Moving Average Forecasting with Holdout Evaluation (MAE, MAPE, RMSE)
3. Grounded Rule-Based Business Recommendation Engine
"""

from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ============================================================================
# 1. ANOMALY DETECTION ENGINE
# ============================================================================

def detect_anomalies(daily_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Statistical Anomaly Detection using IQR (Interquartile Range) and Z-Score.
    Documented aggregation level: Daily Total Revenue.
    
    Returns:
    - summary: counts, anomaly rate, status
    - anomalies: list of flagged observations with expected value, bounds, reason, severity
    - annotated_series: all daily observations with lower/upper thresholds for charting
    """
    if not daily_data or len(daily_data) < 5:
        return {
            "status": "INSUFFICIENT_DATA",
            "message": "At least 5 daily data points are required to calculate meaningful statistical thresholds.",
            "anomalies": [],
            "summary": {
                "total_days": len(daily_data) if daily_data else 0,
                "anomalies_detected": 0,
                "anomaly_rate_percent": 0.0,
                "high_severity_count": 0,
                "medium_severity_count": 0
            },
            "annotated_series": daily_data or []
        }

    df = pd.DataFrame(daily_data)
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    df["revenue"] = df["revenue"].astype(float)
    df = df.sort_values("date").reset_index(drop=True)

    revenues = df["revenue"].values
    
    # 1. IQR Calculation
    q1 = float(np.percentile(revenues, 25))
    q3 = float(np.percentile(revenues, 75))
    iqr = q3 - q1
    median = float(np.median(revenues))

    # Standard Tukey thresholds
    iqr_multiplier = 1.5
    extreme_multiplier = 3.0
    lower_threshold = max(0.0, q1 - (iqr_multiplier * iqr))
    upper_threshold = q3 + (iqr_multiplier * iqr)
    extreme_upper = q3 + (extreme_multiplier * iqr)
    extreme_lower = max(0.0, q1 - (extreme_multiplier * iqr))

    # 2. Z-Score (Mean & Std)
    mean_val = float(np.mean(revenues))
    std_val = float(np.std(revenues))
    if std_val == 0:
        std_val = 1e-6  # Prevent division by zero for constant datasets

    # 3. Rolling 7-day baseline
    df["rolling_mean"] = df["revenue"].rolling(window=7, min_periods=1, center=True).mean()

    anomalies = []
    annotated_series = []

    for idx, row in df.iterrows():
        d_str = row["date"]
        rev = float(row["revenue"])
        expected = float(row["rolling_mean"]) if not np.isnan(row["rolling_mean"]) else median
        z = (rev - mean_val) / std_val

        is_high_outlier = rev > upper_threshold
        is_low_outlier = rev < lower_threshold
        is_extreme = rev > extreme_upper or rev < extreme_lower or abs(z) >= 3.0

        is_flagged = is_high_outlier or is_low_outlier or abs(z) >= 2.2

        severity = None
        reason = None
        anomaly_type = None

        if is_flagged:
            if is_extreme:
                severity = "HIGH"
            else:
                severity = "MEDIUM"

            if rev > expected:
                anomaly_type = "SPIKE"
                ratio = rev / expected if expected > 0 else 0
                reason = f"Revenue of ₹{rev:,.2f} is {ratio:.1f}x higher than the expected baseline (₹{expected:,.2f}) [Z={z:+.2f}]."
            else:
                anomaly_type = "DROP"
                diff = expected - rev
                reason = f"Revenue dropped to ₹{rev:,.2f}, which is ₹{diff:,.2f} below normal baseline expectations [Z={z:+.2f}]."

            anomalies.append({
                "date": d_str,
                "observed_revenue": round(rev, 2),
                "expected_revenue": round(expected, 2),
                "lower_threshold": round(lower_threshold, 2),
                "upper_threshold": round(upper_threshold, 2),
                "z_score": round(float(z), 2),
                "severity": severity,
                "anomaly_type": anomaly_type,
                "reason": reason
            })

        annotated_series.append({
            "date": d_str,
            "revenue": round(rev, 2),
            "expected": round(expected, 2),
            "lower_bound": round(lower_threshold, 2),
            "upper_bound": round(upper_threshold, 2),
            "is_anomaly": is_flagged,
            "severity": severity
        })

    high_count = sum(1 for a in anomalies if a["severity"] == "HIGH")
    med_count = sum(1 for a in anomalies if a["severity"] == "MEDIUM")
    total_days = len(df)
    rate = round((len(anomalies) / total_days) * 100, 2) if total_days > 0 else 0.0

    return {
        "status": "SUCCESS",
        "method": "Interquartile Range (IQR) & Z-Score Analysis",
        "parameters": {
            "q1": round(q1, 2),
            "median": round(median, 2),
            "q3": round(q3, 2),
            "iqr": round(iqr, 2),
            "mean": round(mean_val, 2),
            "std_dev": round(std_val, 2),
            "lower_threshold": round(lower_threshold, 2),
            "upper_threshold": round(upper_threshold, 2)
        },
        "summary": {
            "total_days": total_days,
            "anomalies_detected": len(anomalies),
            "anomaly_rate_percent": rate,
            "high_severity_count": high_count,
            "medium_severity_count": med_count
        },
        "disclaimer": "Statistical anomalies highlight unusual variance from mathematical baselines. They indicate signals for investigation rather than proof of operational or fraudulent defects.",
        "anomalies": anomalies,
        "annotated_series": annotated_series
    }


# ============================================================================
# 2. TIME-SERIES FORECASTING ENGINE
# ============================================================================

def forecast_sales(daily_data: List[Dict[str, Any]], forecast_horizon_days: int = 7) -> Dict[str, Any]:
    """
    Time-Series Sales Forecasting using a 7-day Seasonal Moving Average baseline.
    Includes:
    - Time-based holdout evaluation (last 7 days held out for validation)
    - Error metrics: MAE, MAPE, RMSE
    - 7-day future point predictions with 90% confidence bands
    - Transparent explanations and assumptions
    """
    min_required_days = 14
    if not daily_data or len(daily_data) < min_required_days:
        return {
            "status": "INSUFFICIENT_DATA",
            "message": f"At least {min_required_days} historical daily observations are required to fit and evaluate the time-series model (found {len(daily_data) if daily_data else 0}).",
            "historical": daily_data or [],
            "forecast": [],
            "evaluation": None
        }

    df = pd.DataFrame(daily_data)
    df["date"] = pd.to_datetime(df["date"])
    df["revenue"] = df["revenue"].astype(float)
    df = df.sort_values("date").reset_index(drop=True)

    # 1. Holdout Validation (Last 7 days held out)
    holdout_days = 7
    train_df = df.iloc[:-holdout_days].copy()
    test_df = df.iloc[-holdout_days:].copy()

    # Calculate day-of-week seasonality factors on train set
    train_df["dow"] = train_df["date"].dt.day_of_week
    overall_mean = train_df["revenue"].mean()
    if overall_mean == 0:
        overall_mean = 1.0

    dow_factors = train_df.groupby("dow")["revenue"].mean() / overall_mean
    # Fill any missing day of week with 1.0
    dow_factor_dict = {dow: dow_factors.get(dow, 1.0) for dow in range(7)}

    # Holdout Predictions
    # Using 7-day rolling window on train
    recent_train_window = train_df["revenue"].tail(7).mean()
    holdout_preds = []
    for _, row in test_df.iterrows():
        dow = row["date"].day_of_week
        pred = recent_train_window * dow_factor_dict[dow]
        holdout_preds.append(max(0.0, pred))

    # Evaluate Holdout Metrics
    actuals = test_df["revenue"].values
    preds = np.array(holdout_preds)
    abs_errors = np.abs(actuals - preds)
    mae = float(np.mean(abs_errors))
    
    # Avoid zero division in MAPE
    non_zero_mask = actuals > 0
    if np.any(non_zero_mask):
        mape = float(np.mean(abs_errors[non_zero_mask] / actuals[non_zero_mask]) * 100)
    else:
        mape = 0.0

    rmse = float(np.sqrt(np.mean((actuals - preds) ** 2)))

    # 2. Fit on Full Historical Data for Future 7-day Forecast
    df["dow"] = df["date"].dt.day_of_week
    full_overall_mean = df["revenue"].mean()
    full_dow_factors = (df.groupby("dow")["revenue"].mean() / (full_overall_mean if full_overall_mean > 0 else 1.0)).to_dict()
    full_baseline_window = float(df["revenue"].tail(7).mean())

    last_date = df["date"].max()
    future_forecast = []
    residual_std = float(np.std(abs_errors)) if len(abs_errors) > 1 else mae * 0.5

    for step in range(1, forecast_horizon_days + 1):
        f_date = last_date + timedelta(days=step)
        f_dow = f_date.weekday()
        seasonality = full_dow_factors.get(f_dow, 1.0)
        point_pred = round(max(0.0, full_baseline_window * seasonality), 2)
        margin = round(1.645 * residual_std, 2)  # ~90% confidence interval
        lower_bound = max(0.0, round(point_pred - margin, 2))
        upper_bound = round(point_pred + margin, 2)

        future_forecast.append({
            "date": f_date.strftime("%Y-%m-%d"),
            "predicted_revenue": point_pred,
            "lower_confidence_90": lower_bound,
            "upper_confidence_90": upper_bound,
            "day_name": f_date.strftime("%A")
        })

    # Prepare Historical records for unified chart visualization
    historical_chart = []
    for _, row in df.iterrows():
        historical_chart.append({
            "date": row["date"].strftime("%Y-%m-%d"),
            "actual_revenue": round(float(row["revenue"]), 2),
            "predicted_revenue": None
        })

    return {
        "status": "SUCCESS",
        "algorithm": "Day-of-Week Seasonal Moving Average Baseline",
        "horizon_days": forecast_horizon_days,
        "evaluation": {
            "holdout_period_days": holdout_days,
            "mae": round(mae, 2),
            "mae_formatted": f"₹{mae:,.2f}",
            "mape_percent": round(mape, 2),
            "rmse": round(rmse, 2),
            "mae_interpretation": f"On average, the model's predictions deviated by ₹{mae:,.2f} from actual daily revenues on the holdout test set.",
            "accuracy_summary": "Evaluated against 7-day unseen historical holdout window."
        },
        "assumptions": [
            "Weekly purchasing patterns repeat based on day-of-week seasonality.",
            "Short-term future baseline aligns with the trailing 7-day moving trend.",
            "Confidence bands assume normally distributed short-term forecasting errors."
        ],
        "historical": historical_chart,
        "forecast": future_forecast
    }


# ============================================================================
# 3. RULE-BASED RECOMMENDATION ENGINE
# ============================================================================

def generate_recommendations(analytics_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Grounded Rule-Based Recommendation Engine.
    Examines real computed business metrics and applies deterministic business logic.
    Each recommendation contains:
    - title
    - supporting_metric
    - explanation
    - suggested_action
    - priority: HIGH | MEDIUM | LOW
    - category: REVENUE | RISK | OPERATIONS | GROWTH
    """
    recommendations = []
    rec_id = 1

    kpi = analytics_payload.get("kpi", {})
    categories = analytics_payload.get("categories", [])
    regions = analytics_payload.get("regions", [])
    anomalies = analytics_payload.get("anomalies", [])
    trends = analytics_payload.get("trends", [])

    current_rev = float(kpi.get("total_revenue", 0.0))
    revenue_growth = float(kpi.get("revenue_growth_percent", 0.0))
    total_orders = int(kpi.get("total_orders", 0))
    aov = float(kpi.get("average_order_value", 0.0))

    if total_orders == 0 or current_rev == 0:
        return [{
            "id": "REC-EMPTY",
            "title": "Awaiting Transaction Data",
            "supporting_metric": "0 orders recorded",
            "explanation": "No sales transactions found in the selected range. Ingest new transactions or expand the date range to activate recommendation intelligence.",
            "suggested_action": "Upload a batch sales CSV in the Data Ingestion portal.",
            "priority": "LOW",
            "category": "OPERATIONS"
        }]

    # Rule 1: Revenue Contraction or Strong Growth
    if revenue_growth <= -8.0:
        recommendations.append({
            "id": f"REC-{rec_id:03d}",
            "title": "Revenue Contraction Detected vs Previous Equivalent Period",
            "supporting_metric": f"Period growth: {revenue_growth:+.1f}%",
            "explanation": f"Net revenue contracted by {abs(revenue_growth):.1f}% compared with the immediately preceding equivalent period. This indicates an accelerating slowdown in order volume or basket size.",
            "suggested_action": "Audit top drop-off channels and trigger localized re-engagement promotions for at-risk accounts.",
            "priority": "HIGH",
            "category": "REVENUE"
        })
        rec_id += 1
    elif revenue_growth >= 12.0:
        recommendations.append({
            "id": f"REC-{rec_id:03d}",
            "title": "Strong Revenue Momentum — Capitalize on Expansion",
            "supporting_metric": f"Period growth: {revenue_growth:+.1f}%",
            "explanation": f"Revenue expanded by {revenue_growth:.1f}% over the prior period, driven by surging customer demand.",
            "suggested_action": "Ensure supply chain buffer inventory on high-velocity SKUs to prevent stockouts during peak momentum.",
            "priority": "MEDIUM",
            "category": "GROWTH"
        })
        rec_id += 1

    # Rule 2: Category Concentration Risk
    if categories and current_rev > 0:
        top_cat = max(categories, key=lambda c: float(c.get("revenue", 0)))
        top_cat_rev = float(top_cat.get("revenue", 0))
        top_cat_share = (top_cat_rev / current_rev) * 100
        if top_cat_share >= 40.0:
            recommendations.append({
                "id": f"REC-{rec_id:03d}",
                "title": f"Category Concentration Risk in '{top_cat.get('category')}'",
                "supporting_metric": f"{top_cat_share:.1f}% of total revenue (₹{top_cat_rev:,.2f})",
                "explanation": f"A single category ('{top_cat.get('category')}') contributes more than 40% of total company revenue. This creates a revenue vulnerability to supply shocks or demand shifts in this segment.",
                "suggested_action": f"Diversify revenue streams by bundling '{top_cat.get('category')}' items with complementary, higher-margin underperforming categories.",
                "priority": "MEDIUM",
                "category": "RISK"
            })
            rec_id += 1

    # Rule 3: Regional Performance Disparity
    if len(regions) >= 3 and current_rev > 0:
        sorted_regions = sorted(regions, key=lambda r: float(r.get("revenue", 0)))
        lowest_reg = sorted_regions[0]
        highest_reg = sorted_regions[-1]
        lowest_rev = float(lowest_reg.get("revenue", 0))
        highest_rev = float(highest_reg.get("revenue", 0))
        avg_rev = current_rev / len(regions)

        if lowest_rev < (avg_rev * 0.5):
            recommendations.append({
                "id": f"REC-{rec_id:03d}",
                "title": f"Regional Sales Underperformance in {lowest_reg.get('region')} Region",
                "supporting_metric": f"Revenue: ₹{lowest_rev:,.2f} (50% below regional average ₹{avg_rev:,.2f})",
                "explanation": f"The {lowest_reg.get('region')} region is significantly lagging other territories, generating only ₹{lowest_rev:,.2f} compared with {highest_reg.get('region')} at ₹{highest_rev:,.2f}.",
                "suggested_action": f"Review distribution logistics, regional pricing tiers, and delivery fulfillment partner SLAs in {lowest_reg.get('region')}.",
                "priority": "HIGH" if lowest_rev < (avg_rev * 0.3) else "MEDIUM",
                "category": "OPERATIONS"
            })
            rec_id += 1

    # Rule 4: Critical Anomaly Investigation
    high_anomalies = [a for a in anomalies if a.get("severity") == "HIGH"]
    if high_anomalies:
        latest_anomaly = high_anomalies[-1]
        a_date = latest_anomaly.get("date")
        a_rev = latest_anomaly.get("observed_revenue", 0)
        a_type = latest_anomaly.get("anomaly_type", "SPIKE")
        if a_type == "DROP":
            recommendations.append({
                "id": f"REC-{rec_id:03d}",
                "title": f"Investigate Critical Revenue Collapse Flagged on {a_date}",
                "supporting_metric": f"Observed revenue: ₹{a_rev:,.2f}",
                "explanation": f"On {a_date}, daily revenue fell severely below the lower statistical threshold. Potential causes include checkout gateway failure, infrastructure downtime, or supplier stockouts.",
                "suggested_action": f"Check transaction audit logs and payment gateway error rates for {a_date} in the Anomaly Inspection view.",
                "priority": "HIGH",
                "category": "OPERATIONS"
            })
            rec_id += 1
        else:
            recommendations.append({
                "id": f"REC-{rec_id:03d}",
                "title": f"Analyze Extreme Demand Outlier on {a_date}",
                "supporting_metric": f"Observed revenue: ₹{a_rev:,.2f}",
                "explanation": f"An exceptional revenue spike was recorded on {a_date}. Identifying whether this was organic viral traffic, wholesale bulk ordering, or marketing campaign attribution is crucial for replication.",
                "suggested_action": f"Review individual high-value transactions on {a_date} using the transaction inspection drawer.",
                "priority": "MEDIUM",
                "category": "GROWTH"
            })
            rec_id += 1

    # Rule 5: Average Order Value (AOV) Optimization
    if aov > 0 and aov < 2500.0:
        recommendations.append({
            "id": f"REC-{rec_id:03d}",
            "title": "Low Average Order Value (AOV) Optimization Opportunity",
            "supporting_metric": f"Current AOV: ₹{aov:,.2f}",
            "explanation": f"Average order value of ₹{aov:,.2f} indicates single-item cart checkout behavior across consumer segments.",
            "suggested_action": "Introduce tiered free shipping thresholds at ₹3,000 and dynamic cross-sell product bundles during checkout.",
            "priority": "LOW",
            "category": "REVENUE"
        })
        rec_id += 1

    return recommendations
