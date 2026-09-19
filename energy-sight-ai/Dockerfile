# Full-Stack Production Dockerfile for EnerSight AI on Render / Docker
FROM python:3.10-slim

WORKDIR /app

# Install Node.js, npm, and system build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend source & scripts
COPY backend /app/backend
COPY scripts /app/scripts

# Pre-generate dataset & pre-train ML models during build phase
WORKDIR /app/backend
RUN python /app/scripts/generate_demo_data.py
RUN python /app/scripts/train_models.py

# Install Node frontend dependencies & build Next.js app
COPY frontend /app/frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Copy & set permissions for Render runner script
COPY start_render.sh /app/start_render.sh
RUN chmod +x /app/start_render.sh

WORKDIR /app

EXPOSE 10000

ENV PORT=10000
ENV PYTHONUNBUFFERED=1

CMD ["/app/start_render.sh"]
