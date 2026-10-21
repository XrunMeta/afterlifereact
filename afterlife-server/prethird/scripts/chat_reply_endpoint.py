"""AFL-1018 앱 채팅 답장 — POST /oth-path (Cloudflare Worker 전용).

통화와 같은 GPT·같은 페르소나 프롬프트로 채팅 답을 만든다.
- 페르소나: 통화처럼 사용자 토큰으로 /oth-path 을 받아 bundle_to_messages.
- 이전 대화(통화+채팅): Worker 가 조립해 `prior` 로 넘긴다(통화의 seed_prior 와 같은 형식).
- 지금 채팅의 최근 주고받은 말: `recent` 를 user/assistant 로 이어 붙인다.
- LLM: Worker 가 넘긴 `model`(관리자 설정 · AFL-1031). 없거나 이상하면 chat_once 기본 모델
  (통화 chat_fn 과 같은 PRETHIRD_LLM_PROVIDER·OPENAI_MODEL).

인증: X-Internal-Secret == PRETHIRD_CHAT_SECRET(채팅 전용 · interpret 의 PRETHIRD_INTERNAL_SECRET 과
나눈다). 미설정이면 닫는다 — 사용자 토큰과 대화 내용을 넘겨받는 엔드포인트라 열어 두지 않는다.
"""
from __future__ import annotations

import hmac
import logging
import os
import re

from aiohttp import web

from clone_dialog.bundle_client import fetch_bundle
from clone_dialog.conversation_history import ConversationHistory
from clone_dialog.llm_client import chat_once
from clone_dialog.persona_prompt import bundle_to_messages

log = logging.getLogger("prethird.chat_reply")

_CHAT_SECRET = os.environ.get("PRETHIRD_CHAT_SECRET", "")
_MAX_TEXT_CHARS = 4000
_MAX_RECENT = 40
_MAX_PRIOR = 2000
_MAX_REPLY_CHARS = 2000
_MAX_ITEM_CHARS = 2000
# AFL-1031: 모델명은 영문·숫자·. _ : - 만(provider 접두어 "openai:" 허용).
_MODEL_RE = re.compile(r"^[A-Za-z0-9._:-]{1,100}$")

CHAT_MODE_NOTE = (
    "(지금은 전화가 아니라 앱 채팅으로 글을 주고받는 중이다. 말투와 성격은 통화 때와 똑같이 하고, "
    "평소처럼 짧게 답해.)"
)


def build_chat_messages(
    persona_messages: list[dict],
    prior: list,
    recent: list,
    text: str,
    max_chars: int,
) -> list[dict]:
    """persona + [이전 대화 system] + 최근 채팅(user/assistant) + 이번 말."""
    hist = ConversationHistory(1, max_chars)
    hist.seed_prior([
        {**t, "text": t["text"][:_MAX_ITEM_CHARS]}
        if isinstance(t, dict) and isinstance(t.get("text"), str) else t
        for t in (prior or [])
    ])
    prior_msgs = hist.messages()   # 이번 통화 턴이 없으니 prior system 1개 또는 []
    convo: list[dict] = []
    for m in recent or []:
        if not isinstance(m, dict):
            continue
        t = m.get("text")
        if not isinstance(t, str) or not t.strip():
            continue
        t = t[:_MAX_ITEM_CHARS]
        role = "user" if m.get("role") == "user" else "assistant" if m.get("role") == "clone" else None
        if role:
            convo.append({"role": role, "content": t})
    return list(persona_messages) + prior_msgs + convo + [{"role": "user", "content": text}]


def _max_chars() -> int:
    return ConversationHistory.from_env().max_chars


async def chat_reply(req: web.Request) -> web.Response:
    if not _CHAT_SECRET:
        log.error("PRETHIRD_CHAT_SECRET 미설정 — /chat/reply 닫음")
        return web.json_response({"error": "not_configured"}, status=503)
    got = req.headers.get("X-Internal-Secret", "")
    if not hmac.compare_digest(got.encode(), _CHAT_SECRET.encode()):
        return web.json_response({"error": "unauthorized"}, status=401)

    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "bad_json"}, status=400)
    if not isinstance(body, dict):
        return web.json_response({"error": "bad_body"}, status=400)
    clone_id = body.get("clone_id")
    token = body.get("user_token")
    text = body.get("text")
    if (not isinstance(clone_id, int) or isinstance(clone_id, bool) or clone_id <= 0
            or not isinstance(token, str) or not token
            or not isinstance(text, str) or not text.strip() or len(text) > _MAX_TEXT_CHARS):
        return web.json_response({"error": "bad_input"}, status=400)
    prior = body.get("prior") if isinstance(body.get("prior"), list) else []
    recent = body.get("recent") if isinstance(body.get("recent"), list) else []
    model = body.get("model")
    if not (isinstance(model, str) and _MODEL_RE.match(model)):
        if model not in (None, ""):
            log.warning("chat reply clone=%s 모델명 무시 → 기본 모델", clone_id)
        model = None

    bundle = await fetch_bundle(os.environ.get("PRETHIRD_API_BASE"), clone_id, token)
    if not bundle:
        return web.json_response({"error": "bundle_unavailable"}, status=502)

    # [2026-10-20 sungjius] 이 계정×클론의 지난 대화도, 이번 채팅의 앞 메시지도 없으면 첫 대화다.
    first_meeting = not prior and not recent
    persona = bundle_to_messages(bundle, first_meeting=first_meeting) + [
        {"role": "system", "content": CHAT_MODE_NOTE}]
    messages = build_chat_messages(
        persona, prior[-_MAX_PRIOR:], recent[-_MAX_RECENT:], text, _max_chars(),
    )
    try:
        raw = await chat_once(messages, model=model)
    except Exception as e:  # noqa: BLE001
        log.exception("chat reply LLM 실패 clone=%s: %s", clone_id, e)
        return web.json_response({"error": "llm_failed"}, status=502)
    reply = (raw or "").strip()[:_MAX_REPLY_CHARS]
    if not reply:
        return web.json_response({"error": "empty_reply"}, status=502)
    log.info("chat reply clone=%s model=%s prior=%d recent=%d chars=%d",
             clone_id, model or "default", len(prior), len(recent), len(reply))
    return web.json_response({"reply": reply})


def register_chat_reply_routes(app: web.Application) -> None:
    app.router.add_post("/chat/reply", chat_reply)
