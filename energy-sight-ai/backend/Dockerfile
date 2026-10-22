# Production Dockerfile for EnerSight AI FastAPI Backend
# Build context: backend/ directory (used by docker-compose)
# For full-stack Docker, use the root Dockerfile instead.
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . /app/backend

# Copy scripts (must be placed next to backend when using docker-compose context)
# docker-compose.yml must set context: . (repo root) for this to work, or
# scripts must be pre-copied into the backend directory.
# If scripts/ is not available, demo data will be generated at runtime.
WORKDIR /app/backend

# Generate demo data if scripts are available (optional — safe to skip)
RUN if [ -f /app/scripts/generate_demo_data.py ]; then \
      python /app/scripts/generate_demo_data.py; \
    fi

EXPOSE 8000
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
