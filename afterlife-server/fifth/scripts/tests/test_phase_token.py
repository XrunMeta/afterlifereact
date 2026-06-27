"""PhaseToken TDD 테스트 — Task 1 Step 1.

실행법:
  cd /Volumes/exDN/devExdn/afl-fifth-continuation/afterlife-server/fifth
  PYTHONPATH=$PWD/scripts /Volumes/exDN/devExdn/afl-fifth/afterlife-server/fifth/.venv/bin/python \
    -m pytest scripts/tests/test_phase_token.py -v
"""
from phase_token import PhaseToken


def test_default_token_is_fresh_start():
    t = PhaseToken()
    assert t.frame_offset == 0 and t.first_frame is True and t.head_last is None


def test_default_blink_phase_zero():
    t = PhaseToken()
    assert t.blink_phase == 0


def test_token_roundtrip():
    t = PhaseToken(frame_offset=25, blink_phase=7, first_frame=False, head_last=[1.0, 2.0])
    assert PhaseToken.from_dict(t.to_dict()) == t


def test_token_roundtrip_none_head():
    """head_last=None 도 왕복 직렬화가 동일."""
    t = PhaseToken(frame_offset=10, blink_phase=3, first_frame=False, head_last=None)
    assert PhaseToken.from_dict(t.to_dict()) == t


def test_from_dict_none_returns_default():
    """from_dict(None) → 기본값 토큰 반환."""
    t = PhaseToken.from_dict(None)
    assert t == PhaseToken()


def test_from_dict_empty_returns_default():
    """from_dict({}) → 기본값 토큰 반환."""
    t = PhaseToken.from_dict({})
    assert t == PhaseToken()


def test_token_equality():
    a = PhaseToken(frame_offset=5, blink_phase=2, first_frame=False)
    b = PhaseToken(frame_offset=5, blink_phase=2, first_frame=False)
    assert a == b


def test_to_dict_keys():
    t = PhaseToken(frame_offset=3)
    d = t.to_dict()
    assert set(d.keys()) == {"frame_offset", "blink_phase", "first_frame", "head_last"}
