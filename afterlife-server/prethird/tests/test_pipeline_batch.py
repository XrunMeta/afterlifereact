"""tests/test_pipeline_batch.py — pipeline._run_batch (T-113 Task5).

render_mode=="batch" 일 때 답변(턴) 전체 텍스트를 문장 분할 없이 누적해
TTS 정확히 1회 · infer 정확히 1회(render_mode="batch" 명시 전달)로 처리해야
한다(A1 = 단일 모션). partial 경로(문장별 TTS/infer 오버레이)는 호출되지
않아야 한다 — 문장이 3개(첫/둘/셋)여도 TTS/infer 호출 수는 1이어야 함이
이 스위트의 핵심 assert.
"""
from __future__ import annotations

import logging
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
async def test_batch_on_first_audio_fires_at_first_push_not_after_full_render(monkeypatch):
    """[실통화 디버그] batch 의 on_first_audio(dc speech_start → RN dialing 화면
    해제 신호)는 _infer_stage 의 on_before_push 시점(렌더 완료 후·첫 push
    직전)에 정확히 1회 호출돼야 한다 — _run_batch 말미(전체 완료 후)에서
    호출되면 dialing 화면이 고착된다(실통화로 확인된 회귀). 순서 검증:
    on_first_audio 호출이 vt.push_ndarray 보다 먼저 기록돼야 하며
    (on_before_push는 push 직전이므로 반드시 선행), 중복 호출은 없어야 한다."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    order: list[str] = []

    async def chat_fn(messages):
        yield "문장."

    async def say_fn(text, se_path=None):
        return b"WAVfake"

    def decode_wav_fn(b):
        return np.zeros(960, dtype=np.int16), 48000, 1

    def infer_fn(wav_path, on_frame, **k):
        on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
        return 1

    class VT:
        def push_ndarray(self, arr):
            order.append("push")

        def signal_end(self):
            order.append("signal_end")

    class AT:
        def push_pcm_int16(self, pcm):
            pass

        def signal_end(self):
            pass

    p = DialoguePipeline(
        video_track=VT(), audio_track=AT(),
        chat_fn=chat_fn, say_fn=say_fn,
        decode_wav_fn=decode_wav_fn, infer_fn=infer_fn,
    )
    await p.say("x", on_first_audio=lambda: order.append("first_audio"))

    assert order.count("first_audio") == 1, f"on_first_audio 는 정확히 1회여야 함(실제: {order})"
    assert order.index("first_audio") < order.index("push"), (
        f"on_first_audio 는 push 직전(on_before_push)에 호출돼야 함(실제 순서: {order})"
    )


@pytest.mark.asyncio
async def test_batch_empty_text_does_not_fire_on_first_audio(monkeypatch):
    """빈 응답(empty full_text) 경로는 발화 자체가 없으므로 on_first_audio
    (dc speech_start)를 호출하면 안 된다 — on_response_ready(filler 정지)만
    호출(직전 sion 패치 유지 확인)."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    first_audio_calls = []
    response_ready_calls = []

    async def chat_fn(messages):
        return
        yield  # noqa: unreachable

    async def say_fn(text, se_path=None):
        return b"WAVfake"

    def decode_wav_fn(b):
        return np.zeros(960, dtype=np.int16), 48000, 1

    def infer_fn(wav_path, on_frame, **k):
        return 0

    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=chat_fn, say_fn=say_fn,
        decode_wav_fn=decode_wav_fn, infer_fn=infer_fn,
    )
    await p.say(
        "",
        on_first_audio=lambda: first_audio_calls.append(1),
        on_response_ready=lambda: response_ready_calls.append(1),
    )

    assert first_audio_calls == [], "빈 응답은 on_first_audio 를 호출하면 안 됨"
    assert response_ready_calls == [1], "빈 응답도 on_response_ready(filler 정지)는 호출돼야 함"


