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
from clone_dialog.persona_prompt import sanitize_display_name
from clone_dialog.llm_client import chat_once
from clone_dialog import cfai_catalog

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
    """드롭다운용 — api GET /oth-path?cloneId= 프록시.

    [T-257 후속] {id,name} 에 더해 얼굴 메타 2종을 그대로 통과시킨다:
      faceCount — 그 클론 스코프에 등록된 얼굴 벡터 수(clone_person_faces)
      isSelf    — 그 클론의 self(제작자) person 인지

    필터링은 여기서 하지 않는다 — UI(verify_chat.html)가 "얼굴 기반 화자만" 을
    판단한다. 서버가 미리 걸러버리면 랩에서 전체를 확인할 길이 사라지기 때문.
    """
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
        {
            "id": it.get("id"),
            "name": it.get("displayName"),
            # 구 api 응답(필드 부재)에도 안전하도록 기본값을 둔다 — 배포 순서가 어긋나도
            # 드롭다운이 비어버리지 않고 "얼굴 0" 으로 보일 뿐이다.
            "faceCount": it.get("faceCount") or 0,
            "isSelf": bool(it.get("isSelf")),
        }
        for it in items if it.get("id") is not None
    ]})

async def verify_knowledge_questions(req: web.Request) -> web.Response:
    """L1 학습 질문 세트 — api GET /oth-path 프록시."""
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
                "Authorization": f"Bearer {token}", "User-Agent": _BROWSER_UA,
            }) as r:
                if r.status != 200:
                    return web.json_response({"error": f"api {r.status}"}, status=r.status)
                data = await r.json()
    except Exception as e:
        log.warning("verify_knowledge_questions failed: %s", type(e).__name__)
        return web.json_response({"error": "upstream error"}, status=502)
    return web.json_response({"questions": data.get("questions") or []})

async def verify_knowledge(req: web.Request) -> web.Response:
    """클론의 현재 학습된 knowledge 배열 — api GET /oth-path 프록시."""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    raw_cid = req.query.get("clone_id")
    try:
        cid = int(raw_cid)
    except (TypeError, ValueError):
        return web.json_response({"error": "invalid clone_id"}, status=400)
    url = f"{API_BASE}/oth-path"
    try:
        timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.get(url, headers={
                "Authorization": f"Bearer {token}", "User-Agent": _BROWSER_UA,
            }) as r:
                if r.status != 200:
                    return web.json_response({"error": f"api {r.status}"}, status=r.status)
                data = await r.json()
    except Exception as e:
        log.warning("verify_knowledge failed: %s", type(e).__name__)
        return web.json_response({"error": "upstream error"}, status=502)
    return web.json_response({"items": data.get("items") or []})

async def verify_knowledge_interpret(req: web.Request) -> web.Response:
    """답변 → slot 요약 + 리플라이 — api POST /oth-path 프록시.
    body: {clone_id, questionKey, answer}. api 는 Bearer 게이트라 X-Internal-Secret 불필요."""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "invalid json body"}, status=400)
    try:
        cid = int(body.get("clone_id"))
    except (TypeError, ValueError):
        return web.json_response({"error": "invalid clone_id"}, status=400)
    payload = {"questionKey": body.get("questionKey"), "answer": body.get("answer")}
    url = f"{API_BASE}/oth-path"
    try:
        # interpret 은 가비아 LLM 왕복 포함 — api 쪽 20s. 여유롭게 25s.
        timeout = aiohttp.ClientTimeout(total=25.0)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.post(url, json=payload, headers={
                "Authorization": f"Bearer {token}", "User-Agent": _BROWSER_UA,
            }) as r:
                data = await r.json()
                if r.status != 200:
                    # blacklist_hit(400) 등은 그대로 전달
                    return web.json_response(data, status=r.status)
    except Exception as e:
        log.warning("verify_knowledge_interpret failed: %s", type(e).__name__)
        return web.json_response({"error": "upstream error"}, status=502)
    return web.json_response({
        "slots": data.get("slots") or [], "reply": data.get("reply") or "",
    })

