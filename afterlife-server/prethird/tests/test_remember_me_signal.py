"""test_remember_me_signal.py — "기억해줘" 발화 → datachannel remember_me 통보 배선.

핵심 계약 둘:
1. payload 에 **이름 자리가 없다.** 이름은 시트에서 사용자가 직접 입력한다.
2. 기존 enroll_suggest 경로를 막지 않는다(독립 분기).
"""
import asyncio
import json as _json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from signaling import _make_dc_handler  # noqa: E402
from session import Session  # noqa: E402


class _FakePipeline:
    def __init__(self):
        self.said = []

    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None,
                  on_sentence=None):
        self.said.append(text)

    async def speak(self, text, **kw):
        self.said.append(text)


class _FakeChannel:
    readyState = "open"

    def __init__(self):
        self.sent = []

    def send(self, msg):
        self.sent.append(_json.loads(msg))


def _run(text, tmp_path):
    from recorder import make_recorder

    sess = Session("0123456789ab")
    sess.pipeline = _FakePipeline()
    sess.offer_time = 1_700_000_000.0
    sess.recorder = make_recorder(9114, sess.session_id, root=str(tmp_path))
    channel = _FakeChannel()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, channel=channel)
        handler(_json.dumps({"type": "say", "text": text, "seq": 1}))
        loop.run_until_complete(asyncio.sleep(0.05))
    finally:
        asyncio.set_event_loop(None)
        loop.close()
    return channel.sent


def _remember_me_msgs(sent):
    return [m for m in sent if m.get("type") == "remember_me"]


def test_기억해줘_발화는_시트를_연다(tmp_path):
    msgs = _remember_me_msgs(_run("내 이름 기억해줘", tmp_path))
    assert len(msgs) == 1
    assert msgs[0]["reason"] == "asked"


def test_payload_에_이름_자리가_없다(tmp_path):
    """이름이 실려 나갈 통로가 있으면 STT 오인식이 다시 신원이 된다 — 그 통로를 두지 않는다."""
    msg = _remember_me_msgs(_run("내 이름은 지호야 기억해줘", tmp_path))[0]
    assert set(msg.keys()) == {"type", "reason"}
    assert "지호" not in _json.dumps(msg, ensure_ascii=False)


def test_평범한_발화는_시트를_열지_않는다(tmp_path):
    for text in ("어제 일 기억해?", "오늘 날씨 좋더라", "그 얘기 기억해줘"):
        assert _remember_me_msgs(_run(text, tmp_path)) == [], text


def test_say_본흐름은_그대로_진행된다(tmp_path):
    """이 통보는 fire-and-forget 이고 발화를 막지 않는다."""
    from recorder import make_recorder

    sess = Session("0123456789ab")
    sess.pipeline = _FakePipeline()
    sess.offer_time = 1_700_000_000.0
    sess.recorder = make_recorder(9114, sess.session_id, root=str(tmp_path))

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, channel=_FakeChannel())
        handler(_json.dumps({"type": "say", "text": "내 이름 기억해줘", "seq": 1}))
        loop.run_until_complete(asyncio.sleep(0.05))
    finally:
        asyncio.set_event_loop(None)
        loop.close()

    assert sess.pipeline.said == ["내 이름 기억해줘"]
    assert sess.state == "idle"
