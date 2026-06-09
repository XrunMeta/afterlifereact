import pytest, sys, pathlib
from aiohttp.test_utils import TestClient, TestServer
from aiortc import RTCPeerConnection, RTCSessionDescription
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from signaling import make_app  # noqa: E402
import signaling  # noqa: E402 (monkeypatch 대상)

# ── 헬퍼: 기본 offer 요청 ────────────────────────────────────────────
async def _make_offer_request(client, extra: dict | None = None):
    pc = RTCPeerConnection()
    pc.addTransceiver("video", direction="recvonly")
    pc.addTransceiver("audio", direction="recvonly")
    await pc.setLocalDescription(await pc.createOffer())
    payload = {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
    if extra:
        payload.update(extra)
    resp = await client.post("/offer", json=payload)
    return resp, pc

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

# ── idleVideoUrl 관련 신규 테스트 ─────────────────────────────────────

@pytest.mark.asyncio
async def test_offer_idle_video_url_sets_video_path(monkeypatch):
    """idleVideoUrl 있으면 fetch_to 호출 + sess.video_path 설정."""
    fetch_calls: list[tuple] = []

    async def fake_fetch_to(url, dest):
        fetch_calls.append((url, dest))
        # 실제 파일 생성 없이 성공 반환

    async def fake_fetch_bundle(api, cid, tok):
        return {
            "personaBundle": {"cloneId": "5001", "persona": {"displayName": "테스트"}},
            "assets": {
                "voiceSeKey": None,
                "idleVideoUrl": "https://r2.example.com/5001/idle-25fps.mp4",
            },
        }

    monkeypatch.setattr(signaling, "fetch_bundle", fake_fetch_bundle)
    monkeypatch.setattr(signaling, "bundle_to_messages", lambda b: [])
    monkeypatch.setattr(signaling, "fetch_to", fake_fetch_to)
    monkeypatch.setattr(signaling.os.path, "isfile", lambda p: False)

    app = make_app()
    async with TestClient(TestServer(app)) as client:
        resp, pc = await _make_offer_request(client, {"clone_id": 5001, "access_token": "tok"})
        assert resp.status == 200
        sid = (await resp.json())["session_id"]
        sess = app["mgr"].get(sid)
        assert len(fetch_calls) == 1
        called_url, called_dest = fetch_calls[0]
        assert called_url == "https://r2.example.com/5001/idle-25fps.mp4"
        assert "5001" in called_dest
        assert sess.video_path == called_dest
        await pc.close()

@pytest.mark.asyncio
async def test_offer_no_idle_video_url_video_path_none(monkeypatch):
    """assets에 idleVideoUrl 없으면 sess.video_path = None."""
    async def fake_fetch_bundle(api, cid, tok):
        return {
            "personaBundle": {"cloneId": "5002", "persona": {"displayName": "테스트"}},
            "assets": {"voiceSeKey": None},  # idleVideoUrl 키 자체 없음
        }

    monkeypatch.setattr(signaling, "fetch_bundle", fake_fetch_bundle)
    monkeypatch.setattr(signaling, "bundle_to_messages", lambda b: [])
    monkeypatch.setattr(signaling.os.path, "isfile", lambda p: False)

    app = make_app()
    async with TestClient(TestServer(app)) as client:
        resp, pc = await _make_offer_request(client, {"clone_id": 5002, "access_token": "tok"})
        assert resp.status == 200
        sid = (await resp.json())["session_id"]
        sess = app["mgr"].get(sid)
        assert sess.video_path is None
        await pc.close()

@pytest.mark.asyncio
async def test_offer_idle_video_pull_failure_graceful(monkeypatch):
    """fetch_to 예외 시 sess.video_path = None(graceful, 200 응답 유지)."""
    async def fake_fetch_to(url, dest):
        raise RuntimeError("R2 connection timeout")

    async def fake_fetch_bundle(api, cid, tok):
        return {
            "personaBundle": {"cloneId": "5003", "persona": {"displayName": "테스트"}},
            "assets": {
                "idleVideoUrl": "https://r2.example.com/5003/idle-25fps.mp4",
            },
        }

    monkeypatch.setattr(signaling, "fetch_bundle", fake_fetch_bundle)
    monkeypatch.setattr(signaling, "bundle_to_messages", lambda b: [])
    monkeypatch.setattr(signaling, "fetch_to", fake_fetch_to)
    monkeypatch.setattr(signaling.os.path, "isfile", lambda p: False)

    app = make_app()
    async with TestClient(TestServer(app)) as client:
        resp, pc = await _make_offer_request(client, {"clone_id": 5003, "access_token": "tok"})
        assert resp.status == 200  # graceful — 실패해도 offer 성공
        sid = (await resp.json())["session_id"]
        sess = app["mgr"].get(sid)
        assert sess.video_path is None  # pull 실패 → None(halbae fallback)
        await pc.close()
