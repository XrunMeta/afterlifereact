"""test_chat_endpoint — /oth-path·/oth-path 핸들러 단위.

fetch_bundle·chat_stream 을 monkeypatch 해 실제 api/ollama 없이 검증.
aiohttp TestClient 로 라우트를 직접 등록해 호출한다.
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
async def test_chat_no_token_401():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", json={"clone_id": 1, "messages": []})
        assert resp.status == 401


@pytest.mark.asyncio
async def test_chat_streams_tokens_and_debug(monkeypatch):
    async def fake_fetch_bundle(api_base, clone_id, token):
        return {"personaBundle": {"cloneId": str(clone_id),
                                  "persona": {"displayName": "할배", "tone": "다정"}}}

    async def fake_chat_stream(messages, model=None, temperature=None):
        # system + user 가 합쳐졌는지 캡처용으로 messages를 모듈에 보관
        ce._LAST_MESSAGES = messages
        for t in ["안", "녕"]:
            yield t

    monkeypatch.setattr(ce, "fetch_bundle", fake_fetch_bundle)
    monkeypatch.setattr(ce, "chat_stream", fake_chat_stream)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post(
            "/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 9043,
                  "messages": [{"role": "user", "content": "안녕?"}]},
        )
        assert resp.status == 200
        text = await resp.text()

    # 토큰 이벤트
    assert "event: token" in text
    assert "안" in text and "녕" in text
    # done + debug
    assert "event: done" in text
    # 마지막 done data 파싱
    done_line = [l for l in text.splitlines() if l.startswith("data:")][-1]
    debug = json.loads(done_line[len("data:"):].strip())["debug"]
    # system(할배) 이 history 앞에 붙었는지
    fm = debug["final_messages"]
    assert fm[0]["role"] == "system" and "할배" in fm[0]["content"]
    assert fm[-1] == {"role": "user", "content": "안녕?"}
    assert debug["persona_bundle"]["persona"]["displayName"] == "할배"


@pytest.mark.asyncio
async def test_chat_system_override(monkeypatch):
    async def fake_fetch_bundle(api_base, clone_id, token):
        return {"personaBundle": {"persona": {"displayName": "할배"}}}

    async def fake_chat_stream(messages, model=None, temperature=None):
        ce._LAST_MESSAGES = messages
        if False:
            yield ""  # 빈 제너레이터

    monkeypatch.setattr(ce, "fetch_bundle", fake_fetch_bundle)
    monkeypatch.setattr(ce, "chat_stream", fake_chat_stream)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.post(
            "/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 1, "messages": [{"role": "user", "content": "hi"}],
                  "system_override": "너는 해적이다"},
        )
        assert resp.status == 200
        await resp.text()

    assert ce._LAST_MESSAGES[0] == {"role": "system", "content": "너는 해적이다"}


@pytest.mark.asyncio
async def test_clones_proxies_and_shrinks(monkeypatch):
    class _R:
        status = 200
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def json(self):
            return {"items": [{"id": 1, "name": "할배", "visibility": "public"},
                              {"id": 2, "name": "민준"}]}

    class _S:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        def get(self, url, headers=None): return _R()

    monkeypatch.setattr(ce.aiohttp, "ClientSession", _S)

    async with TestClient(TestServer(_app())) as client:
        resp = await client.get("/oth-path",
                                headers={"Authorization": "Bearer T"})
        assert resp.status == 200
        body = await resp.json()
    assert body["clones"] == [{"id": 1, "name": "할배"}, {"id": 2, "name": "민준"}]


@pytest.mark.asyncio
async def test_chat_rejects_non_integer_clone_id():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post(
            "/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": "../users/me", "messages": [{"role": "user", "content": "x"}]},
        )
        assert resp.status == 400


@pytest.mark.asyncio
async def test_chat_rejects_oversized_system_override():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post(
            "/oth-path",
            headers={"Authorization": "Bearer T"},
            json={"clone_id": 1, "messages": [{"role": "user", "content": "x"}],
                  "system_override": "A" * 16001},
        )
        assert resp.status == 400


@pytest.mark.asyncio
async def test_login_missing_fields():
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", json={"email": "a@b.com"})
        assert resp.status == 400


@pytest.mark.asyncio
async def test_login_proxies_token(monkeypatch):
    class _R:
        status = 200
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def text(self): return '{"accessToken": "TOK123", "refreshToken": "R"}'

    class _S:
        def __init__(self, *a, **kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        def post(self, url, data=None, headers=None):
            # User-Agent 헤더가 포함됐는지 캡처
            _S.captured_ua = (headers or {}).get("User-Agent")
            return _R()

    monkeypatch.setattr(ce.aiohttp, "ClientSession", _S)
    async with TestClient(TestServer(_app())) as client:
        resp = await client.post("/oth-path", json={"email": "a@b.com", "password": "x"})
        assert resp.status == 200
        body = await resp.json()
    assert body["accessToken"] == "TOK123"
    assert _S.captured_ua and "Mozilla" in _S.captured_ua  # UA 헤더 포함 확인
