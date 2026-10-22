"""
EnerSight AI — Backend API Tests
Tests every endpoint against its real schema.
Run from backend/ directory:
    pip install pytest httpx
    pytest tests/test_api.py -v
"""

import io
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Make sure we can import from backend/
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)

# ─── Root Route ─────────────────────────────────────────────────────────────

def test_root():
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "message" in body
    assert "/docs" in body.get("docs", "")


# ─── Health & Status ────────────────────────────────────────────────────────

def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "version" in body
    assert isinstance(body["models_loaded"], list)
    assert isinstance(body["data_loaded"], bool)
    assert isinstance(body["is_demo"], bool)


def test_system_status():
    r = client.get("/api/system/status")
    assert r.status_code == 200
    body = r.json()
    assert "backend_status" in body
    assert "data_status" in body
    assert "models_status" in body
    assert isinstance(body["models_status"], dict)
    assert "is_demo" in body
    assert "version" in body


# ─── Data Endpoints ─────────────────────────────────────────────────────────

def test_data_summary():
    r = client.get("/api/data/summary")
    assert r.status_code == 200
    body = r.json()
    assert "mean_consumption" in body
    assert "max_consumption" in body
    assert "min_consumption" in body
    assert "total_rows" in body
    assert body["total_rows"] > 0


def test_data_consumption_default():
    r = client.get("/api/data/consumption")
    assert r.status_code == 200
    body = r.json()
    assert "data" in body
    assert "total" in body
    assert isinstance(body["data"], list)
    assert len(body["data"]) > 0
    # Validate first point structure
    point = body["data"][0]
    assert "timestamp" in point
    assert "value" in point
    assert "type" in point


def test_data_consumption_with_limit():
    r = client.get("/api/data/consumption?limit=10")
    assert r.status_code == 200
    body = r.json()
    assert len(body["data"]) <= 10


def test_data_consumption_with_resample():
    r = client.get("/api/data/consumption?resample=1D&limit=30")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body["data"], list)


def test_data_consumption_date_filter():
    r = client.get("/api/data/consumption?start=2021-01-01&end=2021-06-30")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body["data"], list)


# ─── Analytics Endpoints ────────────────────────────────────────────────────

def test_patterns():
    r = client.get("/api/analytics/patterns")
    assert r.status_code == 200
    body = r.json()
    assert "hourly_profile" in body
    assert "daily_profile" in body
    assert "monthly_profile" in body
    assert "peak_hour" in body
    assert "trough_hour" in body
    assert isinstance(body["hourly_profile"], list)
    assert len(body["hourly_profile"]) == 24


def test_insights():
    r = client.get("/api/analytics/insights")
    assert r.status_code == 200
    body = r.json()
    assert "insights" in body
    assert isinstance(body["insights"], list)
    assert len(body["insights"]) > 0
    assert "generated_at" in body
    assert "data_points_analyzed" in body


# ─── Models Endpoints ───────────────────────────────────────────────────────

def test_models_list():
    r = client.get("/api/models")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    assert len(body) > 0
    m = body[0]
    assert "name" in m
    assert "display_name" in m
    assert "trained" in m
    assert "supports_intervals" in m


def test_model_evaluation_no_metrics_or_found():
    r = client.get("/api/models/evaluation")
    # Either 200 (with metrics) or 404 (no metrics yet)
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        body = r.json()
        assert "metrics" in body
        assert "best_model" in body
        assert isinstance(body["metrics"], list)


def test_model_evaluation_ranked_by_rmse():
    r = client.get("/api/models/evaluation?metric=rmse")
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        body = r.json()
        assert body.get("ranked_by") == "rmse"


def test_retrain_status():
    r = client.get("/api/models/retrain/status")
    assert r.status_code == 200
    body = r.json()
    assert "is_retraining" in body
    assert isinstance(body["is_retraining"], bool)


def test_retrain_trigger():
    # Just test the trigger response — don't actually run full training
    r = client.post("/api/models/retrain")
    assert r.status_code == 200
    body = r.json()
    assert "status" in body
    assert body["status"] in ("started", "in_progress")


# ─── Forecast Endpoint ──────────────────────────────────────────────────────

