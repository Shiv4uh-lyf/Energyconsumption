# ⚡ EnerSight AI — Energy Consumption Forecasting & Intelligence Platform

**EnerSight AI** is a production-grade, full-stack AI platform for energy consumption forecasting, anomaly detection, model benchmarking, and operational grid intelligence.

Designed with a futuristic **Energy Intelligence Command Center** interface, it combines real Python machine learning pipelines with an interactive Next.js dashboard.

---

## 🌟 Key Features

1. **5 Machine Learning Forecasting Engines**:
   - **Weighted Ensemble**: Optimal blend of XGBoost, Random Forest, and Linear Regression.
   - **XGBoost Regressor**: Gradient boosted decision trees optimized for temporal lag features.
   - **Random Forest Regressor**: Non-linear ensemble with bootstrap aggregation.
   - **Ridge Linear Regression**: L2-regularized linear baseline with cyclical time encoding.
   - **SARIMA**: Seasonal Autoregressive Integrated Moving Average for periodic time-series.

2. **Real-Time 3D Energy Surface Wave**:
   - Interactive 60fps canvas visualization of historical telemetry, real-time current load, and multi-horizon AI prediction curves.

3. **Hybrid Anomaly Detection Engine**:
   - Multi-stage anomaly flags combining **Rolling Z-Score** and **Isolation Forest** algorithms for residual deviation analysis.

4. **SHAP & Feature Importance Explainability**:
   - Transparent predictive influence metrics (lag 24h, rolling mean 168h, cyclical hour sin/cos) for tree models.

5. **8 Dedicated Workstation Pages**:
   - ⚡ **Overview**: Energy Command Center with Spatial KPIs and 3D wave visualization.
   - 📈 **Forecast Studio**: Configurable multi-horizon forecasting workstation with CSV exports.
   - 🏆 **Model Arena**: Out-of-sample test benchmark leaderboard comparing MAE, RMSE, MAPE, R², and latency.
   - 📊 **Pattern Explorer**: Diurnal 24h load profile heatmaps and weekday/weekend consumption variance.
   - 🚨 **Anomaly Monitor**: Residual timeline scatter plot and incident log stream.
   - 🧠 **AI Energy Analyst**: Zero-hallucination statistical rule-based insight engine.
   - 🗄️ **Data Health**: Preprocessing audit, missing value checks, and chronological train/val/test splits.
   - ⚙️ **Settings**: Endpoint configuration, default engine selection, and retraining triggers.

---

## 📁 Repository Structure

```
energy-sight-ai/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints
│   │   ├── schemas/         # Pydantic data schemas
│   │   ├── services/        # Business logic & ML inference handlers
│   │   └── main.py          # FastAPI application entrypoint
│   ├── ml/                  # Core Machine Learning algorithms
│   │   ├── anomaly.py       # IsolationForest + Rolling Z-score
│   │   ├── evaluation.py    # MAE, RMSE, MAPE, R2 metrics
│   │   ├── explainability.py# SHAP feature importance
│   │   ├── features.py      # Feature engineering pipeline
│   │   ├── forecasting.py   # Model trainers & inference wrappers
│   │   ├── preprocessing.py # Resampling & missing value imputation
│   │   └── splitting.py     # Chronological train/val/test split
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── app/                 # Next.js 14 App Router pages
│   ├── components/          # React components, 3D Canvas & Recharts
│   ├── lib/                 # Axios TypeScript API client
│   ├── tailwind.config.js   # EnerSight dark graphite design system
│   └── package.json         # Node.js frontend dependencies
├── scripts/
│   ├── generate_demo_data.py # Synthetic energy time-series generator
│   └── train_models.py      # Model training script
└── README.md
```

---

## 🚀 Quick Start (One Command)

You can run the entire system automatically (environment creation, model training, FastAPI backend, and Next.js frontend) with a single command!

### Option A: Command Prompt / Windows Double-Click

Double-click `start_app.bat` in File Explorer, or run in Command Prompt:

```cmd
start_app.bat
```

### Option B: PowerShell

```powershell
.\start_app.ps1
```

This single command will:
1. Create Python virtualenv & install backend requirements.
2. Generate synthetic energy telemetry dataset.
3. Train all 5 machine learning models (`train_models.py`).
4. Install frontend npm dependencies.
5. Spin up both the FastAPI backend (`http://localhost:8000`) and Next.js frontend (`http://localhost:3000`) in separate windows.

---

## 🛠️ Manual Step-by-Step Setup

---

## 🔬 ML Pipeline Architecture

- **Data Frequency**: 1-Hour (Hourly Resampled Telemetry)
- **Features Engineered**:
  - `hour_sin`, `hour_cos`, `dayofweek_sin`, `dayofweek_cos`, `month_sin`, `month_cos`
  - `lag_1`, `lag_2`, `lag_24`, `lag_168`
  - `rolling_mean_24`, `rolling_std_24`, `rolling_mean_168`, `rolling_std_168`
- **Train/Val/Test Split**: Chronological split (70% Train, 15% Validation, 15% Test) to prevent lookahead data leakage.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, Python 3.10+, Pandas, NumPy, Scikit-Learn, XGBoost, Statsmodels, SHAP, Joblib, Pydantic.
- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Recharts, Framer Motion, Lucide React, HTML5 Canvas 2D/WebGL.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
