# afterlife-server/qwen3tts/tests/test_engine.py
import sys, pathlib, os
import numpy as np
import soundfile as sf
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from tts_engine import Qwen3Engine  # noqa: E402

class FakeModel:
    def __init__(self):
        self.prompt_calls = []
        self.gen_calls = 0
    def create_voice_clone_prompt(self, ref_audio, ref_text, x_vector_only_mode):
        self.prompt_calls.append({"ref_text": ref_text, "xvo": x_vector_only_mode})
        return {"prompt_id": len(self.prompt_calls)}
    def generate_voice_clone(self, text, language, voice_clone_prompt, **kwargs):
        self.gen_calls += 1
        self.last_gen_kwargs = kwargs
        return [np.zeros(1600, dtype="float32")], 16000

def _fake_clip(voice_wav, max_sec=None):
    return np.zeros(16000, dtype="float32"), 16000

def _make_wav(path: str, samples: np.ndarray | None = None):
    """테스트용 voice.wav 생성 헬퍼. samples 미지정 시 zeros(1600) 사용."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = samples if samples is not None else np.zeros(1600, dtype="float32")
    sf.write(path, data, 16000)
    return path

def test_prompt_cached_per_clone_id(tmp_path):
    wav = _make_wav(str(tmp_path / "halbae" / "voice.wav"))
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장1", clone_id="halbae", voice_wav=wav)
    eng.synth("문장2", clone_id="halbae", voice_wav=wav)
    assert len(m.prompt_calls) == 1   # prompt 1회만 생성(캐시)
    assert m.gen_calls == 2           # 합성은 2회

def test_xvector_only_when_no_ref_text(tmp_path):
    wav = _make_wav(str(tmp_path / "halbae" / "voice.wav"))
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장", clone_id="halbae", voice_wav=wav)  # ref_text 미전달
    assert m.prompt_calls[0]["xvo"] is True
    assert m.prompt_calls[0]["ref_text"] is None

def test_ref_text_disables_xvector(tmp_path):
    wav = _make_wav(str(tmp_path / "gomin" / "voice.wav"))
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장", clone_id="gomin", voice_wav=wav, ref_text="대본 텍스트")
    assert m.prompt_calls[0]["xvo"] is False
    assert m.prompt_calls[0]["ref_text"] == "대본 텍스트"

def test_synth_returns_wav_bytes(tmp_path):
    wav = _make_wav(str(tmp_path / "halbae" / "voice.wav"))
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    out = eng.synth("문장", clone_id="halbae", voice_wav=wav)
    assert isinstance(out, (bytes, bytearray))
    assert out[:4] == b"RIFF"  # WAV 컨테이너

def test_prompt_recomputed_when_ref_text_added(tmp_path):
    wav = _make_wav(str(tmp_path / "halbae" / "voice.wav"))
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장", clone_id="halbae", voice_wav=wav)               # ref_text=None → xvo=True
    eng.synth("문장2", clone_id="halbae", voice_wav=wav, ref_text="대본")  # ref_text 있음 → 새 prompt
    assert len(m.prompt_calls) == 2          # clone_id 같아도 ref_text 유무 다르면 prompt 재생성
    assert m.prompt_calls[0]["xvo"] is True
    assert m.prompt_calls[1]["xvo"] is False

def test_cache_key_invalidated_on_wav_change(tmp_path):
    """voice.wav 내용 변경 시 prompt 재생성 검증.

    케이스 A: size + mtime 모두 달라짐 — 가장 흔한 교체 패턴. stat 빠른 miss.
    케이스 B: size 변경, mtime 동일 — size 변화만으로도 stat miss → wav_sha256 → rebuild.
              "size·mtime 동일·내용만 다름(rsync --times)" 케이스는 운영상 비발생
              (lazy fetch os.replace = mtime 갱신 동반)이므로 테스트 범위 외.
              해당 케이스가 stale hit 임은 _PromptEntry docstring 에 명시."""
    wav_path = str(tmp_path / "halbae" / "voice.wav")
    _make_wav(wav_path)
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장1", clone_id="halbae", voice_wav=wav_path)
    assert len(m.prompt_calls) == 1

    # --- 케이스 A: size + mtime 모두 달라짐 ---
    import time as _time
    _time.sleep(0.01)
    _make_wav(wav_path, np.zeros(3200, dtype="float32"))  # 크기/mtime 모두 달라짐
    eng.synth("문장2", clone_id="halbae", voice_wav=wav_path)
    assert len(m.prompt_calls) == 2   # 캐시 miss → 재생성

    # --- 케이스 B: size 변경, mtime 동일 → stat miss → wav_sha 계산 → rebuild ---
    # os.utime 으로 mtime 복원, 샘플 수 변경(3200→4800)으로 size 는 다르게.
    st_before = os.stat(wav_path)
    original_times = (st_before.st_atime, st_before.st_mtime)

    _make_wav(wav_path, np.ones(4800, dtype="float32") * 0.5)  # size 달라짐
    os.utime(wav_path, original_times)  # mtime 복원

    st_after = os.stat(wav_path)
    assert st_after.st_size != st_before.st_size, "케이스B: size 는 달라야 함"
    assert st_after.st_mtime == st_before.st_mtime, "mtime 복원 실패"

    eng.synth("문장3", clone_id="halbae", voice_wav=wav_path)
    assert len(m.prompt_calls) == 3   # size 변경 → stat miss → rebuild

def test_cache_key_invalidated_on_ref_text_change(tmp_path):
    """ref_text 내용 변경 시 prompt 재생성."""
    wav = _make_wav(str(tmp_path / "halbae" / "voice.wav"))
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장", clone_id="halbae", voice_wav=wav, ref_text="대본A")
    eng.synth("문장", clone_id="halbae", voice_wav=wav, ref_text="대본B")
    assert len(m.prompt_calls) == 2   # 다른 ref_text → 다른 캐시키 → 재생성

def test_attn_impl_defaults_to_sdpa(monkeypatch):
    # env 미설정 시 sdpa 기본 (flash-attn 미설치 환경 대비)
    import importlib, config
    monkeypatch.delenv("QWEN3TTS_ATTN", raising=False)
    importlib.reload(config)
    assert config.ATTN_IMPL == "sdpa"

def test_gen_params_forwarded_to_model(tmp_path):
    wav = _make_wav(str(tmp_path / "halbae" / "voice.wav"))
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장", clone_id="halbae", voice_wav=wav,
              gen_params={"temperature": 0.5, "top_p": 0.8})
    assert m.last_gen_kwargs == {"temperature": 0.5, "top_p": 0.8}

def test_gen_params_none_forwards_nothing(tmp_path):
    wav = _make_wav(str(tmp_path / "halbae" / "voice.wav"))
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    eng.synth("문장", clone_id="halbae", voice_wav=wav)  # gen_params 미전달
    assert m.last_gen_kwargs == {}

def test_atempo_noop_when_speed_1(tmp_path):
    wav = _make_wav(str(tmp_path / "halbae" / "voice.wav"))
    m = FakeModel()
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    out = eng.synth("문장", clone_id="halbae", voice_wav=wav, speed=1.0)
    # speed=1.0 → atempo 미적용, FakeModel 1600샘플 그대로 인코딩된 WAV
    import io as _io, soundfile as _sf
    data, sr = _sf.read(_io.BytesIO(out))
    assert len(data) == 1600

def test_atempo_speeds_up_audio(tmp_path):
    wav = _make_wav(str(tmp_path / "halbae" / "voice.wav"))
    m = FakeModel()
    # ffmpeg atempo(WSOLA)는 완전 무음(전부 0) 입력에서 축퇴 동작(64샘플로 collapse)해
    # 배속 비율을 반영하지 못함(실측 확인) → 실제 배속 스케일 검증에는 논제로 사인파 사용.
    import numpy as _np
    _t = _np.linspace(0, 1600 / 16000, 1600, endpoint=False)
    _sine = (0.1 * _np.sin(2 * _np.pi * 220 * _t)).astype("float32")
    m.generate_voice_clone = lambda text, language, voice_clone_prompt, **kwargs: ([_sine], 16000)
    eng = Qwen3Engine(model=m, clip_fn=_fake_clip)
    out = eng.synth("문장", clone_id="halbae", voice_wav=wav, speed=2.0)
    import io as _io, soundfile as _sf
    data, sr = _sf.read(_io.BytesIO(out))
    # 2배속 → 길이 대략 절반(atempo 근사치, 여유 있게 검증)
    assert 700 <= len(data) <= 950
