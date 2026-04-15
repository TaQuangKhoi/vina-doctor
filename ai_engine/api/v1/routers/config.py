from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator

from ai_engine.application.use_cases.update_api_key_use_case import UpdateApiKeyUseCase
from ai_engine.application.use_cases.update_dashscope_url_use_case import (
    UpdateDashscopeUrlUseCase,
)
from ai_engine.application.use_cases.update_model_use_case import UpdateModelUseCase

router = APIRouter(prefix="/v1/config", tags=["config"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class UpdateDashscopeApiKeyRequest(BaseModel):
    api_key: str

    @field_validator("api_key")
    @classmethod
    def must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("api_key must not be blank.")
        return v.strip()


class UpdateDashscopeUrlRequest(BaseModel):
    base_url: str

    @field_validator("base_url")
    @classmethod
    def must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("base_url must not be blank.")
        return v.strip()


class UpdateModelRequest(BaseModel):
    task: str
    model_id: str

    @field_validator("task", "model_id")
    @classmethod
    def must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field must not be blank.")
        return v.strip()


class ConfigResponse(BaseModel):
    dashscope_base_url: str
    models: dict[str, str]


# ---------------------------------------------------------------------------
# Dependency injection (deferred imports to avoid circular imports)
# ---------------------------------------------------------------------------


def _get_update_key_use_case() -> UpdateApiKeyUseCase:
    from ai_engine.main import get_update_api_key_use_case  # noqa: PLC0415

    return get_update_api_key_use_case()


def _get_update_url_use_case() -> UpdateDashscopeUrlUseCase:
    from ai_engine.main import get_update_dashscope_url_use_case  # noqa: PLC0415

    return get_update_dashscope_url_use_case()


def _get_update_model_use_case() -> UpdateModelUseCase:
    from ai_engine.main import get_update_model_use_case  # noqa: PLC0415

    return get_update_model_use_case()


def _get_config_repo():
    from ai_engine.main import get_config_repo  # noqa: PLC0415

    return get_config_repo()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.patch(
    "/dashscope-api-key",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Update the DashScope API key at runtime",
    description=(
        "Replaces the active DashScope API key in-process **and** persists it "
        "to a config file on the mounted volume so that the new key survives "
        "a container restart.  No restart required."
    ),
)
def update_dashscope_api_key(
    body: UpdateDashscopeApiKeyRequest,
    use_case: UpdateApiKeyUseCase = Depends(_get_update_key_use_case),
) -> None:
    try:
        use_case.execute(body.api_key)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.patch(
    "/dashscope-url",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Update the DashScope base HTTP API URL at runtime",
    description=(
        "Replaces the active DashScope base URL in-process **and** persists it. "
        "Use this to switch between the international endpoint "
        "(``https://dashscope-intl.aliyuncs.com/api/v1``) and the CN endpoint. "
        "No restart required."
    ),
)
def update_dashscope_url(
    body: UpdateDashscopeUrlRequest,
    use_case: UpdateDashscopeUrlUseCase = Depends(_get_update_url_use_case),
) -> None:
    try:
        use_case.execute(body.base_url)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.patch(
    "/model",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Override the model ID for a pipeline task at runtime",
    description=(
        "Persists a model override for the given task (``scribe``, ``clinical``, etc.). "
        "``ModelSelector`` will pick it up on the next request — no restart required. "
        "Valid tasks: ``asr``, ``scribe``, ``clinical``, ``clinical_complex``."
    ),
)
def update_model(
    body: UpdateModelRequest,
    use_case: UpdateModelUseCase = Depends(_get_update_model_use_case),
) -> None:
    try:
        use_case.execute(body.task, body.model_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=ConfigResponse,
    summary="Get current runtime configuration",
    description="Returns the active DashScope base URL and per-task model overrides.",
)
def get_config(
    config_repo=Depends(_get_config_repo),
) -> ConfigResponse:
    data = config_repo.get_all_config()
    return ConfigResponse(
        dashscope_base_url=data["dashscope_base_url"],
        models=data["models"],
    )
