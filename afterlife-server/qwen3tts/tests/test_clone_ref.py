# afterlife-server/qwen3tts/tests/test_clone_ref.py
import sys, pathlib, io, wave
import numpy as np, pytest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from clone_ref import parse_clone_id, ref_audio_path, extract_ref_clip  # noqa: E402

def test_parse_clone_id_from_se_path():
    assert parse_clone_id("reference_voices/halbae/se.pth") == "halbae"
    assert parse_clone_id("/abs/reference_voices/gomin/se.pth") == "gomin"

def test_parse_clone_id_rejects_bare():
    with pytest.raises(ValueError):
        parse_clone_id("se.pth")

def test_ref_audio_path_joins_voice_wav():
    p = ref_audio_path("halbae", ref_root="/tmp/refs")
    assert p == "/tmp/refs/halbae/voice.wav"

def _write_wav(path, seconds, sr=16000):
    n = int(seconds * sr)
    data = (np.sin(np.arange(n) * 0.05) * 0.1).astype(np.float32)
    import soundfile as sf
    sf.write(path, data, sr)

def test_extract_ref_clip_trims_to_max_sec(tmp_path):
    wav = tmp_path / "voice.wav"
    _write_wav(str(wav), seconds=20.0, sr=16000)
    clip, sr = extract_ref_clip(str(wav), max_sec=10.0)
    assert sr == 16000
    assert abs(clip.shape[0] - 10 * 16000) <= 1
    assert clip.ndim == 1

def test_extract_ref_clip_keeps_short_audio(tmp_path):
    wav = tmp_path / "voice.wav"
    _write_wav(str(wav), seconds=4.0, sr=16000)
    clip, sr = extract_ref_clip(str(wav), max_sec=10.0)
    assert abs(clip.shape[0] - 4 * 16000) <= 1

def test_extract_ref_clip_rejects_empty(tmp_path):
    import soundfile as sf
    wav = tmp_path / "empty.wav"
    sf.write(str(wav), np.zeros(0, dtype="float32"), 16000)
    with pytest.raises(ValueError):
        extract_ref_clip(str(wav))
