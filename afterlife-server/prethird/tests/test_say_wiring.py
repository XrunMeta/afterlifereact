"""test_say_wiring.py — DataChannel "say" 배선 검증 (목 기반, GPU 불필요).

검증 항목:
1. make_app(pipeline_factory=factory) — /offer 후 sess.pipeline 주입됨
2. make_app(pipeline_factory=None)   — 기존 동작 유지(하위호환)
3. /healthz 정상 응답
4. _resolve_persona_se — 세션별 persona/se 동적 주입 (단위 테스트)
5. factory — sess.persona_messages/se_path 우선 사용, 없으면 기본값

DataChannel 메시지→say 루프백 테스트는 aiortc 내부 ICE 연결(loopback
DTLS 핸드셰이크)이 TestServer 환경에서 완전히 완료되기 어렵고
비결정적 타이밍에 의존하기 때문에 이번 단계에서 생략.
실 E2E(say 메시지 전송→pipeline.say 호출) 는 가비아 환경에서 검증 예정.
"""
import types
import pytest, sys, pathlib
from aiohttp.test_utils import TestClient, TestServer
from aiortc import RTCPeerConnection

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from signaling import make_app  # noqa: E402
import server  # noqa: E402


class FakePipeline:
    """실 의존성 없는 더미 파이프라인."""
    def __init__(self, sess):
        self.sess = sess
        self.said: list[str] = []

    async def say(self, text: str) -> None:
        self.said.append(text)


# --------------------------------------------------------------------------
# 테스트 1: factory 주입 → sess.pipeline 연결
# --------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_offer_attaches_pipeline_from_factory():
    created: dict = {}

    def factory(sess):
        fp = FakePipeline(sess)
        created["pipeline"] = fp
        created["sess"] = sess
        return fp

    app = make_app(pipeline_factory=factory)
    async with TestClient(TestServer(app)) as client:
        pc = RTCPeerConnection()
        pc.addTransceiver("video", direction="recvonly")
        pc.addTransceiver("audio", direction="recvonly")
        await pc.setLocalDescription(await pc.createOffer())

        resp = await client.post("/offer", json={
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
        })
        assert resp.status == 200
        body = await resp.json()
        sid = body["session_id"]

        sess = app["mgr"].get(sid)
        assert sess is not None
        assert sess.pipeline is not None, "pipeline 미주입"
        assert created["sess"] is sess, "factory에 전달된 sess가 관리 세션과 다름"
        assert isinstance(sess.pipeline, FakePipeline)

        await pc.close()


# --------------------------------------------------------------------------
# 테스트 2: factory=None → 기존 하위호환(pipeline=None 유지)
# --------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_offer_no_factory_pipeline_is_none():
    app = make_app(pipeline_factory=None)
    async with TestClient(TestServer(app)) as client:
        pc = RTCPeerConnection()
        pc.addTransceiver("video", direction="recvonly")
        pc.addTransceiver("audio", direction="recvonly")
        await pc.setLocalDescription(await pc.createOffer())

        resp = await client.post("/offer", json={
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
        })
        assert resp.status == 200
        body = await resp.json()
        sess = app["mgr"].get(body["session_id"])
        assert sess.pipeline is None, "factory=None인데 pipeline이 설정됨"

        await pc.close()


# --------------------------------------------------------------------------
# 테스트 3: healthz 정상 응답 (factory 있을 때도)
# --------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_healthz_with_factory():
    app = make_app(pipeline_factory=lambda sess: FakePipeline(sess))
    async with TestClient(TestServer(app)) as client:
        resp = await client.get("/healthz")
        assert resp.status == 200
        body = await resp.json()
        assert body["ok"] is True
        assert body["service"] == "prethird"


# --------------------------------------------------------------------------
# 테스트 4: _resolve_persona_se 헬퍼 단위 테스트
# --------------------------------------------------------------------------

def test_resolve_persona_se_uses_session_values():
    """sess.persona_messages/se_path 가 있으면 그것을 우선 반환."""
    sess = types.SimpleNamespace(
        persona_messages=[{"role": "system", "content": "X"}],
        se_path="/ref/9043/se.pth",
    )
    persona, se = server._resolve_persona_se(sess, default_se="/env/default.pth")
    assert persona == [{"role": "system", "content": "X"}]
    assert se == "/ref/9043/se.pth"


def test_resolve_persona_se_falls_back_to_defaults():
    """sess.persona_messages=[], se_path=None 이면 기본값 사용."""
    sess = types.SimpleNamespace(persona_messages=[], se_path=None)
    persona, se = server._resolve_persona_se(sess, default_se="/env/default.pth")
    assert persona == []
    assert se == "/env/default.pth"


