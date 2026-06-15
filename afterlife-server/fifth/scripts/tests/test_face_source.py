"""face_source 모듈 TDD 테스트 (13 Steps)."""
from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pytest

from face_source import FrameSelection, load_or_extract_sources, mouth_open_score, select_open_closed


# ---------------------------------------------------------------------------
# Step 1~4: select_open_closed
# ---------------------------------------------------------------------------

def test_select_picks_max_open_and_min_open():
    scores = np.array([0.05, 0.40, 0.02, 0.10], dtype=np.float32)
    sel = select_open_closed(scores, open_threshold=0.20)
    assert sel.open_idx == 1      # 0.40 최대 = open(치아)
    assert sel.closed_idx == 2    # 0.02 최소 = closed(다묾)
    assert sel.mode == "blend"    # open 스코어 >= 임계 → 2장 블렌드


def test_select_falls_back_to_single_when_no_open():
    scores = np.array([0.05, 0.08, 0.03], dtype=np.float32)
    sel = select_open_closed(scores, open_threshold=0.20)
    assert sel.mode == "single"
    assert sel.open_idx == 2      # 단일모드 소스 = 가장 닫힌 프레임
    assert sel.closed_idx is None


def test_select_empty_scores_raises():
    with pytest.raises(ValueError, match="빈 스코어"):
        select_open_closed(np.zeros(0, dtype=np.float32), open_threshold=0.20)


# ---------------------------------------------------------------------------
# Step 5~8: mouth_open_score
# ---------------------------------------------------------------------------

def test_mouth_open_score_larger_gap_higher():
    wide = {"upper": (20.0, 10.0), "lower": (20.0, 30.0),
            "left": (0.0, 20.0), "right": (40.0, 20.0)}
    narrow = {"upper": (20.0, 18.0), "lower": (20.0, 22.0),
              "left": (0.0, 20.0), "right": (40.0, 20.0)}
    assert mouth_open_score(wide) > mouth_open_score(narrow)


def test_mouth_open_score_zero_width_safe():
    degenerate = {"upper": (20.0, 10.0), "lower": (20.0, 30.0),
                  "left": (20.0, 20.0), "right": (20.0, 20.0)}
    assert mouth_open_score(degenerate) == 0.0


# ---------------------------------------------------------------------------
# Step 9~12: load_or_extract_sources
# ---------------------------------------------------------------------------

def test_cache_hit_skips_extraction(tmp_path):
    clone_dir = tmp_path / "9047"
    clone_dir.mkdir()
    (clone_dir / "open.png").write_bytes(b"fake-open")
    (clone_dir / "closed.png").write_bytes(b"fake-closed")
    (clone_dir / "source_meta.json").write_text(
        json.dumps({"mode": "blend", "open_score": 0.4}))

    called = {"n": 0}

    def fake_extract(video_path):
        called["n"] += 1
        raise AssertionError("캐시 히트 시 추출하면 안 됨")

    res = load_or_extract_sources(
        video_path="/irrelevant.mp4", cache_root=str(tmp_path),
        clone_id=9047, extract_fn=fake_extract)
    assert called["n"] == 0
    assert res["mode"] == "blend"
    assert res["open_path"] == str(clone_dir / "open.png")
    assert res["closed_path"] == str(clone_dir / "closed.png")


def test_cache_miss_extracts_and_writes(tmp_path):
    open_img = np.full((4, 4, 3), 7, dtype=np.uint8)
    closed_img = np.full((4, 4, 3), 3, dtype=np.uint8)

    def fake_extract(video_path):
        return open_img, closed_img, FrameSelection(
            open_idx=5, closed_idx=2, mode="blend", open_score=0.4)

    with patch("face_source.cv2") as mock_cv2:
        mock_cv2.imwrite.return_value = True
        res = load_or_extract_sources(
            video_path="/v.mp4", cache_root=str(tmp_path),
            clone_id=9047, extract_fn=fake_extract)

    assert res["mode"] == "blend"
    assert res["open_path"] == str(tmp_path / "9047" / "open.png")
    assert res["closed_path"] == str(tmp_path / "9047" / "closed.png")
    assert (tmp_path / "9047" / "source_meta.json").is_file()


def test_cache_miss_single_mode_no_closed(tmp_path):
    open_img = np.full((4, 4, 3), 7, dtype=np.uint8)

    def fake_extract(video_path):
        return open_img, None, FrameSelection(
            open_idx=2, closed_idx=None, mode="single", open_score=0.05)

    with patch("face_source.cv2") as mock_cv2:
        mock_cv2.imwrite.return_value = True
        res = load_or_extract_sources(
            video_path="/v.mp4", cache_root=str(tmp_path),
            clone_id=42, extract_fn=fake_extract)

    assert res["mode"] == "single"
    assert res["closed_path"] is None
    assert res["open_path"] == str(tmp_path / "42" / "open.png")


# ---------------------------------------------------------------------------
# [신규] Item 1: mouth_open_score — NaN/inf 방어
# ---------------------------------------------------------------------------

