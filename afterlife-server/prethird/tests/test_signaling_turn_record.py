"""test_signaling_turn_record.py — say 턴 종료 시 call_turns 기록 배선 검증.

핵심: 대화 원문 기록은 학습 게이트(PRETHIRD_LEARN_ENABLED·동의)와 독립이어야 한다.
학습이 꺼진 환경에서 통화 원문이 통째로 유실되던 것이 이 배선의 도입 사유다.
"""
import asyncio
import json as _json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from signaling import _make_dc_handler  # noqa: E402
from session import Session  # noqa: E402
import turn_writeback as tw  # noqa: E402


class _FakePipeline:
    def __init__(self):
        self.said = []

    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None,
                  on_sentence=None):
        if turn is not None:
            turn.append_token("그래 ")
            turn.append_token("기억할게")
        self.said.append(text)

    async def speak(self, text, **kw):
        self.said.append(text)


def _run_say(monkeypatch, tmp_path, *, learn_enabled: str | None, speaker=None):
    from recorder import make_recorder

    captured: list[dict] = []

    async def _fake_tw(call_id, user_text, clone_reply, dedupe_key=None,
                       speaker_person_id=None):
        captured.append({
            "call_id": call_id, "user_text": user_text,
            "clone_reply": clone_reply, "dedupe_key": dedupe_key,
            "speaker_person_id": speaker_person_id,
        })

    monkeypatch.setattr(tw, "turn_writeback", _fake_tw)
    if learn_enabled is None:
        monkeypatch.delenv("PRETHIRD_LEARN_ENABLED", raising=False)
    else:
        monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", learn_enabled)

    sess = Session("0123456789ab")
    sess.pipeline = _FakePipeline()
    sess.offer_time = 1_700_000_000.0
    sess.recorder = make_recorder(9114, sess.session_id, root=str(tmp_path))
    sess.current_speaker = speaker

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, channel=None)
        handler(_json.dumps({"type": "say", "text": "이름 기억해", "seq": 3}))
        loop.run_until_complete(asyncio.sleep(0.05))
    finally:
        asyncio.set_event_loop(None)
        loop.close()
    return captured


def test_say_schedules_turn_writeback(monkeypatch, tmp_path):
    captured = _run_say(monkeypatch, tmp_path, learn_enabled="1")
    assert len(captured) == 1
    rec = captured[0]
    # call_id 는 별도 값이 아니라 prethird session_id 그대로다.
    assert rec["call_id"] == "0123456789ab"
    assert rec["user_text"] == "이름 기억해"
    assert rec["clone_reply"] == "그래 기억할게"   # turn._tokens 누적본
    assert rec["dedupe_key"] == "0123456789ab:3"


def test_turn_record_carries_current_speaker(monkeypatch, tmp_path):
    """화자가 확정돼 있으면 그 person_id 가 기록에 함께 실린다.

    이게 없으면 call_turns 에 "누가 말했는가"가 남지 않아, 같은 통화에서 화자별
    L2'(clone_ont_person)로 학습된 내용이 올바른 사람에게 귀속됐는지 사후 검증할
    수 없다. learn_writeback 은 이미 같은 값을 받고 있었고 기록만 빠져 있었다.
    """
    captured = _run_say(monkeypatch, tmp_path, learn_enabled="1", speaker=(43, "hh"))
    assert captured[0]["speaker_person_id"] == 43


def test_turn_record_speaker_none_when_unconfirmed(monkeypatch, tmp_path):
    """화자 미확정(얼굴 없음·다중 얼굴·강등)이면 None — 익명으로 남는다."""
    captured = _run_say(monkeypatch, tmp_path, learn_enabled="1", speaker=None)
    assert captured[0]["speaker_person_id"] is None


def test_turn_record_independent_of_learn_gate(monkeypatch, tmp_path):
    """학습 토글이 꺼져 있어도 기록은 나간다."""
    captured = _run_say(monkeypatch, tmp_path, learn_enabled=None)
    assert len(captured) == 1
    assert captured[0]["user_text"] == "이름 기억해"


def test_say_survives_turn_writeback_failure(monkeypatch, tmp_path):
    """기록 전송이 예외를 던져도 say 흐름은 정상 완료된다(통화 무영향)."""
    from recorder import make_recorder

    async def _boom(*a, **k):
        raise RuntimeError("network")

    monkeypatch.setattr(tw, "turn_writeback", _boom)
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "0")

    sess = Session("0123456789ab")
    sess.pipeline = _FakePipeline()
    sess.offer_time = 1_700_000_000.0
    sess.recorder = make_recorder(9114, sess.session_id, root=str(tmp_path))

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, channel=None)
        handler(_json.dumps({"type": "say", "text": "여보세요", "seq": 1}))
        loop.run_until_complete(asyncio.sleep(0.05))
    finally:
        asyncio.set_event_loop(None)
        loop.close()

    assert sess.pipeline.said == ["여보세요"]
    assert sess.state == "idle"
