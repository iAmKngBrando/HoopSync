import base64
import json

import cv2
import numpy as np

from twokot.dataset import UNLABELLED, import_export, load_manifest, summarize


def data_url(shade):
    ok, png = cv2.imencode(".png", np.full((6, 8, 3), shade, dtype=np.uint8))
    assert ok
    return "data:image/png;base64," + base64.b64encode(png).decode()


def test_import_capture_tool_export(tmp_path):
    export = tmp_path / "2kot-frames-1.json"
    export.write_text(
        json.dumps(
            [
                {
                    "id": "a",
                    "timestamp": "2026-10-12T00:00:00Z",
                    "relativeTimeMs": 0,
                    "label": "matchup",
                    "dataUrl": data_url(10),
                },
                {
                    "id": "b",
                    "timestamp": "2026-10-12T00:00:01Z",
                    "relativeTimeMs": 500,
                    "label": "",
                    "dataUrl": data_url(20),
                },
                {"id": "c", "label": "broken", "dataUrl": "data:image/png;base64,AAAA"},
            ]
        )
    )
    out = tmp_path / "dataset"

    assert import_export(export, out) == (2, 1)
    manifest = load_manifest(out)
    assert [(e["label"], e["width"], e["height"]) for e in manifest] == [
        ("matchup", 8, 6),
        (None, 8, 6),
    ]
    assert all((out / e["file"]).is_file() for e in manifest)
    assert summarize(out) == {"matchup": 1, UNLABELLED: 1}

    # Importing the same export again adds nothing.
    assert import_export(export, out) == (0, 3)
    assert len(load_manifest(out)) == 2
