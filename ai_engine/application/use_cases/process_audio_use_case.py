from __future__ import annotations

from pathlib import Path

from ai_engine.agents.extractor import MedicalExtractor
from ai_engine.agents.reporter import MedicalReporter, ReporterError
from ai_engine.domain.entities import MedicalReport
from ai_engine.infrastructure.vad.voice_activity_detector import (
    VADError,
    VoiceActivityDetector,
)
from ai_engine.processors.audio import AudioProcessingError, validate_and_convert


class ProcessAudioError(Exception):
    """Raised when the audio processing pipeline cannot complete."""


class ProcessAudioUseCase:
    """Orchestrates the full audio-to-report pipeline.

    Pipeline:
        1. VAD check — reject silent/empty files before hitting the paid API.
        2. Audio pre-processing — validate extension, convert to mp3.
        3. Medical extraction — call Qwen2-Audio with the master prompt.
        4. Report parsing — coerce raw JSON into a validated MedicalReport.

    All external dependencies are injected via the constructor (DIP).
    """

    def __init__(
        self,
        vad: VoiceActivityDetector,
        extractor: MedicalExtractor,
        reporter: MedicalReporter,
    ) -> None:
        self._vad = vad
        self._extractor = extractor
        self._reporter = reporter

    def execute(
        self,
        audio_path: Path,
        *,
        work_dir: Path,
        model: str | None = None,
    ) -> MedicalReport:
        """Run the full pipeline and return a structured MedicalReport.

        Args:
            audio_path: Path to the uploaded audio file (may be any supported format).
            work_dir:   Temporary directory for converted audio files.
            model:      Optional Qwen model override (e.g. "qwen-audio-max").

        Returns:
            A validated MedicalReport domain entity.

        Raises:
            ProcessAudioError: wraps VADError, AudioProcessingError, or ReporterError
                               with a user-friendly message.
        """
        # Step 1: Voice activity check.
        try:
            self._vad.check(audio_path)
        except VADError as exc:
            raise ProcessAudioError(str(exc)) from exc

        # Step 2: Pre-process / convert audio.
        try:
            ready_path = validate_and_convert(audio_path, work_dir)
        except AudioProcessingError as exc:
            raise ProcessAudioError(str(exc)) from exc

        # Step 3: LLM extraction.
        raw_response = self._extractor.extract(ready_path, model=model)

        # Step 4: Parse and validate JSON → domain entity.
        try:
            report = self._reporter.parse(raw_response)
        except ReporterError as exc:
            raise ProcessAudioError(str(exc)) from exc

        return report
