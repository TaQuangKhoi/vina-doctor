from __future__ import annotations

from ai_engine.domain.config_repository import ConfigRepositoryProtocol


class UpdateModelUseCase:
    """Application use case — override the model ID for a pipeline task at runtime.

    Tasks correspond to pipeline stages: ``"scribe"``, ``"clinical"``, etc.
    The override is persisted to ``runtime.json`` and picked up by
    ``ModelSelector`` on the next invocation (no restart required).

    Does NOT need an ``apply_*`` callable because ``ModelSelector`` reads from
    the config repo on every call — there is no module-level global to patch.
    """

    _VALID_TASKS = frozenset({"asr", "scribe", "clinical", "clinical_complex"})

    def __init__(self, config_repo: ConfigRepositoryProtocol) -> None:
        self._config_repo = config_repo

    def execute(self, task: str, model_id: str) -> None:
        """Validate and persist the model override.

        Args:
            task:     Pipeline stage key (e.g. ``"scribe"`` or ``"clinical"``).
            model_id: DashScope model identifier (e.g. ``"qwen3-asr-flash"``).

        Raises:
            ValueError: if *task* or *model_id* is blank, or *task* is unknown.
        """
        task = task.strip() if task else ""
        model_id = model_id.strip() if model_id else ""

        if not task:
            raise ValueError("Task must not be empty.")
        if task not in self._VALID_TASKS:
            raise ValueError(
                f"Unknown task '{task}'. Valid tasks: {sorted(self._VALID_TASKS)}"
            )
        if not model_id:
            raise ValueError("Model ID must not be empty.")

        self._config_repo.set_model(task, model_id)
