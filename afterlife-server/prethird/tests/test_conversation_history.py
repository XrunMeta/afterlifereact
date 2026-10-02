"""test_conversation_history — AFL-926 이전 대화(통화 간) 주입 + 글자 예산."""
import sys, pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from clone_dialog.conversation_history import ConversationHistory  # noqa: E402

DAY1 = 1_759_280_400_000   # 2025-10-01 10:00 KST (ms)


def _prior(*items):
    """(callId, role, text, at) → API 응답 형태."""
    return [{"callId": c, "role": r, "text": t, "at": a} for c, r, t, a in items]


def test_disabled_by_default_no_regression():
    h = ConversationHistory(0)
    h.record("안녕", "그래")
    assert h.messages() == [] and len(h) == 0


def test_in_call_turns_as_role_messages():
    h = ConversationHistory(10)
    h.record(None, "여보세요?")
    h.record("할아버지", "오냐")
    assert h.messages() == [
        {"role": "assistant", "content": "여보세요?"},
        {"role": "user", "content": "할아버지"},
        {"role": "assistant", "content": "오냐"},
    ]


def test_prior_rendered_as_single_system_transcript_grouped_by_call():
    h = ConversationHistory(10)
    h.seed_prior(_prior(
        ("c1", "user", "고추 언제 따요?", DAY1),
        ("c1", "clone", "다음 주에 딴다", DAY1 + 1000),
        ("c2", "user", "배 얘기 해주세요", DAY1 + 86_400_000),
    ))
    msgs = h.messages()
    assert len(msgs) == 1 and msgs[0]["role"] == "system"
    body = msgs[0]["content"]
    # 통화 단위로 날짜 머리가 붙고, 오래된 통화가 먼저
    assert body.index("2025-10-01") < body.index("2025-10-02")
    assert "상대: 고추 언제 따요?" in body and "나: 다음 주에 딴다" in body
    assert h.has_prior()


def test_prior_comes_before_current_call():
    h = ConversationHistory(10)
    h.seed_prior(_prior(("c1", "user", "예전 얘기", DAY1)))
    h.record("지금 얘기", "응")
    msgs = h.messages()
    assert msgs[0]["role"] == "system" and "예전 얘기" in msgs[0]["content"]
    assert msgs[1:] == [{"role": "user", "content": "지금 얘기"},
                        {"role": "assistant", "content": "응"}]


def test_prior_works_even_when_in_call_history_disabled():
    """이전 대화 주입은 통화 내 턴 수 설정과 독립 — seed 했으면 보낸다."""
    h = ConversationHistory(0)
    h.seed_prior(_prior(("c1", "user", "예전", DAY1)))
    assert len(h.messages()) == 1


def test_char_budget_drops_oldest_prior_lines_first():
    h = ConversationHistory(10, max_chars=400)
    h.seed_prior(_prior(*[("c1", "user", f"오래된말{i:02d}" + "가" * 20, DAY1 + i) for i in range(20)]))
    h.record("지금", "응")
    msgs = h.messages()
    total = sum(len(m["content"]) for m in msgs)
    assert total <= 400
    body = msgs[0]["content"]
    assert "오래된말19" in body and "오래된말00" not in body   # 최근 것이 남는다
    assert msgs[-1] == {"role": "assistant", "content": "응"}   # 이번 통화는 온전


def test_char_budget_trims_current_call_when_prior_gone():
    h = ConversationHistory(100, max_chars=30)
    for i in range(10):
        h.record(f"질문{i}", f"대답{i}")
    msgs = h.messages()
    assert sum(len(m["content"]) for m in msgs) <= 30
    assert msgs[-1]["content"] == "대답9"


def test_seed_ignores_bad_rows():
    h = ConversationHistory(10)
    h.seed_prior([{"role": "user"}, {"role": "x", "text": "?"}, "junk",
                  {"callId": "c", "role": "clone", "text": "  ", "at": DAY1}])
    assert not h.has_prior() and h.messages() == []


def test_from_env_reads_max_chars(monkeypatch):
    monkeypatch.setenv("PRETHIRD_HISTORY_TURNS", "1000")
    monkeypatch.setenv("PRETHIRD_HISTORY_MAX_CHARS", "5000")
    h = ConversationHistory.from_env()
    assert h.max_turns == 1000 and h.max_chars == 5000
    monkeypatch.setenv("PRETHIRD_HISTORY_MAX_CHARS", "oops")
    assert ConversationHistory.from_env().max_chars == ConversationHistory.DEFAULT_MAX_CHARS
