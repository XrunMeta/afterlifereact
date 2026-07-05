"""tests/test_pipeline_batch.py — pipeline._run_batch (T-113 Task5).

render_mode=="batch" 일 때 답변(턴) 전체 텍스트를 문장 분할 없이 누적해
TTS 정확히 1회 · infer 정확히 1회(render_mode="batch" 명시 전달)로 처리해야
한다(A1 = 단일 모션). partial 경로(문장별 TTS/infer 오버레이)는 호출되지
않아야 한다 — 문장이 3개(첫/둘/셋)여도 TTS/infer 호출 수는 1이어야 함이
이 스위트의 핵심 assert.
"""
from __future__ import annotations

import pathlib
import sys

import numpy as np
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from pipeline import DialoguePipeline  # noqa: E402


class FakeVideoTrack:
    def __init__(self):
        self.frames = []

    def push_ndarray(self, arr):
        self.frames.append(arr)

    def signal_end(self):
        return 0


class FakeAudioTrack:
    def __init__(self):
        self.pcm = []

    def push_pcm_int16(self, pcm):
        self.pcm.append(pcm)

    def signal_end(self):
        return 0


@pytest.mark.asyncio
async def test_batch_single_tts_single_infer(monkeypatch):
    """say() 를 통해 구동해도 render_mode=batch 면 TTS 1회·infer 1회·
    render_mode="batch" 가 실제로 전달됨을 확인."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")

    tts_calls: list[str] = []
    infer_calls: list[str | None] = []

    async def chat_fn(messages):
        for tok in ["첫 문장이다. ", "둘째 문장도 있다. ", "셋째다."]:
            yield tok

    async def say_fn(text, se_path=None):
        tts_calls.append(text)
        return b"WAVfake"

    def decode_wav_fn(b):
        return np.zeros(1920, dtype=np.int16), 48000, 1

    def infer_fn(wav_path, on_frame, **k):
        infer_calls.append(k.get("render_mode"))
        on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
        return 1

    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=chat_fn, say_fn=say_fn,
        decode_wav_fn=decode_wav_fn, infer_fn=infer_fn,
    )
    assert p._render_mode == "batch"

    await p.say("아무 말")

    assert len(tts_calls) == 1, f"TTS 는 정확히 1회 호출돼야 함(실제: {tts_calls})"
    assert infer_calls == ["batch"], f"infer 는 1회·render_mode='batch' 여야 함(실제: {infer_calls})"
    # 전체 텍스트가 이어붙여져 하나로 합성됐는지(문장 분할 없이 누적)
    assert tts_calls[0] == "첫 문장이다. 둘째 문장도 있다. 셋째다."
    # 완성 프레임/오디오가 push 됐는지(단일 모션 결과가 트랙에 적재)
    assert len(vt.frames) == 1
    assert len(at.pcm) == 1


@pytest.mark.asyncio
async def test_batch_signal_end_called():
    """batch 경로도 완료 후 video/audio signal_end 를 호출한다(partial과 동일 보장)."""
    import os
    os.environ["PRETHIRD_RENDER_MODE"] = "batch"
    try:
        end_calls = {"video": 0, "audio": 0}

        async def chat_fn(messages):
            yield "한 문장뿐이다."

        async def say_fn(text, se_path=None):
            return b"WAVfake"

        def decode_wav_fn(b):
            return np.zeros(960, dtype=np.int16), 48000, 1

        def infer_fn(wav_path, on_frame, **k):
            on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
            return 1

        class TrackWithEnd:
            def __init__(self, key):
                self.key = key

            def push_ndarray(self, arr):
                pass

            def push_pcm_int16(self, pcm):
                pass

            def signal_end(self):
                end_calls[self.key] += 1

        vt, at = TrackWithEnd("video"), TrackWithEnd("audio")
        p = DialoguePipeline(
            video_track=vt, audio_track=at,
            chat_fn=chat_fn, say_fn=say_fn,
            decode_wav_fn=decode_wav_fn, infer_fn=infer_fn,
        )
        await p.say("테스트")
        assert end_calls["video"] == 1
        assert end_calls["audio"] == 1
    finally:
        del os.environ["PRETHIRD_RENDER_MODE"]


@pytest.mark.asyncio
async def test_batch_empty_stream_no_tts_no_infer(monkeypatch):
    """LLM 스트림이 빈 경우 TTS/infer 모두 호출되지 않고 signal_end만 호출."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")

    tts_calls = []
    infer_calls = []

    async def chat_fn(messages):
        return
        yield  # noqa: unreachable — make this an async generator

    async def say_fn(text, se_path=None):
        tts_calls.append(text)
        return b"WAVfake"

    def decode_wav_fn(b):
        return np.zeros(960, dtype=np.int16), 48000, 1

    def infer_fn(wav_path, on_frame, **k):
        infer_calls.append(k.get("render_mode"))
        return 0

    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=chat_fn, say_fn=say_fn,
        decode_wav_fn=decode_wav_fn, infer_fn=infer_fn,
    )
    await p.say("")
    assert tts_calls == []
    assert infer_calls == []
    assert len(vt.frames) == 0
    assert len(at.pcm) == 0


@pytest.mark.asyncio
async def test_batch_exception_still_signals_end(monkeypatch):
    """say_fn(TTS) 실패해도 예외가 전파되고 signal_end 는 보장된다(partial과 동일 안전성)."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    ended = []

    class VT:
        def push_ndarray(self, arr):
            pass

        def signal_end(self):
            ended.append("v")

    class AT:
        def push_pcm_int16(self, pcm):
            pass

        def signal_end(self):
            ended.append("a")

    async def chat_fn(messages):
        yield "문장."

    async def say_fn(text, se_path=None):
        raise RuntimeError("TTS down")

    def decode_wav_fn(b):
        return np.zeros(10, dtype=np.int16), 48000, 1

    def infer_fn(wav_path, on_frame, **k):
        return 0

    p = DialoguePipeline(
        video_track=VT(), audio_track=AT(),
        chat_fn=chat_fn, say_fn=say_fn,
        decode_wav_fn=decode_wav_fn, infer_fn=infer_fn,
    )
    with pytest.raises(RuntimeError):
        await p.say("x")
    assert "v" in ended and "a" in ended
