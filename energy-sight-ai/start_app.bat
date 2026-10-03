@echo off
title EnerSight AI System Launcher
echo ============================================================
echo   ENERGYSIGHT AI - ONE-COMMAND STARTUP SCRIPT
echo ============================================================
echo.

cd /d "%~dp0"

:: 1. Check Python installation
echo [1/4] Checking Python environment...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: 'python' is not recognized or not in PATH!
    echo Please install Python 3.10+ and check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

cd backend
if not exist "venv" (
    echo Creating Python virtual environment (venv)...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create Python virtual environment.
        pause
        exit /b 1
    )
)

echo Installing Python dependencies into virtual environment...
".\venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies.
    pause
    exit /b 1
)

:: 2. Check & Train ML Models
echo.
echo [2/4] Generating telemetry data ^& training ML models...
if not exist "data\demo_consumption.csv" (
    echo Generating synthetic energy dataset...
    ".\venv\Scripts\python.exe" "..\scripts\generate_demo_data.py"
)

if not exist "trained_models\metrics.json" (
    echo Training machine learning models (XGBoost, Random Forest, Ensemble)...
    ".\venv\Scripts\python.exe" "..\scripts\train_models.py" --fast --skip-lstm
)

:: 3. Check Node.js & Frontend Setup
echo.
echo [3/4] Checking Node.js frontend...
cd ..\frontend

node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: 'node' is not recognized or not in PATH!
    echo Please install Node.js (LTS version) from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing npm packages (this may take 1-2 minutes for first run)...
    call npm install
    if errorlevel 1 (
        echo ERROR: 'npm install' failed!
        pause
        exit /b 1
    )
)

:: 4. Launch both servers in separate windows
echo.
echo [4/4] Launching FastAPI Backend ^& Next.js Frontend...
echo.

start "EnerSight Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"
start "EnerSight Frontend (Next.js)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo ============================================================
echo   SUCCESS! EnerSight AI services are launching.
echo.
echo   - Next.js Interface: http://localhost:3000
echo   - FastAPI Backend:   http://localhost:8000/docs
echo ============================================================
echo.
pause