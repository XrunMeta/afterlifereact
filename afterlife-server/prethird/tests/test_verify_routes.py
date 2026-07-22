"""test_verify_routes — PRETHIRD_VERIFY_ENABLED 플래그에 따른 /oth-path 등록."""
import sys, pathlib
import pytest
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from signaling import make_app  # noqa: E402
import chat_endpoint  # noqa: E402


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


@pytest.mark.asyncio
async def test_autoanswer_route_disabled_by_default(monkeypatch):
    monkeypatch.delenv("PRETHIRD_VERIFY_ENABLED", raising=False)
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        resp = await client.post("/oth-path")
        assert resp.status == 404  # 라우트 미등록


@pytest.mark.asyncio
async def test_autoanswer_route_enabled_requires_bearer(monkeypatch):
    monkeypatch.setenv("PRETHIRD_VERIFY_ENABLED", "1")
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        # 토큰 없이 호출 → 라우트는 존재하므로 401(404 아님)
        resp = await client.post("/oth-path")
        assert resp.status == 401


def _fake_chat_once(return_value=None, raise_exc=None):
    """chat_endpoint.chat_once 시그니처(messages, temperature=..) 를 흉내내는 async mock."""
    async def _fake(messages, temperature=None, **kwargs):
        if raise_exc is not None:
            raise raise_exc
        return return_value
    return _fake


@pytest.mark.asyncio
@pytest.mark.parametrize("blank_raw", ["   ", '"', '""'])
async def test_autoanswer_blank_raw_returns_502_not_500(monkeypatch, blank_raw):
    """[Fix 1] chat_once 가 공백/따옴표뿐인 문자열을 반환해도 IndexError→500 이 아니라 502 여야 한다."""
    monkeypatch.setenv("PRETHIRD_VERIFY_ENABLED", "1")
    monkeypatch.setattr(chat_endpoint, "chat_once", _fake_chat_once(return_value=blank_raw))
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        resp = await client.post("/oth-path",
                                  headers={"Authorization": "Bearer T"},
                                  json={"question": "취미가 뭐예요?"})
        assert resp.status == 502
        data = await resp.json()
        assert data.get("error") == "empty_answer"


@pytest.mark.asyncio
async def test_autoanswer_normal_answer_returns_200(monkeypatch):
    """앞뒤 따옴표 제거 확인(quote strip 은 전체 문자열 양끝 기준)."""
    monkeypatch.setenv("PRETHIRD_VERIFY_ENABLED", "1")
    monkeypatch.setattr(
        chat_endpoint, "chat_once",
        _fake_chat_once(return_value='"등산을 좋아해"'),
    )
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        resp = await client.post("/oth-path",
                                  headers={"Authorization": "Bearer T"},
                                  json={"question": "취미가 뭐예요?"})
        assert resp.status == 200
        data = await resp.json()
        assert data == {"answer": "등산을 좋아해"}


@pytest.mark.asyncio
async def test_autoanswer_multiline_takes_first_line_only(monkeypatch):
    """여러 줄 반환 시 첫 줄만 사용(splitlines()[0])."""
    monkeypatch.setenv("PRETHIRD_VERIFY_ENABLED", "1")
    monkeypatch.setattr(
        chat_endpoint, "chat_once",
        _fake_chat_once(return_value="등산을 좋아해\n둘째 줄은 버려짐"),
    )
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        resp = await client.post("/oth-path",
                                  headers={"Authorization": "Bearer T"},
                                  json={"question": "취미가 뭐예요?"})
        assert resp.status == 200
        data = await resp.json()
        assert data == {"answer": "등산을 좋아해"}


@pytest.mark.asyncio
async def test_autoanswer_llm_exception_returns_502(monkeypatch):
    monkeypatch.setenv("PRETHIRD_VERIFY_ENABLED", "1")
    monkeypatch.setattr(
        chat_endpoint, "chat_once",
        _fake_chat_once(raise_exc=RuntimeError("boom")),
    )
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        resp = await client.post("/oth-path",
                                  headers={"Authorization": "Bearer T"},
                                  json={"question": "취미가 뭐예요?"})
        assert resp.status == 502
        data = await resp.json()
        assert data.get("error") == "llm_failed"
