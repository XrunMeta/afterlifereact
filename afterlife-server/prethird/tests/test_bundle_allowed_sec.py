"""tests/test_bundle_allowed_sec.py — T-167 bundle allowedSec 파싱.

fail-closed — 필드가 없거나 이상하면 0(통화 불가)이다.
무제한으로 열어두면 그게 과금 우회 구멍이 된다.

단, 실제 통화 거부는 `PRETHIRD_CREDIT_ENFORCED` 게이트 뒤에 둔다.
트랙 A(서버)가 allowedSec 를 내려주기 전에 이 코드를 배포하면
모든 통화가 거부되기 때문이다(배포 순서 안전장치).
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import signaling  # noqa: E402
from signaling import _extract_allowed_sec, _credit_enforced  # noqa: E402


def test_reads_allowed_sec():
    assert _extract_allowed_sec({"allowedSec": 600}) == 600


def test_missing_field_is_zero_not_unlimited():
    """fail-closed — 필드가 없으면 무제한이 아니라 0(통화 불가)이다."""
    assert _extract_allowed_sec({}) == 0
    assert _extract_allowed_sec(None) == 0


def test_negative_and_garbage_clamp_to_zero():
    assert _extract_allowed_sec({"allowedSec": -10}) == 0
    assert _extract_allowed_sec({"allowedSec": "abc"}) == 0
    assert _extract_allowed_sec({"allowedSec": None}) == 0


def test_numeric_string_is_accepted():
    """JSON 이 문자열로 내려와도 받아들인다."""
    assert _extract_allowed_sec({"allowedSec": "600"}) == 600


def test_float_truncates_down():
    """10초 내림 규약과 같은 방향 — 올림하면 과금하지 않은 시간을 준다."""
    assert _extract_allowed_sec({"allowedSec": 600.9}) == 600


def test_enforcement_defaults_off(monkeypatch):
    """기본 off — 트랙 A 배포 전에 통화가 전면 차단되면 안 된다."""
    monkeypatch.delenv("PRETHIRD_CREDIT_ENFORCED", raising=False)
    assert _credit_enforced() is False


def test_enforcement_reads_env_at_call_time(monkeypatch):
    """프로세스 시작 후에도 env 재평가 — 기존 게이트 관례와 동일."""
    monkeypatch.setenv("PRETHIRD_CREDIT_ENFORCED", "1")
    assert _credit_enforced() is True
    monkeypatch.setenv("PRETHIRD_CREDIT_ENFORCED", "0")
    assert _credit_enforced() is False


def test_session_has_credit_fields():
    """세션이 과금 필드를 기본값으로 들고 있어야 한다."""
    from session import Session
    s = Session("aabbccddeeff")
    assert s.allowed_sec == 0
    assert s.credit_guard is None
    assert s.max_end_at_ms == 0
