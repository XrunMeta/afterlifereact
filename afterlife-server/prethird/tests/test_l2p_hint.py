"""test_l2p_hint — build_l2p_hint: verify와 실통화가 공유하는 L2' 힌트 조립."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from signaling import build_l2p_hint  # noqa: E402


def test_hint_name_only_when_no_l2p():
    assert build_l2p_hint("형", None) == "현재 화면의 화자: 형"
    assert build_l2p_hint("형", {}) == "현재 화면의 화자: 형"


def test_hint_includes_relation_and_prefs():
    data = {"relation": "형", "preference_personal": {"음료": "아메리카노"}, "memories_personal": ["지난주 등산"]}
    hint = build_l2p_hint("형", data)
    assert hint.startswith("현재 화면의 화자: 형. 이 사람과의 관계 기억: ")
    assert "관계=형" in hint and "선호=음료:아메리카노" in hint and "기억=지난주 등산" in hint
