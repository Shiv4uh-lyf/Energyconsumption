Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ENERGYSIGHT AI - ONE-COMMAND STARTUP SCRIPT (PowerShell)  " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) { $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
Set-Location "$ScriptDir"

# 1. Python Check & Virtual Environment Setup
Write-Host "[1/4] Checking Python environment..." -ForegroundColor Yellow
try {
    $pythonVer = python --version 2>&1
    Write-Host "Found Python: $pythonVer" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: 'python' command not found. Please ensure Python 3.10+ is installed and added to PATH." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

Set-Location "$ScriptDir\backend"

if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Gray
    python -m venv venv
}

Write-Host "Installing Python dependencies..." -ForegroundColor Gray
& ".\venv\Scripts\python.exe" -m pip install -r requirements.txt

# 2. Data & Model Training
Write-Host "[2/4] Checking dataset & ML models..." -ForegroundColor Yellow
if (-not (Test-Path "data\demo_consumption.csv")) {
    Write-Host "Generating synthetic dataset..." -ForegroundColor Gray
    & ".\venv\Scripts\python.exe" "..\scripts\generate_demo_data.py"
}

if (-not (Test-Path "trained_models\metrics.json")) {
    Write-Host "Training machine learning models..." -ForegroundColor Gray
    & ".\venv\Scripts\python.exe" "..\scripts\train_models.py" --fast --skip-lstm
}

# 3. Node.js Check & Frontend Setup
Write-Host "[3/4] Checking Node.js frontend..." -ForegroundColor Yellow
try {
    $nodeVer = node --version 2>&1
    Write-Host "Found Node.js: $nodeVer" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: 'node' command not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

Set-Location "$ScriptDir\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies (first run)..." -ForegroundColor Gray
    npm install
}

# 4. Launch processes
Write-Host "[4/4] Launching Backend & Frontend services..." -ForegroundColor Green

Start-Process cmd -ArgumentList "/k", "cd /d `"$ScriptDir\backend`" && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000" -Title "EnerSight Backend (FastAPI)"
Start-Process cmd -ArgumentList "/k", "cd /d `"$ScriptDir\frontend`" && npm run dev" -Title "EnerSight Frontend (Next.js)"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  ENERGYSIGHT AI IS NOW RUNNING!                            " -ForegroundColor Green
Write-Host "  - Next.js Dashboard:  http://localhost:3000              " -ForegroundColor Green
Write-Host "  - FastAPI Swagger API: http://localhost:8000/docs         " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to finish launcher window..."
