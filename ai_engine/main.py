from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import dashscope
from fastapi import FastAPI
from dotenv import load_dotenv

from ai_engine.agents.clinical_agent import ClinicalAgent
from ai_engine.agents.extractor import MedicalExtractor
from ai_engine.agents.icd10_selector_agent import ICD10SelectorAgent
from ai_engine.agents.reporter import MedicalReporter
from ai_engine.agents.scribe_agent import ScribeAgent
from ai_engine.application.use_cases.process_audio_use_case import ProcessAudioUseCase
from ai_engine.application.use_cases.process_consultation_use_case import (
    ProcessConsultationUseCase,
)
from ai_engine.application.use_cases.update_api_key_use_case import UpdateApiKeyUseCase
from ai_engine.application.use_cases.update_dashscope_url_use_case import (
    UpdateDashscopeUrlUseCase,
)
from ai_engine.application.use_cases.update_icd10_enrich_use_case import (
    UpdateICD10EnrichUseCase,
)
from ai_engine.application.use_cases.update_model_use_case import UpdateModelUseCase
from ai_engine.api.v1.routers.consultations import router as consultations_router
from ai_engine.api.v1.routers.config import router as config_router
from ai_engine.infrastructure.clients.qwen_asr_client import QwenAsrClient
from ai_engine.infrastructure.clients.qwen_audio_client import QwenAudioClient
from ai_engine.infrastructure.config.file_config_repository import (
    DEFAULT_DASHSCOPE_URL,
    FileConfigRepository,
)
from ai_engine.infrastructure.medical.icd10_repository import ICD10Repository
from ai_engine.infrastructure.model_selector import ModelSelector
from ai_engine.infrastructure.state_tracker import InMemoryPipelineStateTracker
from ai_engine.infrastructure.vad.voice_activity_detector import VoiceActivityDetector
from ai_engine.processors.text_cleaner import TextCleanerService

# ---------------------------------------------------------------------------
# DI container (module-level singletons assembled at startup)
# ---------------------------------------------------------------------------
_use_case: ProcessAudioUseCase | None = None
_consultation_use_case: ProcessConsultationUseCase | None = None
_update_api_key_use_case: UpdateApiKeyUseCase | None = None
_update_dashscope_url_use_case: UpdateDashscopeUrlUseCase | None = None
_update_model_use_case: UpdateModelUseCase | None = None
_update_icd10_enrich_use_case: UpdateICD10EnrichUseCase | None = None
_config_repo: FileConfigRepository | None = None


def get_process_audio_use_case() -> ProcessAudioUseCase:
    """Return the singleton ProcessAudioUseCase; raises if not yet initialised."""
    if _use_case is None:
        raise RuntimeError(
            "Application has not been initialised. Call create_app() first."
        )
    return _use_case


def get_process_consultation_use_case() -> ProcessConsultationUseCase:
    """Return the singleton ProcessConsultationUseCase; raises if not yet initialised."""
    if _consultation_use_case is None:
        raise RuntimeError(
            "Application has not been initialised. Call create_app() first."
        )
    return _consultation_use_case


def get_update_api_key_use_case() -> UpdateApiKeyUseCase:
    """Return the singleton UpdateApiKeyUseCase; raises if not yet initialised."""
    if _update_api_key_use_case is None:
        raise RuntimeError(
            "Application has not been initialised. Call create_app() first."
        )
    return _update_api_key_use_case


def get_update_dashscope_url_use_case() -> UpdateDashscopeUrlUseCase:
    """Return the singleton UpdateDashscopeUrlUseCase; raises if not yet initialised."""
    if _update_dashscope_url_use_case is None:
        raise RuntimeError(
            "Application has not been initialised. Call create_app() first."
        )
    return _update_dashscope_url_use_case


def get_update_model_use_case() -> UpdateModelUseCase:
    """Return the singleton UpdateModelUseCase; raises if not yet initialised."""
    if _update_model_use_case is None:
        raise RuntimeError(
            "Application has not been initialised. Call create_app() first."
        )
    return _update_model_use_case


def get_update_icd10_enrich_use_case() -> UpdateICD10EnrichUseCase:
    """Return the singleton UpdateICD10EnrichUseCase; raises if not yet initialised."""
    if _update_icd10_enrich_use_case is None:
        raise RuntimeError(
            "Application has not been initialised. Call create_app() first."
        )
    return _update_icd10_enrich_use_case