@pytest.mark.asyncio
async def test_batch_empty_text_fires_response_ready_hook_and_signals_end(monkeypatch):
    """[sion MAJOR 2] LLM 스트림이 비어 full_text가 빈 문자열이면 `_run_batch`가
    조기 return 하는데, 이 경로도 filler 정지 훅(on_response_ready)을 반드시
    1회 호출해야 한다 — 그렇지 않으면 FillerPlayer가 세션 끝까지 순환하는
    T-088 좀비 패턴이 재발한다. signal_end 도 기존과 동일하게 보장돼야 한다."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")

    tts_calls = []
    infer_calls = []
    hook_calls = []
    ended = []

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

    p = DialoguePipeline(
        video_track=VT(), audio_track=AT(),
        chat_fn=chat_fn, say_fn=say_fn,
        decode_wav_fn=decode_wav_fn, infer_fn=infer_fn,
    )
    await p.say("", on_response_ready=lambda: hook_calls.append(1))

    assert tts_calls == []
    assert infer_calls == []
    assert hook_calls == [1], "빈 응답(empty text) 조기 반환 경로도 filler 정지 훅이 1회 호출돼야 함"
    assert "v" in ended and "a" in ended


@pytest.mark.asyncio
async def test_batch_tts_failure_no_crash_but_signals_end(monkeypatch, caplog):
    """[T-113 Task6] say_fn(TTS) 실패 시 spec §6 계약: 예외는 _run_batch 가
    직접 삼켜(log.error) 밖으로 전파하지 않는다(partial 자동 폴백 없음 —
    이 텀은 그냥 idle 로 남는다). signal_end 는 여전히 보장되고, 프레임/
    오디오는 push 되지 않는다."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    ended = []
    pushed = {"v": 0, "a": 0}

    class VT:
        def push_ndarray(self, arr):
            pushed["v"] += 1

        def signal_end(self):
            ended.append("v")

    class AT:
        def push_pcm_int16(self, pcm):
            pushed["a"] += 1

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
    with caplog.at_level(logging.ERROR, logger="prethird.pipeline"):
        await p.say("x")  # 예외가 전파되면 이 await 에서 테스트가 즉시 실패한다
    assert "v" in ended and "a" in ended
    assert pushed == {"v": 0, "a": 0}
    assert any("batch" in r.message.lower() for r in caplog.records), (
        "TTS 실패가 log.error 로 기록돼야 함"
    )


@pytest.mark.asyncio
async def test_batch_render_failure_no_crash(monkeypatch, caplog):
    """[T-113 Task6 brief Step1] infer_fn(렌더) 실패 시에도 _run_batch 는
    크래시 없이 종료(프레임 0, 예외 미전파) — spec §6."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")

    async def chat_fn(messages):
        yield "문장."

    async def say_fn(text, se_path=None):
        return b"WAVfake"

    def decode_wav_fn(b):
        return np.zeros(960, dtype=np.int16), 48000, 1

    def infer_fn(wav_path, on_frame, **k):
        raise RuntimeError("render boom")

    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=chat_fn, say_fn=say_fn,
        decode_wav_fn=decode_wav_fn, infer_fn=infer_fn,
    )
    with caplog.at_level(logging.ERROR, logger="prethird.pipeline"):
        await p.say("x")  # 예외 전파되면 즉시 실패
    assert len(vt.frames) == 0
    assert len(at.pcm) == 0


@pytest.mark.asyncio
async def test_batch_tts_failure_still_fires_response_ready_hook(monkeypatch):
    """[T-113 Task6] filler 정리: TTS 실패는 _infer_stage 진입 '전' 이라 그
    내부 즉시컷 훅(_fire_hook)이 못 불린다 — _run_batch 의 except 경로가
    on_response_ready 를 방어적으로 1회 호출해 FillerPlayer 가 세션 끝까지
    영구 순환(T-088 좀비 패턴)하지 않게 보장해야 한다."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    hook_calls = []

    async def chat_fn(messages):
        yield "문장."

    async def say_fn(text, se_path=None):
        raise RuntimeError("TTS down")

    def decode_wav_fn(b):
        return np.zeros(10, dtype=np.int16), 48000, 1

    def infer_fn(wav_path, on_frame, **k):
        return 0

    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=chat_fn, say_fn=say_fn,
        decode_wav_fn=decode_wav_fn, infer_fn=infer_fn,
    )
    await p.say("x", on_response_ready=lambda: hook_calls.append(1))
    assert hook_calls == [1], "filler 정지 훅은 TTS 실패 시에도 정확히 1회 호출돼야 함"
