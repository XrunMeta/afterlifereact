import numpy as np
import pytest
import image_normalize as m
from image_normalize import (bbox_from_landmarks, compute_face_crop_window,
                             center_crop_window, ASPECT, TARGET_W, TARGET_H)


def _is_aspect(rect, aspect=ASPECT):
    """round 오차(±1px) 허용 비율 검증."""
    return abs(rect["height"] / rect["width"] - aspect) < 0.01


def test_bbox_from_landmarks():
    lmk = np.array([[10, 20], [50, 80], [30, 40]], dtype=np.float32)
    assert bbox_from_landmarks(lmk) == (10.0, 20.0, 50.0, 80.0)


def test_target_is_9to16_and_64_multiple():
    assert (TARGET_W, TARGET_H) == (576, 1024)
    assert TARGET_W % 64 == 0 and TARGET_H % 64 == 0
    assert abs(ASPECT - 16 / 9) < 1e-9


def test_face_window_centered_is_9to16_and_inside():
    # 1000x2000 원본, 얼굴 bbox 폭 200(중앙)
    rect = compute_face_crop_window(1000, 2000, (400, 800, 600, 1000), width_k=2.0)
    assert _is_aspect(rect)                              # 9:16
    assert rect["width"] == 400                          # 얼굴폭 200 × 2.0
    assert 0 <= rect["originX"] <= 1000 - rect["width"]  # 원본 내부
    assert 0 <= rect["originY"] <= 2000 - rect["height"]


def test_face_window_edge_clamps_inside():
    # 얼굴이 좌상단 가장자리 → 윈도우가 원본 밖으로 안 나감
    rect = compute_face_crop_window(1000, 2000, (0, 0, 100, 100), width_k=2.0)
    assert rect["originX"] >= 0 and rect["originY"] >= 0
    assert rect["originX"] + rect["width"] <= 1000
    assert rect["originY"] + rect["height"] <= 2000


def test_small_source_shrinks_keeping_9to16():
    # 희망 윈도우가 원본(400x500)보다 큼 → 9:16 유지하며 축소
    rect = compute_face_crop_window(400, 500, (100, 100, 300, 300), width_k=3.0)
    assert rect["width"] <= 400 and rect["height"] <= 500
    assert _is_aspect(rect)


def test_center_crop_fallback_is_9to16_inside():
    rect = center_crop_window(900, 1600)
    assert _is_aspect(rect)
    assert rect["originX"] + rect["width"] <= 900
    assert rect["originY"] + rect["height"] <= 1600


def test_normalize_idempotent_skips_576x1024():
    img = np.zeros((1024, 576, 3), dtype=np.uint8)
    out = m.normalize_source_image(img, detect_lmk_fn=lambda b: None)
    assert out is img  # 멱등 — 동일 객체 반환, 검출/리사이즈 안 함


def test_normalize_face_path_outputs_576x1024(monkeypatch):
    img = np.zeros((2000, 1000, 3), dtype=np.uint8)
    lmk = np.array([[400, 800], [600, 1000]], dtype=np.float32)  # 얼굴 중앙
    captured = {}

    def fake_resize(crop, size, interpolation=0):
        captured["crop_shape"] = crop.shape
        captured["size"] = size
        return np.zeros((size[1], size[0], 3), dtype=np.uint8)

    monkeypatch.setattr(m, "cv2", type("C", (), {"resize": staticmethod(fake_resize),
                                                  "INTER_AREA": 0})())
    out = m.normalize_source_image(img, detect_lmk_fn=lambda b: lmk)
    assert out.shape == (1024, 576, 3)
    assert captured["size"] == (576, 1024)
    # crop 은 9:16 (height ≈ 16/9 × width, round 오차 허용)
    ch, cw = captured["crop_shape"][0], captured["crop_shape"][1]
    assert abs(ch / cw - ASPECT) < 0.01


def test_normalize_detect_fail_uses_center(monkeypatch):
    img = np.zeros((1600, 900, 3), dtype=np.uint8)

    def fake_resize(crop, size, interpolation=0):
        return np.zeros((size[1], size[0], 3), dtype=np.uint8)

    monkeypatch.setattr(m, "cv2", type("C", (), {"resize": staticmethod(fake_resize),
                                                  "INTER_AREA": 0})())
    out = m.normalize_source_image(img, detect_lmk_fn=lambda b: None)  # 검출 실패
    assert out.shape == (1024, 576, 3)  # center 폴백으로도 576×1024
