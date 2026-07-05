"""tests/test_idle_source_mode.py — IDLE_SOURCE_MODE 게이트 순수함수 TDD (T-111 Task9)

idle_policy.clone_mp4_enabled / prebake_enabled 는 aiortc 등 무거운 의존성 없이
os.environ 만 참조하는 순수함수 — 단위테스트로 직접 검증한다.
기본값 auto 는 두 소스 모두 활성 = 현행(회귀0) 동작을 보존해야 한다.
"""
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))

from idle_policy import clone_mp4_enabled, prebake_enabled  # noqa: E402


def test_auto_enables_all(monkeypatch):
    monkeypatch.delenv("IDLE_SOURCE_MODE", raising=False)
    assert clone_mp4_enabled() and prebake_enabled()


def test_clone_mp4_only(monkeypatch):
    monkeypatch.setenv("IDLE_SOURCE_MODE", "clone_mp4")
    assert clone_mp4_enabled() and not prebake_enabled()


def test_prebake_only(monkeypatch):
    monkeypatch.setenv("IDLE_SOURCE_MODE", "prebake")
    assert prebake_enabled() and not clone_mp4_enabled()


def test_fallback_disables_both(monkeypatch):
    monkeypatch.setenv("IDLE_SOURCE_MODE", "fallback")
    assert not clone_mp4_enabled() and not prebake_enabled()
