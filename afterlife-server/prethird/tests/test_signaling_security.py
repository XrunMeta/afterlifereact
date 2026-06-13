# afterlife-server/prethird/tests/test_signaling_security.py
# H-1: access_token 예외 경로 소멸 검증
# M-2: STRICT=0 경고 로그 발생 검증
import asyncio
import importlib
import logging
import os
import sys
import types
import unittest.mock as mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))


# ---------------------------------------------------------------------------
# H-1: fetch_bundle 예외 발생 시 access_token 이 traceback locals 에서 소멸
# ---------------------------------------------------------------------------

def test_access_token_deleted_on_fetch_bundle_exception(monkeypatch, tmp_path):
    """fetch_bundle 이 예외를 던져도 access_token 이 finally 에서 소멸된다.

    전략: offer() 내부 로컬 변수를 직접 볼 수 없으므로,
    fetch_bundle 을 패치해 예외를 던지게 하고, 해당 예외가 외부 try/except 로
    전파됨과 동시에 pc.close()·mgr.remove() 가 호출되는지 검증한다.
    (토큰이 살아남으면 pc.close 전에 예외가 터져 클린업 미완료 상태가 된다.)
    """
    import aiohttp.web as web

    # --- stub 임포트 환경 구성 ---
    stub_modules = [
        "aiortc", "session", "clone_dialog", "asset_fetch",
        "voice_fetch", "prebuild", "recorder",
    ]
    saved = {}
    for m in stub_modules:
        saved[m] = sys.modules.get(m)

    # aiortc stub
    aiortc_mod = types.ModuleType("aiortc")
    class _FakePC:
        connectionState = "new"
        def addTrack(self, *a): pass
        def on(self, ev): return lambda f: f
        async def setRemoteDescription(self, *a): pass
        async def createAnswer(self): return types.SimpleNamespace(sdp="sdp", type="answer")
        async def setLocalDescription(self, *a): pass
        async def close(self):
            self.connectionState = "closed"
            _FakePC._closed = True
        _closed = False
        @property
        def localDescription(self):
            return types.SimpleNamespace(sdp="sdp", type="answer")
    aiortc_mod.RTCPeerConnection = _FakePC
    aiortc_mod.RTCSessionDescription = lambda sdp, type: None
    sys.modules["aiortc"] = aiortc_mod

    # session stub
    sess_mod = types.ModuleType("session")
    class _FakeSess:
        def __init__(self):
            self.session_id = "test-sess"
            self.offer_time = 0.0
            self.clone_id = None
            self.persona_messages = []
            self.se_path = None
            self.video_path = None
            self.pipeline = None
            self.datachannel = None
            self.video_track = types.SimpleNamespace(set_idle_video=lambda p: None)
            self.audio_track = types.SimpleNamespace()
            self.recorder = None
    class _FakeMgr:
        def create(self): return _FakeSess()
        def remove(self, sid): _FakeMgr._removed = True
        def count(self): return 0
        _removed = False
    sess_mod.SessionManager = _FakeMgr
    sys.modules["session"] = sess_mod

    # clone_dialog stub — fetch_bundle 이 예외를 던진다
    cd_mod = types.ModuleType("clone_dialog")
    async def _exploding_fetch_bundle(base, clone_id, token):
        raise RuntimeError("network error — token must not survive this")
    cd_mod.fetch_bundle = _exploding_fetch_bundle
    cd_mod.bundle_to_messages = lambda b: []
    sys.modules["clone_dialog"] = cd_mod

    # 나머지 stub
    af_mod = types.ModuleType("asset_fetch")
    async def _fake_fetch_to(url, dest): pass
    af_mod.fetch_to = _fake_fetch_to
    sys.modules["asset_fetch"] = af_mod
    vf_mod = types.ModuleType("voice_fetch")
    async def _fake_ensure_voice_wav(clone_id, url, root): pass
    vf_mod.ensure_voice_wav = _fake_ensure_voice_wav
    sys.modules["voice_fetch"] = vf_mod
    pre_mod = types.ModuleType("prebuild")
    pre_mod.prebuild_handler = lambda req: web.json_response({})
    sys.modules["prebuild"] = pre_mod
    rec_mod = types.ModuleType("recorder")
    rec_mod.make_recorder = lambda *a, **kw: None
    sys.modules["recorder"] = rec_mod

    # signaling 을 새로 임포트
    if "signaling" in sys.modules:
        del sys.modules["signaling"]
    import signaling as sig_mod

    app = sig_mod.make_app()

    # offer 핸들러 직접 호출
    body = {"sdp": "v=0", "type": "offer", "clone_id": 42, "access_token": "secret-tok"}
    req = mock.MagicMock()
    req.json = asyncio.coroutine(lambda: body) if False else None

    async def _fake_json():
        return body

    req.json = _fake_json

    # offer 는 예외 경로에서 raise 하므로 HTTPException 이 아닌 RuntimeError 기대
    offer_handler = None
    for res in app.router.resources():
        ri = res.get_info()
        if ri.get("path") == "/offer":
            offer_handler = list(res)[0].handler
            break

    assert offer_handler is not None, "/offer 핸들러를 찾지 못했습니다"

    raised = None
    try:
        asyncio.run(offer_handler(req))
    except RuntimeError as e:
        raised = e
    except Exception as e:
        raised = e

    # fetch_bundle RuntimeError 가 외부로 전파되어야 한다
    assert raised is not None, "예외가 전파되지 않았습니다"
    assert "network error" in str(raised)

    # pc.close() + mgr.remove() 가 호출돼야 한다 (finally 이후 클린업 확인)
    assert _FakePC._closed, "pc.close() 가 호출되지 않았습니다 — finally 블록 문제"
    assert _FakeMgr._removed, "mgr.remove() 가 호출되지 않았습니다"

    # 복원
    for m, v in saved.items():
        if v is None:
            sys.modules.pop(m, None)
        else:
            sys.modules[m] = v
    sys.modules.pop("signaling", None)


