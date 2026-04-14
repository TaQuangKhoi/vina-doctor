from __future__ import annotations

from pathlib import Path
from uuid import UUID

import aiofiles


class LocalAudioStorage:
    """Stores audio files on the local filesystem under a configurable root."""

    def __init__(self, root: str | Path) -> None:
        self._root = Path(root)
        self._root.mkdir(parents=True, exist_ok=True)

    async def save(self, consultation_id: UUID, audio_bytes: bytes, filename: str) -> str:
        suffix = Path(filename).suffix or ".mp3"
        dest = self._root / f"{consultation_id}{suffix}"
        async with aiofiles.open(dest, "wb") as f:
            await f.write(audio_bytes)
        return str(dest)

    async def read(self, path: str) -> bytes:
        async with aiofiles.open(path, "rb") as f:
            return await f.read()
