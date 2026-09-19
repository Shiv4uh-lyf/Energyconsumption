"""
EnerSight AI — Forecasting Models
Standardized model interface + registry for all 7 models + ensemble.
"""

import time
import warnings
import json
import numpy as np
import pandas as pd
import joblib
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

warnings.filterwarnings("ignore")

MODELS_DIR = Path(__file__).parent.parent / "trained_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


# ──────────────────────────────────────────────────────
# Base Interface
# ──────────────────────────────────────────────────────

class BaseForecaster(ABC):
    name: str = "base"
    supports_intervals: bool = False

    @abstractmethod
    def train(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs) -> float:
        """Train the model. Returns training time in seconds."""

    @abstractmethod
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Generate point predictions."""

    def predict_interval(self, X: pd.DataFrame, alpha: float = 0.05) -> tuple[np.ndarray, np.ndarray]:
        """Generate prediction intervals. Override in models that support it."""
        raise NotImplementedError(f"{self.name} does not support prediction intervals.")

    def save(self, path: Optional[Path] = None) -> Path:
        path = path or (MODELS_DIR / f"{self.name}.joblib")
        joblib.dump(self, path)
        return path

    @classmethod
    def load(cls, path: Optional[Path] = None) -> "BaseForecaster":
        name = cls.name if hasattr(cls, 'name') else 'unknown'
        path = path or (MODELS_DIR / f"{name}.joblib")
        return joblib.load(path)

    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> dict:
        from ml.evaluation import compute_metrics
        t0 = time.perf_counter()
        preds = self.predict(X_test)
        inf_ms = (time.perf_counter() - t0) * 1000
        m = compute_metrics(
            self.name, y_test.values, preds,
            train_time_s=getattr(self, "_train_time", 0),
            inference_time_ms=inf_ms,
            n_train=getattr(self, "_n_train", 0),
        )
        return m.to_dict()


# ──────────────────────────────────────────────────────
# Model 0: Naive Seasonal Baseline
# ──────────────────────────────────────────────────────

class NaiveForecaster(BaseForecaster):
    """Predict last week's same-hour value (seasonal naive, period=168h)."""
    name = "naive"
    supports_intervals = False

    def __init__(self, lag: int = 168):
        self.lag = lag
        self._train_series: Optional[pd.Series] = None
        self._train_time = 0.0
        self._n_train = 0

    def train(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs) -> float:
        t0 = time.perf_counter()
        self._train_series = y_train.reset_index(drop=True)
        self._n_train = len(y_train)
        self._train_time = time.perf_counter() - t0
        return self._train_time

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        lag_col = f"lag_{self.lag}"
        if lag_col in X.columns:
            return X[lag_col].values
        # Fallback: use lag_24
        if "lag_24" in X.columns:
            return X["lag_24"].values
        return np.full(len(X), self._train_series.mean() if self._train_series is not None else 1.0)


# ──────────────────────────────────────────────────────
# Model 1: Linear Regression
# ──────────────────────────────────────────────────────

class LinearRegressionForecaster(BaseForecaster):
    name = "linear_regression"
    supports_intervals = True

    def __init__(self):
        from sklearn.linear_model import Ridge
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler
        self.model = Pipeline([
            ("scaler", StandardScaler()),
            ("ridge", Ridge(alpha=1.0)),
        ])
        self._train_time = 0.0
        self._n_train = 0
        self._residual_std = 1.0

    def train(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs) -> float:
        t0 = time.perf_counter()
        self.model.fit(X_train.fillna(0), y_train)
        self._n_train = len(y_train)
        preds = self.model.predict(X_train.fillna(0))
        self._residual_std = np.std(y_train.values - preds)
        self._train_time = time.perf_counter() - t0
        return self._train_time

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return np.maximum(0, self.model.predict(X.fillna(0)))

    def predict_interval(self, X: pd.DataFrame, alpha: float = 0.05) -> tuple[np.ndarray, np.ndarray]:
        from scipy import stats
        preds = self.predict(X)
        z = stats.norm.ppf(1 - alpha / 2)
        margin = z * self._residual_std
        return np.maximum(0, preds - margin), preds + margin


