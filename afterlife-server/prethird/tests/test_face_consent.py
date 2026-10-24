"""AFL-1040: 얼굴 생체정보 비동의(face_consent) — 이름 금지 + 설정 안내, remember_me/enroll_suggest 우회.

additive 계약: 신호가 없으면(구버전 앱, face_consent=None) 기존 동작과 완전히 같다."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asyncio
import json
import time

import pytest
from aiohttp.test_utils import TestClient, TestServer
from aiortc import RTCPeerConnection

from clone_dialog.whoami import (  # noqa: E402
    turn_face_instruction, turn_face_names_allowed, remember_me_consent_instruction,
)
from signaling import _make_dc_handler, make_app, _set_face_consent  # noqa: E402
from session import Session  # noqa: E402
from .test_whoami import (  # noqa: E402
    _Sess, _Channel, _drain, _no_writeback, _make_pipe, _fast_bridge, tf, NOW,
)


# --- whoami -------------------------------------------------------------

def test_no_consent_verdict_instruction():
    s = turn_face_instruction(tf(verdict="no_consent", who="self"), "지호", NOW)
    assert "얼굴 인식 허용" in s and "예외" in s
    assert "이름을 말하지 말고" in s and "지호" not in s
    assert "붙이지 마라" in s and "(예: <lang=ko><ask=who>" not in s


def test_no_consent_names_not_allowed():
    assert turn_face_names_allowed(tf(verdict="no_consent"), NOW, True) is False


def test_consent_false_blocks_names_and_other_verdicts():
    assert turn_face_names_allowed(tf(verdict="known", score=0.9), NOW, True, False) is False
    assert turn_face_names_allowed(None, NOW, True, False) is False
    # who 질문 턴은 설정 안내, 그 밖은 카메라 부탁·ask 태그 없이 지시 없음
    assert "얼굴 인식 허용" in turn_face_instruction(tf(verdict="known", who="self"), "지호", NOW, False)
    assert turn_face_instruction(tf(verdict="unknown"), None, NOW, False) is None


def test_regression_no_signal_same_as_before():
    for v in ("unknown", "insufficient", "known", "switch"):
        d = tf(verdict=v, score=0.5, personId=1)
        assert turn_face_instruction(d, "지호", NOW) == turn_face_instruction(d, "지호", NOW, None)
        assert turn_face_instruction(d, "지호", NOW) == turn_face_instruction(d, "지호", NOW, True)
        assert (turn_face_names_allowed(d, NOW, True)
                == turn_face_names_allowed(d, NOW, True, None)
                == turn_face_names_allowed(d, NOW, True, True))
    assert turn_face_names_allowed(None, NOW) is True


# --- 세션 저장 ----------------------------------------------------------

@pytest.mark.parametrize("val,expect", [(True, True), (False, False), (None, None),
                                         ("true", None), (1, None), (0, None)])
def test_set_face_consent_only_bool(val, expect):
    s = Session("0123456789ab")
    assert s.face_consent is None
    _set_face_consent(s, val, "offer")
    assert s.face_consent is expect


def test_dc_face_consent_last_value_wins():
    s = _Sess()
    h = _make_dc_handler(s, _Channel())
    h(json.dumps({"type": "face_consent", "granted": False}))
    assert s.face_consent is False
    h(json.dumps({"type": "face_consent", "granted": True}))
    assert s.face_consent is True
    h(json.dumps({"type": "face_consent", "granted": "x"}))
    assert s.face_consent is True


async def _offer(extra):
    holder = {}

    def factory(sess):
        holder["sess"] = sess

        from unittest.mock import MagicMock, AsyncMock
        return MagicMock(prerender_greeting=AsyncMock(), load_prior=AsyncMock())

    app = make_app(pipeline_factory=factory)
    async with TestClient(TestServer(app)) as client:
        pc = RTCPeerConnection()
        pc.addTransceiver("video", direction="recvonly")
        pc.addTransceiver("audio", direction="recvonly")
        await pc.setLocalDescription(await pc.createOffer())
        payload = {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type, **extra}
        resp = await client.post("/offer", json=payload)
        assert resp.status == 200
        await pc.close()
    return holder["sess"].face_consent


@pytest.mark.parametrize("extra,expect", [
    ({"face_consent": True}, True), ({"face_consent": False}, False),
    ({}, None), ({"face_consent": "no"}, None), ({"face_consent": 1}, None),
])
async def test_offer_parses_face_consent(extra, expect):
    assert await _offer(extra) is expect


# --- signaling: remember_me / enroll_suggest ---------------------------

class _P:
    def __init__(self):
        self.calls = []

    async def react(self, *a, **k):
        pass

    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None,
                  on_sentence=None, turn_face=None, on_ask=None,
                  face_consent=None, remember_me_asked=False):
        self.calls.append({"face_consent": face_consent, "remember_me_asked": remember_me_asked,
                           "turn_face": turn_face})


class _LegacyP(_P):
    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None,
                  on_sentence=None):
        self.calls.append({})


async def _say(consent, text, pipe=None, pending_enroll=False):
    sess = _Sess(pipe or _P())
    sess.face_consent = consent
    sess.pending_enroll = pending_enroll
    ch = _Channel()
    _make_dc_handler(sess, ch)(json.dumps({"type": "say", "text": text, "seq": 1}))
    await _drain()
    return sess, ch


async def test_remember_me_sent_when_consent_none_or_true(monkeypatch):
    _no_writeback(monkeypatch)
    for c in (None, True):
        sess, ch = await _say(c, "내 이름 기억해줘")
        assert any(m.get("type") == "remember_me" for m in ch.sent)
        assert sess.pipeline.calls[0].get("remember_me_asked", False) is False
        assert sess.pipeline.calls[0].get("face_consent") is None


async def test_remember_me_bypassed_when_consent_false(monkeypatch):
    _no_writeback(monkeypatch)
    sess, ch = await _say(False, "내 이름 기억해줘")
    assert not any(m.get("type") == "remember_me" for m in ch.sent)
    call = sess.pipeline.calls[0]
    assert call["face_consent"] is False and call["remember_me_asked"] is True


async def test_plain_say_when_consent_false_no_remember_flag(monkeypatch):
    _no_writeback(monkeypatch)
    sess, ch = await _say(False, "안녕")
    assert sess.pipeline.calls[0]["remember_me_asked"] is False


async def test_legacy_pipeline_without_kwarg_still_works(monkeypatch):
    _no_writeback(monkeypatch)
    sess, ch = await _say(False, "내 이름 기억해줘", pipe=_LegacyP())
    assert sess.pipeline.calls == [{}]


async def test_enroll_suggest_suppressed_when_consent_false(monkeypatch):
    _no_writeback(monkeypatch)
    import signaling
    sent = []

    async def fake_send(sess, channel, text, person_id=None):
        sent.append(text)
    monkeypatch.setattr(signaling, "_send_enroll_suggest", fake_send)

    sess, _ = await _say(False, "나는 지호야", pending_enroll=True)
    assert sent == [] and sess.pending_enroll is False
    sess, _ = await _say(None, "나는 지호야", pending_enroll=True)
    assert sent == ["나는 지호야"]
    sess, _ = await _say(True, "나는 지호야", pending_enroll=True)
    assert len(sent) == 2


async def test_who_asked_not_sent_when_no_consent(monkeypatch):
    _no_writeback(monkeypatch)

    class P(_P):
        async def say(self, text, on_ask=None, **kw):
            on_ask("who")
    sess = _Sess(P())
    ch = _Channel()
    h = _make_dc_handler(sess, ch)
    h(json.dumps({"type": "turn_face", "verdict": "no_consent", "who": "self"}))
    h(json.dumps({"type": "say", "text": "나 누구야?", "seq": 1}))
    await _drain()
    assert not any(m.get("type") == "who_asked" for m in ch.sent)


# --- pipeline 프롬프트 -------------------------------------------------

def _systems(seen):
    return [m["content"] for m in seen[0] if m["role"] == "system"]


async def test_pipeline_no_consent_turn_instruction_no_name_no_ask(monkeypatch):
    _fast_bridge(monkeypatch)
    seen, asks = [], []
    pipe = _make_pipe(["<lang=ko>", "설정에서 켜 줘"], seen)
    pipe.current_speaker_name = "지호"
    tfd = {"verdict": "no_consent", "who": "self", "at": time.monotonic()}
    await pipe.say("나 누구야?", turn_face=tfd, on_ask=asks.append, face_consent=False)
    sys_ = _systems(seen)
    assert any("얼굴 인식 허용" in c for c in sys_)
    assert not any("지호" in c for c in sys_)
    assert not any("카메라" in c for c in sys_)


async def test_pipeline_remember_me_guide_only_when_consent_false(monkeypatch):
    _fast_bridge(monkeypatch)
    seen = []
    pipe = _make_pipe(["<lang=ko>", "응"], seen)
    await pipe.say("기억해줘", face_consent=False, remember_me_asked=True)
    assert any(remember_me_consent_instruction() == c for c in _systems(seen))
    seen2 = []
    pipe2 = _make_pipe(["<lang=ko>", "응"], seen2)
    await pipe2.say("기억해줘", face_consent=None, remember_me_asked=True)
    assert not any("얼굴 인식 허용" in c for c in _systems(seen2))


async def test_pipeline_no_signal_regression_same_prompt(monkeypatch):
    _fast_bridge(monkeypatch)
    a, b = [], []
    tfd = {"verdict": "unknown", "quality": "dark", "personId": None, "score": None,
           "at": time.monotonic()}
    p1 = _make_pipe(["<lang=ko>", "응"], a)
    p2 = _make_pipe(["<lang=ko>", "응"], b)
    p1.current_speaker_name = p2.current_speaker_name = "지호"
    await p1.say("나 누구야?", turn_face=tfd)
    await p2.say("나 누구야?", turn_face=tfd, face_consent=None, remember_me_asked=False)
    assert _systems(a) == _systems(b)
    assert any("<ask=who>" in c for c in _systems(a))


# --- face_event 차단 (비동의) -------------------------------------------

import signaling as _sig  # noqa: E402


def _fe_sess(consent):
    sess = _Sess(_P())
    sess.face_consent = consent
    sess.prompt_unconfirmed = False
    return sess


@pytest.mark.parametrize("event", ["speaker_confirmed", "unknown_face", "multi_face", "known_face"])
def test_face_event_ignored_when_consent_false(monkeypatch, event):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess = _fe_sess(False)
    sess.current_speaker = (5, "기존")
    _sig._handle_face_event(sess, {"type": "face_event", "event": event, "personId": 7,
                                   "displayName": "민지"})
    assert sess.current_speaker == (5, "기존")   # 해제·교체 모두 없음
    assert sess.pending_enroll is False
    assert sess.reacted_keys == {}


def test_face_event_speaker_confirmed_still_works_when_none_or_true(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "0")
    monkeypatch.setenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", "1")
    monkeypatch.setenv("PRETHIRD_FACE_SCOPE_VERIFY", "0")
    for c in (None, True):
        sess = _fe_sess(c)
        _sig._handle_face_event(sess, {"type": "face_event", "event": "unknown_face"})
        assert getattr(sess, "face_event_ticket", 0) >= 1   # 기존 경로로 진입(티켓 증가)


def test_face_event_unrelated_type_not_blocked(monkeypatch):
    monkeypatch.setenv("PRETHIRD_SPEAKER_IDENTITY_ENABLED", "1")
    sess = _fe_sess(False)
    _sig._handle_face_event(sess, {"type": "face_event", "event": "other_thing"})
    assert getattr(sess, "face_event_ticket", 0) >= 1   # 차단되지 않고 기존 경로


# --- 롤백 스위치(PRETHIRD_WHOAMI_ENABLED=0)와 무관 / factory 없음 -----------

def test_no_consent_survives_whoami_switch_off(monkeypatch):
    monkeypatch.setenv("PRETHIRD_WHOAMI_ENABLED", "0")
    d = tf(verdict="no_consent", who="self")
    assert "얼굴 인식 허용" in turn_face_instruction(d, "지호", NOW)
    assert "얼굴 인식 허용" in turn_face_instruction(tf(verdict="known", who="self"), "지호", NOW, False)
    assert turn_face_names_allowed(d, NOW, True) is False
    assert turn_face_names_allowed(None, NOW, True, False) is False
    # 동의 신호 없으면 스위치 off 는 기존대로 무동작
    assert turn_face_instruction(tf(), "지호", NOW) is None
    assert turn_face_names_allowed(tf(), NOW, False) is True


async def test_offer_face_consent_saved_without_factory():
    app = make_app()  # pipeline_factory=None
    async with TestClient(TestServer(app)) as client:
        pc = RTCPeerConnection()
        pc.addTransceiver("video", direction="recvonly")
        pc.addTransceiver("audio", direction="recvonly")
        await pc.setLocalDescription(await pc.createOffer())
        resp = await client.post("/offer", json={
            "sdp": pc.localDescription.sdp, "type": pc.localDescription.type, "face_consent": False})
        sid = (await resp.json())["session_id"]
        assert app["mgr"].get(sid).face_consent is False
        await pc.close()
