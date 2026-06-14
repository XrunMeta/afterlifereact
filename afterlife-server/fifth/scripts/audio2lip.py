import numpy as np
from scipy.ndimage import gaussian_filter1d

def compute_rms_envelope(y, sr=16000, fps=25, sigma=1.5, silence=0.05, gamma=1.0):
    """모노 PCM(float32 [-1,1]) → 프레임당 RMS envelope (peak-normalized, gated, gamma).

    Args:
        y: 1-D float32 array, 모노 PCM [-1, 1]
        sr: 샘플레이트 (default 16000)
        fps: 출력 프레임레이트 (default 25)
        sigma: 가우시안 스무딩 시그마 (default 1.5)
        silence: 게이팅 임계값 — 정규화 후 이 값 미만은 0 처리 (default 0.05)
        gamma: 지수 압축 계수. gamma>1 → 중간값 감쇄 (default 1.0)

    Returns:
        np.ndarray float32, shape (ceil(dur * fps),), range [0, 1]
    """
    y = np.asarray(y, dtype=np.float32)
    dur = len(y) / sr
    n = int(np.ceil(dur * fps))
    hop = max(1, int(sr / fps))
    win = hop * 2
    yp = np.pad(y, (win 
    frames = np.array([yp[i * hop: i * hop + win] for i in range(n)])
    rms = np.sqrt((frames ** 2).mean(axis=1)).astype(np.float32)
    rms = gaussian_filter1d(rms.astype(np.float64), sigma=sigma).astype(np.float32)
    # silence gate는 normalize 전 raw RMS로 판단 (정규화 후에는 noise-floor도 1.0이 됨을 방지)
    silence_mask = rms < silence
    rms = rms / (rms.max() + 1e-8)
    rms = np.where(silence_mask, 0.0, rms).astype(np.float32)
    rms = np.power(rms, gamma).astype(np.float32)
    return rms
