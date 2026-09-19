"""
EnerSight AI — Anomaly Detection Module
Rolling Z-score + Isolation Forest hybrid approach.
"""

import warnings
import numpy as np
import pandas as pd
from dataclasses import dataclass, asdict
from typing import Optional

warnings.filterwarnings("ignore")


@dataclass
class Anomaly:
    timestamp: str
    observed_value: float
    expected_value: float
    difference: float
    z_score: float
    severity: str  # NORMAL | UNUSUAL | HIGH
    method: str
    description: str

    def to_dict(self) -> dict:
        return asdict(self)


def rolling_zscore_anomalies(
    df: pd.DataFrame,
    window: int = 168,
    threshold_unusual: float = 2.5,
    threshold_high: float = 3.5,
    target: str = "consumption_kwh",
) -> list[Anomaly]:
    """
    Detect anomalies using rolling z-score.
    Expected value = rolling mean; z-score = deviation / rolling std.
    """
    series = df[target].copy()
    timestamps = df["timestamp"] if "timestamp" in df.columns else df.index

    roll_mean = series.rolling(window=window, min_periods=24, center=False).mean().shift(1)
    roll_std = series.rolling(window=window, min_periods=24, center=False).std().shift(1)
    
    # Avoid division by near-zero std
    roll_std = roll_std.clip(lower=1e-6)
    z_scores = (series - roll_mean) / roll_std

    anomalies = []
    for i, (ts, obs, exp, std, z) in enumerate(zip(timestamps, series, roll_mean, roll_std, z_scores)):
        if np.isnan(z) or np.isnan(exp):
            continue
        abs_z = abs(z)
        if abs_z >= threshold_unusual:
            severity = "HIGH" if abs_z >= threshold_high else "UNUSUAL"
            direction = "above" if z > 0 else "below"
            anomalies.append(Anomaly(
                timestamp=str(ts),
                observed_value=round(float(obs), 4),
                expected_value=round(float(exp), 4),
                difference=round(float(obs - exp), 4),
                z_score=round(float(z), 3),
                severity=severity,
                method="rolling_zscore",
                description=(
                    f"Consumption {abs(obs - exp):.2f} kWh ({abs_z:.1f}σ) "
                    f"{direction} expected pattern. "
                    f"Consumption significantly deviates from the expected pattern."
                ),
            ))
    
    return anomalies


def isolation_forest_anomalies(
    df: pd.DataFrame,
    target: str = "consumption_kwh",
    contamination: float = 0.03,
) -> list[Anomaly]:
    """
    Isolation Forest anomaly detection.
    Uses temporal features + rolling stats as input.
    """
    from sklearn.ensemble import IsolationForest
    
    series = df[target].copy()
    timestamps = df["timestamp"] if "timestamp" in df.columns else df.index
    
    # Feature matrix for IF
    feat_df = pd.DataFrame({
        "value": series,
        "hour": pd.to_datetime(timestamps).hour if hasattr(pd.to_datetime(timestamps), 'hour') else [pd.Timestamp(t).hour for t in timestamps],
        "dow": pd.to_datetime(timestamps).dayofweek if hasattr(pd.to_datetime(timestamps), 'dayofweek') else [pd.Timestamp(t).dayofweek for t in timestamps],
        "roll_mean": series.rolling(24, min_periods=6).mean(),
        "roll_std": series.rolling(24, min_periods=6).std(),
    }).fillna(method="bfill").fillna(0)
    
    iso = IsolationForest(contamination=contamination, random_state=42, n_jobs=-1)
    labels = iso.fit_predict(feat_df.values)  # -1 = anomaly, 1 = normal
    scores = iso.score_samples(feat_df.values)  # lower = more anomalous
    
    roll_mean = series.rolling(24, min_periods=6).mean()
    
    anomalies = []
    for i, (ts, obs, label, score) in enumerate(zip(timestamps, series, labels, scores)):
        if label == -1:
            exp = roll_mean.iloc[i] if not np.isnan(roll_mean.iloc[i]) else series.mean()
            severity = "HIGH" if score < np.percentile(scores[labels == -1], 25) else "UNUSUAL"
            anomalies.append(Anomaly(
                timestamp=str(ts),
                observed_value=round(float(obs), 4),
                expected_value=round(float(exp), 4),
                difference=round(float(obs - exp), 4),
                z_score=round(float(score), 4),
                severity=severity,
                method="isolation_forest",
                description=(
                    f"Isolation Forest flagged this reading as anomalous "
                    f"(score: {score:.3f}). "
                    f"Consumption significantly deviates from the expected pattern."
                ),
            ))
    
    return anomalies


def detect_anomalies(
    df: pd.DataFrame,
    target: str = "consumption_kwh",
    methods: list[str] = ("rolling_zscore", "isolation_forest"),
    max_results: int = 200,
) -> list[dict]:
    """
    Run anomaly detection using specified methods.
    Returns combined, deduplicated, sorted anomaly list.
    """
    all_anomalies: list[Anomaly] = []
    
    if "rolling_zscore" in methods:
        try:
            all_anomalies.extend(rolling_zscore_anomalies(df, target=target))
        except Exception as e:
            print(f"[Anomaly] Rolling Z-score failed: {e}")
    
    if "isolation_forest" in methods:
        try:
            all_anomalies.extend(isolation_forest_anomalies(df, target=target))
        except Exception as e:
            print(f"[Anomaly] Isolation Forest failed: {e}")
    
    # Deduplicate by timestamp, keeping highest severity
    seen: dict[str, Anomaly] = {}
    sev_order = {"HIGH": 2, "UNUSUAL": 1, "NORMAL": 0}
    for a in all_anomalies:
        if a.timestamp not in seen or sev_order[a.severity] > sev_order[seen[a.timestamp].severity]:
            seen[a.timestamp] = a
    
    sorted_anomalies = sorted(seen.values(), key=lambda x: x.timestamp, reverse=True)
    return [a.to_dict() for a in sorted_anomalies[:max_results]]


def anomaly_summary(anomalies: list[dict]) -> dict:
    """Return summary statistics for anomaly list."""
    if not anomalies:
        return {"total": 0, "high": 0, "unusual": 0, "status": "NORMAL"}
    high = sum(1 for a in anomalies if a["severity"] == "HIGH")
    unusual = sum(1 for a in anomalies if a["severity"] == "UNUSUAL")
    return {
        "total": len(anomalies),
        "high": high,
        "unusual": unusual,
        "status": "HIGH" if high > 0 else ("UNUSUAL" if unusual > 0 else "NORMAL"),
    }
