"""knowledge_followup_endpoint — T-117 학습하기 꼬리 질문 생성.

오너가 base 질문에 답하고 [예] 로 확인하면, 그 답변을 파고드는 자연스러운
follow-up 질문을 LLM 이 생성한다. 답변에서 실제로 궁금한 지점을 찝어야 함.
예:
  Q: "무엇이 가장 귀찮고 무기력하게 만드나요?"
  A: "직장"
  → follow-up: "직장에서 뭐가 제일 힘들어?"

RN 앱은 이 follow-up 을 새 봇 버블로 표시 → 오너 답변 → 같은 interpret 흐름
으로 확인 → knowledge 에 추가 저장.

Auth: X-Internal-Secret 헤더.
"""
from __future__ import annotations
import os
import json
import logging
from aiohttp import web

from clone_dialog.llm_client import chat_once

log = logging.getLogger("prethird.knowledge_followup")

_INTERNAL_SECRET = os.environ.get("PRETHIRD_INTERNAL_SECRET", "")
_MAX_QUESTION_CHARS = 500
_MAX_ANSWER_CHARS = 3000
_MAX_PERSONA_NAME_CHARS = 60
_MAX_FOLLOWUP_CHARS = 200


def _check_secret(req: web.Request) -> bool:
    if not _INTERNAL_SECRET:
        return True
    got = req.headers.get("X-Internal-Secret", "")
    return got == _INTERNAL_SECRET


def _build_prompt(
    base_question: str,
    answer: str,
    persona_name: str | None,
) -> list[dict]:
    subject = persona_name.strip() if persona_name and persona_name.strip() else "이 클론"
    system = (
        f"너는 오너가 자기 페르소나 클론('{subject}') 을 학습시키는 대화의 조수야. "
        "오너가 방금 답한 내용에서 자연스럽게 더 알고 싶은 지점을 잡아, 짧은 꼬리 질문 하나를 만들어. "
        "질문은 반말 · 대화체 · 1문장 (30자 이내). 답변 내용을 그대로 반복하지 말고 그 안의 세부/이유/맥락을 파고들어. "
        "반드시 JSON 만 출력. 다른 텍스트/마크다운/코드블록 금지."
    )
    user = (
        f"페르소나 이름: {subject}\n"
        f"직전 질문: {base_question}\n"
        f"오너 답변: {answer}\n\n"
        "다음 JSON 형식으로만 출력해:\n"
        '{ "followup": "꼬리 질문 한 문장" }\n'
        "\n"
        "규칙:\n"
        "- 반말 · 대화체 · 1문장 · 30자 이내.\n"
        "- 답변에서 언급된 구체적 대상/이유/맥락을 짚어. 뻔한 재확인 금지.\n"
        "- 예: 답변='직장' → followup='직장에서 뭐가 제일 힘들어?'\n"
        "- 예: 답변='엽떡' → followup='엽떡 어떤 매운맛 좋아해?'\n"
        "- 예: 답변='공감하지' → followup='보통 어떤 말로 공감해줘?'\n"
        "- 예: 답변='운동' → followup='어떤 운동 자주 해?'\n"
        f"- 페르소나 이름('{subject}') 을 주어로 넣지 마라. 대화 상대에게 말하듯 자연스럽게.\n"
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _parse(raw: str) -> str:
    try:
        obj = json.loads(raw)
    except json.JSONDecodeError:
        log.warning("LLM followup not JSON: %s", raw[:200])
        return ""
    f = obj.get("followup")
    if not isinstance(f, str):
        return ""
    return f.strip()[:_MAX_FOLLOWUP_CHARS]


async def knowledge_followup(req: web.Request) -> web.Response:
    if not _check_secret(req):
        return web.json_response({"error": "invalid internal secret"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "invalid json body"}, status=400)

    base_question = (body.get("question") or "").strip()
    answer = (body.get("answer") or "").strip()
    persona_name_raw = body.get("persona_name")
    persona_name: str | None = None
    if isinstance(persona_name_raw, str):
        s = persona_name_raw.strip()
        if s:
            persona_name = s[:_MAX_PERSONA_NAME_CHARS]
    if not base_question or len(base_question) > _MAX_QUESTION_CHARS:
        return web.json_response({"error": "invalid question"}, status=400)
    if not answer or len(answer) > _MAX_ANSWER_CHARS:
        return web.json_response({"error": "invalid answer"}, status=400)

    messages = _build_prompt(base_question, answer, persona_name)
    try:
        raw = await chat_once(messages, fmt="json", temperature=0.5, num_predict=256)
    except Exception as e:
        log.exception("LLM call failed: %s", e)
        return web.json_response({"error": "llm_failed"}, status=502)

    followup = _parse(raw)
    return web.json_response({"followup": followup})


def register_knowledge_followup_routes(app: web.Application) -> None:
    app.router.add_post("/knowledge/followup", knowledge_followup)