async def verify_knowledge_save(req: web.Request) -> web.Response:
    """knowledge 전량 저장 — api PUT /oth-path 프록시.
    body: {clone_id, items:[{key?,q?,a}]}"""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "invalid json body"}, status=400)
    try:
        cid = int(body.get("clone_id"))
    except (TypeError, ValueError):
        return web.json_response({"error": "invalid clone_id"}, status=400)
    items = body.get("items")
    if not isinstance(items, list):
        return web.json_response({"error": "invalid items"}, status=400)
    url = f"{API_BASE}/oth-path"
    try:
        timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.put(url, json={"items": items}, headers={
                "Authorization": f"Bearer {token}", "User-Agent": _BROWSER_UA,
            }) as r:
                if r.status != 200:
                    txt = await r.text()
                    return web.json_response({"error": f"api {r.status}", "detail": txt[:300]}, status=r.status)
    except Exception as e:
        log.warning("verify_knowledge_save failed: %s", type(e).__name__)
        return web.json_response({"error": "upstream error"}, status=502)
    return web.json_response({"ok": True})

_AUTOANSWER_SYSTEM = (
    "너는 어떤 사람(페르소나)의 성격·취향·습관을 잘 아는 화자다. "
    "주어진 질문에 대해 그 사람 입장에서 자연스러운 한국어 구어체로 한두 문장, "
    "40자 내외로 사실적인 답을 한다. 질문을 되묻거나 메타발화('~라고 답할게요')를 하지 않고 "
    "답 내용만 말한다. 양자택일 질문이면 한쪽을 분명히 고른다."
)

async def verify_knowledge_autoanswer(req: web.Request) -> web.Response:
    """풀오토 e2e 용 — 질문에 대한 가상 오너 답변을 LLM 으로 생성. body: {question, hint?, persona_name?}"""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    if not _bearer(req):
        return web.json_response({"error": "missing bearer token"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "invalid json body"}, status=400)
    question = (body.get("question") or "").strip()
    if not question or len(question) > 500:
        return web.json_response({"error": "invalid question"}, status=400)
    hint = (body.get("hint") or "").strip()
    persona = (body.get("persona_name") or "").strip()
    user = question
    if persona:
        user = f"[대상: {persona}] {user}"
    if hint:
        user = f"{user}\n(참고: {hint})"
    messages = [
        {"role": "system", "content": _AUTOANSWER_SYSTEM},
        {"role": "user", "content": user},
    ]
    try:
        raw = await chat_once(messages, temperature=0.8)
    except Exception as e:
        log.warning("verify_knowledge_autoanswer LLM failed: %s", type(e).__name__)
        return web.json_response({"error": "llm_failed"}, status=502)
    stripped = (raw or "").strip().strip('"')
    answer = stripped.splitlines()[0][:300] if stripped else ""
    if not answer:
        return web.json_response({"error": "empty_answer"}, status=502)
    return web.json_response({"answer": answer})

_CONFIRM_CHECK_SYSTEM = (
    "너는 논리 검증기다. 오너가 질문에 답했고, 시스템이 그 답을 3인칭 확인문구로 정리했다. "
    "확인문구가 오너 답변의 긍정/부정 방향과 선택(양자택일이면 오너가 고른 쪽)을 보존하면 consistent=true, "
    "반전·왜곡했으면 consistent=false 다. "
    'JSON 으로만 답하라: {"consistent": true, "reason": "한 문장"}'
)

