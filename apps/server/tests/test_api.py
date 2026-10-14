from pathlib import Path

import cv2
import numpy as np

from twokot.session import CompletedGame
from twokot.tracker import record_completed_game


def log(client, **body):
    return client.post("/api/game_result", json=body)


def test_empty_state(client):
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/api/opponents").json() == []
    assert client.get("/api/games").json() == []
    stats = client.get("/api/stats").json()
    assert stats["total_games"] == 0 and stats["current_streak"] == 0
    live = client.get("/api/live").json()
    assert live["capture_state"] == "disconnected"
    assert live["session"]["phase"] == "idle"


def test_opponent_crud(client):
    created = client.post("/api/opponents", json={"name": "ItsMeJayy", "overall": 93}).json()
    assert created["total_games"] == 0 and created["last_played"] is None

    patched = client.patch(f"/api/opponents/{created['id']}", json={"build": "Scorer"}).json()
    assert (patched["build"], patched["overall"], patched["name"]) == ("Scorer", 93, "ItsMeJayy")

    assert [o["name"] for o in client.get("/api/opponents?q=jay").json()] == ["ItsMeJayy"]
    assert client.get("/api/opponents?q=zzz").json() == []

    assert client.delete(f"/api/opponents/{created['id']}").status_code == 204
    assert client.get(f"/api/opponents/{created['id']}").status_code == 404
    assert client.post("/api/opponents", json={"name": ""}).status_code == 422


def test_logging_games_updates_records_and_stats(client):
    first = log(
        client,
        opponent_name="ItsMeJayy",
        your_score=21,
        opponent_score=14,
        date="2026-10-01T20:00:00+00:00",
    )
    assert first.status_code == 201 and first.json()["outcome"] == "win"

    # Same opponent typed differently must not create a duplicate.
    log(
        client,
        opponent_name="itsmejayy",
        your_score=10,
        opponent_score=21,
        date="2026-10-02T20:00:00+00:00",
    )
    log(
        client,
        opponent_name="Trillez",
        your_score=12,
        opponent_score=21,
        date="2026-10-03T20:00:00+00:00",
    )

    opponents = client.get("/api/opponents").json()
    assert [o["name"] for o in opponents] == ["Trillez", "ItsMeJayy"]
    jayy = opponents[1]
    assert (jayy["wins"], jayy["losses"], jayy["win_rate"]) == (1, 1, 50.0)
    assert jayy["last_played"] == "2026-10-02T20:00:00+00:00"

    stats = client.get("/api/stats").json()
    assert (stats["total_games"], stats["total_wins"], stats["total_losses"]) == (3, 1, 2)
    assert stats["current_streak"] == -2

    detail = client.get(f"/api/stats/{jayy['id']}").json()
    assert len(detail["games"]) == 2
    assert len(client.get(f"/api/games?opponent_id={jayy['id']}").json()) == 2


def test_deleting_games_and_opponents_recomputes_totals(client):
    game = log(client, opponent_name="KingDre", your_score=21, opponent_score=19).json()
    assert client.delete(f"/api/games/{game['id']}").status_code == 204
    opponent = client.get("/api/opponents").json()[0]
    assert opponent["total_games"] == 0 and opponent["last_played"] is None

    log(client, opponent_id=opponent["id"], your_score=21, opponent_score=19)
    client.delete(f"/api/opponents/{opponent['id']}")
    assert client.get("/api/games").json() == []
    assert client.delete("/api/games/999").status_code == 404


def test_invalid_results_are_rejected(client):
    assert log(client, opponent_name="A1", your_score=21, opponent_score=21).status_code == 422
    assert log(client, your_score=21, opponent_score=14).status_code == 422
    assert log(client, opponent_id=42, your_score=21, opponent_score=14).status_code == 404
    assert log(client, opponent_name="A1", your_score=-1, opponent_score=14).status_code == 422
    assert (
        log(client, opponent_name="A1", your_score=2, opponent_score=1, date="soon").status_code
        == 422
    )


def test_frame_upload_and_serving(client):
    ok, png = cv2.imencode(".png", np.zeros((8, 8, 3), dtype=np.uint8))
    assert ok
    response = client.post(
        "/api/frames",
        files={"file": ("../../evil.png", png.tobytes(), "image/png")},
        data={"kind": "matchup", "label": "opponent name"},
    )
    assert response.status_code == 201
    frame = response.json()
    assert "path" not in frame and frame["kind"] == "matchup"
    image = client.get(frame["url"])
    assert image.status_code == 200 and image.content == png.tobytes()

    assert client.get("/api/live").json()["capture_state"] == "connected"
    assert client.get("/api/frames/999/image").status_code == 404

    bad = client.post("/api/frames", files={"file": ("x.png", b"nope", "image/png")})
    assert bad.status_code == 422
    wrong_kind = client.post(
        "/api/frames", files={"file": ("x.png", png.tobytes(), "image/png")}, data={"kind": "menu"}
    )
    assert wrong_kind.status_code == 422


