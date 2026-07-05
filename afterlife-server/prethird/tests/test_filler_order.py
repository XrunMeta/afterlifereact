"""tests/test_filler_order.py — PRETHIRD_FILLER_ORDER 게이트 순수함수 TDD (T-111 Task10)"""
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from idle_policy import filler_order_pre_speak  # noqa: E402


def test_default_pre_speak(monkeypatch):
    monkeypatch.delenv("PRETHIRD_FILLER_ORDER", raising=False)
    assert filler_order_pre_speak() is True


def test_off(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FILLER_ORDER", "off")
    assert filler_order_pre_speak() is False
