"""test_pipeline_history — 통화 파이프라인 멀티턴 배선 검증.

`DialoguePipeline` 이 LLM 에 실제로 넘기는 messages 를 캡처해 확인한다.
가장 중요한 것은 **회귀 0**: history_turns 미지정(기본)이면 messages 는
`persona + [현재 발화]` 그대로여야 한다 — 실통화 경로가 한 글자도 안 바뀐다.
"""
import asyncio
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from pipeline import DialoguePipeline


class _FakeTrack:
    """pipeline 이 실제로 호출하는 트랙 메서드 전량(vt/at 합집합)을 갖춘 스텁.

    일부러 합집합으로 둔다 — 모킹이 실제 인터페이스보다 좁으면 드리프트를
    삼켜 테스트가 전부 통과하면서 실통화만 깨진다(2026-08 실사고).
    """
    def begin_response(self): pass
    def push_ndarray(self, a): pass
    def push_pcm_int16(self, p): pass
    def signal_end(self): pass
    def queue_depth(self): return 0
    def queue_depth_samples(self): return 0


def _make_pipe(reply_by_turn, **kw):
    """chat_fn 이 받은 messages 를 sent 에 순서대로 쌓는 파이프라인.

    reply_by_turn: 턴마다 돌려줄 응답 문자열 리스트.
    """
    sent = []
    replies = list(reply_by_turn)

    async def fake_chat(messages):
        sent.append([dict(m) for m in messages])   # 방어 복사 — 이후 변형에 안 흔들리게
        for ch in (replies.pop(0) if replies else ""):
            yield ch

    async def fake_say(text, se_path):
        return b"RIFFfake"

    def fake_decode(wav):
        return (np.zeros(8000, dtype=np.int16), 16000, 1)

    def fake_infer(wav_path, on_frame):
        on_frame(np.zeros((8, 8, 3), dtype=np.uint8))
        return 1

    pipe = DialoguePipeline(
        video_track=_FakeTrack(), audio_track=_FakeTrack(),
        chat_fn=fake_chat, say_fn=fake_say,
        decode_wav_fn=fake_decode, infer_fn=fake_infer,
        persona_messages=[{"role": "system", "content": "너는 할배다"}],
        **kw,
    )
    return pipe, sent


# ----------------------------------------------------------------------
# 회귀 0 — 기본값에서는 기존 동작 그대로
# ----------------------------------------------------------------------

def test_default_sends_no_history():
    """history_turns 미지정 = 현재 실통화 동작. 2번째 턴도 이전 턴을 안 싣는다."""
    pipe, sent = _make_pipe(["답1", "답2"])
    asyncio.run(pipe.say("1턴"))
    asyncio.run(pipe.say("2턴"))
    assert sent[1] == [
        {"role": "system", "content": "너는 할배다"},
        {"role": "user", "content": "2턴"},
    ]


def test_default_history_turns_is_zero():
    pipe, _ = _make_pipe([])
    assert pipe.history.max_turns == 0


# ----------------------------------------------------------------------
# 멀티턴 켰을 때
# ----------------------------------------------------------------------

def test_second_turn_carries_first_turn():
    pipe, sent = _make_pipe(["답1", "답2"], history_turns=3)
    asyncio.run(pipe.say("1턴"))
    asyncio.run(pipe.say("2턴"))
    assert sent[1] == [
        {"role": "system", "content": "너는 할배다"},
        {"role": "user", "content": "1턴"},
        {"role": "assistant", "content": "답1"},
        {"role": "user", "content": "2턴"},
    ]


def test_persona_stays_first_and_history_precedes_current_turn():
    """순서 불변식: persona → 히스토리(오래된 순) → 현재 발화."""
    pipe, sent = _make_pipe(["답1", "답2", "답3"], history_turns=3)
    for i in (1, 2, 3):
        asyncio.run(pipe.say(f"{i}턴"))
    roles = [m["role"] for m in sent[2]]
    assert roles == ["system", "user", "assistant", "user", "assistant", "user"]
    assert sent[2][0]["content"] == "너는 할배다"
    assert sent[2][-1]["content"] == "3턴"


def test_history_is_capped_at_max_turns():
    pipe, sent = _make_pipe(["답1", "답2", "답3"], history_turns=1)
    for i in (1, 2, 3):
        asyncio.run(pipe.say(f"{i}턴"))
    assert [m["content"] for m in sent[2]] == ["너는 할배다", "2턴", "답2", "3턴"]


