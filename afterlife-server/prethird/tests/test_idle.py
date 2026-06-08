import numpy as np, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from idle import _select_idle_frame, _dummy_rgb_frame  # noqa: E402

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
