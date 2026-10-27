"""test_signaling_finalize_off_loop.py — 턴 기록 마무리(finalize)가 이벤트 루프를 막지 않는다.

2026-10-26 실측: finalize 의 answer.mp4 인코딩(imageio → ffmpeg 서브프로세스)이 이벤트 루프
위에서 돌아 0.57~0.75초 동안 소리·영상 송출이 함께 멈췄다(두 문장 턴의 "말하다 멈춤").
finalize 는 별도 스레드에서 돌고, 그동안 루프는 계속 돌아야 한다.
"""
import asyncio
import json as _json
import os
import sys
import threading
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from signaling import _make_dc_handler  # noqa: E402
from session import Session  # noqa: E402


class _FakePipeline:
    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None,
                  on_sentence=None):
        if turn is not None:
            turn.append_token("응답")

    async def speak(self, text, **kw):
        pass


class _SlowTurn:
    def __init__(self, box):
        self._box = box
        self._tokens = []

    def append_token(self, t):
        self._tokens.append(t)

    def __getattr__(self, name):  # write_input 등 나머지 기록 메서드는 무동작
        return lambda *a, **k: None

    def finalize(self, **meta):
        self._box["thread"] = threading.current_thread()
        time.sleep(0.3)  # mp4 인코딩 대역
        self._box["meta"] = meta


class _SlowRecorder:
    def __init__(self, box):
        self._box = box

    def begin_turn(self, mode, text, seq=None):
        return _SlowTurn(self._box)


def test_finalize_runs_off_event_loop(tmp_path):
    box = {}
    sess = Session("sess-final")
    sess.pipeline = _FakePipeline()
    sess.offer_time = 1_700_000_000.0
    sess.recorder = _SlowRecorder(box)

    ticks = []

    async def _ticker():
        for _ in range(20):
            ticks.append(time.monotonic())
            await asyncio.sleep(0.02)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, channel=None)
        handler(_json.dumps({"type": "say", "text": "여보세요", "seq": 1}))
        loop.run_until_complete(_ticker())
        loop.run_until_complete(asyncio.sleep(0.4))  # 스레드 finalize 완료 대기
    finally:
        asyncio.set_event_loop(None)
        loop.close()

    assert box["thread"] is not threading.main_thread()
    assert box["meta"]["mode"] == "say"
    # finalize 가 0.3초 자는 동안에도 루프는 0.02초 간격으로 계속 돌았다.
    gaps = [b - a for a, b in zip(ticks, ticks[1:])]
    assert max(gaps) < 0.15
