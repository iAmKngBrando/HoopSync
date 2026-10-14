"""Turn raw OCR text into typed values.

Pure string handling, so it is testable without any captured frames. The
expected formats come from the product brief's reference screens, e.g.
"OVR 93", "21 - 14", "Q2 03:42".
"""

from __future__ import annotations

import re

# Digits OCR tends to return as letters inside numeric fields.
DIGIT_FIXES = str.maketrans({"O": "0", "o": "0", "I": "1", "l": "1", "S": "5", "B": "8"})


def _digits(text: str) -> str:
    return text.translate(DIGIT_FIXES)


def parse_overall(text: str) -> int | None:
    """'OVR 93' -> 93. Ratings outside 40-99 are rejected as misreads."""
    match = re.search(r"(?:OVR|0VR)\s*[:\-]?\s*([0-9OoIlSB]{2})", text, re.IGNORECASE)
    if not match:
        return None
    value = int(_digits(match.group(1)))
    return value if 40 <= value <= 99 else None


def parse_score(text: str) -> tuple[int, int] | None:
    """'21 - 14' -> (21, 14). Accepts hyphen, en dash, em dash or colon."""
    match = re.search(r"([0-9OoIlSB]{1,3})\s*[-–—:]\s*([0-9OoIlSB]{1,3})", text)
    if not match:
        return None
    return int(_digits(match.group(1))), int(_digits(match.group(2)))


def parse_quarter(text: str) -> int | None:
    """'Q2' -> 2, 'OT' -> 5 (overtime counts as the period after the fourth)."""
    if re.search(r"\bOT\b", text, re.IGNORECASE):
        return 5
    match = re.search(r"\bQ\s*([1-4IlO])", text, re.IGNORECASE)
    if not match:
        return None
    value = int(_digits(match.group(1)))
    return value if 1 <= value <= 4 else None


def parse_clock(text: str) -> str | None:
    """'03:42' or '3.42' -> '03:42'."""
    match = re.search(r"\b([0-9OoIlSB]{1,2})\s*[:.]\s*([0-9OoIlSB]{2})\b", text)
    if not match:
        return None
    minutes, seconds = int(_digits(match.group(1))), int(_digits(match.group(2)))
    if minutes > 12 or seconds > 59:
        return None
    return f"{minutes:02d}:{seconds:02d}"


def clean_name(text: str) -> str | None:
    """Trim OCR noise around a player name; None when nothing usable is left."""
    name = re.sub(r"\s+", " ", text).strip(" \t\n|[](){}<>.,:;'\"`~")
    return name if len(name) >= 2 else None
