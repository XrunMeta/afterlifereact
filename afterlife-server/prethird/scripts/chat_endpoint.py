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
import hmac
import pathlib
import logging
import aiohttp
from aiohttp import web

from clone_dialog import fetch_bundle, bundle_to_messages, chat_stream, extract_l2
from signaling import build_l2p_hint

log = logging.getLogger("prethird.verify")

API_BASE = os.environ.get(
    "PRETHIRD_API_BASE",
    "https://edge-alt-preview.example.invalid",
)
_DEFAULT_MODEL = os.environ.get("PRETHIRD_OLLAMA_MODEL", "gemma3:27b")
_API_TIMEOUT_S = float(os.environ.get("PRETHIRD_VERIFY_API_TIMEOUT", "5.0"))
_BROWSER_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
               "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
_DEV_SECRET = os.environ.get("PRETHIRD_DEV_SECRET", "")

def _bearer(req: web.Request) -> str | None:
    h = req.headers.get("Authorization", "")
    return h[7:] if h.startswith("Bearer ") else None

def _check_verify_pass(req) -> bool:
    """PRETHIRD_VERIFY_PASSWORD 설정 시 X-Verify-Pass 헤더 일치 요구. 미설정=통과(로컬 하위호환)."""
    expected = os.environ.get("PRETHIRD_VERIFY_PASSWORD")
    if not expected:
        return True
    got = req.headers.get("X-Verify-Pass", "")
    return hmac.compare_digest(got, expected)

async def _resolve_user_id(token: str) -> int | None:
    """로그인 토큰 → /oth-path → id. 실패 시 None."""
    url = f"{API_BASE}/oth-path"
    timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as sess:
        async with sess.get(url, headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": _BROWSER_UA,
        }) as r:
            if r.status != 200:
                return None
            data = await r.json()
    uid = (data.get("user") or {}).get("id")
    return uid if isinstance(uid, int) else None

async def verify_clones(req: web.Request) -> web.Response:
    """드롭다운용 — api GET /oth-path 프록시, {id,name}만 추림."""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
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

async def verify_persons(req: web.Request) -> web.Response:
    """드롭다운용 — api GET /oth-path?cloneId= 프록시, {id,name}만."""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    raw_cid = req.query.get("clone_id")
    params = {}
    if raw_cid is not None:
        try:
            params["cloneId"] = int(raw_cid)
        except (TypeError, ValueError):
            return web.json_response({"error": "invalid clone_id"}, status=400)
    try:
        timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.get(f"{API_BASE}/oth-path", params=params, headers={
                "Authorization": f"Bearer {token}", "User-Agent": _BROWSER_UA,
            }) as r:
                if r.status != 200:
                    return web.json_response({"error": f"api {r.status}"}, status=r.status)
                data = await r.json()
    except Exception as e:
        log.warning("verify_persons failed: %s", type(e).__name__)
        return web.json_response({"error": "upstream error"}, status=502)
    items = data.get("data") or []  # api GET /oth-path 는 {data:[...]} 계약(RN 공유)
    return web.json_response({"persons": [
        {"id": it.get("id"), "name": it.get("displayName")} for it in items if it.get("id") is not None
    ]})

async def verify_person_create(req: web.Request) -> web.Response:
    """새 화자 생성 — api POST /oth-path 프록시({cloneId, displayName})."""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    body = await req.json()
    raw_cid = body.get("clone_id")
    clone_id = raw_cid if isinstance(raw_cid, int) and raw_cid > 0 else None
    display_name = body.get("display_name")
    if clone_id is None or not display_name:
        return web.json_response({"error": "clone_id/display_name required"}, status=400)
    payload = json.dumps({"cloneId": clone_id, "displayName": display_name}).encode("utf-8")
    try:
        timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.post(f"{API_BASE}/oth-path", data=payload, headers={
                "Content-Type": "application/json", "Authorization": f"Bearer {token}", "User-Agent": _BROWSER_UA,
            }) as r:
                txt = await r.text()
                if r.status not in (200, 201):
                    return web.json_response({"error": f"api {r.status}", "body": txt}, status=r.status)
                data = json.loads(txt)
    except Exception as e:
        log.warning("verify_person_create failed: %s", type(e).__name__)
        return web.json_response({"error": "upstream error"}, status=502)
    return web.json_response({"id": data.get("id"), "displayName": data.get("displayName")})

