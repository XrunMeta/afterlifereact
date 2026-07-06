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
