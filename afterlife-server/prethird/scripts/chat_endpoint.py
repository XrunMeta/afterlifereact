"""chat_endpoint — /oth-path 검증용 텍스트 채팅 엔드포인트.

PRETHIRD_VERIFY_ENABLED=1 일 때만 make_app 에서 register_verify_routes 로 등록.
운영 통화 경로(/offer, pipeline)와 분리된 검증 전용 경로.
TTS/musetalk 미경유 — 순수 LLM 텍스트 in/out.

stateless: 브라우저가 messages 히스토리를 보관·전송. 서버는 세션 없음.
debug 투명성: done 이벤트에 final_messages·model·persona_bundle 동봉.
"""
from __future__ import annotations
import os
import json
import pathlib
import logging
import aiohttp
from aiohttp import web

from clone_dialog import fetch_bundle, bundle_to_messages, chat_stream

log = logging.getLogger("prethird.verify")

API_BASE = os.environ.get(
    "PRETHIRD_API_BASE",
    "https://edge-alt-preview.example.invalid",
)
_DEFAULT_MODEL = os.environ.get("PRETHIRD_OLLAMA_MODEL", "gemma3:27b")
_API_TIMEOUT_S = float(os.environ.get("PRETHIRD_VERIFY_API_TIMEOUT", "5.0"))
_BROWSER_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
               "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

def _bearer(req: web.Request) -> str | None:
    h = req.headers.get("Authorization", "")
    return h[7:] if h.startswith("Bearer ") else None

async def verify_clones(req: web.Request) -> web.Response:
    """드롭다운용 — api GET /oth-path 프록시, {id,name}만 추림."""
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    url = f"{API_BASE}/oth-path"
    try:
        timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.get(url, headers={
                "Authorization": f"Bearer {token}",
                "User-Agent": _BROWSER_UA,
            }) as r:
                if r.status != 200:
                    return web.json_response({"error": f"api {r.status}"}, status=r.status)
                data = await r.json()
    except Exception as e:
        log.warning("verify_clones failed: %s", e)
        return web.json_response({"error": str(e)}, status=502)
    items = data.get("items") or []
    clones = [{"id": it.get("id"), "name": it.get("name")}
              for it in items if it.get("id") is not None]
    return web.json_response({"clones": clones})

async def verify_login(req: web.Request) -> web.Response:
    """검증 도구 로그인 — api /oth-path 프록시. accessToken만 반환(비번 미저장·미로깅)."""
    body = await req.json()
    email = body.get("email")
    password = body.get("password")
    if not email or not password:
        return web.json_response({"error": "email/password required"}, status=400)
    url = f"{API_BASE}/oth-path"
    payload = json.dumps({"email": email, "password": password, "platform": "web"}).encode("utf-8")
    try:
        timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.post(url, data=payload, headers={
                "Content-Type": "application/json",
                "User-Agent": _BROWSER_UA,
            }) as r:
                txt = await r.text()
                if r.status != 200:
                    return web.json_response({"error": "login failed", "status": r.status}, status=r.status)
                data = json.loads(txt)
    except Exception as e:
        log.warning("verify_login failed: %s", type(e).__name__)  # 비번·예외 본문 미로깅
        return web.json_response({"error": "login error"}, status=502)
    return web.json_response({"accessToken": data.get("accessToken")})

async def verify_chat(req: web.Request) -> web.StreamResponse | web.Response:
    """SSE — system(or override) + history → chat_stream → token*/done/error.

    토큰 없으면 web.Response(401), 정상이면 web.StreamResponse(SSE).
    """
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    body = await req.json()
    raw_cid = body.get("clone_id")
    clone_id = raw_cid if isinstance(raw_cid, int) and raw_cid > 0 else None
    if clone_id is None:
        return web.json_response({"error": "invalid clone_id"}, status=400)
    messages = body.get("messages") or []
    model = body.get("model") or None
    temperature = body.get("temperature")
    system_override = body.get("system_override")
    if system_override is not None and len(str(system_override)) > 16000:
        return web.json_response({"error": "system_override too long (max 16000)"}, status=400)

    bundle = await fetch_bundle(API_BASE, clone_id, token)
    if system_override:
        system_messages = [{"role": "system", "content": system_override}]
    else:
        system_messages = bundle_to_messages(bundle)
    final_messages = system_messages + list(messages)

    resp = web.StreamResponse(status=200, headers={
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    })
    await resp.prepare(req)

    async def send(event: str, data: dict) -> None:
        payload = json.dumps(data, ensure_ascii=False)
        await resp.write(f"event: {event}\ndata: {payload}\n\n".encode("utf-8"))

    try:
        async for tok in chat_stream(final_messages, model=model, temperature=temperature):
            await send("token", {"text": tok})
        await send("done", {"debug": {
            "final_messages": final_messages,
            "model": model or _DEFAULT_MODEL,
            "persona_bundle": (bundle or {}).get("personaBundle"),
        }})
    except Exception as e:
        log.warning("verify_chat failed clone=%s: %s", clone_id, e)
        await send("error", {"message": str(e)})
    return resp

async def verify_page(_req: web.Request) -> web.FileResponse:
    html = pathlib.Path(__file__).resolve().parents[1] / "static" / "verify_chat.html"
    return web.FileResponse(html)

def register_verify_routes(app: web.Application) -> None:
    """PRETHIRD_VERIFY_ENABLED=1 일 때만 호출된다(호출 측에서 가드)."""
    app.router.add_get("/oth-path", verify_page)
    app.router.add_post("/oth-path", verify_login)
    app.router.add_get("/oth-path", verify_clones)
    app.router.add_post("/oth-path", verify_chat)
