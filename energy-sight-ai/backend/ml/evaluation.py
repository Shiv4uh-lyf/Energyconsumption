"""
EnerSight AI — Evaluation Module
Computes MAE, RMSE, MAPE, R², training time, inference time.
"""

import time
import numpy as np
from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class ModelMetrics:
    model_name: str
    mae: float
    rmse: float
    mape: Optional[float]
    r2: float
    train_time_s: float
    inference_time_ms: float
    n_train: int
    n_test: int
    split: str = "test"

    def to_dict(self) -> dict:
        return asdict(self)

    @property
    def rank_score(self) -> float:
        """Lower is better. Used for ranking."""
        return self.mae


def mean_absolute_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(np.abs(y_true - y_pred)))


def root_mean_squared_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def mean_absolute_percentage_error(
    y_true: np.ndarray, y_pred: np.ndarray, epsilon: float = 1e-8
) -> Optional[float]:
    """Returns None if any true value is too close to zero."""
    if np.any(np.abs(y_true) < epsilon):
        return None
    return float(np.mean(np.abs((y_true - y_pred) / (np.abs(y_true) + epsilon))) * 100)


def r2_score(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    if ss_tot == 0:
        return 0.0
    return float(1 - ss_res / ss_tot)


def compute_metrics(
    model_name: str,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    train_time_s: float,
    inference_time_ms: float,
    n_train: int,
    split: str = "test",
) -> ModelMetrics:
    y_true = np.array(y_true, dtype=float)
    y_pred = np.array(y_pred, dtype=float)
    
    return ModelMetrics(
        model_name=model_name,
        mae=round(mean_absolute_error(y_true, y_pred), 4),
        rmse=round(root_mean_squared_error(y_true, y_pred), 4),
        mape=round(mean_absolute_percentage_error(y_true, y_pred), 2) if mean_absolute_percentage_error(y_true, y_pred) is not None else None,
        r2=round(r2_score(y_true, y_pred), 4),
        train_time_s=round(train_time_s, 3),
        inference_time_ms=round(inference_time_ms, 3),
        n_train=n_train,
        n_test=len(y_true),
        split=split,
    )


def rank_models(metrics_list: list[ModelMetrics], metric: str = "mae") -> list[ModelMetrics]:
    """Rank models by chosen metric. Always dynamic — never hardcoded."""
    key_map = {
        "mae": lambda m: m.mae,
        "rmse": lambda m: m.rmse,
        "mape": lambda m: m.mape if m.mape is not None else float("inf"),
        "r2": lambda m: -m.r2,  # higher R2 is better, so negate for min-sort
    }
    key_fn = key_map.get(metric.lower(), key_map["mae"])
    return sorted(metrics_list, key=key_fn)
