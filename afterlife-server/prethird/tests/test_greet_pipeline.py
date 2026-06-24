import asyncio
import numpy as np
import pytest
from pipeline import DialoguePipeline, GREETING_PROMPT


class _Track:
    def __init__(self):
        self.frames = []
        self.pcm = []
        self.ended = False
    def push_ndarray(self, arr): self.frames.append(arr)
    def push_pcm_int16(self, pcm): self.pcm.append(pcm)
    def signal_end(self): self.ended = True


def _make_pipeline(captured_messages):
    async def chat_fn(messages):
        captured_messages.append(messages)
        for tok in ["안녕", "하세요."]:
            yield tok
    async def say_fn(text, se_path):
        return b"WAVDATA"
    def decode_wav_fn(b):
        return np.zeros(480, dtype=np.int16), 48000, 1
    def infer_fn(wav_path, on_frame):
        on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
        return 1
    vt, at = _Track(), _Track()
    pipe = DialoguePipeline(
        vt, at, chat_fn, say_fn, decode_wav_fn, infer_fn,
        persona_messages=[{"role": "system", "content": "너는 클론"}],
    )
    return pipe, vt, at


def test_greet_uses_greeting_prompt():
    captured = []
    pipe, vt, at = _make_pipeline(captured)
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(pipe.greet())
    finally:
        loop.close()
    # persona + greeting 지시가 LLM messages 로 전달
    assert captured[0][0] == {"role": "system", "content": "너는 클론"}
    assert captured[0][-1] == {"role": "user", "content": GREETING_PROMPT}
    assert at.ended is True  # signal_end 호출


def test_on_first_audio_called_once():
    captured = []
    pipe, vt, at = _make_pipeline(captured)
    calls = []
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(
            pipe.greet(on_first_audio=lambda: calls.append(1))
        )
    finally:
        loop.close()
    assert calls == [1]  # 첫 오디오 push 직후 정확히 1회
