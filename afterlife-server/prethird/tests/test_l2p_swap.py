import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asyncio
import json
import pytest
from signaling import _make_dc_handler, _maybe_swap_l2p  # noqa: E402
import learn_writeback as lw  # noqa: E402


class _Channel:
    def __init__(self):
        self.readyState = "open"
        self.sent = []
    def send(self, s): self.sent.append(json.loads(s))


class _Pipeline:
    """persona_messages·update_persona 를 갖춘 실물에 가까운 파이프라인 더블."""
    def __init__(self, persona_messages=None):
        self.persona_messages = persona_messages or [{"role": "system", "content": "base persona"}]
        self.update_calls = []
        self.react_calls = []
        self.say_calls = []
    def update_persona(self, messages):
        self.update_calls.append(list(messages))
        self.persona_messages = list(messages)
    async def react(self, kind, display_name=None, turn=None, on_first_audio=None):
        self.react_calls.append((kind, display_name))
    async def say(self, text, turn=None, on_first_audio=None, on_response_ready=None):
        self.say_calls.append(text)
        if on_first_audio:
            on_first_audio()


class _Sess:
    def __init__(self, clone_id=9201):
        self.pipeline = _Pipeline()
        self.session_id = "s1"
        self.clone_id = clone_id
        self.se_path = None
        self.offer_time = None
        self.recorder = None
        self.state = None
        self.reacted_keys = {}
        self.pending_enroll = False
        self.current_speaker = None
        self.pending_react = None
        self.base_persona_messages = None
        self.user_id = None
    def set_state(self, s): self.state = s


def _run_handler(sess, channel, msg):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, channel)
        handler(json.dumps(msg))
        loop.run_until_complete(asyncio.sleep(0))
        pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
        if pending:
            loop.run_until_complete(asyncio.gather(*pending))
    finally:
        asyncio.set_event_loop(None)
        loop.close()


# ---------------------------------------------------------------------------
# ① speaker_confirmed → fetch_l2p 호출 · update_persona에 base+화자 시스템메시지
# ---------------------------------------------------------------------------

def test_speaker_confirmed_swaps_persona_with_l2p(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    called = {}
    async def _fake_fetch(clone_id, person_id):
        called["args"] = (clone_id, person_id)
        return {"relation": "손녀", "preference_personal": {"음식": "매운맛"}, "memories_personal": ["생일 5월"]}

    import l2p_client
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch)

    sess, ch = _Sess(), _Channel()
    original_base = list(sess.pipeline.persona_messages)
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    })

    assert called["args"] == (9201, 3)
    assert sess.base_persona_messages == original_base  # 원본 base 보존
    assert len(sess.pipeline.update_calls) == 1
    swapped = sess.pipeline.update_calls[0]
    assert swapped[:len(original_base)] == original_base  # base 위에만 덧붙임
    hint = swapped[-1]
    assert hint["role"] == "system"
    assert "민지" in hint["content"]
    assert "손녀" in hint["content"]
    assert sess.pipeline.react_calls == [("known", "민지")]


# ---------------------------------------------------------------------------
# ② L2' 없음(None/404) → 이름 힌트만
# ---------------------------------------------------------------------------

def test_speaker_confirmed_no_l2p_hint_only(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    import l2p_client
    async def _fake_fetch(clone_id, person_id):
        return None
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch)

    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    })

    assert len(sess.pipeline.update_calls) == 1
    hint = sess.pipeline.update_calls[0][-1]
    assert hint["content"] == "현재 화면의 화자: 민지"


# ---------------------------------------------------------------------------
# ③ fetch 예외 → 스왑 스킵(또는 힌트만) · react는 정상
# ---------------------------------------------------------------------------

def test_fetch_l2p_exception_does_not_break_react(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    import l2p_client
    async def _boom(clone_id, person_id):
        raise RuntimeError("network down")
    monkeypatch.setattr(l2p_client, "fetch_l2p", _boom)

    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    })

    assert sess.pipeline.react_calls == [("known", "민지")]  # react 정상 수행
    # 예외 후에도 힌트 주입은 수행됨(이름은 이미 아는 정보)
    assert len(sess.pipeline.update_calls) == 1
    assert sess.pipeline.update_calls[0][-1]["content"] == "현재 화면의 화자: 민지"


