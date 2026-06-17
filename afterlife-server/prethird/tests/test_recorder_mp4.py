"""test_recorder_mp4.py — PRETHIRD_RECORD_MP4 env 게이트 + answer.mp4 인코딩 테스트.

reload 격리 전략:
  - 각 테스트 시작 전 recorder 모듈의 원본 참조를 저장.
  - 테스트 종료 후 env를 제거하고 다시 reload해 sys.modules["recorder"]를 원상복구.
  - test_recorder.py 는 모듈 레벨에서 from recorder import CallRecorder 를 했으므로
    그 심볼도 최신 모듈의 클래스로 재주입한다.
"""
import importlib
import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

# test_recorder.py 모듈 이름 (pytest 가 수집 후 sys.modules 에 들어감)
_RECORDER_TEST_MODULE = "tests.test_recorder"


def _resync_recorder_symbols():
    """sys.modules["recorder"] 의 최신 클래스를 test_recorder 심볼에 재주입."""
    import recorder as _rec
    tr = sys.modules.get(_RECORDER_TEST_MODULE)
    if tr is None:
        # "test_recorder" 단일 키로도 잡힐 수 있음
        for k in list(sys.modules):
            if k.endswith("test_recorder"):
                tr = sys.modules[k]
                break
    if tr is not None:
        tr.CallRecorder = _rec.CallRecorder
        tr.NullRecorder = _rec.NullRecorder
        tr.make_recorder = _rec.make_recorder


@pytest.fixture(autouse=True)
def _isolate_recorder_env(monkeypatch):
    """테스트마다 recorder 모듈을 env 기반으로 reload 하되,
    teardown 시 env=unset 상태로 복원해 다른 테스트 오염 방지."""
    yield
    # teardown: env 제거 후 reload → 원래 off 상태로 복원
    os.environ.pop("PRETHIRD_RECORD_MP4", None)
    import recorder
    importlib.reload(recorder)
    _resync_recorder_symbols()


def test_mp4_gated_off_by_default(tmp_path, monkeypatch):
    monkeypatch.delenv("PRETHIRD_RECORD_MP4", raising=False)
    import recorder
    importlib.reload(recorder)
    _resync_recorder_symbols()
    rec = recorder.make_recorder(9051, "sX", root=str(tmp_path))
    turn = rec.begin_turn("say", "hi", seq=1)
    turn.append_frames([np.zeros((32, 32, 3), np.uint8)] * 10)
    turn.append_token("x")
    turn.finalize(se_present=True)
    clone_dir = tmp_path / "9051"
    assert not any(p.name.endswith("-answer.mp4") for p in clone_dir.iterdir())


def test_mp4_off_does_not_accumulate_frames(tmp_path, monkeypatch):
    # off일 때 프레임 누적 자체를 안 해 RAM 비용 0
    monkeypatch.delenv("PRETHIRD_RECORD_MP4", raising=False)
    import recorder
    importlib.reload(recorder)
    _resync_recorder_symbols()
    rec = recorder.make_recorder(9051, "sX", root=str(tmp_path))
    turn = rec.begin_turn("say", "hi", seq=1)
    turn.append_frames([np.zeros((8, 8, 3), np.uint8)] * 5)
    assert turn._frames == []  # 누적 안 함


def test_mp4_written_when_enabled(tmp_path, monkeypatch):
    monkeypatch.setenv("PRETHIRD_RECORD_MP4", "1")
    import recorder
    importlib.reload(recorder)
    _resync_recorder_symbols()
    try:
        import imageio  # noqa
        import imageio_ffmpeg  # noqa
    except ImportError:
        pytest.skip("imageio/imageio-ffmpeg 미설치 — 인코딩 테스트 skip")
    rec = recorder.make_recorder(9051, "sX", root=str(tmp_path))
    turn = rec.begin_turn("say", "hi", seq=1)
    turn.append_frames([np.zeros((64, 64, 3), np.uint8) for _ in range(10)], fps=25)
    turn.append_token("x")
    turn.finalize(se_present=True)
    clone_dir = tmp_path / "9051"
    assert any(p.name.endswith("-answer.mp4") for p in clone_dir.iterdir())
