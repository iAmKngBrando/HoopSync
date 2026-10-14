from twokot.matching import find_best_match, similarity

OPPONENTS = [
    {"id": 1, "name": "ItsMeJayy", "gamertag": None},
    {"id": 2, "name": "Trillez", "gamertag": "TrillezTV"},
    {"id": 3, "name": "KingDre", "gamertag": None},
]


def test_exact_match_ignores_case_and_punctuation():
    match = find_best_match("its_me-JAYY", OPPONENTS)
    assert match and match.opponent["id"] == 1 and match.exact


def test_ocr_lookalike_characters_still_match():
    # I read as l, O read as 0, S read as 5
    assert find_best_match("ltsMeJayy", OPPONENTS).opponent["id"] == 1
    assert find_best_match("K1ngDre", OPPONENTS).opponent["id"] == 3
    assert not find_best_match("ltsMeJayy", OPPONENTS).exact


def test_one_dropped_character_still_matches():
    assert find_best_match("ItsMeJay", OPPONENTS).opponent["id"] == 1


def test_gamertag_is_matched_too():
    assert find_best_match("TrillezTV", OPPONENTS).opponent["id"] == 2


def test_different_name_is_not_matched():
    assert find_best_match("SheLuvsBuckets", OPPONENTS) is None
    assert find_best_match("KingJames", OPPONENTS) is None


def test_empty_inputs():
    assert find_best_match("", OPPONENTS) is None
    assert find_best_match("ItsMeJayy", []) is None
    assert similarity("", "abc") == 0.0
