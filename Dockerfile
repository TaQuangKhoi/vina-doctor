FROM python:3.13-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Keep the directory structure intact so setuptools' package-dir = {"" = ".."}
# resolves to /app/ and finds the ai_engine package at /app/ai_engine/
COPY ai_engine/pyproject.toml ai_engine/uv.lock ./ai_engine/

# Install deps only (no project source yet) — fast layer cache
RUN cd ai_engine && uv sync --frozen --no-dev --no-install-project

# Copy the full source tree
COPY ai_engine/ ./ai_engine/

# Install the project now that source is present
RUN cd ai_engine && uv sync --frozen --no-dev

EXPOSE 8000

# Run from within the project directory so uv finds its .venv
WORKDIR /app/ai_engine

CMD ["uv", "run", "uvicorn", "ai_engine.main:app", "--host", "0.0.0.0", "--port", "8000"]