# ──────────────────────────────────────────────────────
# Model 2: Random Forest
# ──────────────────────────────────────────────────────

class RandomForestForecaster(BaseForecaster):
    name = "random_forest"
    supports_intervals = True

    def __init__(self, n_estimators: int = 200, max_depth: int = 15):
        from sklearn.ensemble import RandomForestRegressor
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            n_jobs=-1,
            random_state=42,
        )
        self._train_time = 0.0
        self._n_train = 0

    def train(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs) -> float:
        t0 = time.perf_counter()
        self.model.fit(X_train.fillna(0), y_train)
        self._n_train = len(y_train)
        self._train_time = time.perf_counter() - t0
        return self._train_time

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return np.maximum(0, self.model.predict(X.fillna(0)))

    def predict_interval(self, X: pd.DataFrame, alpha: float = 0.05) -> tuple[np.ndarray, np.ndarray]:
        """Use std of individual tree predictions as uncertainty estimate."""
        tree_preds = np.array([
            tree.predict(X.fillna(0)) for tree in self.model.estimators_
        ])
        mean = tree_preds.mean(axis=0)
        std = tree_preds.std(axis=0)
        from scipy import stats
        z = stats.norm.ppf(1 - alpha / 2)
        return np.maximum(0, mean - z * std), mean + z * std

    @property
    def feature_importances_(self):
        return self.model.feature_importances_


# ──────────────────────────────────────────────────────
# Model 3: XGBoost
# ──────────────────────────────────────────────────────

class XGBoostForecaster(BaseForecaster):
    name = "xgboost"
    supports_intervals = False

    def __init__(self, n_estimators: int = 300, learning_rate: float = 0.05, max_depth: int = 6):
        import xgboost as xgb
        self.model = xgb.XGBRegressor(
            n_estimators=n_estimators,
            learning_rate=learning_rate,
            max_depth=max_depth,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
            verbosity=0,
        )
        self._train_time = 0.0
        self._n_train = 0

    def train(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs) -> float:
        t0 = time.perf_counter()
        self.model.fit(X_train.fillna(0), y_train)
        self._n_train = len(y_train)
        self._train_time = time.perf_counter() - t0
        return self._train_time

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return np.maximum(0, self.model.predict(X.fillna(0)))

    @property
    def feature_importances_(self):
        return self.model.feature_importances_


# ──────────────────────────────────────────────────────
# Model 4: SARIMA
# ──────────────────────────────────────────────────────

