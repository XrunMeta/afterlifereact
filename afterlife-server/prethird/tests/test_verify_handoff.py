"""test_verify_handoff — /oth-path person 오버레이 + /oth-path 프록시."""
import sys, pathlib
import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import chat_endpoint as ce  # noqa: E402


def _app():
    app = web.Application()
    ce.register_verify_routes(app)
    return app


async def _fake_bundle(api_base, clone_id, token):
    return {"personaBundle": {"persona": {"displayName": "청이"}}}


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
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")  # 오버레이는 DEV_SECRET 설정 시에만 시도(브리프 c 가드)
    monkeypatch.setattr(ce, "fetch_bundle", _fake_bundle)
    monkeypatch.setattr(ce, "chat_stream", _fake_stream)
    monkeypatch.setattr(ce, "bundle_to_messages", lambda b: [{"role": "system", "content": "BASE"}])

    async def fake_dev_l2p(clone_id, person_id):
        return {"data": {"relation": "형", "preference_personal": {"음료": "아메리카노"}}, "displayName": "형"}
    monkeypatch.setattr(ce, "_dev_l2p_data", fake_dev_l2p)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "messages": [{"role": "user", "content": "안녕"}], "person_id": 3})
        assert resp.status == 200
        text = await resp.text()
    assert "현재 화면의 화자: 형" in text and "관계=형" in text


@pytest.mark.asyncio
async def test_chat_no_hint_without_person(monkeypatch):
    monkeypatch.setattr(ce, "fetch_bundle", _fake_bundle)
    monkeypatch.setattr(ce, "chat_stream", _fake_stream)
    monkeypatch.setattr(ce, "bundle_to_messages", lambda b: [{"role": "system", "content": "BASE"}])
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "messages": [{"role": "user", "content": "안녕"}]})
        assert resp.status == 200
        assert "현재 화면의 화자" not in await resp.text()


@pytest.mark.asyncio
async def test_chat_no_hint_when_l2p_lookup_fails(monkeypatch):
    """_dev_l2p_data 실패/404({}) → 힌트 없이 진행(통화 무영향 원칙·문구 일치)."""
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")
    monkeypatch.setattr(ce, "fetch_bundle", _fake_bundle)
    monkeypatch.setattr(ce, "chat_stream", _fake_stream)
    monkeypatch.setattr(ce, "bundle_to_messages", lambda b: [{"role": "system", "content": "BASE"}])

    async def fake_dev_l2p(clone_id, person_id):
        return {}  # 404/실패 폴백 모사
    monkeypatch.setattr(ce, "_dev_l2p_data", fake_dev_l2p)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "messages": [{"role": "user", "content": "안녕"}], "person_id": 3})
        assert resp.status == 200
        assert "현재 화면의 화자" not in await resp.text()


@pytest.mark.asyncio
async def test_chat_name_only_hint_before_learning(monkeypatch):
    """person 유효하나 학습전(data=None) → 이름만 힌트, 관계기억 미포함."""
    monkeypatch.setattr(ce, "_DEV_SECRET", "devsecret")
    monkeypatch.setattr(ce, "fetch_bundle", _fake_bundle)
    monkeypatch.setattr(ce, "chat_stream", _fake_stream)
    monkeypatch.setattr(ce, "bundle_to_messages", lambda b: [{"role": "system", "content": "BASE"}])

    async def fake_dev_l2p(clone_id, person_id):
        return {"data": None, "displayName": "형"}
    monkeypatch.setattr(ce, "_dev_l2p_data", fake_dev_l2p)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", headers={"Authorization": "Bearer T"},
            json={"clone_id": 9055, "messages": [{"role": "user", "content": "안녕"}], "person_id": 3})
        assert resp.status == 200
        text = await resp.text()
    assert "현재 화면의 화자: 형" in text and "관계 기억" not in text


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
