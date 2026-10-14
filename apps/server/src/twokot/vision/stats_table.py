"""Read a box-score style stats table from any image.

Used for the in-game GAME STATS screen and for photos or screenshots a player
sends in afterwards. Nothing here depends on where the table sits: it finds
the column headers by their names, then lines the numbers up underneath, so
it copes with different layouts, crops and sizes.
"""

from __future__ import annotations

import itertools
import re
from typing import Any

import cv2
import numpy as np

from ..matching import similarity
from .reader import TextBox, TextReader

# Canonical column -> spellings seen on screen (compared letters-only).
COLUMN_ALIASES: dict[str, tuple[str, ...]] = {
    "GRD": ("GRD", "GRADE"),
    "MIN": ("MIN",),
    "PTS": ("PTS", "POINTS"),
    "REB": ("REB", "REBOUNDS"),
    "AST": ("AST", "ASSISTS"),
    "STL": ("STL", "STEALS"),
    "BLK": ("BLK", "BLOCKS"),
    "FOULS": ("FOULS", "PF", "FLS"),
    "TO": ("TO", "TOV", "TURNOVERS"),
    "FGM/FGA": ("FGMFGA", "FGMIFGA", "FGM1FGA", "FG"),
    "3PM/3PA": ("3PM3PA", "3PMI3PA", "3PM13PA", "3P3PA", "3PT", "3P"),
    "FTM/FTA": ("FTMFTA", "FTMIFTA", "FT"),
}
STAT_COLUMNS = tuple(COLUMN_ALIASES)
_ALIAS_TO_COLUMN = {
    alias: column for column, aliases in COLUMN_ALIASES.items() for alias in aliases
}

# Photos are scaled so their longer side is this many pixels before reading.
PHOTO_SIZE = 2000


