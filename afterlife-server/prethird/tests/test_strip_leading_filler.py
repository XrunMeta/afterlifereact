"""T-829 첫머리 추임새 제거 — 진짜 단어를 먹지 않아야 한다(2026-10-02 실통화 회귀)."""
import pathlib
import sys

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from pipeline import strip_leading_filler  # noqa: E402


@pytest.mark.parametrize("raw, expected", [
    # 원래 의도 — 짧은 도입부만 지운다
    ("응, 지호야. 오늘 뭐 했어?", "오늘 뭐 했어?"),
    ("아, 그렇구나. 좋네.", "좋네."),
    ("어, 맞아. 그건 좀 다르지.", "그건 좀 다르지."),
    ("음, 그러네. 나도 그래.", "나도 그래."),
    ("와 진짜 좋다", "좋다"),
    ("응 그래, 알겠어.", "알겠어."),
    # 2026-10-02 실통화에서 잘려 나간 것들 — 추임새만 지우고 본문은 그대로
    ("응, 안양동이잖아. 맞지?", "안양동이잖아. 맞지?"),
    ("응, 맞지?", "맞지?"),
    ("응, 그게 말이야.", "그게 말이야."),
    # 추임새로 시작하는 진짜 단어 — 건드리지 않는다
    ("아니, 나는 가지는 안 키워.", "아니, 나는 가지는 안 키워."),
    ("어제 고추 땄어.", "어제 고추 땄어."),
    ("음식은 국밥이 좋아.", "음식은 국밥이 좋아."),
    ("와이프가 좋아해.", "와이프가 좋아해."),
    ("안양동이야.", "안양동이야."),
    ("이런저런 일이 있었어.", "이런저런 일이 있었어."),
    # 전부 지워지면 원문 유지(빈 응답 방지)
    ("응.", "응."),
    ("", ""),
])
def test_strip_leading_filler(raw, expected):
    assert strip_leading_filler(raw) == expected


def test_switch_off(monkeypatch):
    monkeypatch.setenv("PRETHIRD_STRIP_LEAD_FILLER", "0")
    assert strip_leading_filler("응, 지호야. 오늘 뭐 했어?") == "응, 지호야. 오늘 뭐 했어?"
