# ⚡ Product Requirement Document (PRD): EnerSight AI

**Document Title:** EnerSight AI — Energy Consumption Forecasting & Operational Grid Intelligence Platform  
**Version:** 1.0.0 (Production Release)  
**Date:** September 29, 2026  
**Status:** Approved / Active  
**Author:** EnerSight Product & Machine Learning Engineering Team  

---

## 🎯 1. Executive Summary

**EnerSight AI** is a production-grade, full-stack AI platform engineered for high-precision energy consumption forecasting, hybrid anomaly detection, machine learning model benchmarking, and automated grid telemetry analytics.

The platform bridges real Python-based machine learning pipelines with an interactive **Energy Intelligence Command Center** built on Next.js 14. It empowers grid dispatchers, utility analysts, and energy managers to make data-driven decisions, anticipate peak loads, detect operational anomalies in real time, and explain model predictions with total transparency.

---

## 💡 2. Problem Statement & Strategic Objectives

### 2.1 Problem Statement
Modern power grids and industrial facilities struggle with three primary challenges:
1. **Unpredictable Demand Dynamics:** Volatile weather patterns, EV charging loads, and renewable integration make traditional linear forecasting inaccurate.
2. **Delayed Anomaly Awareness:** Critical grid anomalies (meter faults, unmetered loads, equipment breakdown) often remain undetected until billing cycles end.
3. **Black-Box ML Disconnect:** Operational teams distrust complex ML models when predictions lack explainability and failure metrics.

### 2.2 Core Objectives & Success KPIs

| Metric Category | Target Objective | Target Threshold |
| :--- | :--- | :--- |
| **Prediction Accuracy** | Mean Absolute Error (MAE) across 168h horizon | `< 0.05 kWh / unit` |
| **Inference Latency** | Multi-horizon forecast inference response time | `< 100 ms` |
| **Rendering Performance** | Interactive 3D telemetry wave render rate | `60 fps` |
| **Anomaly Precision** | Hybrid Z-Score + Isolation Forest detection precision | `> 92%` |
| **Explainability** | Instant feature contribution extraction | `100% of tree-based forecasts` |

---

## 👥 3. Target User Personas

1. **Grid Operations Manager / Chief Dispatcher**
   - *Goal:* Monitor real-time grid telemetry, identify peak load spikes, and balance supply dispatch.
   - *Key Interface:* Overview Command Center & Anomaly Monitor.

2. **Energy & ML Data Scientist**
   - *Goal:* Benchmark competing ML models (XGBoost vs. SARIMA vs. Ensemble), tune horizons, and evaluate feature importance.
   - *Key Interface:* Model Arena & Forecast Studio.

3. **Sustainability & Facility Manager**
   - *Goal:* Analyze diurnal 24h consumption profiles, weekday/weekend load variances, and audit data cleanliness.
   - *Key Interface:* Pattern Explorer & Data Health Audit.

---

## 🚀 4. System Architecture & Technology Stack

```
User / Web Browser (Next.js 14 Frontend)
         │
         ▼  (HTTP REST / JSON via Axios)
FastAPI Backend Service (:8000)
         │
         ▼  (Feature Engineering Pipeline)
ML Pipeline Engine
 ├── Preprocessed Dataset (Pandas / NumPy)
 ├── 5 ML Forecasters (Joblib Serialization)
 ├── Hybrid Anomaly Detector (IsolationForest + Z-Score)
 └── Explainability Handler (SHAP metrics)
```

### 4.1 Technology Stack Details

- **Frontend Framework:** Next.js 14 (App Router), React 18, TypeScript 5.
- **Styling & Animation:** Vanilla CSS design tokens, TailwindCSS 3.4, Framer Motion 11, Lucide React icons.
- **Data Visualization:** HTML5 Canvas 2D / WebGL 60fps wave render engine, Recharts 2.12 time-series suite.
- **Backend API:** FastAPI (Python 3.10+), Pydantic v2 validation schemas, Uvicorn ASGI server.
- **Machine Learning Core:** Scikit-Learn, XGBoost, Statsmodels (SARIMA), SHAP, Joblib, NumPy, Pandas.

