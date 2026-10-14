from twokot.session import Observation, Phase, PlayerRead, ScreenKind, SessionTracker

ME = PlayerRead(name="iAmKngBrando", overall=98, build="2-Way Post Sharpshooter")
THEM = PlayerRead(name="DntDaggMe", overall=99, build="2-Way Bucket Chaser")

MY_CARD = Observation(ScreenKind.MY_PLAYER, player=PlayerRead(name="iAmKngBrando"))
THEIR_CARD = Observation(ScreenKind.OPPONENT_PLAYER, player=PlayerRead(name="DntDaggMe"))
MATCHUP = Observation(ScreenKind.MATCHUP, left=ME, right=THEM, mode="City Games", frame_id=7)
IN_GAME = Observation(
    ScreenKind.IN_GAME,
    left_score=9,
    right_score=7,
    left_name="DntDaggMe",
    right_name="iAmKngBrando",
)
LOST = Observation(ScreenKind.GAME_RESULT, outcome="loss", score_pair=(22, 18), frame_id=20)
WINNERS = Observation(ScreenKind.WINNERS_CIRCLE)
STATS = Observation(
    ScreenKind.GAME_STATS, your_points=18, opponent_points=22, stats={"you": {"PTS": 18}}
)
OTHER = Observation(ScreenKind.OTHER)


def feed(tracker, obs, times=3):
    return [game for game in (tracker.observe(obs) for _ in range(times)) if game]


def play_to_tipoff(tracker):
    feed(tracker, MY_CARD)
    feed(tracker, THEIR_CARD)
    feed(tracker, MATCHUP)
    feed(tracker, IN_GAME)


def test_full_game_is_recorded_once_with_the_right_sides():
    tracker = SessionTracker()
    feed(tracker, MY_CARD)
    assert tracker.phase == Phase.PREGAME
    feed(tracker, THEIR_CARD)
    feed(tracker, MATCHUP)
    state = tracker.state
    assert (state["opponent_name"], state["opponent_overall"]) == ("DntDaggMe", 99)
    assert state["your_name"] == "iAmKngBrando"
    assert tracker.matchup_frame_id == 7

    feed(tracker, IN_GAME)
    assert tracker.phase == Phase.IN_PROGRESS
    # You are on the right of this scoreboard, so your score is the right one.
    assert (tracker.state["your_score"], tracker.state["opponent_score"]) == (7, 9)

    assert feed(tracker, LOST) == []
    assert feed(tracker, WINNERS, times=10) == []
    assert feed(tracker, OTHER, times=10) == [], "recap pages must not settle the result early"
    games = feed(tracker, STATS, times=6)
    assert len(games) == 1, "result and stats agreeing settles the game exactly once"

    game = games[0]
    assert (game.opponent_name, game.your_score, game.opponent_score) == ("DntDaggMe", 18, 22)
    assert (game.opponent_overall, game.opponent_build) == (99, "2-Way Bucket Chaser")
    assert (game.game_type, game.start_frame_id, game.end_frame_id) == ("City Games", 7, 20)
    assert game.stats == {"you": {"PTS": 18}}
    assert tracker.phase == Phase.ENDED
    assert feed(tracker, STATS, times=6) == []


def test_result_screen_alone_settles_after_the_end_sequence():
    tracker = SessionTracker(settle_frames=5)
    play_to_tipoff(tracker)
    feed(tracker, Observation(ScreenKind.GAME_RESULT, outcome="win", score_pair=(21, 14)))
    assert feed(tracker, OTHER, times=4) == []
    games = feed(tracker, OTHER, times=1)
    assert [(g.your_score, g.opponent_score) for g in games] == [(21, 14)]


def test_stream_ending_mid_result_is_settled_by_flush():
    tracker = SessionTracker()
    play_to_tipoff(tracker)
    feed(tracker, LOST)
    game = tracker.flush()
    assert (game.your_score, game.opponent_score) == (18, 22)
    assert tracker.flush() is None


def test_misread_frames_are_outvoted():
    tracker = SessionTracker()
    feed(tracker, MY_CARD)
    feed(tracker, THEIR_CARD)
    feed(tracker, MATCHUP, times=5)
    misread = Observation(
        ScreenKind.MATCHUP, left=ME, right=PlayerRead(name="DntDaggMc", overall=66)
    )
    tracker.observe(misread)
    assert (tracker.state["opponent_name"], tracker.state["opponent_overall"]) == ("DntDaggMe", 99)

    feed(tracker, IN_GAME)
    feed(tracker, LOST, times=4)
    tracker.observe(Observation(ScreenKind.GAME_RESULT, outcome="loss", score_pair=(22, 13)))
    game = tracker.flush()
    assert (game.your_score, game.opponent_score) == (18, 22)


def test_single_misclassified_frame_changes_nothing():
    tracker = SessionTracker()
    play_to_tipoff(tracker)
    assert tracker.observe(LOST) is None
    assert tracker.observe(IN_GAME) is None
    assert tracker.phase == Phase.IN_PROGRESS
    assert tracker.flush() is None


def test_scoreboard_hidden_by_an_overlay_does_not_end_the_game():
    tracker = SessionTracker()
    play_to_tipoff(tracker)
    feed(tracker, OTHER, times=60)
    assert tracker.phase == Phase.IN_PROGRESS


def test_you_on_the_right_of_the_matchup_screen_is_handled():
    tracker = SessionTracker()
    feed(tracker, MY_CARD)
    feed(tracker, THEIR_CARD)
    feed(tracker, Observation(ScreenKind.MATCHUP, left=THEM, right=ME))
    assert tracker.state["opponent_name"] == "DntDaggMe"
    assert tracker.state["opponent_overall"] == 99


def test_live_score_is_withheld_when_sides_cannot_be_told_apart():
    tracker = SessionTracker()
    feed(tracker, MY_CARD)
    feed(tracker, THEIR_CARD)
    feed(tracker, MATCHUP)
    feed(tracker, Observation(ScreenKind.IN_GAME, left_score=9, right_score=7))
    assert tracker.state["your_score"] is None


def test_unreadable_result_records_nothing():
    tracker = SessionTracker(settle_frames=3)
    play_to_tipoff(tracker)
    feed(tracker, Observation(ScreenKind.GAME_RESULT, outcome="loss"))
    assert feed(tracker, OTHER, times=5) == []
    assert tracker.phase == Phase.ENDED


def test_abandoned_game_is_dropped_when_the_next_one_loads():
    tracker = SessionTracker()
    play_to_tipoff(tracker)
    other = Observation(ScreenKind.OPPONENT_PLAYER, player=PlayerRead(name="Trillez"))
    assert feed(tracker, other) == []
    assert tracker.phase == Phase.PREGAME
    assert tracker.state["opponent_name"] == "Trillez"
    assert tracker.state["opponent_overall"] is None


def test_next_game_can_start_straight_after_one_ends():
    tracker = SessionTracker()
    play_to_tipoff(tracker)
    feed(tracker, LOST)
    feed(tracker, STATS)
    assert tracker.phase == Phase.ENDED
    feed(tracker, Observation(ScreenKind.OPPONENT_PLAYER, player=PlayerRead(name="Trillez")))
    assert (tracker.phase, tracker.state["opponent_name"]) == (Phase.PREGAME, "Trillez")
