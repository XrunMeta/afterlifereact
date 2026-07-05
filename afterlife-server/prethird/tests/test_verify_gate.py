"""test_verify_gate — /oth-path 데이터 라우트 비밀번호 게이트(_check_verify_pass)."""
import os
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from chat_endpoint import _check_verify_pass  # noqa: E402


class _Req:
    def __init__(self, headers): self.headers = headers


def test_게이트_미설정이면_통과(monkeypatch):
    monkeypatch.delenv("PRETHIRD_VERIFY_PASSWORD", raising=False)
    assert _check_verify_pass(_Req({})) is True


def test_게이트_설정_불일치면_거부(monkeypatch):
    monkeypatch.setenv("PRETHIRD_VERIFY_PASSWORD", "s3cret")
    assert _check_verify_pass(_Req({"X-Verify-Pass": "wrong"})) is False
    assert _check_verify_pass(_Req({})) is False


def test_게이트_설정_일치면_통과(monkeypatch):
    monkeypatch.setenv("PRETHIRD_VERIFY_PASSWORD", "s3cret")
    assert _check_verify_pass(_Req({"X-Verify-Pass": "s3cret"})) is True
