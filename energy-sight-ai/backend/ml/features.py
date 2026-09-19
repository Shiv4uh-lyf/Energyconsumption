"""
EnerSight AI — Feature Engineering Module
Implements leakage-safe temporal, lag, rolling, and cyclical features.

IMPORTANT: All lag and rolling features use only PAST information.
No future values ever leak into features. This is enforced by:
- Using .shift(n) for lags (positive n = past)
- Using .rolling(window).mean().shift(1) for rolling features (shift ensures t-1 endpoint)
"""

import numpy as np
import pandas as pd
from typing import Optional


# ─────────────────────────────────────────────
# Feature definitions with documentation
# ─────────────────────────────────────────────

FEATURE_DOCS = {
    # --- Temporal ---
    "hour": "Hour of day (0-23). Captures within-day usage patterns.",
    "day_of_week": "Day of week (0=Mon, 6=Sun). Captures weekly patterns.",
    "day_of_year": "Day within year (1-366). Captures annual seasonality.",
    "month": "Month (1-12). Captures seasonal variation.",
    "week_of_year": "ISO week number. Captures weekly seasonal patterns.",
    "is_weekend": "Binary flag for Saturday/Sunday. Weekend usage differs significantly.",
    "quarter": "Quarter (1-4). Coarse seasonal signal.",
    
    # --- Cyclical encodings ---
    "hour_sin": "Sine encoding of hour. Preserves circular continuity (23h ~ 1h).",
    "hour_cos": "Cosine encoding of hour. Paired with hour_sin for full encoding.",
    "dow_sin": "Sine encoding of day-of-week. Circular day continuity.",
    "dow_cos": "Cosine encoding of day-of-week. Paired with dow_sin.",
    "month_sin": "Sine encoding of month. Circular month continuity.",
    "month_cos": "Cosine encoding of month. Paired with month_sin.",
    
    # --- Lag features (past observations) ---
    "lag_1": "Consumption 1 hour ago. Strongest short-term autocorrelation.",
    "lag_2": "Consumption 2 hours ago.",
    "lag_3": "Consumption 3 hours ago.",
    "lag_6": "Consumption 6 hours ago. Half-day signal.",
    "lag_12": "Consumption 12 hours ago. Half-day periodicity.",
    "lag_24": "Consumption 24 hours ago (same hour yesterday). Strong daily pattern.",
    "lag_48": "Consumption 48 hours ago (same hour 2 days ago).",
    "lag_168": "Consumption 168 hours ago (same hour last week). Weekly periodicity.",
    
    # --- Rolling statistics (past window only) ---
    "rolling_mean_6": "Rolling mean over past 6 hours. Short-term trend.",
    "rolling_std_6": "Rolling std over past 6 hours. Short-term volatility.",
    "rolling_mean_24": "Rolling mean over past 24 hours. Daily average baseline.",
    "rolling_std_24": "Rolling std over past 24 hours. Daily variability.",
    "rolling_mean_168": "Rolling mean over past 168 hours (1 week). Weekly baseline.",
    "rolling_std_168": "Rolling std over past 168 hours. Weekly variability.",
    "rolling_max_24": "Rolling max over past 24 hours. Recent peak demand signal.",
    "rolling_min_24": "Rolling min over past 24 hours. Recent trough signal.",
    
    # --- Derived ---
    "hour_of_week": "Hour within the week (0-167). Captures full weekly cycle.",
    "is_morning_peak": "Binary: hour in 7-10 (morning peak period).",
    "is_evening_peak": "Binary: hour in 17-21 (evening peak period).",
    "is_overnight": "Binary: hour in 23-6 (overnight low-usage period).",
    "day_progress": "Fraction of day elapsed (0.0-1.0). Smooth daily progress feature.",
}

TARGET = "consumption_kwh"
TEMPORAL_FEATURES = [
    "hour", "day_of_week", "day_of_year", "month", "week_of_year",
    "is_weekend", "quarter", "hour_sin", "hour_cos", "dow_sin", "dow_cos",
    "month_sin", "month_cos", "hour_of_week", "is_morning_peak",
    "is_evening_peak", "is_overnight", "day_progress",
]
LAG_FEATURES = ["lag_1", "lag_2", "lag_3", "lag_6", "lag_12", "lag_24", "lag_48", "lag_168"]
ROLLING_FEATURES = [
    "rolling_mean_6", "rolling_std_6", "rolling_mean_24", "rolling_std_24",
    "rolling_mean_168", "rolling_std_168", "rolling_max_24", "rolling_min_24",
]
ALL_FEATURES = TEMPORAL_FEATURES + LAG_FEATURES + ROLLING_FEATURES