---

## 💻 5. Workstation Page Modules (Functional Requirements)

EnerSight AI consists of **8 specialized operational workstations**:

```
EnerSight AI Application
├── ⚡ Overview Command Center (Spatial KPIs & 3D Telemetry Surface Wave)
├── 📈 Forecast Studio (Multi-Horizon Prediction Engine & CSV Export)
├── 🏆 Model Arena (Out-of-Sample Leaderboard & Latency Benchmark)
├── 📊 Pattern Explorer (Diurnal 24h Load Profiles & Weekday/Weekend Heatmaps)
├── 🚨 Anomaly Monitor (Hybrid Residual Timeline & Incident Stream)
├── 🧠 AI Energy Analyst (Zero-Hallucination Rule Engine & Interactive CoPilot)
├── 🗄️ Data Health (Preprocessing Audit, Missing Value Checks & Chronological Splits)
└── ⚙️ Settings (Endpoint Config, Default Engine Selection & Automated Retraining)
```

---

### 5.1 ⚡ Workstation 1: Overview Command Center (`/`)
- **Key Features:**
  - **Live KPI Strip:** Instant display of current load (kWh), 24h forecasted peak, active anomaly count, and grid efficiency score.
  - **3D Energy Surface Wave:** Interactive 60fps HTML5 Canvas visualization rendering historical telemetry, real-time current load, and multi-horizon AI prediction curves.
  - **Quick Action Bar:** One-click triggers for instant retraining, export, and forecast refresh.

### 5.2 📈 Workstation 2: Forecast Studio (`/forecast`)
- **Key Features:**
  - **Configurable Horizons:** Interactive selection for 24h, 48h, 72h, or 168h (7-day) forecast windows.
  - **Engine Selector:** Dynamic switching between Weighted Ensemble, XGBoost, Random Forest, Ridge Regression, and SARIMA.
  - **Confidence Bands:** 95% statistical confidence interval bounds overlay.
  - **Export Engine:** Download forecasted time-series data as formatted CSV or JSON reports.

### 5.3 🏆 Workstation 3: Model Arena (`/models`)
- **Key Features:**
  - **Out-of-Sample Leaderboard:** Comparative ranking based on MAE, RMSE, MAPE, R², and training/inference execution time.
  - **Radar Evaluation Chart:** Multi-dimensional visualization comparing accuracy vs. speed vs. complexity.
  - **Model Inspection Panel:** Detailed hyperparameters, feature counts, and training timestamps for every serialized model.

### 5.4 📊 Workstation 4: Pattern Explorer (`/patterns`)
- **Key Features:**
  - **24-Hour Diurnal Heatmap:** Hourly consumption load profiles color-coded from base load to peak intensity.
  - **Weekday vs. Weekend Breakdown:** Comparative analytics highlighting operational shift differences.
  - **Seasonal Trend Decomposition:** Trend, seasonal, and residual time-series decomposition plots.

### 5.5 🚨 Workstation 5: Anomaly Monitor (`/anomalies`)
- **Key Features:**
  - **Hybrid Detection Algorithm:** Combination of **Rolling Z-Score** (spikes/dips) and **Isolation Forest** (multivariate out-of-bounds).
  - **Residual Timeline Scatter:** Interactive plot mapping actual vs. expected residual deviation.
  - **Incident Stream Log:** Severity classification (High/Medium/Low), timestamp, peak magnitude, and one-click incident acknowledgement.

### 5.6 🧠 Workstation 6: AI Energy Analyst & CoPilot (`/analyst`)
- **Key Features:**
  - **Zero-Hallucination Statistical Insights:** Rule-based executive summary generation based on statistical moments.
  - **SHAP Feature Explainability:** Bar chart breakdown of top predictive drivers (e.g., `lag_24h`, `rolling_mean_168h`, `hour_sin/cos`).
  - **Interactive Natural Language CoPilot:** Query interface providing structured answers regarding load status and anomaly root causes.

