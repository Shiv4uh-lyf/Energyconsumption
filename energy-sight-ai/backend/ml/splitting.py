"""
EnerSight AI — Time-Series Splitting Module

CRITICAL: Never randomly shuffle time-series data.
All splits are strictly chronological to prevent data leakage.

Split strategy:
  Train: 70% (earliest)
  Validation: 15% (middle)
  Test: 15% (most recent)
"""

from dataclasses import dataclass
from typing import Optional
import numpy as np
import pandas as pd


@dataclass
class TimeSeriesSplit:
    X_train: pd.DataFrame
    y_train: pd.Series
    X_val: pd.DataFrame
    y_val: pd.Series
    X_test: pd.DataFrame
    y_test: pd.Series
    ts_train: pd.Series
    ts_val: pd.Series
    ts_test: pd.Series
    train_end: str
    val_end: str
    test_end: str


def chronological_split(
    df: pd.DataFrame,
    feature_cols: list[str],
    target_col: str = "consumption_kwh",
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    # test_ratio is implied as 1 - train - val
) -> TimeSeriesSplit:
    """
    Strictly chronological train/val/test split.
    
    NEVER shuffles data. Maintains temporal ordering.
    
    Args:
        df: DataFrame with 'timestamp' column, sorted chronologically
        feature_cols: list of feature column names
        target_col: target column name
        train_ratio: fraction for training (earliest data)
        val_ratio: fraction for validation (middle)
    
    Returns:
        TimeSeriesSplit with X/y/ts for each split
    """
    n = len(df)
    
    if not isinstance(df["timestamp"].iloc[0], pd.Timestamp):
        df = df.copy()
        df["timestamp"] = pd.to_datetime(df["timestamp"])
    
    # Verify chronological order
    if not df["timestamp"].is_monotonic_increasing:
        raise ValueError("DataFrame is not sorted chronologically. Sort by timestamp first.")
    
    train_end_idx = int(n * train_ratio)
    val_end_idx = int(n * (train_ratio + val_ratio))
    
    train_df = df.iloc[:train_end_idx]
    val_df = df.iloc[train_end_idx:val_end_idx]
    test_df = df.iloc[val_end_idx:]
    
    return TimeSeriesSplit(
        X_train=train_df[feature_cols].reset_index(drop=True),
        y_train=train_df[target_col].reset_index(drop=True),
        X_val=val_df[feature_cols].reset_index(drop=True),
        y_val=val_df[target_col].reset_index(drop=True),
        X_test=test_df[feature_cols].reset_index(drop=True),
        y_test=test_df[target_col].reset_index(drop=True),
        ts_train=train_df["timestamp"].reset_index(drop=True),
        ts_val=val_df["timestamp"].reset_index(drop=True),
        ts_test=test_df["timestamp"].reset_index(drop=True),
        train_end=str(train_df["timestamp"].iloc[-1]),
        val_end=str(val_df["timestamp"].iloc[-1]),
        test_end=str(test_df["timestamp"].iloc[-1]),
    )


def rolling_window_cv(
    df: pd.DataFrame,
    feature_cols: list[str],
    target_col: str = "consumption_kwh",
    n_splits: int = 5,
    min_train_size: int = 24 * 7 * 4,  # 4 weeks minimum
    horizon: int = 24 * 7,  # 1 week forecast horizon
) -> list[dict]:
    """
    Rolling window cross-validation for time-series.
    Each fold: train on [0..t], predict [t..t+horizon].
    
    Returns list of fold dicts with train/test slices.
    """
    n = len(df)
    folds = []
    
    step = (n - min_train_size - horizon) // n_splits
    if step < 1:
        step = 1
    
    for i in range(n_splits):
        train_end = min_train_size + i * step
        test_end = min(train_end + horizon, n)
        
        if test_end > n:
            break
        
        train_df = df.iloc[:train_end]
        test_df = df.iloc[train_end:test_end]
        
        folds.append({
            "fold": i + 1,
            "train_size": len(train_df),
            "test_size": len(test_df),
            "train_end": str(train_df["timestamp"].iloc[-1]),
            "test_start": str(test_df["timestamp"].iloc[0]),
            "test_end": str(test_df["timestamp"].iloc[-1]),
            "X_train": train_df[feature_cols],
            "y_train": train_df[target_col],
            "X_test": test_df[feature_cols],
            "y_test": test_df[target_col],
            "ts_test": test_df["timestamp"],
        })
    
    return folds


def split_summary(split: TimeSeriesSplit) -> dict:
    """Return a human-readable summary of the split."""
    total = len(split.X_train) + len(split.X_val) + len(split.X_test)
    return {
        "total_samples": total,
        "train_samples": len(split.X_train),
        "val_samples": len(split.X_val),
        "test_samples": len(split.X_test),
        "train_pct": round(len(split.X_train) / total * 100, 1),
        "val_pct": round(len(split.X_val) / total * 100, 1),
        "test_pct": round(len(split.X_test) / total * 100, 1),
        "train_end": split.train_end,
        "val_end": split.val_end,
        "test_end": split.test_end,
        "methodology": "Strict chronological split — no data shuffling",
    }
