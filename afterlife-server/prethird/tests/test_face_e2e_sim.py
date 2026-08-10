"""[T-067 Task 16] prethird 통합 E2E 시뮬레이션 — 한 세션에서 연속 시나리오.

brief(§Step1)의 1~6 흐름을 실 LLM/TTS/HTTP 없이 Fake 더블만으로 재현한다.
패턴은 tests/test_face_react.py·test_name_extract.py·test_l2p_swap.py 를 그대로 재사용 —
개별 단위 테스트에서 이미 검증된 계약(react 쿨다운·pending_enroll·_maybe_swap_l2p·
learn_writeback 라우팅·busy-lock pending_react)을 "한 통화 세션" 안에서 순서대로 이어붙여
상호작용(예: 스왑 직후 학습 라우팅, 발화 중 도착한 face_event 큐잉)까지 검증하는 것이 목적.

시나리오:
  1. face_event unknown_face                → react("unknown", None) + pending_enroll=True
  2. say "저 민지예요"                        → enroll_suggest{"name":"민지"} 송신 + say 정상 응답
  3. face_event speaker_confirmed(3,"민지")   → react("known","민지") + fetch_l2p 호출
                                                + update_persona(bundle을 화자 기준으로 재조립, T-252)
  4. 이후 say                                → learn_writeback 이 person_id=3 으로 라우팅
  5. 같은 personId(3) 재이벤트                → react 미발화(쿨다운) + persona 재스왑도 없음(pid 동일)
  6. say 발화 진행 중 face_event(personId=5) 도착
                                             → busy-lock 중엔 겹쳐 재생되지 않고 pending_react 대기,
                                               say 종료 후 재생(current_speaker/스왑은 즉시 갱신되므로
                                               이 say 의 learn_writeback 은 person_id=5 로 감)
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asyncio
import json
import logging
import pytest
from signaling import _make_dc_handler  # noqa: E402
from clone_dialog import bundle_to_messages  # noqa: E402
import name_extract  # noqa: E402
import l2p_client  # noqa: E402
import learn_writeback as lw  # noqa: E402

# T-252: _maybe_swap_l2p/_clear_current_speaker 가 재조립할 원본 번들.
_BUNDLE = {
    "personaBundle": {
        "cloneId": "9201",
        "persona": {"displayName": "코조", "tone": "친근함"},
        "viewer": {"displayName": "지호"},
    }
}

class _Channel:
    def __init__(self):
        self.readyState = "open"
        self.sent = []
    def send(self, s): self.sent.append(json.loads(s))

class _Pipeline:
    """say/react/update_persona 를 모두 갖춘 통합 더블.

    say_gate(기본 set=열림)로 발화 지속 상황(6. busy-lock 시나리오)을 재현한다 —
    필요할 때만 clear() 해서 say() 를 일시 정지시키고, set() 하면 재개된다.
    """
    def __init__(self, persona_messages=None):
        self.persona_messages = persona_messages or [{"role": "system", "content": "base persona"}]
        self.say_calls = []
        self.react_calls = []
        self.update_calls = []
        self.say_gate = asyncio.Event()
        self.say_gate.set()
    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None):
        self.say_calls.append(text)
        if on_first_audio:
            on_first_audio()
        await self.say_gate.wait()
    async def speak(self, text, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None):
        pass
    async def greet(self, turn=None, on_first_audio=None, on_response_ready=None, on_sentence=None):
        pass
    async def react(self, kind, display_name=None, turn=None, on_first_audio=None):
        self.react_calls.append((kind, display_name))
    def update_persona(self, messages):
        self.update_calls.append(list(messages))
        self.persona_messages = list(messages)

class _Sess:
    def __init__(self, clone_id=9201, user_id=8201):
        self.pipeline = _Pipeline()
        self.session_id = "s1"
        self.clone_id = clone_id
        self.user_id = user_id
        self.se_path = None
        self.offer_time = None
        self.recorder = None
        self.state = None
        self.reacted_keys = {}
        self.pending_enroll = False
        self.current_speaker = None
        self.pending_react = None
        self.bundle = dict(_BUNDLE)  # T-252: 재조립 원본. offer 시 signaling.py가 대입하는 값.
    def set_state(self, s): self.state = s

def _drain(loop):
    """test_face_react.py 의 _run_handler 와 동일한 검증된 패턴 —
    sleep(0) 한 틱 진행 후 남은 태스크를 모두 gather 한다."""
    loop.run_until_complete(asyncio.sleep(0))
    pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
    if pending:
        loop.run_until_complete(asyncio.gather(*pending))

def _pump_until(loop, cond, max_ticks=50):
    for _ in range(max_ticks):
        if cond():
            return
        loop.run_until_complete(asyncio.sleep(0))
    raise AssertionError("condition not satisfied within pump ticks")

def test_full_flow_unknown_to_enrolled(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    async def _fake_extract_name(text):
        return "민지"
    monkeypatch.setattr(name_extract, "extract_name", _fake_extract_name)

    l2p_calls = []
    async def _fake_fetch_l2p(clone_id, person_id):
        l2p_calls.append((clone_id, person_id))
        return {"relation": "손녀"}
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch_l2p)

    learn_calls = []
    async def _fake_learn_writeback(*a, **k):
        learn_calls.append((a, k))
    monkeypatch.setattr(lw, "learn_writeback", _fake_learn_writeback)

    sess, ch = _Sess(), _Channel()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, ch)

        # 1. unknown_face → react("unknown", None) + pending_enroll
        handler(json.dumps({"type": "face_event", "event": "unknown_face", "seq": 1}))
        _drain(loop)
        assert sess.pipeline.react_calls == [("unknown", None)]
        assert sess.pending_enroll is True
        # [T-252 fix / mizu H-1] 확정 화자 이력이 없어도 프롬프트는 상태 4로 강등된다
        # (구 코드는 current_speaker 가 None 이라 통째로 스킵 → 계정주 이름 호칭 유지).
        assert len(sess.pipeline.update_calls) == 1
        assert "지호" not in sess.pipeline.update_calls[0][0]["content"]

        # 2. say "저 민지예요" → enroll_suggest{"name":"민지"} + say 정상 응답
        handler(json.dumps({"type": "say", "text": "저 민지예요", "seq": 2}))
        _drain(loop)
        suggests = [m for m in ch.sent if m["type"] == "enroll_suggest"]
        assert suggests == [{"type": "enroll_suggest", "name": "민지"}]
        assert sess.pipeline.say_calls == ["저 민지예요"]
        assert sess.pending_enroll is False
        # 화자 미확정 상태 — 기존 사용자별 학습 경로로 라우팅(person_id 없음)
        assert len(learn_calls) == 1
        assert learn_calls[0][1].get("person_id") is None

        # 3. (RN이 등록·확정했다 치고) face_event speaker_confirmed(personId=3, 민지)
        #    → react("known","민지") + fetch_l2p 호출 + update_persona(화자 반영 프롬프트 전체 재조립)
        handler(json.dumps({
            "type": "face_event", "event": "speaker_confirmed",
            "personId": 3, "displayName": "민지", "seq": 3,
        }))
        _drain(loop)
        assert sess.pipeline.react_calls == [("unknown", None), ("known", "민지")]
        assert sess.current_speaker == (3, "민지")
        assert l2p_calls == [(9201, 3)]
        # 1번(상태 4 강등) + 3번(화자 확정 재조립) = 2회
        assert len(sess.pipeline.update_calls) == 2
        swapped = sess.pipeline.update_calls[-1]
        # T-252: base 위에 덧붙이지 않고 bundle 전체를 화자 기준으로 재조립한다.
        assert swapped == bundle_to_messages(sess.bundle, speaker={"name": "민지", "l2p_data": {"relation": "손녀"}})
        content = swapped[0]["content"]
        assert "민지" in content and "손녀" in content

        # 4. 이후 say → learn_writeback 이 person_id=3 으로 라우팅(post_learn_person 경로)
        handler(json.dumps({"type": "say", "text": "오늘 뭐 했어?", "seq": 4}))
        _drain(loop)
        assert sess.pipeline.say_calls == ["저 민지예요", "오늘 뭐 했어?"]
        assert len(learn_calls) == 2
        assert learn_calls[1][1].get("person_id") == 3

        # 5. 같은 personId(3) 재이벤트 → react 미발화(쿨다운) + persona 재스왑도 없음(pid 동일)
        handler(json.dumps({
            "type": "face_event", "event": "speaker_confirmed",
            "personId": 3, "displayName": "민지", "seq": 5,
        }))
        _drain(loop)
        assert sess.pipeline.react_calls == [("unknown", None), ("known", "민지")]  # 추가 없음
        assert len(sess.pipeline.update_calls) == 2  # 스왑도 재발화 안 됨(1·3번 누계 그대로)

        # 6. say 발화 진행 중(busy-lock) face_event(personId=5,"철수") 도착
        #    → 즉시 겹쳐 재생하지 않고 pending_react 단일 슬롯에 대기, say 종료 후 재생.
        sess.pipeline.say_gate.clear()
        handler(json.dumps({"type": "say", "text": "잠깐만요", "seq": 6}))
        _pump_until(loop, lambda: sess.pipeline.say_calls[-1:] == ["잠깐만요"])

        handler(json.dumps({
            "type": "face_event", "event": "speaker_confirmed",
            "personId": 5, "displayName": "철수", "seq": 7,
        }))
        _pump_until(loop, lambda: sess.pending_react is not None)
        # say 가 busy_lock 을 쥐고 있는 동안엔 react 가 겹쳐 재생되지 않는다.
        assert sess.pipeline.react_calls == [("unknown", None), ("known", "민지")]
        # current_speaker/persona 스왑은 react 쿨다운·busy-lock 과 무관하게 즉시 갱신된다(§6.4).
        assert sess.current_speaker == (5, "철수")

        sess.pipeline.say_gate.set()
        _drain(loop)

        # say 종료 후 pending react 가 재생된다(겹침 없이, 최신 1건).
        assert sess.pipeline.react_calls == [
            ("unknown", None), ("known", "민지"), ("known", "철수"),
        ]
        assert sess.pending_react is None
        # 이 say("잠깐만요")의 finally 시점엔 이미 current_speaker가 철수로 갱신돼 있었으므로
        # learn_writeback 은 person_id=5 로 라우팅된다(§6.4: 스왑은 쿨다운과 무관하게 즉시 반영).
        assert len(learn_calls) == 3
        assert learn_calls[2][1].get("person_id") == 5
    finally:
        asyncio.set_event_loop(None)
        loop.close()

def test_face_diag_log_emitted(monkeypatch, caplog):
    """[T-067 Task 6] FACE_DIAG_LOG=1 이면 face 정상경로가 personId만으로 log.info를
    방출한다 — displayName(실명)은 절대 로그에 포함되지 않는다."""
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    monkeypatch.setenv("FACE_DIAG_LOG", "1")

    l2p_calls = []
    async def _fake_fetch_l2p(clone_id, person_id):
        l2p_calls.append((clone_id, person_id))
        return {"relation": "손녀"}
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch_l2p)

    sess, ch = _Sess(), _Channel()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, ch)

        with caplog.at_level(logging.INFO, logger="prethird.signaling"):
            # 1. unknown_face → recv/react face_diag 로그
            handler(json.dumps({"type": "face_event", "event": "unknown_face", "seq": 1}))
            _drain(loop)

            # 2. speaker_confirmed(personId=3, displayName="민지")
            #    → recv/speaker(swap_scheduled)/react/l2p_swapped face_diag 로그
            handler(json.dumps({
                "type": "face_event", "event": "speaker_confirmed",
                "personId": 3, "displayName": "민지", "seq": 2,
            }))
            _drain(loop)

            # 3. 같은 personId 재이벤트 → 쿨다운 억제 face_diag 로그
            handler(json.dumps({
                "type": "face_event", "event": "speaker_confirmed",
                "personId": 3, "displayName": "민지", "seq": 3,
            }))
            _drain(loop)

        msgs = [r.getMessage() for r in caplog.records]
        assert any("face_diag" in m and "event=speaker_confirmed" in m for m in msgs)
        assert any("face_diag" in m and "swap_scheduled=1" in m for m in msgs)
        assert any("face_diag" in m and "kind=known" in m for m in msgs)
        assert any("face_diag" in m and "l2p_swapped" in m for m in msgs)
        assert any("face_diag" in m and "suppressed=1" in m for m in msgs)
        # 실명 미포함 감시 — personId만, displayName 문자열은 로그에 절대 없어야 한다.
        assert not any("민지" in m for m in msgs)
    finally:
        asyncio.set_event_loop(None)
        loop.close()
