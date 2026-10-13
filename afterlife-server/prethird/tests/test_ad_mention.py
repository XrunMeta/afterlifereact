"""AFL-1003 통화 광고 멘트 — 광고 예고/복귀 사실을 LLM system 메시지로 주입."""
import asyncio

import numpy as np
import pytest

from pipeline import (
    DialoguePipeline,
    ad_prenotice_system_message,
    ad_returned_system_message,
)

_BAD = ("안 본다", "안 볼", "보여주지 않", "거부")
_CIRCLED = "①②③④⑤"


@pytest.mark.parametrize("fn", [ad_prenotice_system_message, ad_returned_system_message])
def test_helper_shape(fn):
    m = fn()
    assert m["role"] == "system"
    assert m["content"].strip()
    assert "광고" in m["content"]
    assert not any(c in m["content"] for c in _CIRCLED)


def test_prenotice_does_not_encourage_refusal():
    c = ad_prenotice_system_message()["content"]
    # 거부 금지 지시는 있어도, 거부를 권하는 문구는 없어야 한다
    assert "보고 올게" in c
    assert "거부하거나" in c and "하지 마" in c


def test_returned_mentions_return_and_flower():
    c = ad_returned_system_message()["content"]
    assert "돌아" in c
    assert "꽃" in c


def _make_pipeline(captured):
    async def chat_fn(messages):
        captured.append(messages)
        for tok in ["응,", "알겠어."]:
            yield tok

    async def say_fn(text, se_path):
        return b"WAV"

    def decode_wav_fn(b):
        return np.zeros(480, dtype=np.int16), 48000, 1

    def infer_fn(wav_path, on_frame):
        on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
        return 1

    class _T:
        def push_ndarray(self, a): pass
        def push_pcm_int16(self, p): pass
        def signal_end(self): pass
        def begin_response(self): pass

    return DialoguePipeline(
        _T(), _T(), chat_fn, say_fn, decode_wav_fn, infer_fn,
        persona_messages=[{"role": "system", "content": "너는 클론"}],
    )


def _run(coro):
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(coro)
    finally:
        loop.close()


def test_say_default_unchanged():
    cap = []
    pipe = _make_pipeline(cap)
    _run(pipe.say("안녕"))
    assert cap[0] == [
        {"role": "system", "content": "너는 클론"},
        {"role": "user", "content": "안녕"},
    ]


def test_say_pre_appends_prenotice_once():
    cap = []
    pipe = _make_pipeline(cap)
    _run(pipe.say("안녕", ad_event="pre"))
    assert cap[0][-1] == ad_prenotice_system_message()
    assert cap[0][-2] == {"role": "user", "content": "안녕"}


def test_say_ad_notice_hint_consumed():
    cap = []
    pipe = _make_pipeline(cap)
    pipe.ad_notice_hint = "pre"
    _run(pipe.say("안녕"))
    _run(pipe.say("또"))
    assert cap[0][-1] == ad_prenotice_system_message()
    assert ad_prenotice_system_message() not in cap[1]


def test_say_returned_clone_initiated_and_history_none():
    cap = []
    pipe = _make_pipeline(cap)
    rec = []
    pipe._history.record = lambda u, a: rec.append((u, a))
    _run(pipe.say("", ad_event="returned"))
    msgs = cap[0]
    assert msgs[0] == {"role": "system", "content": "너는 클론"}
    assert msgs[1] == ad_returned_system_message()
    assert msgs[-1]["role"] == "user" and "돌아왔다" in msgs[-1]["content"]
    assert rec and rec[0][0] is None and rec[0][1]
