#!/bin/bash
# EnerSight AI — Render Startup Script
# NOTE: This script is for the single-container Docker deployment only.
# For Render's native Python/Node services, render.yaml handles each service separately.

set -e  # Exit on any error — do NOT suppress initialization failures

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PORT="${PORT:-10000}"

echo "[RENDER] ========================================================"
echo "[RENDER] EnerSight AI Startup"
echo "[RENDER] Script dir: $SCRIPT_DIR"
echo "[RENDER] PORT: $PORT"
echo "[RENDER] ========================================================"

# ── Backend setup ──
if [ -d "$SCRIPT_DIR/backend" ]; then
  cd "$SCRIPT_DIR/backend"
  echo "[RENDER] Working dir: $(pwd)"

  echo "[RENDER] Generating demo data (if not present)..."
  if [ ! -f "data/demo_consumption.csv" ] && [ ! -f "data/consumption.csv" ]; then
    python3 ../scripts/generate_demo_data.py
  else
    echo "[RENDER]   Data already exists, skipping generation."
  fi

  echo "[RENDER] Training models (fast mode, skip LSTM)..."
  if [ ! -f "trained_models/xgboost.joblib" ]; then
    python3 ../scripts/train_models.py --skip-lstm --fast
  else
    echo "[RENDER]   Trained models found, skipping training."
  fi

  echo "[RENDER] Starting FastAPI backend on 0.0.0.0:8000..."
  python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
  BACKEND_PID=$!
  echo "[RENDER] Backend PID: $BACKEND_PID"
fi

# ── Wait for backend to be ready ──
echo "[RENDER] Waiting for backend to start..."
for i in $(seq 1 15); do
  if curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo "[RENDER] Backend is ready after ${i}s"
    break
  fi
  if [ $i -eq 15 ]; then
    echo "[RENDER] WARNING: Backend did not become ready in 15s — check logs above"
  fi
  sleep 1
done

# ── Frontend ──
if [ -d "$SCRIPT_DIR/frontend" ]; then
  echo "[RENDER] Starting Next.js frontend on port $PORT..."
  cd "$SCRIPT_DIR/frontend"
  PORT=$PORT npm start
fi
