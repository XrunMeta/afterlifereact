from __future__ import annotations
import time
from aiohttp import web

_START = time.time()

def make_app() -> web.Application:
    app = web.Application()
    app["sessions"] = {}  # session_id -> Session (이후 태스크에서 SessionManager 로 교체)

    async def healthz(_req: web.Request) -> web.Response:
        return web.json_response({
            "ok": True,
            "service": "prethird",
            "uptime_s": round(time.time() - _START, 1),
            "sessions": len(app["sessions"]),
        })

    app.router.add_get("/healthz", healthz)
    return app
