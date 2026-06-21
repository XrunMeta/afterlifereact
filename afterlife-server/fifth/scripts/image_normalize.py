"""fifth source 이미지 세로 정규화 (얼굴중심 crop → 576×1024, 9:16).

순수 기하 함수(cv2 비의존)와 cv2 의존 normalize_source_image 를 분리한다.
비율은 안드로이드 표준 9:16(576×1024, 둘 다 64배수). TARGET_W/H 로 조정 가능.
"""
from __future__ import annotations

import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None  # type: ignore[assignment]  # 로컬 테스트는 monkeypatch

# 출력 규격: 9:16 세로(안드로이드 표준). 576=64×9 · 1024=64×16 (둘 다 64배수).
TARGET_W = 576
TARGET_H = 1024
ASPECT = TARGET_H / TARGET_W  # = 16/9, height = ASPECT × width


def bbox_from_landmarks(lmk: np.ndarray) -> tuple[float, float, float, float]:
    """landmark (N,2) → (x0, y0, x1, y1) 얼굴 외접 bbox."""
    arr = np.asarray(lmk, dtype=np.float32)
    xs, ys = arr[:, 0], arr[:, 1]
    return (float(xs.min()), float(ys.min()), float(xs.max()), float(ys.max()))


def _fit_window(cx: float, cy: float, base_w: float,
                img_w: int, img_h: int, face_center_v: float,
                aspect: float = ASPECT) -> dict:
    """중심(cx,cy)·희망폭 base_w → 원본 내부에 들어가는 aspect(=h/w) crop rect.

    원본보다 크면 비율 유지하며 축소. 얼굴 중심을 높이의 face_center_v 위치에 배치.
    """
    w = float(base_w)
    if w > img_w:
        w = float(img_w)
    if aspect * w > img_h:
        w = img_h / aspect
    w = int(w)              # floor → w ≤ img_w 및 aspect·w ≤ img_h
    if w < 1:
        w = 1
    h = int(round(aspect * w))
    if h > img_h:           # round 로 인한 +1 경계 보호
        h = img_h
    ox = round(cx - w / 2.0)
    oy = round(cy - h * face_center_v)
    ox = int(max(0, min(ox, img_w - w)))
    oy = int(max(0, min(oy, img_h - h)))
    return {"originX": ox, "originY": oy, "width": w, "height": h}


def compute_face_crop_window(img_w: int, img_h: int,
                             bbox: tuple[float, float, float, float],
                             width_k: float = 2.2,
                             face_center_v: float = 0.38,
                             aspect: float = ASPECT) -> dict:
    """얼굴 bbox 중심 기준 aspect(기본 9:16) crop 윈도우(원본 픽셀 rect)."""
    x0, y0, x1, y1 = bbox
    cx = (x0 + x1) / 2.0
    cy = (y0 + y1) / 2.0
    face_w = max(1.0, x1 - x0)
    return _fit_window(cx, cy, face_w * width_k, img_w, img_h, face_center_v, aspect)


def center_crop_window(img_w: int, img_h: int, aspect: float = ASPECT) -> dict:
    """얼굴 검출 실패 폴백 — 이미지 중앙 aspect(기본 9:16) crop."""
    return _fit_window(img_w / 2.0, img_h / 2.0, float(img_w),
                       img_w, img_h, face_center_v=0.5, aspect=aspect)


def normalize_source_image(bgr: np.ndarray, detect_lmk_fn,
                           target_w: int = TARGET_W, target_h: int = TARGET_H,
                           width_k: float = 2.2) -> np.ndarray:
    """source 이미지를 얼굴중심 crop 후 target(576×1024, 9:16)로 resize.

    - 이미 (target_w, target_h)면 멱등 skip(동일 객체 반환).
    - detect_lmk_fn(bgr) 로 얼굴 landmark → bbox → 얼굴중심 윈도우.
    - 검출 실패/예외 → center_crop_window 폴백.
    """
    h, w = bgr.shape[:2]
    if w == target_w and h == target_h:
        return bgr  # 멱등

    aspect = target_h / target_w
    lmk = None
    try:
        lmk = detect_lmk_fn(bgr)
    except Exception:
        lmk = None

    if lmk is not None and len(lmk) > 0:
        rect = compute_face_crop_window(w, h, bbox_from_landmarks(lmk), width_k, aspect=aspect)
    else:
        rect = center_crop_window(w, h, aspect=aspect)

    ox, oy, cw, ch = rect["originX"], rect["originY"], rect["width"], rect["height"]
    crop = bgr[oy:oy + ch, ox:ox + cw]
    return cv2.resize(crop, (target_w, target_h), interpolation=cv2.INTER_AREA)
