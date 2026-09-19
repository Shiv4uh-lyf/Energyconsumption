Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ENERGYSIGHT AI - ONE-COMMAND STARTUP SCRIPT (PowerShell)  " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Backend Setup
Write-Host "[1/4] Checking Python environment..." -ForegroundColor Yellow
Set-Location "$ScriptDir\backend"

if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Gray
    python -m venv venv
}

& "venv\Scripts\python.exe" -m pip install -r requirements.txt

# 2. Data & Model Training
Write-Host "[2/4] Checking dataset & ML models..." -ForegroundColor Yellow
if (-not (Test-Path "data\demo_consumption.csv")) {
    Write-Host "Generating synthetic dataset..." -ForegroundColor Gray
    & "venv\Scripts\python.exe" "..\scripts\generate_demo_data.py"
}

if (-not (Test-Path "trained_models\metrics.json")) {
    Write-Host "Training all 5 machine learning models..." -ForegroundColor Gray
    & "venv\Scripts\python.exe" "..\scripts\train_models.py"
}

# 3. Frontend Setup
Write-Host "[3/4] Checking Node.js frontend..." -ForegroundColor Yellow
Set-Location "$ScriptDir\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Gray
    npm install
}

# 4. Launch processes
Write-Host "[4/4] Launching Backend & Frontend services..." -ForegroundColor Green

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\backend'; .\venv\Scripts\activate; uvicorn app.main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\frontend'; npm run dev"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  ENERGYSIGHT AI IS NOW RUNNING!                            " -ForegroundColor Green
Write-Host "  - Next.js Dashboard:  http://localhost:3000              " -ForegroundColor Green
Write-Host "  - FastAPI Swagger API: http://localhost:8000/docs         " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
