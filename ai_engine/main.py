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
from ai_engine.api.v1.routers.consultations import router as consultations_router
from ai_engine.infrastructure.clients.qwen_audio_client import QwenAudioClient
from ai_engine.infrastructure.model_selector import ModelSelector
from ai_engine.infrastructure.state_tracker import InMemoryPipelineStateTracker
from ai_engine.infrastructure.vad.voice_activity_detector import VoiceActivityDetector
from ai_engine.processors.text_cleaner import TextCleanerService

# ---------------------------------------------------------------------------
# DI container (module-level singletons assembled at startup)
# ---------------------------------------------------------------------------
_use_case: ProcessAudioUseCase | None = None
_consultation_use_case: ProcessConsultationUseCase | None = None


def get_process_audio_use_case() -> ProcessAudioUseCase:
    """Return the singleton ProcessAudioUseCase; raises if not yet initialised."""
    if _use_case is None:
        raise RuntimeError("Application has not been initialised. Call create_app() first.")
    return _use_case


def get_process_consultation_use_case() -> ProcessConsultationUseCase:
    """Return the singleton ProcessConsultationUseCase; raises if not yet initialised."""
    if _consultation_use_case is None:
        raise RuntimeError("Application has not been initialised. Call create_app() first.")
    return _consultation_use_case


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Wire dependencies on startup; nothing to tear down for MVP."""
    global _use_case, _consultation_use_case  # noqa: PLW0603

    load_dotenv()

    api_key = os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "DASHSCOPE_API_KEY environment variable is not set. "
            "Copy .env.example to .env and fill in your key."
        )
    dashscope.api_key = api_key

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
        scribe=ScribeAgent(client=QwenAudioClient()),
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

    return app


app = create_app()