def test_forecast_default():
    """Test POST /api/forecast with valid schema."""
    payload = {
        "model": "xgboost",
        "horizon": "24h",
        "include_history": True,
        "history_hours": 48,
    }
    r = client.post("/api/forecast", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "forecast" in body
    assert "model" in body
    assert "horizon" in body
    assert isinstance(body["forecast"], list)
    assert len(body["forecast"]) == 24
    # Validate forecast point structure
    fp = body["forecast"][0]
    assert "timestamp" in fp
    assert "predicted" in fp
    assert fp["predicted"] >= 0


def test_forecast_all_horizons():
    """Test all valid horizon values."""
    for horizon in ["1h", "6h", "12h", "24h", "7d"]:
        payload = {"model": "xgboost", "horizon": horizon, "include_history": False}
        r = client.post("/api/forecast", json=payload)
        assert r.status_code == 200, f"horizon={horizon} failed: {r.text}"
        body = r.json()
        expected = {"1h": 1, "6h": 6, "12h": 12, "24h": 24, "7d": 168}[horizon]
        assert len(body["forecast"]) == expected


def test_forecast_invalid_horizon():
    """Invalid horizon value should return 422."""
    payload = {"model": "xgboost", "horizon": "999h"}
    r = client.post("/api/forecast", json=payload)
    assert r.status_code == 422


def test_forecast_with_history():
    payload = {
        "model": "linear_regression",
        "horizon": "6h",
        "include_history": True,
        "history_hours": 24,
    }
    r = client.post("/api/forecast", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body["historical"], list)
    assert len(body["historical"]) > 0


def test_forecast_unknown_model_fallback():
    """Unknown model should fall back gracefully, not crash."""
    payload = {"model": "nonexistent_model_xyz", "horizon": "24h", "include_history": False}
    r = client.post("/api/forecast", json=payload)
    # Should succeed (with fallback) or return a proper error
    assert r.status_code in (200, 422, 503)


# ─── Anomaly Endpoints ──────────────────────────────────────────────────────

def test_anomalies_default():
    r = client.get("/api/anomalies")
    assert r.status_code == 200
    body = r.json()
    assert "anomalies" in body
    assert "summary" in body
    assert "total" in body
    assert isinstance(body["anomalies"], list)
    summary = body["summary"]
    assert "total" in summary
    assert "high" in summary
    assert "unusual" in summary


def test_anomalies_with_limit():
    r = client.get("/api/anomalies?limit=10")
    assert r.status_code == 200
    body = r.json()
    assert len(body["anomalies"]) <= 10


def test_anomalies_single_method():
    r = client.get("/api/anomalies?methods=rolling_zscore")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body["anomalies"], list)


def test_acknowledge_anomaly():
    """Test anomaly acknowledgement."""
    test_ts = "2021-01-01 12:00:00"
    r = client.post(f"/api/anomalies/acknowledge?timestamp={test_ts}")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "acknowledged"
    assert body["timestamp"] == test_ts
    assert "total_acknowledged" in body


def test_acknowledge_anomaly_missing_param():
    """Missing timestamp should return 422."""
    r = client.post("/api/anomalies/acknowledge")
    assert r.status_code == 422


# ─── Explainability Endpoint ────────────────────────────────────────────────

def test_explainability_xgboost():
    r = client.get("/api/explainability?model=xgboost")
    assert r.status_code == 200
    body = r.json()
    assert "model_name" in body
    assert "feature_importance" in body
    assert isinstance(body["feature_importance"], list)
    if body["feature_importance"]:
        fi = body["feature_importance"][0]
        assert "feature" in fi
        assert "importance" in fi
        assert "rank" in fi


def test_explainability_linear_regression():
    r = client.get("/api/explainability?model=linear_regression")
    assert r.status_code == 200


# ─── Upload Endpoints ───────────────────────────────────────────────────────

def _make_valid_csv() -> bytes:
    """Create a minimal valid test CSV."""
    lines = [
        "timestamp,consumption_kwh",
        "2023-01-01 00:00:00,1.23",
        "2023-01-01 01:00:00,1.45",
        "2023-01-01 02:00:00,1.12",
        "2023-01-01 03:00:00,0.98",
        "2023-01-01 04:00:00,0.87",
    ]
    return "\n".join(lines).encode("utf-8")


