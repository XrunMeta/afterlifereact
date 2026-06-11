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

# ── /prebuild 핸들러 테스트 ──────────────────────────────────────────────────

from aiohttp import web
from aiohttp.test_utils import make_mocked_request

def _make_app_with_prebuild(monkeypatch, secret="s3cr3t"):
    import prebuild
    calls = {"ensure": [], "stt": []}

    async def fake_ensure(clone_id, voice_raw_url, ref_root):
        calls["ensure"].append((clone_id, voice_raw_url, ref_root))
        return True

    async def fake_stt(clone_id, stt_url="http://127.0.0.1:8202"):
        calls["stt"].append(clone_id)
        return True

    monkeypatch.setattr(prebuild, "ensure_voice_wav", fake_ensure)
    monkeypatch.setattr(prebuild, "transcribe_clone", fake_stt)
    monkeypatch.setenv("PREBUILD_SECRET", secret)
    return prebuild, calls

@pytest.mark.asyncio
async def test_prebuild_rejects_bad_secret(monkeypatch):
    prebuild, _ = _make_app_with_prebuild(monkeypatch)
    req = make_mocked_request("POST", "/prebuild",
                              headers={"Authorization": "Bearer wrong"})
    async def _json(): return {"cloneId": "9099", "voiceRawUrl": "http://x/raw"}
    req.json = _json
    resp = await prebuild.prebuild_handler(req)
    assert resp.status == 401

@pytest.mark.asyncio
async def test_prebuild_missing_body_400(monkeypatch):
    prebuild, _ = _make_app_with_prebuild(monkeypatch)
    req = make_mocked_request("POST", "/prebuild",
                              headers={"Authorization": "Bearer s3cr3t"})
    async def _json(): return {"cloneId": "9099"}  # voiceRawUrl 누락
    req.json = _json
    resp = await prebuild.prebuild_handler(req)
    assert resp.status == 400

@pytest.mark.asyncio
async def test_prebuild_accepts_and_runs_background(monkeypatch):
    prebuild, calls = _make_app_with_prebuild(monkeypatch)
    req = make_mocked_request("POST", "/prebuild",
                              headers={"Authorization": "Bearer s3cr3t"})
    async def _json(): return {"cloneId": "9099", "voiceRawUrl": "http://x/raw"}
    req.json = _json
    resp = await prebuild.prebuild_handler(req)
    assert resp.status == 202
    await prebuild._drain_tasks_for_test()
    assert calls["ensure"] == [("9099", "http://x/raw", prebuild.REF_VOICES_ROOT)]
    assert calls["stt"] == ["9099"]
