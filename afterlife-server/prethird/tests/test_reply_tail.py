"""AFL-1064 길이 버전 — 파이프라인이 답 글 상태를 알려 주고, 답이 끝나면 남은 프레임을 무음으로 마저 렌더한다."""
import asyncio
import os
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from pipeline import DialoguePipeline  # noqa: E402


def _run(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


class _T:
    def __init__(self):
        self.frames = 0

    def push_ndarray(self, a):
        self.frames += 1

    def push_pcm_int16(self, p): pass
    def signal_end(self): pass
    def begin_response(self): pass


def _make(tokens, rendered, states):
    async def chat_fn(messages):
        for tok in tokens:
            yield tok

    async def say_fn(text, se_path, lang=None, emotion=None):
        return b"WAV"

    vt = _T()

    def infer(path, cb):
        with wave.open(path) as w:
            n = round(w.getnframes() / w.getframerate() * 25)
        rendered.append(n)
        states.append(pipe.reply_text_state)
        for _ in range(max(n, 1)):
            cb(np.zeros((4, 4, 3), dtype=np.uint8))
        return n

    def decode(b):
        return np.zeros(480, dtype=np.int16), 48000, 1

    pipe = DialoguePipeline(vt, _T(), chat_fn, say_fn, decode, infer,
                            persona_messages=[{"role": "system", "content": "너는 클론"}])
    pipe.user_lang = "ko"
    return pipe, vt


def test_답_글_상태와_말끝_무음_마무리(monkeypatch):
    rendered, states = [], []
    pipe, vt = _make(["<lang=ko><emo=angry>", "그건 ", "아니야."], rendered, states)

    async def fake_tts(self, s, strip_lead=False):
        buf = __import__("io").BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(16000)
            w.writeframes(b"\x00\x00" * 16000)  # 1초 = 25프레임
        return buf.getvalue(), np.zeros(48000, dtype=np.int16)

    monkeypatch.setattr(DialoguePipeline, "_tts_stage_multi", fake_tts)
    tail_calls = []
    pipe.reply_tail_frames_fn = lambda: tail_calls.append(pipe.reply_seq) or 12
    _run(pipe.say("어때?"))
    assert pipe.reply_text_state == ("그건 아니야.", True)
    assert rendered[-1] == 12            # 마지막 렌더 = 무음 마무리 12프레임
    assert tail_calls == [pipe.reply_seq]


def test_마무리_없으면_추가_렌더_없음(monkeypatch):
    rendered, states = [], []
    pipe, vt = _make(["<lang=ko><emo=neutral>", "응."], rendered, states)

    async def fake_tts(self, s, strip_lead=False):
        buf = __import__("io").BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(16000)
            w.writeframes(b"\x00\x00" * 8000)
        return buf.getvalue(), np.zeros(24000, dtype=np.int16)

    monkeypatch.setattr(DialoguePipeline, "_tts_stage_multi", fake_tts)
    pipe.reply_tail_frames_fn = lambda: 0
    _run(pipe.say("어때?"))
    assert len(rendered) == 1


def test_speak_은_글이_처음부터_다_있다():
    pipe, _ = _make([], [], [])
    pipe._begin_reply_text("안녕하세요.", done=True)
    assert pipe.reply_text_state == ("안녕하세요.", True)
