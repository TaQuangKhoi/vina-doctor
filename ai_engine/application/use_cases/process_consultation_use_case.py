from __future__ import annotations

import uuid
from pathlib import Path

from ai_engine.agents.clinical_agent import ClinicalAgentError
from ai_engine.agents.scribe_agent import ScribeAgentError
from ai_engine.domain.entities import (
    ConsultationMetadata,
    MedicalReport,
    PipelineState,
)
from ai_engine.domain.protocols import (
    ClinicalAgentProtocol,
    ModelSelectorProtocol,
    PipelineStateTrackerProtocol,
    ScribeAgentProtocol,
    TextCleanerProtocol,
)
from ai_engine.domain.value_objects import PipelineMode, PipelineStatus
from ai_engine.infrastructure.vad.voice_activity_detector import (
    VADError,
    VoiceActivityDetector,
)
from ai_engine.processors.audio import AudioProcessingError, validate_and_convert


class ProcessConsultationError(Exception):
    """Raised when the consultation processing pipeline cannot complete."""


class ProcessConsultationUseCase:
    """Orchestrates the two-step (Scribe → Clinical) consultation pipeline.

    Supports two modes via ``PipelineMode``:
    - **UNIFIED**: delegates to the legacy single-call approach (Qwen does
      transcription + SOAP in one shot).
    - **TWO_STEP**: runs the Scribe Agent first (audio → transcript), cleans
      the text, then passes it to the Clinical Agent (transcript → report).

    All external dependencies are injected via the constructor (DIP).
    """

    def __init__(
        self,
        *,
        vad: VoiceActivityDetector,
        scribe: ScribeAgentProtocol,
        clinical: ClinicalAgentProtocol,
        text_cleaner: TextCleanerProtocol,
        model_selector: ModelSelectorProtocol,
        state_tracker: PipelineStateTrackerProtocol,
        # Optional: unified-mode dependencies (lazy import avoids circular dep)
        unified_use_case: object | None = None,
    ) -> None:
        self._vad = vad
        self._scribe = scribe
        self._clinical = clinical
        self._text_cleaner = text_cleaner
        self._model_selector = model_selector
        self._state_tracker = state_tracker
        self._unified_use_case = unified_use_case

    def execute(
        self,
        audio_path: Path,
        *,
        work_dir: Path,
        mode: PipelineMode = PipelineMode.TWO_STEP,
        model: str | None = None,
    ) -> MedicalReport:
        session_id = uuid.uuid4().hex

        if mode == PipelineMode.UNIFIED:
            return self._run_unified(audio_path, work_dir=work_dir, model=model)

        return self._run_two_step(
            audio_path,
            work_dir=work_dir,
            model=model,
            session_id=session_id,
        )

    # ------------------------------------------------------------------
    # Unified mode — delegate to existing single-pipeline
    # ------------------------------------------------------------------

    def _run_unified(
        self,
        audio_path: Path,
        *,
        work_dir: Path,
        model: str | None,
    ) -> MedicalReport:
        if self._unified_use_case is None:
            raise ProcessConsultationError(
                "Unified mode requested but no unified use case was provided."
            )
        from ai_engine.application.use_cases.process_audio_use_case import (  # noqa: PLC0415
            ProcessAudioError,
            ProcessAudioUseCase,
        )

        if not isinstance(self._unified_use_case, ProcessAudioUseCase):
            raise ProcessConsultationError("Invalid unified use case type.")

        try:
            return self._unified_use_case.execute(
                audio_path, work_dir=work_dir, model=model
            )
        except ProcessAudioError as exc:
            raise ProcessConsultationError(str(exc)) from exc

    # ------------------------------------------------------------------
    # Two-step mode — Scribe → Clean → Clinical
    # ------------------------------------------------------------------

    def _run_two_step(
        self,
        audio_path: Path,
        *,
        work_dir: Path,
        model: str | None,
        session_id: str,
    ) -> MedicalReport:
        # Step 1: VAD check
        self._update_state(session_id, PipelineStatus.PENDING, "vad_check")
        try:
            self._vad.check(audio_path)
        except VADError as exc:
            self._fail(session_id, str(exc))
            raise ProcessConsultationError(str(exc)) from exc

        # Step 2: Audio pre-processing
        try:
            ready_path = validate_and_convert(audio_path, work_dir)
        except AudioProcessingError as exc:
            self._fail(session_id, str(exc))
            raise ProcessConsultationError(str(exc)) from exc

        # Step 3: Scribe Agent — audio → transcript
        self._update_state(session_id, PipelineStatus.TRANSCRIBING, "scribe_agent")
        scribe_model = model or self._model_selector.select("scribe")
        try:
            scribe_result = self._scribe.transcribe(ready_path, model=scribe_model)
        except ScribeAgentError as exc:
            self._fail(session_id, str(exc))
            raise ProcessConsultationError(
                f"Scribe agent failed: {exc}"
            ) from exc

        # Step 4: Text cleaning — PII redaction
        self._update_state(session_id, PipelineStatus.CLEANING, "text_cleaner")
        transcript_text = "\n".join(
            f"{turn.speaker}: {turn.text}" for turn in scribe_result.transcript
        )
        cleaned_text = self._text_cleaner.clean(transcript_text)

        # Step 5: Clinical Agent — transcript → report
        self._update_state(session_id, PipelineStatus.ANALYZING, "clinical_agent")
        clinical_model = model or self._model_selector.select("clinical")
        try:
            clinical_result = self._clinical.analyze(cleaned_text, model=clinical_model)
        except ClinicalAgentError as exc:
            self._fail(session_id, str(exc))
            raise ProcessConsultationError(
                f"Clinical agent failed: {exc}"
            ) from exc

        # Step 6: Merge results into MedicalReport
        self._update_state(session_id, PipelineStatus.COMPLETED, "done")

        detected = scribe_result.session_info.detected_languages
        primary_lang = detected[0] if detected else "unknown"

        return MedicalReport(
            metadata=ConsultationMetadata(
                primary_language=primary_lang,
                session_id=session_id,
                model=f"scribe={scribe_model}, clinical={clinical_model}",
            ),
            transcript=scribe_result.transcript,
            clinical_report=clinical_result.clinical_report,
            multilingual_summary=clinical_result.multilingual_summary,
        )

    # ------------------------------------------------------------------
    # State helpers
    # ------------------------------------------------------------------

    def _update_state(
        self,
        session_id: str,
        status: PipelineStatus,
        step: str,
    ) -> None:
        self._state_tracker.update(
            session_id,
            PipelineState(status=status, current_step=step),
        )

    def _fail(self, session_id: str, error: str) -> None:
        self._state_tracker.update(
            session_id,
            PipelineState(
                status=PipelineStatus.FAILED,
                current_step="error",
                error=error,
            ),
        )
