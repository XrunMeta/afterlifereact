"""test_verify_routes — PRETHIRD_VERIFY_ENABLED 플래그에 따른 /oth-path 등록."""
import sys, pathlib
import pytest
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from signaling import make_app  # noqa: E402


@pytest.mark.asyncio
async def test_verify_disabled_by_default(monkeypatch):
    monkeypatch.delenv("PRETHIRD_VERIFY_ENABLED", raising=False)
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        resp = await client.get("/oth-path",
                                headers={"Authorization": "Bearer T"})
        assert resp.status == 404  # 라우트 미등록


@pytest.mark.asyncio
async def test_verify_enabled_registers(monkeypatch):
    monkeypatch.setenv("PRETHIRD_VERIFY_ENABLED", "1")
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        # 토큰 없이 호출 → 라우트는 존재하므로 401(404 아님)
        resp = await client.get("/oth-path")
        assert resp.status == 401


_KNOWLEDGE_ROUTES = [
    ("get", "/oth-path"),
    ("get", "/oth-path"),
    ("post", "/oth-path"),
    ("put", "/oth-path"),
]


@pytest.mark.asyncio
async def test_knowledge_routes_disabled_by_default(monkeypatch):
    monkeypatch.delenv("PRETHIRD_VERIFY_ENABLED", raising=False)
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        for method, path in _KNOWLEDGE_ROUTES:
            resp = await client.request(method.upper(), path)
            assert resp.status == 404, path  # 라우트 미등록


@pytest.mark.asyncio
async def test_knowledge_routes_enabled_require_bearer(monkeypatch):
    monkeypatch.setenv("PRETHIRD_VERIFY_ENABLED", "1")
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        for method, path in _KNOWLEDGE_ROUTES:
            # 토큰 없이 호출 → 라우트는 존재하므로 401(404 아님)
            resp = await client.request(method.upper(), path)
            assert resp.status == 401, path
