"""aiortc publisher → CF Realtime SFU.

회차 029-D-2a — control HTTP server (aiohttp) 로
/publish/start /publish/stop /healthz 노출.

회차 029-D-2b — /subscribe 추가 (브라우저 클라이언트가 publisher 트랙 구독).

Endpoints:
  POST /oth-path         → {sessionId, trackName, state: "publishing"}
  POST /oth-path          → {state: "stopped"}
  POST /oth-path             → {subscriber_session_id, offer_sdp, tracks,
                                requires_renegotiation}
                                body 없음. CF Realtime pull 1단계 — CF 가
                                offer SDP 를 줌. publishing 아니면 409.
  POST /oth-path → {ok: true}
                                body: {subscriber_session_id, answer_sdp}
                                CF Realtime pull 2단계 — 클라이언트 answer 전달.
  GET /oth-path               → {state, sessionId, trackName, uptime_s}

Env:
  CF_REALTIME_APP_ID       (required)
  CF_REALTIME_APP_TOKEN    (required)
  CF_REALTIME_BASE         (default: https://rtc.live.cloudflare.com/v1)
  PUBLISHER_BIND           (default: 127.0.0.1)
  PUBLISHER_PORT           (default: 8400)
  PUBLISHER_TRACK_NAME     (default: video1)

Run:
    set -a && . /home/afterlife/.env.vars && set +a
    python scripts/publisher.py
"""
from __future__ import annotations

import asyncio
import colorsys
import logging
import os
import sys
import time
from pathlib import Path
from typing import Optional

import numpy as np
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaStreamError
from aiortc.mediastreams import VideoStreamTrack
from av import VideoFrame

# scripts/utils import 경로 보정
sys.path.insert(0, str(Path(__file__).resolve().parent))
from utils.cf_client import CFRealtimeClient, CFRealtimeError  # noqa: E402

