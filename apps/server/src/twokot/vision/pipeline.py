"""Frame -> Observation: the entry point for screen reading."""

from __future__ import annotations

from dataclasses import replace

import numpy as np

from ..session import Observation
from .reader import TextReader
from .screens import classify, extract, normalize_frame


def analyze_frame(
    image: np.ndarray, reader: TextReader, frame_id: int | None = None
) -> Observation:
    """Recognise the screen in a captured frame and read its values."""
    frame = normalize_frame(image)
    kind = classify(frame, reader)
    return replace(extract(frame, kind, reader), frame_id=frame_id)
