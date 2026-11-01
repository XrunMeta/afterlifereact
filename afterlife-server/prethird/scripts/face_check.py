"""AFL-1071 만화풍 사진 얼굴 검사 — 5변형 판정 순수 로직.

cv2/numpy 만 사용한다(torch import 금지). GPU 없이 시험 가능해야 한다.
"""
import os

import cv2
import numpy as np

FACE_SCORE_MIN: float = float(os.environ.get("FACE_CHECK_SCORE_MIN", "0.2"))
PASS_MIN: int = int(os.environ.get("FACE_CHECK_PASS_MIN", "3"))

_ZOOM = 1.2     # 확대 배율 (가운데 잘라 원크기로)
_SHRINK = 0.9   # 축소 배율 (가장자리 복제 패딩)
_BRIGHT = 25    # 밝기 가산값

def _zoom_in(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    ch, cw = max(1, int(round(h / _ZOOM))), max(1, int(round(w / _ZOOM)))
    y0, x0 = (h - ch) 
    crop = img[y0:y0 + ch, x0:x0 + cw]
    return cv2.resize(crop, (w, h), interpolation=cv2.INTER_LINEAR)

def _zoom_out(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    nh, nw = max(1, int(round(h * _SHRINK))), max(1, int(round(w * _SHRINK)))
    small = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    top, left = (h - nh) 
    return cv2.copyMakeBorder(
        small, top, h - nh - top, left, w - nw - left, cv2.BORDER_REPLICATE
    )

def make_variants(img: np.ndarray) -> list:
    """BGR uint8 -> [원본, 반전, 확대, 축소, 밝기] (크기 모두 입력과 동일)."""
    return [
        img,
        np.ascontiguousarray(img[:, ::-1]),
        _zoom_in(img),
        _zoom_out(img),
        cv2.convertScaleAbs(img, alpha=1.0, beta=_BRIGHT),
    ]

def judge(scores: list, score_min: float = None, pass_min: int = None) -> dict:
    """변형별 최고 얼굴 점수 중 score_min 이상(경계 포함)이 pass_min 개 이상이면 통과."""
    score_min = FACE_SCORE_MIN if score_min is None else score_min
    pass_min = PASS_MIN if pass_min is None else pass_min
    hits = sum(1 for s in scores if s >= score_min)
    if hits >= pass_min:
        return {"ok": True}
    return {"ok": False, "reason": "NO_FACE"}
