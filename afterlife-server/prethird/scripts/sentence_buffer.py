from __future__ import annotations
import os
import re

_TERMINAL = re.compile(r"[.!?。…\n]")

class SentenceBuffer:
    """토큰 스트림을 문장 단위로 끊어 emit.

    종결부호(.!?。…개행) 또는 force_flush 글자수 초과 시 flush.
    testbed/lib/sentence_buffer.js 의 MIN_LEN/FORCE_FLUSH 동등 포팅.

    JS 대비 차이:
    - force_flush 강제 컷: JS는 마지막 ','/' ' 위치를 역탐색해 끊지만,
      Python 포팅은 버퍼가 force_flush 이상이면 전체를 한 번에 emit한다.
      실용 상 동일 효과(토큰 단위 push라 잘게 들어옴).
    - 쉼표(,)·읽점(、) 은 종결부호에서 제외(끊김 완화). 끝까지 안 끝나는
      긴 문장은 force_flush 글자수로 강제 컷(폭주 방지).
    """

    def __init__(self, min_len: int = 4, force_flush: int = 30,
                 first_min_len: int | None = None):
        self.min_len = min_len
        self.force_flush = force_flush
        # first_min_len=None이면 min_len과 동일(회귀 0). 첫 세그만 작게 하려면 지정
        # (첫 응답 지연 방지 — 첫 세그는 빨리 내보내고 이후 세그는 크게 병합).
        self.first_min_len = first_min_len if first_min_len is not None else min_len
        self._buf = ""
        self._emitted = 0  # 턴 내 emit 횟수(첫 세그 판별용)

    @classmethod
    def from_env(cls) -> "SentenceBuffer":
        """env(PRETHIRD_SENT_*)로 파라미터 결정. 미설정 시 현행 기본(4/30/first=min_len) — 회귀 0.

        T-120 B(세그먼트 병합): 라이브에서 min_len↑·force_flush↑로 과분절을 줄이고,
        first_min_len(작게)으로 첫 응답 지연을 방지하기 위한 런타임 튜닝 진입점.
        """
        min_len = int(os.environ.get("PRETHIRD_SENT_MIN_LEN", "4"))
        force_flush = int(os.environ.get("PRETHIRD_SENT_FORCE_FLUSH", "30"))
        _fml = os.environ.get("PRETHIRD_SENT_FIRST_MIN_LEN")
        first_min_len = int(_fml) if _fml not in (None, "") else None
        return cls(min_len, force_flush, first_min_len)

    def push(self, token: str) -> list[str]:
        """토큰을 버퍼에 추가하고, emit 가능한 문장 목록 반환."""
        if not isinstance(token, str) or not token:
            return []
        self._buf += token
        out: list[str] = []
        while True:
            m = _TERMINAL.search(self._buf)
            if m:
                candidate = self._buf[: m.end()]
                # 첫 emit 전이면 first_min_len, 이후엔 min_len 사용
                threshold = self.first_min_len if self._emitted == 0 else self.min_len
                if len(candidate.strip()) >= threshold:
                    out.append(candidate)
                    self._buf = self._buf[m.end():]
                    self._emitted += 1
                    continue
                # threshold 미달 — 다음 토큰 올 때까지 누적
            if len(self._buf) >= self.force_flush:
                out.append(self._buf)
                self._buf = ""
                self._emitted += 1
                continue
            break
        return out

    def flush(self) -> list[str]:
        """남은 버퍼를 모두 emit (스트림 종료 시 호출)."""
        if self._buf.strip():
            out = [self._buf]
            self._buf = ""
            return out
        return []

    def peek(self) -> str:
        """현재 버퍼 내용 반환 (읽기 전용)."""
        return self._buf

    def reset(self) -> None:
        """버퍼 초기화."""
        self._buf = ""
        self._emitted = 0