def test_resolve_persona_se_no_attrs_falls_back():
    """sess에 persona_messages/se_path 속성 자체가 없으면 기본값 사용."""
    sess = types.SimpleNamespace()
    persona, se = server._resolve_persona_se(sess, default_se=None)
    assert persona == []
    assert se is None


# --------------------------------------------------------------------------
# 테스트 5: factory — sess persona/se 우선, 없으면 기본값 (monkeypatch)
# --------------------------------------------------------------------------

def test_factory_uses_session_persona_and_se(monkeypatch):
    """factory(sess)가 sess.persona_messages/se_path 를 DialoguePipeline에 전달."""
    captured = {}

    class FakeMT:
        def load(self): ...
        def infer(self, *a, **kw): ...

    class FakeDialoguePipeline:
        def __init__(self, **kw):
            captured.update(kw)

    monkeypatch.setenv("PRETHIRD_REFERENCE_VIDEO", "/fake/halbae.mp4")
    monkeypatch.setenv("PRETHIRD_TTS_SE_PATH", "/env/default.pth")

    # GPU 의존성 모두 mock
    monkeypatch.setitem(sys.modules, "musetalk_inproc", types.ModuleType("musetalk_inproc"))
    fake_mt_mod = sys.modules["musetalk_inproc"]
    fake_mt_mod.MuseTalkInproc = lambda *a, **kw: FakeMT()  # type: ignore[attr-defined]

    monkeypatch.setitem(sys.modules, "pipeline", types.ModuleType("pipeline"))
    sys.modules["pipeline"].DialoguePipeline = FakeDialoguePipeline  # type: ignore[attr-defined]

    for mod_name in ("clone_dialog", "tts_client", "audio_utils"):
        fake_mod = types.ModuleType(mod_name)
        fake_mod.chat_stream = None  # type: ignore[attr-defined]
        fake_mod.say = None  # type: ignore[attr-defined]
        fake_mod._decode_wav = None  # type: ignore[attr-defined]
        monkeypatch.setitem(sys.modules, mod_name, fake_mod)

    import importlib
    importlib.reload(server)

    factory = server._build_pipeline_factory()
    assert factory is not None

    sess = types.SimpleNamespace(
        video_track=object(),
        audio_track=object(),
        persona_messages=[{"role": "system", "content": "X"}],
        se_path="/ref/9043/se.pth",
    )
    factory(sess)
    assert captured["persona_messages"] == [{"role": "system", "content": "X"}]
    assert captured["se_path"] == "/ref/9043/se.pth"


def test_factory_falls_back_to_defaults(monkeypatch):
    """sess.persona_messages=[], se_path=None 이면 env 기본값 사용."""
    captured = {}

    class FakeMT:
        def load(self): ...
        def infer(self, *a, **kw): ...

    class FakeDialoguePipeline:
        def __init__(self, **kw):
            captured.update(kw)

    monkeypatch.setenv("PRETHIRD_REFERENCE_VIDEO", "/fake/halbae.mp4")
    monkeypatch.setenv("PRETHIRD_TTS_SE_PATH", "/env/default.pth")

    monkeypatch.setitem(sys.modules, "musetalk_inproc", types.ModuleType("musetalk_inproc"))
    sys.modules["musetalk_inproc"].MuseTalkInproc = lambda *a, **kw: FakeMT()  # type: ignore[attr-defined]

    monkeypatch.setitem(sys.modules, "pipeline", types.ModuleType("pipeline"))
    sys.modules["pipeline"].DialoguePipeline = FakeDialoguePipeline  # type: ignore[attr-defined]

    for mod_name in ("clone_dialog", "tts_client", "audio_utils"):
        fake_mod = types.ModuleType(mod_name)
        fake_mod.chat_stream = None  # type: ignore[attr-defined]
        fake_mod.say = None  # type: ignore[attr-defined]
        fake_mod._decode_wav = None  # type: ignore[attr-defined]
        monkeypatch.setitem(sys.modules, mod_name, fake_mod)

    import importlib
    importlib.reload(server)

    factory = server._build_pipeline_factory()
    sess = types.SimpleNamespace(
        video_track=object(),
        audio_track=object(),
        persona_messages=[],
        se_path=None,
    )
    factory(sess)
    assert captured["persona_messages"] == []
    assert captured["se_path"] == "/env/default.pth"
