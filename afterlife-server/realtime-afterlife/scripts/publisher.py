"""aiortc publisher → CF Realtime SFU.

회차 029-D-2a — control HTTP server (aiohttp) 로
/publish/start /publish/stop /healthz 노출.

회차 029-D-2b — /subscribe 추가 (브라우저 클라이언트가 publisher 트랙 구독).

회차 029-D-2c — frame queue 모드 (MuseTalk → publisher push):
  StreamableVideoTrack 가 dummy 또는 queue 모드로 동작.
  POST /oth-path bytes → 큐에 적재 (JPEG 80% quality 권장)
  POST /oth-path stream 종료 (큐 flush)
  /publish/start body: {mode: "dummy"|"queue"} (default "dummy")

Endpoints:
  POST /oth-path         → {sessionId, trackName, state: "publishing", mode}
  POST /oth-path          → {state: "stopped"}
  POST /oth-path             → {subscriber_session_id, offer_sdp, tracks,
                                requires_renegotiation}
  POST /oth-path → {ok: true}
  POST /oth-path            → {queued: N, dropped: bool}  (raw JPEG/RGB body)
  POST /oth-path        → {flushed: N}
  GET /oth-path               → {state, sessionId, trackName, uptime_s, mode, queue_depth}

Env:
  CF_REALTIME_APP_ID       (required)
  CF_REALTIME_APP_TOKEN    (required)
  CF_REALTIME_BASE         (default: https://rtc.live.cloudflare.com/v1)
  PUBLISHER_BIND           (default: 127.0.0.1)
  PUBLISHER_PORT           (default: 8400)
  PUBLISHER_TRACK_NAME     (default: video1)
  PUBLISHER_QUEUE_MAX      (default: 60)

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

import io

import numpy as np
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaStreamError
from aiortc.mediastreams import VideoStreamTrack
from av import VideoFrame
from PIL import Image

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
QUEUE_MAX_DEFAULT = 60

def _dummy_rgb_frame(elapsed: float) -> np.ndarray:
    """단색 frame, 12초 주기 색 회전."""
    h = (elapsed / 12.0) % 1.0
    r, g, b = colorsys.hsv_to_rgb(h, 0.7, 0.9)
    arr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    arr[:, :, 0] = int(r * 255)
    arr[:, :, 1] = int(g * 255)
    arr[:, :, 2] = int(b * 255)
    return arr

class StreamableVideoTrack(VideoStreamTrack):
    """모드 토글 가능한 video track.

    mode="dummy": HSV 회전 단색 frame (회차 D-2a/2b 호환)
    mode="queue": 외부 큐(asyncio.Queue) 에서 ndarray 꺼내 yield.
                 큐 비어있으면 last_frame hold (없으면 dummy fallback).
    """

    kind = "video"

    def __init__(self, queue_max: int = QUEUE_MAX_DEFAULT):
        super().__init__()
        self._start = time.time()
        self.mode = "dummy"
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=queue_max)
        self._last_frame: Optional[np.ndarray] = None
        self._stream_ended = False

    def set_mode(self, mode: str) -> None:
        if mode not in ("dummy", "queue"):
            raise ValueError(f"invalid mode: {mode}")
        self.mode = mode
        self._stream_ended = False

    def push_ndarray(self, arr: np.ndarray) -> dict:
        """외부에서 frame 적재. 큐 가득 차면 oldest drop."""
        dropped = False
        if self.queue.full():
            try:
                self.queue.get_nowait()
                dropped = True
            except asyncio.QueueEmpty:
                pass
        try:
            self.queue.put_nowait(arr)
        except asyncio.QueueFull:
            dropped = True
        return {"queued": self.queue.qsize(), "dropped": dropped}

    def signal_end(self) -> int:
        """stream 끝 신호 — 남은 큐 size 반환. 큐 비면 last_frame hold."""
        self._stream_ended = True
        return self.queue.qsize()

    def queue_depth(self) -> int:
        return self.queue.qsize()

    async def recv(self) -> VideoFrame:
        pts, time_base = await self.next_timestamp()
        arr: Optional[np.ndarray] = None

        if self.mode == "queue":
            try:
                # 짧은 timeout 으로 폴링 — 비면 last/dummy fallback
                arr = await asyncio.wait_for(self.queue.get(), timeout=0.02)
                self._last_frame = arr
            except asyncio.TimeoutError:
                arr = self._last_frame  # hold
        # dummy 모드 또는 queue 모드에서 last 도 없을 때
        if arr is None:
            arr = _dummy_rgb_frame(time.time() - self._start)

        # 안전 — 차원 검증
        if arr.ndim != 3 or arr.shape[2] != 3:
            arr = _dummy_rgb_frame(time.time() - self._start)

        frame = VideoFrame.from_ndarray(arr, format="rgb24")
        frame.pts = pts
        frame.time_base = time_base
        return frame

# 후방 호환 alias (기존 코드/테스트가 import 하는 경우)
DummyVideoTrack = StreamableVideoTrack

class PublisherState:
    def __init__(self):
        self.state: str = "idle"
        self.session_id: Optional[str] = None
        self.track_name: Optional[str] = None
        self.pc: Optional[RTCPeerConnection] = None
        self.track: Optional[StreamableVideoTrack] = None
        self.mode: str = "dummy"
        self.started_at: float = time.time()
        self.lock = asyncio.Lock()

    def snapshot(self) -> dict:
        depth = self.track.queue_depth() if self.track is not None else 0
        return {
            "state": self.state,
            "sessionId": self.session_id,
            "trackName": self.track_name,
            "uptime_s": round(time.time() - self.started_at, 2),
            "mode": self.mode,
            "queue_depth": depth,
        }

def _env(name: str, default: Optional[str] = None, required: bool = False) -> str:
    v = os.environ.get(name, default)
    if required and not v:
        raise SystemExit(f"missing env {name}")
    return v or ""

async def _start_publish(
    state: PublisherState,
    client: CFRealtimeClient,
    track_name: str,
    mode: str = "dummy",
    queue_max: int = QUEUE_MAX_DEFAULT,
) -> dict:
    if state.state != "idle":
        return {"error": f"state={state.state}; stop first", "state": state.state}

    if mode not in ("dummy", "queue"):
        return {"error": f"invalid mode: {mode}", "state": state.state}

    # 1) CF 세션 생성
    sid = await client.create_session()
    log.info("cf sessions/new ok sid_prefix=%s len=%d", sid[:8], len(sid))

    # 2) PeerConnection + streamable track + offer
    pc = RTCPeerConnection()
    track = StreamableVideoTrack(queue_max=queue_max)
    track.set_mode(mode)
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
    state.mode = mode
    state.state = "publishing"
    return {
        "sessionId": sid,
        "trackName": track_name,
        "state": "publishing",
        "mode": mode,
    }

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
    state.mode = "dummy"
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
    queue_max = int(_env("PUBLISHER_QUEUE_MAX", str(QUEUE_MAX_DEFAULT)))
    client = CFRealtimeClient(base=base, app_id=app_id, token=token)

    async def healthz(_request: web.Request) -> web.Response:
        return web.json_response(state.snapshot())

    async def publish_start(request: web.Request) -> web.Response:
        # body optional. {mode: "dummy"|"queue"} default "dummy"
        mode = "dummy"
        if request.can_read_body:
            try:
                raw = await request.read()
                if raw:
                    import json as _json
                    body = _json.loads(raw)
                    m = (body or {}).get("mode")
                    if isinstance(m, str):
                        mode = m
            except Exception as e:  # noqa: BLE001
                log.warning("publish/start body parse skipped: %s", e)
        async with state.lock:
            try:
                result = await _start_publish(
                    state, client, default_track_name, mode=mode, queue_max=queue_max,
                )
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

    async def push_frame(request: web.Request) -> web.Response:
        """raw bytes body → ndarray → 큐 적재.

        headers:
          Content-Type: image/jpeg | image/raw
          X-Width, X-Height (raw only, default 640x480)
          X-Frame-Format: jpeg | rgb24 | bgr24 (default jpeg)
        """
        if state.state != "publishing" or state.track is None:
            return web.json_response(
                {"error": "publisher_not_publishing", "state": state.state},
                status=409,
            )
        if state.mode != "queue":
            return web.json_response(
                {"error": "publisher_not_in_queue_mode", "mode": state.mode},
                status=409,
            )
        body = await request.read()
        if not body:
            return web.json_response({"error": "empty_body"}, status=400)
        fmt = request.headers.get("X-Frame-Format", "").lower()
        ctype = (request.headers.get("Content-Type") or "").lower()
        if not fmt:
            fmt = "jpeg" if "jpeg" in ctype or "jpg" in ctype else (
                "rgb24" if "raw" in ctype else "jpeg"
            )
        def _decode() -> np.ndarray:
            if fmt == "jpeg":
                img = Image.open(io.BytesIO(body)).convert("RGB")
                return np.asarray(img, dtype=np.uint8)
            if fmt == "rgb24":
                w = int(request.headers.get("X-Width", str(WIDTH)))
                h = int(request.headers.get("X-Height", str(HEIGHT)))
                return np.frombuffer(body, dtype=np.uint8).reshape((h, w, 3))
            if fmt == "bgr24":
                w = int(request.headers.get("X-Width", str(WIDTH)))
                h = int(request.headers.get("X-Height", str(HEIGHT)))
                bgr = np.frombuffer(body, dtype=np.uint8).reshape((h, w, 3))
                return bgr[:, :, ::-1].copy()
            raise ValueError(f"unsupported_format: {fmt}")

        try:
            arr = await asyncio.to_thread(_decode)
        except ValueError as e:
            return web.json_response({"error": str(e)}, status=400)
        except Exception as e:  # noqa: BLE001
            log.warning("push_frame decode err: %s", e)
            return web.json_response(
                {"error": "decode_failed", "detail": repr(e)[:200]}, status=400
            )

        info = state.track.push_ndarray(arr)
        return web.json_response(info)

    async def push_frame_end(_request: web.Request) -> web.Response:
        if state.track is None:
            return web.json_response({"flushed": 0, "note": "no_track"})
        depth = state.track.signal_end()
        return web.json_response({"flushed": depth})

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

    app = web.Application(middlewares=[cors_middleware], client_max_size=8 * 1024 * 1024)
    app.router.add_get("/healthz", healthz)
    app.router.add_post("/publish/start", publish_start)
    app.router.add_post("/publish/stop", publish_stop)
    app.router.add_post("/subscribe", subscribe)
    app.router.add_post("/subscribe/renegotiate", subscribe_renegotiate)
    app.router.add_post("/push_frame", push_frame)
    app.router.add_post("/push_frame_end", push_frame_end)
    # OPTIONS preflight 라우트 — middleware 가 응답 헤더 채움
    app.router.add_route("OPTIONS", "/subscribe", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/subscribe/renegotiate", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/publish/start", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/publish/stop", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/push_frame", lambda r: web.Response(status=204))
    app.router.add_route("OPTIONS", "/push_frame_end", lambda r: web.Response(status=204))

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
