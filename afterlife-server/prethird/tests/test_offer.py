import pytest, sys, pathlib
from aiohttp.test_utils import TestClient, TestServer
from aiortc import RTCPeerConnection, RTCSessionDescription
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from signaling import make_app  # noqa: E402
import signaling  # noqa: E402 (monkeypatch 대상)

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


@pytest.mark.asyncio
async def test_offer_fetches_bundle_and_stores_persona(monkeypatch):
    """clone_id·access_token → fetch_bundle 호출 → sess persona_messages·se_path 저장 확인."""
    async def fake_fetch(api, cid, tok):
        return {
            "personaBundle": {"cloneId": "9043", "persona": {"displayName": "할배"}},
            "assets": {"voiceSeKey": "9043"},
        }

    monkeypatch.setattr(signaling, "fetch_bundle", fake_fetch)
    monkeypatch.setattr(signaling, "bundle_to_messages",
                        lambda b: [{"role": "system", "content": "할배"}])
    monkeypatch.setattr(signaling.os.path, "isfile", lambda p: True)  # 파일 존재 mock

    app = make_app()
    async with TestClient(TestServer(app)) as client:
        pc = RTCPeerConnection()
        pc.addTransceiver("video", direction="recvonly")
        pc.addTransceiver("audio", direction="recvonly")
        await pc.setLocalDescription(await pc.createOffer())
        resp = await client.post("/offer", json={
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
            "clone_id": 9043,
            "access_token": "tok",
        })
        assert resp.status == 200
        sid = (await resp.json())["session_id"]
        sess = app["mgr"].get(sid)
        assert sess.clone_id == 9043
        assert sess.persona_messages == [{"role": "system", "content": "할배"}]
        assert sess.se_path is not None and "9043" in sess.se_path
        await pc.close()


@pytest.mark.asyncio
async def test_offer_bundle_fetch_failure_graceful(monkeypatch):
    """fetch_bundle 실패(None 반환) 시 persona_messages=[], se_path=None으로 진행."""
    async def fake_fetch(api, cid, tok):
        return None

    monkeypatch.setattr(signaling, "fetch_bundle", fake_fetch)

    app = make_app()
    async with TestClient(TestServer(app)) as client:
        pc = RTCPeerConnection()
        pc.addTransceiver("video", direction="recvonly")
        pc.addTransceiver("audio", direction="recvonly")
        await pc.setLocalDescription(await pc.createOffer())
        resp = await client.post("/offer", json={
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
            "clone_id": 9043,
            "access_token": "tok",
        })
        assert resp.status == 200
        sid = (await resp.json())["session_id"]
        sess = app["mgr"].get(sid)
        assert sess.persona_messages == []
        assert sess.se_path is None
        await pc.close()


@pytest.mark.asyncio
async def test_offer_rejects_non_integer_clone_id(monkeypatch):
    """clone_id 문자열(경로주입 시도) → sess.clone_id is None, se_path None, fetch_bundle 미호출."""
    called = []

    async def spy_fetch(api, cid, tok):
        called.append(cid)
        return None

    monkeypatch.setattr(signaling, "fetch_bundle", spy_fetch)

    app = make_app()
    async with TestClient(TestServer(app)) as client:
        pc = RTCPeerConnection()
        pc.addTransceiver("video", direction="recvonly")
        pc.addTransceiver("audio", direction="recvonly")
        await pc.setLocalDescription(await pc.createOffer())
        resp = await client.post("/offer", json={
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
            "clone_id": "../etc/passwd",  # 경로주입 시도
            "access_token": "tok",
        })
        assert resp.status == 200
        sid = (await resp.json())["session_id"]
        sess = app["mgr"].get(sid)
        assert sess.clone_id is None          # 정수 아님 → None
        assert sess.se_path is None           # 경로 설정 안 됨
        assert len(called) == 0               # fetch_bundle 미호출
        await pc.close()


@pytest.mark.asyncio
async def test_offer_empty_assets_no_se(monkeypatch):
    """assets에 voiceSeKey·voiceSeUrl 둘 다 None + 존재하지 않는 cloneId → sess.se_path is None."""
    async def fake_fetch(api, cid, tok):
        return {
            "personaBundle": {"cloneId": "99999", "persona": {"displayName": "테스트"}},
            "assets": {"voiceSeKey": None, "voiceSeUrl": None},
        }

    monkeypatch.setattr(signaling, "fetch_bundle", fake_fetch)
    monkeypatch.setattr(signaling, "bundle_to_messages",
                        lambda b: [{"role": "system", "content": "테스트"}])
    # os.path.isfile → 항상 False (파일 없는 상황)
    monkeypatch.setattr(signaling.os.path, "isfile", lambda p: False)

    app = make_app()
    async with TestClient(TestServer(app)) as client:
        pc = RTCPeerConnection()
        pc.addTransceiver("video", direction="recvonly")
        pc.addTransceiver("audio", direction="recvonly")
        await pc.setLocalDescription(await pc.createOffer())
        resp = await client.post("/offer", json={
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
            "clone_id": 99999,
            "access_token": "tok",
        })
        assert resp.status == 200
        sid = (await resp.json())["session_id"]
        sess = app["mgr"].get(sid)
        assert sess.se_path is None           # 파일 없음 → 미설정
        await pc.close()


@pytest.mark.asyncio
async def test_offer_se_path_set_when_exists(monkeypatch):
    """존재하는 디렉토리 mock(monkeypatch os.path.isfile→True) → se_path 설정됨."""
    async def fake_fetch(api, cid, tok):
        return {
            "personaBundle": {"cloneId": "1234", "persona": {"displayName": "할배"}},
            "assets": {"voiceSeKey": "1234"},
        }

    monkeypatch.setattr(signaling, "fetch_bundle", fake_fetch)
    monkeypatch.setattr(signaling, "bundle_to_messages",
                        lambda b: [{"role": "system", "content": "할배"}])
    # os.path.isfile → True (파일 존재 상황)
    monkeypatch.setattr(signaling.os.path, "isfile", lambda p: True)

    app = make_app()
    async with TestClient(TestServer(app)) as client:
        pc = RTCPeerConnection()
        pc.addTransceiver("video", direction="recvonly")
        pc.addTransceiver("audio", direction="recvonly")
        await pc.setLocalDescription(await pc.createOffer())
        resp = await client.post("/offer", json={
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
            "clone_id": 1234,
            "access_token": "tok",
        })
        assert resp.status == 200
        sid = (await resp.json())["session_id"]
        sess = app["mgr"].get(sid)
        assert sess.se_path is not None       # 파일 존재 → se_path 설정
        assert "1234" in sess.se_path         # cloneId 경로 포함
        await pc.close()


@pytest.mark.asyncio
async def test_offer_without_clone_id_no_bundle_fetch(monkeypatch):
    """clone_id 없는 기존 /offer → fetch_bundle 미호출, persona_messages=[]."""
    called = []

    async def spy_fetch(api, cid, tok):
        called.append(True)
        return None

    monkeypatch.setattr(signaling, "fetch_bundle", spy_fetch)

    app = make_app()
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
        sid = (await resp.json())["session_id"]
        sess = app["mgr"].get(sid)
        assert sess.clone_id is None
        assert sess.persona_messages == []
        # fetch_bundle은 clone_id 없으면 즉시 None 반환(bundle_client 자체 가드)
        # 하지만 signaling에서 clone_id None이면 호출 자체를 안 하는지도 검증
        assert len(called) == 0
        await pc.close()
