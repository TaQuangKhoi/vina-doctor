from __future__ import annotations

import json
import re
from pathlib import Path

from ai_engine.agents.scribe_prompts import SCRIBE_SYSTEM_PROMPT, SCRIBE_USER_PROMPT
from ai_engine.domain.entities import ScribeResult, SessionInfo, TranscriptTurn
from ai_engine.infrastructure.clients.qwen_audio_client import QwenAudioClient

_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


class ScribeAgentError(Exception):
    """Raised when the Scribe Agent cannot produce a valid ScribeResult."""


class ScribeAgent:
    """Transcribes audio into a structured transcript with speaker diarization.

    Uses the Qwen2-Audio multimodal model with a specialised scribe prompt.
    Implements ``ScribeAgentProtocol``.
    """

    def __init__(self, client: QwenAudioClient) -> None:
        self._client = client

    def transcribe(self, audio_path: Path, model: str | None = None) -> ScribeResult:
        if model is not None:
            self._client._model = model  # noqa: SLF001

        messages = [
            {
                "role": "system",
                "content": [{"text": SCRIBE_SYSTEM_PROMPT}],
            },
            {
                "role": "user",
                "content": [
                    {"audio": str(audio_path)},
                    {"text": SCRIBE_USER_PROMPT},
                ],
            },
        ]

        raw = self._client.call(messages)
        return self._parse(raw)

    def _parse(self, raw_response: str) -> ScribeResult:
        cleaned = _CODE_FENCE_RE.sub("", raw_response).strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise ScribeAgentError(
                f"Scribe model returned non-JSON response: {exc}\n\nRaw: {raw_response[:500]}"
            ) from exc

        info_raw = data.get("session_info", {})
        session_info = SessionInfo(
            detected_languages=info_raw.get("detected_languages", []),
            audio_quality=info_raw.get("audio_quality", "unknown"),
        )

        transcript = [
            TranscriptTurn(
                speaker=t.get("speaker", "Unknown"),
                timestamp=t.get("timestamp"),
                text=t.get("text", ""),
            )
            for t in data.get("transcript", [])
        ]

        return ScribeResult(session_info=session_info, transcript=transcript)
