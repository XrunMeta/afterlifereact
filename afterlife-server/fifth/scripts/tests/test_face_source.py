"""face_source 모듈 TDD 테스트 (13 Steps)."""
from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pytest

import face_source
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
# Step 5~8: mouth_open_score (배열 시그니처)
# ---------------------------------------------------------------------------

def test_mouth_open_score_larger_gap_higher():
    # wide: x=[0,20,40], y=[10,30,20] → gap=20, width=40 → 0.5
    wide = np.array([[20.0, 10.0], [20.0, 30.0], [0.0, 20.0], [40.0, 20.0]], dtype=np.float32)
    # narrow: x=[0,20,40], y=[18,22,20] → gap=4, width=40 → 0.1
    narrow = np.array([[20.0, 18.0], [20.0, 22.0], [0.0, 20.0], [40.0, 20.0]], dtype=np.float32)
    assert mouth_open_score(wide) > mouth_open_score(narrow)
    # 값 검증: wide=0.5, narrow=0.1
    assert abs(mouth_open_score(wide) - 0.5) < 1e-5
    assert abs(mouth_open_score(narrow) - 0.1) < 1e-5


def test_mouth_open_score_zero_width_safe():
    # 모든 x 동일 → width=0 → 0.0
    degenerate = np.array([[20.0, 10.0], [20.0, 30.0], [20.0, 20.0], [20.0, 20.0]], dtype=np.float32)
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
# [신규] Item 1: mouth_open_score — NaN/inf 방어 (배열 시그니처)
# ---------------------------------------------------------------------------

def test_mouth_open_score_nan_returns_zero():
    # NaN이 포함된 점은 제외 후 계산 — 유효 점이 1개도 없으면 0.0
    pts = np.array([[float("nan"), 10], [20, 30], [0, 20], [40, 20]], dtype=np.float64)
    # NaN 점 제외 후 유효 3점으로 계산됨 → 0이 아닐 수 있음. 단 예외 없음.
    result = mouth_open_score(pts)
    assert isinstance(result, float)
    assert not (result != result)  # NaN 아님


def test_mouth_open_score_all_nan_returns_zero():
    # 모든 점이 NaN → 유효 점 0개 → 0.0
    pts = np.array([[float("nan"), float("nan")], [float("nan"), float("nan")]], dtype=np.float64)
    assert mouth_open_score(pts) == 0.0


def test_mouth_open_score_inf_returns_zero():
    # inf 포함 점 제외 후 나머지만 계산 → 예외 없음
    pts = np.array([[10, 10], [float("inf"), 30], [0, 20], [40, 20]], dtype=np.float64)
    result = mouth_open_score(pts)
    assert isinstance(result, float)
    assert not (result != result)


def test_mouth_open_score_neg_inf_returns_zero():
    # -inf 포함 점 제외 후 나머지만 계산 → 예외 없음
    pts = np.array([[10, 10], [20, 30], [float("-inf"), 20], [40, 20]], dtype=np.float64)
    result = mouth_open_score(pts)
    assert isinstance(result, float)
    assert not (result != result)


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


# ---------------------------------------------------------------------------
# [신규] make_extract_fn — 203점 입 윤곽 슬라이스(48:107) 검증
# ---------------------------------------------------------------------------

def _make_203pt_lmk(y_mouth_top: float, y_mouth_bottom: float) -> np.ndarray:
    """203점 가짜 landmark 생성. 입 윤곽(48~106)의 y 범위를 인자로 지정."""
    lmk = np.zeros((203, 2), dtype=np.float32)
    # 입 윤곽(48~106): x는 0~58 범위 분산, y는 top/bottom 사이
    for i in range(59):
        lmk[48 + i, 0] = float(i)  # x: 0~58
        # 홀수=top, 짝수=bottom 으로 간격 생성
        lmk[48 + i, 1] = y_mouth_top if i % 2 == 0 else y_mouth_bottom
    return lmk


