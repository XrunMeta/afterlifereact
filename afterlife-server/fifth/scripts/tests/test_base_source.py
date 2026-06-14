import numpy as np
from base_source import base_blend_weight

def test_silence_picks_closed():
    assert base_blend_weight(0.0, closed_thresh=0.1, open_thresh=0.4) == 0.0

def test_loud_picks_open():
    assert base_blend_weight(0.9, closed_thresh=0.1, open_thresh=0.4) == 1.0

def test_mid_blends_linearly():
    w = base_blend_weight(0.25, closed_thresh=0.1, open_thresh=0.4)
    assert abs(w - 0.5) < 1e-6  # (0.25-0.1)/(0.4-0.1)=0.5

def test_clamped_0_1():
    assert base_blend_weight(0.05, closed_thresh=0.1, open_thresh=0.4) == 0.0
    assert base_blend_weight(1.0, closed_thresh=0.1, open_thresh=0.4) == 1.0
