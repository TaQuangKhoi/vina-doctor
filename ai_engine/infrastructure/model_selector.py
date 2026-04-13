from __future__ import annotations

import os


class ModelSelector:
    """Selects the most appropriate LLM model for a given task type.

    Reads overrides from environment variables, falling back to sensible defaults.
    Implements ``ModelSelectorProtocol``.
    """

    _DEFAULTS: dict[str, str] = {
        "scribe": "qwen-audio-turbo",
        "clinical": "qwen-audio-turbo",
        "clinical_complex": "qwen-audio-max",
    }

    def select(self, task: str) -> str:
        env_key = f"VINA_MODEL_{task.upper()}"
        return os.environ.get(env_key) or self._DEFAULTS.get(task, "qwen-audio-turbo")
