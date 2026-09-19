# Production Dockerfile for EnerSight AI FastAPI Backend
FROM python:3.10-slim

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source and scripts
COPY . /app/backend
COPY ../scripts /app/scripts

WORKDIR /app/backend

# Generate demo data & pre-train models if missing
RUN python /app/scripts/generate_demo_data.py || true
RUN python /app/scripts/train_models.py || true

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
