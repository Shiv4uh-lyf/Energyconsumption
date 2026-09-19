@echo off
title EnerSight AI System Launcher
echo ============================================================
echo   ENERGYSIGHT AI - ONE-COMMAND STARTUP SCRIPT
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/4] Setting up Python virtual environment...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment (venv)...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Python is not installed or not in PATH! Please install Python 3.10+.
        pause
        exit /b 1
    )
)

call venv\Scripts\activate
echo Installing Python backend dependencies...
pip install -r requirements.txt

echo.
echo [2/4] Generating telemetry data ^& training ML models...
if not exist "data\demo_consumption.csv" (
    echo Generating synthetic energy dataset...
    python ..\scripts\generate_demo_data.py
)

if not exist "trained_models\metrics.json" (
    echo Training machine learning models (XGBoost, Random Forest, SARIMA, Ensemble)...
    python ..\scripts\train_models.py
)

echo.
echo [3/4] Setting up Node.js frontend...
cd ..\frontend
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Node.js / npm is not installed or not in PATH!
        pause
        exit /b 1
    )
)

echo.
echo [4/4] Launching FastAPI Backend ^& Next.js Frontend...
echo.

start "EnerSight Backend (FastAPI)" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
start "EnerSight Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ============================================================
echo   SUCCESS! EnerSight AI services are launching.
echo.
echo   - Next.js Interface: http://localhost:3000
echo   - FastAPI Backend:   http://localhost:8000/docs
echo ============================================================
echo.
pause
