"""Labelled sample frames for calibrating and testing screen reading.

The capture tool exports a JSON array of frames:

    [{"id", "timestamp", "relativeTimeMs", "label", "dataUrl"}, ...]

`import` unpacks one or more of those exports into image files plus a
manifest; `summary` reports how many frames each label has.

    uv run python -m twokot.dataset import ~/Downloads/2kot-frames-*.json
    uv run python -m twokot.dataset summary
"""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path
from typing import Any

from .config import load_settings
from .vision.preprocess import decode_data_url, decode_image

MANIFEST = "manifest.json"
UNLABELLED = "(unlabelled)"


def dataset_dir() -> Path:
    return load_settings().data_dir / "dataset"


def load_manifest(directory: Path) -> list[dict[str, Any]]:
    path = directory / MANIFEST
    return json.loads(path.read_text()) if path.exists() else []


def import_export(export_path: Path, directory: Path) -> tuple[int, int]:
    """Unpack one capture-tool export. Returns (added, skipped) frame counts."""
    frames = json.loads(export_path.read_text())
    if not isinstance(frames, list):
        raise ValueError(f"{export_path} is not a capture-tool export (expected a JSON array)")

    images = directory / "images"
    images.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest(directory)
    known = {entry["sha256"] for entry in manifest}
    added = skipped = 0

    for frame in frames:
        try:
            data, extension = decode_data_url(frame["dataUrl"])
            height, width = decode_image(data).shape[:2]
        except (KeyError, TypeError, ValueError):
            skipped += 1
            continue

        # Content hash as the filename: re-importing an export adds nothing twice.
        digest = hashlib.sha256(data).hexdigest()
        if digest in known:
            skipped += 1
            continue
        known.add(digest)

        filename = f"{digest[:16]}.{extension}"
        (images / filename).write_bytes(data)
        manifest.append(
            {
                "file": f"images/{filename}",
                "sha256": digest,
                "label": (frame.get("label") or "").strip() or None,
                "timestamp": frame.get("timestamp"),
                "relative_time_ms": frame.get("relativeTimeMs"),
                "width": width,
                "height": height,
                "source": export_path.name,
            }
        )
        added += 1

    (directory / MANIFEST).write_text(json.dumps(manifest, indent=2))
    return added, skipped


def summarize(directory: Path) -> Counter[str]:
    return Counter(entry["label"] or UNLABELLED for entry in load_manifest(directory))


def main() -> None:
    parser = argparse.ArgumentParser(description="Manage labelled sample frames")
    parser.add_argument("--dir", type=Path, default=None, help="dataset directory")
    commands = parser.add_subparsers(dest="command", required=True)
    importer = commands.add_parser("import", help="unpack capture-tool JSON exports")
    importer.add_argument("exports", nargs="+", type=Path)
    commands.add_parser("summary", help="count frames per label")
    args = parser.parse_args()

    directory = args.dir or dataset_dir()
    if args.command == "import":
        for export in args.exports:
            added, skipped = import_export(export, directory)
            print(f"{export.name}: added {added}, skipped {skipped}")

    counts = summarize(directory)
    print(f"{sum(counts.values())} frames in {directory}")
    for label, count in counts.most_common():
        print(f"  {count:5d}  {label}")


if __name__ == "__main__":
    main()