class SARIMAForecaster(BaseForecaster):
    """
    SARIMA via statsmodels. Trained on full training series.
    For multi-step prediction, uses the lag features as pseudo-series.
    Simplified: ARIMA(2,1,2) with seasonal period 24h.
    """
    name = "sarima"
    supports_intervals = True

    def __init__(self):
        self._model_fit = None
        self._train_series: Optional[pd.Series] = None
        self._train_time = 0.0
        self._n_train = 0
        self._last_train_values = None

    def train(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs) -> float:
        from statsmodels.tsa.statespace.sarimax import SARIMAX
        t0 = time.perf_counter()
        series = y_train.values
        self._train_series = y_train.reset_index(drop=True)
        self._n_train = len(y_train)
        self._last_train_values = series[-168:]  # keep last week for forecasting
        
        # Use a simpler ARIMA for speed — full SARIMA is very slow on long series
        # Downsample for fitting (daily aggregates with 24h seasonality)
        try:
            # Fit on daily aggregates to keep computation tractable
            if len(series) > 2000:
                fit_series = series[-2000:]  # use most recent 2000 hours
            else:
                fit_series = series
            
            mdl = SARIMAX(
                fit_series,
                order=(2, 1, 2),
                seasonal_order=(1, 0, 1, 24),
                enforce_stationarity=False,
                enforce_invertibility=False,
            )
            self._model_fit = mdl.fit(disp=False, maxiter=50)
        except Exception as e:
            print(f"[SARIMA] Training warning: {e}. Falling back to ARIMA(2,1,2).")
            from statsmodels.tsa.arima.model import ARIMA
            fit_series = series[-500:] if len(series) > 500 else series
            mdl = ARIMA(fit_series, order=(2, 1, 2))
            self._model_fit = mdl.fit()
        
        self._train_time = time.perf_counter() - t0
        return self._train_time

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Use lag_168 (last week same hour) + ARIMA correction."""
        n = len(X)
        if self._model_fit is None:
            return X["lag_24"].values if "lag_24" in X.columns else np.ones(n)
        
        try:
            forecast = self._model_fit.forecast(steps=n)
            return np.maximum(0, np.array(forecast))
        except Exception:
            return X["lag_168"].values if "lag_168" in X.columns else np.ones(n)

    def predict_interval(self, X: pd.DataFrame, alpha: float = 0.05) -> tuple[np.ndarray, np.ndarray]:
        n = len(X)
        if self._model_fit is None:
            preds = self.predict(X)
            return np.maximum(0, preds * 0.85), preds * 1.15
        try:
            result = self._model_fit.get_forecast(steps=n)
            ci = result.conf_int(alpha=alpha)
            lower = np.maximum(0, ci.iloc[:, 0].values)
            upper = ci.iloc[:, 1].values
            return lower, upper
        except Exception:
            preds = self.predict(X)
            return np.maximum(0, preds * 0.85), preds * 1.15


# ──────────────────────────────────────────────────────
# Model 5: Facebook Prophet
# ──────────────────────────────────────────────────────

class ProphetForecaster(BaseForecaster):
    """
    Facebook Prophet — excellent for energy time-series with multiple seasonalities.
    Trained on timestamp + consumption pairs (not feature matrix).
    """
    name = "prophet"
    supports_intervals = True

    def __init__(self):
        self._model = None
        self._train_time = 0.0
        self._n_train = 0
        self._train_df: Optional[pd.DataFrame] = None

    def train(self, X_train: pd.DataFrame, y_train: pd.Series, timestamps: Optional[pd.Series] = None, **kwargs) -> float:
        from prophet import Prophet
        t0 = time.perf_counter()
        self._n_train = len(y_train)
        
        if timestamps is None and "timestamp" in X_train.columns:
            timestamps = X_train["timestamp"]
        
        if timestamps is None:
            raise ValueError("ProphetForecaster requires timestamps for training")
        
        prophet_df = pd.DataFrame({
            "ds": pd.to_datetime(timestamps.values),
            "y": y_train.values,
        })
        self._train_df = prophet_df
        
        mdl = Prophet(
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10.0,
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=True,
            uncertainty_samples=500,
        )
        mdl.add_seasonality(name="monthly", period=30.5, fourier_order=5)
        mdl.fit(prophet_df, iter=300)
        self._model = mdl
        self._train_time = time.perf_counter() - t0
        return self._train_time

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if self._model is None:
            return np.ones(len(X))
        timestamps = X["timestamp"] if "timestamp" in X.columns else pd.date_range(
            start="2023-01-01", periods=len(X), freq="h"
        )
        future = pd.DataFrame({"ds": pd.to_datetime(timestamps.values)})
        forecast = self._model.predict(future)
        return np.maximum(0, forecast["yhat"].values)

    def predict_interval(self, X: pd.DataFrame, alpha: float = 0.05) -> tuple[np.ndarray, np.ndarray]:
        if self._model is None:
            preds = self.predict(X)
            return np.maximum(0, preds * 0.85), preds * 1.15
        timestamps = X["timestamp"] if "timestamp" in X.columns else pd.date_range(
            start="2023-01-01", periods=len(X), freq="h"
        )
        future = pd.DataFrame({"ds": pd.to_datetime(timestamps.values)})
        forecast = self._model.predict(future)
        lower = np.maximum(0, forecast["yhat_lower"].values)
        upper = forecast["yhat_upper"].values
        return lower, upper


# ──────────────────────────────────────────────────────
# Model 6: LSTM (PyTorch)
# ──────────────────────────────────────────────────────

class LSTMForecaster(BaseForecaster):
    """
    LSTM using PyTorch. Uses sequence of past 168h to predict next value.
    Skippable with --skip-lstm flag.
    """
    name = "lstm"
    supports_intervals = False

    def __init__(self, seq_len: int = 168, hidden_size: int = 64, num_layers: int = 2, lr: float = 1e-3, epochs: int = 30):
        self.seq_len = seq_len
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lr = lr
        self.epochs = epochs
        self._scaler_min = 0.0
        self._scaler_max = 1.0
        self._net = None
        self._train_time = 0.0
        self._n_train = 0

    def _scale(self, x: np.ndarray) -> np.ndarray:
        return (x - self._scaler_min) / max(self._scaler_max - self._scaler_min, 1e-8)

    def _unscale(self, x: np.ndarray) -> np.ndarray:
        return x * (self._scaler_max - self._scaler_min) + self._scaler_min

    def _build_sequences(self, series: np.ndarray) -> tuple:
        X, y = [], []
        for i in range(self.seq_len, len(series)):
            X.append(series[i - self.seq_len:i])
            y.append(series[i])
        return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)

    def train(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs) -> float:
        try:
            import torch
            import torch.nn as nn
        except ImportError:
            print("[LSTM] PyTorch not available. Skipping LSTM.")
            return 0.0

        t0 = time.perf_counter()
        self._n_train = len(y_train)
        series = y_train.values.astype(np.float32)
        
        self._scaler_min = float(series.min())
        self._scaler_max = float(series.max())
        scaled = self._scale(series)
        
        X_seq, y_seq = self._build_sequences(scaled)
        if len(X_seq) == 0:
            return 0.0
        
        X_t = torch.tensor(X_seq).unsqueeze(-1)  # (N, seq_len, 1)
        y_t = torch.tensor(y_seq).unsqueeze(-1)  # (N, 1)

        class LSTMNet(nn.Module):
            def __init__(self, hidden, layers):
                super().__init__()
                self.lstm = nn.LSTM(1, hidden, layers, batch_first=True, dropout=0.2)
                self.fc = nn.Linear(hidden, 1)

            def forward(self, x):
                out, _ = self.lstm(x)
                return self.fc(out[:, -1, :])

        device = torch.device("cpu")
        net = LSTMNet(self.hidden_size, self.num_layers).to(device)
        optimizer = torch.optim.Adam(net.parameters(), lr=self.lr)
        criterion = nn.MSELoss()
        
        dataset = torch.utils.data.TensorDataset(X_t, y_t)
        loader = torch.utils.data.DataLoader(dataset, batch_size=64, shuffle=False)
        
        net.train()
        for epoch in range(self.epochs):
            for xb, yb in loader:
                optimizer.zero_grad()
                pred = net(xb.to(device))
                loss = criterion(pred, yb.to(device))
                loss.backward()
                optimizer.step()
            if (epoch + 1) % 10 == 0:
                print(f"[LSTM] Epoch {epoch+1}/{self.epochs} loss={loss.item():.4f}")
        
        self._net = net
        self._device = device
        self._train_time = time.perf_counter() - t0
        return self._train_time

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if self._net is None:
            return X["lag_168"].values if "lag_168" in X.columns else np.ones(len(X))
        try:
            import torch
            self._net.eval()
            # Use lag features to build sequence
            lag_cols = [f"lag_{l}" for l in [168, 48, 24, 12, 6, 3, 2, 1] if f"lag_{l}" in X.columns]
            if not lag_cols:
                return np.ones(len(X))
            
            preds = []
            with torch.no_grad():
                for i in range(len(X)):
                    # Build a fake sequence from lag features
                    row = X.iloc[i]
                    seq_vals = [row.get(c, row.get("lag_1", 1.0)) for c in lag_cols[:self.seq_len]]
                    # Pad if needed
                    while len(seq_vals) < self.seq_len:
                        seq_vals = [seq_vals[0]] + seq_vals
                    seq_arr = np.array(seq_vals[-self.seq_len:], dtype=np.float32)
                    scaled_seq = self._scale(seq_arr)
                    x_t = torch.tensor(scaled_seq).unsqueeze(0).unsqueeze(-1)
                    out = self._net(x_t).item()
                    preds.append(self._unscale(np.array([out]))[0])
            
            return np.maximum(0, np.array(preds))
        except Exception as e:
            print(f"[LSTM] Predict error: {e}")
            return X["lag_24"].values if "lag_24" in X.columns else np.ones(len(X))


# ──────────────────────────────────────────────────────
# Model 7: Ensemble
# ──────────────────────────────────────────────────────

class EnsembleForecaster(BaseForecaster):
    """
    Weighted ensemble of top-N models.
    Weights determined by inverse-MAE on validation set — never hardcoded.
    """
    name = "ensemble"
    supports_intervals = True

    def __init__(self):
        self._models: list[BaseForecaster] = []
        self._weights: list[float] = []
        self._train_time = 0.0
        self._n_train = 0

    def set_models_and_weights(self, models: list[BaseForecaster], weights: list[float]):
        self._models = models
        total = sum(weights)
        self._weights = [w / total for w in weights]

    def train(self, X_train: pd.DataFrame, y_train: pd.Series, **kwargs) -> float:
        # Ensemble doesn't train — it uses pre-trained models
        self._n_train = len(y_train)
        return 0.0

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if not self._models:
            return np.ones(len(X))
        preds = np.stack([m.predict(X) for m in self._models], axis=0)
        weights = np.array(self._weights).reshape(-1, 1)
        return np.maximum(0, (preds * weights).sum(axis=0))

    def predict_interval(self, X: pd.DataFrame, alpha: float = 0.05) -> tuple[np.ndarray, np.ndarray]:
        preds_list = []
        for m in self._models:
            if m.supports_intervals:
                lo, hi = m.predict_interval(X, alpha)
                preds_list.append((lo, hi))
        if not preds_list:
            p = self.predict(X)
            return np.maximum(0, p * 0.9), p * 1.1
        lower = np.mean([p[0] for p in preds_list], axis=0)
        upper = np.mean([p[1] for p in preds_list], axis=0)
        return lower, upper


# ──────────────────────────────────────────────────────
# Model Registry
# ──────────────────────────────────────────────────────

MODEL_REGISTRY: dict[str, type] = {
    "naive": NaiveForecaster,
    "linear_regression": LinearRegressionForecaster,
    "random_forest": RandomForestForecaster,
    "xgboost": XGBoostForecaster,
    "sarima": SARIMAForecaster,
    "prophet": ProphetForecaster,
    "lstm": LSTMForecaster,
    "ensemble": EnsembleForecaster,
}


def get_model(name: str) -> BaseForecaster:
    if name not in MODEL_REGISTRY:
        raise ValueError(f"Unknown model: {name}. Available: {list(MODEL_REGISTRY.keys())}")
    return MODEL_REGISTRY[name]()


def load_model(name: str) -> Optional[BaseForecaster]:
    path = MODELS_DIR / f"{name}.joblib"
    if not path.exists():
        return None
    try:
        return joblib.load(path)
    except Exception as e:
        print(f"[Registry] Failed to load {name}: {e}")
        return None


def list_trained_models() -> list[str]:
    return [p.stem for p in MODELS_DIR.glob("*.joblib") if p.stem != "metrics"]
