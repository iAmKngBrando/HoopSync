"""Feed captured frames through screen reading into the tracker and database.

Used the same way for a live capture stream (the API) and for replaying a
recorded session (`python -m twokot.replay`).
"""

from __future__ import annotations

import uuid
from collections.abc import Callable
from dataclasses import replace
from pathlib import Path
from typing import Any

from .db import Store
from .session import CompletedGame, Observation, SessionTracker
from .tracker import record_completed_game
from .vision.pipeline import analyze_frame
from .vision.preprocess import decode_image
from .vision.reader import RapidOcrReader, TextReader


class FrameProcessor:
    def __init__(
        self,
        store: Store,
        frames_dir: Path,
        reader_factory: Callable[[], TextReader] = RapidOcrReader,
        tracker: SessionTracker | None = None,
    ) -> None:
        self.store = store
        self.frames_dir = frames_dir
        self.tracker = tracker or SessionTracker()
        self._reader_factory = reader_factory
        self._reader: TextReader | None = None
        # Frames are only written to disk if the tracker ends up using them.
        # Until then they are held here under a temporary (negative) id.
        self._next_temp_id = -1
        self._pending: dict[int, bytes] = {}
        self._saved: dict[int, int] = {}

    @property
    def reader(self) -> TextReader:
        # Loading the OCR models takes about a second, so do it on first use.
        if self._reader is None:
            self._reader = self._reader_factory()
        return self._reader

    def analyze(self, data: bytes) -> Observation:
        """Read one frame. CPU-heavy and free of shared state, so it may run
        on a worker thread; call `apply` with the result afterwards."""
        temp_id = self._next_temp_id
        self._next_temp_id -= 1
        return analyze_frame(decode_image(data), self.reader, frame_id=temp_id)

    def apply(
        self, data: bytes, obs: Observation, captured_at: str | None = None
    ) -> dict[str, Any] | None:
        """Advance the tracker with an analysed frame. Returns the stored game
        when this frame completed one."""
        if obs.frame_id is not None:
            self._pending[obs.frame_id] = data
        completed = self.tracker.observe(obs)
        game = self._record(completed, captured_at) if completed else None
        self._prune()
        return game

    def flush(self, captured_at: str | None = None) -> dict[str, Any] | None:
        """Settle a game caught mid-ending when the frame stream stops."""
        completed = self.tracker.flush()
        game = self._record(completed, captured_at) if completed else None
        self._prune()
        return game

    def state(self) -> dict[str, Any]:
        """The tracker's live state, with the matchup frame made servable."""
        state = self.tracker.state
        frame_id = self._persist(self.tracker.matchup_frame_id, "player_matchup")
        state["start_frame_url"] = f"/api/frames/{frame_id}/image" if frame_id is not None else None
        return state

    def _record(self, completed: CompletedGame, captured_at: str | None) -> dict[str, Any]:
        completed = replace(
            completed,
            start_frame_id=self._persist(completed.start_frame_id, "player_matchup"),
            end_frame_id=self._persist(completed.end_frame_id, "end_game"),
        )
        return record_completed_game(self.store, completed, date=captured_at)

    def _persist(self, temp_id: int | None, kind: str) -> int | None:
        """Write a held frame to disk and return its database id."""
        if temp_id is None:
            return None
        if temp_id in self._saved:
            return self._saved[temp_id]
        data = self._pending.get(temp_id)
        if data is None:
            return None
        extension = "png" if data.startswith(b"\x89PNG") else "jpg"
        filename = f"{uuid.uuid4().hex}.{extension}"
        (self.frames_dir / filename).write_bytes(data)
        frame = self.store.create_frame(kind, filename)
        self._saved[temp_id] = frame["id"]
        return frame["id"]

    def _prune(self) -> None:
        keep = {self.tracker.matchup_frame_id, self.tracker.end_frame_id}
        self._pending = {k: v for k, v in self._pending.items() if k in keep}
        self._saved = {k: v for k, v in self._saved.items() if k in keep}
