"""Screen recognition against real captured frames (see fixtures/frames)."""

import json
from pathlib import Path

import cv2
import pytest

from twokot.session import ScreenKind
from twokot.vision.pipeline import analyze_frame
from twokot.vision.reader import RapidOcrReader

FRAMES = Path(__file__).parent / "fixtures" / "frames"
EXPECTED = json.loads((FRAMES / "expected.json").read_text())


@pytest.fixture(scope="module")
def reader():
    return RapidOcrReader()


def analyze(name, reader):
    return analyze_frame(cv2.imread(str(FRAMES / f"{name}.jpg")), reader)


@pytest.mark.parametrize("name", sorted(EXPECTED))
def test_screen_is_recognised(name, reader):
    assert analyze(name, reader).kind.value == EXPECTED[name]


def test_matchup_screen_values(reader):
    for name in ("0066", "0070"):
        obs = analyze(name, reader)
        assert (obs.left.name, obs.left.overall, obs.left.position) == ("iAmKngBrando", 98, "SG")
        assert obs.left.build == "2-Way Post Sharpshooter"
        assert (obs.right.name, obs.right.overall, obs.right.position) == ("DntDaggMe", 99, "SG")
        assert obs.right.build == "2-Way Bucket Chaser"
        assert obs.mode == "City Games"


def test_player_card_names(reader):
    assert analyze("0045", reader).player.name == "iAmKngBrando"
    assert analyze("0048", reader).player.overall == 98
    assert analyze("0052", reader).player.name == "DntDaggMe"
    assert analyze("0056", reader).player.name == "DntDaggMe"


def test_scoreboard_scores(reader):
    scores = {
        name: (obs.left_score, obs.right_score)
        for name in ("0100", "0300", "0680")
        for obs in [analyze(name, reader)]
    }
    assert scores == {"0100": (0, 0), "0300": (9, 7), "0680": (20, 18)}


def test_result_screen(reader):
    early, settled = analyze("0706", reader), analyze("0708", reader)
    # The score fades in after the banner.
    assert (early.outcome, early.score_pair) == ("loss", None)
    assert (settled.outcome, settled.score_pair) == ("loss", (22, 18))


def test_stats_table_totals(reader):
    for name in ("0733", "0759"):
        obs = analyze(name, reader)
        assert obs.kind == ScreenKind.GAME_STATS
        assert (obs.your_points, obs.opponent_points) == (18, 22)
        assert obs.stats["opponent"]["GRD"] == "A"
        assert obs.stats["you"]["FGM/FGA"] == "8/13"
        assert obs.stats["opponent"]["FGM/FGA"] == "10/14"


def test_full_resolution_capture_reads_everything(reader):
    """At 1080p the card's rating and level, unreadable at 480p, come through."""
    mine = analyze("hd_0025", reader).player
    assert (mine.name, mine.overall, mine.level) == ("iAmKngBrando", 98, 22)
    theirs = analyze("hd_0033", reader).player
    assert (theirs.overall, theirs.build) == (89, "3-Levelballhawk")

    matchup = analyze("hd_0045", reader)
    assert (matchup.left.name, matchup.left.overall) == ("iAmKngBrando", 98)
    assert (matchup.right.overall, matchup.right.position) == (89, "PG")
    assert matchup.right.build == "3-Level Ball Hawk"

    game = analyze("hd_0300", reader)
    assert (game.left_score, game.right_score) == (6, 10)

    won = analyze("hd_0611", reader)
    assert (won.outcome, won.score_pair) == ("win", (22, 12))
