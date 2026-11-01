"""AFL-1071 만화풍 사진 얼굴 검사 — 5변형 판정 순수 로직."""
import numpy as np

from face_check import judge, make_variants

def test_judge_three_of_five_passes():
    assert judge([0.9, 0.25, 0.21, 0.1, 0.0]) == {"ok": True}

def test_judge_two_of_five_fails():
    assert judge([0.9, 0.25, 0.1, 0.1, 0.0]) == {"ok": False, "reason": "NO_FACE"}

def test_judge_boundary_inclusive():
    assert judge([0.2] * 3 + [0, 0])["ok"] is True

def _img():
    rng = np.random.default_rng(0)
    return rng.integers(0, 256, (100, 80, 3), dtype=np.uint8)

def test_make_variants_count_and_shape():
    vs = make_variants(_img())
    assert len(vs) == 5
    for v in vs:
        assert v.shape == (100, 80, 3)
        assert v.dtype == np.uint8

def test_variant_flip_is_mirror():
    img = _img()
    vs = make_variants(img)
    assert np.array_equal(vs[1], vs[0][:, ::-1])

def test_variant_brightness_adds_25_saturating():
    img = _img()
    img[0, 0] = 240
    vs = make_variants(img)
    expected = np.clip(img.astype(int) + 25, 0, 255).astype(np.uint8)
    assert np.array_equal(vs[4], expected)

def test_variant_zoom_is_1_1x_center_crop():
    import cv2

    img = _img()
    h, w = img.shape[:2]
    ch, cw = round(h / 1.1), round(w / 1.1)
    y0, x0 = (h - ch) 
    expected = cv2.resize(img[y0:y0 + ch, x0:x0 + cw], (w, h), interpolation=cv2.INTER_LINEAR)
    assert np.array_equal(make_variants(img)[2], expected)

def test_variant_shrink_is_0_9x_with_replicated_border():
    import cv2

    img = _img()
    h, w = img.shape[:2]
    nh, nw = round(h * 0.9), round(w * 0.9)
    top, left = (h - nh) 
    small = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    expected = cv2.copyMakeBorder(
        small, top, h - nh - top, left, w - nw - left, cv2.BORDER_REPLICATE
    )
    assert np.array_equal(make_variants(img)[3], expected)