def test_captured_game_resolves_a_misread_name_to_the_known_opponent(store):
    known = store.create_opponent("ItsMeJayy", overall=92)
    when = "2026-10-12T22:20:00+00:00"
    game = record_completed_game(
        store,
        CompletedGame(
            opponent_name="ltsMeJayy",
            your_score=21,
            opponent_score=14,
            opponent_overall=93,
            opponent_level=5,
            game_type="Theater",
            stats={"you": {"PTS": 21}},
        ),
        date=when,
    )
    assert game["opponent_id"] == known["id"] and game["source"] == "capture"
    assert (game["game_type"], game["stats"]) == ("Theater", {"you": {"PTS": 21}})
    assert len(store.list_opponents()) == 1
    assert store.get_opponent(known["id"])["overall"] == 93
    assert store.get_opponent(known["id"])["level"] == 5

    record_completed_game(store, CompletedGame("BrandNewGuy", 10, 21))
    assert len(store.list_opponents()) == 2

    # The same captured game arriving again (a replayed recording) is not duplicated.
    again = record_completed_game(store, CompletedGame("ItsMeJayy", 21, 14), date=when)
    assert again["id"] == game["id"] and len(store.list_games()) == 2


def test_analysing_frames_drives_the_live_session(client):
    frames = Path(__file__).parent / "fixtures" / "frames"

    recorded = []

    def send(name, times=1):
        data = (frames / f"{name}.jpg").read_bytes()
        for _ in range(times):
            response = client.post(
                "/api/frames/analyze", files={"file": (f"{name}.jpg", data, "image/jpeg")}
            )
            assert response.status_code == 200
            if response.json()["game"]:
                recorded.append(response.json()["game"])
        return response.json()

    assert send("0052", times=3)["kind"] == "opponent_player_load_screen"
    assert send("0066", times=3)["session"]["phase"] == "pregame"

    live = client.get("/api/live").json()
    assert live["capture_state"] == "connected"
    assert live["session"]["opponent_name"] == "DntDaggMe"
    assert live["session"]["opponent_overall"] == 99
    # The matchup frame is kept and served for the dashboard to show.
    assert client.get(live["session"]["start_frame_url"]).status_code == 200

    assert send("0300", times=3)["session"]["phase"] == "in_progress"
    send("0708", times=3)
    send("0759", times=3)
    assert len(recorded) == 1, "the game is recorded once, when result and stats agree"
    assert recorded[0]["outcome"] == "loss"
    assert (recorded[0]["your_score"], recorded[0]["opponent_score"]) == (18, 22)

    games = client.get("/api/games").json()
    assert len(games) == 1 and games[0]["source"] == "capture"
    assert client.get(games[0]["start_frame_path"]).status_code == 200
    opponent = client.get("/api/opponents").json()[0]
    assert (opponent["name"], opponent["overall"], opponent["losses"]) == ("DntDaggMe", 99, 1)

    bad = client.post("/api/frames/analyze", files={"file": ("x.jpg", b"nope", "image/jpeg")})
    assert bad.status_code == 422


def test_stats_can_be_edited_and_cleared(client):
    game = log(client, opponent_name="DntDaggMe", your_score=18, opponent_score=22).json()
    assert game["stats"] is None and game["stats_photo_path"] is None

    stats = {"you": {"PTS": 18, "FGM/FGA": "8/13"}, "opponent": {"PTS": 22}}
    updated = client.patch(
        f"/api/games/{game['id']}", json={"stats": stats, "game_type": "Theater"}
    )
    assert updated.status_code == 200
    assert (updated.json()["stats"], updated.json()["game_type"]) == (stats, "Theater")

    # Editing one field leaves the others alone.
    kept = client.patch(f"/api/games/{game['id']}", json={"game_type": "Park"}).json()
    assert kept["stats"] == stats
    assert client.patch(f"/api/games/{game['id']}", json={"stats": None}).json()["stats"] is None

    assert client.patch("/api/games/999", json={"game_type": "Rec"}).status_code == 404
    bad_column = client.patch(f"/api/games/{game['id']}", json={"stats": {"you": {"XYZ": 1}}})
    bad_side = client.patch(f"/api/games/{game['id']}", json={"stats": {"them": {"PTS": 1}}})
    assert (bad_column.status_code, bad_side.status_code) == (422, 422)


def test_stats_photo_is_read_and_kept_but_not_saved_until_confirmed(client):
    game = log(client, opponent_name="DntDaggMe", your_score=18, opponent_score=22).json()
    photo = (Path(__file__).parent / "fixtures" / "frames" / "0759.jpg").read_bytes()

    response = client.post(
        f"/api/games/{game['id']}/stats_photo", files={"file": ("stats.jpg", photo, "image/jpeg")}
    )
    assert response.status_code == 200
    body = response.json()
    assert (body["stats"]["you"]["PTS"], body["stats"]["opponent"]["PTS"]) == (18, 22)
    assert body["warnings"] == []
    assert client.get(body["photo_url"]).content == photo

    stored = client.get("/api/games").json()[0]
    assert stored["stats"] is None, "read stats are a proposal until confirmed"
    assert stored["stats_photo_path"] == body["photo_url"]

    # A photo whose points disagree with the recorded score is flagged.
    other = log(client, opponent_name="DntDaggMe", your_score=21, opponent_score=10).json()
    mismatch = client.post(
        f"/api/games/{other['id']}/stats_photo", files={"file": ("stats.jpg", photo, "image/jpeg")}
    ).json()
    assert len(mismatch["warnings"]) == 2 and "recorded score is 21" in mismatch["warnings"][0]

    not_image = client.post(
        f"/api/games/{game['id']}/stats_photo", files={"file": ("x.jpg", b"nope", "image/jpeg")}
    )
    missing = client.post(
        "/api/games/999/stats_photo", files={"file": ("x.jpg", photo, "image/jpeg")}
    )
    assert (not_image.status_code, missing.status_code) == (422, 404)
