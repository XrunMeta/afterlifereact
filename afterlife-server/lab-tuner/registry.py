from __future__ import annotations
import threading
from knobs import RunKnobs


class KnobsRegistry:
    """현재 튜닝 Knobs를 보관하는 thread-safe 레지스트리.

    하네스가 조립한 chat_fn/say_fn/infer_fn 클로저는 매 호출 시 get()으로
    최신 Knobs를 읽는다 → 세션 중 파라미터 변경이 다음 발화에 반영된다.
    """

    def __init__(self, initial: RunKnobs | None = None) -> None:
        self._lock = threading.Lock()
        self._knobs = initial or RunKnobs.from_env()

    def get(self) -> RunKnobs:
        with self._lock:
            return self._knobs

    def replace(self, knobs: RunKnobs) -> RunKnobs:
        with self._lock:
            self._knobs = knobs
            return self._knobs

    def update(self, partial: dict) -> RunKnobs:
        """현재 Knobs.to_dict()에 partial을 섹션 단위로 deep-merge 후 반영."""
        with self._lock:
            base = self._knobs.to_dict()
            for section, vals in (partial or {}).items():
                if section in base and isinstance(vals, dict):
                    base[section].update(vals)
            self._knobs = RunKnobs.from_dict(base)
            return self._knobs
