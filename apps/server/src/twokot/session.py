"""Game session tracking.

Turns a stream of per-frame screen observations into game lifecycle events:

    idle -> pregame -> in_progress -> ended -> idle

A screen type must be seen on several consecutive frames before it is acted
on, so a single misclassified frame cannot start or finish a game. Every value
(names, ratings, scores) is read on many frames; the tracker keeps a tally and
uses the most common reading, so one misread frame cannot corrupt a result.

The tracker is independent of how observations are produced, so it works the
same for the vision pipeline and for tests.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from .matching import similarity


class ScreenKind(str, Enum):
    """Screens the pipeline recognises. Values match the capture tool's labels."""

    MY_PLAYER = "my_player_load_screen"
    OPPONENT_PLAYER = "opponent_player_load_screen"
    MATCHUP = "player_matchup"
    IN_GAME = "in_game"
    GAME_RESULT = "game_result"
    WINNERS_CIRCLE = "winners_circle"
    GAME_STATS = "final_game_stats"
    OTHER = "other"


PREGAME_SCREENS = (ScreenKind.MY_PLAYER, ScreenKind.OPPONENT_PLAYER, ScreenKind.MATCHUP)
END_SCREENS = (ScreenKind.GAME_RESULT, ScreenKind.WINNERS_CIRCLE, ScreenKind.GAME_STATS)


class Phase(str, Enum):
    IDLE = "idle"
    PREGAME = "pregame"
    IN_PROGRESS = "in_progress"
    ENDED = "ended"


@dataclass(frozen=True)
class PlayerRead:
    """What one frame showed about one player. Any field may be unreadable."""

    name: str | None = None
    overall: int | None = None
    level: int | None = None
    build: str | None = None
    position: str | None = None


@dataclass(frozen=True)
class Observation:
    """What one captured frame was recognised as."""

    kind: ScreenKind
    # Player load screens: the single player shown.
    player: PlayerRead | None = None
    # Matchup screen: the two players as laid out left and right.
    left: PlayerRead | None = None
    right: PlayerRead | None = None
    # In game: the scoreboard as laid out left and right.
    left_score: int | None = None
    right_score: int | None = None
    left_name: str | None = None
    right_name: str | None = None
    # Result screen.
    outcome: str | None = None
    score_pair: tuple[int, int] | None = None
    # Final stats table.
    your_points: int | None = None
    opponent_points: int | None = None
    stats: dict[str, Any] | None = None
    mode: str | None = None
    frame_id: int | None = None


@dataclass(frozen=True)
class CompletedGame:
    opponent_name: str
    your_score: int
    opponent_score: int
    opponent_overall: int | None = None
    opponent_build: str | None = None
    opponent_level: int | None = None
    game_type: str | None = None
    stats: dict[str, Any] | None = None
    start_frame_id: int | None = None
    end_frame_id: int | None = None


class Tally:
    """Weighted vote over repeated readings of one value."""

    def __init__(self) -> None:
        self._votes: Counter[Any] = Counter()

    def add(self, value: Any, weight: int = 1) -> None:
        if value is not None:
            self._votes[value] += weight

    @property
    def best(self) -> Any:
        return self._votes.most_common(1)[0][0] if self._votes else None

    @property
    def best_count(self) -> int:
        return self._votes.most_common(1)[0][1] if self._votes else 0


class PlayerTally:
    def __init__(self) -> None:
        self.name = Tally()
        self.overall = Tally()
        self.level = Tally()
        self.build = Tally()
        self.position = Tally()

    def add(self, read: PlayerRead | None, weight: int = 1) -> None:
        if read is None:
            return
        self.name.add(read.name, weight)
        self.overall.add(read.overall, weight)
        self.level.add(read.level, weight)
        self.build.add(read.build, weight)
        self.position.add(read.position, weight)

    def as_dict(self) -> dict[str, Any]:
        return {
            "name": self.name.best,
            "overall": self.overall.best,
            "level": self.level.best,
            "build": self.build.best,
            "position": self.position.best,
        }


def _fuller(current: dict[str, Any] | None, new: dict[str, Any] | None) -> dict[str, Any] | None:
    """Keep whichever reading of the stats table recovered more cells."""

    def cells(stats: dict[str, Any] | None) -> int:
        return sum(len(row) for row in (stats or {}).values())

    return new if cells(new) > cells(current) else current


# The matchup screen prints ratings and builds larger and cleaner than the
# player cards do, so its readings outvote the cards'.
MATCHUP_WEIGHT = 3


