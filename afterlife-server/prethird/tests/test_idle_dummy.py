"""test_idle_dummy.py — dummy 프레임이 config WIDTH/HEIGHT 를 추종하는지 검증.

Task 5 (T-078): PRETHIRD_WIDTH/HEIGHT env 설정 시 _dummy_rgb_frame 이
그 크기로 캔버스를 생성해야 한다 (하드코딩 640×480 금지).
idle.py 는 모듈 상단에서 `from config import WIDTH, HEIGHT` 를 수행하므로
importlib.reload 로 env 변경을 반영한다.
"""
import os
import sys
import pathlib
import importlib

import pytest

# scripts 경로 확보
_SCRIPTS = str(pathlib.Path(__file__).resolve().parents[1] / "scripts")
if _SCRIPTS not in sys.path:
    sys.path.insert(0, _SCRIPTS)


def test_dummy_frame_follows_config(monkeypatch):
    """PRETHIRD_WIDTH=512 / PRETHIRD_HEIGHT=1024 설정 시 dummy frame 이 512×1024 여야 한다."""
    monkeypatch.setenv("PRETHIRD_WIDTH", "512")
    monkeypatch.setenv("PRETHIRD_HEIGHT", "1024")

    import config
    import idle
    importlib.reload(config)
    importlib.reload(idle)

    frame = idle._dummy_rgb_frame(0.0)
    assert frame.shape[0] == 1024 and frame.shape[1] == 512, (
        f"dummy frame shape {frame.shape} != (1024, 512, 3). "
        "_dummy_rgb_frame 이 config WIDTH/HEIGHT 를 따르지 않습니다."
    )
    assert frame.shape[2] == 3
