"""test_face_event_rejoin.py — face_event 의 rejoin 신호 경로.

아는 얼굴 반응은 통화당 1회다(같은 사람에게 "오셨군요"를 반복하지 않기 위해).
그런데 Remember Me 대기에 빠졌다가 그 사람이 다시 잡히면 실제로 대화가 끊겼던
것이므로 다시 맞이해야 한다 — 히즈키 지시(2026-08-13): "remember me 상태에서
내 얼굴이 다시 나오면 다시 왔다고 인사를 하고 대화 진행".

동시에 남용은 막아야 한다. 앱이 rejoin 을 반복해 보내면 클론이 매번 말을 끊는다.
그래서 1회 제한을 60초 쿨다운으로 **대체**할 뿐 없애지는 않는다.
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


def _confirm(sess, rejoin=None, pid=58):
    data = {"event": "speaker_confirmed", "personId": pid, "displayName": "도기"}
    if rejoin is not None:
        data["rejoin"] = rejoin
    signaling._handle_face_event(sess, data)


async def test_rejoin_없으면_아는_얼굴은_통화당_1회다(monkeypatch):
    _env(monkeypatch)
    sess = _Sess()

    _confirm(sess)
    first = sess.reacted_keys["58"]

    # 같은 사람이 다시 확정돼도 react 는 억제된다 — 쿨다운 시각이 갱신되지 않는다.
    _confirm(sess)
    assert sess.reacted_keys["58"] == first


async def test_rejoin_이면_1회_제한을_넘어_다시_인사한다(monkeypatch):
    """대기에서 돌아온 경우. 쿨다운이 지났으면 다시 맞이해야 한다."""
    _env(monkeypatch)
    sess = _Sess()

    _confirm(sess)
    # 60초 전에 인사했던 것으로 만든다(쿨다운 경과).
    sess.reacted_keys["58"] -= signaling.REACT_COOLDOWN_S + 1
    stale = sess.reacted_keys["58"]

    _confirm(sess, rejoin=True)
    # react 경로에 다시 들어갔다는 증거 — 쿨다운 시각이 갱신된다.
    assert sess.reacted_keys["58"] > stale


async def test_rejoin_도_쿨다운_안에서는_억제된다(monkeypatch):
    """앱이 신호를 반복해 보내도 클론이 매번 말을 끊으면 안 된다."""
    _env(monkeypatch)
    sess = _Sess()

    _confirm(sess)
    first = sess.reacted_keys["58"]

    _confirm(sess, rejoin=True)  # 방금 인사했다 — 쿨다운 안
    assert sess.reacted_keys["58"] == first


async def test_rejoin_은_True_만_신호다(monkeypatch):
    """문자열 "true"·1 같은 값으로 조용히 새면 안 된다(silent 와 같은 계약)."""
    _env(monkeypatch)
    for bad in ("true", 1, "1", None):
        sess = _Sess()
        _confirm(sess)
        sess.reacted_keys["58"] -= signaling.REACT_COOLDOWN_S + 1
        stale = sess.reacted_keys["58"]
        _confirm(sess, rejoin=bad)
        assert sess.reacted_keys["58"] == stale, bad


async def test_rejoin_은_첫_확정을_방해하지_않는다(monkeypatch):
    """통화 첫 확정에 rejoin 이 붙어 와도(앱 판단) 정상 인사한다."""
    _env(monkeypatch)
    sess = _Sess()

    _confirm(sess, rejoin=True)
    assert "58" in sess.reacted_keys
    assert sess.current_speaker[0] == 58


# ---------------------------------------------------------------------------
# mentionName — 인사 없이 다음 응답에서 이름만 부르게 한다.
#
# 얼굴이 잠깐 안 잡혔다가(앱의 grace 구간) 같은 사람이 돌아온 경우. react 를 걸면
# "다시 왔네" 가 매번 나가 대화가 끊긴다(히즈키 실측 2026-08-13).
# ---------------------------------------------------------------------------


async def test_mention_name_은_react를_걸지_않고_힌트만_세운다(monkeypatch):
    _env(monkeypatch)
    sess = _Sess()

    signaling._handle_face_event(
        sess,
        {"event": "speaker_confirmed", "personId": 58, "displayName": "도기",
         "mentionName": True},
    )

    assert sess.pipeline.name_mention_hint == "도기"
    # 발화 경로 전체를 건너뛴다 — 쿨다운 키도 남기지 않는다.
    assert sess.reacted_keys == {}
    assert sess.pending_react is None


async def test_mention_name_도_신원은_반영한다(monkeypatch):
    """서버가 이미 그 사람으로 알고 있더라도, 어긋나 있었다면 맞춰야 한다."""
    _env(monkeypatch)
    sess = _Sess()

    signaling._handle_face_event(
        sess,
        {"event": "speaker_confirmed", "personId": 58, "displayName": "도기",
         "mentionName": True},
    )

    assert sess.current_speaker[0] == 58


async def test_mention_name_은_True_만_신호다(monkeypatch):
    _env(monkeypatch)
    for bad in ("true", 1, "1", None):
        sess = _Sess()
        signaling._handle_face_event(
            sess,
            {"event": "speaker_confirmed", "personId": 58, "displayName": "도기",
             "mentionName": bad},
        )
        # 신호가 아니면 평소 경로 — react 가 걸리고 힌트는 안 선다.
        assert "58" in sess.reacted_keys, bad
        assert getattr(sess.pipeline, "name_mention_hint", None) is None, bad
