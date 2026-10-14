"""Run a recorded capture session through screen reading.

Takes a capture-tool JSON export, prints the screens it recognised and
records any completed game, exactly as a live stream would:

    uv run python -m twokot.replay path/to/2kot-frames-....json

Add --dry-run to see what would be recorded without touching the database.
"""

from __future__ import annotations

import argparse
import json
import tempfile
from pathlib import Path

from .config import Settings, load_settings
from .db import Store, connect
from .live import FrameProcessor
from .vision.preprocess import decode_data_url


def replay(export_path: Path, settings: Settings, verbose: bool = True) -> list[dict]:
    """Process every frame in an export. Returns the games recorded."""
    frames = json.loads(export_path.read_text())
    settings.ensure_dirs()
    processor = FrameProcessor(Store(connect(settings.db_path)), settings.frames_dir)

    games: list[dict] = []
    run_kind, run_start = None, 0

    def close_run(end: int) -> None:
        if verbose and run_kind is not None:
            print(f"  frames {run_start:4d}-{end:4d}  {run_kind}")

    timestamp = None
    for index, frame in enumerate(frames):
        try:
            data, _ = decode_data_url(frame["dataUrl"])
        except (KeyError, TypeError, ValueError):
            continue
        timestamp = frame.get("timestamp")
        observation = processor.analyze(data)
        if observation.kind.value != run_kind:
            close_run(index - 1)
            run_kind, run_start = observation.kind.value, index
        game = processor.apply(data, observation, captured_at=timestamp)
        if game:
            games.append(game)
    close_run(len(frames) - 1)

    game = processor.flush(captured_at=timestamp)
    if game:
        games.append(game)
    return games


def main() -> None:
    parser = argparse.ArgumentParser(description="Replay a capture-tool export")
    parser.add_argument("export", type=Path)
    parser.add_argument("--dry-run", action="store_true", help="do not touch the real database")
    args = parser.parse_args()

    if args.dry_run:
        with tempfile.TemporaryDirectory() as scratch:
            games = replay(args.export, Settings(data_dir=Path(scratch)))
    else:
        games = replay(args.export, load_settings())

    print(f"{len(games)} game(s) {'detected' if args.dry_run else 'recorded'}")
    for game in games:
        print(
            f"  {game['outcome']}: {game['your_score']} - {game['opponent_score']}"
            f"  ({game['game_type']}, opponent id {game['opponent_id']})"
        )


if __name__ == "__main__":
    main()
