"""credit_guard.py — [T-167] 크레딧 소진 감시.

서버가 준 max_end_at(절대 시각, epoch ms)까지 카운트다운해
잔여 180/60초에 경고를, 0초에 강제 종료 콜백을 발화한다.

로컬에서 greeted_at + allowed_sec 을 재계산하지 않는다 —
서버와 시계가 어긋나면 과금 구간과 종료 시점이 불일치한다.

강제 종료 타이머는 네트워크와 무관한 순수 로컬 타이머다.
서버 통보가 실패해도(=guard 자체가 생성되지 않는 경우를 제외하고)
일단 걸린 타이머는 반드시 발화한다.
"""
from __future__ import annotations
import asyncio
import inspect
import logging
import time
from typing import Callable, Iterable

log = logging.getLogger("prethird.creditguard")

DEFAULT_WARN_OFFSETS_SEC: tuple[float, ...] = (180, 60)

def _now_ms() -> int:
    return int(time.time() * 1000)

class CreditGuard:
    """max_end_at_ms 까지의 잔여 시간에 대한 경고·강제종료 타이머.

    콜백은 동기 함수여도 되고 코루틴을 반환해도 된다(반환값이 awaitable 이면 await).
    콜백에서 난 예외는 흡수한다 — 경고 실패가 강제 종료를 막아선 안 된다.
    """

    def __init__(
        self,
        max_end_at_ms: int,
        on_warn: Callable[[float], object],
        on_exhausted: Callable[[], object],
        warn_offsets_sec: Iterable[float] = DEFAULT_WARN_OFFSETS_SEC,
    ) -> None:
        self._max_end_at_ms = int(max_end_at_ms)
        self._on_warn = on_warn
        self._on_exhausted = on_exhausted
        self._warn_offsets = tuple(sorted(warn_offsets_sec, reverse=True))
        self._tasks: list[asyncio.Task] = []
        self._cancelled = False
        self._started = False

    @property
    def remaining_sec(self) -> int:
        return max(0, (self._max_end_at_ms - _now_ms()) 

    def start(self) -> None:
        # 중복 start 는 타이머를 이중으로 걸어 강제 종료를 두 번 발화시킨다.
        if self._started or self._cancelled:
            return
        self._started = True

        remaining_ms = self._max_end_at_ms - _now_ms()

        for offset in self._warn_offsets:
            delay_ms = remaining_ms - offset * 1000
            if delay_ms <= 0:
                continue  # 이미 지난 경고 시점은 건너뛴다
            self._tasks.append(
                asyncio.ensure_future(self._fire_warn(delay_ms / 1000, offset))
            )

        self._tasks.append(
            asyncio.ensure_future(self._fire_exhausted(max(0.0, remaining_ms / 1000)))
        )

    async def _maybe_await(self, result: object) -> None:
        if inspect.isawaitable(result):
            await result

    async def _fire_warn(self, delay_sec: float, offset_sec: float) -> None:
        try:
            await asyncio.sleep(delay_sec)
            if self._cancelled:
                return
            await self._maybe_await(self._on_warn(offset_sec))
        except asyncio.CancelledError:
            pass
        except Exception as e:
            log.warning("credit warn callback failed: %s", e)

    async def _fire_exhausted(self, delay_sec: float) -> None:
        try:
            await asyncio.sleep(delay_sec)
            if self._cancelled:
                return
            await self._maybe_await(self._on_exhausted())
        except asyncio.CancelledError:
            pass
        except Exception as e:
            log.warning("credit exhausted callback failed: %s", e)

    def cancel(self) -> None:
        self._cancelled = True
        for t in self._tasks:
            if not t.done():
                t.cancel()
        self._tasks.clear()
