FROM python:3.13-slim AS base

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy the backend package directory
# package-dir {"" = ".."} in pyproject.toml means setuptools looks in /app/
# for packages, and finds the `backend` package at /app/backend/
COPY backend/ ./backend/

# Install all dependencies (including uvicorn) declared in pyproject.toml
RUN cd backend && uv pip install --system .

# Persistent data directory (override DATABASE_URL and AUDIO_STORAGE_PATH via env)
RUN mkdir -p /data/audio_uploads

EXPOSE 8001

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8001"]
