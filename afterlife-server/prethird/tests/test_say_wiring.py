"""test_say_wiring.py — DataChannel "say" 배선 검증 (목 기반, GPU 불필요).

검증 항목:
1. make_app(pipeline_factory=factory) — /offer 후 sess.pipeline 주입됨
2. make_app(pipeline_factory=None)   — 기존 동작 유지(하위호환)
3. /healthz 정상 응답

DataChannel 메시지→say 루프백 테스트는 aiortc 내부 ICE 연결(loopback
DTLS 핸드셰이크)이 TestServer 환경에서 완전히 완료되기 어렵고
비결정적 타이밍에 의존하기 때문에 이번 단계에서 생략.
실 E2E(say 메시지 전송→pipeline.say 호출) 는 가비아 환경에서 검증 예정.
"""
import pytest, sys, pathlib
from aiohttp.test_utils import TestClient, TestServer
from aiortc import RTCPeerConnection

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from signaling import make_app  # noqa: E402


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