async def verify_knowledge_confirm_check(req: web.Request) -> web.Response:
    """풀오토 e2e 용 — 확인문구(reply)가 원답변의 논리 방향을 보존하는지 LLM 판정.
    body: {question, answer, reply} → {consistent, reason}"""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    if not _bearer(req):
        return web.json_response({"error": "missing bearer token"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "invalid json body"}, status=400)
    question = (body.get("question") or "").strip()
    answer = (body.get("answer") or "").strip()
    reply = (body.get("reply") or "").strip()
    if not question or not answer or not reply or max(len(question), len(answer), len(reply)) > 1000:
        return web.json_response({"error": "invalid fields"}, status=400)
    user = f"질문: {question}\n오너 답변: {answer}\n확인문구: {reply}"
    messages = [
        {"role": "system", "content": _CONFIRM_CHECK_SYSTEM},
        {"role": "user", "content": user},
    ]
    try:
        raw = await chat_once(messages, fmt="json", temperature=0.0)
    except Exception as e:
        log.warning("verify_knowledge_confirm_check LLM failed: %s", type(e).__name__)
        return web.json_response({"error": "llm_failed"}, status=502)
    try:
        data = json.loads(raw or "")
        consistent = bool(data.get("consistent"))
        reason = str(data.get("reason") or "")[:300]
    except Exception:
        return web.json_response({"error": "parse_failed"}, status=502)
    return web.json_response({"consistent": consistent, "reason": reason})

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
        # [T-116] 화자 선택 시 L2' 오버레이(실통화 _maybe_swap_l2p 재현). override 모드 제외.
        raw_pid = body.get("person_id")
        person_id = raw_pid if isinstance(raw_pid, int) and raw_pid > 0 else None
        # [T-252] speaker_state="unknown" → 상태 4(unknown_face/multi_face) 재현.
        # 실서버 라우트로 상태 4를 검증할 수단이 이것뿐이다(el I-3 부수 지적).
        unconfirmed = body.get("speaker_state") == "unknown"
        dev_l2p: dict = {}
        if person_id is not None and _DEV_SECRET and not unconfirmed:
            try:
                dev_l2p = await _dev_l2p_data(clone_id, person_id) or {}
            except Exception as e:
                log.warning("verify_chat dev_l2p failed clone=%s person=%s: %s", clone_id, person_id, type(e).__name__)
                dev_l2p = {}
        # T-252: dev L2'도 append가 아니라 재조립으로 주입한다 — 실통화 경로
        # (_maybe_swap_l2p)와 동일한 프롬프트가 나와야 verify 결과가 실통화를 대표한다.
        #
        # [T-252 fix / el I-3] 상태 판정을 통화 경로와 일치시켰다.
        # 1. 조회 실패/404({})여도 person_id 가 주어졌으면 화자 확정 경로(상태 2)다.
        #    예전엔 `if dev_l2p:` 로 감싸서 _speaker=None(상태 1)이 됐는데, 통화 경로는
        #    같은 조건에서 {"name":..., "l2p_data":None} 을 넘긴다. 하필 최빈 경로
        #    (신규 person = clone_ont_person 행 없음)가 verify 에서만 다르게 분기해
        #    "verify 가 실통화를 대표한다" 는 주석이 사실이 아니었다.
        # 2. `or str(person_id)` 폴백을 제거했다 — 이름을 모르는데 숫자("7")를 이름으로
        #    머리말에 박아 넣던 경로다. 통화 경로는 sanitize 실패 시 None → 상태 3 이다.
        _speaker = None
        if unconfirmed:
            _speaker = {"unconfirmed": True}
        elif person_id is not None:
            _speaker = {
                "name": sanitize_display_name(dev_l2p.get("displayName")),
                "l2p_data": dev_l2p.get("data"),
            }
        system_messages = bundle_to_messages(bundle, speaker=_speaker)
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

