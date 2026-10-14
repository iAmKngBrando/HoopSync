"""Image helpers shared by every screen reader."""

from __future__ import annotations

import base64
from dataclasses import dataclass

import cv2
import numpy as np


@dataclass(frozen=True)
class Region:
    """A rectangle in fractions of the frame, so it holds at any resolution."""

    x: float
    y: float
    w: float
    h: float

    def __post_init__(self) -> None:
        if not (0 <= self.x < 1 and 0 <= self.y < 1 and 0 < self.w <= 1 and 0 < self.h <= 1):
            raise ValueError(f"Region out of bounds: {self}")
        if self.x + self.w > 1 + 1e-9 or self.y + self.h > 1 + 1e-9:
            raise ValueError(f"Region extends past the frame: {self}")


def crop(image: np.ndarray, region: Region) -> np.ndarray:
    height, width = image.shape[:2]
    x0, y0 = round(region.x * width), round(region.y * height)
    x1, y1 = round((region.x + region.w) * width), round((region.y + region.h) * height)
    return image[y0 : max(y1, y0 + 1), x0 : max(x1, x0 + 1)]


def prepare_for_ocr(image: np.ndarray, min_height: int = 64) -> np.ndarray:
    """Greyscale, upscale small text and binarise to dark text on white."""
    grey = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image
    if grey.shape[0] < min_height:
        scale = min_height / grey.shape[0]
        grey = cv2.resize(grey, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    _, binary = cv2.threshold(grey, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # Game text is usually light on dark; OCR engines prefer the reverse.
    if np.mean(binary) < 127:
        binary = cv2.bitwise_not(binary)
    return binary


def decode_image(data: bytes) -> np.ndarray:
    image = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Not a decodable image")
    return image


def decode_data_url(data_url: str) -> tuple[bytes, str]:
    """Split a 'data:image/png;base64,...' URL into raw bytes and extension."""
    header, _, payload = data_url.partition(",")
    if not header.startswith("data:image/") or ";base64" not in header:
        raise ValueError("Expected a base64 image data URL")
    extension = header[len("data:image/") :].split(";")[0].lower()
    return base64.b64decode(payload), "jpg" if extension == "jpeg" else extension
