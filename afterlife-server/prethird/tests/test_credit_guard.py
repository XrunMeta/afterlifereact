"""tests/test_credit_guard.py — T-167 크레딧 데드라인 타이머.

서버가 준 max_end_at(절대 시각)만 기준으로 카운트다운한다.
로컬에서 greeted_at + allowed_sec 을 재계산하지 않는다.
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asyncio  # noqa: E402
import credit_guard  # noqa: E402
from credit_guard import CreditGuard  # noqa: E402


async def test_fires_warnings_then_exhausted(monkeypatch):
    warns: list[float] = []
    exhausted = asyncio.Event()

    # 실시간 대기를 피하려고 경고 오프셋을 밀리초 단위로 축소한다.
    now = 1_000_000
    monkeypatch.setattr(credit_guard, "_now_ms", lambda: now)

    guard = CreditGuard(
        max_end_at_ms=now + 300,          # 0.3초 뒤 소진
        on_warn=lambda sec: warns.append(sec),
        on_exhausted=lambda: exhausted.set(),
        warn_offsets_sec=(0.2, 0.1),      # 0.1초·0.2초 전 경고
    )
    guard.start()
    await asyncio.wait_for(exhausted.wait(), timeout=2)

    assert warns == [0.2, 0.1]
    guard.cancel()


async def test_cancel_prevents_exhausted(monkeypatch):
    fired = False

    def _on_exhausted():
        nonlocal fired
        fired = True

    now = 1_000_000
    monkeypatch.setattr(credit_guard, "_now_ms", lambda: now)

    guard = CreditGuard(
        max_end_at_ms=now + 200,
        on_warn=lambda sec: None,
        on_exhausted=_on_exhausted,
        warn_offsets_sec=(),
    )
    guard.start()
    guard.cancel()
    await asyncio.sleep(0.4)

    assert fired is False


async def test_already_expired_fires_immediately(monkeypatch):
    exhausted = asyncio.Event()
    now = 1_000_000
    monkeypatch.setattr(credit_guard, "_now_ms", lambda: now)

    guard = CreditGuard(
        max_end_at_ms=now - 5_000,        # 이미 지난 데드라인
        on_warn=lambda sec: None,
        on_exhausted=lambda: exhausted.set(),
        warn_offsets_sec=(180, 60),
    )
    guard.start()
    await asyncio.wait_for(exhausted.wait(), timeout=2)
    guard.cancel()


async def test_skips_warnings_already_passed(monkeypatch):
    """잔여가 경고 시점보다 짧으면 지난 경고는 건너뛴다."""
    warns: list[float] = []
    exhausted = asyncio.Event()
    now = 1_000_000
    monkeypatch.setattr(credit_guard, "_now_ms", lambda: now)

    guard = CreditGuard(
        max_end_at_ms=now + 150,          # 0.15초 남음
        on_warn=lambda sec: warns.append(sec),
        on_exhausted=lambda: exhausted.set(),
        warn_offsets_sec=(0.3, 0.1),      # 0.3초 경고는 이미 지났다
    )
    guard.start()
    await asyncio.wait_for(exhausted.wait(), timeout=2)

    assert warns == [0.1]
    guard.cancel()


async def test_remaining_sec(monkeypatch):
    now = 1_000_000
    monkeypatch.setattr(credit_guard, "_now_ms", lambda: now)

    guard = CreditGuard(
        max_end_at_ms=now + 90_000,
        on_warn=lambda sec: None,
        on_exhausted=lambda: None,
    )
    assert guard.remaining_sec == 90


async def test_warn_exception_does_not_block_exhausted(monkeypatch):
    """경고 콜백이 터져도 강제 종료는 반드시 발화해야 한다 —
    데이터채널이 이미 닫힌 상태에서 send 가 던지는 경우가 실제로 있다."""
    exhausted = asyncio.Event()
    now = 1_000_000
    monkeypatch.setattr(credit_guard, "_now_ms", lambda: now)

    def _boom(sec):
        raise RuntimeError("datachannel closed")

    guard = CreditGuard(
        max_end_at_ms=now + 200,
        on_warn=_boom,
        on_exhausted=lambda: exhausted.set(),
        warn_offsets_sec=(0.1,),
    )
    guard.start()
    await asyncio.wait_for(exhausted.wait(), timeout=2)
    guard.cancel()


async def test_awaits_coroutine_callbacks(monkeypatch):
    """on_exhausted 가 코루틴을 반환하면 await 한다 — 세션 teardown 은 async 다."""
    done = asyncio.Event()
    now = 1_000_000
    monkeypatch.setattr(credit_guard, "_now_ms", lambda: now)

    async def _async_exhausted():
        await asyncio.sleep(0)
        done.set()

    guard = CreditGuard(
        max_end_at_ms=now + 100,
        on_warn=lambda sec: None,
        on_exhausted=_async_exhausted,
        warn_offsets_sec=(),
    )
    guard.start()
    await asyncio.wait_for(done.wait(), timeout=2)
    guard.cancel()


async def test_start_is_idempotent(monkeypatch):
    """중복 start 로 타이머가 두 번 걸리면 강제 종료가 두 번 발화한다."""
    fires = []
    now = 1_000_000
    monkeypatch.setattr(credit_guard, "_now_ms", lambda: now)

    guard = CreditGuard(
        max_end_at_ms=now + 100,
        on_warn=lambda sec: None,
        on_exhausted=lambda: fires.append(1),
        warn_offsets_sec=(),
    )
    guard.start()
    guard.start()
    await asyncio.sleep(0.3)
    guard.cancel()

    assert fires == [1]
