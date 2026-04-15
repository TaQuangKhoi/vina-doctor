from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import dashscope
from fastapi import FastAPI
from dotenv import load_dotenv

from ai_engine.agents.clinical_agent import ClinicalAgent
from ai_engine.agents.extractor import MedicalExtractor
from ai_engine.agents.reporter import MedicalReporter
from ai_engine.agents.scribe_agent import ScribeAgent
from ai_engine.application.use_cases.process_audio_use_case import ProcessAudioUseCase
from ai_engine.application.use_cases.process_consultation_use_case import (
    ProcessConsultationUseCase,
)
from ai_engine.application.use_cases.update_api_key_use_case import UpdateApiKeyUseCase
from ai_engine.api.v1.routers.consultations import router as consultations_router
from ai_engine.api.v1.routers.config import router as config_router
from ai_engine.infrastructure.clients.qwen_asr_client import QwenAsrClient
from ai_engine.infrastructure.clients.qwen_audio_client import QwenAudioClient
from ai_engine.infrastructure.config.file_config_repository import FileConfigRepository
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


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Wire dependencies on startup; nothing to tear down for MVP."""
    global _use_case, _consultation_use_case, _update_api_key_use_case  # noqa: PLW0603

    load_dotenv()

    # ------------------------------------------------------------------
    # Resolve the DashScope API key.
    # Priority: 1) persisted runtime file  2) DASHSCOPE_API_KEY env var
    # ------------------------------------------------------------------
    config_repo = FileConfigRepository()
    api_key = config_repo.get_dashscope_key() or os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "DASHSCOPE_API_KEY is not set. "
            "Either set the environment variable or call "
            "PATCH /v1/config/dashscope-api-key after startup."
        )
    dashscope.api_key = api_key
    dashscope.base_http_api_url = "https://dashscope-intl.aliyuncs.com/api/v1"

    # ------------------------------------------------------------------
    # Runtime config use case — apply_key is a closure that mutates the
    # dashscope module global so UpdateApiKeyUseCase stays infra-free.
    # ------------------------------------------------------------------
    _update_api_key_use_case = UpdateApiKeyUseCase(
        config_repo=config_repo,
        apply_key=lambda k: setattr(dashscope, "api_key", k),
    )

    # Shared infrastructure
    client = QwenAudioClient()
    vad = VoiceActivityDetector()

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
        model_selector=ModelSelector(),
        state_tracker=InMemoryPipelineStateTracker(),
        unified_use_case=_use_case,
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
