import numpy as np, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import idle as _idle_mod
from idle import _select_idle_frame, _dummy_rgb_frame, get_idle_frames  # noqa: E402


# ── get_idle_frames 캐시 테스트 ───────────────────────────────────────
def setup_function(function):
    """각 테스트 전 모듈 레벨 캐시 리셋."""
    _idle_mod._IDLE_CACHE = None


def test_get_idle_frames_empty_path_returns_empty():
    """path가 빈 문자열이면 빈 리스트 반환."""
    frames = get_idle_frames("")
    assert frames == []


def test_get_idle_frames_invalid_path_returns_empty():
    """존재하지 않는 path면 빈 리스트 반환 (예외 미전파)."""
    frames = get_idle_frames("/nonexistent/path/idle.mp4")
    assert frames == []


def test_get_idle_frames_caches_result():
    """2회 호출 시 같은 객체 반환 (재로드 없음). 잘못된 path로도 캐시."""
    f1 = get_idle_frames("/nonexistent/idle.mp4")
    f2 = get_idle_frames("/nonexistent/idle.mp4")
    assert f1 is f2


def test_get_idle_frames_cache_is_not_none_after_call():
    """빈 path 호출 후에도 _IDLE_CACHE가 None이 아니어야 함 ([] 캐시)."""
    get_idle_frames("")
    assert _idle_mod._IDLE_CACHE is not None


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
