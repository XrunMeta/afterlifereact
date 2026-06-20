"""fifth source 이미지 1:2 세로 정규화 (얼굴중심 crop → 512×1024).

순수 기하 함수(cv2 비의존)와 cv2 의존 normalize_source_image 를 분리한다.
"""
from __future__ import annotations

import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None  # type: ignore[assignment]  # 로컬 테스트는 monkeypatch


def bbox_from_landmarks(lmk: np.ndarray) -> tuple[float, float, float, float]:
    """landmark (N,2) → (x0, y0, x1, y1) 얼굴 외접 bbox."""
    arr = np.asarray(lmk, dtype=np.float32)
    xs, ys = arr[:, 0], arr[:, 1]
    return (float(xs.min()), float(ys.min()), float(xs.max()), float(ys.max()))


def _fit_window_1to2(cx: float, cy: float, base_w: float,
                     img_w: int, img_h: int, face_center_v: float) -> dict:
    """중심(cx,cy)·희망폭 base_w → 원본 내부에 들어가는 1:2 crop rect.

    원본보다 크면 1:2 유지하며 축소. 얼굴 중심을 높이의 face_center_v 위치에 배치.
    """
    w = float(base_w)
    if w > img_w:
        w = float(img_w)
    if 2.0 * w > img_h:
        w = img_h / 2.0
    w = int(w)              # floor → w ≤ img_w 및 2w ≤ img_h 보장
    if w < 1:
        w = 1
    h = 2 * w
    ox = round(cx - w / 2.0)
    oy = round(cy - h * face_center_v)
    ox = int(max(0, min(ox, img_w - w)))
    oy = int(max(0, min(oy, img_h - h)))
    return {"originX": ox, "originY": oy, "width": w, "height": h}


def compute_face_crop_window(img_w: int, img_h: int,
                             bbox: tuple[float, float, float, float],
                             width_k: float = 2.2,
                             face_center_v: float = 0.38) -> dict:
    """얼굴 bbox 중심 기준 1:2 crop 윈도우(원본 픽셀 rect)."""
    x0, y0, x1, y1 = bbox
    cx = (x0 + x1) / 2.0
    cy = (y0 + y1) / 2.0
    face_w = max(1.0, x1 - x0)
    return _fit_window_1to2(cx, cy, face_w * width_k, img_w, img_h, face_center_v)


def center_crop_window(img_w: int, img_h: int) -> dict:
    """얼굴 검출 실패 폴백 — 이미지 중앙 1:2 crop."""
    return _fit_window_1to2(img_w / 2.0, img_h / 2.0, float(img_w),
                            img_w, img_h, face_center_v=0.5)


def normalize_source_image(bgr: np.ndarray, detect_lmk_fn,
                           target_w: int = 512, target_h: int = 1024,
                           width_k: float = 2.2) -> np.ndarray:
    """source 이미지를 얼굴중심 1:2 crop 후 target(512×1024)로 resize.

    - 이미 (target_w, target_h)면 멱등 skip(동일 객체 반환).
    - detect_lmk_fn(bgr) 로 얼굴 landmark → bbox → 얼굴중심 윈도우.
    - 검출 실패/예외 → center_crop_window 폴백.
    """
    h, w = bgr.shape[:2]
    if w == target_w and h == target_h:
        return bgr  # 멱등

    lmk = None
    try:
        lmk = detect_lmk_fn(bgr)
    except Exception:
        lmk = None

    if lmk is not None and len(lmk) > 0:
        rect = compute_face_crop_window(w, h, bbox_from_landmarks(lmk), width_k)
    else:
        rect = center_crop_window(w, h)

    ox, oy, cw, ch = rect["originX"], rect["originY"], rect["width"], rect["height"]
    crop = bgr[oy:oy + ch, ox:ox + cw]
    return cv2.resize(crop, (target_w, target_h), interpolation=cv2.INTER_AREA)