def _letters(text: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", text.upper())


def _columns_in(box: TextBox) -> list[tuple[str, float]]:
    """Columns named by a header box, with each one's x position. OCR often
    joins neighbouring headers ("BLK FOULS"), so a box may name several."""
    words = box.text.split()
    whole = _ALIAS_TO_COLUMN.get(_letters(box.text))
    if whole:
        return [(whole, box.cx)]
    if len(words) == 1:
        # No space survived between headers ("GRDPTS"): split by known names.
        words = _split_headers(_letters(box.text))
    named = [(_ALIAS_TO_COLUMN.get(_letters(word)), index) for index, word in enumerate(words)]
    if not words or any(column is None for column, _ in named):
        return []
    # Spread the joined headers evenly across the box they were read from.
    width = (box.x1 - box.x0) / len(words)
    return [(column, box.x0 + width * (index + 0.5)) for column, index in named]


def _split_headers(letters: str) -> list[str]:
    """'GRDPTS' -> ['GRD', 'PTS']; [] unless the whole string is header names."""
    aliases = sorted(_ALIAS_TO_COLUMN, key=len, reverse=True)
    found: list[str] = []
    while letters:
        alias = next((a for a in aliases if len(a) >= 2 and letters.startswith(a)), None)
        if alias is None:
            return []
        found.append(alias)
        letters = letters[len(alias) :]
    return found if len(found) >= 2 else []


def _cells_in(box: TextBox) -> list[tuple[int | str, float]]:
    """Values in a box with each one's x position. A grade and the number
    beside it are sometimes read as one piece ("B+18")."""
    whole = _value(box.text)
    if whole is not None:
        return [(whole, box.cx)]
    glued = re.fullmatch(r"([A-F][+-]?)(\d{1,3})", re.sub(r"\s", "", box.text))
    if not glued:
        return []
    quarter = (box.x1 - box.x0) / 4
    return [(glued.group(1), box.x0 + quarter), (int(glued.group(2)), box.x1 - quarter)]


def _value(text: str) -> int | str | None:
    cleaned = re.sub(r"\s", "", text)
    if not cleaned:
        return None
    if cleaned.isdigit():
        return int(cleaned)
    # Made/attempted pairs: OCR reads the slash as I, l, 1 or | at times.
    pair = re.fullmatch(r"(\d{1,2})[/|Il](\d{1,2})", cleaned)
    if pair:
        return f"{pair.group(1)}/{pair.group(2)}"
    if re.fullmatch(r"[A-F][+-]?", cleaned):
        return cleaned
    return None


def parse_stats_boxes(
    boxes: list[TextBox],
    your_name: str | None = None,
    opponent_name: str | None = None,
    min_confidence: float = 0.5,
) -> dict[str, dict[str, Any]]:
    """Turn located text into {"you": {column: value}, "opponent": {...}}.

    A side is left out when its row cannot be identified.
    """
    boxes = [b for b in boxes if b.confidence >= min_confidence and b.text]
    if not boxes:
        return {}
    line_height = float(np.median([b.y1 - b.y0 for b in boxes]))
    same_row = line_height * 0.7

    # Header rows: lines holding at least three column names.
    header_rows: list[tuple[float, dict[str, float]]] = []
    for box in sorted(boxes, key=lambda b: b.cy):
        for column, x in _columns_in(box):
            for row_y, columns in header_rows:
                if abs(row_y - box.cy) <= same_row:
                    columns.setdefault(column, x)
                    break
            else:
                header_rows.append((box.cy, {column: x}))
    header_rows = [(y, columns) for y, columns in header_rows if len(columns) >= 3]
    if not header_rows:
        return {}

    # Data rows under each header, down to the next header.
    rows: list[dict[str, Any]] = []
    for index, (header_y, columns) in enumerate(header_rows):
        next_y = header_rows[index + 1][0] if index + 1 < len(header_rows) else float("inf")
        xs = sorted(columns.values())
        spacing = min((b - a for a, b in itertools.pairwise(xs)), default=0.05)
        first_column_x = xs[0]
        section = [
            b
            for b in boxes
            if header_y + same_row < b.cy < next_y - same_row and not _columns_in(b)
        ]
        lines: list[list[TextBox]] = []
        for box in sorted(section, key=lambda b: b.cy):
            if lines and abs(lines[-1][0].cy - box.cy) <= same_row:
                lines[-1].append(box)
            else:
                lines.append([box])
        for line in lines:
            label_parts = [b for b in line if b.cx < first_column_x - spacing * 0.5]
            label = " ".join(b.text for b in sorted(label_parts, key=lambda b: b.cx))
            values: dict[str, Any] = {}
            for box in line:
                if box in label_parts:
                    continue
                for value, x in _cells_in(box):
                    column = min(columns, key=lambda c: abs(columns[c] - x))
                    if abs(columns[column] - x) <= spacing * 0.5:
                        values[column] = value
            if values:
                rows.append({"label": label, "section": index, "values": values})

    return _assign_sides(rows, len(header_rows), your_name, opponent_name)


def _assign_sides(
    rows: list[dict[str, Any]],
    sections: int,
    your_name: str | None,
    opponent_name: str | None,
) -> dict[str, dict[str, Any]]:
    def is_total(row: dict[str, Any]) -> bool:
        return _letters(row["label"]) == "TOTAL"

    # In a one-on-one game each table is one player row plus a TOTAL row that
    # repeats it. Treat the pair as two readings of the same numbers: take the
    # TOTAL row's values and fill any it is missing from the player row.
    merged: list[dict[str, Any]] = []
    for section in range(sections):
        in_section = [row for row in rows if row["section"] == section]
        players = [row for row in in_section if not is_total(row)]
        totals = [row for row in in_section if is_total(row)]
        if len(players) == 1 and len(totals) == 1:
            values = {**players[0]["values"], **totals[0]["values"]}
            merged.append({"label": players[0]["label"], "section": section, "values": values})
        else:
            merged.extend(in_section)
    rows = merged

    result: dict[str, dict[str, Any]] = {}

    # Best evidence: a row labelled with a known player's name.
    for side, name in (("you", your_name), ("opponent", opponent_name)):
        if not name:
            continue
        scored = [(similarity(row["label"], name), row) for row in rows if row["label"]]
        best = max(scored, key=lambda pair: pair[0], default=None)
        if best and best[0] >= 0.75:
            result[side] = best[1]["values"]

    taken = [id(values) for values in result.values()]
    if sections >= 2:
        # The game's own layout: your table first, the opponent's second.
        for side, section in (("you", 0), ("opponent", 1)):
            if side in result:
                continue
            in_section = [row for row in rows if row["section"] == section]
            chosen = next((row for row in in_section if is_total(row)), None) or (
                in_section[0] if in_section else None
            )
            if chosen and id(chosen["values"]) not in taken:
                result[side] = chosen["values"]
    else:
        # One table: its TOTAL rows if it has them, else its player rows, in
        # the order you then opponent unless names said otherwise.
        candidates = [row for row in rows if is_total(row)] or rows
        remaining = [row for row in candidates if id(row["values"]) not in taken]
        for side in ("you", "opponent"):
            if side not in result and remaining:
                result[side] = remaining.pop(0)["values"]
    return result


def read_stats_image(
    image: np.ndarray,
    reader: TextReader,
    your_name: str | None = None,
    opponent_name: str | None = None,
) -> dict[str, dict[str, Any]]:
    """Read a stats table from a photo or screenshot of any size."""
    height, width = image.shape[:2]
    scale = PHOTO_SIZE / max(height, width)
    if abs(scale - 1) > 0.05:
        interpolation = cv2.INTER_CUBIC if scale > 1 else cv2.INTER_AREA
        image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=interpolation)
    return parse_stats_boxes(reader.read_boxes(image), your_name, opponent_name)
