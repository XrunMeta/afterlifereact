"""test_verify_bundle — GET /oth-path (L0/L1/L2 분리 조회)."""
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


@pytest.mark.asyncio
async def test_bundle_no_token_401():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.get("/oth-path?clone_id=1")
        assert resp.status == 401


@pytest.mark.asyncio
async def test_bundle_bad_clone_id_400():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.get("/oth-path?clone_id=abc",
                                headers={"Authorization": "Bearer T"})
        assert resp.status == 400


@pytest.mark.asyncio
async def test_bundle_splits_l0_l1_l2(monkeypatch):
    async def fake_fetch_bundle(api_base, clone_id, token):
        return {"personaBundle": {
            "cloneId": str(clone_id),
            "l0": {"rules_text": "안전지침", "blocklist": ["욕설"]},
            "persona": {
                "displayName": "모군", "relation": "친구", "tone": "사투리",
                "personality_core": "다정",
                "memory_summary": "반려동물: 고양이", "relationship": "20년 친구",
                "context": "", "recent_topics": "고양이"}}}
    monkeypatch.setattr(ce, "fetch_bundle", fake_fetch_bundle)
    async with TestClient(TestServer(_app())) as client:
        resp = await client.get("/oth-path?clone_id=9043",
                                headers={"Authorization": "Bearer T"})
        assert resp.status == 200
        body = await resp.json()
    # L0
    assert body["l0"]["rules_text"] == "안전지침"
    assert body["l0"]["blocklist"] == ["욕설"]
    # L2: 고정 4필드만
    assert set(body["l2"].keys()) == {"memory_summary", "relationship", "context", "recent_topics"}
    assert body["l2"]["memory_summary"] == "반려동물: 고양이"
    # L1: L2 4필드 제외 나머지
    assert body["l1"]["displayName"] == "모군"
    assert body["l1"]["tone"] == "사투리"
    assert "memory_summary" not in body["l1"]


@pytest.mark.asyncio
async def test_bundle_empty_when_none(monkeypatch):
    async def fake_fetch_bundle(api_base, clone_id, token):
        return None
    monkeypatch.setattr(ce, "fetch_bundle", fake_fetch_bundle)
    async with TestClient(TestServer(_app())) as client:
        resp = await client.get("/oth-path?clone_id=1",
                                headers={"Authorization": "Bearer T"})
        assert resp.status == 200
        body = await resp.json()
    assert body["l0"] == {} and body["l1"] == {}
    assert body["l2"] == {"memory_summary": "", "relationship": "", "context": "", "recent_topics": ""}
