"""test_verify_learn — /oth-path·/oth-path 단위.
fetch_bundle·chat_once·api PATCH(_patch_l2)를 monkeypatch.
"""
import sys, pathlib, json
import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import chat_endpoint as ce  # noqa: E402


def _app():
    app = web.Application()
    ce.register_verify_routes(app)
    return app


@pytest.mark.asyncio
async def test_learn_extracts_and_saves(monkeypatch):
    async def fake_fetch_bundle(api_base, clone_id, token):
        return {"personaBundle": {"persona": {
            "displayName": "모군", "memory_summary": "기존요약",
            "relationship": "친구", "context": "", "recent_topics": ""}}}

    async def fake_chat_once(messages, model=None, temperature=None, fmt=None):
        return json.dumps({"memory_summary": "사용자가 제주 여행",
                           "relationship": "친구", "context": "여행 후일담",
                           "recent_topics": "제주, 여행"}, ensure_ascii=False)

    saved = {}
    async def fake_patch_l2(clone_id, fields, token):
        saved.update(fields)
        return fields

    monkeypatch.setattr(ce, "fetch_bundle", fake_fetch_bundle)
    monkeypatch.setattr(ce, "chat_once", fake_chat_once)
    monkeypatch.setattr(ce, "_patch_l2", fake_patch_l2)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 9043, "turns": [
                {"role": "user", "content": "나 제주 다녀왔어"},
                {"role": "assistant", "content": "좋았겠다!"}]})
        assert resp.status == 200
        body = await resp.json()
    assert body["before"]["memory_summary"] == "기존요약"
    assert body["extracted"]["memory_summary"] == "사용자가 제주 여행"
    assert saved["recent_topics"] == "제주, 여행"


@pytest.mark.asyncio
async def test_learn_no_token_401():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", json={"clone_id": 1, "turns": []})
        assert resp.status == 401


@pytest.mark.asyncio
async def test_learn_bad_clone_id_400():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": "../x", "turns": []})
        assert resp.status == 400


@pytest.mark.asyncio
async def test_learn_graceful_on_bad_json(monkeypatch):
    async def fake_fetch_bundle(api_base, clone_id, token):
        return {"personaBundle": {"persona": {"displayName": "모군"}}}
    async def fake_chat_once(messages, model=None, temperature=None, fmt=None):
        return "이건 JSON이 아님"
    monkeypatch.setattr(ce, "fetch_bundle", fake_fetch_bundle)
    monkeypatch.setattr(ce, "chat_once", fake_chat_once)
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 1, "turns": [{"role": "user", "content": "x"}]})
        assert resp.status == 200
        body = await resp.json()
    assert body["extracted"] is None


@pytest.mark.asyncio
async def test_learn_rejects_oversized_turns():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 1, "turns": [{"role": "user", "content": "A" * 2001}]})
        assert resp.status == 400


@pytest.mark.asyncio
async def test_l2_reset(monkeypatch):
    saved = {}
    async def fake_patch_l2(clone_id, fields, token):
        saved.update(fields); return fields
    monkeypatch.setattr(ce, "_patch_l2", fake_patch_l2)
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path",
            headers={"Authorization": "Bearer T"}, json={"clone_id": 9043})
        assert resp.status == 200
    assert saved == {"memory_summary": "", "relationship": "", "context": "", "recent_topics": ""}
