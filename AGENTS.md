# Vina Doctor — Agent Guide

**Always use `but-cli` skill for all Git operations.**

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

Uses **Qwen3.5-Omni-Flash** (`qwen3.5-omni-flash`) on the **international endpoint** (`https://dashscope-intl.aliyuncs.com/api/v1`). The CN endpoint (`dashscope.aliyuncs.com`) does NOT have this model.
Default models are configured via env vars `VINA_MODEL_SCRIBE` / `VINA_MODEL_CLINICAL`.
The `docs/ai_model.md` doc describes Qwen3 models — the implementation has NOT been updated to those yet.

## Git Workflow

**Always use GitButler CLI (`but`)** for all Git operations. Never run `docker`/`docker-compose` directly on remote servers or do manual deployments.

```bash
# Standard workflow (ALWAYS follow this sequence):
but branch new <branch-name>           # Create branch
but stage <file-id> <branch-name>     # Stage files (use IDs from but status -f)
but commit <branch-name> -m "msg"      # Commit
but push <branch-name>                 # Push to remote
# If but pr fails (no authenticated forge), use gh CLI:
gh pr create --title "..." --body "..." --base main --head <branch-name> --repo sotaworksvn/vina-doctor
# Wait for CI to pass, then merge automatically:
gh pr merge <pr-number> --squash --auto --delete-branch --repo sotaworksvn/vina-doctor
```

**After pushing and creating a PR, always wait for CI to pass then merge automatically. Do NOT leave PRs for manual merge.**

**Do NOT:**
- `ssh` into remote server and run `docker` commands directly
- Manually `git pull`, `docker build`, `docker compose up -d` on the server
- Bypass CI/CD pipeline for deployments

**Remote server SSH:** `ssh -i ~/.ssh/vina-doctor-key.pem root@47.238.224.19`

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
