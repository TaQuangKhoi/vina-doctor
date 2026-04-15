from __future__ import annotations

from http import HTTPStatus
from pathlib import Path

import httpx
from dashscope.audio.qwen_asr import QwenTranscription
from dashscope.utils.oss_utils import OssUtils


class QwenAsrClientError(Exception):
    """Raised when the DashScope ASR API returns an error."""


class QwenAsrClient:
    """Client for Qwen3-ASR-Flash (and compatible ASR models).

    Unlike ``QwenAudioClient`` (which uses ``MultiModalConversation``),
    this client targets the dedicated ASR API via ``QwenTranscription``.

    Flow:
        1. Upload the local audio file to DashScope OSS to obtain a URL.
        2. Submit the URL to ``QwenTranscription.call()`` (synchronous —
           the SDK polls internally until the task completes).
        3. Fetch the transcription result from the returned URL.
        4. Concatenate all sentence texts and return as a single string.
    """

    DEFAULT_MODEL = "qwen3-asr-flash"

    def __init__(self, model: str = DEFAULT_MODEL) -> None:
        self._model = model

    def transcribe(self, audio_path: Path) -> str:
        """Transcribe *audio_path* and return the full transcript text.

        Args:
            audio_path: Path to a local audio file (mp3, wav, etc.).

        Returns:
            Plain-text transcript as a single string.

        Raises:
            QwenAsrClientError: on upload failure, API error, or empty result.
        """
        # Step 1: Upload local file to DashScope OSS.
        file_url = self._upload(audio_path)

        # Step 2: Submit ASR task and wait for completion (SDK polls internally).
        response = QwenTranscription.call(
            model=self._model,
            file_url=file_url,
        )

        if response.status_code != HTTPStatus.OK:
            raise QwenAsrClientError(
                f"DashScope ASR error {response.status_code}: "
                f"{getattr(response, 'code', 'unknown')} — "
                f"{getattr(response, 'message', 'no message')}"
            )

        # Step 3: The output contains a dict with task_status and results.
        # When status is SUCCEEDED, output.results[0].transcription_url points
        # to a JSON file containing sentences.
        output = response.output
        if output is None:
            raise QwenAsrClientError("ASR response has no output")

        # output is a TranscriptionOutput dataclass — access as dict for safety.
        output_dict = dict(output) if not isinstance(output, dict) else output
        task_status = output_dict.get("task_status", "")

        if task_status != "SUCCEEDED":
            raise QwenAsrClientError(
                f"ASR task ended with status '{task_status}': "
                f"{output_dict.get('message', 'no message')}"
            )

        results = output_dict.get("results", [])
        if not results:
            raise QwenAsrClientError("ASR response has no results")

        transcription_url = results[0].get("transcription_url", "")
        if not transcription_url:
            raise QwenAsrClientError("ASR result has no transcription_url")

        # Step 4: Fetch the transcription JSON from the result URL.
        return self._fetch_transcript(transcription_url)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _upload(audio_path: Path) -> str:
        """Upload *audio_path* to DashScope OSS and return the public URL."""
        try:
            file_url, _ = OssUtils.upload(
                model=QwenAsrClient.DEFAULT_MODEL,
                file_path=str(audio_path),
            )
        except Exception as exc:
            raise QwenAsrClientError(
                f"Failed to upload audio to DashScope OSS: {exc}"
            ) from exc

        if not file_url:
            raise QwenAsrClientError("OSS upload returned an empty URL")

        return file_url

    @staticmethod
    def _fetch_transcript(url: str) -> str:
        """Download the transcription result JSON and extract sentence text.

        The result JSON has the structure::

            {
              "transcripts": [
                {
                  "channel_id": 0,
                  "sentences": [
                    {"text": "Hello doctor.", "begin_time": 0, "end_time": 1200},
                    ...
                  ]
                }
              ]
            }

        Returns all sentence texts concatenated with a space.
        """
        try:
            resp = httpx.get(url, timeout=30.0)
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            raise QwenAsrClientError(
                f"Failed to fetch transcription result from '{url}': {exc}"
            ) from exc

        texts: list[str] = []
        for channel in data.get("transcripts", []):
            for sentence in channel.get("sentences", []):
                text = sentence.get("text", "").strip()
                if text:
                    texts.append(text)

        if not texts:
            raise QwenAsrClientError("Transcription result contained no sentence text")

        return " ".join(texts)
