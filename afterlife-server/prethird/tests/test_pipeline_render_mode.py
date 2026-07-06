"""tests/test_pipeline_render_mode.py — pipeline._resolve_render_mode (T-113 Task4).

host env PRETHIRD_RENDER_MODE 를 읽어 {"partial","batch"} 화이트리스트로 정규화한다.
미설정/기본은 "partial". 화이트리스트 외 값은 "partial" 폴백(+log.warning).
DialoguePipeline.__init__ 에서 self._render_mode 로 보관되는 스캐폴드 자체는
Task4 목표(분기 진입점)이며 partial 경로 동작은 100% 무변경이어야 한다.
"""
from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from pipeline import _resolve_render_mode  # noqa: E402


def test_render_mode_default_partial(monkeypatch):
    monkeypatch.delenv("PRETHIRD_RENDER_MODE", raising=False)
    assert _resolve_render_mode() == "partial"


def test_render_mode_batch(monkeypatch):
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "batch")
    assert _resolve_render_mode() == "batch"


def test_render_mode_invalid_falls_back_partial(monkeypatch):
    monkeypatch.setenv("PRETHIRD_RENDER_MODE", "bogus")
    assert _resolve_render_mode() == "partial"
