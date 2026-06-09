from __future__ import annotations
import re

_TERMINAL = re.compile(r"[.!?。…,、\n]")

class SentenceBuffer:
    """토큰 스트림을 문장 단위로 끊어 emit.

    종결부호(.!?。…,、개행) 또는 force_flush 글자수 초과 시 flush.
    testbed/lib/sentence_buffer.js 의 MIN_LEN/FORCE_FLUSH 동등 포팅.

    JS 대비 차이:
    - force_flush 강제 컷: JS는 마지막 ','/' ' 위치를 역탐색해 끊지만,
      Python 포팅은 버퍼가 force_flush 이상이면 전체를 한 번에 emit한다.
      실용 상 동일 효과(토큰 단위 push라 잘게 들어옴).
    - 쉼표(,)·읽점(、) 을 종결부호로 포함(JS 027.7 동일).
    """

    def __init__(self, min_len: int = 4, force_flush: int = 30):
        self.min_len = min_len
        self.force_flush = force_flush
        self._buf = ""

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
                if len(candidate.strip()) >= self.min_len:
                    out.append(candidate)
                    self._buf = self._buf[m.end():]
                    continue
                # min_len 미달 — 다음 토큰 올 때까지 누적
            if len(self._buf) >= self.force_flush:
                out.append(self._buf)
                self._buf = ""
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
