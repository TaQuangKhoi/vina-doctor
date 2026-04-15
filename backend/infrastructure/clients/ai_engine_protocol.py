from __future__ import annotations

from typing import Protocol

from backend.domain.entities import SOAPReport


class AiEngineClientProtocol(Protocol):
    """Port — high-level module depends on this abstraction, not on httpx."""

    async def process_consultation(
        self,
        audio_bytes: bytes,
        filename: str,
        model: str = "qwen3-asr-flash",
    ) -> SOAPReport: ...

    async def update_dashscope_key(self, api_key: str) -> None:
        """Push a new DashScope API key to ai_engine at runtime."""
        ...
