"""Match a detected opponent name against opponents already on record.

OCR on stylised game text routinely confuses look-alike characters (O/0, I/l/1,
S/5...). Names are compared after folding those together, so a slightly
misread name still resolves to the same opponent instead of creating a
duplicate.
"""

from __future__ import annotations

import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Any

# Look-alike characters folded to one representative before comparing.
_CONFUSABLE = str.maketrans(
    {
        "0": "o",
        "1": "l",
        "i": "l",
        "|": "l",
        "5": "s",
        "8": "b",
        "2": "z",
        "6": "g",
        "9": "g",
        "q": "g",
    }
)

# Below this a name is treated as a new opponent. To be tuned on real captures.
DEFAULT_THRESHOLD = 0.86


def normalize(name: str) -> str:
    """Lowercase and strip everything but letters, digits and the pipe glyph."""
    return re.sub(r"[^a-z0-9|]", "", name.casefold())


def fold(name: str) -> str:
    """Normalize, then collapse characters OCR commonly confuses."""
    return normalize(name).translate(_CONFUSABLE)


def similarity(a: str, b: str) -> float:
    """0..1 similarity between two names, tolerant of OCR look-alike errors."""
    na, nb = normalize(a), normalize(b)
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0
    fa, fb = fold(a), fold(b)
    if fa == fb:
        # Identical once look-alikes are folded: near certain, but not exact.
        return 0.97
    return SequenceMatcher(None, fa, fb).ratio() * 0.95


@dataclass(frozen=True)
class Match:
    opponent: Mapping[str, Any]
    score: float
    exact: bool


def find_best_match(
    name: str,
    opponents: Iterable[Mapping[str, Any]],
    threshold: float = DEFAULT_THRESHOLD,
) -> Match | None:
    """Return the closest opponent by name or gamertag, or None below threshold."""
    best: Match | None = None
    for opponent in opponents:
        candidates = [opponent.get("name"), opponent.get("gamertag")]
        score = max((similarity(name, c) for c in candidates if c), default=0.0)
        if best is None or score > best.score:
            best = Match(opponent=opponent, score=score, exact=score == 1.0)
    if best is None or best.score < threshold:
        return None
    return best
