from __future__ import annotations

from typing import Callable

from ai_engine.domain.config_repository import ConfigRepositoryProtocol


class UpdateDashscopeUrlUseCase:
    """Application use case — update the DashScope base HTTP API URL at runtime.

    Follows the same pattern as UpdateApiKeyUseCase (SRP, DIP):
      1. Validate the URL is non-empty.
      2. Apply it in-process via the injected *apply_url* callable.
      3. Persist it via the injected *config_repo*.

    The ``apply_url`` callable (injected in ``main.py`` as
    ``lambda u: setattr(dashscope, "base_http_api_url", u)``) keeps this
    use case free of infrastructure concerns.
    """

    def __init__(
        self,
        config_repo: ConfigRepositoryProtocol,
        apply_url: Callable[[str], None],
    ) -> None:
        self._config_repo = config_repo
        self._apply_url = apply_url

    def execute(self, new_url: str) -> None:
        """Validate, apply in-process, and persist *new_url*.

        Args:
            new_url: The new DashScope base HTTP API URL to activate.

        Raises:
            ValueError: if *new_url* is blank.
        """
        url = new_url.strip() if new_url else ""
        if not url:
            raise ValueError("DashScope base URL must not be empty.")

        self._apply_url(url)
        self._config_repo.set_dashscope_url(url)
