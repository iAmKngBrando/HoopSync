"""HTTP API used by the dashboard and the capture tool."""

from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, model_validator

from .config import Settings, load_settings
from .db import FRAME_KINDS, Store, connect
from .live import FrameProcessor
from .tracker import resolve_opponent
from .vision.preprocess import decode_image
from .vision.stats_table import STAT_COLUMNS, read_stats_image

# Frames newer than this mean a capture source is actively sending.
CAPTURE_ACTIVE_SECONDS = 15
MAX_FRAME_BYTES = 20 * 1024 * 1024


class OpponentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    gamertag: str | None = Field(default=None, max_length=80)
    overall: int | None = Field(default=None, ge=40, le=99)
    build: str | None = Field(default=None, max_length=80)


class OpponentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    gamertag: str | None = Field(default=None, max_length=80)
    overall: int | None = Field(default=None, ge=40, le=99)
    level: int | None = Field(default=None, ge=1, le=99)
    build: str | None = Field(default=None, max_length=80)


StatValue = int | str
MAX_PHOTO_BYTES = 30 * 1024 * 1024


class GameUpdate(BaseModel):
    game_type: str | None = Field(default=None, min_length=1, max_length=40)
    # {"you": {"PTS": 18, "FGM/FGA": "8/13"}, "opponent": {...}}; null clears it.
    stats: dict[str, dict[str, StatValue]] | None = None

    @model_validator(mode="after")
    def _check(self) -> GameUpdate:
        for side, row in (self.stats or {}).items():
            if side not in ("you", "opponent"):
                raise ValueError("stats sides must be 'you' and 'opponent'")
            for column, value in row.items():
                if column not in STAT_COLUMNS:
                    raise ValueError(f"Unknown stat column: {column}")
                if isinstance(value, str) and len(value) > 12:
                    raise ValueError(f"{column} value is too long")
        return self


