from pathlib import Path

import cv2
import pytest

from twokot.vision.reader import RapidOcrReader, TextBox
from twokot.vision.stats_table import parse_stats_boxes, read_stats_image

FRAMES = Path(__file__).parent / "fixtures" / "frames"


def row(y, label, cells, x0=0.10):
    """A table line: a label, then (x, text) cells."""
    boxes = [TextBox(label, 0.95, x0, y, x0 + 0.12, y + 0.03)] if label else []
    return boxes + [TextBox(text, 0.95, x - 0.015, y, x + 0.015, y + 0.03) for x, text in cells]


HEADER = [(0.30, "GRD"), (0.38, "PTS"), (0.46, "REB"), (0.54, "AST"), (0.62, "FGM/FGA")]


def test_two_tables_with_total_rows():
    boxes = (
        row(0.10, "My Team", HEADER)
        + row(0.15, "iAmKngBrando", [(0.30, "B+"), (0.38, "18"), (0.46, "0"), (0.62, "8/13")])
        + row(0.20, "TOTAL", [(0.30, "B+"), (0.38, "18"), (0.46, "0"), (0.54, "0"), (0.62, "8/13")])
        + row(0.30, "Opponent", HEADER)
        + row(0.35, "DntDaggMe", [(0.30, "A"), (0.38, "22"), (0.62, "10/14")])
        + row(0.40, "TOTAL", [(0.30, "A"), (0.38, "22"), (0.46, "0"), (0.54, "0"), (0.62, "10I14")])
    )
    stats = parse_stats_boxes(boxes)
    assert stats["you"] == {"GRD": "B+", "PTS": 18, "REB": 0, "AST": 0, "FGM/FGA": "8/13"}
    assert stats["opponent"]["PTS"] == 22
    assert stats["opponent"]["FGM/FGA"] == "10/14", "a slash misread as I is repaired"


def test_single_table_uses_names_to_pick_sides():
    boxes = (
        row(0.10, "", HEADER)
        + row(0.15, "DntDaggMe", [(0.38, "22"), (0.46, "3")])
        + row(0.20, "iAmKngBrand0", [(0.38, "18"), (0.46, "1")])
    )
    stats = parse_stats_boxes(boxes, your_name="iAmKngBrando", opponent_name="DntDaggMe")
    assert (stats["you"]["PTS"], stats["opponent"]["PTS"]) == (18, 22)
    # Without names the first row is taken as you.
    assert parse_stats_boxes(boxes)["you"]["PTS"] == 22


def test_joined_headers_and_alternate_spellings():
    boxes = [
        TextBox("POINTS", 0.9, 0.36, 0.1, 0.40, 0.13),
        TextBox("BLK FOULS", 0.9, 0.44, 0.1, 0.56, 0.13),
        TextBox("TOV", 0.9, 0.60, 0.1, 0.64, 0.13),
    ] + row(0.15, "TOTAL", [(0.38, "18"), (0.47, "1"), (0.53, "2"), (0.62, "4")])
    assert parse_stats_boxes(boxes) == {"you": {"PTS": 18, "BLK": 1, "FOULS": 2, "TO": 4}}


def test_glued_headers_and_cells_are_split():
    boxes = [
        TextBox("GRDPTS", 0.99, 0.36, 0.1, 0.46, 0.13),
        TextBox("REB AST", 0.9, 0.48, 0.1, 0.58, 0.13),
        TextBox("TOTAL", 0.99, 0.10, 0.15, 0.20, 0.18),
        TextBox("B+18", 0.9, 0.365, 0.15, 0.455, 0.18),
        TextBox("3", 0.9, 0.49, 0.15, 0.52, 0.18),
    ]
    assert parse_stats_boxes(boxes) == {"you": {"GRD": "B+", "PTS": 18, "REB": 3}}


def test_noise_is_ignored():
    assert parse_stats_boxes([]) == {}
    assert parse_stats_boxes(row(0.1, "hello", [(0.5, "world")])) == {}
    low_confidence = [TextBox(b.text, 0.2, b.x0, b.y0, b.x1, b.y1) for b in row(0.1, "", HEADER)]
    assert parse_stats_boxes(low_confidence) == {}
    boxes = row(0.10, "", HEADER) + row(0.15, "TOTAL", [(0.38, "banana"), (0.46, "7")])
    assert parse_stats_boxes(boxes)["you"] == {"REB": 7}


@pytest.mark.parametrize("name", ["0733", "0759"])
def test_whole_screenshot_reads_like_a_photo(name):
    """A full, uncropped frame goes through the layout-free path a photo takes."""
    image = cv2.imread(str(FRAMES / f"{name}.jpg"))
    image = cv2.resize(image, (1280, 720), interpolation=cv2.INTER_CUBIC)
    stats = read_stats_image(image, RapidOcrReader(), "iAmKngBrando", "DntDaggMe")
    assert (stats["you"]["PTS"], stats["opponent"]["PTS"]) == (18, 22)
    assert stats["opponent"]["GRD"] == "A"
    assert (stats["you"]["FGM/FGA"], stats["opponent"]["FGM/FGA"]) == ("8/13", "10/14")
