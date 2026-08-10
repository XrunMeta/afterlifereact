"""test_verify_handoff — /oth-path person 오버레이 + /oth-path 프록시."""
import sys, pathlib
import json
import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import chat_endpoint as ce  # noqa: E402


def _app():
    app = web.Application()
    ce.register_verify_routes(app)
    return app


# [T-252] tone 등 실제 렌더 필드가 하나도 없으면 bundle_to_messages가 통째로
# []을 반환한다(빈 프롬프트는 의미 없다는 설계) — 재조립 결과를 검증하는
# 테스트가 실제로 system 메시지를 받도록 최소 self 필드를 하나 채운다.
#
# [T-252 fix round 2 / el 지적] persona 에 _OTHER_LABELS 키(relation·
# preference_personal·memories_personal)를 반드시 채운다. 이게 없으면
# "## 상대 정보" 블록이 애초에 생성될 수 없어서 아래 부재 단언들이 전부
# 공허 통과(vacuous)한다 — 실제로 BLOCKER 1(계정주 L2 오귀속) 수정을 되돌려도
# 이 파일은 한 건도 FAIL 하지 않았다. 값은 계정주(viewer) 소유임을 이름으로
# 알아볼 수 있게 지었다.
_ACCOUNT_L2 = {
    "relation": "이웃",
    "preference_personal": {"음료": "보리차"},
    "memories_personal": ["계정주와 작년에 이사 옴"],
}


async def _fake_bundle(api_base, clone_id, token):
    return {"personaBundle": {"persona": {
        "displayName": "청이", "tone": "차분함", **_ACCOUNT_L2,
    }}}


def _final_system_content(sse_text: str) -> str:
    """SSE 응답 본문에서 done 이벤트의 final_messages[0].content를 꺼낸다.
    raw SSE 텍스트는 JSON 이스케이프(\\") 상태라 조립된 프롬프트 원문(따옴표 포함)을
    문자열로 직접 assert하면 이스케이프 형태 불일치로 깨진다 — JSON 파싱을 거쳐
    실제 조립 결과를 비교한다."""
    done_line = sse_text.split("event: done\ndata: ", 1)[1]
    done = json.loads(done_line.strip())
    messages = done["debug"]["final_messages"]
    system_msgs = [m["content"] for m in messages if m["role"] == "system"]
    return system_msgs[0] if system_msgs else ""


async def _fake_stream(messages, model=None, temperature=None):
    yield "응"


@pytest.mark.asyncio
async def test_l2p_route_returns_speaker_l2(monkeypatch):
    """[T-116 버그수정] GET /oth-path — 화자별 clone_ont_person 조회(L2 패널 표시용)."""
    async def fake_dev_l2p(clone_id, person_id):
        return {"data": {"relation": "형", "preference_personal": {"음료": "아메리카노"}}, "displayName": "형"}
    monkeypatch.setattr(ce, "_dev_l2p_data", fake_dev_l2p)
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")
    async with TestClient(TestServer(_app())) as client:
        resp = await client.get("/oth-path?clone_id=9055&person_id=3", headers={"Authorization": "Bearer T"})
        assert resp.status == 200
        body = await resp.json()
        assert body["displayName"] == "형"
        assert body["data"]["relation"] == "형"


@pytest.mark.asyncio
async def test_l2p_route_401_without_token():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.get("/oth-path?clone_id=9055&person_id=3")
        assert resp.status == 401


@pytest.mark.asyncio
async def test_l2p_route_400_bad_params(monkeypatch):
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")
    async with TestClient(TestServer(_app())) as client:
        resp = await client.get("/oth-path?clone_id=abc&person_id=3", headers={"Authorization": "Bearer T"})
        assert resp.status == 400


@pytest.mark.asyncio
async def test_chat_injects_speaker_hint(monkeypatch):
    """[T-252] dev L2'도 append 힌트가 아니라 bundle_to_messages(bundle, speaker=...)
    재조립으로 나온다 — bundle_to_messages는 목킹하지 않고(실제 재조립 검증을 위해),
    fetch_bundle/dev_l2p만 목킹해 실제 조립 결과 문구를 확인한다."""
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")  # 오버레이는 DEV_SECRET 설정 시에만 시도(브리프 c 가드)
    monkeypatch.setattr(ce, "fetch_bundle", _fake_bundle)
    monkeypatch.setattr(ce, "chat_stream", _fake_stream)

    async def fake_dev_l2p(clone_id, person_id):
        return {"data": {"relation": "형", "preference_personal": {"음료": "아메리카노"}}, "displayName": "형"}
    monkeypatch.setattr(ce, "_dev_l2p_data", fake_dev_l2p)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "messages": [{"role": "user", "content": "안녕"}], "person_id": 3})
        assert resp.status == 200
        content = _final_system_content(await resp.text())
    assert '지금 너와 통화 중인 상대는 "형" 이다.' in content and "너와의 관계: 형" in content


