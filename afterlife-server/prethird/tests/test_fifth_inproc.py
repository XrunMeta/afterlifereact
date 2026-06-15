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


def test_load_then_infer_streams_frames(tmp_path):
    """load() prewarm + infer() 흐름.

    _prepare 오버라이드는 prewarm(load 내부)과 캐시 miss 시 infer 양쪽에서 호출됨.
    prewarm이 _sources_cache에 넣으므로 이후 동일 video_path infer는 캐시 hit.
    """
    video_path = str(tmp_path / "idle.mp4")
    # prewarm path.exists() 체크 통과용 빈 파일 생성
    pathlib.Path(video_path).touch()

    f = FifthInproc(video_path=video_path, clone_id=7, cache_root=str(tmp_path))

    # GPU 의존 훅 전부 오버라이드
    f._load_config = lambda: object()
    f._build_engine = lambda: "ENG"
    f._build_jp = lambda: "JP"

    prepare_calls = []

    def fake_prepare(eng, clone_key, vp):
        prepare_calls.append(vp)
        return {"mode": "single", "open_s": {}}

    f._prepare = fake_prepare

    def fake_stream(eng, jp, cfg, sources, wav, on_frame, blink_enabled):
        for _ in range(5):
            on_frame(np.zeros((512, 512, 3), np.uint8))
        return 5

    f._stream = fake_stream

    f.load()
    # prewarm이 _prepare 호출했어야 함
    assert len(prepare_calls) == 1

    got = []
    n = f.infer("/s.wav", on_frame=got.append)
    assert n == 5 == len(got)
    # 동일 video_path는 캐시 hit → _prepare 추가 호출 없음
    assert len(prepare_calls) == 1


def test_infer_signature_matches_musetalk():
    import inspect
    sig = inspect.signature(FifthInproc.infer)
    params = list(sig.parameters)
    assert params[:4] == ["self", "wav_path", "on_frame", "video_path"]


def test_infer_different_video_paths_prepare_per_clone(tmp_path):
    """다른 video_path로 infer 시 클론별 _prepare 호출 검증.

    - 같은 video_path 2회 infer → _prepare 1회(캐시 hit).
    - 다른 video_path infer → _prepare 추가 1회.
    """
    vp_a = str(tmp_path / "cloneA.mp4")
    vp_b = str(tmp_path / "cloneB.mp4")
    pathlib.Path(vp_a).touch()
    pathlib.Path(vp_b).touch()

    f = FifthInproc(video_path=vp_a, clone_id=10, cache_root=str(tmp_path))
    f._load_config = lambda: object()
    f._build_engine = lambda: "ENG"
    f._build_jp = lambda: "JP"

    prepare_calls = []

    def fake_prepare(eng, clone_key, vp):
        prepare_calls.append(vp)
        return {"mode": "single", "open_s": {}, "vp": vp}

    f._prepare = fake_prepare

    def fake_stream(eng, jp, cfg, sources, wav, on_frame, blink_enabled):
        on_frame(np.zeros((1, 1, 3), np.uint8))
        return 1

    f._stream = fake_stream

    f.load()
    # prewarm: vp_a 1회
    assert prepare_calls == [vp_a]

    # 같은 vp_a 두 번 infer → 캐시 hit, _prepare 추가 호출 없음
    f.infer("/s.wav", on_frame=lambda x: None, video_path=vp_a)
    f.infer("/s.wav", on_frame=lambda x: None, video_path=vp_a)
    assert prepare_calls == [vp_a]

    # 다른 vp_b infer → 캐시 miss, _prepare 추가 호출
    f.infer("/s.wav", on_frame=lambda x: None, video_path=vp_b)
    assert prepare_calls == [vp_a, vp_b]

    # vp_b 한 번 더 infer → 캐시 hit
    f.infer("/s.wav", on_frame=lambda x: None, video_path=vp_b)
    assert prepare_calls == [vp_a, vp_b]


def test_load_idempotent(tmp_path):
    """load() 2회 호출 시 _build_engine 1회만 호출(멱등성)."""
    video_path = str(tmp_path / "idle.mp4")
    pathlib.Path(video_path).touch()

    f = FifthInproc(video_path=video_path, clone_id=5, cache_root=str(tmp_path))
    f._load_config = lambda: object()
    f._build_jp = lambda: "JP"
    f._prepare = lambda eng, key, vp: {"mode": "single", "open_s": {}}

    build_engine_calls = []

    def fake_build_engine():
        build_engine_calls.append(1)
        return "ENG"

    f._build_engine = fake_build_engine

    f.load()
    f.load()  # 두 번째 호출 — _loaded=True 이므로 즉시 return

    assert len(build_engine_calls) == 1


def test_prepare_raises_without_detect_landmarks():
    """detect_landmarks 없는 eng로 _prepare 호출 시 NotImplementedError."""
    f = FifthInproc(video_path="/idle.mp4", clone_id=1, cache_root="/tmp/x")

    class FakeEng:
        """detect_landmarks 미구현 엔진(Task5 이전 상태 시뮬)."""
        pass

    with pytest.raises(NotImplementedError, match="detect_landmarks"):
        # _prepare는 GPU import 직전에 guard를 타므로
        # sys.path에 FIFTH_SCRIPTS_DIR이 없어도 guard에서 먼저 raise
        f._prepare(FakeEng(), "key1", "/idle.mp4")
