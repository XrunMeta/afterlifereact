"""face_source 단위 테스트."""
import json
from pathlib import Path

import numpy as np
import pytest

import face_source


# ---------------------------------------------------------------------------
# 기존: select_open_closed / mouth_open_score
# ---------------------------------------------------------------------------

def test_select_open_closed_blend():
    scores = np.array([0.1, 0.5, 0.2], dtype=np.float32)
    sel = face_source.select_open_closed(scores, open_threshold=0.3)
    assert sel.mode == "blend"
    assert sel.open_idx == 1
    assert sel.closed_idx == 0


def test_select_open_closed_single_fallback():
    scores = np.array([0.1, 0.2, 0.15], dtype=np.float32)
    sel = face_source.select_open_closed(scores, open_threshold=0.3)
    assert sel.mode == "single"
    assert sel.closed_idx is None


def test_select_open_closed_empty_raises():
    with pytest.raises(ValueError):
        face_source.select_open_closed(np.array([]), open_threshold=0.2)


def test_select_open_closed_same_idx_single():
    scores = np.array([0.5], dtype=np.float32)
    sel = face_source.select_open_closed(scores, open_threshold=0.3)
    assert sel.mode == "single"


def test_mouth_open_score_basic():
    pts = np.array([[0.0, 0.0], [10.0, 0.0], [5.0, 5.0]], dtype=np.float64)
    score = face_source.mouth_open_score(pts)
    assert score == pytest.approx(0.5)


def test_mouth_open_score_zero_width():
    pts = np.array([[5.0, 0.0], [5.0, 10.0]], dtype=np.float64)
    score = face_source.mouth_open_score(pts)
    assert score == 0.0


def test_mouth_open_score_nan_filtered():
    pts = np.array([[0.0, 0.0], [float("nan"), float("nan")], [10.0, 5.0]])
    score = face_source.mouth_open_score(pts)
    assert np.isfinite(score)


# ---------------------------------------------------------------------------
# 기존: load_or_extract_sources
# ---------------------------------------------------------------------------

def _make_fake_cv2(img: np.ndarray):
    class FakeCv2:
        @staticmethod
        def imwrite(p, a):
            Path(p).write_bytes(b"x")
            return True

        @staticmethod
        def imread(p):
            return img

    return FakeCv2()


def test_load_or_extract_sources_cache_miss_then_hit(tmp_path, monkeypatch):
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    monkeypatch.setattr(face_source, "cv2", _make_fake_cv2(img))

    sel = face_source.FrameSelection(open_idx=0, closed_idx=1, mode="blend", open_score=0.4)

    def fake_extract(video_path):
        return img, img, sel

    out = face_source.load_or_extract_sources(
        "fake.mp4", str(tmp_path / "cache"), "9001", fake_extract
    )
    assert out["mode"] == "blend"
    assert out["closed_path"] is not None

    # 두 번째 호출: 캐시 히트
    out2 = face_source.load_or_extract_sources(
        "fake.mp4", str(tmp_path / "cache"), "9001", fake_extract
    )
    assert out2["mode"] == "blend"


def test_load_or_extract_sources_single_mode(tmp_path, monkeypatch):
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    monkeypatch.setattr(face_source, "cv2", _make_fake_cv2(img))

    sel = face_source.FrameSelection(open_idx=0, closed_idx=None, mode="single", open_score=0.1)

    def fake_extract(video_path):
        return img, None, sel

    out = face_source.load_or_extract_sources(
        "fake.mp4", str(tmp_path / "cache"), "9002", fake_extract
    )
    assert out["mode"] == "single"
    assert out["closed_path"] is None


def test_load_or_extract_sources_corrupt_blend_cache_reextract(tmp_path, monkeypatch):
    """blend 메타인데 closed.png 없음 → 재추출."""
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    monkeypatch.setattr(face_source, "cv2", _make_fake_cv2(img))

    clone_dir = tmp_path / "cache" / "9003"
    clone_dir.mkdir(parents=True)
    (clone_dir / "open.png").write_bytes(b"x")
    (clone_dir / "source_meta.json").write_text(
        json.dumps({"mode": "blend", "open_score": 0.4, "open_idx": 0, "closed_idx": 1})
    )
    # closed.png 없음 → 손상

    sel = face_source.FrameSelection(open_idx=0, closed_idx=1, mode="blend", open_score=0.4)

    def fake_extract(video_path):
        return img, img, sel

    out = face_source.load_or_extract_sources(
        "fake.mp4", str(tmp_path / "cache"), "9003", fake_extract
    )
    assert out["mode"] == "blend"


# ---------------------------------------------------------------------------
# 신규: load_image_source
# ---------------------------------------------------------------------------

def test_image_source_single_mode(tmp_path, monkeypatch):
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    fake_cv2 = type("cv2", (), {})()
    fake_cv2.imread = lambda p: img
    fake_cv2.imwrite = lambda p, a: Path(p).write_bytes(b"x") or True
    monkeypatch.setattr(face_source, "cv2", fake_cv2)
    src_img = tmp_path / "face.jpg"
    src_img.write_bytes(b"jpeg")
    out = face_source.load_image_source(str(src_img), str(tmp_path / "cache"), "9056")
    assert out["mode"] == "single"
    assert out["closed_path"] is None
    assert Path(out["open_path"]).name == "open.png"
    meta = json.loads((Path(tmp_path / "cache") / "9056" / "source_meta.json").read_text())
    assert meta["mode"] == "single"
    assert meta["source"] == "image"


def test_load_or_extract_ignores_image_cache(tmp_path, monkeypatch):
    """이미지 캐시가 먼저 있을 때 load_or_extract_sources는 재추출해야 한다(el GUARD)."""
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    fake_cv2 = type("cv2", (), {})()
    fake_cv2.imread = lambda p: img
    fake_cv2.imwrite = lambda p, a: Path(p).write_bytes(b"x") or True
    monkeypatch.setattr(face_source, "cv2", fake_cv2)

    # 1) 이미지 캐시 먼저 생성
    face_source.load_image_source(
        str(tmp_path / "f.jpg"), str(tmp_path / "c"), "9056"
    )

    # 2) 같은 clone_id로 영상추출 호출 → extract_fn 호출돼야 함(이미지 캐시 무시)
    called = {}

    def fake_extract(vp):
        called["yes"] = True
        return img, None, face_source.FrameSelection(
            open_idx=0, closed_idx=None, mode="single", open_score=0.1
        )

    face_source.load_or_extract_sources(
        "/x/9056/idle.mp4", str(tmp_path / "c"), "9056", fake_extract
    )
    assert called.get("yes") is True, "이미지 캐시를 무시하고 extract_fn 호출해야 함"


def test_image_source_missing_file_raises(tmp_path, monkeypatch):
    fake_cv2 = type("cv2", (), {})()
    fake_cv2.imread = lambda p: None
    monkeypatch.setattr(face_source, "cv2", fake_cv2)
    src_img = tmp_path / "bad.jpg"
    src_img.write_bytes(b"x")
    with pytest.raises(RuntimeError):
        face_source.load_image_source(str(src_img), str(tmp_path / "cache"), "1")
