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


def test_edge_fade_ramps_boundaries():
    from audio_utils import _apply_edge_fade
    import numpy as np
    pcm = np.full(48000, 10000, dtype=np.int16)  # 1초 일정 진폭
    out = _apply_edge_fade(pcm, sr=48000, fade_ms=8.0)
    assert out.shape == pcm.shape          # 길이 불변(avsync 무영향)
    assert abs(int(out[0])) < 2000         # 시작 fade-in (거의 0)
    assert abs(int(out[-1])) < 2000        # 끝 fade-out
    assert int(out[24000]) == 10000        # 중앙은 무변화


def test_edge_fade_noop_on_zero_or_empty():
    from audio_utils import _apply_edge_fade
    import numpy as np
    empty = np.zeros(0, dtype=np.int16)
    assert _apply_edge_fade(empty, sr=48000, fade_ms=8.0).size == 0
    pcm = np.full(100, 5000, dtype=np.int16)
    assert np.array_equal(_apply_edge_fade(pcm, sr=48000, fade_ms=0.0), pcm)


def test_normalize_peak_boosts_quiet_within_gain_cap():
    from audio_utils import _normalize_peak
    import numpy as np
    pcm = np.full(1000, 3000, dtype=np.int16)  # 조용하지만 silence_floor 위
    out = _normalize_peak(pcm)  # 기본 gain_max=1.8 (부스트 보수적 — 출렁임 억제)
    assert 5000 <= int(np.max(np.abs(out))) <= 5800   # 3000*1.8≈5400


def test_normalize_peak_attenuates_loud():
    from audio_utils import _normalize_peak
    import numpy as np
    pcm = np.full(1000, 32000, dtype=np.int16)
    out = _normalize_peak(pcm)
    peak = int(np.max(np.abs(out)))
    assert peak < 32000
    assert abs(peak - int(0.89 * 32767)) < 500


def test_normalize_peak_protects_near_silence():
    from audio_utils import _normalize_peak
    import numpy as np
    pcm = np.full(1000, 300, dtype=np.int16)  # <silence_floor=512
    out = _normalize_peak(pcm)
    assert np.array_equal(out, pcm)


def test_normalize_peak_empty():
    from audio_utils import _normalize_peak
    import numpy as np
    empty = np.zeros(0, dtype=np.int16)
    assert _normalize_peak(empty).size == 0
