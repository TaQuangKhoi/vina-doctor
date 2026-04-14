from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from backend.core.config import get_settings
from backend.domain.errors import AccessDeniedError, DomainError, NotFoundError
from backend.infrastructure.db.models import Base
from backend.infrastructure.db.session import get_engine, init_db
from backend.api.v1.routers.auth import router as auth_router
from backend.api.v1.routers.consultations import router as consultations_router
from backend.api.v1.routers.reports import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    init_db(settings.database_url)

    # Create tables (safe for SQLite dev; use Alembic for production migrations)
    engine = await get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Vina Doctor — Backend",
        description=(
            "REST API for the Vina Doctor medical scribe platform. "
            "Handles auth, consultation management, and SOAP report retrieval."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    # ---------------------------------------------------------------------------
    # Domain error → HTTP error mapping (global exception handlers)
    # ---------------------------------------------------------------------------

    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc)},
        )

    @app.exception_handler(AccessDeniedError)
    async def access_denied_handler(request: Request, exc: AccessDeniedError):
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": str(exc)},
        )

    # ---------------------------------------------------------------------------
    # Routers
    # ---------------------------------------------------------------------------

    prefix = "/api/v1"
    app.include_router(auth_router, prefix=prefix)
    app.include_router(consultations_router, prefix=prefix)
    app.include_router(reports_router, prefix=prefix)

    return app


app = create_app()
