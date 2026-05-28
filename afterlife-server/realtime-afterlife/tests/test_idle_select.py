import sys, os
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from publisher import _select_idle_frame  # noqa: E402


def _frames(n):
    return [np.full((2, 2, 3), i, dtype=np.uint8) for i in range(n)]


def test_grace_미경과_시_last_frame_hold():
    last = np.zeros((2, 2, 3), dtype=np.uint8)
    idle = _frames(3)
    # now-last_real_ts = 0.1 < grace 0.5 → hold(last), idle_t0=0
    frame, t0 = _select_idle_frame(now=100.1, last_real_ts=100.0, grace=0.5,
                                   idle_frames=idle, idle_t0=0.0, last_frame=last, fps=25)
    assert np.array_equal(frame, last)
    assert t0 == 0.0


def test_grace_경과_시_idle_루프_진입():
    last = np.zeros((2, 2, 3), dtype=np.uint8)
    idle = _frames(3)
    # gap=1.0 >= grace → idle 첫 진입: idle_t0=now 고정, idx 0
    frame, t0 = _select_idle_frame(now=101.0, last_real_ts=100.0, grace=0.5,
                                   idle_frames=idle, idle_t0=0.0, last_frame=last, fps=25)
    assert t0 == 101.0
    assert np.array_equal(frame, idle[0])


def test_idle_frames_없으면_hold():
    last = np.full((2, 2, 3), 9, dtype=np.uint8)
    frame, t0 = _select_idle_frame(now=200.0, last_real_ts=100.0, grace=0.5,
                                   idle_frames=[], idle_t0=0.0, last_frame=last, fps=25)
    assert np.array_equal(frame, last)
    assert t0 == 0.0


def test_idle_루프_인덱스_시간기반_진행():
    last = np.zeros((2, 2, 3), dtype=np.uint8)
    idle = _frames(3)
    # t0=100, now=100.08 → idx=int(0.08*25)=2
    frame, t0 = _select_idle_frame(now=100.08, last_real_ts=0.0, grace=0.5,
                                   idle_frames=idle, idle_t0=100.0, last_frame=last, fps=25)
    assert t0 == 100.0
    assert np.array_equal(frame, idle[2])
