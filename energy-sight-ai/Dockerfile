# Production Dockerfile for EnerSight AI FastAPI Backend
# Build context: repository root (energy-sight-ai/)
# Usage: docker build -f Dockerfile -t energysight-backend .
FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (cache layer)
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend source and scripts
COPY backend /app/backend
COPY scripts /app/scripts

# Set working directory to backend for data/model generation
WORKDIR /app/backend

# Generate demo data and pre-train models (skip LSTM — too slow for build)
RUN python /app/scripts/generate_demo_data.py
RUN python /app/scripts/train_models.py --skip-lstm --fast

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Run from backend dir so relative imports resolve correctly
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