def test_maybe_swap_l2p_handles_missing_pipeline_attrs():
    """update_persona가 없는 파이프라인(구형 더블) → 예외 없이 조용히 스킵."""
    class _BarePipeline:
        pass

    class _BareSess:
        pipeline = _BarePipeline()
        session_id = "s1"
        clone_id = None
        current_speaker = (3, "민지")
        base_persona_messages = None

    async def _run():
        await _maybe_swap_l2p(_BareSess(), 3, "민지")

    asyncio.run(_run())  # 예외 없이 통과해야 함


def test_maybe_swap_l2p_drops_when_stale(monkeypatch):
    """적용 직전 sess.current_speaker[0] != pid(전달받은 값) → stale 드랍(최신 스왑 안 덮음)."""
    import l2p_client
    async def _fake_fetch(clone_id, person_id):
        return None
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch)
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    sess = _Sess()
    sess.current_speaker = (5, "철수")  # 이미 다른 화자로 넘어간 상태
    asyncio.run(_maybe_swap_l2p(sess, 3, "민지"))  # 3번(민지)에 대한 늦은 스왑 시도

    assert sess.pipeline.update_calls == []  # 드랍됨 — 최신(철수) persona 안 건드림


def test_react_not_blocked_by_slow_l2p_fetch(monkeypatch):
    """react는 fetch_l2p 완료를 기다리지 않는다(fire-and-forget) — fetch가 아직 안 끝나도
    react_calls는 이벤트 처리 직후 이미 채워져 있어야 한다."""
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    gate = asyncio.Event()
    import l2p_client
    async def _slow_fetch(clone_id, person_id):
        await gate.wait()  # react가 끝나기 전엔 절대 풀리지 않음(테스트가 직접 통제)
        return None
    monkeypatch.setattr(l2p_client, "fetch_l2p", _slow_fetch)

    sess, ch = _Sess(), _Channel()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        handler = _make_dc_handler(sess, ch)
        handler(json.dumps({
            "type": "face_event", "event": "speaker_confirmed",
            "personId": 3, "displayName": "민지", "seq": 1,
        }))
        # 몇 틱만 진행 — fetch_l2p는 gate 대기로 영원히 안 끝나지만 react는 이미 완료돼야 함.
        for _ in range(10):
            loop.run_until_complete(asyncio.sleep(0))
        assert sess.pipeline.react_calls == [("known", "민지")]  # swap 미완료여도 react 완료
        assert sess.pipeline.update_calls == []  # swap은 아직 대기 중(gate 안 풀림)

        gate.set()
        pending = [t for t in asyncio.all_tasks(loop) if not t.done()]
        if pending:
            loop.run_until_complete(asyncio.gather(*pending))
        assert sess.pipeline.update_calls == [
            [{"role": "system", "content": "base persona"}, {"role": "system", "content": "현재 화면의 화자: 민지"}]
        ]
    finally:
        asyncio.set_event_loop(None)
        loop.close()


# ---------------------------------------------------------------------------
# ④ learn 라우팅: current_speaker 있으면 post_learn_person, 없으면 기존 _post_learn
# ---------------------------------------------------------------------------

async def test_learn_writeback_routes_to_person(monkeypatch):
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    posted_person, posted_user = {"n": 0}, {"n": 0}

    async def _fake_extract(*a, **k):
        return {"relation": "친구"}
    async def _fake_post_person(clone_id, person_id, session_id, extracted):
        posted_person["n"] += 1
        posted_person["args"] = (clone_id, person_id, session_id, extracted)
    async def _fake_post_user(*a, **k):
        posted_user["n"] += 1

    monkeypatch.setattr(lw, "extract_l2", _fake_extract)
    monkeypatch.setattr(lw, "post_learn_person", _fake_post_person)
    monkeypatch.setattr(lw, "_post_learn", _fake_post_user)

    await lw.learn_writeback(9201, None, "sid", "안녕", "응답", person_id=3)
    assert posted_person["n"] == 1
    assert posted_user["n"] == 0
    assert posted_person["args"] == (9201, 3, "sid", {"relation": "친구"})


