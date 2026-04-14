from __future__ import annotations

import httpx

from backend.domain.entities import Medication, MultilingualText, SOAPReport


class HttpAiEngineClient:
    """Infrastructure implementation of AiEngineClientProtocol using httpx."""

    def __init__(self, base_url: str, timeout: float = 120.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout

    async def process_consultation(
        self,
        audio_bytes: bytes,
        filename: str,
        model: str = "qwen-audio-turbo",
    ) -> SOAPReport:
        url = f"{self._base_url}/v1/consultations/process"
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                url,
                files={"file": (filename, audio_bytes, "audio/mpeg")},
                params={"model": model},
            )
            response.raise_for_status()
            data = response.json()

        return _map_response_to_soap(data)


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