@pytest.mark.asyncio
async def test_chat_no_hint_without_person(monkeypatch):
    """[T-252] person_id가 없으면 speaker=None으로 재조립 — 기본 상대(viewer) 경로.
    bundle에 viewer가 없으므로 이름 미확인 상태(state 3) 머리말로 떨어진다.

    [fix round 2] `"형" not in text` 만으로는 약하다 — dev 조회를 목킹하지 않으면
    "형" 이라는 문자열의 출처가 애초에 없어 항상 통과한다. dev 조회를 **성공하도록**
    목킹해 두고, person_id 가 없으면 그 결과가 프롬프트에 실리지 않는다는 것을
    단언해야 실효가 있다."""
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")
    monkeypatch.setattr(ce, "fetch_bundle", _fake_bundle)
    monkeypatch.setattr(ce, "chat_stream", _fake_stream)

    async def fake_dev_l2p(clone_id, person_id):
        return {"data": {"relation": "형"}, "displayName": "형"}
    monkeypatch.setattr(ce, "_dev_l2p_data", fake_dev_l2p)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "messages": [{"role": "user", "content": "안녕"}]})
        assert resp.status == 200
        text = await resp.text()
        content = _final_system_content(text)
    assert "상대의 이름은 아직 확인되지 않았다" in content
    assert "형" not in text                        # person_id 없음 → L2' 미조회
    # speaker=None 이면 상대 정보는 계정주 L2 다(상태 1·3 폴백은 옳다).
    assert "계정주와 작년에 이사 옴" in content


@pytest.mark.asyncio
async def test_chat_no_hint_when_l2p_lookup_fails(monkeypatch):
    """[T-252 fix / el I-3] _dev_l2p_data 실패/404({}) 여도 person_id 가 주어졌으면
    화자 확정 경로(speaker_given)로 간다 — 통화 경로와 동일하게. 이름을 모르므로
    상태 3 문안으로 떨어지고, 계정주 L2 를 상대 것으로 쓰지 않는다."""
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")
    monkeypatch.setattr(ce, "fetch_bundle", _fake_bundle)
    monkeypatch.setattr(ce, "chat_stream", _fake_stream)

    async def fake_dev_l2p(clone_id, person_id):
        return {}  # 404/실패 폴백 모사
    monkeypatch.setattr(ce, "_dev_l2p_data", fake_dev_l2p)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "messages": [{"role": "user", "content": "안녕"}], "person_id": 3})
        assert resp.status == 200
        content = _final_system_content(await resp.text())
    assert "상대의 이름은 아직 확인되지 않았다" in content
    # [fix round 2] 핵심 단언은 "계정주 L2 가 확정 화자 것으로 새지 않는다" 다 —
    # `"형" not in`(조회가 {} 라 애초에 출처가 없다)은 공허하므로 이걸로 대체한다.
    assert "\n## 상대 정보\n" not in content
    assert "계정주와 작년에 이사 옴" not in content
    assert "보리차" not in content
    assert "이웃" not in content


@pytest.mark.asyncio
async def test_chat_name_only_hint_before_learning(monkeypatch):
    """person 유효하나 학습전(data=None) → 이름만 힌트, 관계기억(상대 정보 섹션) 미포함."""
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")
    monkeypatch.setattr(ce, "fetch_bundle", _fake_bundle)
    monkeypatch.setattr(ce, "chat_stream", _fake_stream)

    async def fake_dev_l2p(clone_id, person_id):
        return {"data": None, "displayName": "형"}
    monkeypatch.setattr(ce, "_dev_l2p_data", fake_dev_l2p)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "messages": [{"role": "user", "content": "안녕"}], "person_id": 3})
        assert resp.status == 200
        content = _final_system_content(await resp.text())
    assert '지금 너와 통화 중인 상대는 "형" 이다.' in content
    # 머리말 규칙 문장이 "## 상대 정보"를 인용부호로 언급하므로, 실제 섹션 헤딩
    # (줄 단위)이 없는지로 검사한다 — L2' 가 없으면 섹션 자체가 생기지 않는다.
    # [fix round 2] 이 단언이 실효를 가지려면 _fake_bundle 의 persona 에 상대 필드가
    # 있어야 한다(없으면 어떤 구현이든 섹션이 안 생겨 항상 통과).
    assert "\n## 상대 정보\n" not in content
    assert "계정주와 작년에 이사 옴" not in content   # 계정주 L2 가 "형" 것으로 새지 않는다
    assert "아직 이 사람에 대해 기억하는 것이 없다" in content


