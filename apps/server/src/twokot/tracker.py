"""Recording results: resolve who the opponent is, then store the game."""

from __future__ import annotations

from typing import Any

from .db import Store
from .matching import DEFAULT_THRESHOLD, find_best_match
from .session import CompletedGame


def resolve_opponent(
    store: Store,
    name: str,
    overall: int | None = None,
    build: str | None = None,
    level: int | None = None,
    threshold: float = DEFAULT_THRESHOLD,
) -> dict[str, Any]:
    """Find the opponent this name refers to, creating one when none is close."""
    match = find_best_match(name, store.list_opponents(), threshold)
    if match is None:
        opponent = store.create_opponent(name, overall=overall, build=build)
        return store.update_opponent(opponent["id"], {"level": level}) if level else opponent

    opponent = dict(match.opponent)
    # Ratings and builds change between games; keep the latest seen.
    readings = (("overall", overall), ("build", build), ("level", level))
    updates = {k: v for k, v in readings if v is not None}
    if updates:
        opponent = store.update_opponent(opponent["id"], updates) or opponent
    return opponent


def record_completed_game(
    store: Store, game: CompletedGame, date: str | None = None
) -> dict[str, Any]:
    """Store a game the session tracker saw finish."""
    opponent = resolve_opponent(
        store,
        game.opponent_name,
        game.opponent_overall,
        game.opponent_build,
        game.opponent_level,
    )
    if date:
        # Replaying the same recording twice must not record its game twice.
        for existing in store.list_games(opponent["id"]):
            if existing["source"] == "capture" and existing["date"] == date:
                return existing
    return store.create_game(
        opponent_id=opponent["id"],
        your_score=game.your_score,
        opponent_score=game.opponent_score,
        game_type=game.game_type or "Unknown",
        date=date,
        source="capture",
        start_frame_id=game.start_frame_id,
        end_frame_id=game.end_frame_id,
        stats=game.stats,
    )
