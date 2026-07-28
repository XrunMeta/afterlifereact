"""tests/test_credit_guard_teardown.py — T-167 종료 시 가드 정리·게이트 분리.

🔴 call_end 는 트랙 A 의 정산을 트리거한다. 이 호출이
PRETHIRD_LEARN_ENABLED 게이트에 묶여 있으면 학습 토글이 꺼진 환경에서
모든 통화의 과금이 통째로 누락된다.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import pytest  # noqa: E402
import call_lifecycle as cl  # noqa: E402
from credit_guard import CreditGuard  # noqa: E402

@pytest.fixture(autouse=True)
def _env(monkeypatch):
    monkeypatch.setenv("LEARN_SECRET", "s3cret")

async def test_call_end_fires_without_learn_flag(monkeypatch):
    """학습 토글이 꺼져 있어도 종료 통보(=정산)는 나가야 한다."""
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "0")
    called = {}

    async def fake_post(url, headers, body):
        called["url"] = url

    monkeypatch.setattr(cl, "_post", fake_post)

    await cl.call_end("https://oth-path.test", 1, "aabbccddeeff")
    assert called["url"] == "https://oth-path.test/oth-path"

async def test_call_end_fires_when_flag_absent(monkeypatch):
    """env 자체가 없는 환경(로컬·신규 배포)에서도 정산은 나가야 한다."""
    monkeypatch.delenv("PRETHIRD_LEARN_ENABLED", raising=False)
    called = {}

    async def fake_post(url, headers, body):
        called["url"] = url

    monkeypatch.setattr(cl, "_post", fake_post)

    await cl.call_end("https://oth-path.test", 1, "aabbccddeeff")
    assert "url" in called

async def test_call_start_also_ungated(monkeypatch):
    """call_start 도 게이트를 제거했다 — call_sessions 가 통화기록의 단일 출처이고
    call_end 가 갱신할 대상 행이다. 이 INSERT 가 빠지면 정산할 행조차 없다."""
    monkeypatch.delenv("PRETHIRD_LEARN_ENABLED", raising=False)
    posted = {"n": 0}

    async def fake_post(*a, **k):
        posted["n"] += 1

    monkeypatch.setattr(cl, "_post", fake_post)

    await cl.call_start("https://oth-path.test", 9201, "aabbccddeeff", "tok")
    assert posted["n"] == 1

async def test_guard_cancelled_on_teardown():
    guard = CreditGuard(
        max_end_at_ms=10 ** 15,
        on_warn=lambda s: None,
        on_exhausted=lambda: None,
        warn_offsets_sec=(),
    )
    guard.start()
    assert guard._tasks

    guard.cancel()
    assert guard._tasks == []

async def test_signaling_teardown_cancels_guard(monkeypatch):
    """connectionstatechange 정리 경로가 가드를 취소해야 한다 —
    남은 타이머가 종료 후 발화하면 이미 끊긴 통화를 또 끊으려 든다."""
    import signaling

    class _Sess:
        session_id = "aabbccddeeff"

    sess = _Sess()
    guard = CreditGuard(
        max_end_at_ms=10 ** 15,
        on_warn=lambda s: None,
        on_exhausted=lambda: None,
        warn_offsets_sec=(),
    )
    guard.start()
    sess.credit_guard = guard

    signaling._cancel_credit_guard(sess)

    assert sess.credit_guard is None
    assert guard._cancelled is True

async def test_teardown_is_safe_without_guard():
    """가드가 없는 세션(통보 실패·greet 이전 종료)에서도 터지지 않아야 한다."""
    import signaling

    class _Sess:
        session_id = "aabbccddeeff"
        credit_guard = None

    signaling._cancel_credit_guard(_Sess())
