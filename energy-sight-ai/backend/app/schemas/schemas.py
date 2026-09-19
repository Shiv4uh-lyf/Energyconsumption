"""
EnerSight AI — Pydantic Schemas
Request/response models for all API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, Any
from enum import Enum


class HorizonEnum(str, Enum):
    h1 = "1h"
    h6 = "6h"
    h12 = "12h"
    h24 = "24h"
    d7 = "7d"


class MetricEnum(str, Enum):
    mae = "mae"
    rmse = "rmse"
    mape = "mape"
    r2 = "r2"


# ─── Health ───
class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: list[str]
    data_loaded: bool
    is_demo: bool


# ─── Data Summary ───
class DataSummaryResponse(BaseModel):
    total_rows: int
    usable_rows: int
    start_date: str
    end_date: str
    date_range_days: float
    frequency: str
    missing_values: int
    missing_pct: float
    duplicate_timestamps: int
    outlier_count: int
    outlier_pct: float
    min_consumption: float
    max_consumption: float
    mean_consumption: float
    std_consumption: float
    is_demo: bool
    data_source: str
    quality_status: str
    quality_score: float
    issues: list[str]


# ─── Consumption ───
class ConsumptionPoint(BaseModel):
    timestamp: str
    value: float
    type: str = "historical"


class ConsumptionResponse(BaseModel):
    data: list[ConsumptionPoint]
    total: int
    is_demo: bool


# ─── Forecast ───
class ForecastRequest(BaseModel):
    model: str = Field(default="xgboost", description="Model name from registry")
    horizon: HorizonEnum = Field(default=HorizonEnum.h24)
    include_history: bool = Field(default=True)
    history_hours: int = Field(default=168)


class ForecastPoint(BaseModel):
    timestamp: str
    predicted: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    model: str
    type: str = "forecast"


class ForecastResponse(BaseModel):
    forecast: list[ForecastPoint]
    historical: list[dict]
    model: str
    horizon: str
    generated_at: str
    interval_available: bool


# ─── Models ───
class ModelInfo(BaseModel):
    name: str
    display_name: str
    description: str
    trained: bool
    supports_intervals: bool


class ModelMetricsResponse(BaseModel):
    model_name: str
    mae: float
    rmse: float
    mape: Optional[float]
    r2: float
    train_time_s: float
    inference_time_ms: float
    n_train: int
    n_test: int
    rank: Optional[int] = None


class ModelEvaluationResponse(BaseModel):
    metrics: list[ModelMetricsResponse]
    ranked_by: str
    best_model: str
    generated_at: str


# ─── Patterns ───
class HourlyProfilePoint(BaseModel):
    hour: int
    mean: float
    std: float


class DailyProfilePoint(BaseModel):
    day: str
    day_num: int
    mean: float


class MonthlyProfilePoint(BaseModel):
    month: str
    month_num: int
    mean: float


class PatternsResponse(BaseModel):
    hourly_profile: list[dict]
    daily_profile: list[dict]
    monthly_profile: list[dict]
    peak_hour: int
    trough_hour: int
    peak_day: str
    low_day: str
    weekday_mean: float
    weekend_mean: float
    weekend_vs_weekday_pct: float
    trend_direction: str
    trend_slope_per_hour: float
    baseline_diff_pct: float
    heatmap_data: list[dict]


# ─── Anomalies ───
class AnomalyPoint(BaseModel):
    timestamp: str
    observed_value: float
    expected_value: float
    difference: float
    z_score: float
    severity: str
    method: str
    description: str


class AnomalyResponse(BaseModel):
    anomalies: list[AnomalyPoint]
    summary: dict
    total: int


# ─── Explainability ───
class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float
    importance_pct: float
    rank: int


class ShapItem(BaseModel):
    feature: str
    mean_abs_shap: float
    contribution_pct: float
    rank: int
    description: str


class ExplainabilityResponse(BaseModel):
    model_name: str
    feature_importance: list[dict]
    shap_values: Optional[list[dict]]
    note: str


# ─── Insights ───
class InsightItem(BaseModel):
    id: str
    category: str
    icon: str
    severity: str
    title: str
    detail: str
    value: Any
    unit: str


class InsightsResponse(BaseModel):
    insights: list[InsightItem]
    generated_at: str
    data_points_analyzed: int


# ─── System Status ───
class SystemStatusResponse(BaseModel):
    backend_status: str
    data_status: str
    models_status: dict
    is_demo: bool
    version: str


# ─── Co-Pilot ───
class CoPilotRequest(BaseModel):
    query: str


class CoPilotResponse(BaseModel):
    answer: str
    category: str
    suggested_actions: list[str]
    generated_at: str
    data_summary: Optional[dict] = None

