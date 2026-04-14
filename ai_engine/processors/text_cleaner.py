from __future__ import annotations

import re

# Phone numbers: Vietnamese (0xx, +84xx), international (+XXX…), generic digits.
_PHONE_PATTERN = re.compile(
    r"(?<!\d)"
    r"(?:\+?\d{1,3}[\s\-.]?)?"
    r"(?:\(?\d{2,4}\)?[\s\-.]?)"
    r"\d{3,4}[\s\-.]?\d{3,4}"
    r"(?!\d)"
)

# Email addresses.
_EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

# Numeric ID-style strings that resemble CMND/CCCD (Vietnamese national ID).
_NATIONAL_ID_PATTERN = re.compile(r"\b\d{9,12}\b")

_REDACTED = "[REDACTED]"


def redact_pii(text: str) -> str:
    """Replace personally identifiable information in *text* with [REDACTED].

    Targets:
    - Phone numbers (Vietnamese and international formats)
    - Email addresses
    - Vietnamese national ID numbers (9–12 consecutive digits)

    Name redaction is intentionally omitted at the MVP stage because
    reliable name extraction from multilingual medical text requires an
    NER model; false positives on medical terms would degrade output quality.
    """
    text = _PHONE_PATTERN.sub(_REDACTED, text)
    text = _EMAIL_PATTERN.sub(_REDACTED, text)
    text = _NATIONAL_ID_PATTERN.sub(_REDACTED, text)
    return text


class TextCleanerService:
    """Injectable wrapper around :func:`redact_pii`.

    Implements ``TextCleanerProtocol`` so it can be constructor-injected
    into use cases following the Dependency Inversion Principle.
    """

    def clean(self, text: str) -> str:
        return redact_pii(text)
