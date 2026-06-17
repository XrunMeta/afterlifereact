import numpy as np, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import idle as _idle_mod
from idle import _select_idle_frame, _dummy_rgb_frame, get_idle_frames  # noqa: E402


# ── 캐시 리셋 ─────────────────────────────────────────────────────────
def setup_function(function):
    """각 테스트 전 모듈 레벨 캐시 리셋 (단일 + dict 모두)."""
    _idle_mod._IDLE_CACHE = None
    _idle_mod._IDLE_CACHE_DICT.clear()


# ── get_idle_frames 기존 캐시 테스트 ─────────────────────────────────
def test_get_idle_frames_empty_path_returns_empty():
    """path가 빈 문자열이면 빈 리스트 반환."""
    frames = get_idle_frames("")
    assert frames == []


def test_get_idle_frames_invalid_path_returns_empty():
    """존재하지 않는 path면 빈 리스트 반환 (예외 미전파)."""
    frames = get_idle_frames("/nonexistent/path/idle.mp4")
    assert frames == []


def test_get_idle_frames_caches_result():
    """같은 path 2회 호출 시 같은 객체 반환 (재로드 없음). 잘못된 path로도 캐시."""
    f1 = get_idle_frames("/nonexistent/idle.mp4")
    f2 = get_idle_frames("/nonexistent/idle.mp4")
    assert f1 is f2


def test_get_idle_frames_cache_is_not_none_after_call():
    """빈 path 호출 후에도 _IDLE_CACHE가 None이 아니어야 함 ([] 캐시)."""
    get_idle_frames("")
    assert _idle_mod._IDLE_CACHE is not None


# ── per-clone dict 캐시 신규 테스트 ──────────────────────────────────
def test_get_idle_frames_two_different_paths_independent():
    """다른 path 2개는 독립된 캐시 항목을 가진다."""
    f_a = get_idle_frames("/nonexistent/clone_a.mp4")
    f_b = get_idle_frames("/nonexistent/clone_b.mp4")
    # 둘 다 빈 리스트지만 서로 다른 객체 (dict 별도 항목)
    assert "/nonexistent/clone_a.mp4" in _idle_mod._IDLE_CACHE_DICT
    assert "/nonexistent/clone_b.mp4" in _idle_mod._IDLE_CACHE_DICT
    # 각각 독립 항목: a 지우면 b 안 사라짐
    del _idle_mod._IDLE_CACHE_DICT["/nonexistent/clone_a.mp4"]
    assert "/nonexistent/clone_b.mp4" in _idle_mod._IDLE_CACHE_DICT
    _ = f_a, f_b  # noqa: F841


def test_get_idle_frames_same_path_no_reload():
    """같은 path 2회 호출 시 dict 항목이 1개만 존재하고, 같은 객체 반환."""
    path = "/nonexistent/same.mp4"
    f1 = get_idle_frames(path)
    f2 = get_idle_frames(path)
    assert f1 is f2
    assert list(_idle_mod._IDLE_CACHE_DICT.keys()).count(path) == 1


def test_get_idle_frames_dict_cache_populated():
    """호출 후 _IDLE_CACHE_DICT에 key가 존재한다."""
    get_idle_frames("/nonexistent/check.mp4")
    assert "/nonexistent/check.mp4" in _idle_mod._IDLE_CACHE_DICT


# ── 기존 테스트 ───────────────────────────────────────────────────────
def test_dummy_frame_shape():
    arr = _dummy_rgb_frame(3.0)
    assert arr.shape == (480, 640, 3) and arr.dtype == np.uint8

def test_idle_hold_before_grace():
    last = np.ones((4, 4, 3), dtype=np.uint8)
    idle_frames = [np.zeros((4, 4, 3), dtype=np.uint8)]
    frame, t0 = _select_idle_frame(100.1, 100.0, 0.5, idle_frames, 0.0, last)
    assert t0 == 0.0 and np.array_equal(frame, last)

def test_idle_enters_after_grace():
    last = np.ones((4, 4, 3), dtype=np.uint8)
    idle_frames = [np.zeros((4, 4, 3), dtype=np.uint8), np.full((4, 4, 3), 7, np.uint8)]
    frame, t0 = _select_idle_frame(101.0, 100.0, 0.5, idle_frames, 0.0, last)
    assert t0 == 101.0 and np.array_equal(frame, idle_frames[0])


def test_blend_frames_interpolates():
    from idle import _blend_frames
    import numpy as np
    a = np.zeros((4, 4, 3), dtype=np.uint8)
    b = np.full((4, 4, 3), 200, dtype=np.uint8)
    assert int(_blend_frames(a, b, 0.0)[0, 0, 0]) == 0
    assert int(_blend_frames(a, b, 1.0)[0, 0, 0]) == 200
    assert 90 <= int(_blend_frames(a, b, 0.5)[0, 0, 0]) <= 110


def test_blend_frames_shape_mismatch_returns_b():
    from idle import _blend_frames
    import numpy as np
    a = np.zeros((4, 4, 3), dtype=np.uint8)
    b = np.full((8, 8, 3), 200, dtype=np.uint8)
    assert np.array_equal(_blend_frames(a, b, 0.5), b)