@dataclass
class _Game:
    """Everything gathered about the game currently being watched."""

    you: PlayerTally = field(default_factory=PlayerTally)
    opponent: PlayerTally = field(default_factory=PlayerTally)
    mode: Tally = field(default_factory=Tally)
    outcome: Tally = field(default_factory=Tally)
    score_pair: Tally = field(default_factory=Tally)
    your_points: Tally = field(default_factory=Tally)
    opponent_points: Tally = field(default_factory=Tally)
    your_live_score: int | None = None
    opponent_live_score: int | None = None
    stats: dict[str, Any] | None = None
    matchup_frame_id: int | None = None
    end_frame_id: int | None = None
    end_screen_seen: bool = False


@dataclass
class SessionTracker:
    """Feed observations in capture order; completed games come back out."""

    # Consecutive frames of one screen type needed before acting on it.
    confirm_frames: int = 3
    # Unrecognised frames in a row, after an end screen, before the result is
    # settled with what has been read. Long enough to sit through the winners'
    # circle and recap pages that come between the result and the stats table.
    settle_frames: int = 40
    phase: Phase = Phase.IDLE
    _game: _Game = field(default_factory=_Game)
    _streak_kind: ScreenKind | None = None
    _streak: int = 0

    # Public state --------------------------------------------------------

    @property
    def state(self) -> dict[str, Any]:
        game = self._game
        opponent = game.opponent.as_dict()
        return {
            "phase": self.phase.value,
            "opponent_name": opponent["name"],
            "opponent_overall": opponent["overall"],
            "opponent_build": opponent["build"],
            "opponent_level": opponent["level"],
            "your_name": game.you.name.best,
            "your_score": game.your_live_score,
            "opponent_score": game.opponent_live_score,
            "mode": game.mode.best,
            "quarter": None,
            "clock": None,
            "start_frame_url": (
                f"/api/frames/{game.matchup_frame_id}/image"
                if game.matchup_frame_id is not None
                else None
            ),
        }

    @property
    def matchup_frame_id(self) -> int | None:
        return self._game.matchup_frame_id

    @property
    def end_frame_id(self) -> int | None:
        return self._game.end_frame_id

    def reset(self) -> None:
        self.phase = Phase.IDLE
        self._game = _Game()
        self._streak_kind = None
        self._streak = 0

    # Observations --------------------------------------------------------

    def observe(self, obs: Observation) -> CompletedGame | None:
        if obs.kind == self._streak_kind:
            self._streak += 1
        else:
            self._streak_kind = obs.kind
            self._streak = 1
        confirmed = self._streak >= self.confirm_frames
        # Act once, on the frame that confirms the screen, not on every frame after.
        just_confirmed = self._streak == self.confirm_frames

        completed: CompletedGame | None = None

        if obs.kind in PREGAME_SCREENS:
            if just_confirmed and self.phase != Phase.PREGAME:
                # A new game is loading. A game still in progress never reached
                # its result screen, so it is dropped rather than guessed at.
                completed = self._finish() if self._game.end_screen_seen else None
                self._game = _Game()
                self.phase = Phase.PREGAME
            if self.phase == Phase.PREGAME:
                self._absorb_pregame(obs)

        elif obs.kind == ScreenKind.IN_GAME:
            if just_confirmed and self.phase == Phase.PREGAME:
                self.phase = Phase.IN_PROGRESS
            if self.phase == Phase.IN_PROGRESS and not self._game.end_screen_seen:
                self._absorb_scoreboard(obs)

        elif obs.kind in END_SCREENS:
            if self.phase in (Phase.PREGAME, Phase.IN_PROGRESS):
                if confirmed:
                    self._game.end_screen_seen = True
                self._absorb_end(obs)
                if self._result_is_certain():
                    completed = self._finish()

        elif obs.kind == ScreenKind.OTHER:
            if self._game.end_screen_seen and self._streak >= self.settle_frames:
                # The end sequence is over; settle with what was read.
                completed = self._finish()
            elif self.phase == Phase.ENDED and self._streak == self.settle_frames:
                self.reset()

        return completed

    def flush(self) -> CompletedGame | None:
        """Call when the frame stream stops, to settle a game caught mid-ending."""
        if self._game.end_screen_seen and self.phase != Phase.ENDED:
            return self._finish()
        return None

    # Internals -----------------------------------------------------------

    def _absorb_pregame(self, obs: Observation) -> None:
        game = self._game
        game.mode.add(obs.mode)
        if obs.kind == ScreenKind.MY_PLAYER:
            game.you.add(obs.player)
        elif obs.kind == ScreenKind.OPPONENT_PLAYER:
            game.opponent.add(obs.player)
        elif obs.kind == ScreenKind.MATCHUP:
            you, opponent = self._sides(obs.left, obs.right)
            game.you.add(you, MATCHUP_WEIGHT)
            game.opponent.add(opponent, MATCHUP_WEIGHT)
            # Keep a matchup frame from a few frames in, once the screen has
            # finished animating, to show on the dashboard during the game.
            if obs.frame_id is not None and self._streak <= self.confirm_frames + 2:
                game.matchup_frame_id = obs.frame_id

    def _sides(
        self, left: PlayerRead | None, right: PlayerRead | None
    ) -> tuple[PlayerRead | None, PlayerRead | None]:
        """Work out which side of a left/right layout is you."""
        if self._you_are_on_the_right(left.name if left else None, right.name if right else None):
            return right, left
        return left, right

    def _you_are_on_the_right(self, left_name: str | None, right_name: str | None) -> bool:
        game = self._game
        mine, theirs = game.you.name.best, game.opponent.name.best

        def score(candidate: str | None, known: str | None) -> float:
            return similarity(candidate, known) if candidate and known else 0.0

        as_laid_out = score(left_name, mine) + score(right_name, theirs)
        swapped = score(right_name, mine) + score(left_name, theirs)
        # With no evidence either way, you are on the left (the observed layout).
        return swapped > as_laid_out + 0.2

    def _absorb_scoreboard(self, obs: Observation) -> None:
        game = self._game
        game.mode.add(obs.mode)
        if obs.left_score is None or obs.right_score is None:
            return
        # Which score is yours is only known when the names over the
        # scoreboard can be told apart; otherwise no live score is claimed.
        mine, theirs = game.you.name.best, game.opponent.name.best
        if not (mine and theirs and obs.left_name and obs.right_name):
            return
        left_is_me = similarity(obs.left_name, mine) + similarity(obs.right_name, theirs)
        right_is_me = similarity(obs.right_name, mine) + similarity(obs.left_name, theirs)
        if abs(left_is_me - right_is_me) < 0.2:
            return
        if left_is_me > right_is_me:
            game.your_live_score, game.opponent_live_score = obs.left_score, obs.right_score
        else:
            game.your_live_score, game.opponent_live_score = obs.right_score, obs.left_score

    def _absorb_end(self, obs: Observation) -> None:
        game = self._game
        game.outcome.add(obs.outcome)
        game.score_pair.add(tuple(sorted(obs.score_pair)) if obs.score_pair else None)
        game.your_points.add(obs.your_points)
        game.opponent_points.add(obs.opponent_points)
        game.stats = _fuller(game.stats, obs.stats)
        if obs.frame_id is not None and obs.kind in (ScreenKind.GAME_RESULT, ScreenKind.GAME_STATS):
            game.end_frame_id = obs.frame_id

    def _final_scores(self) -> tuple[int, int] | None:
        """(your score, opponent score) from the best evidence, or None."""
        game = self._game
        outcome, pair = game.outcome.best, game.score_pair.best
        yours, theirs = game.your_points.best, game.opponent_points.best

        from_table = (yours, theirs) if yours is not None and theirs is not None else None
        from_result = None
        if outcome and pair and pair[0] != pair[1]:
            low, high = pair
            # The result screen does not say whose score is whose, but the
            # winner's is the higher one.
            from_result = (high, low) if outcome == "win" else (low, high)

        if from_result and from_table and from_result != from_table:
            # Disagreement: trust whichever was read more often.
            table_votes = min(game.your_points.best_count, game.opponent_points.best_count)
            return from_table if table_votes > game.score_pair.best_count else from_result
        scores = from_result or from_table
        return scores if scores and scores[0] != scores[1] else None

    def _result_is_certain(self) -> bool:
        """True once the result screen and the stats table agree on the score."""
        game = self._game
        outcome, pair = game.outcome.best, game.score_pair.best
        yours, theirs = game.your_points.best, game.opponent_points.best
        if not (outcome and pair) or yours is None or theirs is None:
            return False
        if game.score_pair.best_count < 2 or game.your_points.best_count < 2:
            return False
        expected = (max(pair), min(pair)) if outcome == "win" else (min(pair), max(pair))
        return (yours, theirs) == expected

    def _finish(self) -> CompletedGame | None:
        game = self._game
        scores = self._final_scores()
        name = game.opponent.name.best
        self.phase = Phase.ENDED
        game.end_screen_seen = False
        if not name or scores is None:
            # Not enough was readable to record a result honestly.
            return None
        mode = game.mode.best
        return CompletedGame(
            opponent_name=name,
            your_score=scores[0],
            opponent_score=scores[1],
            opponent_overall=game.opponent.overall.best,
            opponent_build=game.opponent.build.best,
            opponent_level=game.opponent.level.best,
            game_type=mode,
            stats=game.stats,
            start_frame_id=game.matchup_frame_id,
            end_frame_id=game.end_frame_id,
        )