class GameResultCreate(BaseModel):
    """Give either an existing opponent's id or a name to match or create."""

    opponent_id: int | None = None
    opponent_name: str | None = Field(default=None, min_length=1, max_length=80)
    your_score: int = Field(ge=0, le=999)
    opponent_score: int = Field(ge=0, le=999)
    game_type: str = Field(default="Rec", min_length=1, max_length=40)
    date: str | None = None

    @model_validator(mode="after")
    def _check(self) -> GameResultCreate:
        if self.opponent_id is None and not self.opponent_name:
            raise ValueError("Provide opponent_id or opponent_name")
        if self.your_score == self.opponent_score:
            raise ValueError("A game cannot end in a tie")
        if self.date is not None:
            datetime.fromisoformat(self.date)
        return self


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or load_settings()
    settings.ensure_dirs()
    store = Store(connect(settings.db_path))
    processor = FrameProcessor(store, settings.frames_dir)
    # Frames must be analysed one at a time and in order.
    analysis_lock = asyncio.Lock()
    last_analysis: dict[str, datetime | None] = {"at": None}

    app = FastAPI(title="2KOT server", version="0.1.0")
    app.state.store = store
    app.state.processor = processor
    # The dashboard and capture tool run on other localhost ports during development.
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Handlers are async so they run one at a time on the event loop; the shared
    # SQLite connection is never used from two threads at once.
    api = APIRouter(prefix="/api")

    @api.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    # Opponents -----------------------------------------------------------

    @api.get("/opponents")
    async def list_opponents(q: str | None = None) -> list[dict[str, Any]]:
        return store.list_opponents(q)

    @api.post("/opponents", status_code=201)
    async def create_opponent(body: OpponentCreate) -> dict[str, Any]:
        return store.create_opponent(body.name.strip(), body.gamertag, body.overall, body.build)

    @api.get("/opponents/{opponent_id}")
    async def get_opponent(opponent_id: int) -> dict[str, Any]:
        opponent = store.get_opponent(opponent_id)
        if opponent is None:
            raise HTTPException(404, "Opponent not found")
        return opponent

    @api.patch("/opponents/{opponent_id}")
    async def update_opponent(opponent_id: int, body: OpponentUpdate) -> dict[str, Any]:
        if store.get_opponent(opponent_id) is None:
            raise HTTPException(404, "Opponent not found")
        updated = store.update_opponent(opponent_id, body.model_dump(exclude_unset=True))
        assert updated is not None
        return updated

    @api.delete("/opponents/{opponent_id}", status_code=204)
    async def delete_opponent(opponent_id: int) -> None:
        if not store.delete_opponent(opponent_id):
            raise HTTPException(404, "Opponent not found")

    # Games ---------------------------------------------------------------

    @api.get("/games")
    async def list_games(opponent_id: int | None = None) -> list[dict[str, Any]]:
        return store.list_games(opponent_id)

    @api.post("/game_result", status_code=201)
    async def create_game_result(body: GameResultCreate) -> dict[str, Any]:
        if body.opponent_id is not None:
            opponent = store.get_opponent(body.opponent_id)
            if opponent is None:
                raise HTTPException(404, "Opponent not found")
        else:
            assert body.opponent_name is not None
            # A typed name must match exactly (ignoring case and punctuation);
            # the fuzzy threshold is reserved for OCR output.
            opponent = resolve_opponent(store, body.opponent_name.strip(), threshold=1.0)
        return store.create_game(
            opponent_id=opponent["id"],
            your_score=body.your_score,
            opponent_score=body.opponent_score,
            game_type=body.game_type.strip(),
            date=body.date,
        )

    @api.patch("/games/{game_id}")
    async def update_game(game_id: int, body: GameUpdate) -> dict[str, Any]:
        if store.get_game(game_id) is None:
            raise HTTPException(404, "Game not found")
        updated = store.update_game(game_id, body.model_dump(exclude_unset=True))
        assert updated is not None
        return updated

    @api.post("/games/{game_id}/stats_photo")
    async def read_stats_photo(game_id: int, file: UploadFile = File(...)) -> dict[str, Any]:
        """Read a stats table from a photo or screenshot of a finished game.

        The photo is kept with the game. The stats read from it are returned
        for review, not saved: the caller confirms them with PATCH."""
        game = store.get_game(game_id)
        if game is None:
            raise HTTPException(404, "Game not found")
        data = await file.read(MAX_PHOTO_BYTES + 1)
        if len(data) > MAX_PHOTO_BYTES:
            raise HTTPException(413, "Photo is too large")
        try:
            image = decode_image(data)
        except ValueError:
            raise HTTPException(422, "File is not a readable image") from None

        opponent = store.get_opponent(game["opponent_id"])
        async with analysis_lock:
            stats = await run_in_threadpool(
                read_stats_image,
                image,
                processor.reader,
                processor.tracker.state["your_name"],
                opponent["name"] if opponent else None,
            )

        extension = "png" if data.startswith(b"\x89PNG") else "jpg"
        filename = f"{uuid.uuid4().hex}.{extension}"
        (settings.frames_dir / filename).write_bytes(data)
        frame = store.create_frame("stats_photo", filename)
        store.update_game(game_id, {"stats_frame_id": frame["id"]})

        # Points in the photo should match the score already recorded.
        warnings = []
        for side, key, label in (
            ("you", "your_score", "your"),
            ("opponent", "opponent_score", "the opponent's"),
        ):
            points = stats.get(side, {}).get("PTS")
            if points is None:
                warnings.append(f"Could not read {label} points.")
            elif points != game[key]:
                warnings.append(
                    f"Read {points} for {label} points, but the recorded score is {game[key]}."
                )
        return {"stats": stats, "photo_url": frame["url"], "warnings": warnings}

    @api.delete("/games/{game_id}", status_code=204)
    async def delete_game(game_id: int) -> None:
        if not store.delete_game(game_id):
            raise HTTPException(404, "Game not found")

    # Statistics ----------------------------------------------------------

    @api.get("/stats")
    async def stats() -> dict[str, Any]:
        return store.statistics()

    @api.get("/stats/{opponent_id}")
    async def opponent_stats(opponent_id: int) -> dict[str, Any]:
        opponent = store.get_opponent(opponent_id)
        if opponent is None:
            raise HTTPException(404, "Opponent not found")
        return {"opponent": opponent, "games": store.list_games(opponent_id)}

    # Frames --------------------------------------------------------------

    @api.post("/frames", status_code=201)
    async def upload_frame(
        file: UploadFile = File(...),
        kind: str = Form("other"),
        label: str | None = Form(None),
        captured_at: str | None = Form(None),
    ) -> dict[str, Any]:
        if kind not in FRAME_KINDS:
            raise HTTPException(422, f"kind must be one of {', '.join(FRAME_KINDS)}")
        data = await file.read(MAX_FRAME_BYTES + 1)
        if len(data) > MAX_FRAME_BYTES:
            raise HTTPException(413, "Frame is too large")
        try:
            decode_image(data)
        except ValueError:
            raise HTTPException(422, "File is not a readable image") from None

        extension = "png" if data.startswith(b"\x89PNG") else "jpg"
        # Server-generated name: nothing from the upload reaches the filesystem path.
        filename = f"{uuid.uuid4().hex}.{extension}"
        (settings.frames_dir / filename).write_bytes(data)
        frame = store.create_frame(kind, filename, label, captured_at)
        frame.pop("path")
        return frame

    @api.post("/frames/analyze")
    async def analyze_frame_upload(
        file: UploadFile = File(...), captured_at: str | None = Form(None)
    ) -> dict[str, Any]:
        """Read one captured frame and advance the live game session. Only
        frames the tracker uses (the matchup and the result) are stored."""
        data = await file.read(MAX_FRAME_BYTES + 1)
        if len(data) > MAX_FRAME_BYTES:
            raise HTTPException(413, "Frame is too large")
        async with analysis_lock:
            try:
                # Screen reading is CPU-bound; keep it off the event loop.
                observation = await run_in_threadpool(processor.analyze, data)
            except ValueError:
                raise HTTPException(422, "File is not a readable image") from None
            game = processor.apply(data, observation, captured_at)
            last_analysis["at"] = datetime.now(UTC)
        return {"kind": observation.kind.value, "session": processor.state(), "game": game}

    @api.get("/frames/{frame_id}/image")
    async def frame_image(frame_id: int) -> FileResponse:
        frame = store.get_frame(frame_id)
        path = settings.frames_dir / frame["path"] if frame else None
        if path is None or not path.is_file():
            raise HTTPException(404, "Frame not found")
        return FileResponse(path)

    # Live state ----------------------------------------------------------

    @api.get("/live")
    async def live() -> dict[str, Any]:
        # A capture source counts as connected only while its frames arrive.
        seen = last_analysis["at"]
        stored = store.latest_frame_time()
        if stored:
            try:
                stored_at = datetime.fromisoformat(stored)
                if stored_at.tzinfo is None:
                    stored_at = stored_at.replace(tzinfo=UTC)
                seen = max(seen, stored_at) if seen else stored_at
            except ValueError:
                pass
        active = bool(seen) and (datetime.now(UTC) - seen).total_seconds() <= CAPTURE_ACTIVE_SECONDS
        latest = seen.isoformat(timespec="seconds") if seen else None
        return {
            "capture_state": "connected" if active else "disconnected",
            "last_frame_at": latest,
            "session": processor.state(),
        }

    app.include_router(api)
    return app
