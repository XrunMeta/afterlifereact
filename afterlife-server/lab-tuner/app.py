from __future__ import annotations
import asyncio
import json
import os
import pathlib
import re

from aiohttp import web
from signaling import make_app          # prethird
from live_guard import LiveBusyError

_STATIC = pathlib.Path(__file__).resolve().parent / "static"

# el RISK: run_id는 ArtifactStore._next_id()가 생성하는 "run{n:05d}" 형식만 허용.
# store.path()/load_text() 등에 넘기기 전 반드시 이 가드를 통과해야 한다
# (경로탈출 방지 — "/", ".." 등 포함 값은 전부 거부).
_RUN_ID_RE = re.compile(r"^run\d+$")


def _validate_run_id(rid) -> str | None:
    """rid가 유효한 run_id 형식이 아니면 에러 메시지, 유효하면 None."""
    if not isinstance(rid, str) or not _RUN_ID_RE.match(rid):
        return f"invalid run_id: {rid!r}"
    return None


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

    async def list_runs(_req):
        # UI run 타임라인(tuner.js loadRuns) — ArtifactStore.list_runs() 그대로 노출.
        # 읽기 전용 GET, 사용자 입력 없음(경로탈출 위험 없음).
        return web.json_response(store.list_runs())

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

    async def replay_tts(req):
        data = await req.json()
        rid = data.get("run_id")
        err = _validate_run_id(rid)
        if err:
            return web.json_response({"error": err}, status=400)
        if say_fn is None:
            return web.json_response({"error": "say_fn 미주입"}, status=503)
        text = store.load_text(rid, "llm.txt")
        wav = await say_fn(text, data.get("se_path"))
        store.save_bytes(rid, "answer.wav", wav)
        return web.json_response({"run_id": rid, "bytes": len(wav)})

    async def replay_fifth(req):
        data = await req.json()
        rid = data.get("run_id")
        err = _validate_run_id(rid)
        if err:
            return web.json_response({"error": err}, status=400)
        if guard is not None:
            try:
                guard.assert_free()
            except LiveBusyError as exc:
                return web.json_response({"error": str(exc)}, status=409)
        wav_path = store.path(rid, "answer.wav")
        # 공유 라이브 렌더(:8810)에 직접 /render POST (KnobsFifthInproc 재사용)
        import harness
        renderer = harness.KnobsFifthInproc(data.get("video_path", ""), registry=registry,
                                             render_url=render_url)
        renderer.load()
        n = [0]
        renderer.infer(wav_path,
                       lambda arr: n.__setitem__(0, n[0] + 1),
                       video_path=data.get("video_path"))
        return web.json_response({"run_id": rid, "frames": n[0]})

    app.router.add_get("/knobs", get_knobs)
    app.router.add_post("/knobs", post_knobs)
    app.router.add_get("/runs", list_runs)
    app.router.add_get("/metrics", metrics_sse)
    app.router.add_get("/live-status", live_status)   # UI 배너(라이브 통화 중 튜닝 대기)
    app.router.add_get("/", index)
    app.router.add_get("/tuner.js", tuner_js)
    app.router.add_post("/replay/tts", replay_tts)
    app.router.add_post("/replay/fifth", replay_fifth)
    return app
