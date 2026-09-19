"""
EnerSight AI — Data Preprocessing Module
Handles validation, cleaning, resampling, and quality reporting.
"""

import json
import warnings
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"


# ─────────────────────────────────────────────
# Data Health Report
# ─────────────────────────────────────────────

@dataclass
class DataHealthReport:
    total_rows: int = 0
    usable_rows: int = 0
    start_date: str = ""
    end_date: str = ""
    date_range_days: float = 0.0
    frequency: str = ""
    missing_values: int = 0
    missing_pct: float = 0.0
    duplicate_timestamps: int = 0
    outlier_count: int = 0
    outlier_pct: float = 0.0
    min_consumption: float = 0.0
    max_consumption: float = 0.0
    mean_consumption: float = 0.0
    std_consumption: float = 0.0
    is_demo: bool = False
    data_source: str = ""
    quality_status: str = "UNKNOWN"
    quality_score: float = 0.0
    issues: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


# ─────────────────────────────────────────────
# Validation
# ─────────────────────────────────────────────

def validate_dataframe(df: pd.DataFrame) -> list[str]:
    """Check for required columns, types, and basic sanity. Returns list of issues."""
    issues = []
    
    if "timestamp" not in df.columns:
        issues.append("Missing required column: 'timestamp'")
    if "consumption_kwh" not in df.columns:
        issues.append("Missing required column: 'consumption_kwh'")
    
    if not issues:
        if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
            try:
                pd.to_datetime(df["timestamp"])
            except Exception:
                issues.append("Column 'timestamp' cannot be parsed as datetime")
        
        neg = (df["consumption_kwh"] < 0).sum()
        if neg > 0:
            issues.append(f"Found {neg} negative consumption values")
        
        extreme = (df["consumption_kwh"] > 50).sum()
        if extreme > len(df) * 0.01:
            issues.append(f"Found {extreme} extreme consumption values (>50 kWh/h)")
    
    return issues


# ─────────────────────────────────────────────
# Core Preprocessing
# ─────────────────────────────────────────────

def load_data(data_dir: Path = DATA_DIR) -> tuple[pd.DataFrame, dict]:
    """
    Load preprocessed consumption data.
    Prefers real UCI data over demo data.
    Returns (dataframe, metadata_dict).
    """
    # Prefer real data
    real_path = data_dir / "consumption.csv"
    demo_path = data_dir / "demo_consumption.csv"
    
    if real_path.exists():
        df = pd.read_csv(real_path, parse_dates=["timestamp"])
        source = "UCI Household Electric Power Consumption"
        is_demo = False
    elif demo_path.exists():
        df = pd.read_csv(demo_path, parse_dates=["timestamp"])
        source = "SYNTHETIC DEMO DATA — NOT REAL MEASUREMENTS"
        is_demo = True
    else:
        raise FileNotFoundError(
            "No data found. Run: python scripts/download_data.py  OR  python scripts/generate_demo_data.py"
        )
    
    return df, {"source": source, "is_demo": is_demo}