@pytest.mark.asyncio
async def test_chat_숫자_person_id는_이름으로_주입되지_않는다(monkeypatch):
    """[T-252 fix / el I-3] `name = displayName or str(person_id)` 폴백이 있으면
    `지금 너와 통화 중인 상대는 "7" 이다` 처럼 숫자가 이름으로 박힌다."""
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")
    monkeypatch.setattr(ce, "fetch_bundle", _fake_bundle)
    monkeypatch.setattr(ce, "chat_stream", _fake_stream)

    async def fake_dev_l2p(clone_id, person_id):
        return {"data": {"relation": "친구"}, "displayName": None}
    monkeypatch.setattr(ce, "_dev_l2p_data", fake_dev_l2p)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "messages": [{"role": "user", "content": "안녕"}], "person_id": 7})
        assert resp.status == 200
        content = _final_system_content(await resp.text())
    assert '"7"' not in content
    assert "상대의 이름은 아직 확인되지 않았다" in content   # 상태 3 강등
    assert "너와의 관계: 친구" in content                    # L2' 데이터는 살린다


@pytest.mark.asyncio
async def test_chat_dev조회_실패시_통화경로와_같은_상태를_낸다(monkeypatch):
    """verify 가 실통화를 대표하려면 같은 입력에 같은 프롬프트가 나와야 한다.
    통화 경로는 fetch_l2p 실패 시 {"name":None,"l2p_data":None} 을 넘긴다."""
    from clone_dialog import bundle_to_messages
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")
    monkeypatch.setattr(ce, "fetch_bundle", _fake_bundle)
    monkeypatch.setattr(ce, "chat_stream", _fake_stream)

    async def fake_dev_l2p(clone_id, person_id):
        return {}
    monkeypatch.setattr(ce, "_dev_l2p_data", fake_dev_l2p)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "messages": [{"role": "user", "content": "안녕"}], "person_id": 3})
        content = _final_system_content(await resp.text())

    bundle = await _fake_bundle(None, 9055, None)
    call_path = bundle_to_messages(bundle, speaker={"name": None, "l2p_data": None})
    assert content == call_path[0]["content"]


@pytest.mark.asyncio
async def test_chat_speaker_state_unknown이면_상태4(monkeypatch):
    """[T-252 fix] 상태 4를 실서버 라우트로 검증할 수단이 없었다(el I-3 부수)."""
    monkeypatch.setattr(ce, "fetch_bundle", _fake_bundle)
    monkeypatch.setattr(ce, "chat_stream", _fake_stream)
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "messages": [{"role": "user", "content": "안녕"}],
                  "speaker_state": "unknown"})
        content = _final_system_content(await resp.text())
    assert "누구인지는 확정하지 못했다" in content
    assert "이름으로 부르지 마라" in content


@pytest.mark.asyncio
async def test_persons_no_token_401():
    async with TestClient(TestServer(_app())) as client:
        assert (await client.get("/oth-path?clone_id=9055")).status == 401
        assert (await client.post("/oth-path", json={})).status == 401


@pytest.mark.asyncio
async def test_learn_routes_to_person_when_person_given(monkeypatch):
    calls = {}

    async def fake_extract(user_text, clone_reply):
        return {"relation": "형"}
    monkeypatch.setattr(ce, "extract_l2", fake_extract)

    async def fake_dev_l2p(clone_id, person_id):
        return {"data": {}, "displayName": "형"}
    monkeypatch.setattr(ce, "_dev_l2p_data", fake_dev_l2p)

    async def fake_merge_person(clone_id, person_id, extracted):
        calls["person_id"] = person_id
        return {"relation": "형"}
    monkeypatch.setattr(ce, "_ont_merge_person", fake_merge_person)
    monkeypatch.setattr(ce, "_DEV_SECRET", "x")

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "person_id": 3,
                  "turns": [{"role": "user", "content": "나 형이야"}, {"role": "assistant", "content": "안녕 형"}]})
        assert resp.status == 200
    assert calls.get("person_id") == 3