async def _ont_merge_person(clone_id: int, person_id: int, extracted: dict) -> dict:
    """dev ont-merge-person POST — clone_ont_person 병합. 반환은 병합 후 data."""
    url = f"{API_BASE}/oth-path"
    body = json.dumps({"personId": person_id, "extracted": extracted, "source": "chat"}).encode("utf-8")
    timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as sess:
        async with sess.post(url, data=body, headers={
            "Content-Type": "application/json", "Authorization": f"Bearer {_DEV_SECRET}", "User-Agent": _BROWSER_UA,
        }) as r:
            txt = await r.text()
            if r.status != 200:
                raise RuntimeError(f"ont-merge-person http {r.status}")
            return (json.loads(txt) or {}).get("data") or {}

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

def _pairs_from_turns(turns: list) -> list:
    """user 턴 + 바로 다음 assistant 응답을 (user_text, clone_reply) 쌍으로. 마지막 user 뒤 없으면 clone_reply=''."""
    n = len(turns)
    pairs = []
    for i, t in enumerate(turns):
        if t.get("role") != "user":
            continue
        clone_reply = str(turns[i + 1].get("content", "")) if i + 1 < n and turns[i + 1].get("role") == "assistant" else ""
        pairs.append((str(t.get("content", "")), clone_reply))
    return pairs

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

    raw_pid = body.get("person_id")
    person_id = raw_pid if isinstance(raw_pid, int) and raw_pid > 0 else None

    if not _DEV_SECRET:
        return web.json_response({"error": "dev secret not configured"}, status=503)

    if person_id is not None:
        # [T-116] 화자별 학습: clone_ont_person 경로(dev). user_id 불필요.
        try:
            before = (await _dev_l2p_data(clone_id, person_id)).get("data") or {}
        except Exception:
            before = {}
        extracted_log, after = [], before
        for user_text, clone_reply in _pairs_from_turns(turns):
            try:
                ex = await extract_l2(user_text, clone_reply)
            except Exception as e:
                log.warning("verify_learn(person) extract failed clone=%s: %s", clone_id, type(e).__name__)
                ex = {}
            extracted_log.append({"user_text": user_text, "clone_reply": clone_reply, "extracted": ex})
            if not ex:
                continue
            try:
                after = await _ont_merge_person(clone_id, person_id, ex)
            except Exception as e:
                log.warning("verify_learn(person) merge failed clone=%s: %s", clone_id, type(e).__name__)
        return web.json_response({"before": before, "extracted": extracted_log, "after": after})

    user_id = await _resolve_user_id(token)
    if user_id is None:
        return web.json_response({"error": "cannot resolve user"}, status=401)

    try:
        before = await _dev_ont_data(clone_id, user_id)
    except Exception as e:
        log.warning("verify_learn before-fetch failed clone=%s: %s", clone_id, type(e).__name__)
        before = {}

    extracted_log: list[dict] = []
    after = before
    for user_text, clone_reply in _pairs_from_turns(turns):
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

async def verify_l2p(req: web.Request) -> web.Response:
    """[T-116] 화자별 L2'(clone_ont_person) 조회 — L2 패널 화자별 표시용.
    dev l2p-raw 프록시(_dev_l2p_data 재사용) → {data, displayName}. bearer+verify_pass 게이트."""
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    token = _bearer(req)
    if not token:
        return web.json_response({"error": "missing bearer token"}, status=401)
    raw_cid = req.query.get("clone_id")
    raw_pid = req.query.get("person_id")
    try:
        clone_id = int(raw_cid)
        person_id = int(raw_pid)
    except (TypeError, ValueError):
        return web.json_response({"error": "invalid clone_id or person_id"}, status=400)
    if clone_id <= 0 or person_id <= 0:
        return web.json_response({"error": "invalid clone_id or person_id"}, status=400)
    if not _DEV_SECRET:
        return web.json_response({"error": "dev secret not configured"}, status=503)
    try:
        data = await _dev_l2p_data(clone_id, person_id)
    except Exception as e:
        log.warning("verify_l2p failed clone=%s person=%s: %s", clone_id, person_id, type(e).__name__)
        return web.json_response({"error": "upstream error"}, status=502)
    return web.json_response(data)

