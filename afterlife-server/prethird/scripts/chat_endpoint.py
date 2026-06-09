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

from clone_dialog import fetch_bundle, bundle_to_messages, chat_stream, chat_once

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
        return web.json_response({"error": "upstream error"}, status=502)
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

_L2_FIELDS = ["memory_summary", "relationship", "context", "recent_topics"]

_EXTRACT_SYS = """너는 대화에서 한 인물(클론)이 장기적으로 기억해야 할 정보를 정리하는 보조자다.
아래 "기존 기억"과 "새 대화"를 보고, 갱신된 기억을 4개 필드 JSON으로만 출력하라.
- memory_summary: 사용자에 대한 누적 사실. "키: 값" 한 줄 항목들로 정리(예: "이름: 철수\\n취향: 매운음식\\n반려동물: 고양이")
- relationship: 사용자와의 관계 상태/변화 ("키: 값" 항목)
- context: 현재 진행 중인 맥락/상황 ("키: 값" 항목)
- recent_topics: 최근 대화 화제(쉼표 구분 키워드)
**중복 키 규칙**: 같은 종류의 정보(같은 키)가 기존 기억에 이미 있으면, 같은 키를 중복으로 새로 만들지 말고 그 키의 값을 새 정보로 업데이트하라. (예: 기존 "취향: 매운음식" + 새 정보 단것 선호 → "취향: 단음식"으로 갱신)
기존 기억의 다른 키는 보존하되 새 정보로 갱신·보강하라. 모순되면 새 정보 우선.
설명·코드블록 없이 {"memory_summary":..,"relationship":..,"context":..,"recent_topics":..} JSON만 출력."""

def _l2_from_persona(persona: dict) -> dict:
    return {k: (persona.get(k) or "") for k in _L2_FIELDS}

def _parse_l2_json(content: str) -> dict | None:
    """LLM 응답에서 첫 { ~ 마지막 } 추출 후 json.loads. 실패 시 None."""
    if not content:
        return None
    s = content.find("{")
    e = content.rfind("}")
    if s < 0 or e <= s:
        return None
    try:
        data = json.loads(content[s:e + 1])
    except Exception:
        return None
    if not isinstance(data, dict):
        return None
    return {k: (str(data.get(k, "")) if data.get(k) is not None else "") for k in _L2_FIELDS}

async def _patch_l2(clone_id: int, fields: dict, token: str) -> dict:
    """api PATCH /oth-path 호출 → 저장된 l2_profile 반환."""
    url = f"{API_BASE}/oth-path"
    payload = json.dumps(fields).encode("utf-8")
    timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as sess:
        async with sess.patch(url, data=payload, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "User-Agent": _BROWSER_UA,
        }) as r:
            txt = await r.text()
            if r.status != 200:
                raise RuntimeError(f"l2 patch http {r.status}")
            return (json.loads(txt) or {}).get("l2_profile") or fields

async def verify_learn(req: web.Request) -> web.Response:
    """대화 턴 → L2 4필드 추출 → api L2 write. {before, extracted, saved} 반환."""
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    body = await req.json()
    raw_cid = body.get("clone_id")
    clone_id = raw_cid if isinstance(raw_cid, int) and raw_cid > 0 else None
    if clone_id is None:
        return web.json_response({"error": "invalid clone_id"}, status=400)
    turns = body.get("turns") or []
    if len(turns) > 100 or any(len(str(t.get("content", ""))) > 2000 for t in turns):
        return web.json_response({"error": "turns too large (max 100 turns, 2000 chars each)"}, status=400)

    bundle = await fetch_bundle(API_BASE, clone_id, token)
    persona = ((bundle or {}).get("personaBundle") or {}).get("persona") or {}
    before = _l2_from_persona(persona)
    name = persona.get("displayName") or "클론"

    convo = "\n".join(f"{'사용자' if t.get('role') == 'user' else name}: {t.get('content','')}"
                      for t in turns)
    user_msg = f"기존 기억:\n{json.dumps(before, ensure_ascii=False)}\n\n새 대화:\n{convo}"
    try:
        content = await chat_once(
            [{"role": "system", "content": _EXTRACT_SYS},
             {"role": "user", "content": user_msg}],
            temperature=0.3, fmt="json")
    except Exception as e:
        log.warning("verify_learn extract failed clone=%s: %s", clone_id, type(e).__name__)
        return web.json_response({"before": before, "extracted": None, "saved": None})

    extracted = _parse_l2_json(content)
    if extracted is None:
        return web.json_response({"before": before, "extracted": None, "saved": None})

    try:
        saved = await _patch_l2(clone_id, extracted, token)
    except Exception as e:
        log.warning("verify_learn save failed clone=%s: %s", clone_id, type(e).__name__)
        return web.json_response({"before": before, "extracted": extracted, "saved": None})

    return web.json_response({"before": before, "extracted": extracted, "saved": saved})

async def verify_l2_reset(req: web.Request) -> web.Response:
    """L2 4필드를 빈 값으로 저장(검증 중 기억 초기화)."""
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    body = await req.json()
    raw_cid = body.get("clone_id")
    clone_id = raw_cid if isinstance(raw_cid, int) and raw_cid > 0 else None
    if clone_id is None:
        return web.json_response({"error": "invalid clone_id"}, status=400)
    empty = {k: "" for k in _L2_FIELDS}
    try:
        saved = await _patch_l2(clone_id, empty, token)
    except Exception as e:
        log.warning("verify_l2_reset failed clone=%s: %s", clone_id, type(e).__name__)
        return web.json_response({"error": "reset failed"}, status=502)
    return web.json_response({"saved": saved})

async def verify_page(_req: web.Request) -> web.FileResponse:
    html = pathlib.Path(__file__).resolve().parents[1] / "static" / "verify_chat.html"
    return web.FileResponse(html)

def register_verify_routes(app: web.Application) -> None:
    """PRETHIRD_VERIFY_ENABLED=1 일 때만 호출된다(호출 측에서 가드)."""
    app.router.add_get("/oth-path", verify_page)
    app.router.add_post("/oth-path", verify_login)
    app.router.add_get("/oth-path", verify_clones)
    app.router.add_post("/oth-path", verify_chat)
    app.router.add_post("/oth-path", verify_learn)
    app.router.add_post("/oth-path", verify_l2_reset)