def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add calendar/temporal features from timestamp index."""
    ts = df["timestamp"] if "timestamp" in df.columns else df.index
    
    df["hour"] = ts.dt.hour
    df["day_of_week"] = ts.dt.dayofweek
    df["day_of_year"] = ts.dt.dayofyear
    df["month"] = ts.dt.month
    df["week_of_year"] = ts.dt.isocalendar().week.astype(int)
    df["is_weekend"] = (ts.dt.dayofweek >= 5).astype(int)
    df["quarter"] = ts.dt.quarter
    df["hour_of_week"] = ts.dt.dayofweek * 24 + ts.dt.hour
    df["day_progress"] = ts.dt.hour / 23.0
    
    # Peak period flags
    df["is_morning_peak"] = ts.dt.hour.between(7, 10).astype(int)
    df["is_evening_peak"] = ts.dt.hour.between(17, 21).astype(int)
    df["is_overnight"] = (~ts.dt.hour.between(6, 22)).astype(int)
    
    # Cyclical encodings
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    df["month_sin"] = np.sin(2 * np.pi * (df["month"] - 1) / 12)
    df["month_cos"] = np.cos(2 * np.pi * (df["month"] - 1) / 12)
    
    return df


def add_lag_features(df: pd.DataFrame, target: str = TARGET) -> pd.DataFrame:
    """
    Add lag features. All lags use positive shift → pure past information.
    No leakage possible: lag_n at time t = value at time t-n.
    """
    lags = [1, 2, 3, 6, 12, 24, 48, 168]
    for lag in lags:
        df[f"lag_{lag}"] = df[target].shift(lag)
    return df


def add_rolling_features(df: pd.DataFrame, target: str = TARGET) -> pd.DataFrame:
    """
    Add rolling statistics. shift(1) ensures window ends at t-1 (no leakage).
    Rolling at time t uses values from t-window to t-1 only.
    """
    series = df[target]
    
    # Short window (6h)
    r6 = series.shift(1).rolling(window=6, min_periods=3)
    df["rolling_mean_6"] = r6.mean()
    df["rolling_std_6"] = r6.std()
    
    # Daily window (24h)
    r24 = series.shift(1).rolling(window=24, min_periods=12)
    df["rolling_mean_24"] = r24.mean()
    df["rolling_std_24"] = r24.std()
    df["rolling_max_24"] = r24.max()
    df["rolling_min_24"] = r24.min()
    
    # Weekly window (168h)
    r168 = series.shift(1).rolling(window=168, min_periods=48)
    df["rolling_mean_168"] = r168.mean()
    df["rolling_std_168"] = r168.std()
    
    return df


def engineer_features(
    df: pd.DataFrame,
    target: str = TARGET,
    drop_na: bool = True,
) -> pd.DataFrame:
    """
    Full feature engineering pipeline.
    
    Args:
        df: DataFrame with 'timestamp' and 'consumption_kwh' columns
        target: target column name
        drop_na: whether to drop rows with NaN (from lags/rolling)
    
    Returns:
        DataFrame with all features added
    """
    df = df.copy()
    
    # Ensure timestamp is available as column
    if "timestamp" not in df.columns and isinstance(df.index, pd.DatetimeIndex):
        df = df.reset_index()
    
    df = add_temporal_features(df)
    df = add_lag_features(df, target)
    df = add_rolling_features(df, target)
    
    if drop_na:
        # The max lag is 168, so first 168 rows will have NaN
        df = df.dropna(subset=ALL_FEATURES).reset_index(drop=True)
    
    return df


def get_feature_names() -> list[str]:
    return ALL_FEATURES.copy()


def get_feature_docs() -> dict[str, str]:
    return FEATURE_DOCS.copy()


if __name__ == "__main__":
    # Quick smoke test
    import sys, json
    sys.path.insert(0, str(__file__.replace("ml/features.py", "")))
    from ml.preprocessing import load_clean_data
    
    df, meta = load_clean_data()
    df_feat = engineer_features(df)
    print(f"Features shape: {df_feat.shape}")
    print(f"Feature columns: {[c for c in df_feat.columns if c not in ['timestamp', TARGET]]}")
    print(f"First row NaN count: {df_feat.iloc[0].isna().sum()}")