def clean_and_prepare(df: pd.DataFrame, freq: str = "h") -> tuple[pd.DataFrame, DataHealthReport]:
    """
    Full cleaning pipeline:
    1. Parse timestamps
    2. Remove duplicates
    3. Sort chronologically
    4. Resample to target frequency
    5. Handle missing values (forward fill + interpolate)
    6. Clip outliers
    7. Build health report
    """
    report = DataHealthReport()
    report.total_rows = len(df)
    report.issues = []
    
    # --- Validate ---
    issues = validate_dataframe(df)
    report.issues.extend(issues)
    
    # --- Parse timestamps ---
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    bad_ts = df["timestamp"].isna().sum()
    if bad_ts > 0:
        report.issues.append(f"Dropped {bad_ts} rows with unparseable timestamps")
        df = df.dropna(subset=["timestamp"])
    
    # --- Parse consumption ---
    df["consumption_kwh"] = pd.to_numeric(df["consumption_kwh"], errors="coerce")
    
    # --- Remove duplicates ---
    dupes = df["timestamp"].duplicated().sum()
    report.duplicate_timestamps = int(dupes)
    if dupes > 0:
        df = df.drop_duplicates(subset=["timestamp"], keep="first")
        report.issues.append(f"Removed {dupes} duplicate timestamps")
    
    # --- Sort chronologically ---
    df = df.sort_values("timestamp").reset_index(drop=True)
    
    # --- Set index ---
    df = df.set_index("timestamp")
    
    # --- Resample to target frequency ---
    if freq == "h":
        series = df["consumption_kwh"].resample("h").mean()
    else:
        series = df["consumption_kwh"].resample(freq).mean()
    
    # --- Missing value handling ---
    missing_before = series.isna().sum()
    
    # Forward fill gaps ≤ 3 hours
    series = series.ffill(limit=3)
    # Then interpolate remaining
    series = series.interpolate(method="time", limit=24)
    # If still missing (large gaps), fill with rolling mean
    if series.isna().any():
        roll = series.rolling(window=168, min_periods=1, center=True).mean()
        series = series.fillna(roll)
    # Final fallback: fill with global mean
    series = series.fillna(series.mean())
    
    report.missing_values = int(missing_before)
    report.missing_pct = round(float(missing_before / len(series) * 100), 2)
    
    # --- Clip extreme outliers (z-score > 4) ---
    z_scores = (series - series.mean()) / series.std()
    outlier_mask = z_scores.abs() > 4
    report.outlier_count = int(outlier_mask.sum())
    report.outlier_pct = round(float(outlier_mask.sum() / len(series) * 100), 2)
    
    if outlier_mask.any():
        # Winsorize: replace with 4-sigma bound
        upper = series.mean() + 4 * series.std()
        lower = max(0, series.mean() - 4 * series.std())
        series = series.clip(lower, upper)
        report.issues.append(f"Winsorized {report.outlier_count} extreme outliers")
    
    # --- Ensure non-negative ---
    series = series.clip(lower=0)
    
    # --- Build clean DataFrame ---
    clean_df = series.reset_index()
    clean_df.columns = ["timestamp", "consumption_kwh"]
    clean_df["consumption_kwh"] = clean_df["consumption_kwh"].round(4)
    
    # --- Fill health report ---
    report.usable_rows = len(clean_df)
    report.start_date = str(clean_df["timestamp"].iloc[0])
    report.end_date = str(clean_df["timestamp"].iloc[-1])
    report.date_range_days = round(
        (clean_df["timestamp"].iloc[-1] - clean_df["timestamp"].iloc[0]).total_seconds() / 86400, 1
    )
    report.frequency = freq
    report.min_consumption = round(float(clean_df["consumption_kwh"].min()), 4)
    report.max_consumption = round(float(clean_df["consumption_kwh"].max()), 4)
    report.mean_consumption = round(float(clean_df["consumption_kwh"].mean()), 4)
    report.std_consumption = round(float(clean_df["consumption_kwh"].std()), 4)
    
    # --- Quality score ---
    score = 100.0
    score -= min(report.missing_pct * 2, 30)
    score -= min(report.outlier_pct * 3, 20)
    score -= min(report.duplicate_timestamps / max(report.total_rows, 1) * 100, 15)
    score -= len([i for i in report.issues if "error" in i.lower()]) * 5
    report.quality_score = max(0.0, round(score, 1))
    
    if report.quality_score >= 85:
        report.quality_status = "EXCELLENT"
    elif report.quality_score >= 70:
        report.quality_status = "GOOD"
    elif report.quality_score >= 50:
        report.quality_status = "FAIR"
    else:
        report.quality_status = "POOR"
    
    return clean_df, report


def get_data_summary(data_dir: Path = DATA_DIR) -> dict:
    """Load and return a quick summary dict for the API."""
    try:
        df, meta = load_data(data_dir)
        df, report = clean_and_prepare(df)
        r = report.to_dict()
        r["is_demo"] = meta.get("is_demo", True)
        r["data_source"] = meta.get("source", "Unknown")
        return r
    except Exception as e:
        return {"error": str(e), "quality_status": "ERROR"}


def load_clean_data(data_dir: Path = DATA_DIR) -> tuple[pd.DataFrame, dict]:
    """Convenience: load + clean in one call. Returns (clean_df, meta)."""
    df, meta = load_data(data_dir)
    clean_df, report = clean_and_prepare(df)
    meta["report"] = report.to_dict()
    meta["is_demo"] = "is_demo" in df.columns and df["is_demo"].any() if "is_demo" in df.columns else meta.get("is_demo", True)
    return clean_df, meta


if __name__ == "__main__":
    try:
        df, meta = load_clean_data()
        print(f"Loaded {len(df)} rows")
        print(json.dumps(meta["report"], indent=2))
    except FileNotFoundError as e:
        print(e)
