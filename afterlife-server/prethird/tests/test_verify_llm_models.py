"""test_verify_llm_models — /oth-path 엔드포인트.

`/oth-path` 웹페이지의 모델 드롭다운을 채운다. CF 라이브 목록에 실측 메타를 얹어
내려주되, **CF 를 못 불러도 화면은 살아 있어야 한다**(카탈로그 폴백).
"""
import pathlib
import sys

import pytest
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from signaling import make_app  # noqa: E402
import chat_endpoint  # noqa: E402


@pytest.fixture(autouse=True)
def _enable_verify(monkeypatch):
    monkeypatch.setenv("PRETHIRD_VERIFY_ENABLED", "1")
    monkeypatch.delenv("PRETHIRD_VERIFY_PASS", raising=False)


async def _get(client, **kw):
    return await client.get("/oth-path",
                            headers={"Authorization": "Bearer T"}, **kw)


@pytest.mark.asyncio
async def test_route_registered_and_needs_auth(monkeypatch):
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        resp = await client.get("/oth-path")
        assert resp.status == 401          # 라우트는 있다(404 아님)


@pytest.mark.asyncio
async def test_route_absent_when_verify_disabled(monkeypatch):
    monkeypatch.delenv("PRETHIRD_VERIFY_ENABLED", raising=False)
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        assert (await client.get("/oth-path")).status == 404


@pytest.mark.asyncio
async def test_returns_live_models_with_measurements(monkeypatch):
    async def fake_list(*a, **kw):
        return ["@cf/meta/llama-4-scout-17b-16e-instruct",
                "@cf/aisingapore/gemma-sea-lion-v4-27b-it"]
    monkeypatch.setattr(chat_endpoint, "_cf_list_models", fake_list)
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        resp = await _get(client)
        assert resp.status == 200
        body = await resp.json()
    assert body["source"] == "live"
    names = [r["name"] for r in body["cf"]]
    assert names == ["@cf/meta/llama-4-scout-17b-16e-instruct",
                     "@cf/aisingapore/gemma-sea-lion-v4-27b-it"]   # call, TTFT 순
    assert body["cf"][0]["value"] == "cfai:@cf/meta/llama-4-scout-17b-16e-instruct"
    assert body["cf"][0]["tier"] == "call"


@pytest.mark.asyncio
async def test_falls_back_to_catalog_when_cf_unreachable(monkeypatch):
    """CF 토큰이 없거나 네트워크가 막혀도 드롭다운은 채워져야 한다."""
    async def boom(*a, **kw):
        raise RuntimeError("no token")
    monkeypatch.setattr(chat_endpoint, "_cf_list_models", boom)
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        resp = await _get(client)
        assert resp.status == 200
        body = await resp.json()
    assert body["source"] == "catalog"
    assert len(body["cf"]) > 10
    assert body["cf"][0]["tier"] == "call"


@pytest.mark.asyncio
async def test_always_offers_ollama_default(monkeypatch):
    """기준선(ollama)으로 되돌아갈 선택지가 항상 있어야 A/B 가 성립한다."""
    async def fake_list(*a, **kw):
        return ["@cf/meta/llama-4-scout-17b-16e-instruct"]
    monkeypatch.setattr(chat_endpoint, "_cf_list_models", fake_list)
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        body = await (await _get(client)).json()
    assert body["ollama"]["value"] == ""      # 빈 값 = 서버 기본 모델 그대로
    assert "ollama" in body["ollama"]["label"]


@pytest.mark.asyncio
async def test_new_live_model_surfaces_as_unknown(monkeypatch):
    async def fake_list(*a, **kw):
        return ["@cf/brand/new-model-9"]
    monkeypatch.setattr(chat_endpoint, "_cf_list_models", fake_list)
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        body = await (await _get(client)).json()
    assert body["cf"][0]["tier"] == "unknown"
