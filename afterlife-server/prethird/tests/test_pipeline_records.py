# afterlife-server/prethird/tests/test_pipeline_records.py
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from pipeline import DialoguePipeline


class _RecTurn:
    def __init__(self):
        self.tokens = []
        self.wavs = []
    def append_token(self, tok): self.tokens.append(tok)
    def append_wav(self, wav): self.wavs.append(wav)
    def append_frames(self, frames, pcm48=None, fps=25):
        self.frames = getattr(self, "frames", [])
        self.frames.extend(frames)
    def finalize(self, **m): pass


class _FakeTrack:
    def push_ndarray(self, a): pass
    def push_pcm_int16(self, p): pass
    def signal_end(self): pass
    def queue_depth(self): return 0
    def queue_depth_samples(self): return 0


def test_say_accumulates_tokens_and_wav_into_turn():
    import numpy as np
    async def fake_chat(messages):
        for t in ["안녕", "하세요"]:
            yield t
    async def fake_say(text, se_path):
        return b"RIFFfake"
    def fake_decode(wav):
        return (np.zeros(16000, dtype=np.int16), 16000, 1)
    def fake_infer(wav_path, on_frame):
        on_frame(np.zeros((64, 64, 3), dtype=np.uint8))
        return 1
    pipe = DialoguePipeline(
        video_track=_FakeTrack(), audio_track=_FakeTrack(),
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )
    turn = _RecTurn()
    asyncio.run(pipe.say("여보세요", turn=turn))
    assert "".join(turn.tokens) == "안녕하세요"
    assert len(turn.wavs) >= 1
    assert turn.wavs[0] == b"RIFFfake"


def test_say_without_turn_still_works():
    # turn 미전달(None) — 기존 호출 호환, NULL_TURN으로 동작
    import numpy as np
    async def fake_chat(messages):
        yield "응답"
    async def fake_say(text, se_path):
        return b"RIFFx"
    def fake_decode(wav):
        return (np.zeros(8000, dtype=np.int16), 16000, 1)
    def fake_infer(wav_path, on_frame):
        on_frame(np.zeros((8, 8, 3), dtype=np.uint8))
        return 1
    pipe = DialoguePipeline(
        video_track=_FakeTrack(), audio_track=_FakeTrack(),
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
    )
    asyncio.run(pipe.say("hi"))  # turn 없이
