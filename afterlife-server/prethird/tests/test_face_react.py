import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asyncio
import json
import pytest
from signaling import _make_dc_handler  # noqa: E402


class _Channel:
    def __init__(self):
        self.readyState = "open"
        self.sent = []
    def send(self, s): self.sent.append(json.loads(s))


class _Pipeline:
    def __init__(self):
        self.greet_calls = 0
        self.say_calls = []
        self.speak_calls = []
        self.react_calls = []
    async def greet(self, turn=None, on_first_audio=None):
        self.greet_calls += 1
        if on_first_audio:
            on_first_audio()
    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None):
        self.say_calls.append(text)
        if on_first_audio:
            on_first_audio()
    async def speak(self, text, turn=None, on_first_audio=None, on_response_ready=None):
        self.speak_calls.append(text)
        if on_first_audio:
            on_first_audio()
    async def react(self, kind, display_name=None, turn=None, on_first_audio=None):
        self.react_calls.append((kind, display_name))


class _Sess:
    def __init__(self):
        self.pipeline = _Pipeline()
        self.session_id = "s1"
        self.se_path = None
        self.offer_time = None
        self.recorder = None
        self.state = None
        self.reacted_keys = {}
        self.pending_enroll = False
        self.current_speaker = None
    def set_state(self, s): self.state = s


def _run_handler(sess, channel, msg):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, channel)
        handler(json.dumps(msg))
        loop.run_until_complete(asyncio.sleep(0))
        pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
        if pending:
            loop.run_until_complete(asyncio.gather(*pending))
    finally:
        asyncio.set_event_loop(None)
        loop.close()


def test_face_event_disabled_by_default(monkeypatch):
    monkeypatch.delenv("PRETHIRD_FACE_REACT_ENABLED", raising=False)
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    })
    assert sess.pipeline.react_calls == []
    assert sess.reacted_keys == {}
    assert sess.pending_enroll is False
    assert sess.current_speaker is None
    assert ch.sent == []


def test_known_face_react(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    })
    assert sess.pipeline.react_calls == [("known", "민지")]
    assert sess.current_speaker == (3, "민지")
    assert "3" in sess.reacted_keys


def test_unknown_face_react_sets_pending(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "face_event", "event": "unknown_face", "seq": 1})
    assert sess.pipeline.react_calls == [("unknown", None)]
    assert sess.pending_enroll is True


def test_multi_face_treated_as_unknown(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "face_event", "event": "multi_face", "seq": 2})
    assert sess.pipeline.react_calls == [("unknown", None)]
    assert sess.pending_enroll is True


def test_cooldown_same_key(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    sess, ch = _Sess(), _Channel()
    msg = {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    }
    _run_handler(sess, ch, msg)
    _run_handler(sess, ch, msg)
    assert sess.pipeline.react_calls == [("known", "민지")]


def test_say_regression():
    """face_event 코드 추가가 기존 say 흐름에 영향을 주지 않는다(회귀 0)."""
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 3})
    assert sess.pipeline.say_calls == ["안녕"]
    assert sess.pipeline.react_calls == []
    assert ("speech_start", 3) in [(m["type"], m.get("seq")) for m in ch.sent]
