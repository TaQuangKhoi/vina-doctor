from __future__ import annotations

from dashscope import MultiModalConversation


class QwenAudioClientError(Exception):
    """Raised when the DashScope API returns a non-200 status."""


class QwenAudioClient:
    """Low-level wrapper around DashScope MultiModalConversation.

    Depends on the DASHSCOPE_API_KEY being set on `dashscope.api_key`
    before instantiation (handled by the app factory in main.py).
    """

    DEFAULT_MODEL = "qwen-audio-turbo"

    def __init__(self, model: str = DEFAULT_MODEL) -> None:
        self._model = model

    def call(self, messages: list[dict]) -> str:
        """Send *messages* to the Qwen audio model and return the response text.

        Args:
            messages: DashScope-formatted message list (system + user turns).

        Returns:
            Raw response text from the model (expected to be a JSON string).

        Raises:
            QwenAudioClientError: if the API returns a non-200 status code.
        """
        response = MultiModalConversation.call(
            model=self._model,
            messages=messages,
        )

        if response.status_code != 200:
            raise QwenAudioClientError(
                f"DashScope API error {response.status_code}: "
                f"{getattr(response, 'code', 'unknown')} — "
                f"{getattr(response, 'message', 'no message')}"
            )

        content = response.output.choices[0].message.content
        # Content may be a list of dicts [{"text": "..."}] or a plain string.
        if isinstance(content, list):
            return " ".join(
                part.get("text", "") for part in content if isinstance(part, dict)
            )
        return str(content)
