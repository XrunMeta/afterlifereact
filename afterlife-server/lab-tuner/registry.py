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
        # el BLOCKER 2: 이번 세션에 실제로 update()된 "section.key" 집합.
        # promote.diff(dirty=registry.dirty())가 이 집합만 promote 후보로 삼아,
        # 건드리지 않은 knob이 env 미설정과 달라 보여 오탐되는 문제를 없앤다.
        self._dirty: set[str] = set()

    def get(self) -> RunKnobs:
        with self._lock:
            return self._knobs

    def dirty(self) -> set[str]:
        """이번 세션에 실제로 update()된 "section.key" 집합의 방어적 복사본."""
        with self._lock:
            return set(self._dirty)

    def replace(self, knobs: RunKnobs) -> RunKnobs:
        with self._lock:
            self._knobs = knobs
            # 전체 교체는 새 세션 취급 — 이전 dirty는 더 이상 "이번 세션의 튜닝"이
            # 아니므로 리셋한다(promote 후보를 과거 세션 값으로 오인하지 않도록).
            self._dirty = set()
            return self._knobs

    def update(self, partial: dict) -> RunKnobs:
        """현재 Knobs.to_dict()에 partial을 섹션 단위로 deep-merge 후 반영.

        T-113 Task3-B: dirty는 "실제로 값이 바뀐 키"만 마킹한다. applyKnobs가
        전체 필드(변경 없는 값 포함)를 매번 POST하는 프런트 특성상, 값 비교
        없이 전부 dirty 처리하면 사용자가 한 노브만 바꿔도 promote 후보에
        무관한 노브(filler 등)가 전부 딸려온다(el BLOCKER 2 의도 위반). 값이
        기존과 동일하면(타입까지 포함한 `!=` 비교) dirty에서 제외한다.
        """
        with self._lock:
            base = self._knobs.to_dict()
            for section, vals in (partial or {}).items():
                if section in base and isinstance(vals, dict):
                    valid_keys = set(base[section].keys())   # merge 전 스냅샷 = 실제 유효 필드
                    for key, new_val in vals.items():
                        if key not in valid_keys:   # unknown_field 등은 dirty 기록 제외
                            continue
                        old_val = base[section][key]
                        base[section][key] = new_val
                        if new_val != old_val:
                            self._dirty.add(f"{section}.{key}")
            self._knobs = RunKnobs.from_dict(base)
            return self._knobs