### 5.7 🗄️ Workstation 7: Data Health & Audit (`/health`)
- **Key Features:**
  - **Quality Audit Metrics:** Telemetry frequency audit, duplicate record detection, and missing value imputation logs.
  - **Chronological Split Visualizer:** Visual representation of chronological 70% Train / 15% Validation / 15% Test partitioning (preventing lookahead data leakage).
  - **Upload Telemetry:** Custom CSV drag-and-drop ingestion pipeline.

### 5.8 ⚙️ Workstation 8: Settings & Operations (`/settings`)
- **Key Features:**
  - **API Endpoint Configuration:** Seamless toggle between local localhost server and production cloud endpoints.
  - **Default Engine Selection:** Set preferred default forecasting algorithm for session loading.
  - **One-Click Model Retraining:** Asynchronous trigger executing model retraining script in the background.

---

## 🔬 6. Machine Learning Pipeline Specification

### 6.1 Feature Engineering Pipeline
The feature extraction engine generates 16+ temporal and statistical features:
1. **Cyclical Encodings:** `hour_sin`, `hour_cos`, `dayofweek_sin`, `dayofweek_cos`, `month_sin`, `month_cos`.
2. **Lag Telemetry:** `lag_1`, `lag_2`, `lag_24` (24h prior), `lag_168` (1-week prior).
3. **Rolling Statistics:** `rolling_mean_24`, `rolling_std_24`, `rolling_mean_168`, `rolling_std_168`.

### 6.2 ML Forecasting Algorithms
1. **Weighted Ensemble:** Dynamic inverse-MAE weighted combination of top sub-models.
2. **XGBoost Regressor:** Gradient boosted decision trees optimized for temporal lag features.
3. **Random Forest:** Non-linear ensemble with bootstrap aggregation.
4. **Ridge Regression:** L2-regularized linear baseline with cyclical time encoding.
5. **SARIMA:** Seasonal Autoregressive Integrated Moving Average.

---

## 📡 7. API Specification & Core Data Contracts

| Method | Endpoint | Description | Request Payload / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check | None |
| `GET` | `/api/data/summary` | Dataset metadata & date ranges | None |
| `POST` | `/api/forecast` | Execute multi-horizon forecast | `{ horizon_hours: 24, model_name: "ensemble" }` |
| `GET` | `/api/models/evaluate` | Fetch out-of-sample benchmark metrics | None |
| `GET` | `/api/patterns` | Fetch diurnal 24h heatmaps & profiles | None |
| `GET` | `/api/anomalies` | Fetch detected anomalies stream | `?threshold=2.5` |
| `GET` | `/api/explainability` | Get SHAP feature importance weights | `?model_name=xgboost` |
| `POST` | `/api/copilot` | Natural language grid query endpoint | `{ query: "What is the peak forecast load tomorrow?" }` |

---

## 🔒 8. Non-Functional Requirements (NFR)

- **Performance & Reliability:** 99.9% API uptime; backend response time under 100ms for active cached models.
- **Design System & UX:** EnerSight Dark Graphite palette (`#030712` background, `#14b8a6` teal accents, `#06b6d4` cyan highlights). Glassmorphism UI containers with subtle border glows.
- **Security & Data Isolation:** CORS origin restrictions; strict Pydantic input validation; zero unhandled exceptions.
- **Maintainability:** Modular architecture with clean separation between ML pipeline (`/ml`), API REST handlers (`/app/api`), and Next.js frontend pages (`/app`).

---

## 🛠️ 9. Deployment & Installation Specifications

### 9.1 Local Development (One-Click)
- **Batch Launcher:** `start_app.bat`
- **PowerShell Launcher:** `start_app.ps1`

### 9.2 Containerized Setup (Docker)
```cmd
cd energy-sight-ai
docker-compose up --build
```
- **Backend Container:** FastAPI on port `8000`.
- **Frontend Container:** Next.js on port `3000`.

---

## 🔮 10. Future Expansion Roadmap

- **Phase 1 (Q4 2026):** Real-time MQTT telemetry grid connector for live Smart Meter ingestion.
- **Phase 2 (Q1 2027):** Automated hyperparameter optimization (Optuna integration).
- **Phase 3 (Q2 2027):** Multi-tenant microgrid support with role-based access control (RBAC).

---
*End of Product Requirement Document (PRD).*
