#!/bin/bash
# Render Full-Stack Multi-Environment Startup Script

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "[RENDER] Setting up backend environment..."
if [ -d "$SCRIPT_DIR/backend" ]; then
  cd "$SCRIPT_DIR/backend"
  python3 -m pip install -r requirements.txt 2>/dev/null || pip install -r requirements.txt 2>/dev/null || true
  python3 ../scripts/generate_demo_data.py 2>/dev/null || true
  python3 ../scripts/train_models.py 2>/dev/null || true
  echo "[RENDER] Starting FastAPI Backend on 127.0.0.1:8000..."
  python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
fi

# Wait 3 seconds for backend server to warm up
sleep 3

# Start Next.js frontend on Render's external PORT
if [ -d "$SCRIPT_DIR/frontend" ]; then
  echo "[RENDER] Starting Next.js Frontend on port $PORT..."
  cd "$SCRIPT_DIR/frontend"
  PORT=${PORT:-10000} npm start
fi
