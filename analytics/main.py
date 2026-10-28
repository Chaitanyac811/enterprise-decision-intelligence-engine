"""
Enterprise Decision Intelligence Engine: Analytics FastAPI Service
Runs independently on port 5001.
Provides clean REST API endpoints for statistical anomaly detection, forecasting, and recommendations.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import os

from engine import detect_anomalies, forecast_sales, generate_recommendations

app = FastAPI(
    title="Enterprise Decision Intelligence — Analytics Microservice",
    version="1.0.0",
    description="Python Analytics Engine powering Statistical Anomaly Detection, Time-Series Forecasting, and Rule-Based Recommendations."
)

# Enable CORS for local backend and frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DailyRecord(BaseModel):
    date: str
    revenue: float
    orders: Optional[int] = 0
    units: Optional[int] = 0

class AnomalyRequest(BaseModel):
    daily_data: List[DailyRecord]

class ForecastRequest(BaseModel):
    daily_data: List[DailyRecord]
    horizon_days: Optional[int] = 7

class RecommendationsRequest(BaseModel):
    kpi: Dict[str, Any]
    categories: Optional[List[Dict[str, Any]]] = []
    regions: Optional[List[Dict[str, Any]]] = []
    anomalies: Optional[List[Dict[str, Any]]] = []
    trends: Optional[List[Dict[str, Any]]] = []

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "analytics-engine",
        "runtime": "python-fastapi",
        "version": "1.0.0"
    }

@app.post("/analyze/anomalies")
def api_detect_anomalies(payload: AnomalyRequest):
    try:
        raw_data = [d.dict() for d in payload.daily_data]
        result = detect_anomalies(raw_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")

@app.post("/analyze/forecast")
def api_forecast_sales(payload: ForecastRequest):
    try:
        raw_data = [d.dict() for d in payload.daily_data]
        result = forecast_sales(raw_data, forecast_horizon_days=payload.horizon_days)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sales forecasting failed: {str(e)}")

@app.post("/analyze/recommendations")
def api_generate_recommendations(payload: RecommendationsRequest):
    try:
        result = generate_recommendations(payload.dict())
        return {
            "status": "SUCCESS",
            "count": len(result),
            "recommendations": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("ANALYTICS_PORT", 5001))
    print(f"Starting Analytics Engine on port {port}...")
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=False)
