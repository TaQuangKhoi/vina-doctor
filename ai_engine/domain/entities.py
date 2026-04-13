from __future__ import annotations

from typing import Optional
from pydantic import BaseModel

from ai_engine.domain.value_objects import SeverityFlag


class TranscriptTurn(BaseModel):
    speaker: str
    timestamp: Optional[str] = None
    text: str


class MultilingualText(BaseModel):
    en: str = "Not discussed"
    vn: str = "Not discussed"
    fr: str = "Not discussed"
    ar: str = "Not discussed"


class SOAPNotes(BaseModel):
    subjective: MultilingualText = MultilingualText()
    objective: MultilingualText = MultilingualText()
    assessment: MultilingualText = MultilingualText()
    plan: MultilingualText = MultilingualText()


class MultilingualInstruction(BaseModel):
    en: str = "Not discussed"
    vn: str = "Not discussed"


class Medication(BaseModel):
    name: str
    dosage: str
    frequency: Optional[str] = None
    route: Optional[str] = None
    instructions: MultilingualInstruction = MultilingualInstruction()


class NextSteps(BaseModel):
    en: str = "Not discussed"
    vn: str = "Not discussed"


class ClinicalReport(BaseModel):
    chief_complaint: MultilingualText = MultilingualText()
    soap_notes: SOAPNotes = SOAPNotes()
    medications: list[Medication] = []
    icd10_codes: list[str] = []
    severity_flag: SeverityFlag = SeverityFlag.LOW
    next_steps: NextSteps = NextSteps()


class ConsultationMetadata(BaseModel):
    primary_language: str = "unknown"
    consultation_duration_estimate: Optional[str] = None
    session_id: Optional[str] = None
    model: Optional[str] = None


class MedicalReport(BaseModel):
    metadata: ConsultationMetadata = ConsultationMetadata()
    transcript: list[TranscriptTurn] = []
    clinical_report: ClinicalReport = ClinicalReport()
    multilingual_summary: MultilingualText = MultilingualText()