_CF_MODELS_URL = ("https://oth-path.cloudflare.com/client/v4/accounts/{acct}"
                  "/ai/models/search?task=Text+Generation&per_page=200")

async def _cf_list_models() -> list[str]:
    """CF 에서 텍스트 생성 모델 이름 목록을 받아온다. 실패 시 예외를 올린다.

    별도 함수인 이유는 테스트가 여기만 갈아끼우면 되게 하기 위해서다.
    """
    acct = os.environ.get("CF_ACCOUNT_ID")
    token = os.environ.get("CF_AI_TOKEN")
    if not (acct and token):
        raise RuntimeError("CF_ACCOUNT_ID / CF_AI_TOKEN 미설정")
    timeout = aiohttp.ClientTimeout(total=_API_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as sess:
        async with sess.get(_CF_MODELS_URL.format(acct=acct),
                            headers={"Authorization": f"Bearer {token}"}) as r:
            r.raise_for_status()
            data = await r.json()
    if not data.get("success"):
        raise RuntimeError(f"cf models search 실패: {str(data)[:120]}")
    return [m["name"] for m in data.get("result", [])]

async def verify_llm_models(req: web.Request) -> web.Response:
    """모델 드롭다운용 — CF 라이브 목록 + 실측 메타(cfai_catalog).

    CF 를 못 부르면 카탈로그만으로 채운다. 토큰이 없다고 화면이 비면 "왜 안 되지"
    를 한참 뒤지게 되므로, 폴백했다는 사실을 source 필드로 알린다.
    """
    if not _check_verify_pass(req):
        return web.json_response({"error": "verify password required"}, status=401)
    if not _bearer(req):
        return web.json_response({"error": "missing bearer token"}, status=401)
    try:
        rows = cfai_catalog.merge(await _cf_list_models())
        source = "live"
    except Exception as e:
        log.warning("verify_llm_models: CF 목록 실패 → 카탈로그 폴백 (%s)", e)
        rows = cfai_catalog.merge(list(cfai_catalog.CATALOG))
        source = "catalog"
    return web.json_response({
        # 빈 값 = model 미지정 → 서버 기본(ollama). 기준선으로 되돌아가는 선택지.
        "ollama": {"value": "", "label": f"ollama {_DEFAULT_MODEL} (기본)"},
        "cf": rows,
        "source": source,
    })

async def verify_page(_req: web.Request) -> web.FileResponse:
    html = pathlib.Path(__file__).resolve().parents[1] / "static" / "verify_chat.html"
    return web.FileResponse(html)

def register_verify_routes(app: web.Application) -> None:
    """PRETHIRD_VERIFY_ENABLED=1 일 때만 호출된다(호출 측에서 가드)."""
    app.router.add_get("/oth-path", verify_page)
    app.router.add_post("/oth-path", verify_login)
    app.router.add_get("/oth-path", verify_clones)
    app.router.add_get("/oth-path", verify_llm_models)
    app.router.add_get("/oth-path", verify_persons)
    app.router.add_post("/oth-path", verify_person_create)
    app.router.add_post("/oth-path", verify_chat)
    app.router.add_post("/oth-path", verify_learn)
    app.router.add_post("/oth-path", verify_l2_reset)
    app.router.add_get("/oth-path", verify_bundle)
    app.router.add_get("/oth-path", verify_ont_raw)
    app.router.add_get("/oth-path", verify_l2p)
    app.router.add_get("/oth-path", verify_knowledge_questions)
    app.router.add_get("/oth-path", verify_knowledge)
    app.router.add_post("/oth-path", verify_knowledge_interpret)
    app.router.add_put("/oth-path", verify_knowledge_save)
    app.router.add_post("/oth-path", verify_knowledge_autoanswer)
    app.router.add_post("/oth-path", verify_knowledge_confirm_check)
