"""T-088 라운드4: _decode_mp4_default 비율 보존 테스트.

배경: fifth /render 는 paste-back 으로 소스 사진 비율을 유지해 filler mp4 가
세로(예: 576×1024)인데, 구 디코더가 512×512 로 강제 resize 해 통화 화면에서
찌그러진 정사각으로 송출됐다(히즈키 실통화 보고). 디코더는 원본 프레임
크기를 그대로 보존해야 한다 — 스케일/비율 처리는 렌더·클라이언트 몫.

PyAV 로 실제 mp4 를 만들어 디코더를 실코덱 경로로 태운다(모킹 은폐 방지,
F8 파서 교훈과 동일).
"""
from __future__ import annotations

import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(__file__))

from filler_player import _decode_mp4_default  # noqa: E402

av = pytest.importorskip("av")


def _make_mp4(path: str, width: int, height: int, n_frames: int = 5) -> None:
    """단색 그라데이션 프레임 n개짜리 무음 mp4 생성 (yuv420p, 25fps)."""
    container = av.open(path, mode="w")
    stream = container.add_stream("libx264", rate=25)
    stream.width = width
    stream.height = height
    stream.pix_fmt = "yuv420p"
    for i in range(n_frames):
        arr = np.full((height, width, 3), fill_value=(i * 40) % 255, dtype=np.uint8)
        frame = av.VideoFrame.from_ndarray(arr, format="rgb24")
        for packet in stream.encode(frame):
            container.mux(packet)
    for packet in stream.encode():
        container.mux(packet)
    container.close()


def test_decode_preserves_portrait_aspect(tmp_path):
    """세로(9:16류) mp4 → 프레임이 원본 크기 그대로 (512×512 강제 resize 금지)."""
    p = str(tmp_path / "portrait.mp4")
    _make_mp4(p, width=64, height=128)

    frames, _pcm = _decode_mp4_default(p)

    assert len(frames) > 0
    h, w = frames[0].shape[:2]
    assert (w, h) == (64, 128), f"원본 비율 훼손: {w}×{h} (expected 64×128)"


def test_decode_square_still_works(tmp_path):
    """정사각 mp4 도 원본 크기 그대로 (회귀 확인)."""
    p = str(tmp_path / "square.mp4")
    _make_mp4(p, width=64, height=64)

    frames, _pcm = _decode_mp4_default(p)

    assert len(frames) > 0
    h, w = frames[0].shape[:2]
    assert (w, h) == (64, 64)
