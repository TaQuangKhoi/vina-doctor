from __future__ import annotations

from ai_engine.domain.entities import PipelineState
from ai_engine.domain.value_objects import PipelineStatus


class InMemoryPipelineStateTracker:
    """In-memory pipeline state tracker keyed by session ID.

    Suitable for single-instance deployments.  Swap for a Redis or DB-backed
    implementation when horizontal scaling is needed.
    Implements ``PipelineStateTrackerProtocol``.
    """

    def __init__(self) -> None:
        self._states: dict[str, PipelineState] = {}

    def update(self, session_id: str, state: PipelineState) -> None:
        self._states[session_id] = state

    def get(self, session_id: str) -> PipelineState:
        return self._states.get(
            session_id,
            PipelineState(status=PipelineStatus.PENDING),
        )
