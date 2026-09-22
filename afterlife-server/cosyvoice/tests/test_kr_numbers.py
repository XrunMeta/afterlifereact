"""TTS 전에 아라비아 숫자를 한글 읽기로 바꾼다.

CosyVoice 의 텍스트 정규화(wetext)는 한국어 문장 속 숫자에서 AssertionError 로 죽어
/tts/kr 가 500 을 냈다(실측 2026-09-14: "나는 20대야", "오늘 3시에 만나" → 500,
"나는 이십대야" → 200). 클론이 나이·시간을 말하면 그 응답 음성이 통째로 빠졌다.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from kr_numbers import spell_numbers  # noqa: E402


def test_숫자가_없으면_그대로():
    assert spell_numbers("나 ISFJ야.") == "나 ISFJ야."


def test_한자어_숫자():
    assert spell_numbers("나는 20대야.") == "나는 이십대야."
    assert spell_numbers("2026년") == "이천이십육년"
    assert spell_numbers("105동 1004호") == "백오동 천사호"
    assert spell_numbers("0점") == "영점"


def test_고유어_단위는_고유어로():
    assert spell_numbers("오늘 3시에 만나") == "오늘 세 시에 만나"
    assert spell_numbers("21살이야") == "스물한 살이야"
    assert spell_numbers("사과 2개") == "사과 두 개"


def test_소수와_쉼표():
    assert spell_numbers("3.5점") == "삼 점 오점"
    assert spell_numbers("1,000원") == "천원"


def test_결과에_아라비아_숫자가_남지_않는다():
    for t in ["20대", "3시 30분", "100만 원", "12345678", "9.99"]:
        out = spell_numbers(t)
        assert not any(c.isdigit() for c in out), (t, out)
