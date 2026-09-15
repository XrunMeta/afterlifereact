from __future__ import annotations
import logging
import os
from collections import deque

log = logging.getLogger("clone_dialog.history")


class ConversationHistory:
    """통화 세션 1개의 대화 히스토리 — user/assistant 턴을 최근 N개만 유지한다.

    왜 필요한가
    -----------
    통화 경로(`pipeline.say`)는 매 턴 `persona_messages + [현재 발화 1개]` 만 LLM 에
    보내 왔다. 이전 턴이 누적되는 배열이 코드에 없었다 — 즉 통화 내내 매 턴이
    첫 턴이었고, 이것이 "대화가 안 이어진다"의 근본이다.
    L2(`recent_topics`·`preference_history`)는 요약된 **지식**이라 "무엇을 아는가"는
    채워도 "방금 뭐라고 했는가"는 채우지 못한다.

    세션 경계
    ---------
    세션 = 이 인스턴스의 수명. `DialoguePipeline` 이 통화(peer connection)마다 새로
    만들어지고 종료와 함께 버려지므로, 첫 발화에서 시작해 통화가 끊기면 사라진다.
    별도 만료 타이머가 없는 것은 의도다.

    회귀 0
    ------
    `max_turns <= 0` 이면 기록도 조회도 하지 않는다. env 미설정 시 기본 0 이므로
    이 클래스를 배선해도 기존 동작은 한 글자도 바뀌지 않는다.
    """

    ENV_KEY = "PRETHIRD_HISTORY_TURNS"

    def __init__(self, max_turns: int = 0) -> None:
        # 음수(잘못된 env)는 비활성으로 접는다 — deque(maxlen=-1) 은 예외다.
        self.max_turns = max_turns if max_turns > 0 else 0
        self._turns: deque[tuple[str | None, str]] = deque(maxlen=self.max_turns or 1)

    @classmethod
    def from_env(cls) -> "ConversationHistory":
        """`PRETHIRD_HISTORY_TURNS` 로 유지 턴 수를 읽는다. 미설정·오타는 0(비활성).

        통화 중 env 오타 하나로 파이프라인이 죽으면 안 되므로 파싱 실패는
        경고만 남기고 기존 동작(히스토리 없음)으로 떨어진다.
        """
        raw = os.environ.get(cls.ENV_KEY)
        if not raw:
            return cls(0)
        try:
            return cls(int(raw))
        except (TypeError, ValueError):
            log.warning("%s=%r 파싱 실패 → 히스토리 비활성", cls.ENV_KEY, raw)
            return cls(0)

    def record(self, user_text: str | None, assistant_text: str) -> None:
        """한 턴을 기록한다.

        user_text=None 은 greet/react 같은 **시스템 지시 발화**를 뜻한다. 지시문
        ("처음 보는 분이 나타났어…")을 user 로 남기면 다음 턴에 클론이 그것을
        상대의 말로 읽어 대화가 오염된다. 반면 클론이 실제로 내보낸 인사말은
        남겨야 다음 턴에 또 인사하지 않는다 — 그래서 응답만 남긴다.
        """
        if not self.max_turns:
            return
        if not assistant_text:
            # 빈 assistant 메시지는 다음 턴 프롬프트를 오염시킨다(모델이 침묵을 학습).
            return
        self._turns.append((user_text, assistant_text))

    def messages(self) -> list[dict]:
        """오래된 턴부터 정렬된 messages 배열. 호출자가 조작해도 안전한 새 리스트."""
        if not self.max_turns:
            return []
        out: list[dict] = []
        for user_text, assistant_text in self._turns:
            if user_text:
                out.append({"role": "user", "content": user_text})
            out.append({"role": "assistant", "content": assistant_text})
        return out

    def clear(self) -> None:
        self._turns.clear()

    def __len__(self) -> int:
        return len(self._turns) if self.max_turns else 0
