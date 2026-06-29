"""blink 위상의 경계값/엣지 케이스 추가 검증."""
from __future__ import annotations

import math
import numpy as np
import soundfile as sf
import pytest

from config import FifthConfig
from render_offline import make_blink_sequence


def _blink_arr_to_float(seq: list) -> np.ndarray:
    """make_blink_sequence 반환 → float array."""
    return np.array([float(x[0, 0]) for x in seq], dtype=np.float64)


def test_blink_edge_case_boundary_crossing():
    """blink가 청크 경계(프레임 25)에 정확히 걸치는 경우."""
    from render_offline import make_blink_sequence
    fps = 25.0
    eye_open = 0.37
    n_total = 50
    n_half = 25

    # blink_dur_frames=6이므로, avg_interval을 23으로 조정하면 첫 blink가 23~28 근처에서 시작
    kwargs = dict(avg_interval_sec=23.0/fps, blink_dur_frames=6)

    whole = make_blink_sequence(n_total, fps, eye_open, 0.0, **kwargs)
    a = make_blink_sequence(n_half, fps, eye_open, 0.0, phase_offset=0, **kwargs)
    b = make_blink_sequence(n_half, fps, eye_open, 0.0, phase_offset=n_half, **kwargs)

    whole_arr = _blink_arr_to_float(whole)
    ab_arr = np.concatenate([_blink_arr_to_float(a), _blink_arr_to_float(b)])

    max_diff = np.max(np.abs(ab_arr - whole_arr))
    assert np.allclose(ab_arr, whole_arr, atol=1e-4), (
        f"blink 경계 crossing FAIL: max_diff={max_diff:.8f}"
    )


def test_blink_edge_case_very_large_phase_offset():
    """phase_offset >> n_frames (매우 큰 지연)인 경우."""
    fps = 25.0
    eye_open = 0.37
    n_small = 20
    phase_large = 1000

    whole = make_blink_sequence(n_small + phase_large, fps, eye_open, 0.0,
                                avg_interval_sec=1.0, blink_dur_frames=6)
    delayed = make_blink_sequence(n_small, fps, eye_open, 0.0,
                                  phase_offset=phase_large,
                                  avg_interval_sec=1.0, blink_dur_frames=6)

    whole_arr = _blink_arr_to_float(whole)
    delayed_arr = _blink_arr_to_float(delayed)
    expected = whole_arr[phase_large:phase_large + n_small]

    assert np.allclose(delayed_arr, expected, atol=1e-4), (
        f"large phase_offset FAIL: max_diff={np.max(np.abs(delayed_arr - expected)):.8f}"
    )


def test_blink_edge_case_multiple_boundaries():
    """blink가 여러 청크 경계를 넘는 경우 (6청크)."""
    fps = 25.0
    eye_open = 0.37
    n_chunk = 10
    n_total = 60
    kwargs = dict(avg_interval_sec=10.0/fps, blink_dur_frames=8)

    whole = make_blink_sequence(n_total, fps, eye_open, 0.0, **kwargs)
    chunks = [
        make_blink_sequence(n_chunk, fps, eye_open, 0.0, phase_offset=i*n_chunk, **kwargs)
        for i in range(6)
    ]

    whole_arr = _blink_arr_to_float(whole)
    concat_arr = np.concatenate([_blink_arr_to_float(c) for c in chunks])

    assert np.allclose(concat_arr, whole_arr, atol=1e-4), (
        f"multiple boundaries FAIL: max_diff={np.max(np.abs(concat_arr - whole_arr)):.8f}"
    )


def test_blink_edge_case_single_frame_chunks():
    """극단적 경우: 1프레임 청크씩 (청크 수 = 총 프레임)."""
    fps = 25.0
    eye_open = 0.37
    n_total = 50
    kwargs = dict(avg_interval_sec=1.0, blink_dur_frames=6)

    whole = make_blink_sequence(n_total, fps, eye_open, 0.0, **kwargs)
    chunks = [
        make_blink_sequence(1, fps, eye_open, 0.0, phase_offset=i, **kwargs)
        for i in range(n_total)
    ]

    whole_arr = _blink_arr_to_float(whole)
    concat_arr = np.concatenate([_blink_arr_to_float(c) for c in chunks])

    max_diff = np.max(np.abs(concat_arr - whole_arr))
    assert np.allclose(concat_arr, whole_arr, atol=1e-4), (
        f"1-frame chunks FAIL: max_diff={max_diff:.8f}"
    )


def test_blink_phase_offset_respects_global_timeline():
    """phase_offset이 전역 타임라인을 올바르게 생성하는지 (blink_starts 계산 검증)."""
    fps = 25.0
    eye_open = 0.37

    # 작은 평균 interval로 강제로 blink 여러 개 생성
    kwargs = dict(avg_interval_sec=0.8, blink_dur_frames=4)

    # 100프레임 전체
    whole = make_blink_sequence(100, fps, eye_open, 0.0, **kwargs)
    whole_arr = _blink_arr_to_float(whole)

    # 25프레임씩 4청크
    chunks = [
        make_blink_sequence(25, fps, eye_open, 0.0, phase_offset=i*25, **kwargs)
        for i in range(4)
    ]
    concat_arr = np.concatenate([_blink_arr_to_float(c) for c in chunks])

    # 일치 확인
    assert np.allclose(concat_arr, whole_arr, atol=1e-4), (
        f"global timeline FAIL: max_diff={np.max(np.abs(concat_arr - whole_arr)):.8f}"
    )

    # blink 위치 실제 일치 검증 (아주 작은 차이도 없어야 함)
    blink_frames_whole = set(np.where(whole_arr < (eye_open - 0.01))[0])
    blink_frames_concat = set(np.where(concat_arr < (eye_open - 0.01))[0])
    assert blink_frames_whole == blink_frames_concat, (
        f"blink frame positions differ: whole={blink_frames_whole} vs concat={blink_frames_concat}"
    )