def test_make_extract_fn_uses_203pt_mouth_slice():
    """detect_lmk가 203점 반환 시 make_extract_fn이 lmk[48:107]을 입 윤곽으로 사용."""
    import face_source as fs
    from unittest.mock import MagicMock

    # open 프레임: 입 gap 큰 landmark (y 20~60)
    lmk_open = _make_203pt_lmk(y_mouth_top=20.0, y_mouth_bottom=60.0)
    # closed 프레임: 입 gap 작은 landmark (y 38~42)
    lmk_closed = _make_203pt_lmk(y_mouth_top=38.0, y_mouth_bottom=42.0)

    frame_open = np.full((4, 4, 3), 200, dtype=np.uint8)
    frame_closed = np.full((4, 4, 3), 50, dtype=np.uint8)

    call_count = {"n": 0}
    lmks = [lmk_open, lmk_closed]
    frames_bgr = [frame_open, frame_closed]

    def detect_lmk(bgr):
        i = call_count["n"]
        call_count["n"] += 1
        return lmks[i]

    mock_cap = MagicMock()
    # 2프레임 + 종료
    read_results = [(True, frames_bgr[0]), (True, frames_bgr[1]), (False, None)]
    mock_cap.read.side_effect = read_results

    mock_cv2 = MagicMock()
    mock_cv2.VideoCapture.return_value = mock_cap

    original_cv2 = fs.cv2
    fs.cv2 = mock_cv2
    try:
        extract_fn = fs.make_extract_fn(detect_lmk, open_threshold=0.10, sample_stride=1)
        open_bgr, closed_bgr, sel = extract_fn("/fake/video.mp4")
    finally:
        fs.cv2 = original_cv2

    # open 프레임(gap=40/width=58≈0.69)이 closed(gap=4/width=58≈0.07)보다 스코어 높음
    assert sel.mode == "blend"
    # open 프레임이 0번, closed가 1번
    assert sel.open_idx == 0
    assert sel.closed_idx == 1
    assert sel.open_score > 0.5


def test_make_extract_fn_skips_frames_with_fewer_than_49_landmarks():
    """49점 미만 landmark 프레임은 스킵되고 에러 없이 처리됨."""
    import face_source as fs
    from unittest.mock import MagicMock

    # 첫 번째 프레임: 10점 landmark (스킵), 두 번째: 203점(처리)
    lmk_short = np.zeros((10, 2), dtype=np.float32)
    lmk_full = _make_203pt_lmk(y_mouth_top=20.0, y_mouth_bottom=60.0)

    frame_dummy = np.zeros((4, 4, 3), dtype=np.uint8)
    call_count = {"n": 0}
    lmks = [lmk_short, lmk_full]

    def detect_lmk(bgr):
        i = call_count["n"]
        call_count["n"] += 1
        return lmks[i]

    mock_cap = MagicMock()
    read_results = [(True, frame_dummy), (True, frame_dummy), (False, None)]
    mock_cap.read.side_effect = read_results

    mock_cv2 = MagicMock()
    mock_cv2.VideoCapture.return_value = mock_cap

    original_cv2 = fs.cv2
    fs.cv2 = mock_cv2
    try:
        extract_fn = fs.make_extract_fn(detect_lmk, open_threshold=0.05, sample_stride=1)
        open_bgr, closed_bgr, sel = extract_fn("/fake/video.mp4")
    finally:
        fs.cv2 = original_cv2

    # 203점 프레임 1개만 유효 → single 모드
    assert sel.mode == "single"


# ---------------------------------------------------------------------------
# [이동] load_image_source 신규 3건 (루트 test_face_source.py 에서 이동)
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


# ---------------------------------------------------------------------------
# [Task 3 신규] load_image_source — 정규화 통합 + 토글
# ---------------------------------------------------------------------------

def test_load_image_source_normalizes_when_enabled(tmp_path, monkeypatch):
    monkeypatch.setenv("FIFTH_INPUT_NORMALIZE", "1")
    captured = {}

    class FakeCv2:
        IMREAD_COLOR = 1
        INTER_AREA = 0
        @staticmethod
        def imread(p):
            return np.zeros((2000, 1000, 3), dtype=np.uint8)  # 비정규 입력
        @staticmethod
        def resize(crop, size, interpolation=0):
            captured["size"] = size
            return np.zeros((size[1], size[0], 3), dtype=np.uint8)
        @staticmethod
        def imwrite(p, img):
            captured["written_shape"] = img.shape
            return True

    monkeypatch.setattr(face_source, "cv2", FakeCv2())
    import image_normalize
    monkeypatch.setattr(image_normalize, "cv2", FakeCv2())

    lmk = np.array([[400, 800], [600, 1000]], dtype=np.float32)
    out = face_source.load_image_source(
        "x.jpg", str(tmp_path), 9999, detect_lmk_fn=lambda b: lmk)
    assert out["mode"] == "single"
    assert captured["written_shape"] == (1024, 576, 3)  # 정규화된 576×1024(9:16) 저장


def test_load_image_source_skips_when_toggle_off(tmp_path, monkeypatch):
    monkeypatch.setenv("FIFTH_INPUT_NORMALIZE", "0")
    captured = {}

    class FakeCv2:
        @staticmethod
        def imread(p):
            return np.zeros((2000, 1000, 3), dtype=np.uint8)
        @staticmethod
        def imwrite(p, img):
            captured["written_shape"] = img.shape
            return True

    monkeypatch.setattr(face_source, "cv2", FakeCv2())
    face_source.load_image_source(
        "x.jpg", str(tmp_path), 8888, detect_lmk_fn=lambda b: None)
    assert captured["written_shape"] == (2000, 1000, 3)  # 원본 그대로(회귀)
