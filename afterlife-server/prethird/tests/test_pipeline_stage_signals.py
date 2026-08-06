"""tests/test_pipeline_stage_signals.py — [T-258] 발화 파이프라인 단계 신호.

클라(RN)가 "지금 응답이 어느 단계인지"를 알 수 있도록 pipeline 이 on_stage
콜백으로 단계를 통지한다. 이 스위트가 고정하는 계약:

- batch(사용자 응답, PRETHIRD_RENDER_MODE=batch): 7단계가 **이 순서대로** 1회씩
  llm_done → tts_start → tts_done → render_start → render_done
  → stream_start → stream_end
- partial(greet/react 같은 force_partial, 또는 render_mode=partial): 세그먼트가
  N개여도 **stream_start / stream_end 2건만** (남발 금지)
- on_stage=None(기본)이면 완전 no-op — 기존 호출부 회귀 0
- on_stage 가 예외를 던져도 발화(프레임/오디오 push)는 정상 완료
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
        return {"queued": len(self.frames), "dropped": False}

    def begin_response(self):
        pass

    def signal_end(self):
        return 0


class FakeAudioTrack:
    def __init__(self):
        self.pcm = []

    def push_pcm_int16(self, pcm):
        self.pcm.append(pcm)
        # 실 트랙(AvatarAudioTrack)과 동일하게 큐 잔량(샘플)을 반환 —
        # stream_end 의 queued_ms 는 이 값만 쓰고 재계산하지 않는다.
        return {"queued": int(sum(p.size for p in self.pcm)), "dropped": False}

    def queue_depth_samples(self):
        return int(sum(p.size for p in self.pcm))

    def signal_end(self):
        return 0


def _mk_pipeline(vt, at, sentences):
    async def chat_fn(messages):
        for s in sentences:
            yield s

    async def say_fn(text, se_path=None):
        return b"WAVfake"

    def decode_fn(_b):
        # 48kHz mono 4800 샘플 = 100ms
        return np.zeros(4800, dtype=np.int16), 48000, 1

    def infer_fn(wav_path, on_frame, **kwargs):
        for _ in range(3):
            on_frame(np.zeros((8, 8, 3), np.uint8))
        return 3

    return DialoguePipeline(
        video_track=vt, audio_track=at,
        chat_fn=chat_fn, say_fn=say_fn,
        decode_wav_fn=decode_fn, infer_fn=infer_fn,
    )


@pytest.mark.asyncio
async def test_batch_emits_all_stages_in_order(monkeypatch):
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = _mk_pipeline(vt, at, ["첫 번째 문장입니다. ", "두 번째 문장입니다."])

    seen: list[tuple[str, dict | None]] = []
    await p.say("안녕", on_stage=lambda s, d: seen.append((s, d)))

    assert [s for s, _ in seen] == [
        "llm_done", "tts_start", "tts_done",
        "render_start", "render_done", "stream_start", "stream_end",
    ]
    detail = dict(seen)
    assert detail["llm_done"]["chars"] > 0
    assert detail["tts_done"]["audio_ms"] == 100      # 4800 샘플 / 48
    assert detail["render_done"]["frames"] == 3
    assert detail["stream_end"]["queued_ms"] >= 0
    # 계측이 발화를 바꾸지 않았는지 — 프레임/오디오는 그대로 push 됐다.
    assert len(vt.frames) == 3 and len(at.pcm) == 1


@pytest.mark.asyncio
async def test_batch_stage_order_matches_pipeline_timeline(monkeypatch):
    """stream_start 는 반드시 render_done 이후·push 이전이어야 한다 —
    클라가 '영상 생성 완료 → 스트리밍 시작'을 구분하는 근거."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = _mk_pipeline(vt, at, ["충분히 긴 한 문장입니다."])

    timeline: list[str] = []
    orig_push = vt.push_ndarray

    def _push(arr):
        timeline.append("push")
        return orig_push(arr)

    vt.push_ndarray = _push
    await p.say("안녕", on_stage=lambda s, d: timeline.append(s))

    assert timeline.index("render_done") < timeline.index("stream_start")
    assert timeline.index("stream_start") < timeline.index("push")
    assert timeline.index("push") < timeline.index("stream_end")


@pytest.mark.asyncio
async def test_partial_emits_only_stream_stages(monkeypatch):
    """partial 은 세그먼트가 여러 개여도 stream_start/stream_end 2건만."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "partial")
    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = _mk_pipeline(vt, at, ["첫 번째 문장입니다. ", "두 번째 문장입니다. ", "세 번째 문장입니다."])

    seen: list[str] = []
    await p.say("안녕", on_stage=lambda s, d: seen.append(s))

    assert seen == ["stream_start", "stream_end"]


@pytest.mark.asyncio
async def test_greet_force_partial_emits_only_stream_stages(monkeypatch):
    """greet 는 render_mode=batch 여도 force_partial — 신호도 partial 규칙."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = _mk_pipeline(vt, at, ["반갑습니다 여러분."])

    seen: list[str] = []
    await p.greet(on_stage=lambda s, d: seen.append(s))

    assert seen == ["stream_start", "stream_end"]


@pytest.mark.asyncio
async def test_on_stage_exception_does_not_break_utterance(monkeypatch):
    """신호 발신 실패(콜백 예외)가 발화를 죽이면 안 된다 — 전량 흡수."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = _mk_pipeline(vt, at, ["충분히 긴 한 문장입니다."])

    def boom(_s, _d):
        raise RuntimeError("dc closed")

    await p.say("안녕", on_stage=boom)
    assert len(vt.frames) == 3 and len(at.pcm) == 1


@pytest.mark.asyncio
async def test_no_on_stage_is_noop(monkeypatch):
    """on_stage 미전달(기존 호출부)이면 아무 일도 일어나지 않는다(회귀 0)."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = _mk_pipeline(vt, at, ["충분히 긴 한 문장입니다."])
    await p.say("안녕")
    assert len(vt.frames) == 3 and len(at.pcm) == 1


@pytest.mark.asyncio
async def test_batch_empty_response_stops_at_llm_done(monkeypatch):
    """빈 응답이면 llm_done 까지만 — 도달하지 않은 단계는 보내지 않는다."""
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    vt, at = FakeVideoTrack(), FakeAudioTrack()
    p = _mk_pipeline(vt, at, ["", "   "])

    seen: list[str] = []
    await p.say("안녕", on_stage=lambda s, d: seen.append(s))

    assert seen == ["llm_done"]
    assert vt.frames == [] and at.pcm == []
