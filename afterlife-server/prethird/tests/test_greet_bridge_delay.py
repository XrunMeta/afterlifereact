"""Bridge 대기(T-824/830/845)는 사용자 발화 응답(say)에만 — greet/react 에는 걸지 않는다.

앱은 사용자 STT final(onUserFinal)에서만 Bridge 클립을 튼다. greet·react 는 사용자 발화가
없어 Bridge 가 재생되지 않으므로, 서버가 첫 push 를 Bridge 시간만큼 미루면 아무도 듣지 않는
무음 대기가 된다(2026-10-02 실통화: 연결 → 첫인사 소리 약 21초).
"""
import asyncio
import sys
import pathlib
import time

import numpy as np
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from pipeline import DialoguePipeline  # noqa: E402


class _Track:
    def __init__(self):
        self.frames, self.pcm, self.ended = [], [], False
    def push_ndarray(self, arr): self.frames.append(arr)
    def push_pcm_int16(self, pcm): self.pcm.append(pcm)
    def signal_end(self): self.ended = True
    def begin_response(self): pass
    def queue_depth(self): return 0
    def flush(self): return 0


def _make():
    async def chat_fn(messages):
        for tok in ["여보세요?"]:
            yield tok
    async def say_fn(text, se_path):
        return b"WAVDATA"
    def decode_wav_fn(b):
        return np.zeros(480, dtype=np.int16), 48000, 1
    def infer_fn(wav_path, on_frame):
        on_frame(np.zeros((4, 4, 3), dtype=np.uint8))
        return 1
    return DialoguePipeline(_Track(), _Track(), chat_fn, say_fn, decode_wav_fn, infer_fn,
                            persona_messages=[{"role": "system", "content": "너는 클론"}])


@pytest.fixture
def bridge_env(monkeypatch):
    # 실제 라이브와 같은 구조로, 테스트가 오래 걸리지 않게 0.3초 남짓으로 축소.
    monkeypatch.setenv("PRETHIRD_BRIDGE_GRACE_MS", "100")
    monkeypatch.setenv("PRETHIRD_BRIDGE_DURATION_MS", "200")
    monkeypatch.setenv("PRETHIRD_POST_BRIDGE_DELAY_MS", "100")
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "partial")
    monkeypatch.setenv("PRETHIRD_GREETING_ENABLED", "1")


async def _first_audio_s(coro_fn):
    t0 = time.perf_counter()
    first = {}
    await coro_fn(lambda: first.setdefault("t", time.perf_counter() - t0))
    return first["t"]


@pytest.mark.asyncio
async def test_greet_is_not_delayed_by_bridge(bridge_env):
    pipe = _make()
    t = await _first_audio_s(lambda cb: pipe.greet(on_first_audio=cb))
    assert t < 0.3, f"greet 첫 소리가 Bridge 대기만큼 밀림: {t:.2f}s"


@pytest.mark.asyncio
async def test_react_is_not_delayed_by_bridge(bridge_env):
    pipe = _make()
    t = await _first_audio_s(lambda cb: pipe.react("unknown", on_first_audio=cb))
    assert t < 0.3, f"react 첫 소리가 Bridge 대기만큼 밀림: {t:.2f}s"


@pytest.mark.asyncio
async def test_say_still_waits_for_bridge(bridge_env):
    """사용자 응답은 기존대로 Bridge 재생이 끝날 때까지 기다린다(오디오 겹침 방지)."""
    pipe = _make()
    t = await _first_audio_s(lambda cb: pipe.say("안녕", on_first_audio=cb))
    assert t >= 0.38, f"say 가 Bridge 를 기다리지 않음: {t:.2f}s"
