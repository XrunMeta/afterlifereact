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
