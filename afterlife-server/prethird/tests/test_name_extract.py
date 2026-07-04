import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asyncio
import json
import pytest
import name_extract  # noqa: E402
from signaling import _make_dc_handler  # noqa: E402


# ---------------------------------------------------------------------------
# extract_name() 단위 테스트
# ---------------------------------------------------------------------------

async def test_extract_name_parses_ok(monkeypatch):
    async def _fake(*a, **k):
        return '{"name": "민지"}'
    monkeypatch.setattr(name_extract, "chat_once", _fake)
    assert await name_extract.extract_name("저 딸 민지예요") == "민지"


async def test_extract_name_empty_when_unclear(monkeypatch):
    async def _fake(*a, **k):
        return '{"name": ""}'
    monkeypatch.setattr(name_extract, "chat_once", _fake)
    assert await name_extract.extract_name("네 안녕하세요") == ""


async def test_extract_name_empty_input_skips_llm(monkeypatch):
    called = {"n": 0}
    async def _fake(*a, **k):
        called["n"] += 1
        return '{"name": "x"}'
    monkeypatch.setattr(name_extract, "chat_once", _fake)
    assert await name_extract.extract_name("   ") == ""
    assert called["n"] == 0


async def test_extract_name_llm_exception_returns_empty(monkeypatch):
    async def _boom(*a, **k):
        raise RuntimeError("ollama down")
    monkeypatch.setattr(name_extract, "chat_once", _boom)
    assert await name_extract.extract_name("저 딸 민지예요") == ""


async def test_extract_name_timeout_returns_empty(monkeypatch):
    async def _hang(*a, **k):
        await asyncio.sleep(10)
        return '{"name": "민지"}'
    monkeypatch.setattr(name_extract, "chat_once", _hang)
    monkeypatch.setattr(name_extract, "_TIMEOUT_S", 0.01)
    assert await name_extract.extract_name("저 딸 민지예요") == ""


def test_extract_name_malformed_json_returns_empty():
    assert name_extract._safe_name("no json here") == ""
    assert name_extract._safe_name('{"broken": ') == ""
    assert name_extract._safe_name('') == ""
    assert name_extract._safe_name('[1,2,3]') == ""


# ---------------------------------------------------------------------------
# signaling 통합: pending_enroll 훅 (브리프 4케이스 + datachannel 실패 생존)
# 패턴은 tests/test_face_react.py 의 FakeChannel/FakePipeline 을 그대로 따른다.
# ---------------------------------------------------------------------------

class _Channel:
    def __init__(self, closed=False):
        self.readyState = "closed" if closed else "open"
        self.sent = []
    def send(self, s): self.sent.append(json.loads(s))


class _RaisingChannel(_Channel):
    """send() 자체가 예외를 던짐 — 채널이 죽은 상황 시뮬(통화 생존 검증용)."""
    def send(self, s):
        raise RuntimeError("datachannel closed")


class _Pipeline:
    def __init__(self):
        self.say_calls = []
    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None):
        self.say_calls.append(text)
        if on_first_audio:
            on_first_audio()


class _Sess:
    def __init__(self, pending_enroll=False):
        self.pipeline = _Pipeline()
        self.session_id = "s1"
        self.se_path = None
        self.offer_time = None
        self.recorder = None
        self.state = None
        self.reacted_keys = {}
        self.pending_enroll = pending_enroll
        self.current_speaker = None
        self.pending_react = None
    def set_state(self, s): self.state = s


def _run_handler(sess, channel, msg):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, channel)
        handler(json.dumps(msg))
        for _ in range(10):
            loop.run_until_complete(asyncio.sleep(0))
            pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
            if not pending:
                break
        pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
        if pending:
            loop.run_until_complete(asyncio.gather(*pending))
    finally:
        asyncio.set_event_loop(None)
        loop.close()


def test_pending_enroll_say_sends_enroll_suggest_and_clears_flag(monkeypatch):
    async def _fake_extract(text):
        return "민지"
    monkeypatch.setattr(name_extract, "extract_name", _fake_extract)

    sess, ch = _Sess(pending_enroll=True), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "저 딸 민지예요", "seq": 1})

    suggests = [m for m in ch.sent if m["type"] == "enroll_suggest"]
    assert suggests == [{"type": "enroll_suggest", "name": "민지"}]
    assert sess.pending_enroll is False
    # say 본 흐름은 그대로 정상 호출된다(지연·변경 없음).
    assert sess.pipeline.say_calls == ["저 딸 민지예요"]


def test_second_say_does_not_resend_enroll_suggest(monkeypatch):
    async def _fake_extract(text):
        return "민지"
    monkeypatch.setattr(name_extract, "extract_name", _fake_extract)

    sess, ch = _Sess(pending_enroll=True), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "저 딸 민지예요", "seq": 1})
    _run_handler(sess, ch, {"type": "say", "text": "네 알겠어요", "seq": 2})

    suggests = [m for m in ch.sent if m["type"] == "enroll_suggest"]
    assert len(suggests) == 1
    assert sess.pipeline.say_calls == ["저 딸 민지예요", "네 알겠어요"]


def test_extract_exception_sends_empty_name(monkeypatch):
    async def _boom(text):
        raise RuntimeError("ollama down")
    monkeypatch.setattr(name_extract, "extract_name", _boom)

    sess, ch = _Sess(pending_enroll=True), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "음...", "seq": 1})

    suggests = [m for m in ch.sent if m["type"] == "enroll_suggest"]
    assert suggests == [{"type": "enroll_suggest", "name": ""}]  # 카드 수동입력 폴백
    assert sess.pending_enroll is False


def test_pending_enroll_false_hook_inactive(monkeypatch):
    called = {"n": 0}
    async def _fake_extract(text):
        called["n"] += 1
        return "민지"
    monkeypatch.setattr(name_extract, "extract_name", _fake_extract)

    sess, ch = _Sess(pending_enroll=False), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "안녕하세요", "seq": 1})

    assert called["n"] == 0
    suggests = [m for m in ch.sent if m["type"] == "enroll_suggest"]
    assert suggests == []
    assert sess.pipeline.say_calls == ["안녕하세요"]


def test_datachannel_send_failure_call_survives(monkeypatch):
    async def _fake_extract(text):
        return "민지"
    monkeypatch.setattr(name_extract, "extract_name", _fake_extract)

    sess, ch = _Sess(pending_enroll=True), _RaisingChannel()
    # channel.send() 예외가 통화 자체를 죽이지 않아야 한다 — say 정상 호출 유지.
    _run_handler(sess, ch, {"type": "say", "text": "저 딸 민지예요", "seq": 1})
    assert sess.pipeline.say_calls == ["저 딸 민지예요"]
    assert sess.pending_enroll is False