logging.basicConfig(
    level=os.environ.get("PUBLISHER_LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger("publisher")

WIDTH = 640
HEIGHT = 480
FPS = 30

class DummyVideoTrack(VideoStreamTrack):
    """단색 dummy frame, 1초마다 색상(H) 회전."""

    kind = "video"

    def __init__(self):
        super().__init__()
        self._start = time.time()

    async def recv(self) -> VideoFrame:
        pts, time_base = await self.next_timestamp()
        elapsed = time.time() - self._start
        # 1초당 1/12 회전 → 12초 주기로 색이 한 바퀴
        h = (elapsed / 12.0) % 1.0
        r, g, b = colorsys.hsv_to_rgb(h, 0.7, 0.9)
        rgb = (
            int(r * 255),
            int(g * 255),
            int(b * 255),
        )
        arr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        arr[:, :, 0] = rgb[0]
        arr[:, :, 1] = rgb[1]
        arr[:, :, 2] = rgb[2]
        frame = VideoFrame.from_ndarray(arr, format="rgb24")
        frame.pts = pts
        frame.time_base = time_base
        return frame

class PublisherState:
    def __init__(self):
        self.state: str = "idle"
        self.session_id: Optional[str] = None
        self.track_name: Optional[str] = None
        self.pc: Optional[RTCPeerConnection] = None
        self.track: Optional[DummyVideoTrack] = None
        self.started_at: float = time.time()
        self.lock = asyncio.Lock()

    def snapshot(self) -> dict:
        return {
            "state": self.state,
            "sessionId": self.session_id,
            "trackName": self.track_name,
            "uptime_s": round(time.time() - self.started_at, 2),
        }

def _env(name: str, default: Optional[str] = None, required: bool = False) -> str:
    v = os.environ.get(name, default)
    if required and not v:
        raise SystemExit(f"missing env {name}")
    return v or ""

async def _start_publish(state: PublisherState, client: CFRealtimeClient, track_name: str) -> dict:
    if state.state != "idle":
        return {"error": f"state={state.state}; stop first", "state": state.state}

    # 1) CF 세션 생성
    sid = await client.create_session()
    log.info("cf sessions/new ok sid_prefix=%s len=%d", sid[:8], len(sid))

    # 2) PeerConnection + dummy track + offer
    pc = RTCPeerConnection()
    track = DummyVideoTrack()
    pc.addTrack(track)
    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    offer_sdp = pc.localDescription.sdp
    # transceiver 의 mid 는 setLocalDescription 후 채워짐 (보통 "0")
    transceivers = pc.getTransceivers()
    mid = next((t.mid for t in transceivers if t.mid is not None), "0")
    log.info("offer created sdp_len=%d m_lines=%d mid=%s",
             len(offer_sdp),
             sum(1 for ln in offer_sdp.splitlines() if ln.startswith("m=")),
             mid)

    # 3) tracks/new
    try:
        ans = await client.tracks_new(sid, offer_sdp, track_name=track_name, mid=mid)
    except CFRealtimeError:
        await pc.close()
        raise
    answer_sdp = ans["answer_sdp"]
    log.info("cf tracks/new ok answer_sdp_len=%d tracks=%d",
             len(answer_sdp), len(ans.get("tracks", [])))

    # 4) setRemoteDescription
    await pc.setRemoteDescription(
        RTCSessionDescription(sdp=answer_sdp, type="answer")
    )

    state.pc = pc
    state.track = track
    state.session_id = sid
    state.track_name = track_name
    state.state = "publishing"
    return {"sessionId": sid, "trackName": track_name, "state": "publishing"}

async def _stop_publish(state: PublisherState) -> dict:
    if state.pc is not None:
        try:
            await state.pc.close()
        except Exception as e:  # noqa: BLE001
            log.warning("pc close err: %s", e)
    state.pc = None
    state.track = None
    state.session_id = None
    state.track_name = None
    state.state = "stopped"
    return {"state": "stopped"}

def make_app() -> web.Application:
    state = PublisherState()
    base = _env("CF_REALTIME_BASE", "https://rtc.live.cloudflare.com/v1")
    app_id = _env("CF_REALTIME_APP_ID", required=True)
    # 토큰: 회차 029-D-0 PoC 는 CF_REALTIME_APP_SECRET 사용,
    # 회차 029-D-2a 명세는 CF_REALTIME_APP_TOKEN — 둘 다 허용 (TOKEN 우선)
    token = os.environ.get("CF_REALTIME_APP_TOKEN") or os.environ.get(
        "CF_REALTIME_APP_SECRET", ""
    )
    if not token:
        raise SystemExit("missing env CF_REALTIME_APP_TOKEN (or CF_REALTIME_APP_SECRET)")
    default_track_name = _env("PUBLISHER_TRACK_NAME", "video1")
    client = CFRealtimeClient(base=base, app_id=app_id, token=token)

    async def healthz(_request: web.Request) -> web.Response:
        return web.json_response(state.snapshot())

    async def publish_start(_request: web.Request) -> web.Response:
        async with state.lock:
            try:
                result = await _start_publish(state, client, default_track_name)
            except CFRealtimeError as e:
                log.error("publish/start cf err: %s", e)
                return web.json_response(
                    {"error": "cf_realtime_error", "detail": str(e)[:300]},
                    status=502,
                )
            except Exception as e:  # noqa: BLE001
                log.exception("publish/start unexpected err")
                return web.json_response(
                    {"error": "internal", "detail": repr(e)[:300]},
                    status=500,
                )
        if "error" in result:
            return web.json_response(result, status=409)
        return web.json_response(result)

    async def publish_stop(_request: web.Request) -> web.Response:
        async with state.lock:
            result = await _stop_publish(state)
        return web.json_response(result)

    async def subscribe(_request: web.Request) -> web.Response:
        """CF subscriber pull (1단계) — body 없이 호출.

        흐름 (CF Realtime 표준):
          1. 클라이언트가 POST /oth-path (body 없음)
          2. publisher 가 CF subscriber session 생성 + tracks/new(remote) 로
             offer SDP 회수
          3. 응답: {subscriber_session_id, offer_sdp, tracks}
          4. 클라이언트는 그 offer 로 setRemoteDescription, createAnswer,
             setLocalDescription, 그리고 POST /oth-path 로 answer 송신
        """
        if state.state != "publishing" or not state.session_id:
            return web.json_response(
                {"error": "publisher_not_ready", "state": state.state},
                status=409,
            )
        track_name = state.track_name or default_track_name
        publisher_sid = state.session_id
        try:
            sub_sid = await client.create_session()
            log.info(
                "subscribe pull sub_sid_prefix=%s pub_sid_prefix=%s track=%s",
                sub_sid[:8], publisher_sid[:8], track_name,
            )
            res = await client.tracks_new_remote_pull(
                sub_sid, publisher_sid, track_name=track_name
            )
        except CFRealtimeError as e:
            log.error("subscribe cf err: %s", e)
            return web.json_response(
                {"error": "cf_realtime_error", "detail": str(e)[:300]},
                status=502,
            )
        except Exception as e:  # noqa: BLE001
            log.exception("subscribe unexpected err")
            return web.json_response(
                {"error": "internal", "detail": repr(e)[:300]}, status=500
            )
        log.info(
            "subscribe pull ok offer_sdp_len=%d tracks=%d renego=%s",
            len(res["offer_sdp"]),
            len(res.get("tracks", [])),
            res.get("requires_renegotiation"),
        )
        return web.json_response(
            {
                "subscriber_session_id": sub_sid,
                "offer_sdp": res["offer_sdp"],
                "tracks": res.get("tracks", []),
                "requires_renegotiation": res.get("requires_renegotiation", True),
            }
        )

    async def subscribe_renegotiate(request: web.Request) -> web.Response:
        """CF subscriber pull (2단계) — 클라이언트 answer SDP 전달."""
        try:
            body = await request.json()
        except Exception as e:  # noqa: BLE001
            return web.json_response(
                {"error": "bad_json", "detail": repr(e)[:200]}, status=400
            )
        sub_sid = (body or {}).get("subscriber_session_id")
        answer_sdp = (body or {}).get("answer_sdp")
        if not sub_sid or not isinstance(sub_sid, str):
            return web.json_response(
                {"error": "missing_subscriber_session_id"}, status=400
            )
        if not answer_sdp or not isinstance(answer_sdp, str):
            return web.json_response(
                {"error": "missing_answer_sdp"}, status=400
            )
        try:
            res = await client.renegotiate(sub_sid, answer_sdp)
        except CFRealtimeError as e:
            log.error("renegotiate cf err: %s", e)
            return web.json_response(
                {"error": "cf_realtime_error", "detail": str(e)[:300]},
                status=502,
            )
        except Exception as e:  # noqa: BLE001
            log.exception("renegotiate unexpected err")
            return web.json_response(
                {"error": "internal", "detail": repr(e)[:300]}, status=500
            )
        log.info(
            "subscribe renegotiate ok sub_sid_prefix=%s answer_sdp_len=%d",
            sub_sid[:8], len(answer_sdp),
        )
        return web.json_response({"ok": True, "raw": res})

    @web.middleware
    async def cors_middleware(request: web.Request, handler):
        # OPTIONS preflight: 핸들러 없이도 200 반환
        if request.method == "OPTIONS":
            resp = web.Response(status=204)
        else:
            try:
                resp = await handler(request)
            except web.HTTPException as e:
                resp = e
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resp.headers["Access-Control-Max-Age"] = "600"
        return resp

    app = web.Application(middlewares=[cors_middleware])
    app.router.add_get("/healthz", healthz)
    app.router.add_post("/publish/start", publish_start)
    app.router.add_post("/publish/stop", publish_stop)
    app.router.add_post("/subscribe", subscribe)
    app.router.add_post("/subscribe/renegotiate", subscribe_renegotiate)
    # OPTIONS preflight 라우트 — middleware 가 응답 헤더 채움
    app.router.add_route("OPTIONS", "/subscribe", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/subscribe/renegotiate", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/publish/start", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/publish/stop", lambda r: web.Response(status=204))

    async def _on_cleanup(_app: web.Application) -> None:
        if state.pc is not None:
            try:
                await state.pc.close()
            except Exception:  # noqa: BLE001
                pass

    app.on_cleanup.append(_on_cleanup)
    app["_state"] = state
    return app

def main() -> None:
    bind = _env("PUBLISHER_BIND", "127.0.0.1")
    port = int(_env("PUBLISHER_PORT", "8400"))
    app = make_app()
    log.info("publisher starting on http://%s:%d", bind, port)
    web.run_app(app, host=bind, port=port, print=None)

if __name__ == "__main__":
    main()
