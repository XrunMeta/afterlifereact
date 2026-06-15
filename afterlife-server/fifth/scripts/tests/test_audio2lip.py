import numpy as np
import pytest
from audio2lip import compute_rms_envelope, rms_to_cdlip


# ---------------------------------------------------------------------------
# TDD: 신규 가드 테스트 (구현 전 실패 확인용)
# ---------------------------------------------------------------------------

def test_empty_input_returns_empty_envelope():
    """빈 입력 → shape (0,) 반환, 크래시 없음."""
    env = compute_rms_envelope(np.array([], dtype=np.float32))
    assert env.shape == (0,)


def test_2d_input_raises_value_error():
    """2D(stereo) 입력 → ValueError: 호출자가 mono 변환 책임."""
    stereo = np.ones((2, 16000), dtype=np.float32)
    with pytest.raises(ValueError, match="mono 1-D PCM"):
        compute_rms_envelope(stereo)


def test_sigma_zero_no_crash():
    """sigma=0 → 스무딩 skip(no-op), 크래시 없음, 길이 정상."""
    sr, fps, dur = 16000, 25, 1.0
    y = (0.5 * np.ones(int(sr * dur))).astype(np.float32)
    env = compute_rms_envelope(y, sr=sr, fps=fps, sigma=0, silence=0.0, gamma=1.0)
    assert env.shape == (int(np.ceil(dur * fps)),)
    assert not np.any(np.isnan(env))


# ---------------------------------------------------------------------------
# 기존 테스트
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Task 2: rms_to_cdlip 테스트
# ---------------------------------------------------------------------------

def test_cdlip_endpoints():
    rms = np.array([0.0, 1.0], dtype=np.float32)
    out = rms_to_cdlip(rms, lip_closed=0.0023, lip_open=0.55, open_scale=1.0, offset=0)
    assert abs(out[0] - 0.0023) < 1e-6     # 무음 → 닫힘
    assert abs(out[1] - 0.55) < 1e-6       # 최대 → lip_open

def test_cdlip_offset_shifts_forward():
    rms = np.array([0.0, 0.0, 1.0, 0.0], dtype=np.float32)
    out = rms_to_cdlip(rms, lip_closed=0.0, lip_open=1.0, open_scale=1.0, offset=1)
    # offset=+1 → 프레임 i가 rms[i+1] 사용 → 피크가 한 프레임 앞당겨짐
    assert out[1] == 1.0 and out[2] == 0.0

def test_cdlip_offset_clips_bounds():
    rms = np.array([0.2, 0.5, 1.0], dtype=np.float32)
    out = rms_to_cdlip(rms, lip_closed=0.0, lip_open=1.0, open_scale=1.0, offset=5)
    assert len(out) == 3  # 길이 유지, 인덱스 clip

def test_cdlip_empty_input():
    out = rms_to_cdlip(np.zeros(0, dtype=np.float32), lip_closed=0.0023, lip_open=0.55, open_scale=1.0, offset=2)
    assert out.shape == (0,)
    assert out.dtype == np.float32

def test_cdlip_open_scale_high_clamped_to_one():
    # open_scale>1 증폭 시 c_d_lip 이 1.0 을 넘지 않아야 함 (FLP 유효범위 상한, el B-1)
    rms = np.array([0.0, 1.0], dtype=np.float32)
    out = rms_to_cdlip(rms, lip_closed=0.0, lip_open=0.55, open_scale=3.0, offset=0)
    assert out.max() <= 1.0
    assert abs(out[1] - 1.0) < 1e-6      # 0.55*3=1.65 → 1.0 으로 클램프

def test_cdlip_negative_open_scale_no_inversion():
    # open_scale<0 으로 입이 역전(음수 구동)되지 않고 닫힘 baseline 으로 하한 (sion B2)
    rms = np.array([0.0, 1.0], dtype=np.float32)
    out = rms_to_cdlip(rms, lip_closed=0.0023, lip_open=0.55, open_scale=-1.0, offset=0)
    assert out.min() >= 0.0023            # lip_closed 미만으로 떨어지지 않음
    assert abs(out[1] - 0.0023) < 1e-6    # 발화 프레임도 닫힘으로 클램프(역전 차단)
