import pytest, sys, pathlib
from aiohttp.test_utils import TestClient, TestServer
from aiortc import RTCPeerConnection, RTCSessionDescription
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from signaling import make_app  # noqa: E402

@pytest.mark.asyncio
async def test_offer_returns_answer_and_creates_session():
    app = make_app()
    async with TestClient(TestServer(app)) as client:
        pc = RTCPeerConnection()
        pc.addTransceiver("video", direction="recvonly")
        pc.addTransceiver("audio", direction="recvonly")
        offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        resp = await client.post("/offer", json={
            "sdp": pc.localDescription.sdp, "type": pc.localDescription.type})
        assert resp.status == 200
        body = await resp.json()
        assert body["type"] == "answer" and "sdp" in body
        assert "session_id" in body
        h = await client.get("/healthz")
        assert (await h.json())["sessions"] == 1
        await pc.close()

@pytest.mark.asyncio
async def test_offer_invalid_sdp_no_orphan_session():
    app = make_app()
    async with TestClient(TestServer(app)) as client:
        # sdp 키 누락 → KeyError → 협상 실패 경로 진입 확실
        resp = await client.post("/offer", json={"type": "offer"})
        assert resp.status >= 400                      # 협상 실패
        h = await client.get("/healthz")
        assert (await h.json())["sessions"] == 0        # orphan 세션 누수 없음

@pytest.mark.asyncio
async def test_answer_sdp_has_ice_candidates():
    # non-trickle: answer SDP에 ICE candidate 포함되어야 연결 가능
    app = make_app()
    async with TestClient(TestServer(app)) as client:
        pc = RTCPeerConnection()
        pc.addTransceiver("video", direction="recvonly")
        pc.addTransceiver("audio", direction="recvonly")
        await pc.setLocalDescription(await pc.createOffer())
        resp = await client.post("/offer", json={
            "sdp": pc.localDescription.sdp, "type": pc.localDescription.type})
        ans = await resp.json()
        assert "a=candidate" in ans["sdp"]              # candidate 포함(aiortc setLocalDescription이 gather 완료까지 대기)
        await pc.close()
