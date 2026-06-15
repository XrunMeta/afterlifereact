"""tests/test_fifth_inproc.py — FifthInproc 계약 단위 테스트.

GPU·fifth 렌더 코어 없이 메서드 훅(_build_engine/_build_jp/_prepare/_stream/_load_config)
오버라이드로 계약(load 전 infer 차단, load 후 프레임수 반환·콜백, 시그니처)을 검증한다.
"""
from __future__ import annotations

import pathlib
import sys

import numpy as np
import pytest

# prethird scripts 를 sys.path 에 추가 (musetalk_inproc.py 와 동일 패턴)
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from fifth_inproc import FifthInproc  # noqa: E402


def test_infer_before_load_raises():
    f = FifthInproc(video_path="/idle.mp4", clone_id=1, cache_root="/tmp/x")
    with pytest.raises(RuntimeError, match="load"):
        f.infer("/s.wav", on_frame=lambda x: None)


def test_load_then_infer_streams_frames(tmp_path, monkeypatch):
    f = FifthInproc(video_path="/idle.mp4", clone_id=7, cache_root=str(tmp_path))

    # GPU 의존 훅 전부 오버라이드
    f._load_config = lambda: object()  # FifthConfig.from_env() 대체
    f._build_engine = lambda: "ENG"
    f._build_jp = lambda: "JP"
    f._prepare = lambda eng, cid, vp: {"mode": "single", "open_s": {}}

    def fake_stream(eng, jp, cfg, sources, wav, on_frame, blink_enabled):
        for _ in range(5):
            on_frame(np.zeros((512, 512, 3), np.uint8))
        return 5

    f._stream = fake_stream

    f.load()
    got = []
    n = f.infer("/s.wav", on_frame=got.append)
    assert n == 5 == len(got)


def test_infer_signature_matches_musetalk():
    import inspect
    sig = inspect.signature(FifthInproc.infer)
    params = list(sig.parameters)
    assert params[:4] == ["self", "wav_path", "on_frame", "video_path"]
