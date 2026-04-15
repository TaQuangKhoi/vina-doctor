from __future__ import annotations

import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ai_engine.domain.config_repository import ConfigRepositoryProtocol


class ModelSelector:
    """Selects the most appropriate LLM model for a given task type.

    Priority (highest → lowest):
      1. Runtime override persisted in ``ConfigRepositoryProtocol`` (set via
         ``PATCH /v1/config/model`` — survives restarts).
      2. Environment variable ``VINA_MODEL_<TASK>`` (deployment-time config).
      3. Hard-coded default.

    Implements ``ModelSelectorProtocol``.
    """

    _DEFAULTS: dict[str, str] = {
        "asr": "qwen3-asr-flash",
        "scribe": "qwen3-asr-flash",
        "clinical": "qwen3.5-omni-flash",
        "clinical_complex": "qwen3.5-omni-flash",
    }

    def __init__(
        self,
        config_repo: "ConfigRepositoryProtocol | None" = None,
    ) -> None:
        self._config_repo = config_repo

    def select(self, task: str) -> str:
        # 1. Runtime override from persisted config
        if self._config_repo is not None:
            runtime = self._config_repo.get_model(task)
            if runtime:
                return runtime

        # 2. Environment variable override
        env_key = f"VINA_MODEL_{task.upper()}"
        env_val = os.environ.get(env_key)
        if env_val:
            return env_val

        # 3. Hard-coded default
        return self._DEFAULTS.get(task, "qwen3-asr-flash")
