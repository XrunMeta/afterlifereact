"""tests/test_fifth_inproc_render_mode.py — FifthInproc._build_body render_mode 전달 (T-113 Task2).

_build_body 는 인스턴스 메서드이므로 FifthInproc 인스턴스를 통해 호출한다.
render_mode=None(기본)이면 body 에 키 자체가 생략돼야 fifth 렌더서버가
env(FIFTH_RENDER_MODE) fallback 을 탄다 — 회귀 0 요구사항의 핵심.
"""
from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from fifth_inproc import FifthInproc  # noqa: E402

def test_build_body_includes_render_mode():
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    b = f._build_body("/w.wav", "/v.mp4", render_mode="batch")
    assert b["render_mode"] == "batch"

def test_build_body_omits_render_mode_when_none():
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    b = f._build_body("/w.wav", "/v.mp4", render_mode=None)
    assert "render_mode" not in b

def test_build_body_omits_render_mode_when_default_arg():
    """render_mode 인자 자체를 생략해도(기본값 None) 회귀 없이 키 없음."""
    f = FifthInproc(video_path="/idle.mp4", render_url="http://x")
    b = f._build_body("/w.wav", "/v.mp4")
    assert "render_mode" not in b
    assert b == {"wav_path": "/w.wav", "video_path": "/v.mp4"}
