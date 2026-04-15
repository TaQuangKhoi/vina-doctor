from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path

DEFAULT_DASHSCOPE_URL = "https://dashscope-intl.aliyuncs.com/api/v1"


class FileConfigRepository:
    """Infrastructure implementation of ConfigRepositoryProtocol.

    Persists runtime configuration as a JSON file on disk.
    Reads and writes are atomic — a write to a temporary file followed by
    ``os.replace`` ensures the reader never sees a partial write.

    The directory is created on first write if it does not yet exist.

    JSON schema::

        {
          "dashscope_api_key": "sk-...",
          "dashscope_base_url": "https://dashscope-intl.aliyuncs.com/api/v1",
          "models": {
            "scribe": "qwen3-asr-flash",
            "clinical": "qwen3.5-omni-flash"
          }
        }
    """

    _KEY_DASHSCOPE = "dashscope_api_key"
    _KEY_BASE_URL = "dashscope_base_url"
    _KEY_MODELS = "models"

    def __init__(self, path: str | Path = "/app/config/runtime.json") -> None:
        self._path = Path(path)

    # ------------------------------------------------------------------
    # ConfigRepositoryProtocol implementation
    # ------------------------------------------------------------------

    def get_dashscope_key(self) -> str | None:
        """Return the persisted DashScope API key, or *None* if not found."""
        data = self._read()
        value = data.get(self._KEY_DASHSCOPE)
        return value if isinstance(value, str) and value else None

    def set_dashscope_key(self, key: str) -> None:
        """Atomically persist *key* to the config file."""
        if not key or not key.strip():
            raise ValueError("DashScope API key must not be empty.")
        data = self._read()
        data[self._KEY_DASHSCOPE] = key.strip()
        self._write(data)

    def get_dashscope_url(self) -> str | None:
        """Return the persisted DashScope base URL, or *None* if not overridden."""
        data = self._read()
        value = data.get(self._KEY_BASE_URL)
        return value if isinstance(value, str) and value else None

    def set_dashscope_url(self, url: str) -> None:
        """Atomically persist *url* as the DashScope base HTTP API URL."""
        if not url or not url.strip():
            raise ValueError("DashScope base URL must not be empty.")
        data = self._read()
        data[self._KEY_BASE_URL] = url.strip()
        self._write(data)

    def get_model(self, task: str) -> str | None:
        """Return the persisted model ID for *task*, or *None* if not overridden."""
        data = self._read()
        models = data.get(self._KEY_MODELS)
        if not isinstance(models, dict):
            return None
        value = models.get(task)
        return value if isinstance(value, str) and value else None

    def set_model(self, task: str, model_id: str) -> None:
        """Atomically persist *model_id* as the runtime override for *task*."""
        if not task or not task.strip():
            raise ValueError("Task must not be empty.")
        if not model_id or not model_id.strip():
            raise ValueError("Model ID must not be empty.")
        data = self._read()
        models = data.setdefault(self._KEY_MODELS, {})
        models[task.strip()] = model_id.strip()
        self._write(data)

    def get_all_config(self) -> dict:
        """Return a dict of all persisted configuration values (key redacted)."""
        data = self._read()
        return {
            "dashscope_base_url": data.get(self._KEY_BASE_URL) or DEFAULT_DASHSCOPE_URL,
            "models": data.get(self._KEY_MODELS) or {},
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _read(self) -> dict:
        """Return the config dict, or an empty dict if the file does not exist."""
        try:
            return json.loads(self._path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            return {}
        except json.JSONDecodeError:
            # Corrupted file — treat as empty rather than crashing the app.
            return {}

    def _write(self, data: dict) -> None:
        """Write *data* to disk atomically via a temp file + os.replace."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp_path = tempfile.mkstemp(
            dir=self._path.parent, prefix=".tmp_runtime_", suffix=".json"
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            os.replace(tmp_path, self._path)
        except Exception:
            # Clean up the temp file on any error before re-raising.
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
            raise
