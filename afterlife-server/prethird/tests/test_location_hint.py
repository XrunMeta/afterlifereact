"""AFL-926: 위치는 동 이름이나 대표 지명 하나로 — 전체 주소를 프롬프트에 넣지 않는다."""
import pathlib
import sys

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from clone_dialog.persona_prompt import bundle_to_messages, spoken_location  # noqa: E402


@pytest.mark.parametrize("raw, said", [
    ("경기도 안양시 안양동", "안양동"),       # 2026-10-02 실통화: 주소를 통째로 읽었다
    ("서울 강남구 역삼동", "역삼동"),
    ("경기도 안산시 단원구 고잔동", "고잔동"),
    ("경기도 안산시", "안산"),               # 동이 없으면 시 이름(접미사 뗌)
    ("경기도 양평군", "양평"),
    ("서울 강남구", "강남구"),               # 특별시는 앱이 "서울" 로 줄여 보낸다 → 구
    ("부산 해운대구 우동", "우동"),           # 한 글자 동 이름 + 동
    ("제주도 제주시 연동", "연동"),
    ("서울", "서울"),
    ("  ", None),
    (None, None),
])
def test_spoken_location(raw, said):
    assert spoken_location(raw) == said


def _bundle():
    return {"personaBundle": {"persona": {"displayName": "까치", "age": "50대"},
                              "viewer": {"displayName": "지호"}}}


@pytest.mark.parametrize("intro", [True, False])
def test_prompt_has_short_name_only(intro):
    content = bundle_to_messages(_bundle(), user_location="경기도 안양시 안양동",
                                 ask_region_intro=intro)[0]["content"]
    assert "안양동" in content
    assert "경기도" not in content and "안양시" not in content
    assert "주소처럼 읽지 마라" in content


def test_no_location_no_hint():
    content = bundle_to_messages(_bundle(), user_location=None)[0]["content"]
    assert "위치 대화" not in content
