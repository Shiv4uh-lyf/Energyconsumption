// EnerSight AI — API Client
// All API calls go through this module — never hardcoded data in frontend

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Raw Axios Instance (for direct use if needed) ────────────────────────
export const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Types ────────────────────────────────────────────────────────────────

export interface DataSummary {
  total_rows: number;
  usable_rows: number;
  start_date: string;
  end_date: string;
  date_range_days: number;
  frequency: string;
  missing_values: number;
  missing_pct: number;
  duplicate_timestamps: number;
  outlier_count: number;
  outlier_pct: number;
  min_consumption: number;
  max_consumption: number;
  mean_consumption: number;
  std_consumption: number;
  is_demo: boolean;
  data_source: string;
  quality_status: string;
  quality_score: number;
  issues: string[];
  // alternate keys from backend
  num_rows?: number;
  latest_reading?: number;
  total_24h_kwh?: number;
  peak_24h?: number;
}

export interface ConsumptionPoint {
  timestamp: string;
  value: number;
  type: string;
}

export interface ForecastPoint {
  timestamp: string;
  predicted: number;
  lower_bound: number | null;
  upper_bound: number | null;
  lower_ci?: number | null;
  upper_ci?: number | null;
  actual?: number;
  model: string;
  type: string;
}

export interface ForecastResponse {
  forecast: ForecastPoint[];
  historical: { timestamp: string; value: number; type: string }[];
  model: string;
  horizon: string;
  generated_at: string;
  interval_available: boolean;
}

export interface ModelInfo {
  name: string;
  display_name: string;
  description: string;
  trained: boolean;
  supports_intervals: boolean;
  metrics?: ModelMetrics;
}

export interface ModelMetrics {
  model_name: string;
  mae: number;
  rmse: number;
  mape: number | null;
  r2: number;
  train_time_s: number;
  inference_time_ms?: number;
  latency_ms?: number;
  n_train: number;
  n_test: number;
  rank?: number;
}

export interface ModelEvaluation {
  metrics: ModelMetrics[];
  ranked_by: string;
  best_model: string;
  generated_at: string;
}

export interface PatternData {
  hourly_profile: { hour: number; mean: number; std: number }[];
  daily_profile: { day: string; day_num: number; mean: number }[];
  monthly_profile: { month: string; month_num: number; mean: number }[];
  peak_hour: number;
  trough_hour: number;
  peak_day: string;
  low_day: string;
  weekday_mean: number;
  weekend_mean: number;
  weekend_vs_weekday_pct: number;
  trend_direction: string;
  trend_slope_per_hour: number;
  baseline_diff_pct: number;
  heatmap_data: { date: string; value: number }[];
  // legacy alias used in some charts
  hourly?: { hour: number; mean: number; std: number }[];
}

export interface Anomaly {
  timestamp: string;
  observed_value: number;
  expected_value: number;
  difference: number;
  z_score: number;
  severity: 'NORMAL' | 'UNUSUAL' | 'HIGH';
  method: string;
  description: string;
}

export interface AnomalyResponse {
  anomalies: Anomaly[];
  summary: { total: number; high: number; unusual: number; status: string };
  total: number;
}

export interface ExplainabilityData {
  model_name: string;
  features: { feature: string; importance: number; importance_pct: number; rank: number }[];
  feature_importance?: { feature: string; importance: number; importance_pct: number; rank: number }[];
  shap_values?: { feature: string; mean_abs_shap: number; contribution_pct: number; rank: number; description: string }[] | null;
  note: string;
}

export interface Insight {
  id: string;
  category: string;
  icon: string;
  severity: string;
  title: string;
  detail: string;
  value: number | string;
  unit: string;
}

export interface InsightsResponse {
  insights: Insight[];
  generated_at: string;
  data_points_analyzed: number;
}

export interface SystemStatus {
  backend_status: string;
  data_status: string;
  models_status: Record<string, boolean>;
  is_demo: boolean;
  version: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  models_loaded: string[];
  data_loaded: boolean;
  is_demo: boolean;
}

// ─── Named API Object (used throughout all pages) ─────────────────────────

