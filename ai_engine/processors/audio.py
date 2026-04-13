from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

_SUPPORTED_EXTENSIONS = {".mp3", ".m4a", ".wav", ".webm", ".ogg", ".flac", ".aac"}
_TARGET_EXTENSION = ".mp3"


class AudioProcessingError(Exception):
    """Raised when audio validation or conversion fails unrecoverably."""


def validate_and_convert(source_path: Path, output_dir: Path) -> Path:
    """Validate *source_path* and return a path to an mp3-ready file.

    Conversion is best-effort via ffmpeg.  If ffmpeg is unavailable the
    original file is returned as-is so callers are not hard-blocked on a
    missing system dependency during development.

    Args:
        source_path: Path to the uploaded audio file.
        output_dir:  Directory where the converted file is written.

    Returns:
        Path to a (possibly converted) audio file ready for the Qwen API.

    Raises:
        AudioProcessingError: if the file extension is not in the supported set.
    """
    suffix = source_path.suffix.lower()

    if suffix not in _SUPPORTED_EXTENSIONS:
        raise AudioProcessingError(
            f"Unsupported audio format '{suffix}'. "
            f"Supported formats: {', '.join(sorted(_SUPPORTED_EXTENSIONS))}"
        )

    if suffix == _TARGET_EXTENSION:
        # Already mp3 — copy to output dir to keep temp management consistent.
        dest = output_dir / source_path.name
        shutil.copy2(source_path, dest)
        return dest

    dest = output_dir / (source_path.stem + _TARGET_EXTENSION)

    if shutil.which("ffmpeg") is None:
        # ffmpeg not found — pass through original file with a warning.
        shutil.copy2(source_path, output_dir / source_path.name)
        return output_dir / source_path.name

    result = subprocess.run(
        ["ffmpeg", "-y", "-i", str(source_path), str(dest)],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        # Conversion failed — fall back to original rather than blocking.
        shutil.copy2(source_path, output_dir / source_path.name)
        return output_dir / source_path.name

    return dest