def test_upload_valid_csv():
    csv_bytes = _make_valid_csv()
    r = client.post(
        "/api/data/upload",
        files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert r.status_code == 200
    body = r.json()
    assert "rows" in body
    assert "columns" in body
    assert body["rows"] == 5


def test_upload_invalid_extension():
    r = client.post(
        "/api/data/upload",
        files={"file": ("test.txt", io.BytesIO(b"not,csv"), "text/plain")},
    )
    assert r.status_code == 400


def test_upload_malformed_csv():
    bad_csv = b"\x00\xff\xfe bad binary content"
    r = client.post(
        "/api/data/upload",
        files={"file": ("bad.csv", io.BytesIO(bad_csv), "text/csv")},
    )
    # Should fail gracefully — not 500
    assert r.status_code in (400, 200)


# ─── Download Endpoints ─────────────────────────────────────────────────────

def test_download_forecast():
    r = client.get("/api/download/forecast?model=xgboost&horizon=24h")
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    assert "attachment" in r.headers.get("content-disposition", "")
    # Verify CSV content is parseable
    content = r.content.decode("utf-8")
    lines = content.strip().split("\n")
    assert len(lines) > 1  # header + data rows


def test_download_anomalies():
    r = client.get("/api/download/anomalies")
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    assert "attachment" in r.headers.get("content-disposition", "")


# ─── AI Co-Pilot Endpoint ───────────────────────────────────────────────────

def test_copilot_peak_query():
    r = client.post("/api/analytics/copilot", json={"query": "What is peak demand?"})
    assert r.status_code == 200
    body = r.json()
    assert "answer" in body
    assert "category" in body
    assert "suggested_actions" in body
    assert "generated_at" in body
    assert isinstance(body["suggested_actions"], list)


def test_copilot_accuracy_query():
    r = client.post("/api/analytics/copilot", json={"query": "Which model has best accuracy?"})
    assert r.status_code == 200
    body = r.json()
    assert "answer" in body


def test_copilot_anomaly_query():
    r = client.post("/api/analytics/copilot", json={"query": "Show anomalies and spikes"})
    assert r.status_code == 200
    body = r.json()
    assert "answer" in body


def test_copilot_simulation_query():
    r = client.post("/api/analytics/copilot", json={"query": "Simulate 15% demand response reduction"})
    assert r.status_code == 200
    body = r.json()
    assert "answer" in body


def test_copilot_general_query():
    r = client.post("/api/analytics/copilot", json={"query": "What is the current energy status?"})
    assert r.status_code == 200
    body = r.json()
    assert "answer" in body
    assert len(body["answer"]) > 0


def test_copilot_empty_query():
    """Empty query body should return 422."""
    r = client.post("/api/analytics/copilot", json={})
    assert r.status_code == 422


def test_copilot_missing_body():
    """Missing body should return 422."""
    r = client.post("/api/analytics/copilot")
    assert r.status_code == 422


# ─── Security Checks ────────────────────────────────────────────────────────

def test_no_stack_trace_in_error_response():
    """Errors should not expose internal stack traces."""
    r = client.get("/api/nonexistent_endpoint")
    assert r.status_code == 404
    body = r.json()
    assert "traceback" not in str(body).lower()
    assert "line " not in str(body).lower()


def test_download_no_path_traversal():
    """Path traversal attempts should be rejected."""
    r = client.get("/api/download/forecast?model=../../etc/passwd&horizon=24h")
    # Should either succeed with safe output or fail with a safe error
    assert r.status_code in (200, 400, 422, 503)
    if r.status_code == 200:
        content_type = r.headers.get("content-type", "")
        assert "text/csv" in content_type  # must still return CSV, not file content


# ─── CORS Headers ───────────────────────────────────────────────────────────

def test_cors_preflight_allowed_origin():
    """OPTIONS preflight from allowed origin should succeed."""
    r = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    # 200 or 204 are both valid preflight responses
    assert r.status_code in (200, 204)


def test_cors_headers_present():
    """Actual request from allowed origin should have CORS headers."""
    r = client.get("/api/health", headers={"Origin": "http://localhost:3000"})
    assert r.status_code == 200
    # CORS header should be present
    assert "access-control-allow-origin" in r.headers