def get_config_repo() -> FileConfigRepository:
    """Return the singleton FileConfigRepository; raises if not yet initialised."""
    if _config_repo is None:
        raise RuntimeError(
            "Application has not been initialised. Call create_app() first."
        )
    return _config_repo


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Wire dependencies on startup; nothing to tear down for MVP."""
    global _use_case, _consultation_use_case, _update_api_key_use_case  # noqa: PLW0603
    global _update_dashscope_url_use_case, _update_model_use_case, _config_repo  # noqa: PLW0603
    global _update_icd10_enrich_use_case  # noqa: PLW0603

    load_dotenv()

    # ------------------------------------------------------------------
    # Bootstrap config repository (shared across all use cases).
    # ------------------------------------------------------------------
    config_repo = FileConfigRepository()
    _config_repo = config_repo

    # ------------------------------------------------------------------
    # Resolve the DashScope API key.
    # Priority: 1) persisted runtime file  2) DASHSCOPE_API_KEY env var
    # ------------------------------------------------------------------
    api_key = config_repo.get_dashscope_key() or os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "DASHSCOPE_API_KEY is not set. "
            "Either set the environment variable or call "
            "PATCH /v1/config/dashscope-api-key after startup."
        )
    dashscope.api_key = api_key

    # ------------------------------------------------------------------
    # Resolve the DashScope base URL.
    # Priority: 1) persisted runtime file  2) DEFAULT_DASHSCOPE_URL
    # ------------------------------------------------------------------
    base_url = config_repo.get_dashscope_url() or DEFAULT_DASHSCOPE_URL
    dashscope.base_http_api_url = base_url

    # ------------------------------------------------------------------
    # Runtime config use cases — apply_* closures mutate dashscope module
    # globals so use cases stay infra-free.
    # ------------------------------------------------------------------
    _update_api_key_use_case = UpdateApiKeyUseCase(
        config_repo=config_repo,
        apply_key=lambda k: setattr(dashscope, "api_key", k),
    )
    _update_dashscope_url_use_case = UpdateDashscopeUrlUseCase(
        config_repo=config_repo,
        apply_url=lambda u: setattr(dashscope, "base_http_api_url", u),
    )
    _update_model_use_case = UpdateModelUseCase(config_repo=config_repo)

    # ------------------------------------------------------------------
    # ICD-10 enrichment use case — toggle via PATCH /v1/config/icd10-enrich
    # Seed from env var VINA_ICD10_ENRICH_ENABLED if no persisted value yet.
    # ------------------------------------------------------------------
    _update_icd10_enrich_use_case = UpdateICD10EnrichUseCase(config_repo=config_repo)
    if not config_repo.get_icd10_enrich_enabled():
        env_flag = os.environ.get("VINA_ICD10_ENRICH_ENABLED", "false").lower()
        if env_flag == "true":
            config_repo.set_icd10_enrich_enabled(True)

    # ------------------------------------------------------------------
    # ICD-10 repository — always initialised (lightweight, no API calls)
    # The selector agent is only invoked when the toggle is enabled.
    # Path resolution: the file lives at ai_engine/data/icd10_treatment.json
    # so in Docker (/app/ai_engine/data/) and in local dev it resolves via
    # __file__ relative to the package root.
    # ------------------------------------------------------------------
    _icd10_base = Path(
        os.environ.get(
            "VINA_ICD10_DATA_PATH",
            "/app/ai_engine/data/icd10_treatment.json",
        )
    )
    if not _icd10_base.exists():
        # Local dev fallback: relative to this file (ai_engine/main.py)
        _icd10_base = Path(__file__).parent / "data" / "icd10_treatment.json"

    icd10_repository = ICD10Repository(_icd10_base)
    icd10_selector = ICD10SelectorAgent(
        client=QwenAudioClient(),
        repository=icd10_repository,
    )

    # Shared infrastructure — ModelSelector now reads runtime overrides first
    client = QwenAudioClient()
    vad = VoiceActivityDetector()
    model_selector = ModelSelector(config_repo=config_repo)

    # Legacy single-pipeline use case (backward compat)
    _use_case = ProcessAudioUseCase(
        vad=vad,
        extractor=MedicalExtractor(client),
        reporter=MedicalReporter(),
    )

    # Multi-agent pipeline use case
    _consultation_use_case = ProcessConsultationUseCase(
        vad=vad,
        scribe=ScribeAgent(client=QwenAudioClient(), asr_client=QwenAsrClient()),
        clinical=ClinicalAgent(client=QwenAudioClient()),
        text_cleaner=TextCleanerService(),
        model_selector=model_selector,
        state_tracker=InMemoryPipelineStateTracker(),
        unified_use_case=_use_case,
        icd10_selector=icd10_selector,
        config_repo=config_repo,
    )

    yield
    # Nothing to clean up for MVP.


def create_app() -> FastAPI:
    app = FastAPI(
        title="Vina Doctor — AI Engine",
        description=(
            "Medical consultation audio processing service. "
            "Accepts audio uploads and returns multilingual SOAP reports via Qwen2-Audio."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    app.include_router(consultations_router)
    app.include_router(config_router)

    return app


app = create_app()
