from __future__ import annotations

from typing import Protocol

from backend.domain.entities import SOAPReport, TranscriptTurn


class AiEngineConfigData:
    """Value object — current runtime config returned by ai_engine GET /v1/config."""

    def __init__(
        self,
        dashscope_base_url: str,
        models: dict[str, str],
        icd10_enrich_enabled: bool = False,
    ) -> None:
        self.dashscope_base_url = dashscope_base_url
        self.models = models
        self.icd10_enrich_enabled = icd10_enrich_enabled


class AiEngineClientProtocol(Protocol):
    """Port — high-level module depends on this abstraction, not on httpx."""

    async def process_consultation(
        self,
        audio_bytes: bytes,
        filename: str,
        model: str = "qwen3-asr-flash",
    ) -> tuple[SOAPReport, list[TranscriptTurn]]: ...

    async def update_dashscope_key(self, api_key: str) -> None:
        """Push a new DashScope API key to ai_engine at runtime."""
        ...

    async def update_dashscope_url(self, base_url: str) -> None:
        """Push a new DashScope base HTTP API URL to ai_engine at runtime."""
        ...

    async def update_model(self, task: str, model_id: str) -> None:
        """Push a per-task model override to ai_engine at runtime."""
        ...

    async def update_icd10_enrich(self, enabled: bool) -> None:
        """Toggle ICD-10 context injection in ai_engine at runtime."""
        ...

    async def get_config(self) -> AiEngineConfigData:
        """Fetch current runtime configuration from ai_engine."""
        ...
