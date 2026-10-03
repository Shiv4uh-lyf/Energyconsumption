# ============================================================
# EnerSight AI — Full-Stack Dockerfile (Repo Root)
# Build context: repo root
# App lives in: energy-sight-ai/
# ============================================================

FROM python:3.10-slim

WORKDIR /app

# ── System deps: Node.js 18 + build tools ──────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# ── Python backend dependencies ─────────────────────────────
COPY energy-sight-ai/backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# ── Copy backend source & ML scripts ───────────────────────
COPY energy-sight-ai/backend /app/backend
COPY energy-sight-ai/scripts /app/scripts

# Pre-generate dataset & train ML models at build time
WORKDIR /app/backend
RUN python /app/scripts/generate_demo_data.py
RUN python /app/scripts/train_models.py

# ── Next.js frontend: install & build ──────────────────────
COPY energy-sight-ai/frontend/package*.json /app/frontend/
WORKDIR /app/frontend
RUN npm install

COPY energy-sight-ai/frontend /app/frontend
RUN npm run build

# ── Startup script ──────────────────────────────────────────
COPY energy-sight-ai/start_render.sh /app/start_render.sh
RUN chmod +x /app/start_render.sh

WORKDIR /app

EXPOSE 10000

ENV PORT=10000
ENV PYTHONUNBUFFERED=1

CMD ["/app/start_render.sh"]
