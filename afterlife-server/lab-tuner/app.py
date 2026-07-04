from __future__ import annotations
import asyncio
import json
import os
import pathlib

from aiohttp import web
from signaling import make_app          # prethird

_STATIC = pathlib.Path(__file__).resolve().parent / "static"


def build_app(registry, factory, store, say_fn=None, render_url=None, guard=None) -> web.Application:
    # say_fn/render_url/guard는 Task 9·12에서 사용(초기 Task 11 단계는 None 허용).
    app = make_app(pipeline_factory=factory)   # /offer /healthz /static/ /prebuild
    app["lab_registry"] = registry
    app["lab_store"] = store
    app["lab_guard"] = guard
    app["lab_metrics"] = {"last": {}}

    async def live_status(_req):
        busy = guard.is_busy() if guard is not None else False
        return web.json_response({"busy": busy})

    async def get_knobs(_req):
        return web.json_response(registry.get().to_dict())

    async def post_knobs(req):
        partial = await req.json()
        merged = registry.update(partial)
        return web.json_response(merged.to_dict())

    async def metrics_sse(req):
        resp = web.StreamResponse()
        resp.headers["Content-Type"] = "text/event-stream"
        resp.headers["Cache-Control"] = "no-cache"
        await resp.prepare(req)
        try:
            while True:
                payload = json.dumps(app["lab_metrics"]["last"])
                await resp.write(f"data: {payload}\n\n".encode())
                await asyncio.sleep(0.5)
        except (asyncio.CancelledError, ConnectionResetError):
            pass
        return resp

    async def index(_req):
        return web.FileResponse(_STATIC / "tuner.html")

    async def tuner_js(_req):
        return web.FileResponse(_STATIC / "tuner.js")

    app.router.add_get("/knobs", get_knobs)
    app.router.add_post("/knobs", post_knobs)
    app.router.add_get("/metrics", metrics_sse)
    app.router.add_get("/live-status", live_status)   # UI 배너(라이브 통화 중 튜닝 대기)
    app.router.add_get("/", index)
    app.router.add_get("/tuner.js", tuner_js)
    return app
