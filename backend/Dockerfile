FROM python:3.13-slim AS base

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Build context is ./backend — copy its contents into /app/backend/
# package-dir {"" = ".."} in pyproject.toml means setuptools looks in /app/
# (the parent) and finds the `backend` package at /app/backend/
COPY . ./backend/

# Install all dependencies (including uvicorn) declared in pyproject.toml
RUN cd backend && uv pip install --system .

# Persistent data directory (override DATABASE_URL and AUDIO_STORAGE_PATH via env)
RUN mkdir -p /data/audio_uploads
# Copy entrypoint script and make it executable
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8001

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8001"]
