import asyncio
import json
import pytest
from signaling import _make_dc_handler


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
    async def greet(self, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None):
        self.greet_calls += 1
        if on_first_audio:
            on_first_audio()  # 발화 시작 모사
    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None):
        self.say_calls.append(text)
        if on_sentence:
            on_sentence("첫 문장입니다.")
            on_sentence("둘째 문장입니다.")
        if on_first_audio:
            on_first_audio()
    async def speak(self, text, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None):
        self.speak_calls.append(text)
        if on_first_audio:
            on_first_audio()


class _Sess:
    def __init__(self):
        self.pipeline = _Pipeline()
        self.session_id = "s1"
        self.se_path = None
        self.offer_time = None
        self.recorder = None
        self.state = None
    def set_state(self, s): self.state = s


def _run_handler(sess, channel, msg):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, channel)
        handler(json.dumps(msg))
        # ensure_future 로 띄운 _run 완료 대기
        loop.run_until_complete(asyncio.sleep(0))
        pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
        if pending:
            loop.run_until_complete(asyncio.gather(*pending))
    finally:
        asyncio.set_event_loop(None)
        loop.close()


def test_greet_triggers_pipeline_and_speech_start():
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "greet", "seq": 7})
    assert sess.pipeline.greet_calls == 1
    # 발화 시작 → speech_start, 종료 → speech_end (둘 다 seq echo)
    types = [(m["type"], m.get("seq")) for m in ch.sent]
    assert ("speech_start", 7) in types
    assert ("speech_end", 7) in types
    assert types.index(("speech_start", 7)) < types.index(("speech_end", 7))


def test_say_also_emits_speech_start():
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 3})
    assert sess.pipeline.say_calls == ["안녕"]
    assert ("speech_start", 3) in [(m["type"], m.get("seq")) for m in ch.sent]


def test_speak_also_emits_speech_start():
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "speak", "text": "반가워", "seq": 5})
    assert sess.pipeline.speak_calls == ["반가워"]
    types = [(m["type"], m.get("seq")) for m in ch.sent]
    assert ("speech_start", 5) in types
    assert ("speech_end", 5) in types
    assert types.index(("speech_start", 5)) < types.index(("speech_end", 5))


def test_say_emits_speech_text_per_sentence():
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 9})
    texts = [(m["type"], m.get("text"), m.get("seq")) for m in ch.sent]
    assert ("speech_text", "첫 문장입니다.", 9) in texts
    assert ("speech_text", "둘째 문장입니다.", 9) in texts
    # 순서: speech_text 들은 speech_end 이전
    types = [m["type"] for m in ch.sent]
    assert types.index("speech_text") < types.index("speech_end")


def test_greet_disabled_ignored(monkeypatch):
    monkeypatch.setenv("PRETHIRD_GREETING_ENABLED", "0")
    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "greet", "seq": 1})
    assert sess.pipeline.greet_calls == 0
    assert ch.sent == []
