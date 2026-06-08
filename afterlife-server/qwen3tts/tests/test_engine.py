# afterlife-server/qwen3tts/tests/test_engine.py
import sys, pathlib
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from tts_engine import Qwen3Engine  # noqa: E402

class FakeModel:
    def __init__(self):
        self.prompt_calls = []
        self.gen_calls = 0
    def create_voice_clone_prompt(self, ref_audio, ref_text, x_vector_only_mode):
        self.prompt_calls.append({"ref_text": ref_text, "xvo": x_vector_only_mode})
        return {"prompt_id": len(self.prompt_calls)}
    def generate_voice_clone(self, text, language, voice_clone_prompt):
        self.gen_calls += 1
        return [np.zeros(1600, dtype="float32")], 16000

def _fake_clip(voice_wav, max_sec=None):
    return np.zeros(16000, dtype="float32"), 16000

def test_prompt_cached_per_clone_id():
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장1", clone_id="halbae", voice_wav="/x/halbae/voice.wav")
    eng.synth("문장2", clone_id="halbae", voice_wav="/x/halbae/voice.wav")
    assert len(m.prompt_calls) == 1   # prompt 1회만 생성(캐시)
    assert m.gen_calls == 2           # 합성은 2회

def test_xvector_only_when_no_ref_text():
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장", clone_id="halbae", voice_wav="/x/halbae/voice.wav")  # ref_text 미전달
    assert m.prompt_calls[0]["xvo"] is True
    assert m.prompt_calls[0]["ref_text"] is None

def test_ref_text_disables_xvector():
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장", clone_id="gomin", voice_wav="/x/gomin/voice.wav", ref_text="대본 텍스트")
    assert m.prompt_calls[0]["xvo"] is False
    assert m.prompt_calls[0]["ref_text"] == "대본 텍스트"

def test_synth_returns_wav_bytes():
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    out = eng.synth("문장", clone_id="halbae", voice_wav="/x/halbae/voice.wav")
    assert isinstance(out, (bytes, bytearray))
    assert out[:4] == b"RIFF"  # WAV 컨테이너

def test_prompt_recomputed_when_ref_text_added():
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장", clone_id="halbae", voice_wav="/x/halbae/voice.wav")               # ref_text=None → xvo=True
    eng.synth("문장2", clone_id="halbae", voice_wav="/x/halbae/voice.wav", ref_text="대본")  # ref_text 있음 → 새 prompt
    assert len(m.prompt_calls) == 2          # clone_id 같아도 ref_text 유무 다르면 prompt 재생성
    assert m.prompt_calls[0]["xvo"] is True
    assert m.prompt_calls[1]["xvo"] is False
