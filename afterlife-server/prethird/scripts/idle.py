import colorsys, os
import numpy as np
from config import WIDTH, HEIGHT


def _dummy_rgb_frame(elapsed: float) -> np.ndarray:
    """단색 frame, 12초 주기 색 회전."""
    h = (elapsed / 12.0) % 1.0
    r, g, b = colorsys.hsv_to_rgb(h, 0.7, 0.9)
    arr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    arr[:, :, 0] = int(r * 255)
    arr[:, :, 1] = int(g * 255)
    arr[:, :, 2] = int(b * 255)
    return arr


def _select_idle_frame(now, last_real_ts, grace, idle_frames, idle_t0, last_frame, fps=25):
    """029-H: 큐 빔(timeout) 시 송출 frame 결정 — 시간 기반(recv 빈도 무관 일정 25fps).
    grace 경과 + idle_frames 있으면 idle loop frame, 아니면 last_frame hold.
    반환: (frame, new_idle_t0). idle_t0=0 이면 첫 진입(now 로 고정), hold 시 0 리셋.
    """
    if idle_frames and (now - last_real_ts) >= grace:
        t0 = idle_t0 if idle_t0 > 0 else now
        idx = int((now - t0) * fps) % len(idle_frames)
        return idle_frames[idx], t0
    return last_frame, 0.0


def _load_idle_frames(path):
    """029-H: idle mp4 → rgb24 ndarray 리스트. 실패 시 빈 리스트(=hold fallback)."""
    try:
        import av
        out = []
        c = av.open(path)
        for fr in c.decode(video=0):
            out.append(fr.to_ndarray(format="rgb24"))
        c.close()
        return out
    except Exception as e:
        print(f"[029-H] idle load fail: {e}", flush=True)
        return []
