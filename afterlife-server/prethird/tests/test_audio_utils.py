import numpy as np, io, wave, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from audio_utils import _decode_wav, _resample_int16, _balance_pcm_to_video  # noqa: E402


def _make_wav(pcm: np.ndarray, sr: int) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
        wf.writeframes(pcm.astype(np.int16).tobytes())
    return buf.getvalue()


def test_decode_wav_roundtrip():
    pcm = (np.sin(np.arange(8000) * 0.1) * 1000).astype(np.int16)
    arr, sr, ch = _decode_wav(_make_wav(pcm, 16000))
    assert sr == 16000 and ch == 1 and arr.shape == (8000,)


def test_resample_doubles_length():
    pcm = np.arange(100, dtype=np.int16)
    out = _resample_int16(pcm, 24000, 48000)
    assert abs(out.size - 200) <= 1


def test_balance_trims_to_video_samples():
    # 25fps, 48kHz → 프레임당 1920 sample. 10 frames → 19200 expected
    # delta>0=trim 한 sample 수 (원본 docstring: cur - target when cur > target)
    pcm = np.zeros(20000, dtype=np.int16)
    out, delta = _balance_pcm_to_video(pcm, 10, sr=48000, fps=25)
    assert out.size == 19200 and delta == 20000 - 19200
