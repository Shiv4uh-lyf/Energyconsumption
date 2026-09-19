"""
EnerSight AI — Forecast Service
Generates future forecasts using trained models.
"""

import sys
import warnings
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
warnings.filterwarnings("ignore")

from ml.features import engineer_features, get_feature_names, ALL_FEATURES


HORIZON_HOURS = {
    "1h": 1,
    "6h": 6,
    "12h": 12,
    "24h": 24,
    "7d": 168,
}


def generate_forecast(
    model,
    clean_df: pd.DataFrame,
    horizon: str = "24h",
    target: str = "consumption_kwh",
) -> list[dict]:
    """
    Generate future forecasts using iterative/direct prediction.
    
    Strategy:
    - For non-recursive models (RF, XGBoost, LR): direct multi-step using
      feature engineering on forecast timestamps with historical lag lookups.
    - For SARIMA/Prophet: native forecast methods.
    - Handles each model's capabilities gracefully.
    
    Returns list of forecast dicts.
    """
    n_steps = HORIZON_HOURS.get(horizon, 24)
    model_name = getattr(model, "name", "unknown")
    
    # Get last timestamp
    last_ts = pd.to_datetime(clean_df["timestamp"].iloc[-1])
    future_timestamps = pd.date_range(
        start=last_ts + pd.Timedelta(hours=1),
        periods=n_steps,
        freq="h",
    )
    
    # ── Prophet: native forecast ──
    if model_name == "prophet":
        return _prophet_forecast(model, future_timestamps, n_steps)
    
    # ── SARIMA: native forecast ──
    if model_name == "sarima":
        return _sarima_forecast(model, future_timestamps, n_steps)
    
    # ── ML models: iterative feature-based forecast ──
    return _ml_iterative_forecast(model, clean_df, future_timestamps, n_steps, target)


def _prophet_forecast(model, future_timestamps, n_steps: int) -> list[dict]:
    future_df = pd.DataFrame({"timestamp": future_timestamps})
    preds = model.predict(future_df)
    
    supports_interval = getattr(model, "supports_intervals", False)
    if supports_interval:
        lower, upper = model.predict_interval(future_df)
    else:
        lower = upper = None
    
    results = []
    for i, (ts, pred) in enumerate(zip(future_timestamps, preds)):
        results.append({
            "timestamp": ts.isoformat(),
            "predicted": round(max(0, float(pred)), 4),
            "lower_bound": round(max(0, float(lower[i])), 4) if lower is not None else None,
            "upper_bound": round(float(upper[i]), 4) if upper is not None else None,
            "model": "prophet",
            "type": "forecast",
        })
    return results


def _sarima_forecast(model, future_timestamps, n_steps: int) -> list[dict]:
    dummy_X = pd.DataFrame({"lag_24": [1.0] * n_steps, "lag_168": [1.0] * n_steps})
    preds = model.predict(dummy_X)
    
    if model.supports_intervals:
        try:
            lower, upper = model.predict_interval(dummy_X)
        except Exception:
            lower = upper = None
    else:
        lower = upper = None
    
    results = []
    for i, (ts, pred) in enumerate(zip(future_timestamps, preds)):
        results.append({
            "timestamp": ts.isoformat(),
            "predicted": round(max(0, float(pred)), 4),
            "lower_bound": round(max(0, float(lower[i])), 4) if lower is not None else None,
            "upper_bound": round(float(upper[i]), 4) if upper is not None else None,
            "model": "sarima",
            "type": "forecast",
        })
    return results


def _ml_iterative_forecast(
    model,
    clean_df: pd.DataFrame,
    future_timestamps,
    n_steps: int,
    target: str,
) -> list[dict]:
    """
    Iterative multi-step forecast for ML models.
    Uses actual historical values for lags within history.
    Fills in predicted values for lags that fall in the forecast horizon.
    """
    model_name = getattr(model, "name", "unknown")
    
    # Build extended series: historical + placeholders for forecast
    extended_ts = list(clean_df["timestamp"])
    extended_vals = list(clean_df[target].values)
    
    results = []
    
    for step_i, ts in enumerate(future_timestamps):
        # Build a temporary DF for feature extraction
        temp_ts = extended_ts + [ts]
        temp_vals = extended_vals + [np.nan]
        
        temp_df = pd.DataFrame({"timestamp": temp_ts, target: temp_vals})
        feat_df = engineer_features(temp_df, target=target, drop_na=False)
        
        if feat_df.empty:
            results.append({
                "timestamp": ts.isoformat(),
                "predicted": float(np.mean(extended_vals[-168:])),
                "lower_bound": None,
                "upper_bound": None,
                "model": model_name,
                "type": "forecast",
            })
            extended_vals.append(float(np.mean(extended_vals[-168:])))
            extended_ts.append(ts)
            continue
        
        row = feat_df.iloc[[-1]]
        feature_cols = [c for c in ALL_FEATURES if c in row.columns]
        X_pred = row[feature_cols].fillna(0)
        
        # Predict
        pred = float(model.predict(X_pred)[0])
        pred = max(0, pred)
        
        # Interval if supported
        lower_b = upper_b = None
        if getattr(model, "supports_intervals", False):
            try:
                lo, hi = model.predict_interval(X_pred)
                lower_b = round(max(0, float(lo[0])), 4)
                upper_b = round(float(hi[0]), 4)
            except Exception:
                pass
        
        results.append({
            "timestamp": ts.isoformat(),
            "predicted": round(pred, 4),
            "lower_bound": lower_b,
            "upper_bound": upper_b,
            "model": model_name,
            "type": "forecast",
        })
        
        # Feed prediction back into extended series for next step's lags
        extended_vals.append(pred)
        extended_ts.append(ts)
    
    return results


def get_historical_window(
    clean_df: pd.DataFrame,
    n_hours: int = 168,
    target: str = "consumption_kwh",
) -> list[dict]:
    """Return recent historical data for visualization context."""
    recent = clean_df.tail(n_hours)
    return [
        {
            "timestamp": str(row["timestamp"]),
            "value": round(float(row[target]), 4),
            "type": "historical",
        }
        for _, row in recent.iterrows()
    ]
