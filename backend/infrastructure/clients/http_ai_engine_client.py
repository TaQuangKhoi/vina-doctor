from __future__ import annotations

import httpx

from backend.domain.entities import (
    Medication,
    MultilingualText,
    SOAPReport,
    TranscriptTurn,
)
from backend.infrastructure.clients.ai_engine_protocol import AiEngineConfigData


class HttpAiEngineClient:
    """Infrastructure implementation of AiEngineClientProtocol using httpx."""

    def __init__(self, base_url: str, timeout: float = 120.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout

    async def process_consultation(
        self,
        audio_bytes: bytes,
        filename: str,
        model: str | None = None,
    ) -> tuple[SOAPReport, list[TranscriptTurn]]:
        url = f"{self._base_url}/v1/consultations/process"
        params = {"model": model} if model else {}
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                url,
                files={"file": (filename, audio_bytes, "audio/mpeg")},
                params=params,
            )
            response.raise_for_status()
            data = response.json()

        soap = _map_response_to_soap(data)
        transcript = _map_response_to_transcript(data)
        return soap, transcript

    async def update_dashscope_key(self, api_key: str) -> None:
        """Forward a new DashScope API key to ai_engine via PATCH /v1/config/dashscope-api-key."""
        url = f"{self._base_url}/v1/config/dashscope-api-key"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.patch(url, json={"api_key": api_key})
            response.raise_for_status()

    async def update_dashscope_url(self, base_url: str) -> None:
        """Forward a new DashScope base URL to ai_engine via PATCH /v1/config/dashscope-url."""
        url = f"{self._base_url}/v1/config/dashscope-url"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.patch(url, json={"base_url": base_url})
            response.raise_for_status()

    async def update_model(self, task: str, model_id: str) -> None:
        """Forward a per-task model override to ai_engine via PATCH /v1/config/model."""
        url = f"{self._base_url}/v1/config/model"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.patch(
                url, json={"task": task, "model_id": model_id}
            )
            response.raise_for_status()

    async def update_icd10_enrich(self, enabled: bool) -> None:
        """Forward the ICD-10 enrich toggle to ai_engine via PATCH /v1/config/icd10-enrich."""
        url = f"{self._base_url}/v1/config/icd10-enrich"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.patch(url, json={"enabled": enabled})
            response.raise_for_status()

    async def get_config(self) -> AiEngineConfigData:
        """Fetch current runtime config from ai_engine via GET /v1/config."""
        url = f"{self._base_url}/v1/config"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
        return AiEngineConfigData(
            dashscope_base_url=data.get("dashscope_base_url", ""),
            models=data.get("models", {}),
            icd10_enrich_enabled=bool(data.get("icd10_enrich_enabled", False)),
        )


def _map_response_to_soap(data: dict) -> SOAPReport:
    report = data.get("clinical_report", {})
    soap = report.get("soap_notes", {})
    data.get("multilingual_summary", {})

    def _ml(field: dict | None) -> MultilingualText:
        if not field:
            return MultilingualText()
        return MultilingualText(
            vn=field.get("vn", ""),
            en=field.get("en", ""),
            fr=field.get("fr", ""),
            ar=field.get("ar", ""),
        )

    medications = [
        Medication(
            name=m.get("name", ""),
            dosage=m.get("dosage", ""),
            frequency=m.get("frequency") or "",
            duration="",
        )
        for m in report.get("medications", [])
    ]

    return SOAPReport(
        subjective=_ml(soap.get("subjective")),
        objective=_ml(soap.get("objective")),
        assessment=_ml(soap.get("assessment")),
        plan=_ml(soap.get("plan")),
        icd10_codes=report.get("icd10_codes", []),
        medications=medications,
        severity=str(report.get("severity_flag", "")),
    )


def _map_response_to_transcript(data: dict) -> list[TranscriptTurn]:
    """Extract transcript turns from the AI engine response.

    The AI engine returns a list of {speaker, timestamp, text} objects.
    Returns an empty list if the key is absent or the value is not a list.
    """
    raw_turns = data.get("transcript") or []
    if not isinstance(raw_turns, list):
        return []
    turns: list[TranscriptTurn] = []
    for turn in raw_turns:
        if not isinstance(turn, dict):
            continue
        text = turn.get("text", "").strip()
        if not text:
            continue
        turns.append(
            TranscriptTurn(
                speaker=str(turn.get("speaker", "Unknown")),
                timestamp=turn.get("timestamp") or None,
                text=text,
            )
        )
    return turns
