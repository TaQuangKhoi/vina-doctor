from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path

_SUPPORTED_EXTENSIONS = {".mp3", ".m4a", ".wav", ".webm", ".ogg", ".flac", ".aac"}
_TARGET_EXTENSION = ".mp3"

# Maximum audio duration (in seconds) that DashScope ASR accepts per request.
MAX_SEGMENT_SECONDS = 300  # 5 minutes


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
        dest = output_dir / source_path.name
        if source_path.resolve() == dest.resolve():
            return dest
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


def get_audio_duration(audio_path: Path) -> float:
    """Return the duration of *audio_path* in seconds using ffprobe.

    Returns 0.0 if ffprobe is unavailable or fails.
    """
    if shutil.which("ffprobe") is None:
        return 0.0

    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_entries",
            "format=duration",
            str(audio_path),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return 0.0

    try:
        data = json.loads(result.stdout)
        return float(data["format"]["duration"])
    except (KeyError, ValueError, json.JSONDecodeError):
        return 0.0


def _detect_silence_points(
    audio_path: Path, noise_db: float = -35.0, min_duration: float = 0.3
) -> list[float]:
    """Run ffmpeg silencedetect and return a list of silence-end timestamps (seconds).

    These timestamps mark positions in the audio where a silence period ends —
    good cut points that avoid splitting mid-word.

    Returns an empty list if ffmpeg is unavailable or no silence is found.
    """
    if shutil.which("ffmpeg") is None:
        return []

    result = subprocess.run(
        [
            "ffmpeg",
            "-i",
            str(audio_path),
            "-af",
            f"silencedetect=noise={noise_db}dB:d={min_duration}",
            "-f",
            "null",
            "-",
        ],
        capture_output=True,
        text=True,
    )

    # silencedetect outputs to stderr
    silence_ends: list[float] = []
    for line in result.stderr.splitlines():
        # e.g. "[silencedetect @ 0x...] silence_end: 12.345 | silence_duration: 0.678"
        match = re.search(r"silence_end:\s*([\d.]+)", line)
        if match:
            silence_ends.append(float(match.group(1)))

    return sorted(silence_ends)


def split_audio_at_silence(
    audio_path: Path,
    output_dir: Path,
    max_segment_seconds: float = MAX_SEGMENT_SECONDS,
) -> list[Path]:
    """Split *audio_path* into segments no longer than *max_segment_seconds*.

    Uses ffmpeg's silencedetect filter to find natural cut points (end of
    silence regions) near each 5-minute boundary, avoiding mid-word splits.
    Falls back to a hard cut at exactly the boundary if no silence is found.

    Args:
        audio_path:           Path to the converted mp3 file.
        output_dir:           Directory to write segment files into.
        max_segment_seconds:  Maximum duration per segment (default 300s = 5 min).

    Returns:
        A list of Paths to the segments.  If the audio is shorter than
        *max_segment_seconds*, returns ``[audio_path]`` (no copy is made).
    """
    duration = get_audio_duration(audio_path)

    # No split needed.
    if duration <= max_segment_seconds or duration == 0.0:
        return [audio_path]

    silence_ends = _detect_silence_points(audio_path)

    # Build cut boundaries: find best cut point near each N*max_segment_seconds mark.
    # We look within a 30-second window before each boundary.
    look_behind = 30.0
    boundaries: list[float] = [0.0]
    cursor = 0.0

    while cursor + max_segment_seconds < duration:
        target = cursor + max_segment_seconds
        window_start = target - look_behind

        # Find silence ends within (window_start, target]
        candidates = [t for t in silence_ends if window_start < t <= target]

        if candidates:
            # Pick the latest silence end before the hard boundary → cleanest cut.
            cut = max(candidates)
        else:
            # No silence found — hard cut exactly at the boundary.
            cut = target

        boundaries.append(cut)
        cursor = cut

    boundaries.append(duration)

    if shutil.which("ffmpeg") is None:
        # Cannot split without ffmpeg — return original file as single segment.
        return [audio_path]

    segments: list[Path] = []
    stem = audio_path.stem

    for i, (start, end) in enumerate(zip(boundaries[:-1], boundaries[1:])):
        seg_path = output_dir / f"{stem}_part{i:03d}.mp3"
        result = subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-ss",
                str(start),
                "-to",
                str(end),
                "-i",
                str(audio_path),
                "-c",
                "copy",
                str(seg_path),
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            segments.append(seg_path)
        else:
            # Segment failed — include original path as fallback for this chunk.
            segments.append(audio_path)

    return segments
