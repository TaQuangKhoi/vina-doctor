"""ICD-10 treatment reference repository.

Design goals:
- Loads the bundled ``data/icd10_treatment.json`` as the *base* catalogue.
- Supports **specialty overlays**: extra entries (or full replacements) supplied
  per-specialty by clinicians.  These are merged at runtime — no restart needed.
- Provides ``get_all_conditions()`` and ``get_by_codes()`` for the selector agent.
- Written so a future "doctor-defined ICD-10" feature can call
  ``add_specialty_condition()`` / ``remove_specialty_condition()`` without
  touching the base file.

Extension pattern for future specialty customisation::

    repo = ICD10Repository(base_path)
    repo.add_specialty_condition("cardiology", {
        "code": "I47.2",
        "name": "Ventricular tachycardia",
        ...
    })
    # The added condition is immediately available to the selector agent.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any


class ICD10RepositoryError(Exception):
    """Raised when the repository cannot be initialised or updated."""


class ICD10Repository:
    """In-memory ICD-10 condition catalogue with specialty overlay support.

    Thread-safe: all mutations are protected by a re-entrant lock so the
    overlay can be updated at runtime (e.g. from a config API endpoint)
    while requests are in-flight.

    Args:
        base_path: Path to the bundled ``icd10_treatment.json`` file.
    """

    def __init__(self, base_path: Path) -> None:
        self._base_path = base_path
        self._lock = threading.RLock()
        # dict[code -> condition_dict] — base catalogue loaded once at startup
        self._base: dict[str, dict[str, Any]] = {}
        # dict[code -> condition_dict] — specialty overlays, added at runtime
        self._overlays: dict[str, dict[str, Any]] = {}
        self._load_base()

    # ------------------------------------------------------------------
    # Public read API
    # ------------------------------------------------------------------

    def get_all_conditions(self, specialty: str | None = None) -> list[dict[str, Any]]:
        """Return all conditions, optionally filtered by *specialty*.

        Overlay entries with the same ``code`` as a base entry take precedence.
        This lets a specialty fully override a base entry's protocol/drugs.

        Args:
            specialty: If provided, return only conditions whose ``specialty``
                field matches (case-insensitive).  ``None`` returns everything.

        Returns:
            List of condition dicts sorted by ICD-10 code.
        """
        with self._lock:
            merged: dict[str, dict[str, Any]] = {**self._base, **self._overlays}
            conditions = list(merged.values())

        if specialty is not None:
            specialty_lower = specialty.lower()
            conditions = [
                c
                for c in conditions
                if c.get("specialty", "").lower() == specialty_lower
            ]

        return sorted(conditions, key=lambda c: c.get("code", ""))

    def get_by_codes(self, codes: list[str]) -> list[dict[str, Any]]:
        """Return the condition dicts for the given ICD-10 *codes*.

        Overlay entries take precedence over base entries for the same code.
        Unknown codes are silently ignored.

        Args:
            codes: List of ICD-10 codes (e.g. ``["E11.9", "I10"]``).

        Returns:
            List of matching condition dicts (order follows *codes*).
        """
        with self._lock:
            merged: dict[str, dict[str, Any]] = {**self._base, **self._overlays}

        result = []
        for code in codes:
            entry = merged.get(code)
            if entry is not None:
                result.append(entry)
        return result

    def list_specialties(self) -> list[str]:
        """Return a sorted list of all unique specialty values in the catalogue."""
        with self._lock:
            merged: dict[str, dict[str, Any]] = {**self._base, **self._overlays}
        specialties = {
            c.get("specialty", "").lower()
            for c in merged.values()
            if c.get("specialty")
        }
        return sorted(specialties)

    # ------------------------------------------------------------------
    # Specialty overlay API (for future doctor-defined ICD-10 feature)
    # ------------------------------------------------------------------

    def add_specialty_condition(
        self, specialty: str, condition: dict[str, Any]
    ) -> None:
        """Add or replace a condition in the specialty overlay at runtime.

        This is the primary extension point for the future "doctor-defined
        ICD-10" feature.  The condition is available immediately to all
        subsequent requests — no restart required.

        Args:
            specialty: Specialty name to tag the condition with (e.g.
                ``"cardiology"``).  If the condition dict already has a
                ``specialty`` key it is overwritten with this value.
            condition: Dict with at minimum ``code`` and ``name``.  Should
                follow the same schema as entries in ``icd10_treatment.json``.

        Raises:
            ICD10RepositoryError: if the condition dict lacks ``code`` or
                ``name``.
        """
        code = condition.get("code", "").strip()
        name = condition.get("name", "").strip()
        if not code:
            raise ICD10RepositoryError("Condition must have a non-empty 'code'.")
        if not name:
            raise ICD10RepositoryError("Condition must have a non-empty 'name'.")

        entry = dict(condition)
        entry["specialty"] = specialty.strip().lower()

        with self._lock:
            self._overlays[code] = entry

    def remove_specialty_condition(self, code: str) -> bool:
        """Remove a condition from the specialty overlay by *code*.

        Base catalogue entries are never deleted — only overlay entries can
        be removed.

        Args:
            code: ICD-10 code to remove from the overlay.

        Returns:
            ``True`` if the entry was found and removed, ``False`` if it was
            not present in the overlay (base entries are unaffected).
        """
        with self._lock:
            if code in self._overlays:
                del self._overlays[code]
                return True
        return False

    def clear_specialty_overlay(self, specialty: str | None = None) -> int:
        """Remove overlay entries, optionally scoped to *specialty*.

        Args:
            specialty: If given, remove only overlay entries with that
                specialty.  If ``None``, clear the entire overlay.

        Returns:
            Number of entries removed.
        """
        with self._lock:
            if specialty is None:
                count = len(self._overlays)
                self._overlays.clear()
                return count

            specialty_lower = specialty.lower()
            to_remove = [
                code
                for code, c in self._overlays.items()
                if c.get("specialty", "").lower() == specialty_lower
            ]
            for code in to_remove:
                del self._overlays[code]
            return len(to_remove)

    # ------------------------------------------------------------------
    # Compact index for LLM prompt
    # ------------------------------------------------------------------

    def build_selector_index(
        self,
        specialty: str | None = None,
        max_entries: int = 60,
    ) -> str:
        """Return a compact, token-efficient text index for the selector agent.

        Each entry includes: code, name, specialty, symptoms_keywords, drugs,
        protocol, contraindications, and notes.  This gives the LLM enough
        context to make an informed selection without sending the full JSON.

        Args:
            specialty:   Optional specialty filter.
            max_entries: Maximum number of entries to include (prevents
                         context overflow for very large catalogues).

        Returns:
            Multi-line string suitable for inclusion in an LLM prompt.
        """
        conditions = self.get_all_conditions(specialty=specialty)[:max_entries]
        lines: list[str] = []
        for c in conditions:
            lines.append(
                f"[{c['code']}] {c['name']} (specialty: {c.get('specialty', 'general')})"
            )
            kws = c.get("symptoms_keywords", [])
            if kws:
                lines.append(f"  Keywords: {', '.join(kws[:8])}")
            drugs = c.get("drugs", [])
            if drugs:
                lines.append(f"  Drugs: {'; '.join(drugs[:4])}")
            protocol = c.get("protocol", "")
            if protocol:
                lines.append(f"  Protocol: {protocol[:200]}")
            contraindications = c.get("contraindications", "")
            if contraindications:
                lines.append(f"  Contraindications: {contraindications[:150]}")
            notes = c.get("notes", "")
            if notes:
                lines.append(f"  Notes: {notes[:150]}")
            lines.append("")  # blank line between entries
        return "\n".join(lines).strip()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _load_base(self) -> None:
        """Load and parse the base ICD-10 JSON file into ``self._base``."""
        try:
            raw = self._base_path.read_text(encoding="utf-8")
        except FileNotFoundError as exc:
            raise ICD10RepositoryError(
                f"ICD-10 base file not found: {self._base_path}"
            ) from exc

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ICD10RepositoryError(
                f"Failed to parse ICD-10 base file '{self._base_path}': {exc}"
            ) from exc

        conditions = data.get("conditions", [])
        if not isinstance(conditions, list):
            raise ICD10RepositoryError(
                f"Expected 'conditions' to be a list in '{self._base_path}'."
            )

        with self._lock:
            self._base = {}
            for entry in conditions:
                code = entry.get("code", "").strip()
                if code:
                    self._base[code] = entry

    def reload_base(self) -> int:
        """Re-read the base file from disk without clearing the overlay.

        Useful if the base JSON file is updated on disk at runtime.

        Returns:
            Number of base entries loaded after reload.
        """
        self._load_base()
        with self._lock:
            return len(self._base)
