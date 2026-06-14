import numpy as np
from audio2lip import compute_rms_envelope


def test_envelope_length_matches_fps():
    sr, fps, dur = 16000, 25, 2.0
    y = np.zeros(int(sr * dur), dtype=np.float32)
    env = compute_rms_envelope(y, sr=sr, fps=fps, sigma=1.5, silence=0.05, gamma=1.0)
    assert env.shape == (int(np.ceil(dur * fps)),)  # 50


def test_silence_gates_to_zero():
    sr = 16000
    y = (np.random.randn(sr) * 1e-4).astype(np.float32)  # near-silent
    env = compute_rms_envelope(y, sr=sr, fps=25, sigma=1.5, silence=0.05, gamma=1.0)
    assert env.max() == 0.0  # below silence gate → all zero


def test_loud_normalizes_to_one():
    sr = 16000
    t = np.linspace(0, 1, sr, endpoint=False)
    y = (0.8 * np.sin(2 * np.pi * 200 * t)).astype(np.float32)  # steady tone
    env = compute_rms_envelope(y, sr=sr, fps=25, sigma=1.5, silence=0.05, gamma=1.0)
    assert 0.99 <= env.max() <= 1.0  # peak-normalized
    assert env.min() >= 0.0


def test_gamma_compresses():
    sr = 16000
    t = np.linspace(0, 1, sr, endpoint=False)
    y = (np.linspace(0.05, 0.8, sr) * np.sin(2 * np.pi * 200 * t)).astype(np.float32)
    e1 = compute_rms_envelope(y, sr=sr, fps=25, sigma=0.5, silence=0.0, gamma=1.0)
    e2 = compute_rms_envelope(y, sr=sr, fps=25, sigma=0.5, silence=0.0, gamma=2.0)
    # gamma>1 pushes mid values down
    assert e2.mean() <= e1.mean() + 1e-6
