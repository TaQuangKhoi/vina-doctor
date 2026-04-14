from __future__ import annotations

from typing import Protocol
from uuid import UUID


class AudioStorageProtocol(Protocol):
    """Port for audio file persistence; swap local ↔ S3 without touching callers."""

    async def save(
        self, consultation_id: UUID, audio_bytes: bytes, filename: str
    ) -> str:
        """Persist audio and return a stable path/key string."""
        ...

    async def read(self, path: str) -> bytes:
        """Read audio bytes from the given path/key."""
        ...
