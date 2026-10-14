import base64

import cv2
import numpy as np
import pytest

from twokot.vision import parse
from twokot.vision.preprocess import Region, crop, decode_data_url, decode_image, prepare_for_ocr


def test_parse_overall():
    assert parse.parse_overall("OVR 93") == 93
    assert parse.parse_overall("ovr: 9S") == 95
    assert parse.parse_overall("0VR 88 | 2-Way") == 88
    assert parse.parse_overall("OVR 12") is None
    assert parse.parse_overall("no rating") is None


def test_parse_score():
    assert parse.parse_score("21 - 14") == (21, 14)
    assert parse.parse_score("2I–l4") == (21, 14)
    assert parse.parse_score("YOU WON") is None


def test_parse_quarter_and_clock():
    assert parse.parse_quarter("Q2 03:42") == 2
    assert parse.parse_quarter("OT 01:00") == 5
    assert parse.parse_quarter("Q7") is None
    assert parse.parse_clock("Q2 03:42") == "03:42"
    assert parse.parse_clock("3.O5") == "03:05"
    assert parse.parse_clock("45:99") is None


def test_clean_name():
    assert parse.clean_name("  | ItsMeJayy ]\n") == "ItsMeJayy"
    assert parse.clean_name(" . ") is None


def test_crop_uses_fractions_of_the_frame():
    image = np.zeros((100, 200, 3), dtype=np.uint8)
    assert crop(image, Region(0.25, 0.5, 0.5, 0.25)).shape[:2] == (25, 100)
    with pytest.raises(ValueError):
        Region(0.8, 0.0, 0.5, 0.5)


def test_prepare_for_ocr_gives_dark_text_on_white():
    image = np.full((20, 80, 3), 20, dtype=np.uint8)
    cv2.putText(image, "93", (5, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (240, 240, 240), 2)
    prepared = prepare_for_ocr(image)
    assert prepared.shape[0] >= 64
    assert set(np.unique(prepared)) <= {0, 255}
    assert np.mean(prepared) > 127


def test_data_url_round_trip():
    ok, png = cv2.imencode(".png", np.zeros((4, 6, 3), dtype=np.uint8))
    assert ok
    data, extension = decode_data_url("data:image/png;base64," + base64.b64encode(png).decode())
    assert extension == "png"
    assert decode_image(data).shape == (4, 6, 3)
    with pytest.raises(ValueError):
        decode_data_url("data:text/plain;base64,AAAA")
    with pytest.raises(ValueError):
        decode_image(b"not an image")
