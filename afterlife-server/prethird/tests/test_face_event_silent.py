"""test_face_event_silent.py — face_event 의 silent 신호 경로.

앱이 계정주를 자동 등록한 직후 신원을 서버에 즉시 알리되, 클론이 말을 걸지는 않게 하는
경로다. 두 가지를 동시에 지켜야 한다:
  1. 신원은 반영된다 — current_speaker 가 설정돼 프롬프트·L2' 가 그 사람으로 바뀐다.
  2. 반응 발화는 하지 않는다 — react 가 걸리면 대화 도중 "다시 오셨네요" 로 끼어든다.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import signaling  # noqa: E402


class _FakePipeline:
    def __init__(self):
        self.persona_messages = []

    def update_persona(self, msgs):
        self.persona_messages = msgs


class _Sess:
    def __init__(self):
        self.session_id = "0123456789ab"
        self.pipeline = _FakePipeline()
        self.clone_id = 9128
        self.current_speaker = None
        self.reacted_keys = {}
        self.pending_enroll = False
        self.pending_react = None
        self.bundle = None
        self.speaker_epoch = 0


def _env(monkeypatch, react="1", identity="1"):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", react)
    monkeypatch.setenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", identity)


async def test_silent_은_화자를_확정하되_react를_걸지_않는다(monkeypatch):
    _env(monkeypatch)
    sess = _Sess()

    signaling._handle_face_event(
        sess,
        {"event": "speaker_confirmed", "personId": 54, "displayName": "지호씨", "silent": True},
    )

    # 신원은 반영된다.
    assert sess.current_speaker is not None
    assert sess.current_speaker[0] == 54
    # react 는 걸리지 않는다 — 쿨다운 키도 남기지 않아 이후 정상 이벤트가 막히지 않는다.
    assert sess.reacted_keys == {}
    assert sess.pending_react is None


async def test_silent_없으면_기존대로_react_경로를_탄다(monkeypatch):
    _env(monkeypatch)
    sess = _Sess()

    signaling._handle_face_event(
        sess, {"event": "speaker_confirmed", "personId": 54, "displayName": "지호씨"}
    )

    assert sess.current_speaker[0] == 54
    # react 경로에 들어갔다는 증거 — 쿨다운 키가 찍힌다.
    assert "54" in sess.reacted_keys


async def test_silent_은_unknown_face_에서도_발화를_막는다(monkeypatch):
    """자동 등록 실패 폴백처럼 unknown 을 조용히 알리고 싶을 때도 같은 계약이어야 한다."""
    _env(monkeypatch)
    sess = _Sess()

    signaling._handle_face_event(sess, {"event": "unknown_face", "silent": True})

    assert sess.reacted_keys == {}
    # pending_enroll(다음 say 에서 카드 띄우기)도 세우지 않는다 — 발화 경로 전체를 건너뛴다.
    assert sess.pending_enroll is False


async def test_silent_가_아닌_값은_무시된다(monkeypatch):
    """True 만 신호 경로다. 문자열 "true"·1 같은 값으로 조용히 새면 안 된다."""
    _env(monkeypatch)
    for bad in ("true", 1, "1", None):
        sess = _Sess()
        signaling._handle_face_event(
            sess, {"event": "speaker_confirmed", "personId": 54, "silent": bad}
        )
        assert "54" in sess.reacted_keys, bad
