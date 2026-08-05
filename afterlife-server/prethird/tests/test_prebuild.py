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

@pytest.mark.asyncio
async def test_prebuild_checks_ref_quality_after_stt(monkeypatch):
    """STT 직후 ref 품질을 판정한다 — 노이즈 ref 가 조용히 등록되던 구멍(클론 9104)."""
    prebuild, calls = _make_app_with_prebuild(monkeypatch)
    seen = []

    def fake_check(ref_root, clone_id):
        seen.append((ref_root, clone_id))
        return {"density": 1.9, "threshold": 3.5, "ok": False, "reason": "문자밀도 낮음"}

    monkeypatch.setattr(prebuild.ref_quality, "check", fake_check)
    req = make_mocked_request("POST", "/prebuild",
                              headers={"Authorization": "Bearer s3cr3t"})
    async def _json(): return {"cloneId": "9104", "voiceRawUrl": "http://x/raw"}
    req.json = _json
    resp = await prebuild.prebuild_handler(req)
    assert resp.status == 202
    await prebuild._drain_tasks_for_test()
    assert seen == [(prebuild.REF_VOICES_ROOT, "9104")]

@pytest.mark.asyncio
async def test_prebuild_quality_failure_does_not_block(monkeypatch):
    """품질 미달은 경고일 뿐 — 등록 흐름을 막지 않는다(경고 전용 정책)."""
    prebuild, calls = _make_app_with_prebuild(monkeypatch)

    def boom_check(ref_root, clone_id):
        raise RuntimeError("판정 중 예외")

    monkeypatch.setattr(prebuild.ref_quality, "check", boom_check)
    req = make_mocked_request("POST", "/prebuild",
                              headers={"Authorization": "Bearer s3cr3t"})
    async def _json(): return {"cloneId": "9104", "voiceRawUrl": "http://x/raw"}
    req.json = _json
    resp = await prebuild.prebuild_handler(req)
    assert resp.status == 202
    await prebuild._drain_tasks_for_test()
    # 판정이 터져도 voice.wav 생성·STT 는 이미 끝난 상태 그대로여야 한다
    assert calls["ensure"] and calls["stt"] == ["9104"]

@pytest.mark.asyncio
async def test_prebuild_rejects_path_traversal_clone_id(monkeypatch):
    prebuild, calls = _make_app_with_prebuild(monkeypatch)
    req = make_mocked_request("POST", "/prebuild",
                              headers={"Authorization": "Bearer s3cr3t"})
    async def _json(): return {"cloneId": "../../etc/evil", "voiceRawUrl": "http://x/raw"}
    req.json = _json
    resp = await prebuild.prebuild_handler(req)
    assert resp.status == 400
    # 백그라운드 실행 안 됨
    await prebuild._drain_tasks_for_test()
    assert calls["ensure"] == []