async def test_learn_writeback_routes_to_user_when_no_speaker(monkeypatch):
    """기존 경로(person_id 없음) — _post_learn 그대로, 회귀 0."""
    monkeypatch.setenv("PRETHIRD_LEARN_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    posted_person, posted_user = {"n": 0}, {"n": 0}

    async def _fake_extract(*a, **k):
        return {"relation": "친구"}
    async def _fake_post_person(*a, **k):
        posted_person["n"] += 1
    async def _fake_post_user(clone_id, user_id, session_id, extracted):
        posted_user["n"] += 1
        posted_user["args"] = (clone_id, user_id, session_id, extracted)

    monkeypatch.setattr(lw, "extract_l2", _fake_extract)
    monkeypatch.setattr(lw, "post_learn_person", _fake_post_person)
    monkeypatch.setattr(lw, "_post_learn", _fake_post_user)

    await lw.learn_writeback(9201, 8201, "sid", "안녕", "응답")  # person_id 미지정
    assert posted_person["n"] == 0
    assert posted_user["n"] == 1
    assert posted_user["args"] == (9201, 8201, "sid", {"relation": "친구"})


async def test_post_learn_person_skips_without_env(monkeypatch):
    monkeypatch.delenv("LEARN_SECRET", raising=False)
    monkeypatch.delenv("PRETHIRD_API_BASE", raising=False)
    # 예외 없이 조용히 반환(네트워크 호출 없음)
    await lw.post_learn_person(9201, 3, "sid", {"relation": "친구"})


def test_say_turn_learn_routes_person_id(monkeypatch):
    """say 처리부: sess.current_speaker 있으면 learn_writeback에 person_id 전달."""
    captured = {}
    async def _fake_learn_writeback(*a, **k):
        captured["args"] = a
        captured["kwargs"] = k
    monkeypatch.setattr(lw, "learn_writeback", _fake_learn_writeback)

    sess, ch = _Sess(), _Channel()
    sess.current_speaker = (3, "민지")
    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 1})

    assert captured["kwargs"].get("person_id") == 3


def test_say_turn_learn_no_speaker_person_id_none(monkeypatch):
    captured = {}
    async def _fake_learn_writeback(*a, **k):
        captured["kwargs"] = k
    monkeypatch.setattr(lw, "learn_writeback", _fake_learn_writeback)

    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {"type": "say", "text": "안녕", "seq": 1})

    assert captured["kwargs"].get("person_id") is None


# ---------------------------------------------------------------------------
# ⑤ 화자 교대(A→B) → base + B만(중첩 없음, 기존 A 힌트 잔존 X)
# ---------------------------------------------------------------------------

def test_speaker_swap_no_nesting(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    import l2p_client
    async def _fake_fetch(clone_id, person_id):
        return None
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch)

    sess, ch = _Sess(), _Channel()
    original_base = list(sess.pipeline.persona_messages)

    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 1,
    })
    # 쿨다운 리셋(같은 handler 인스턴스라 personId=5는 별도 키라 쿨다운 문제 없음)
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 5, "displayName": "철수", "seq": 2,
    })

    assert len(sess.pipeline.update_calls) == 2
    final = sess.pipeline.update_calls[-1]
    # base + 화자 힌트 1개만 — 민지 힌트가 잔존(중첩)하지 않음
    assert final == original_base + [{"role": "system", "content": "현재 화면의 화자: 철수"}]
    assert sess.base_persona_messages == original_base


# ---------------------------------------------------------------------------
# 스펙 §6.4: 복귀 화자(A→B→A) — 쿨다운은 react만 억제, 스왑은 매번 재트리거
# ---------------------------------------------------------------------------

def test_returning_speaker_reswaps_but_react_cooldown_holds(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    import l2p_client
    async def _fake_fetch(clone_id, person_id):
        return None
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch)

    sess, ch = _Sess(), _Channel()

    _run_handler(sess, ch, {  # A
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "A", "seq": 1,
    })
    _run_handler(sess, ch, {  # B
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 5, "displayName": "B", "seq": 2,
    })
    _run_handler(sess, ch, {  # A 복귀
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "A", "seq": 3,
    })

    # react: A/B 각 1회씩(쿨다운으로 A 재확정 시 react는 억제)
    assert sess.pipeline.react_calls == [("known", "A"), ("known", "B")]
    # persona 스왑: 3회 전부 트리거되고, 마지막이 A 힌트(고착 없음)
    assert len(sess.pipeline.update_calls) == 3
    assert sess.pipeline.update_calls[-1][-1]["content"] == "현재 화면의 화자: A"
    assert sess.current_speaker == (3, "A")
