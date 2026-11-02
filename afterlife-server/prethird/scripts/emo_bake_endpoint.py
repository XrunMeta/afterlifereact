"""emo_bake_endpoint.py — 감정 영상 굽기 endpoint (AFL-1073).

  POST /oth-path {cloneId, faceUrl}
      클론을 만들 때 afterlifeapi createClone 이 부른다(prebuild 와 같은 PREBUILD_SECRET Bearer).
      굽기 대상(관리자 「감정 설정」 영상 값) 또는 「생성 즉시 굽기」(video.bake_on_create)가 켜져 있으면
      얼굴 사진을 video-ref 에 받고 굽기 대기열에 넣는다.
      202 {accepted:true} 즉시 응답 · 대상이 아니면 200 {accepted:false, reason:"not_target"}.
  GET /oth-path?scope=relevant|all   → emo_bake.status
  POST /oth-path {cloneId}            → 표시를 비우고 처음부터 다시 굽기
      관리자용 두 개는 LEARN_SECRET Bearer(emotion_admin_endpoint 와 같음). afterlifeapi requireAdmin 프록시만 부른다.
"""
from __future__ import annotations

import asyncio
import logging
import re

from aiohttp import web

import emo_bake
import emotion_video
from asset_fetch import fetch_to
from emotion_admin_endpoint import _auth_ok, _unauth
from prebuild import _authorized as _prebuild_authorized

log = logging.getLogger("prethird.emo_bake_endpoint")

CLONE_ID_RE = re.compile(r"^[0-9]{1,12}$")
_bg_tasks: set[asyncio.Task] = set()


async def _fetch_and_enqueue(root: str, clone_id: str, face_url: str, fetch_fn=fetch_to) -> bool:
    dest = emo_bake.face_path(root, clone_id)
    try:
        await fetch_fn(face_url, dest)
    except Exception as e:  # noqa: BLE001 — 실패해도 통화 시작 때 다시 받는다
        log.warning("[AFL-1073] 굽기용 얼굴 사진 받기 실패 clone=%s: %s", clone_id, e)
        return False
    added = emo_bake.enqueue(root, clone_id, on_create=True)
    log.info("[AFL-1073] 클론 생성 굽기 clone=%s 대기열=%s", clone_id, added)
    return added


def _clone_id(body) -> str | None:
    c = str(body.get("cloneId", "")) if isinstance(body, dict) else ""
    return c if CLONE_ID_RE.fullmatch(c) else None


def make_handlers(root: str, fetch_fn=fetch_to):
    async def emo_bake_handler(req: web.Request) -> web.Response:
        if not _prebuild_authorized(req):
            return web.json_response({"error": "unauthorized"}, status=401)
        try:
            body = await req.json()
        except Exception:
            return web.json_response({"error": "invalid json"}, status=400)
        clone_id = _clone_id(body)
        face_url = body.get("faceUrl") if isinstance(body, dict) else None
        if not clone_id or not isinstance(face_url, str) or not face_url:
            return web.json_response({"error": "cloneId and faceUrl required"}, status=400)
        if not (emotion_video.bake_enabled(clone_id) or emotion_video.bake_on_create()):
            log.info("[AFL-1073] 클론 생성 굽기 대상 아님 clone=%s", clone_id)
            return web.json_response({"accepted": False, "reason": "not_target"})
        task = asyncio.ensure_future(_fetch_and_enqueue(root, clone_id, face_url, fetch_fn))
        _bg_tasks.add(task)
        task.add_done_callback(_bg_tasks.discard)
        return web.json_response({"accepted": True}, status=202)

    async def status_handler(req: web.Request) -> web.Response:
        if not _auth_ok(req):
            return _unauth()
        scope = req.query.get("scope", "relevant")
        if scope not in ("relevant", "all"):
            return web.json_response({"error": "scope must be relevant|all"}, status=400)
        return web.json_response(emo_bake.status(root, scope))

    async def rebake_handler(req: web.Request) -> web.Response:
        if not _auth_ok(req):
            return _unauth()
        try:
            body = await req.json()
        except Exception:
            return web.json_response({"error": "invalid json"}, status=400)
        clone_id = _clone_id(body)
        if not clone_id:
            return web.json_response({"error": "invalid cloneId"}, status=400)
        if clone_id in emo_bake._pending:
            return web.json_response({"error": "이미 대기 중이거나 굽는 중이에요", "code": "BUSY",
                                      "status": emo_bake.clone_status(root, clone_id)}, status=409)
        if not emo_bake.enqueue(root, clone_id, rebake=True):
            return web.json_response({"error": "얼굴 사진이 없어 구울 수 없어요(한 번 통화하면 받아요)",
                                      "code": "NO_FACE"}, status=409)
        log.info("[AFL-1073] 관리자 다시 굽기 clone=%s", clone_id)
        return web.json_response({"accepted": True, "status": emo_bake.clone_status(root, clone_id)}, status=202)

    return emo_bake_handler, status_handler, rebake_handler


def register_emo_bake_routes(app: web.Application, video_ref_root: str) -> None:
    emo_bake_handler, status_handler, rebake_handler = make_handlers(video_ref_root)
    app.router.add_post("/emo-bake", emo_bake_handler)
    app.router.add_get("/oth-path", status_handler)
    app.router.add_post("/oth-path", rebake_handler)


async def _drain_tasks_for_test() -> None:
    if _bg_tasks:
        await asyncio.gather(*list(_bg_tasks), return_exceptions=True)
