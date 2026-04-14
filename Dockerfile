FROM python:3.13-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY ai_engine/pyproject.toml ai_engine/uv.lock ./

RUN uv sync --frozen --no-dev --no-install-project

COPY ai_engine/ ./ai_engine/

RUN uv sync --frozen --no-dev

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "ai_engine.main:app", "--host", "0.0.0.0", "--port", "8000"]