export const api = {
  // Health & Status
  getHealth: (): Promise<HealthResponse> =>
    axiosInstance.get('/api/health').then(r => r.data),

  getSystemStatus: (): Promise<SystemStatus> =>
    axiosInstance.get('/api/system/status').then(r => r.data),

  // Data
  getSummary: (): Promise<DataSummary> =>
    axiosInstance.get('/api/data/summary').then(r => r.data),

  getDataSummary: (): Promise<DataSummary> =>
    axiosInstance.get('/api/data/summary').then(r => r.data),

  getConsumption: (params?: {
    start?: string;
    end?: string;
    limit?: number;
    resample?: string;
  }) => axiosInstance.get('/api/data/consumption', { params }).then(r => r.data),

  // Patterns
  getPatterns: (): Promise<PatternData> =>
    axiosInstance.get('/api/analytics/patterns').then(r => r.data),

  // Models
  getModels: (): Promise<ModelInfo[]> =>
    axiosInstance.get('/api/models').then(r => r.data),

  getEvaluation: (metric: string = 'mae'): Promise<ModelEvaluation> =>
    axiosInstance.get('/api/models/evaluation', { params: { metric } }).then(r => r.data),

  // Forecast — accepts flexible params from different pages
  getForecast: (params: {
    model?: string;
    model_name?: string;
    horizon?: string;
    horizon_hours?: number;
    include_history?: boolean;
    history_hours?: number;
  }): Promise<ForecastResponse> => {
    // Normalize params: pages use either {model_name, horizon_hours} or {model, horizon}
    const modelName = params.model ?? params.model_name ?? 'Ensemble';
    const horizonHours = params.horizon_hours ?? 24;
    const horizonStr = params.horizon ?? `${horizonHours}h`;

    return axiosInstance.post('/api/forecast', {
      model: modelName,
      horizon: horizonStr,
      include_history: params.include_history ?? true,
      history_hours: params.history_hours ?? 168,
    }).then(r => r.data);
  },

  // Anomalies — accepts either limit number or params object
  getAnomalies: (
    limitOrParams?: number | { methods?: string; limit?: number }
  ): Promise<AnomalyResponse> => {
    let params: { methods?: string; limit?: number } = {};
    if (typeof limitOrParams === 'number') {
      params = { limit: limitOrParams };
    } else if (limitOrParams) {
      params = limitOrParams;
    }
    return axiosInstance.get('/api/anomalies', { params }).then(r => r.data);
  },

  // Explainability
  getExplainability: (model: string = 'xgboost'): Promise<ExplainabilityData> =>
    axiosInstance.get('/api/explainability', { params: { model } }).then(r => {
      const data = r.data;
      // Normalize: ensure `features` key exists (some responses use feature_importance)
      if (!data.features && data.feature_importance) {
        data.features = data.feature_importance;
      } else if (!data.features) {
        data.features = [];
      }
      return data;
    }),

  // Insights
  getInsights: (): Promise<InsightsResponse> =>
    axiosInstance.get('/api/analytics/insights').then(r => r.data),

  // Co-Pilot Query
  queryCoPilot: (query: string): Promise<{ answer: string; category: string; suggested_actions: string[]; generated_at: string; data_summary?: any }> =>
    axiosInstance.post('/api/analytics/copilot', { query }).then(r => r.data),

  // Model Retraining
  retrainModels: (): Promise<{ status: string; message: string }> =>
    axiosInstance.post('/api/models/retrain').then(r => r.data),

  getRetrainStatus: (): Promise<{ is_retraining: boolean }> =>
    axiosInstance.get('/api/models/retrain/status').then(r => r.data),

  // Anomaly Acknowledgment
  acknowledgeAnomaly: (timestamp: string): Promise<any> =>
    axiosInstance.post(`/api/anomalies/acknowledge?timestamp=${encodeURIComponent(timestamp)}`).then(r => r.data),

  // Dataset Upload
  uploadData: (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/api/data/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  applyUpload: (file: File, timestampCol: string, valueCol: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post(`/api/data/upload/apply?timestamp_col=${encodeURIComponent(timestampCol)}&value_col=${encodeURIComponent(valueCol)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  // Downloads
  downloadForecast: (model: string, horizon: string) => {
    window.open(`${API_BASE}/api/download/forecast?model=${model}&horizon=${horizon}`, '_blank');
  },

  downloadAnomalies: () => {
    window.open(`${API_BASE}/api/download/anomalies`, '_blank');
  },

  downloadModelComparison: () => {
    window.open(`${API_BASE}/api/download/model_comparison`, '_blank');
  },
};

// ─── Standalone exports (backward-compat) ────────────────────────────────
export const getHealth = api.getHealth;
export const getSystemStatus = api.getSystemStatus;
export const getDataSummary = api.getDataSummary;
export const getConsumption = api.getConsumption;
export const getPatterns = api.getPatterns;
export const getModels = api.getModels;
export const getModelEvaluation = api.getEvaluation;
export const getForecast = api.getForecast;
export const getAnomalies = api.getAnomalies;
export const getExplainability = api.getExplainability;
export const getInsights = api.getInsights;
export const downloadForecast = api.downloadForecast;
export const downloadAnomalies = api.downloadAnomalies;
export const downloadModelComparison = api.downloadModelComparison;

// ─── Helpers ──────────────────────────────────────────────────────────────

export function formatConsumption(val: number | null | undefined, decimals: number = 3): string {
  if (val == null || isNaN(val)) return '—';
  return val.toFixed(decimals);
}

export function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-GB', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

export function formatDate(ts: string): string {
  try {
    return new Date(ts).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return ts;
  }
}

export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  naive: 'Seasonal Naive',
  linear_regression: 'Ridge Regression',
  random_forest: 'Random Forest',
  xgboost: 'XGBoost',
  sarima: 'SARIMA',
  prophet: 'Prophet',
  lstm: 'LSTM',
  ensemble: 'Ensemble',
  Ensemble: 'Ensemble',
};

export const HORIZON_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '12h', label: '12 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
];