async def verify_login(req: web.Request) -> web.Response:
    """검증 도구 로그인 — api /oth-path 프록시. accessToken만 반환(비번 미저장·미로깅)."""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
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
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
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
        # [T-116] 화자 선택 시 L2' 오버레이(실통화 _maybe_swap_l2p 재현). override 모드 제외.
        raw_pid = body.get("person_id")
        person_id = raw_pid if isinstance(raw_pid, int) and raw_pid > 0 else None
        if person_id is not None and _DEV_SECRET:
            try:
                dev_l2p = await _dev_l2p_data(clone_id, person_id)
            except Exception as e:
                log.warning("verify_chat dev_l2p failed clone=%s person=%s: %s", clone_id, person_id, type(e).__name__)
                dev_l2p = {}
            name = dev_l2p.get("displayName") or str(person_id)
            system_messages = system_messages + [
                {"role": "system", "content": build_l2p_hint(name, dev_l2p.get("data"))}
            ]
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

async def _dev_ont_data(clone_id: int, user_id: int) -> dict:
    """dev ont-raw GET → clone_ont.data 만 추출(verify_ont_raw와 동일 계약, DEV_SECRET 인증).
    실패 시 {} (표시용 before/after 이지 학습 자체를 막지 않음)."""
    url = f"{API_BASE}/oth-path?userId={user_id}"
    timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as sess:
        async with sess.get(url, headers={
            "Authorization": f"Bearer {_DEV_SECRET}",
            "User-Agent": _BROWSER_UA,
        }) as r:
            if r.status != 200:
                return {}
            data = await r.json()
    return (data or {}).get("data") or {}

async def _dev_l2p_data(clone_id: int, person_id: int) -> dict:
    """dev l2p-raw GET → {data, displayName}. 실패 시 {} (오버레이 없이 진행)."""
    url = f"{API_BASE}/oth-path?personId={person_id}"
    timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as sess:
        async with sess.get(url, headers={
            "Authorization": f"Bearer {_DEV_SECRET}", "User-Agent": _BROWSER_UA,
        }) as r:
            if r.status != 200:
                return {}
            return await r.json()

async def _ont_merge(clone_id: int, user_id: int, extracted: dict) -> dict:
    """dev ont-merge POST — 프로덕션 병합 로직(clone_ont) 재사용. 반환은 병합 후 clone_ont.data."""
    url = f"{API_BASE}/oth-path"
    body = json.dumps({
        "userId": user_id, "extracted": extracted, "source": "chat",
    }).encode("utf-8")
    timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as sess:
        async with sess.post(url, data=body, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {_DEV_SECRET}",
            "User-Agent": _BROWSER_UA,
        }) as r:
            txt = await r.text()
            if r.status != 200:
                raise RuntimeError(f"ont-merge http {r.status}")
            resp = json.loads(txt) or {}
            return resp.get("data") or {}

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
    """대화(멀티턴) → 프로덕션 학습 경로 재현: user 턴마다 프로덕션 extract_l2(화자분리,
    USER 한정)로 추출 → api dev ont-merge 로 턴 순서대로 누적 병합. {before, extracted, after} 반환.

    T-110 Phase2: 화자 미분리·클론 발화까지 섞어 추출하던 자체 4필드 추출기(_EXTRACT_SYS)를
    폐기하고 프로덕션과 동일한 clone_dialog.extract_l2 + ont-merge 로 교체(오학습 버그 근절).
    """
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
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

    if not _DEV_SECRET:
        return web.json_response({"error": "dev secret not configured"}, status=503)
    user_id = await _resolve_user_id(token)
    if user_id is None:
        return web.json_response({"error": "cannot resolve user"}, status=401)

    try:
        before = await _dev_ont_data(clone_id, user_id)
    except Exception as e:
        log.warning("verify_learn before-fetch failed clone=%s: %s", clone_id, type(e).__name__)
        before = {}

    # user 턴 + 바로 다음 assistant(클론) 응답을 (user_text, clone_reply) 쌍으로 매핑.
    # 마지막 user 턴 뒤에 assistant 가 없으면 clone_reply="". user 턴이 없으면 no-op(빈 리스트).
    n = len(turns)
    pairs: list[tuple[str, str]] = []
    for i, t in enumerate(turns):
        if t.get("role") != "user":
            continue
        user_text = str(t.get("content", ""))
        clone_reply = ""
        if i + 1 < n and turns[i + 1].get("role") == "assistant":
            clone_reply = str(turns[i + 1].get("content", ""))
        pairs.append((user_text, clone_reply))

    extracted_log: list[dict] = []
    after = before
    for user_text, clone_reply in pairs:
        try:
            ex = await extract_l2(user_text, clone_reply)
        except Exception as e:
            log.warning("verify_learn extract failed clone=%s: %s", clone_id, type(e).__name__)
            ex = {}
        extracted_log.append({"user_text": user_text, "clone_reply": clone_reply, "extracted": ex})
        if not ex:
            continue
        try:
            after = await _ont_merge(clone_id, user_id, ex)
        except Exception as e:
            log.warning("verify_learn merge failed clone=%s: %s", clone_id, type(e).__name__)

    return web.json_response({"before": before, "extracted": extracted_log, "after": after})

