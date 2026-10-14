"""SQLite storage for opponents, games and captured frames.

Per-opponent totals (wins, losses, win rate, last played) are derived from the
games table on read, so they can never drift out of sync with it.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

SCHEMA = """
CREATE TABLE IF NOT EXISTS opponents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gamertag TEXT,
  overall INTEGER,
  build TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS frames (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  label TEXT,
  captured_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opponent_id INTEGER NOT NULL REFERENCES opponents(id) ON DELETE CASCADE,
  your_score INTEGER NOT NULL,
  opponent_score INTEGER NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('win', 'loss')),
  game_type TEXT NOT NULL DEFAULT 'Rec',
  date TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual', 'capture')),
  start_frame_id INTEGER REFERENCES frames(id) ON DELETE SET NULL,
  end_frame_id INTEGER REFERENCES frames(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_games_opponent_id ON games(opponent_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
"""

# Opponent rows joined with their head-to-head totals.
_OPPONENT_SELECT = """
SELECT
  o.id, o.name, o.gamertag, o.overall, o.level, o.build, o.created_at,
  COUNT(g.id) AS total_games,
  COALESCE(SUM(g.outcome = 'win'), 0) AS wins,
  COALESCE(SUM(g.outcome = 'loss'), 0) AS losses,
  MAX(g.date) AS last_played
FROM opponents o
LEFT JOIN games g ON g.opponent_id = o.id
"""

FRAME_KINDS = ("matchup", "player_matchup", "end_game", "in_game", "stats_photo", "other")


def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def connect(db_path: Path | str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    # Columns added after the first release are created by the checks below,
    # so the same code path serves new and existing databases.
    conn.executescript(SCHEMA)
    # Databases created before the stats table was read lack this column.
    if "level" not in {row["name"] for row in conn.execute("PRAGMA table_info(opponents)")}:
        conn.execute("ALTER TABLE opponents ADD COLUMN level INTEGER")
    columns = {row["name"] for row in conn.execute("PRAGMA table_info(games)")}
    if "stats" not in columns:
        conn.execute("ALTER TABLE games ADD COLUMN stats TEXT")
    if "stats_frame_id" not in columns:
        conn.execute(
            "ALTER TABLE games ADD COLUMN stats_frame_id INTEGER"
            " REFERENCES frames(id) ON DELETE SET NULL"
        )
    return conn


def _frame_url(frame_id: int | None) -> str | None:
    return f"/api/frames/{frame_id}/image" if frame_id is not None else None


def _opponent(row: sqlite3.Row) -> dict[str, Any]:
    total = row["total_games"]
    return {
        "id": row["id"],
        "name": row["name"],
        "gamertag": row["gamertag"],
        "overall": row["overall"],
        "level": row["level"],
        "build": row["build"],
        "total_games": total,
        "wins": row["wins"],
        "losses": row["losses"],
        "win_rate": (row["wins"] / total * 100) if total else 0.0,
        "last_played": row["last_played"],
        "created_at": row["created_at"],
    }


def _game(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "opponent_id": row["opponent_id"],
        "your_score": row["your_score"],
        "opponent_score": row["opponent_score"],
        "outcome": row["outcome"],
        "game_type": row["game_type"],
        "date": row["date"],
        "source": row["source"],
        "stats": json.loads(row["stats"]) if row["stats"] else None,
        "start_frame_path": _frame_url(row["start_frame_id"]),
        "end_frame_path": _frame_url(row["end_frame_id"]),
        "stats_photo_path": _frame_url(row["stats_frame_id"]),
    }


class Store:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    # Opponents -----------------------------------------------------------

    def list_opponents(self, query: str | None = None) -> list[dict[str, Any]]:
        sql = _OPPONENT_SELECT
        params: tuple[Any, ...] = ()
        if query:
            sql += " WHERE o.name LIKE ? OR o.gamertag LIKE ?"
            params = (f"%{query}%", f"%{query}%")
        # Most recently played first; never-played opponents last, newest first.
        sql += " GROUP BY o.id ORDER BY last_played IS NULL, last_played DESC, o.id DESC"
        return [_opponent(r) for r in self.conn.execute(sql, params)]

    def get_opponent(self, opponent_id: int) -> dict[str, Any] | None:
        row = self.conn.execute(
            _OPPONENT_SELECT + " WHERE o.id = ? GROUP BY o.id", (opponent_id,)
        ).fetchone()
        return _opponent(row) if row else None

    def create_opponent(
        self,
        name: str,
        gamertag: str | None = None,
        overall: int | None = None,
        build: str | None = None,
    ) -> dict[str, Any]:
        with self.conn:
            cur = self.conn.execute(
                "INSERT INTO opponents (name, gamertag, overall, build, created_at)"
                " VALUES (?, ?, ?, ?, ?)",
                (name, gamertag, overall, build, now_iso()),
            )
        opponent = self.get_opponent(cur.lastrowid)
        assert opponent is not None
        return opponent

    def update_opponent(self, opponent_id: int, fields: dict[str, Any]) -> dict[str, Any] | None:
        allowed = {
            k: v
            for k, v in fields.items()
            if k in ("name", "gamertag", "overall", "level", "build")
        }
        if allowed:
            assignments = ", ".join(f"{column} = ?" for column in allowed)
            with self.conn:
                self.conn.execute(
                    f"UPDATE opponents SET {assignments} WHERE id = ?",
                    (*allowed.values(), opponent_id),
                )
        return self.get_opponent(opponent_id)

    def delete_opponent(self, opponent_id: int) -> bool:
        with self.conn:
            cur = self.conn.execute("DELETE FROM opponents WHERE id = ?", (opponent_id,))
        return cur.rowcount > 0

    # Games ---------------------------------------------------------------

    def list_games(self, opponent_id: int | None = None) -> list[dict[str, Any]]:
        sql = "SELECT * FROM games"
        params: tuple[Any, ...] = ()
        if opponent_id is not None:
            sql += " WHERE opponent_id = ?"
            params = (opponent_id,)
        sql += " ORDER BY date DESC, id DESC"
        return [_game(r) for r in self.conn.execute(sql, params)]

    def get_game(self, game_id: int) -> dict[str, Any] | None:
        row = self.conn.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
        return _game(row) if row else None

    def create_game(
        self,
        opponent_id: int,
        your_score: int,
        opponent_score: int,
        game_type: str = "Rec",
        date: str | None = None,
        source: str = "manual",
        start_frame_id: int | None = None,
        end_frame_id: int | None = None,
        stats: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if your_score == opponent_score:
            raise ValueError("A game cannot end in a tie")
        outcome = "win" if your_score > opponent_score else "loss"
        with self.conn:
            cur = self.conn.execute(
                "INSERT INTO games (opponent_id, your_score, opponent_score, outcome, game_type,"
                " date, source, start_frame_id, end_frame_id, stats)"
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    opponent_id,
                    your_score,
                    opponent_score,
                    outcome,
                    game_type,
                    date or now_iso(),
                    source,
                    start_frame_id,
                    end_frame_id,
                    json.dumps(stats) if stats else None,
                ),
            )
        game = self.get_game(cur.lastrowid)
        assert game is not None
        return game

    def update_game(self, game_id: int, fields: dict[str, Any]) -> dict[str, Any] | None:
        allowed = {k: v for k, v in fields.items() if k in ("game_type", "stats", "stats_frame_id")}
        if "stats" in allowed:
            allowed["stats"] = json.dumps(allowed["stats"]) if allowed["stats"] else None
        if allowed:
            assignments = ", ".join(f"{column} = ?" for column in allowed)
            with self.conn:
                self.conn.execute(
                    f"UPDATE games SET {assignments} WHERE id = ?", (*allowed.values(), game_id)
                )
        return self.get_game(game_id)

    def delete_game(self, game_id: int) -> bool:
        with self.conn:
            cur = self.conn.execute("DELETE FROM games WHERE id = ?", (game_id,))
        return cur.rowcount > 0

    # Statistics ----------------------------------------------------------

    def statistics(self) -> dict[str, Any]:
        outcomes = [
            r["outcome"]
            for r in self.conn.execute("SELECT outcome FROM games ORDER BY date DESC, id DESC")
        ]
        wins = outcomes.count("win")
        total = len(outcomes)

        # Signed streak: positive for consecutive wins, negative for losses.
        streak = 0
        for outcome in outcomes:
            if outcome != outcomes[0]:
                break
            streak += 1
        if outcomes and outcomes[0] == "loss":
            streak = -streak

        frequent = sorted(self.list_opponents(), key=lambda o: o["total_games"], reverse=True)
        return {
            "total_games": total,
            "total_wins": wins,
            "total_losses": total - wins,
            "overall_win_rate": (wins / total * 100) if total else 0.0,
            "current_streak": streak,
            "most_frequent_opponents": frequent[:5],
        }

    # Frames --------------------------------------------------------------

    def create_frame(
        self, kind: str, path: str, label: str | None = None, captured_at: str | None = None
    ) -> dict[str, Any]:
        if kind not in FRAME_KINDS:
            raise ValueError(f"Unknown frame kind: {kind}")
        with self.conn:
            cur = self.conn.execute(
                "INSERT INTO frames (kind, path, label, captured_at) VALUES (?, ?, ?, ?)",
                (kind, path, label, captured_at or now_iso()),
            )
        frame = self.get_frame(cur.lastrowid)
        assert frame is not None
        return frame

    def get_frame(self, frame_id: int) -> dict[str, Any] | None:
        row = self.conn.execute("SELECT * FROM frames WHERE id = ?", (frame_id,)).fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "kind": row["kind"],
            "path": row["path"],
            "label": row["label"],
            "captured_at": row["captured_at"],
            "url": _frame_url(row["id"]),
        }

    def latest_frame_time(self) -> str | None:
        row = self.conn.execute("SELECT MAX(captured_at) AS latest FROM frames").fetchone()
        return row["latest"]
