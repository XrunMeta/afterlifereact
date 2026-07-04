from __future__ import annotations
import json
import logging
import urllib.request

log = logging.getLogger("lab-tuner.live_guard")


class LiveBusyError(Exception):
    """라이브 통화 활성 중 — 테스트베드 렌더 차단."""


def _default_fetch(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=3) as resp:
        return json.loads(resp.read().decode())


class LiveGuard:
    """라이브 prethird /healthz의 sessions 카운트로 활성 통화 감지."""

    def __init__(self, healthz_url: str, fetch_fn=None):
        self.healthz_url = healthz_url
        self._fetch = fetch_fn or _default_fetch

    def active_sessions(self) -> int:
        try:
            data = self._fetch(self.healthz_url)
            return int(data.get("sessions", 0))
        except Exception as exc:
            # 조회 실패는 튜닝을 막지 않는다(라이브 down/미기동 가능) — 경고만.
            log.warning("live /healthz 조회 실패(0으로 간주): %s", exc)
            return 0

    def is_busy(self) -> bool:
        return self.active_sessions() > 0

    def assert_free(self) -> None:
        n = self.active_sessions()
        if n > 0:
            raise LiveBusyError(f"라이브 통화 {n}건 활성 — 테스트베드 렌더 차단")