async def verify_l2_reset(req: web.Request) -> web.Response:
    """L2 4필드를 빈 값으로 저장(검증 중 기억 초기화)."""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
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

async def verify_bundle(req: web.Request) -> web.Response:
    """현재 L0/L1/L2 분리 조회 — 테이블 표시용.
    l0=personaBundle.l0, l2=고정4필드, l1=persona 나머지.
    """
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    raw_cid = req.query.get("clone_id")
    try:
        clone_id = int(raw_cid)
    except (TypeError, ValueError):
        clone_id = -1
    if clone_id <= 0:
        return web.json_response({"error": "invalid clone_id"}, status=400)

    bundle = await fetch_bundle(API_BASE, clone_id, token)
    pb = (bundle or {}).get("personaBundle") or {}
    l0 = pb.get("l0") or {}
    persona = pb.get("persona") or {}
    l2 = {k: (persona.get(k) or "") for k in _L2_FIELDS}
    l1 = {k: v for k, v in persona.items() if k not in _L2_FIELDS}
    return web.json_response({"l0": l0, "l1": l1, "l2": l2})

async def verify_ont_raw(req: web.Request) -> web.Response:
    """clone_ont.data 원문 + L1 원본 + 소비본(l2_consumed) 조회 — 모니터용."""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    raw_cid = req.query.get("clone_id")
    try:
        clone_id = int(raw_cid)
    except (TypeError, ValueError):
        clone_id = -1
    if clone_id <= 0:
        return web.json_response({"error": "invalid clone_id"}, status=400)
    if not _DEV_SECRET:
        return web.json_response({"error": "dev secret not configured"}, status=503)
    user_id = await _resolve_user_id(token)
    if user_id is None:
        return web.json_response({"error": "cannot resolve user"}, status=401)
    url = f"{API_BASE}/oth-path?userId={user_id}"
    try:
        timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.get(url, headers={
                "Authorization": f"Bearer {_DEV_SECRET}",
                "User-Agent": _BROWSER_UA,
            }) as r:
                if r.status != 200:
                    return web.json_response({"error": f"api {r.status}"}, status=r.status)
                data = await r.json()
    except Exception as e:
        log.warning("verify_ont_raw failed clone=%s: %s", clone_id, type(e).__name__)
        return web.json_response({"error": "upstream error"}, status=502)
    return web.json_response(data)

async def verify_page(_req: web.Request) -> web.FileResponse:
    html = pathlib.Path(__file__).resolve().parents[1] / "static" / "verify_chat.html"
    return web.FileResponse(html)

def register_verify_routes(app: web.Application) -> None:
    """PRETHIRD_VERIFY_ENABLED=1 일 때만 호출된다(호출 측에서 가드)."""
    app.router.add_get("/oth-path", verify_page)
    app.router.add_post("/oth-path", verify_login)
    app.router.add_get("/oth-path", verify_clones)
    app.router.add_get("/oth-path", verify_persons)
    app.router.add_post("/oth-path", verify_person_create)
    app.router.add_post("/oth-path", verify_chat)
    app.router.add_post("/oth-path", verify_learn)
    app.router.add_post("/oth-path", verify_l2_reset)
    app.router.add_get("/oth-path", verify_bundle)
    app.router.add_get("/oth-path", verify_ont_raw)