def test_sessions_do_not_leak_between_pipelines():
    """통화 종료 = pipeline 소멸. 새 통화는 빈 히스토리로 시작한다."""
    p1, _ = _make_pipe(["답1"], history_turns=3)
    asyncio.run(p1.say("이전 통화"))
    p2, sent2 = _make_pipe(["답A"], history_turns=3)
    asyncio.run(p2.say("새 통화"))
    assert sent2[0] == [
        {"role": "system", "content": "너는 할배다"},
        {"role": "user", "content": "새 통화"},
    ]


def test_update_persona_keeps_history():
    """L2 학습으로 페르소나가 갱신돼도 진행 중인 대화 맥락은 유지된다."""
    pipe, sent = _make_pipe(["답1", "답2"], history_turns=3)
    asyncio.run(pipe.say("1턴"))
    pipe.update_persona([{"role": "system", "content": "갱신된 페르소나"}])
    asyncio.run(pipe.say("2턴"))
    assert sent[1][0]["content"] == "갱신된 페르소나"
    assert {"role": "user", "content": "1턴"} in sent[1]
    assert {"role": "assistant", "content": "답1"} in sent[1]


# ----------------------------------------------------------------------
# greet/react — 시스템 지시 발화
# ----------------------------------------------------------------------

def test_system_utterance_reply_carries_into_next_turn_without_its_prompt():
    """인사 지시문은 히스토리에 안 남고, 클론이 실제 한 인사말만 남는다.

    지시문이 user 로 남으면 다음 턴에 클론이 그걸 상대의 말로 읽는다.
    반대로 인사말이 안 남으면 다음 턴에 또 인사한다.
    """
    pipe, sent = _make_pipe(["어서 와", "잘 지냈어"], history_turns=3)
    asyncio.run(pipe._system_utterance("처음 보는 분이 나타났어", label="greet"))
    asyncio.run(pipe.say("안녕"))
    assert sent[1] == [
        {"role": "system", "content": "너는 할배다"},
        {"role": "assistant", "content": "어서 와"},
        {"role": "user", "content": "안녕"},
    ]


def test_system_utterance_sees_prior_history():
    """react 지시도 그때까지의 대화 맥락 위에서 나가야 자연스럽다."""
    pipe, sent = _make_pipe(["답1", "다시 왔네"], history_turns=3)
    asyncio.run(pipe.say("1턴"))
    asyncio.run(pipe._system_utterance("아는 얼굴이 돌아왔어", label="react"))
    assert [m["content"] for m in sent[1]] == [
        "너는 할배다", "1턴", "답1", "아는 얼굴이 돌아왔어",
    ]


# ----------------------------------------------------------------------
# 기존 기능과의 상호작용
# ----------------------------------------------------------------------

def test_name_mention_hint_stays_last_and_is_not_recorded():
    """이름 힌트(system)는 현재 발화 뒤 마지막에 붙고, 히스토리엔 남지 않는다."""
    pipe, sent = _make_pipe(["답1", "답2"], history_turns=3)
    pipe.name_mention_hint = "도기"
    asyncio.run(pipe.say("1턴"))
    assert sent[0][-1]["role"] == "system"
    assert "도기" in sent[0][-1]["content"]
    asyncio.run(pipe.say("2턴"))
    assert not any("도기" in m["content"] for m in sent[1][:-1] if m["role"] == "system"
                   and m["content"] != "너는 할배다")


def test_empty_reply_turn_is_not_recorded():
    """LLM 이 아무것도 안 뱉은 턴은 히스토리를 오염시키지 않는다."""
    pipe, sent = _make_pipe(["", "답2"], history_turns=3)
    asyncio.run(pipe.say("1턴"))
    asyncio.run(pipe.say("2턴"))
    assert sent[1] == [
        {"role": "system", "content": "너는 할배다"},
        {"role": "user", "content": "2턴"},
    ]


def test_history_turns_from_env(monkeypatch):
    """배선 없이 env 만으로 랩/서버에서 켤 수 있어야 한다."""
    monkeypatch.setenv("PRETHIRD_HISTORY_TURNS", "2")
    pipe, sent = _make_pipe(["답1", "답2"], history_turns=None)
    asyncio.run(pipe.say("1턴"))
    asyncio.run(pipe.say("2턴"))
    assert {"role": "user", "content": "1턴"} in sent[1]
