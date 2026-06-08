from __future__ import annotations
import asyncio, time, pathlib, logging
from typing import Callable, Optional
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from session import SessionManager

_START = time.time()
log = logging.getLogger("prethird.signaling")

def make_app(pipeline_factory: Optional[Callable] = None) -> web.Application:
    """aiohttp Application 생성.

    Parameters
    ----------
    pipeline_factory : callable(sess) -> DialoguePipeline | None
        세션별 DialoguePipeline 생성 콜러블.
        None 이면 시그널링/idle 전용 모드(테스트·PoC).
    """
    app = web.Application()
    mgr = SessionManager()
    app["mgr"] = mgr

    async def healthz(_req: web.Request) -> web.Response:
        return web.json_response({
            "ok": True, "service": "prethird",
            "uptime_s": round(time.time() - _START, 1),
            "sessions": mgr.count(),
        })

    async def offer(request: web.Request) -> web.Response:
        params = await request.json()
        sess = mgr.create()
        pc = RTCPeerConnection()
        sess.pc = pc
        try:
            pc.addTrack(sess.video_track)
            pc.addTrack(sess.audio_track)

            # pipeline factory가 있으면 세션에 주입
            if pipeline_factory is not None:
                sess.pipeline = pipeline_factory(sess)

            @pc.on("datachannel")
            def _on_dc(channel):
                sess.datachannel = channel

                @channel.on("message")
                def _on_msg(msg):
                    import json
                    try:
                        data = json.loads(msg)
                    except (ValueError, TypeError):
                        return
                    if data.get("type") == "say" and sess.pipeline is not None:
                        text = data.get("text", "")
                        if not text:
                            return
                        sess.set_state("speaking")
                        async def _run():
                            try:
                                await sess.pipeline.say(text)
                            except Exception as e:
                                log.warning("session %s say failed: %s", sess.session_id, e)
                            finally:
                                sess.set_state("idle")
                        asyncio.ensure_future(_run())

            @pc.on("connectionstatechange")
            async def _on_state():
                log.info("session %s pc state=%s", sess.session_id, pc.connectionState)
                if pc.connectionState in ("failed", "closed", "disconnected"):
                    await pc.close()
                    mgr.remove(sess.session_id)

            await pc.setRemoteDescription(
                RTCSessionDescription(sdp=params["sdp"], type=params["type"]))
            answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
        except Exception:
            await pc.close()
            mgr.remove(sess.session_id)
            raise
        return web.json_response({
            "session_id": sess.session_id,
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
        })

    app.router.add_get("/healthz", healthz)
    app.router.add_post("/offer", offer)
    app.router.add_static("/static/", path=str(
        pathlib.Path(__file__).resolve().parents[1] / "static"))
    return app
