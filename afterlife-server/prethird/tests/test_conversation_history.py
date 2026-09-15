"""test_conversation_history — 통화 세션 멀티턴 히스토리 단위 검증.

배경: 통화 경로(pipeline.say/_system_utterance)는 매 턴 `persona + [현재 발화]`만
LLM 에 보내 왔다. 이전 턴이 누적되는 배열이 아예 없어 "대화가 안 이어진다"는
증상의 근본이었다. 이 모듈은 그 누적을 담당한다.

불변식 2개를 못박는다.
  1. max_turns=0 (기본) → messages() 는 항상 [] — 기존 동작 회귀 0.
  2. 세션 = 인스턴스. 인스턴스가 다르면 히스토리는 공유되지 않는다.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from clone_dialog.conversation_history import ConversationHistory


def test_default_zero_turns_is_noop():
    """기본값 0 = 히스토리 비활성 → 기록해도 messages() 는 빈 리스트(회귀 0)."""
    h = ConversationHistory(0)
    h.record("안녕", "안녕하세요")
    h.record("밥 먹었어?", "아직요")
    assert h.messages() == []


def test_records_user_and_assistant_in_order():
    h = ConversationHistory(3)
    h.record("안녕", "안녕하세요")
    assert h.messages() == [
        {"role": "user", "content": "안녕"},
        {"role": "assistant", "content": "안녕하세요"},
    ]


def test_accumulates_multiple_turns_oldest_first():
    h = ConversationHistory(3)
    h.record("1턴", "답1")
    h.record("2턴", "답2")
    assert [m["content"] for m in h.messages()] == ["1턴", "답1", "2턴", "답2"]


def test_drops_oldest_turn_beyond_max():
    """max_turns 초과 시 가장 오래된 턴부터 통째로(user+assistant 쌍) 버린다."""
    h = ConversationHistory(2)
    h.record("1턴", "답1")
    h.record("2턴", "답2")
    h.record("3턴", "답3")
    assert [m["content"] for m in h.messages()] == ["2턴", "답2", "3턴", "답3"]


def test_system_utterance_records_reply_without_prompt():
    """greet/react 의 지시문은 대화기록이 아니다 — user_text=None 이면 응답만 남긴다.

    지시문("처음 보는 분이 나타났어…")이 user 로 남으면 다음 턴에 클론이 그걸
    상대의 말로 읽어 대화가 오염된다. 반대로 클론이 실제로 한 인사말은 남겨야
    다음 턴에 또 인사하지 않는다.
    """
    h = ConversationHistory(3)
    h.record(None, "어서 와요")
    assert h.messages() == [{"role": "assistant", "content": "어서 와요"}]


def test_empty_reply_is_not_recorded():
    """LLM 이 빈 응답을 준 턴은 기록하지 않는다 — 빈 assistant 메시지는 프롬프트 오염."""
    h = ConversationHistory(3)
    h.record("안녕", "")
    assert h.messages() == []


def test_clear_empties_history():
    h = ConversationHistory(3)
    h.record("안녕", "안녕하세요")
    h.clear()
    assert h.messages() == []


def test_messages_returns_a_copy():
    """호출자가 반환값을 조작해도 내부 상태가 오염되지 않는다."""
    h = ConversationHistory(3)
    h.record("안녕", "안녕하세요")
    got = h.messages()
    got.append({"role": "user", "content": "주입"})
    assert len(h.messages()) == 2


def test_sessions_are_isolated_per_instance():
    """세션 = 인스턴스. 통화가 끝나 pipeline 이 사라지면 히스토리도 함께 사라진다."""
    a = ConversationHistory(3)
    b = ConversationHistory(3)
    a.record("A세션", "A답")
    assert b.messages() == []


def test_negative_max_turns_treated_as_disabled():
    """잘못된 env 값(-1)이 새어들어와도 비활성으로 안전하게 떨어진다."""
    h = ConversationHistory(-1)
    h.record("안녕", "안녕하세요")
    assert h.messages() == []


def test_from_env_defaults_to_disabled(monkeypatch):
    monkeypatch.delenv("PRETHIRD_HISTORY_TURNS", raising=False)
    assert ConversationHistory.from_env().max_turns == 0


def test_from_env_reads_turn_count(monkeypatch):
    monkeypatch.setenv("PRETHIRD_HISTORY_TURNS", "4")
    assert ConversationHistory.from_env().max_turns == 4


def test_from_env_ignores_garbage(monkeypatch):
    """env 오타로 통화가 죽으면 안 된다 — 파싱 실패는 비활성(기존 동작)으로."""
    monkeypatch.setenv("PRETHIRD_HISTORY_TURNS", "세턴")
    assert ConversationHistory.from_env().max_turns == 0