def test_face_event_rejects_mismatched_clone():
    """T-257: face_event 에 clone_id 가 실려 오면 세션 clone_id 와 대조한다.

    서버(/match)가 이미 클론 스코프를 강제하지만, personId 를 신뢰하는 지점에
    방어 1층을 둔다(T-135 IDOR 교훈 — say payload personId 신뢰가 CRITICAL 이었다).
    """
    from signaling import face_event_clone_matches

    assert face_event_clone_matches(session_clone_id=42, event_clone_id=42) is True
    assert face_event_clone_matches(session_clone_id=42, event_clone_id=43) is False
    # clone_id 미포함(구 클라이언트)은 통과 — 서버 게이트가 정본이므로 하위호환 유지
    assert face_event_clone_matches(session_clone_id=42, event_clone_id=None) is True


def test_face_event_clone_matches_malformed_input_never_raises():
    """T-257 리뷰 수정: event_clone_id 는 datachannel 로 들어오는 신뢰 불가 입력이다.

    정수로 해석 불가능한 값(비수치 문자열/list/dict)이 들어와도 예외를 던지지
    않고 "해석 불가 = 불일치"로 fail-closed 되어야 한다(브리프 제약: 통화를
    방해하는 예외가 아니라 로그+드랍). 리뷰에서 지적된 재현 사례를 그대로 고정한다.
    """
    from signaling import face_event_clone_matches

    # 비수치 문자열 — ValueError 를 던지지 않고 False
    assert face_event_clone_matches(42, "abc") is False
    # list — TypeError 를 던지지 않고 False
    assert face_event_clone_matches(42, [1, 2]) is False
    # dict — TypeError 를 던지지 않고 False
    assert face_event_clone_matches(42, {"a": 1}) is False


def test_face_event_clone_matches_numeric_string_is_deliberate_match():
    """숫자만 담은 문자열("42")은 int() 로 깔끔히 파싱되므로 매치로 취급한다
    (의도적 결정 — 우연이 아니라 명시적으로 고정해 둔다)."""
    from signaling import face_event_clone_matches

    assert face_event_clone_matches(42, "42") is True
    assert face_event_clone_matches(42, "43") is False


def test_face_event_clone_matches_bool_never_matches():
    """bool 은 int 서브클래스라 int(True)==1 처럼 우연히 일치할 수 있다 — clone_id
    로 인정하지 않고 항상 불일치(False) 로 명시 처리한다(의도적 결정)."""
    from signaling import face_event_clone_matches

    assert face_event_clone_matches(1, True) is False
    assert face_event_clone_matches(0, False) is False


def test_face_event_clone_matches_infinity_never_raises():
    """[재리뷰 fix] int(float('inf')) 는 ValueError/TypeError 가 아니라
    OverflowError 를 던진다 — 이전 `except (TypeError, ValueError)` 로는 못 잡고
    새어나갔다. `except Exception` 으로 광범위하게 잡아야 재발하지 않는다.
    ±Infinity 둘 다 예외 없이 False(불일치)로 떨어져야 한다.
    """
    from signaling import face_event_clone_matches

    assert face_event_clone_matches(42, float("inf")) is False
    assert face_event_clone_matches(42, float("-inf")) is False


def test_face_event_clone_matches_infinity_via_real_json_parse():
    """[재리뷰 fix] 손으로 만든 파이썬 값이 아니라, 실제 공격 경로와 동일하게
    원시 JSON 문자열을 `json.loads` 로 파싱해서 통과시킨다.

    표준 json 모듈은 기본 `parse_constant` 로 `Infinity`/`-Infinity`/`NaN` 비표준
    토큰을 허용한다 — `_on_msg`(signaling.py) 가 이 표준 `json.loads` 를 그대로
    쓰므로 `{"type":"face_event","clone_id":Infinity}` 페이로드가 실제로
    `face_event_clone_matches` 까지 float('inf') 로 도달할 수 있다. 이 테스트는
    손으로 만든 파이썬 값이 아니라 그 실제 경로를 재현해야 이런 간극이
    보인다(이전 테스트들은 전부 직접 파이썬 값을 넣어 이 간극을 놓쳤다).
    """
    import json
    from signaling import face_event_clone_matches

    payload = json.loads('{"type":"face_event","event":"speaker_confirmed","clone_id":Infinity}')
    assert payload["clone_id"] == float("inf")
    assert face_event_clone_matches(42, payload["clone_id"]) is False

    payload_neg = json.loads('{"type":"face_event","event":"speaker_confirmed","clone_id":-Infinity}')
    assert face_event_clone_matches(42, payload_neg["clone_id"]) is False
