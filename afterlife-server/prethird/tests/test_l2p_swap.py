import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import asyncio
import json
import pytest
from signaling import _make_dc_handler, _maybe_swap_l2p  # noqa: E402
from clone_dialog import bundle_to_messages  # noqa: E402
import learn_writeback as lw  # noqa: E402

# T-252: 모든 _Sess 더블이 공유하는 기본 번들 — 재조립 결과를 검증할 때
# 기대값을 bundle_to_messages(_BUNDLE, speaker=...)로 직접 계산해 비교한다
# (문자열 하드코딩은 persona_prompt.py 포맷이 바뀌면 매번 깨진다).
_BUNDLE = {
    "personaBundle": {
        "cloneId": "9201",
        "persona": {"displayName": "코조", "tone": "친근함"},
        "viewer": {"displayName": "지호"},
    }
}


# ---------------------------------------------------------------------------
# T-252: 스왑은 append 가 아니라 재조립 · unknown_face 는 기본상대 폴백
# ---------------------------------------------------------------------------

def test_스왑은_base_위에_덧붙이지_않고_재조립한다():
    """상대 선언이 프롬프트에 항상 정확히 1개만 존재해야 한다."""
    from clone_dialog import bundle_to_messages

    bundle = {
        "personaBundle": {
            "cloneId": "1",
            "persona": {"displayName": "코조"},
            "viewer": {"displayName": "지호"},
        }
    }
    msgs = bundle_to_messages(bundle, speaker={"name": "민수", "l2p_data": {"relation": "친구"}})
    assert len(msgs) == 1                       # system 메시지는 언제나 1개
    content = msgs[0]["content"]
    assert content.count("통화 중인 상대는") == 1
    assert "지호" not in content


def test_unknown_face_는_기본상대로_폴백한다():
    """익명 리셋이 아니라 L2 복귀 + 이름 억제."""
    from clone_dialog import bundle_to_messages

    bundle = {
        "personaBundle": {
            "cloneId": "1",
            "persona": {"displayName": "코조", "memories_personal": ["어제 등산 감"]},
            "viewer": {"displayName": "지호"},
        }
    }
    msgs = bundle_to_messages(bundle, speaker={"unconfirmed": True})
    content = msgs[0]["content"]
    assert "어제 등산 감" in content        # 맥락 유지
    assert "지호" not in content            # 이름 억제


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
        self.bundle = dict(_BUNDLE)  # T-252: 재조립 원본. offer 시 signaling.py가 대입하는 값.
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
# 1. speaker_confirmed → fetch_l2p 호출 · update_persona에 재조립된 프롬프트(T-252)
# ---------------------------------------------------------------------------

def test_speaker_confirmed_swaps_persona_with_l2p(monkeypatch):
    monkeypatch.setenv("PRETHIRD_FACE_REACT_ENABLED", "1")
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    l2p_data = {"relation": "손녀", "preference_personal": {"음식": "매운맛"}, "memories_personal": ["생일 5월"]}
    called = {}
    async def _fake_fetch(clone_id, person_id):
        called["args"] = (clone_id, person_id)
        return l2p_data

    import l2p_client
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch)

    sess, ch = _Sess(), _Channel()
    _run_handler(sess, ch, {
        "type": "face_event", "event": "speaker_confirmed",
        "personId": 3, "displayName": "민지", "seq": 12,
    })

    assert called["args"] == (9201, 3)
    assert len(sess.pipeline.update_calls) == 1
    swapped = sess.pipeline.update_calls[0]
    # T-252: base 위에 덧붙이지 않고 bundle 전체를 화자 기준으로 재조립한다 —
    # 재조립 결과와 정확히 일치해야 한다(중첩·잔존 없음).
    assert swapped == bundle_to_messages(sess.bundle, speaker={"name": "민지", "l2p_data": l2p_data})
    content = swapped[0]["content"]
    assert "민지" in content
    assert "손녀" in content
    assert "지호" not in content  # 기본 상대 이름은 화자 확정 시 노출되지 않는다
    assert sess.pipeline.react_calls == [("known", "민지")]


# ---------------------------------------------------------------------------
# 2. L2' 없음(None/404) → 이름 힌트만
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
    swapped = sess.pipeline.update_calls[0]
    assert swapped == bundle_to_messages(sess.bundle, speaker={"name": "민지", "l2p_data": None})
    content = swapped[0]["content"]
    assert '지금 너와 통화 중인 상대는 "민지" 이다.' in content
    # l2p_data 없음 — "## 상대 정보" 섹션 자체가 없다(헤더 문구 안의 인용은 무시).
    assert "\n## 상대 정보\n" not in content


