from __future__ import annotations

import os


class ModelSelector:
    """Selects the most appropriate LLM model for a given task type.

    Reads overrides from environment variables, falling back to sensible defaults.
    Implements ``ModelSelectorProtocol``.
    """

    _DEFAULTS: dict[str, str] = {
        "asr": "qwen3-asr-flash",
        "scribe": "qwen3-asr-flash",
        "clinical": "qwen3.5-omni-flash",
        "clinical_complex": "qwen3.5-omni-flash",
    }

    def select(self, task: str) -> str:
        env_key = f"VINA_MODEL_{task.upper()}"
        return os.environ.get(env_key) or self._DEFAULTS.get(task, "qwen3-asr-flash")
