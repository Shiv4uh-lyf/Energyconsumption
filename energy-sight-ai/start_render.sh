#!/bin/bash
# Render Full-Stack Startup Script

# Start FastAPI backend in background on 127.0.0.1:8000
echo "[RENDER] Starting FastAPI Backend on 127.0.0.1:8000..."
cd /app/backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 &

# Wait 3 seconds for backend server to warm up
sleep 3

# Start Next.js frontend on Render's external PORT
echo "[RENDER] Starting Next.js Frontend on port $PORT..."
cd /app/frontend
PORT=${PORT:-10000} npm start
