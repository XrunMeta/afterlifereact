import numpy as np
import pytest
from image_normalize import bbox_from_landmarks, compute_face_crop_window, center_crop_window


def test_bbox_from_landmarks():
    lmk = np.array([[10, 20], [50, 80], [30, 40]], dtype=np.float32)
    assert bbox_from_landmarks(lmk) == (10.0, 20.0, 50.0, 80.0)


def test_face_window_centered_is_1to2_and_inside():
    # 1000x2000 원본, 얼굴 bbox 폭 200(중앙)
    rect = compute_face_crop_window(1000, 2000, (400, 800, 600, 1000), width_k=2.0)
    assert rect["height"] == 2 * rect["width"]          # 1:2
    assert rect["width"] == 400                          # 얼굴폭 200 × 2.0
    assert 0 <= rect["originX"] <= 1000 - rect["width"]  # 원본 내부
    assert 0 <= rect["originY"] <= 2000 - rect["height"]


def test_face_window_edge_clamps_inside():
    # 얼굴이 좌상단 가장자리 → 윈도우가 원본 밖으로 안 나감
    rect = compute_face_crop_window(1000, 2000, (0, 0, 100, 100), width_k=2.0)
    assert rect["originX"] >= 0 and rect["originY"] >= 0
    assert rect["originX"] + rect["width"] <= 1000
    assert rect["originY"] + rect["height"] <= 2000


def test_small_source_shrinks_keeping_1to2():
    # 희망 윈도우(600x1200)가 원본(400x500)보다 큼 → 1:2 유지하며 축소
    rect = compute_face_crop_window(400, 500, (100, 100, 300, 300), width_k=3.0)
    assert rect["width"] <= 400 and rect["height"] <= 500
    assert rect["height"] == 2 * rect["width"]


def test_center_crop_fallback_is_1to2_inside():
    rect = center_crop_window(900, 1600)
    assert rect["height"] == 2 * rect["width"]
    assert rect["originX"] + rect["width"] <= 900
    assert rect["originY"] + rect["height"] <= 1600