def test_mouth_open_score_nan_returns_zero():
    pts = {"upper": (float("nan"), 10), "lower": (20, 30),
           "left": (0, 20), "right": (40, 20)}
    assert mouth_open_score(pts) == 0.0


def test_mouth_open_score_inf_returns_zero():
    pts = {"upper": (10, 10), "lower": (float("inf"), 30),
           "left": (0, 20), "right": (40, 20)}
    assert mouth_open_score(pts) == 0.0


def test_mouth_open_score_neg_inf_returns_zero():
    pts = {"upper": (10, 10), "lower": (20, 30),
           "left": (float("-inf"), 20), "right": (40, 20)}
    assert mouth_open_score(pts) == 0.0


# ---------------------------------------------------------------------------
# [신규] Item 2: load_or_extract_sources — 부분 캐시 손상 시 재추출
# ---------------------------------------------------------------------------

def test_partial_cache_blend_no_closed_reextracts(tmp_path):
    """meta=blend + open.png 있지만 closed.png 없으면 캐시 미스로 재추출."""
    clone_dir = tmp_path / "9047"
    clone_dir.mkdir()
    (clone_dir / "open.png").write_bytes(b"fake-open")
    (clone_dir / "source_meta.json").write_text(
        json.dumps({"mode": "blend", "open_score": 0.4}))
    # closed.png 없음 — 손상된 캐시

    open_img = np.full((4, 4, 3), 7, dtype=np.uint8)
    closed_img = np.full((4, 4, 3), 3, dtype=np.uint8)
    called = {"n": 0}

    def fake_extract(video_path):
        called["n"] += 1
        return open_img, closed_img, FrameSelection(
            open_idx=5, closed_idx=2, mode="blend", open_score=0.4)

    with patch("face_source.cv2") as mock_cv2:
        mock_cv2.imwrite.return_value = True
        res = load_or_extract_sources(
            video_path="/v.mp4", cache_root=str(tmp_path),
            clone_id=9047, extract_fn=fake_extract)

    assert called["n"] == 1, "손상 캐시이므로 재추출 호출돼야 함"
    assert res["mode"] == "blend"


# ---------------------------------------------------------------------------
# [신규] Item 3: cv2=None 명시적 가드
# ---------------------------------------------------------------------------

def test_cache_miss_cv2_none_raises_runtime(tmp_path):
    """캐시 미스 경로에서 cv2=None이면 RuntimeError."""
    import face_source as fs

    open_img = np.full((4, 4, 3), 7, dtype=np.uint8)

    def fake_extract(video_path):
        return open_img, None, FrameSelection(
            open_idx=0, closed_idx=None, mode="single", open_score=0.05)

    original_cv2 = fs.cv2
    fs.cv2 = None
    try:
        with pytest.raises(RuntimeError, match="cv2 미설치"):
            load_or_extract_sources(
                video_path="/v.mp4", cache_root=str(tmp_path),
                clone_id=999, extract_fn=fake_extract)
    finally:
        fs.cv2 = original_cv2


# ---------------------------------------------------------------------------
# [신규] Item 4a: select_open_closed — 동일 스코어 → single 강등
# ---------------------------------------------------------------------------

def test_select_all_same_scores_degrades_to_single():
    """모든 스코어 동일(argmax==argmin 가능성) + 임계 초과 → single 강등."""
    scores = np.array([0.3, 0.3, 0.3], dtype=np.float32)
    sel = select_open_closed(scores, open_threshold=0.2)
    assert sel.mode == "single"
    assert sel.closed_idx is None


# ---------------------------------------------------------------------------
# [신규] Item 4b: select_open_closed — 경계값(최대==임계 → blend)
# ---------------------------------------------------------------------------

def test_select_score_equal_threshold_is_blend():
    """최대 스코어 == threshold → blend (미만만 single)."""
    scores = np.array([0.05, 0.20, 0.1], dtype=np.float32)
    sel = select_open_closed(scores, open_threshold=0.20)
    assert sel.mode == "blend"
    assert sel.open_idx == 1


# ---------------------------------------------------------------------------
# [신규] Item 5: make_extract_fn — 진단 메시지 보강
# ---------------------------------------------------------------------------

def test_make_extract_fn_no_face_error_message(tmp_path):
    """모든 프레임 검출 실패 시 RuntimeError에 프레임 수 포함."""
    import face_source as fs
    from unittest.mock import MagicMock

    # 3프레임짜리 가짜 VideoCapture: 3번 read 후 종료
    mock_cap = MagicMock()
    read_results = [(True, np.zeros((4, 4, 3), dtype=np.uint8))] * 3 + [(False, None)]
    mock_cap.read.side_effect = read_results

    mock_cv2 = MagicMock()
    mock_cv2.VideoCapture.return_value = mock_cap

    original_cv2 = fs.cv2
    fs.cv2 = mock_cv2
    try:
        detect_lmk = lambda bgr: None  # 항상 검출 실패
        extract_fn = fs.make_extract_fn(detect_lmk, open_threshold=0.20, sample_stride=1)
        with pytest.raises(RuntimeError, match="시도"):
            extract_fn("/fake/video.mp4")
    finally:
        fs.cv2 = original_cv2
