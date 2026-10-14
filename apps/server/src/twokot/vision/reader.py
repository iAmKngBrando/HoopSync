"""Text recognition behind a small interface, so the engine can be swapped."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

import numpy as np


@dataclass(frozen=True)
class TextBox:
    """One piece of text found in an image, positioned in fractions of it."""

    text: str
    confidence: float
    x0: float
    y0: float
    x1: float
    y1: float

    @property
    def cx(self) -> float:
        return (self.x0 + self.x1) / 2

    @property
    def cy(self) -> float:
        return (self.y0 + self.y1) / 2


class TextReader(Protocol):
    def read_line(self, image: np.ndarray) -> tuple[str, float]:
        """Read an image known to hold a single line of text. Fast."""
        ...

    def read_boxes(self, image: np.ndarray) -> list[TextBox]:
        """Find and read every piece of text in an image. Slower."""
        ...


class RapidOcrReader:
    """RapidOCR (PP-OCR models on ONNX Runtime); runs locally, no network."""

    def __init__(self) -> None:
        from rapidocr_onnxruntime import RapidOCR

        self._engine = RapidOCR()

    def read_line(self, image: np.ndarray) -> tuple[str, float]:
        result, _ = self._engine(image, use_det=False, use_cls=False)
        if not result:
            return "", 0.0
        text, confidence = result[0][0], result[0][1]
        return str(text).strip(), float(confidence)

    def read_boxes(self, image: np.ndarray) -> list[TextBox]:
        result, _ = self._engine(image, use_cls=False)
        height, width = image.shape[:2]
        boxes = []
        for points, text, confidence in result or []:
            xs = [p[0] / width for p in points]
            ys = [p[1] / height for p in points]
            boxes.append(
                TextBox(str(text).strip(), float(confidence), min(xs), min(ys), max(xs), max(ys))
            )
        return boxes
