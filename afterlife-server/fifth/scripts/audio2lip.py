import numpy as np
from scipy.ndimage import gaussian_filter1d

def compute_rms_envelope(y, sr=16000, fps=25, sigma=1.5, silence=0.05, gamma=1.0):
    """모노 PCM(float32 [-1,1]) → 프레임당 RMS envelope (peak-normalized, gated, gamma).

    Args:
        y: 1-D float32 array, 모노 PCM [-1, 1]
        sr: 샘플레이트 (default 16000)
        fps: 출력 프레임레이트 (default 25)
        sigma: 가우시안 스무딩 시그마 (default 1.5). 0 이하이면 스무딩 skip(no-op).
        silence: 게이팅 임계값 — **정규화 전 raw RMS 절대 임계값**. 이 값 미만의
                 프레임은 silence gate로 0 처리한다. 정규화 후 적용 시 noise-floor도
                 1.0이 되므로 반드시 normalize 전에 판단해야 한다. (default 0.05)
        gamma: 지수 압축 계수. gamma>1 → 중간값 감쇄 (default 1.0)

    Returns:
        np.ndarray float32, shape (ceil(dur * fps),), range [0, 1].
        빈 입력(len==0)이면 shape (0,) 반환.

    Raises:
        ValueError: y가 1-D가 아닌 경우(예: stereo 2-D). 호출자가 mono 변환 책임.
    """
    y = np.asarray(y, dtype=np.float32)

    # ndim 가드: 2D(stereo) 등 다차원 입력은 조용히 틀린 결과를 내므로 즉시 에러
    if y.ndim != 1:
        raise ValueError("compute_rms_envelope expects mono 1-D PCM")

    # 빈 입력 가드: reflect pad가 크래시하므로 빈 envelope 즉시 반환
    if len(y) == 0:
        return np.zeros(0, dtype=np.float32)

    dur = len(y) / sr
    n = int(np.ceil(dur * fps))
    hop = max(1, int(sr / fps))
    win = hop * 2
    yp = np.pad(y, (win 
    frames = np.array([yp[i * hop: i * hop + win] for i in range(n)])
    rms = np.sqrt((frames ** 2).mean(axis=1)).astype(np.float32)

    # sigma≤0 가드: sigma=0은 스무딩 없음(no-op)으로 자연스럽게 처리
    if sigma > 0:
        rms = gaussian_filter1d(rms.astype(np.float64), sigma=sigma).astype(np.float32)

    # silence gate는 normalize 전 raw RMS 절대 임계값으로 판단
    silence_mask = rms < silence
    rms = rms / (rms.max() + 1e-8)
    rms = np.where(silence_mask, 0.0, rms).astype(np.float32)
    rms = np.power(rms, gamma).astype(np.float32)
    return rms

def rms_to_cdlip(rms, lip_closed, lip_open, open_scale=1.0, offset=0):
    """RMS envelope → LivePortrait lip-close-ratio(c_d_lip) 시퀀스. offset=싱크 보정(프레임).

    출력은 항상 [lip_closed, 1.0] 로 클램프한다(FLP c_d_lip 유효범위 보호):
      - open_scale<0 등으로 결과가 lip_closed 미만이 되면 입이 역전(음수 구동)되므로 닫힘 baseline 으로 하한.
      - open_scale>1 증폭 시 1.0 을 넘으면 워핑 왜곡이 생기므로 상한.
    open_scale=1.0(기본 calm4b)에서는 raw 가 [lip_closed, lip_open]⊂[0,1] 이라 동작 무변경.
    """
    rms = np.asarray(rms, dtype=np.float32)
    n = len(rms)
    idx = np.clip(np.arange(n) + offset, 0, n - 1)
    shifted = rms[idx]
    raw = lip_closed + shifted * (lip_open - lip_closed) * open_scale
    return np.clip(raw, lip_closed, 1.0).astype(np.float32)
