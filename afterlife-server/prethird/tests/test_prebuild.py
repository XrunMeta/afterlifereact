import sys, os, asyncio, types
import pytest

SCRIPTS = os.path.join(os.path.dirname(__file__), "..", "scripts")
sys.path.insert(0, os.path.abspath(SCRIPTS))

class _FakeResp:
    def __init__(self, status, payload):
        self.status = status
        self._payload = payload
    async def json(self): return self._payload
    async def __aenter__(self): return self
    async def __aexit__(self, *a): return False

class _FakeSession:
    last_url = None
    last_json = None
    resp = _FakeResp(200, {"ok": True, "ref_text": "안녕하세요 반갑습니다"})
    def post(self, url, json=None, timeout=None):
        _FakeSession.last_url = url
        _FakeSession.last_json = json
        return _FakeSession.resp
    async def __aenter__(self): return self
    async def __aexit__(self, *a): return False

@pytest.mark.asyncio
async def test_transcribe_clone_posts_to_8202(monkeypatch):
    import stt_client
    monkeypatch.setattr(stt_client.aiohttp, "ClientSession", lambda *a, **k: _FakeSession())
    ok = await stt_client.transcribe_clone("9099", stt_url="http://127.0.0.1:8202")
    assert ok is True
    assert _FakeSession.last_url == "http://127.0.0.1:8202/transcribe"
    assert _FakeSession.last_json == {"clone_id": "9099"}
