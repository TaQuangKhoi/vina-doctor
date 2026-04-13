from __future__ import annotations

from pathlib import Path
from typing import Protocol

from ai_engine.domain.entities import ClinicalResult, PipelineState, ScribeResult


class ScribeAgentProtocol(Protocol):
    """Transcribes audio into a structured transcript with speaker diarization."""

    def transcribe(self, audio_path: Path, model: str | None = None) -> ScribeResult: ...


class ClinicalAgentProtocol(Protocol):
    """Analyses a cleaned transcript and produces a structured clinical report."""

    def analyze(self, transcript_text: str, model: str | None = None) -> ClinicalResult: ...


class ModelSelectorProtocol(Protocol):
    """Selects the most appropriate LLM model for a given task type."""

    def select(self, task: str) -> str: ...


class PipelineStateTrackerProtocol(Protocol):
    """Tracks the state of a consultation processing pipeline."""

    def update(self, session_id: str, state: PipelineState) -> None: ...

    def get(self, session_id: str) -> PipelineState: ...


class TextCleanerProtocol(Protocol):
    """Redacts PII and normalises text before it reaches external LLMs."""

    def clean(self, text: str) -> str: ...
