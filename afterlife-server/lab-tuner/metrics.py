"""턴 단위 지연 계측 수집기.

prethird DialoguePipeline 도 같은 값을 재지만 로컬 dict 에 담아 로그로만
내보내고 콜백 훅이 없다(pipeline.py:713). 로그 파싱은 포맷 변경에 취약하므로
쓰지 않는다.

대신 랩이 **이미 감싸고 있는** 세 함수에서 직접 잰다 — prethird 무수정:

    harness.build_chat_fn        → llm_first_token  (첫 토큰 yield 까지)
    harness.build_say_fn         → tts              (TTS POST 왕복)
    pipeline_factory._infer_fn   → render           (fifth /render 왕복)

TTFF(첫 소리까지)는 첫 render 가 끝난 시점에 그때까지의 단계 합으로 확정하고,
같은 턴의 두 번째 세그먼트부터는 갱신하지 않는다.
"""
from __future__ import annotations

import threading


class TurnMetrics:
    """스레드 안전 — aiohttp 핸들러와 렌더 스레드가 함께 만진다."""

    _STAGES = ("llm_first_token", "tts", "render")

    def __init__(self):
        self._lock = threading.Lock()
        self._reset()

    def _reset(self) -> None:
        self._v: dict[str, int | None] = {s: None for s in self._STAGES}
        self._n_seg = 0
        self._ttff: int | None = None

    def start_turn(self) -> None:
        """새 턴 시작 — 이전 턴 값을 버린다."""
        with self._lock:
            self._reset()

    def record(self, stage: str, ms) -> None:
        """단계 소요 시간 기록. 알 수 없는 stage 는 조용히 무시한다."""
        if stage not in self._STAGES:
            return
        with self._lock:
            self._v[stage] = int(ms)
            if stage == "render":
                self._n_seg += 1
                if self._ttff is None:
                    # 첫 세그먼트가 나온 시점 = 첫 소리가 들리는 시점.
                    # LLM 을 안 타는 경로(greet)면 llm_first_token 이 None 이라 빠진다.
                    self._ttff = sum(v for v in self._v.values() if v is not None)

    def snapshot(self) -> dict:
        with self._lock:
            return {
                "llm_first_token_ms": self._v["llm_first_token"],
                "tts_ms": self._v["tts"],
                "render_ms": self._v["render"],
                "ttff_ms": self._ttff,
                "n_seg": self._n_seg,
            }
