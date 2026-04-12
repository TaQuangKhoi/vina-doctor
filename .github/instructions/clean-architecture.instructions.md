---
description: "Use when creating modules, services, repositories, controllers, or any new file in backend/, ai_engine/, or frontend/. Enforces Clean Architecture: layering, dependency direction, and separation of concerns."
applyTo: "**/*.{py,ts,tsx}"
---

# Clean Architecture

## Layer Model

```
┌─────────────────────────────────────────────────┐
│  Frameworks & Drivers  (FastAPI routes, Next.js  │
│  pages, DashScope client, DB adapters)           │
├─────────────────────────────────────────────────┤
│  Interface Adapters  (controllers, presenters,   │
│  repository implementations, serializers)        │
├─────────────────────────────────────────────────┤
│  Application / Use Cases  (orchestrate domain,   │
│  no framework imports)                           │
├─────────────────────────────────────────────────┤
│  Domain / Entities  (business rules, value       │
│  objects, domain events — zero external deps)    │
└─────────────────────────────────────────────────┘
```

**Dependency Rule**: imports always point inward. Domain never imports from Application; Application never imports from Infrastructure.

## Project Mapping

| Layer | `backend/` | `ai_engine/` | `frontend/` |
|---|---|---|---|
| Domain | `domain/` | `domain/` | `features/*/types/` |
| Application | `application/use_cases/` | `application/` | `features/*/hooks/` |
| Interface Adapters | `api/v1/` (routers, schemas) | `processors/`, `agents/` | `features/*/components/` |
| Frameworks | FastAPI app, SQLAlchemy | DashScope, Whisper, VAD | Next.js app/, Tailwind |

## Rules

- Do not import FastAPI, SQLAlchemy, DashScope, or `next/*` into Domain or Application layers.
- Repository interfaces live in the Domain layer; implementations live in Infrastructure.
- Use cases receive dependencies via constructor injection — never instantiate infrastructure directly.
- Schemas/DTOs that cross layer boundaries are defined in the Interface Adapters layer.
- Cross-service calls (backend ↔ ai_engine) go through HTTP clients in the Infrastructure layer, never directly.

## Python Structure (backend/ and ai_engine/)

```
<module>/
  domain/
    entities.py        # Dataclasses / Pydantic BaseModel (no ORM)
    repositories.py    # Abstract base classes (ABC / Protocol)
    value_objects.py
  application/
    use_cases/
      <action>_use_case.py   # One file per use case
    services.py              # Domain services (stateless)
  infrastructure/
    repositories/
      <name>_repository.py   # Concrete repo implementations
    clients/
      <service>_client.py    # External API clients (DashScope, etc.)
  api/                       # FastAPI routers, request/response schemas
    v1/
      routers/
      schemas/
```

## TypeScript / Next.js (frontend/)

See `frontend-feature-layer.instructions.md` for the matching layer structure in the frontend.
