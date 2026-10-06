"""test_prior_conversation — AFL-926 이전 대화 조회 클라이언트 (네트워크 없음)."""
import sys, pathlib
import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import prior_conversation as pc  # noqa: E402

class _Resp:
    def __init__(self, status, body):
        self.status, self._body = status, body
    async def __aenter__(self): return self
    async def __aexit__(self, *a): return False
    async def json(self): return self._body

class _Sess:
    captured: dict = {}
    reply = (200, {"turns": [{"callId": "c", "role": "user", "text": "hi", "at": 1}], "resetAt": 0})
    def __init__(self, *a, **kw): pass
    async def __aenter__(self): return self
    async def __aexit__(self, *a): return False
    def get(self, url, params=None, headers=None):
        _Sess.captured = {"url": url, "params": params, "headers": headers}
        return _Resp(*_Sess.reply)

@pytest.fixture
def env_on(monkeypatch):
    monkeypatch.setenv("PRETHIRD_PRIOR_CONVERSATION", "1")
    monkeypatch.setenv("ORCH_SECRET", "s3cret")
    monkeypatch.setenv("PRETHIRD_API_BASE", "https://oth-path.example/")
    monkeypatch.setattr(pc.aiohttp, "ClientSession", _Sess)
    _Sess.reply = (200, {"turns": [{"callId": "c", "role": "user", "text": "hi", "at": 1}],
                         "resetAt": 0})

@pytest.mark.asyncio
async def test_disabled_by_default(monkeypatch):
    monkeypatch.delenv("PRETHIRD_PRIOR_CONVERSATION", raising=False)
    monkeypatch.setattr(pc.aiohttp, "ClientSession", _Sess)
    _Sess.captured = {}
    assert await pc.fetch_prior_turns(1, 2) == []
    assert _Sess.captured == {}           # 호출 자체를 안 한다

@pytest.mark.asyncio
async def test_fetch_builds_url_auth_and_params(env_on):
    out = await pc.fetch_prior_turns(7, 9, exclude_call_id="abcdef012345")
    assert out == [{"callId": "c", "role": "user", "text": "hi", "at": 1}]
    c = _Sess.captured
    assert c["url"] == "https://oth-path.example/oth-path"
    assert c["headers"] == {"Authorization": "Bearer s3cret"}
    assert c["params"] == {"maxTurns": "400", "excludeCallId": "abcdef012345"}

@pytest.mark.asyncio
async def test_bad_call_id_not_forwarded(env_on):
    await pc.fetch_prior_turns(7, 9, exclude_call_id="../evil")
    assert "excludeCallId" not in _Sess.captured["params"]

@pytest.mark.asyncio
@pytest.mark.parametrize("reply", [(500, {}), (200, {"turns": "nope"}), (200, ["x"])])
async def test_non_ok_or_bad_shape_returns_empty(env_on, reply):
    _Sess.reply = reply
    assert await pc.fetch_prior_turns(7, 9) == []

@pytest.mark.asyncio
async def test_invalid_ids_and_exceptions_return_empty(env_on, monkeypatch):
    assert await pc.fetch_prior_turns(None, 9) == []
    assert await pc.fetch_prior_turns(0, 9) == []

    class _Boom(_Sess):
        def get(self, *a, **kw):
            raise RuntimeError("network")
    monkeypatch.setattr(pc.aiohttp, "ClientSession", _Boom)
    assert await pc.fetch_prior_turns(7, 9) == []
