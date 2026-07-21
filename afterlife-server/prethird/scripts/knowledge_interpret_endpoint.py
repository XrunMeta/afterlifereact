"""knowledge_interpret_endpoint — T-117 학습하기 답변 해석.

Cloudflare Workers(afterlife-api) 가 사용자 답변 raw + 관리자가 정의한 slot 목록을 넘기면,
로컬 LLM(gemma3:27b via ollama)이 다음 두 가지를 뽑아 반환:
  1) slot 별 짧은 단어 값 (slot.label 에 해당하는 정보. 없으면 빈 문자열)
  2) 사용자에게 확인받을 공감 리플라이 문장

RN 앱은 이 리플라이를 채팅 봇 버블로 표시 → 사용자 [예/아니요] →
'예' 면 slot key 별 값을 knowledge 로 PUT.

Auth: X-Internal-Secret 헤더 (PRETHIRD_INTERNAL_SECRET) — Workers 만 호출.
"""
from __future__ import annotations
import os
import json
import logging
from aiohttp import web

from clone_dialog.llm_client import chat_once

log = logging.getLogger("prethird.knowledge_interpret")

_INTERNAL_SECRET = os.environ.get("PRETHIRD_INTERNAL_SECRET", "")
_MAX_ANSWER_CHARS = 3000
_MAX_QUESTION_CHARS = 500
_MAX_SLOTS = 8
_MAX_SLOT_VALUE_CHARS = 100
_MAX_REPLY_CHARS = 300


def _check_secret(req: web.Request) -> bool:
    """미설정 시 로컬 개발 편의로 통과. 운영에서는 반드시 설정."""
    if not _INTERNAL_SECRET:
        return True
    got = req.headers.get("X-Internal-Secret", "")
    return got == _INTERNAL_SECRET


def _build_prompt(question: str, answer: str, slots: list[dict]) -> list[dict]:
    slot_lines = "\n".join(f"- {s['label']} (key: {s['key']})" for s in slots)
    example_slots = ", ".join(f'{{"key": "{s["key"]}", "value": "..."}}' for s in slots[:2])
    system = (
        "너는 사용자의 답변을 카테고리별 짧은 단어로 정리하고, "
        "그 결과를 다시 확인받는 공감 조수야. 반드시 JSON 만 출력해라. "
        "설명·주석·마크다운·코드블록 금지. 대답이 카테고리와 관련 없으면 value 를 빈 문자열로 둬라."
    )
    user = (
        f"질문: {question}\n"
        f"사용자 답변: {answer}\n\n"
        f"카테고리 목록:\n{slot_lines}\n\n"
        "다음 JSON 형식으로 출력해:\n"
        "{\n"
        f'  "slots": [{example_slots}, ...],\n'
        '  "reply": "친근하게 공감 + 정리된 내용 확인 (한국어, 2문장 이내, 예/아니요로 답할 수 있게)"\n'
        "}\n"
        "\n"
        "규칙:\n"
        "- slots 배열 순서는 위 카테고리 목록과 동일하게 유지.\n"
        "- value 는 단어 or 아주 짧은 구 (최대 30자). 문장 금지.\n"
        "- 답변에 없는 정보는 value = 빈 문자열.\n"
        "- reply 는 반말 · 이모티콘 1개 허용 · 존댓말 금지.\n"
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _sanitize_llm_json(raw: str, slots: list[dict]) -> tuple[list[dict], str]:
    """LLM JSON → {slot.key: value} 매핑 + reply 문자열. 오류 시 안전한 폴백."""
    try:
        obj = json.loads(raw)
    except json.JSONDecodeError:
        log.warning("LLM output not JSON: %s", raw[:200])
        obj = {}
    slot_out = []
    key_to_value: dict[str, str] = {}
    for item in obj.get("slots") or []:
        if not isinstance(item, dict):
            continue
        k = item.get("key")
        v = item.get("value")
        if isinstance(k, str) and isinstance(v, str):
            key_to_value[k] = v[:_MAX_SLOT_VALUE_CHARS].strip()
    for s in slots:
        v = key_to_value.get(s["key"], "").strip()
        if v:
            slot_out.append({"key": s["key"], "q": s["label"], "a": v})
    reply = obj.get("reply")
    if not isinstance(reply, str) or not reply.strip():
        reply = "이렇게 정리하면 맞을까?"
    reply = reply.strip()[:_MAX_REPLY_CHARS]
    return slot_out, reply


async def knowledge_interpret(req: web.Request) -> web.Response:
    if not _check_secret(req):
        return web.json_response({"error": "invalid internal secret"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "invalid json body"}, status=400)

    question = (body.get("question") or "").strip()
    answer = (body.get("answer") or "").strip()
    slots_in = body.get("slots") or []
    if not question or len(question) > _MAX_QUESTION_CHARS:
        return web.json_response({"error": "invalid question"}, status=400)
    if not answer or len(answer) > _MAX_ANSWER_CHARS:
        return web.json_response({"error": "invalid answer"}, status=400)
    if not isinstance(slots_in, list) or not slots_in or len(slots_in) > _MAX_SLOTS:
        return web.json_response({"error": "invalid slots"}, status=400)
    slots: list[dict] = []
    for s in slots_in:
        if not isinstance(s, dict):
            return web.json_response({"error": "invalid slot"}, status=400)
        k = s.get("key")
        label = s.get("label")
        if not isinstance(k, str) or not k or not isinstance(label, str) or not label:
            return web.json_response({"error": "invalid slot fields"}, status=400)
        slots.append({"key": k, "label": label})

    messages = _build_prompt(question, answer, slots)
    try:
        raw = await chat_once(messages, fmt="json", temperature=0.3)
    except Exception as e:
        log.exception("LLM call failed: %s", e)
        return web.json_response({"error": "llm_failed"}, status=502)

    slot_out, reply = _sanitize_llm_json(raw, slots)
    return web.json_response({"slots": slot_out, "reply": reply})


def register_knowledge_interpret_routes(app: web.Application) -> None:
    app.router.add_post("/knowledge/interpret", knowledge_interpret)
