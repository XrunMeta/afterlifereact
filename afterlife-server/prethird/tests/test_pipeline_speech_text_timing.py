"""tests/test_pipeline_speech_text_timing.py — T-151 라운드2 Task10.

실기 피드백: on_sentence(speech_text dc 발신용 콜백)가 tts_worker의
dequeue 직후(TTS/렌더 수 초 '전')에 불려 자막이 클론 발화보다 너무 일찍
뜬다. 이 스위트는 on_sentence 가 dequeue 시점이 아니라 해당 세그먼트의
'첫 프레임 push 직전'(_infer_stage on_before_push, 재생 시작 근사)에
불림을 partial/batch 양쪽 경로에서 단언한다.
"""
from __future__ import annotations

import asyncio
import pathlib
import sys

import numpy as np
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from pipeline import DialoguePipeline  # noqa: E402


class VT:
    def __init__(self, events):
        self._events = events

    def begin_response(self):
        pass  # [T-120 preroll] 스텁 — PRETHIRD_PREROLL_FRAMES=0(기본) 무해

    def push_ndarray(self, arr):
        self._events.append(("push", int(arr[0, 0, 0])))

    def signal_end(self):
        pass


class AT:
    def push_pcm_int16(self, pcm):
        pass

    def signal_end(self):
        pass


def test_partial_on_sentence_fires_after_tts_and_infer_before_push():
    """partial 경로: 문장별로 tts -> infer -> on_sentence -> push 순서여야
    한다(dequeue 직후 호출이면 tts '이전'에 sentence 가 기록됐을 것 — 회귀
    포착 지점)."""
    events: list[tuple] = []
    # [주의] SentenceBuffer(기본 min_len=4)는 짧은 문장을 다음 문장과 병합
    # 해버려 문장 수 구분이 안 된다 — 각 문장이 단독으로 min_len 이상이 되도록
    # 충분히 긴 문장 사용(기존 batch 테스트와 동일 패턴).
    idx_of = {"첫 문장이다.": 1, "둘째 문장도 있다.": 2}

    async def fake_chat(messages):
        for t in idx_of:
            yield t

    async def fake_say(text, se_path=None):
        events.append(("tts", text))
        return bytes([idx_of[text]]) + b"WAV"

    def fake_decode(b):
        idx = b[0]
        return np.full(1920, idx, dtype=np.int16), 48000, 1

    def fake_infer(wav_path, on_frame):
        with open(wav_path, "rb") as f:
            idx = f.read(1)[0]
        events.append(("infer", idx))
        on_frame(np.full((4, 4, 3), idx, np.uint8))
        return 1

    def on_sentence(s):
        events.append(("sentence", s))

    p = DialoguePipeline(
        video_track=VT(events), audio_track=AT(),
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )
    asyncio.run(p.say("안녕", on_sentence=on_sentence))

    for text, idx in idx_of.items():
        i_tts = events.index(("tts", text))
        i_infer = events.index(("infer", idx))
        i_sentence = events.index(("sentence", text))
        i_push = events.index(("push", idx))
        assert i_tts < i_infer < i_sentence < i_push, (
            f"'{text}' 순서 위반(tts<infer<sentence<push 이어야 함): {events}"
        )


def test_partial_on_sentence_fires_after_on_response_ready_for_first_segment():
    """[F7 합성] 첫 세그먼트는 on_response_ready(필러 즉시컷) 먼저, 그 다음
    on_sentence 순서로 같은 훅(on_before_push)에서 발동돼야 한다."""
    order: list = []
    sentences = ["첫 문장이다.", "둘째 문장도 있다."]

    async def fake_chat(messages):
        for t in sentences:
            yield t

    async def fake_say(text, se_path=None):
        return b"WAVfake"

    def fake_decode(b):
        return np.zeros(960, dtype=np.int16), 48000, 1

    def fake_infer(wav_path, on_frame):
        on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
        return 1

    def on_response_ready():
        order.append("response_ready")

    def on_sentence(s):
        order.append(("sentence", s))

    p = DialoguePipeline(
        video_track=VT([]), audio_track=AT(),
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )
    asyncio.run(p.say("안녕", on_response_ready=on_response_ready, on_sentence=on_sentence))

    # response_ready는 정확히 1회, 첫 sentence 이벤트보다 먼저.
    assert order.count("response_ready") == 1
    assert order[0] == "response_ready"
    assert order[1] == ("sentence", sentences[0])
    assert order[2] == ("sentence", sentences[1])


def test_batch_on_sentence_fires_after_single_tts_infer_not_at_collect():
    """batch 경로: on_sentence는 collect(dequeue) 단계가 아니라 단일
    TTS/infer(render_mode='batch') 완료 후 push 직전 훅에서 순차 발신돼야
    한다 — 즉 모든 tts/infer 호출이 모든 on_sentence 호출보다 먼저다."""
    import os

    os.environ["PRETHIRD_RENDER_MODE"] = "batch"
    try:
        events: list[tuple] = []

        async def fake_chat(messages):
            for t in ["첫 문장이다. ", "둘째 문장도 있다. ", "셋째다."]:
                yield t

        async def fake_say(text, se_path=None):
            events.append(("tts", text))
            return b"WAVfake"

        def fake_decode(b):
            return np.zeros(960, dtype=np.int16), 48000, 1

        def fake_infer(wav_path, on_frame, **k):
            events.append(("infer", k.get("render_mode")))
            on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
            return 1

        def on_sentence(s):
            events.append(("sentence", s))

        p = DialoguePipeline(
            video_track=VT([]), audio_track=AT(),
            chat_fn=fake_chat, say_fn=fake_say,
            decode_wav_fn=fake_decode, infer_fn=fake_infer,
        )
        assert p._render_mode == "batch"

        asyncio.run(p.say("아무 말", on_sentence=on_sentence))

        kinds = [k for k, _ in events]
        assert kinds.count("tts") == 1
        assert kinds.count("infer") == 1
        assert kinds.count("sentence") == 3
        i_infer = kinds.index("infer")
        first_sentence_idx = kinds.index("sentence")
        assert i_infer < first_sentence_idx, (
            f"on_sentence 는 infer(push 직전 훅) 이후여야 함: {events}"
        )
        # 순서 보존: dequeue(collect) 순서 그대로 발신(SentenceBuffer 분할
        # 경계의 공백 유무는 본 테스트 관심사가 아니라 strip 비교).
        sentences = [v.strip() for k, v in events if k == "sentence"]
        assert sentences == ["첫 문장이다.", "둘째 문장도 있다.", "셋째다."]
    finally:
        os.environ.pop("PRETHIRD_RENDER_MODE", None)


@pytest.mark.asyncio
async def test_on_sentence_none_is_noop_partial():
    """[additive 회귀] on_sentence=None(기본)이면 partial 경로 무동작 — 예외
    없이 기존처럼 동작해야 한다."""
    async def fake_chat(messages):
        yield "문장."

    async def fake_say(text, se_path=None):
        return b"WAVfake"

    def fake_decode(b):
        return np.zeros(960, dtype=np.int16), 48000, 1

    def fake_infer(wav_path, on_frame):
        on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
        return 1

    p = DialoguePipeline(
        video_track=VT([]), audio_track=AT(),
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )
    await p.say("안녕")  # on_sentence 미전달 — 예외 없어야 함
