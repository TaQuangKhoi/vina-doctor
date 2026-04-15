# Vina Doctor — Agent Guide

## Repo Overview

Three independent services in a Docker Compose monorepo:

| Service | Port (internal) | Port (host via nginx) | Stack |
|---|---|---|---|
| `frontend/` | 3000 | 80 | Next.js 16 (React 19) |
| `backend/` | 8001 | /api/ | FastAPI + async SQLAlchemy + Alembic |
| `ai_engine/` | 8000 | /v1/ | FastAPI + DashScope (Qwen2-Audio) |

nginx reverse proxy is the only service exposed to the host on port 80.

## Common Commands

```bash
# Python services — always cd into the service dir first
cd ai_engine && uv sync && uv run uvicorn ai_engine.main:app --reload
cd backend && uv sync && uv run uvicorn backend.main:app --reload --port 8001

# Frontend
cd frontend && pnpm install && pnpm run dev

# Docker Compose (full system — from repo root)
docker compose up --build
```

## Verify Changes

```bash
cd ai_engine && uv run ruff check . && uv run ruff format --check .
cd backend && uv run ruff check . && uv run ruff format --check .
cd frontend && pnpm run lint && pnpm exec tsc --noEmit
```

## Architecture Constraints

- **Clean Architecture**: `domain/` → `application/` → `adapters/` → `infrastructure/`
  - Domain/Application layers must NOT import FastAPI, SQLAlchemy, DashScope, or Next.js
  - Use constructor injection; never instantiate infrastructure inside use cases
- **SOLID principles** apply to all Python and TypeScript code (see `.github/instructions/`)
- **No tests yet** — `tests/` directories do not exist; CI runs `pytest ... || true` (always exits 0)

## Python Package Gotcha

Each service's `pyproject.toml` uses `package-dir = {"" = ".."}` so the service dir itself IS the package.
- Import from repo root: `from ai_engine.main import app`
- Do NOT add a `src/` layout within a service dir — it will break the import path
- When adding dependencies, `uv sync` from within the service dir

## AI Engine — Models

Uses **Qwen2-Audio** (`qwen-audio-turbo` / `qwen-audio-max`), NOT Qwen3-ASR-Flash.
Default models are configured via env vars `VINA_MODEL_SCRIBE` / `VINA_MODEL_CLINICAL`.
The `docs/ai_model.md` doc describes Qwen3 models — the implementation has NOT been updated to those yet.

## Backend — Database

- Dev: SQLite via `aiosqlite` (`DATABASE_URL=sqlite+aiosqlite:///./vina_doctor.db`)
- Prod: PostgreSQL via `asyncpg` (`DATABASE_URL=postgresql+asyncpg://...`)
- Migrations use Alembic (`alembic upgrade head`)

## API Routing (nginx)

```
/          → frontend:3000
/api/      → backend:8001   (REST API)
/v1/       → ai_engine:8000 (audio processing)
```

The backend calls `AI_ENGINE_URL=http://ai_engine:8000` (Docker internal DNS).

## Key Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Full system topology |
| `docs/ai_model.md` | AI model reference (may lag behind implementation) |
| `.github/instructions/clean-architecture.instructions.md` | Layer rules |
| `.github/instructions/solid-principles.instructions.md` | SOLID rules |
| `.github/instructions/agent-engineering.instructions.md` | Agent engineering disciplines (system design, tool contracts, retrieval, reliability, security, observability, product thinking) |
| `.github/workflows/ci.yml` | Lint/test commands |