# ---------------------------------------------------------------------------
# 3. fetch 예외 → 스왑 스킵(또는 힌트만) · react는 정상
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
    # 예외 후에도 재조립은 수행됨(이름은 이미 아는 정보, l2p_data만 None으로 취급)
    assert len(sess.pipeline.update_calls) == 1
    assert sess.pipeline.update_calls[0] == bundle_to_messages(sess.bundle, speaker={"name": "민지", "l2p_data": None})


def test_maybe_swap_l2p_handles_missing_pipeline_attrs():
    """update_persona가 없는 파이프라인(구형 더블) → 예외 없이 조용히 스킵."""
    class _BarePipeline:
        pass

    class _BareSess:
        pipeline = _BarePipeline()
        session_id = "s1"
        clone_id = None
        current_speaker = (3, "민지")
        bundle = _BUNDLE  # update_persona 분기까지 도달시키기 위해 필요(bundle 없으면 조기 리턴)

    async def _run():
        await _maybe_swap_l2p(_BareSess(), 3, "민지")

    asyncio.run(_run())  # 예외 없이 통과해야 함


def test_maybe_swap_l2p_skips_update_when_bundle_none(monkeypatch):
    """[sion A / T-252 회귀] sess.bundle이 None이면(재연결·offer 실패 등) 재조립할
    원본이 없다 — bundle_to_messages(None)은 []을 반환하므로, 이 가드 없이 그대로
    update_persona([])를 호출하면 클론이 페르소나(안전 규칙·성격·기억)를 통째로
    잃는다. update_persona가 단 한 번도 불리지 않아야 한다."""
    import l2p_client
    async def _fake_fetch(clone_id, person_id):
        return {"relation": "친구"}
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch)
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    sess = _Sess()
    sess.bundle = None
    sess.current_speaker = (3, "민지")

    asyncio.run(_maybe_swap_l2p(sess, 3, "민지"))

    assert sess.pipeline.update_calls == []


def test_maybe_swap_l2p_skips_update_when_bundle_empty_dict(monkeypatch):
    """[sion A / T-252 회귀] sess.bundle == {} (빈 dict)도 None과 동일하게 차단돼야
    한다 — `if not bundle` 가드는 falsy 전반(None·{}·[])을 잡는다."""
    import l2p_client
    async def _fake_fetch(clone_id, person_id):
        return {"relation": "친구"}
    monkeypatch.setattr(l2p_client, "fetch_l2p", _fake_fetch)
    monkeypatch.setenv("LEARN_SECRET", "s")
    monkeypatch.setenv("PRETHIRD_API_BASE", "http://x")

    sess = _Sess()
    sess.bundle = {}
    sess.current_speaker = (3, "민지")

    asyncio.run(_maybe_swap_l2p(sess, 3, "민지"))

    assert sess.pipeline.update_calls == []


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
            bundle_to_messages(sess.bundle, speaker={"name": "민지", "l2p_data": None})
        ]
        # [sion/T-252] 미러 단언(재조립 결과와의 항등)만으로는 persona_prompt 포맷이
        # 깨져도 못 잡는다 — 실제 content에 화자 이름이 들어갔는지 직접 확인한다.
        assert '지금 너와 통화 중인 상대는 "민지" 이다.' in sess.pipeline.update_calls[0][0]["content"]
    finally:
        asyncio.set_event_loop(None)
        loop.close()


# ---------------------------------------------------------------------------
# 4. learn 라우팅: current_speaker 있으면 post_learn_person, 없으면 기존 _post_learn
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
# 5. 화자 교대(A→B) → B로 재조립(중첩 없음, 기존 A 힌트 잔존 X)
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
    # T-252: 재조립이므로 매번 화자 1명 선언만 존재 — 민지 힌트가 잔존(중첩)하지 않음
    assert final == bundle_to_messages(sess.bundle, speaker={"name": "철수", "l2p_data": None})
    assert "민지" not in final[0]["content"]


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
    # persona 스왑: 3회 전부 트리거되고, 마지막이 A로 재조립(고착 없음)
    assert len(sess.pipeline.update_calls) == 3
    assert sess.pipeline.update_calls[-1] == bundle_to_messages(sess.bundle, speaker={"name": "A", "l2p_data": None})
    # [sion/T-252] 미러 단언만으로는 포맷 회귀를 못 잡는다 — 마지막 재조립 content에
    # 복귀한 화자(A)만 있고 직전 화자(B) 정보는 잔존하지 않는지 직접 확인한다.
    final_content = sess.pipeline.update_calls[-1][0]["content"]
    assert '지금 너와 통화 중인 상대는 "A" 이다.' in final_content
    assert "B" not in final_content
    assert sess.current_speaker == (3, "A")