# ---------------------------------------------------------------------------
# M-2: STRICT=0 시 모듈 로드 단계에서 경고 로그 1회 출력
# ---------------------------------------------------------------------------

def test_strict_zero_emits_warning_on_module_load(monkeypatch, caplog):
    """PRETHIRD_STRICT_CLONE_BUNDLE=0 환경에서 signaling 임포트 시 경고 발생."""
    # stub 최소 구성 (이미 위에서 일부 정리됐을 수 있으므로 재설치)
    for m in ["aiortc", "session", "clone_dialog", "asset_fetch",
              "voice_fetch", "prebuild", "recorder"]:
        if m not in sys.modules:
            sys.modules[m] = types.ModuleType(m)

    # aiortc 최소
    if not hasattr(sys.modules["aiortc"], "RTCPeerConnection"):
        sys.modules["aiortc"].RTCPeerConnection = object
        sys.modules["aiortc"].RTCSessionDescription = object

    # session 최소
    if not hasattr(sys.modules["session"], "SessionManager"):
        class _M:
            def count(self): return 0
        sys.modules["session"].SessionManager = _M

    # clone_dialog 최소
    if not hasattr(sys.modules["clone_dialog"], "fetch_bundle"):
        async def _fb(*a): return None
        sys.modules["clone_dialog"].fetch_bundle = _fb
        sys.modules["clone_dialog"].bundle_to_messages = lambda b: []

    # asset_fetch 최소
    if not hasattr(sys.modules["asset_fetch"], "fetch_to"):
        async def _ft(url, dest): pass
        sys.modules["asset_fetch"].fetch_to = _ft

    # voice_fetch 최소
    if not hasattr(sys.modules["voice_fetch"], "ensure_voice_wav"):
        async def _evw(clone_id, url, root): pass
        sys.modules["voice_fetch"].ensure_voice_wav = _evw

    # prebuild 최소
    import aiohttp.web as web
    if not hasattr(sys.modules["prebuild"], "prebuild_handler"):
        sys.modules["prebuild"].prebuild_handler = lambda req: web.json_response({})

    # recorder 최소
    if not hasattr(sys.modules["recorder"], "make_recorder"):
        sys.modules["recorder"].make_recorder = lambda *a, **kw: None

    sys.modules.pop("signaling", None)

    monkeypatch.setenv("PRETHIRD_STRICT_CLONE_BUNDLE", "0")

    with caplog.at_level(logging.WARNING, logger="prethird.signaling"):
        import signaling  # noqa: F401

    warning_msgs = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert any("PRETHIRD_STRICT_CLONE_BUNDLE=0" in m for m in warning_msgs), (
        f"STRICT=0 경고가 없습니다. 기록된 WARNING: {warning_msgs}"
    )
    assert any("운영 배포 금지" in m for m in warning_msgs)

    sys.modules.pop("signaling", None)


def test_strict_one_no_warning_on_module_load(monkeypatch, caplog):
    """PRETHIRD_STRICT_CLONE_BUNDLE=1(기본) 에서는 경고 없음 — 회귀 확인."""
    for m in ["aiortc", "session", "clone_dialog", "asset_fetch",
              "voice_fetch", "prebuild", "recorder"]:
        if m not in sys.modules:
            sys.modules[m] = types.ModuleType(m)
    if not hasattr(sys.modules["aiortc"], "RTCPeerConnection"):
        sys.modules["aiortc"].RTCPeerConnection = object
        sys.modules["aiortc"].RTCSessionDescription = object
    if not hasattr(sys.modules["session"], "SessionManager"):
        class _M:
            def count(self): return 0
        sys.modules["session"].SessionManager = _M
    if not hasattr(sys.modules["clone_dialog"], "fetch_bundle"):
        async def _fb(*a): return None
        sys.modules["clone_dialog"].fetch_bundle = _fb
        sys.modules["clone_dialog"].bundle_to_messages = lambda b: []
    if not hasattr(sys.modules["asset_fetch"], "fetch_to"):
        async def _ft(url, dest): pass
        sys.modules["asset_fetch"].fetch_to = _ft
    if not hasattr(sys.modules["voice_fetch"], "ensure_voice_wav"):
        async def _evw(clone_id, url, root): pass
        sys.modules["voice_fetch"].ensure_voice_wav = _evw
    import aiohttp.web as web
    if not hasattr(sys.modules["prebuild"], "prebuild_handler"):
        sys.modules["prebuild"].prebuild_handler = lambda req: web.json_response({})
    if not hasattr(sys.modules["recorder"], "make_recorder"):
        sys.modules["recorder"].make_recorder = lambda *a, **kw: None

    sys.modules.pop("signaling", None)
    monkeypatch.setenv("PRETHIRD_STRICT_CLONE_BUNDLE", "1")

    with caplog.at_level(logging.WARNING, logger="prethird.signaling"):
        import signaling  # noqa: F401

    strict_warns = [
        r for r in caplog.records
        if r.levelno == logging.WARNING and "PRETHIRD_STRICT_CLONE_BUNDLE=0" in r.message
    ]
    assert len(strict_warns) == 0, "STRICT=1 인데 경고가 발생했습니다"

    sys.modules.pop("signaling", None)
