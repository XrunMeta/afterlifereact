"""tests/test_tts_split_render.py — 2026-10-21 세그먼트 문장별 렌더.

실측(21:08 턴): sentence_buffer 가 두 문장을 한 세그먼트로 묶으면 _tts_stage_multi 가 두 문장
TTS(6.2s)를 다 끝낸 뒤 렌더해 첫 소리가 10.6s 였다. 문장마다 렌더 큐에 넣으면 첫 문장 렌더가
둘째 문장 TTS 를 기다리지 않는다.
"""
from __future__ import annotations

import asyncio
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from pipeline import DialoguePipeline, split_segment_for_render  # noqa: E402


def test_두_문장은_나눈다():
    assert split_segment_for_render("첫 문장이야. 둘째 문장도 있어!", 6) == ["첫 문장이야.", "둘째 문장도 있어!"]


def test_한_문장은_그대로():
    assert split_segment_for_render("한 문장뿐이야", 6) == ["한 문장뿐이야"]


def test_짧은_조각은_다음_조각에_붙인다():
    assert split_segment_for_render("응. 그건 나도 좋아하는 거야.", 6) == ["응. 그건 나도 좋아하는 거야."]


def test_마지막_짧은_조각은_앞_조각에_붙인다():
    assert split_segment_for_render("그건 나도 좋아하는 거야. 응!", 6) == ["그건 나도 좋아하는 거야. 응!"]


def test_줄바꿈도_경계():
    assert split_segment_for_render("첫 줄 문장이야\n둘째 줄 문장이야", 4) == ["첫 줄 문장이야", "둘째 줄 문장이야"]


class _VT:
    def begin_response(self):
        pass

    def push_ndarray(self, arr):
        pass

    def signal_end(self):
        pass


class _AT:
    def push_pcm_int16(self, pcm):
        pass

    def signal_end(self):
        pass


def _run_one_segment(monkeypatch, split: str) -> list[tuple]:
    """두 문장을 한 세그먼트로 받게 만들고(문장 버퍼 최소 길이 크게) 이벤트 순서를 돌려준다."""
    monkeypatch.setenv("PRETHIRD_SENTENCE_MIN_LEN", "500")
    monkeypatch.setenv("PRETHIRD_TTS_SPLIT_RENDER", split)
    for k in ("PRETHIRD_BRIDGE_GRACE_MS", "PRETHIRD_BRIDGE_DURATION_MS", "PRETHIRD_POST_BRIDGE_DELAY_MS"):
        monkeypatch.setenv(k, "0")
    events: list[tuple] = []

    async def fake_chat(messages):
        yield "첫 문장은 이거야. 둘째 문장도 이어서 할게."

    async def fake_say(text, se_path=None):
        events.append(("tts_start", text))
        await asyncio.sleep(0.2)
        events.append(("tts_done", text))
        return b"WAV"

    def fake_decode(b):
        return np.zeros(4800, dtype=np.int16), 24000, 1

    def fake_infer(wav_path, on_frame):
        events.append(("infer",))
        on_frame(np.zeros((4, 4, 3), np.uint8))
        return 1

    p = DialoguePipeline(
        video_track=_VT(), audio_track=_AT(),
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )
    p._render_mode = "partial"
    asyncio.run(p.say("안녕"))
    return events


def test_첫_문장_렌더가_둘째_문장_TTS를_기다리지_않는다(monkeypatch):
    events = _run_one_segment(monkeypatch, "1")
    assert events.count(("infer",)) == 2
    first_infer = events.index(("infer",))
    second_tts_done = events.index(("tts_done", "둘째 문장도 이어서 할게."))
    assert first_infer < second_tts_done, events


def test_끄면_기존처럼_두_문장_TTS_뒤_한_번_렌더(monkeypatch):
    events = _run_one_segment(monkeypatch, "0")
    assert events.count(("infer",)) == 1
    assert events.index(("infer",)) > events.index(("tts_done", "둘째 문장도 이어서 할게."))
