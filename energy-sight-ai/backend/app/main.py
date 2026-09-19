"""
EnerSight AI — FastAPI Main Application
"""

import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import numpy as np
import io
import subprocess

from app.schemas.schemas import (
    HealthResponse, DataSummaryResponse, ConsumptionResponse,
    ForecastRequest, ForecastResponse, ForecastPoint,
    ModelEvaluationResponse, ModelMetricsResponse,
    PatternsResponse, AnomalyResponse, AnomalyPoint,
    ExplainabilityResponse, InsightsResponse, InsightItem,
    SystemStatusResponse, CoPilotRequest, CoPilotResponse,
)
from ml.preprocessing import load_clean_data, get_data_summary
from ml.features import engineer_features, get_feature_names, ALL_FEATURES
from ml.forecasting import load_model, list_trained_models, MODEL_REGISTRY
from ml.anomaly import detect_anomalies, anomaly_summary
from ml.explainability import build_explainability_report
from app.services.analytics import compute_patterns, generate_ai_insights
from app.services.forecast_service import generate_forecast, get_historical_window

# ─── Logging ───
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("energysight")

# ─── App ───
app = FastAPI(
    title="EnerSight AI API",
    description="AI-powered energy consumption forecasting platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── App State ───
DATA_DIR = Path(__file__).parent.parent / "data"
MODELS_DIR = Path(__file__).parent.parent / "trained_models"
METRICS_PATH = MODELS_DIR / "metrics.json"

_state: dict = {
    "df": None,
    "meta": None,
    "models": {},
    "metrics": [],
    "patterns": None,
    "anomalies": None,
    "acknowledged_anomalies": set(),
    "is_retraining": False,
}


def get_df() -> pd.DataFrame:
    if _state["df"] is None:
        try:
            _state["df"], _state["meta"] = load_clean_data(DATA_DIR)
        except FileNotFoundError:
            raise HTTPException(
                status_code=503,
                detail="No data found. Run: python scripts/download_data.py  OR  python scripts/generate_demo_data.py",
            )
    return _state["df"]


def get_model_cached(name: str):
    if name not in _state["models"]:
        m = load_model(name)
        if m is None:
            raise HTTPException(
                status_code=404,
                detail=f"Model '{name}' not trained. Run: python scripts/train_models.py",
            )
        _state["models"][name] = m
    return _state["models"][name]


def get_metrics() -> list[dict]:
    if not _state["metrics"] and METRICS_PATH.exists():
        with open(METRICS_PATH) as f:
            _state["metrics"] = json.load(f)
    return _state["metrics"]


def get_patterns() -> dict:
    if _state["patterns"] is None:
        df = get_df()
        _state["patterns"] = compute_patterns(df)
    return _state["patterns"]


# ─── Routes ───

@app.get("/api/health", response_model=HealthResponse)
def health():
    trained = list_trained_models()
    data_loaded = (DATA_DIR / "consumption.csv").exists() or (DATA_DIR / "demo_consumption.csv").exists()
    is_demo = not (DATA_DIR / "consumption.csv").exists()
    return HealthResponse(
        status="ok",
        version="1.0.0",
        models_loaded=trained,
        data_loaded=data_loaded,
        is_demo=is_demo,
    )


@app.get("/api/system/status", response_model=SystemStatusResponse)
def system_status():
    trained = list_trained_models()
    is_demo = not (DATA_DIR / "consumption.csv").exists()
    return SystemStatusResponse(
        backend_status="online",
        data_status="ready" if (DATA_DIR / "consumption.csv").exists() or (DATA_DIR / "demo_consumption.csv").exists() else "missing",
        models_status={name: (name in trained) for name in MODEL_REGISTRY.keys()},
        is_demo=is_demo,
        version="1.0.0",
    )


@app.get("/api/data/summary")
def data_summary():
    df = get_df()
    meta = _state.get("meta", {})
    report = meta.get("report", {})
    is_demo = meta.get("is_demo", True)
    report["is_demo"] = is_demo
    report["data_source"] = meta.get("source", "Unknown")
    return report


@app.get("/api/data/consumption")
def consumption(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    limit: int = Query(default=8760, le=50000),
    resample: Optional[str] = Query(default=None, description="e.g. '1D' to resample to daily"),
):
    df = get_df()
    is_demo = _state.get("meta", {}).get("is_demo", True)
    
    if start:
        df = df[df["timestamp"] >= pd.to_datetime(start)]
    if end:
        df = df[df["timestamp"] <= pd.to_datetime(end)]
    
    if resample:
        df = df.set_index("timestamp")["consumption_kwh"].resample(resample).mean().reset_index()
        df.columns = ["timestamp", "consumption_kwh"]
    
    df = df.tail(limit)
    
    data = [
        {"timestamp": str(row["timestamp"]), "value": round(float(row["consumption_kwh"]), 4), "type": "historical"}
        for _, row in df.iterrows()
    ]
    return {"data": data, "total": len(data), "is_demo": is_demo}


@app.get("/api/analytics/patterns")
def patterns():
    return get_patterns()


@app.get("/api/models")
def models_list():
    trained = list_trained_models()
    metrics = get_metrics()
    metrics_by_name = {m["model_name"]: m for m in metrics}
    
    model_display = {
        "naive": "Seasonal Naive Baseline",
        "linear_regression": "Ridge Linear Regression",
        "random_forest": "Random Forest",
        "xgboost": "XGBoost",
        "sarima": "SARIMA",
        "prophet": "Facebook Prophet",
        "lstm": "LSTM (PyTorch)",
        "ensemble": "Weighted Ensemble",
    }
    model_desc = {
        "naive": "Predicts using the same-hour value from the previous week.",
        "linear_regression": "Ridge-regularized linear model with temporal and lag features.",
        "random_forest": "Ensemble of 200 decision trees with uncertainty via tree variance.",
        "xgboost": "Gradient boosting with 300 estimators, optimized for tabular time-series.",
        "sarima": "Seasonal ARIMA — classical statistical time-series model.",
        "prophet": "Facebook Prophet with daily/weekly/yearly seasonality and uncertainty.",
        "lstm": "Long Short-Term Memory neural network trained on 168h sequences.",
        "ensemble": "Weighted combination of top models by validation MAE.",
    }
    model_intervals = {
        "naive": False,
        "linear_regression": True,
        "random_forest": True,
        "xgboost": False,
        "sarima": True,
        "prophet": True,
        "lstm": False,
        "ensemble": True,
    }
    
    return [
        {
            "name": name,
            "display_name": model_display.get(name, name),
            "description": model_desc.get(name, ""),
            "trained": name in trained,
            "supports_intervals": model_intervals.get(name, False),
            "metrics": metrics_by_name.get(name),
        }
        for name in MODEL_REGISTRY.keys()
    ]


@app.get("/api/models/evaluation")
def model_evaluation(metric: str = Query(default="mae")):
    metrics = get_metrics()
    if not metrics:
        raise HTTPException(
            status_code=404,
            detail="No evaluation metrics found. Run: python scripts/train_models.py",
        )
    
    from ml.evaluation import rank_models, ModelMetrics
    metric_objs = []
    for m in metrics:
        try:
            metric_objs.append(ModelMetrics(**{k: v for k, v in m.items() if k != "split"}))
        except Exception:
            pass
    
    ranked = rank_models(metric_objs, metric=metric)
    best = ranked[0].model_name if ranked else "unknown"
    
    result = []
    for rank, m in enumerate(ranked):
        d = m.to_dict()
        d["rank"] = rank + 1
        result.append(d)
    
    return {
        "metrics": result,
        "ranked_by": metric,
        "best_model": best,
        "generated_at": datetime.now().isoformat(),
    }


@app.post("/api/forecast")
def forecast(request: ForecastRequest):
    df = get_df()
    model = get_model_cached(request.model)
    
    try:
        fc = generate_forecast(model, df, horizon=request.horizon.value)
    except Exception as e:
        logger.exception(f"Forecast error for model={request.model}")
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")
    
    history = []
    if request.include_history:
        history = get_historical_window(df, n_hours=request.history_hours)
    
    return {
        "forecast": fc,
        "historical": history,
        "model": request.model,
        "horizon": request.horizon.value,
        "generated_at": datetime.now().isoformat(),
        "interval_available": getattr(model, "supports_intervals", False),
    }


@app.get("/api/anomalies")
def anomalies(
    methods: str = Query(default="rolling_zscore,isolation_forest"),
    limit: int = Query(default=100, le=500),
):
    df = get_df()
    method_list = [m.strip() for m in methods.split(",")]
    
    if _state["anomalies"] is None:
        _state["anomalies"] = detect_anomalies(df, methods=method_list)
    
    all_anomalies = _state["anomalies"][:limit]
    summary = anomaly_summary(all_anomalies)
    
    return {
        "anomalies": all_anomalies,
        "summary": summary,
        "total": len(all_anomalies),
    }


@app.get("/api/explainability")
def explainability(model: str = Query(default="xgboost")):
    df = get_df()
    loaded_model = get_model_cached(model)
    
    feat_df = engineer_features(df, drop_na=True)
    feature_cols = [c for c in ALL_FEATURES if c in feat_df.columns]
    X_test = feat_df[feature_cols].tail(500)
    
    report = build_explainability_report(loaded_model, X_test, feature_cols)
    return report


@app.get("/api/analytics/insights")
def insights():
    df = get_df()
    patterns = get_patterns()
    
    # Get anomaly summary
    try:
        anoms = detect_anomalies(df)
        anom_sum = anomaly_summary(anoms)
    except Exception:
        anom_sum = None
    
    insights_list = generate_ai_insights(df, patterns, anomaly_summary=anom_sum)
    
    return {
        "insights": insights_list,
        "generated_at": datetime.now().isoformat(),
        "data_points_analyzed": len(df),
    }


# ─── Data Upload ───
@app.post("/api/data/upload")
async def upload_data(file: UploadFile = File(...)):
    """Allow user to upload their own CSV consumption file."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")
    
    # Detect timestamp column
    ts_candidates = [c for c in df.columns if "time" in c.lower() or "date" in c.lower() or "ts" in c.lower()]
    val_candidates = [c for c in df.columns if any(k in c.lower() for k in ["power", "kwh", "consumption", "energy", "load"])]
    
    return {
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "timestamp_candidates": ts_candidates,
        "value_candidates": val_candidates,
        "preview": df.head(5).to_dict(orient="records"),
        "status": "uploaded — use /api/data/upload/apply to set column mapping",
    }


@app.post("/api/data/upload/apply")
async def apply_upload(
    file: UploadFile = File(...),
    timestamp_col: str = Query(...),
    value_col: str = Query(...),
):
    """Apply column mapping and save uploaded data as active dataset."""
    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
        df["timestamp"] = pd.to_datetime(df[timestamp_col])
        df["consumption_kwh"] = pd.to_numeric(df[value_col], errors="coerce")
        df = df[["timestamp", "consumption_kwh"]].dropna()
        df["is_demo"] = False
        
        out_path = DATA_DIR / "consumption.csv"
        df.to_csv(out_path, index=False)
        
        # Clear cached state
        _state["df"] = None
        _state["meta"] = None
        _state["patterns"] = None
        _state["anomalies"] = None
        
        return {"status": "saved", "rows": len(df), "path": str(out_path)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process: {e}")


# ─── Download endpoints ───
@app.get("/api/download/forecast")
def download_forecast(model: str = Query(default="xgboost"), horizon: str = Query(default="24h")):
    df = get_df()
    model_obj = get_model_cached(model)
    fc = generate_forecast(model_obj, df, horizon=horizon)
    
    fc_df = pd.DataFrame(fc)
    output = fc_df.to_csv(index=False)
    
    return StreamingResponse(
        io.StringIO(output),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=energysight_forecast_{model}_{horizon}.csv"},
    )


@app.get("/api/download/anomalies")
def download_anomalies():
    df = get_df()
    anoms = detect_anomalies(df)
    anom_df = pd.DataFrame(anoms)
    output = anom_df.to_csv(index=False)
    
    return StreamingResponse(
        io.StringIO(output),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=energysight_anomalies.csv"},
    )


# ─── Model Retraining Endpoint ───
def _run_retrain_task():
    _state["is_retraining"] = True
    try:
        script_path = Path(__file__).parent.parent.parent / "scripts" / "train_models.py"
        subprocess.run([sys.executable, str(script_path), "--fast"], check=True)
        # Clear model & metric caches
        _state["models"] = {}
        _state["metrics"] = []
        logger.info("Model retraining task completed successfully.")
    except Exception as e:
        logger.exception(f"Retraining task failed: {e}")
    finally:
        _state["is_retraining"] = False


@app.post("/api/models/retrain")
def retrain_models(bg: BackgroundTasks):
    if _state["is_retraining"]:
        return {"status": "in_progress", "message": "Model retraining task is already running in background."}
    
    bg.add_task(_run_retrain_task)
    return {"status": "started", "message": "Model retraining triggered in background."}


@app.get("/api/models/retrain/status")
def retrain_status():
    return {"is_retraining": _state["is_retraining"]}


# ─── Anomaly Acknowledgment ───
@app.post("/api/anomalies/acknowledge")
def acknowledge_anomaly(timestamp: str = Query(...)):
    _state["acknowledged_anomalies"].add(timestamp)
    return {"status": "acknowledged", "timestamp": timestamp, "total_acknowledged": len(_state["acknowledged_anomalies"])}


# ─── AI Grid Co-Pilot Chat Endpoint ───
@app.post("/api/analytics/copilot", response_model=CoPilotResponse)
def copilot_query(req: CoPilotRequest):
    q = req.query.lower().strip()
    df = get_df()
    
    # 1. Peak Load intent
    if any(k in q for k in ["peak", "maximum", "high load", "highest", "top load"]):
        max_val = float(df["consumption_kwh"].max())
        max_ts = str(df.loc[df["consumption_kwh"].idxmax(), "timestamp"])
        avg_val = float(df["consumption_kwh"].mean())
        pct_above = ((max_val - avg_val) / avg_val) * 100
        
        ans = (
            f"### ⚡ Peak Load Analysis\n\n"
            f"- **Historical Peak Load**: `{max_val:.2f} kW` recorded at `{max_ts}`.\n"
            f"- **Average Grid Baseline**: `{avg_val:.2f} kW`.\n"
            f"- **Peak Deviation**: Peak is **+{pct_above:.1f}%** above average grid consumption.\n\n"
            f"**Operational Recommendation**: To prevent transformer overloading during peak hours (17:00–20:00), "
            f"consider dispatching energy storage or initiating 10–15% demand-response load shaving."
        )
        return CoPilotResponse(
            answer=ans,
            category="Peak Load Analysis",
            suggested_actions=["Simulate 15% Peak Shaving", "View Diurnal Patterns", "Check Forecast Studio"],
            generated_at=datetime.now().isoformat(),
            data_summary={"peak_kw": max_val, "peak_timestamp": max_ts, "avg_kw": avg_val}
        )

    # 2. Model Accuracy / Leaderboard intent
    elif any(k in q for k in ["best model", "accuracy", "error", "mae", "rmse", "leaderboard", "benchmark", "rank"]):
        metrics = get_metrics()
        if metrics:
            sorted_m = sorted(metrics, key=lambda x: x.get("mae", 999))
            top = sorted_m[0]
            ans = (
                f"### 🏆 Model Leaderboard & Accuracy Benchmark\n\n"
                f"- **Top Performer**: `{top['model_name']}` with **MAE of {top['mae']:.2f} kW**.\n"
                f"- **RMSE**: `{top['rmse']:.2f} kW` | **R² Variance**: `{top['r2']:.3f}`.\n\n"
                f"**Engine Standings**:\n"
            )
            for i, m in enumerate(sorted_m[:5]):
                ans += f"{i+1}. **{m['model_name']}**: MAE {m['mae']:.2f} kW (Latency: {m.get('latency_ms', 0):.1f} ms)\n"
            
            return CoPilotResponse(
                answer=ans,
                category="Model Benchmarks",
                suggested_actions=["Open Model Arena", "Run Forecast with Top Model", "Retrain Models"],
                generated_at=datetime.now().isoformat(),
                data_summary={"top_model": top['model_name'], "top_mae": top['mae']}
            )
        else:
            return CoPilotResponse(
                answer="No model metrics currently available. Please trigger model training in Settings.",
                category="Model Benchmarks",
                suggested_actions=["Trigger Retraining"],
                generated_at=datetime.now().isoformat(),
            )

    # 3. Anomaly / Incident intent
    elif any(k in q for k in ["anomaly", "anomalies", "spike", "outlier", "alert", "incident"]):
        anoms = detect_anomalies(df)
        high_anoms = [a for a in anoms if a.get("severity") == "HIGH"]
        unusual_anoms = [a for a in anoms if a.get("severity") == "UNUSUAL"]
        
        ans = (
            f"### 🚨 Grid Anomaly Inspection\n\n"
            f"- **Total Flagged Anomalies**: `{len(anoms)}` incident timesteps.\n"
            f"- **HIGH Severity Spikes**: `{len(high_anoms)}` critical events.\n"
            f"- **UNUSUAL Deviations**: `{len(unusual_anoms)}` moderate shifts.\n\n"
        )
        if high_anoms:
            latest = high_anoms[0]
            ans += (
                f"**Latest Critical Spike**: `{latest['observed_value']:.1f} kW` vs expected `{latest['expected_value']:.1f} kW` "
                f"(+{latest['difference']:.1f} kW delta) at `{latest['timestamp']}`."
            )
        
        return CoPilotResponse(
            answer=ans,
            category="Anomaly Intelligence",
            suggested_actions=["Open Anomaly Monitor", "Acknowledge Alerts", "Download Anomaly CSV"],
            generated_at=datetime.now().isoformat(),
            data_summary={"total_anomalies": len(anoms), "high_severity": len(high_anoms)}
        )

    # 4. Simulation / Demand-Response / Carbon intent
    elif any(k in q for k in ["simulate", "reduction", "shave", "demand response", "carbon", "save"]):
        avg_val = float(df["consumption_kwh"].mean())
        shaved_kw = avg_val * 0.15
        annual_kwh_saved = shaved_kw * 24 * 365
        cost_saved = annual_kwh_saved * 0.14
        co2_saved = (annual_kwh_saved * 0.410) / 1000  # metric tons
        
        ans = (
            f"### 🌿 15% Demand-Response Load Shaving Simulation\n\n"
            f"- **Baseline Hourly Load**: `{avg_val:.1f} kW`\n"
            f"- **15% Peak Shaving Reduction**: `-{shaved_kw:.1f} kW` during peak hours\n"
            f"- **Projected Annual Energy Savings**: `{annual_kwh_saved:,.0f} kWh`\n"
            f"- **Estimated Financial Savings**: `$ {cost_saved:,.2f} / year` (at $0.14/kWh)\n"
            f"- **Carbon Offset**: `{co2_saved:,.2f} metric tons CO₂ / year`\n\n"
            f"**Action Plan**: Automated battery storage dispatch at 17:00 can absorb peak demand without operational disruption."
        )
        return CoPilotResponse(
            answer=ans,
            category="Demand Response Simulation",
            suggested_actions=["Run Interactive Demand Simulator", "Export Executive Audit"],
            generated_at=datetime.now().isoformat(),
            data_summary={"hourly_shaved_kw": shaved_kw, "annual_savings_usd": cost_saved}
        )

    # 5. General / Default response
    else:
        latest_reading = float(df["consumption_kwh"].iloc[-1])
        avg_24h = float(df["consumption_kwh"].tail(24).mean())
        peak_24h = float(df["consumption_kwh"].tail(24).max())
        
        ans = (
            f"### ⚡ EnerSight AI Grid Telemetry Assistant\n\n"
            f"- **Current Active Load**: `{latest_reading:.2f} kW`\n"
            f"- **24h Rolling Average**: `{avg_24h:.2f} kW`\n"
            f"- **24h Peak Demand**: `{peak_24h:.2f} kW`\n"
            f"- **Telemetry Dataset**: `{len(df):,}` hourly data points active.\n\n"
            f"**Suggested Telemetry Questions**:\n"
            f"- *'When is peak demand?'*\n"
            f"- *'Which model is most accurate?'*\n"
            f"- *'Show high severity anomalies'*\n"
            f"- *'Simulate 15% demand response'*."
        )
        return CoPilotResponse(
            answer=ans,
            category="General Grid Overview",
            suggested_actions=["Check Peak Demand", "Inspect Accuracy Leaderboard", "View Anomalies"],
            generated_at=datetime.now().isoformat(),
            data_summary={"current_load_kw": latest_reading, "avg_24h_kw": avg_24h}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

