"""knowledge_interpret_endpoint — T-117 학습하기 답변 해석.

학습하기는 오너가 자기 페르소나(클론)에 대한 정보를 답하는 화면이다.
LLM 이 답변을 카테고리별 slot 값으로 정리하고, 오너에게 다시 확인시키는 대화체
공감 리플라이를 생성한다.

Cloudflare Workers(afterlife-api) 가 넘기는 것:
  - question: 관리자가 등록한 질문
  - answer: 오너의 자유 답변
  - slots: 관리자가 정의한 답변 카테고리
  - persona_name(옵셔널): 페르소나 이름 (톤·주어 판단 참고용)

LLM 이 반환:
  1) slot 별 짧은 단어 값
  2) 대화체 공감 리플라이 — 주어 없이 답변만 반복하며 '~구나' 형태로 확인
     (예: "직장 때문에 귀찮고 무기력한 편이구나")

RN 앱은 이 리플라이를 채팅 봇 버블로 표시 → 오너 [예/아니요] →
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
_MAX_PERSONA_NAME_CHARS = 60
_MAX_SLOTS = 8
_MAX_SLOT_VALUE_CHARS = 100
_MAX_REPLY_CHARS = 300
_MAX_EXTRA_RULES_CHARS = 8000


def _check_secret(req: web.Request) -> bool:
    """미설정 시 로컬 개발 편의로 통과. 운영에서는 반드시 설정."""
    if not _INTERNAL_SECRET:
        return True
    got = req.headers.get("X-Internal-Secret", "")
    return got == _INTERNAL_SECRET


def _build_prompt(
    question: str,
    answer: str,
    slots: list[dict],
    persona_name: str | None,
    extra_rules: str | None = None,
) -> list[dict]:
    slot_lines = "\n".join(f"- {s['label']} (key: {s['key']})" for s in slots)
    example_slots = ", ".join(f'{{"key": "{s["key"]}", "value": "..."}}' for s in slots[:2])
    subject = persona_name.strip() if persona_name and persona_name.strip() else "이 클론"
    system = (
        f"너는 오너가 자기 페르소나 클론('{subject}') 에 대해 답한 내용을 정리하는 조수야. "
        "카테고리별 짧은 단어로 정리한 뒤, 정리한 내용을 대화체 공감 문장으로 다시 확인받아. "
        "가장 중요한 규칙: 오너 답변의 긍정/부정 방향, 양자택일 선택, 강도(자주/가끔/절대) 를 절대 뒤집지 마라. "
        "오너가 '한다' 라고 하면 '한다', '안 한다' 라고 하면 '안 한다', A/B 중 A 를 고르면 A 를 그대로 서술. "
        "짧은 구어체 (예: '공감하지', '의심 안 함', '재미있는 말로 넘어가') 도 원래 의미 그대로 해석. "
        "반드시 JSON 만 출력해라. 설명·주석·마크다운·코드블록 금지. "
        "답변에 카테고리 관련 정보가 없으면 value 를 빈 문자열로 둬라."
    )
    user = (
        f"페르소나 이름: {subject}\n"
        f"페르소나에 대한 질문: {question}\n"
        f"오너 답변: {answer}\n\n"
        f"카테고리 목록:\n{slot_lines}\n\n"
        "다음 JSON 형식으로만 출력해:\n"
        "{\n"
        f'  "slots": [{example_slots}, ...],\n'
        '  "reply": "대화체 공감 문장"\n'
        "}\n"
        "\n"
        "규칙:\n"
        "- slots 배열 순서는 위 카테고리 목록과 동일하게 유지.\n"
        "- value 는 단어 or 아주 짧은 구 (최대 30자). 문장 금지.\n"
        "- 답변에 없는 정보는 value = 빈 문자열.\n"
        "- 🔥 reply 는 주어 없이 답변 내용만 반복하며 '~구나' 형태로 공감. "
        f"'{subject}는', '너는', '당신은' 같은 주어/2인칭 금지 (대화 상대에게 말하듯 자연스럽게).\n"
        "- 🔥 답변의 긍정/부정 방향 반전 절대 금지. 오너가 '공감한다' 라고 하면 reply 도 '공감하는 편', "
        "'안 한다' 라고 하면 '안 하는 편'. 부정 뒤집기(공감→안 함, 함→안 함) 즉시 실패.\n"
        "- 🔥 양자택일 (A인가요 아니면 B인가요) 질문이면 오너가 고른 쪽을 그대로 서술. "
        "고르지 않은 쪽을 부정형으로 붙이지 마라. "
        "예: '감정적 공감 vs 현실적 해결책' 질문에 오너가 '공감하지' 라고 답 → "
        "reply: '감정적으로 공감해주는 편이구나'. (X: '해결책을 주지 않는다', '공감을 안 한다')\n"
        "- 🔥 짧고 애매한 답변도 문맥 그대로 해석. "
        "'공감하지' = 공감함(긍정), '의심 안 함' = 자신감 있음(스스로 신뢰), "
        "'재미있는 말로 넘어가' = 유머로 회피/전환. 반대 뜻으로 해석 금지.\n"
        "\n"
        "🔥 [시스템 프로토콜: 한국어 오독 및 축약어 자가 검증 규칙]\n"
        "1. [어미 축약 검증] 문장 끝의 '~해'(심해/남해/동해/안해/속해 등) 는 특별한 해양·명사 맥락 없으면 명사(Sea/Person)가 아닌 서술어(동사/형용사) 구어체 축약으로 우선 해석.\n"
        "2. [명사형 어미 검증] 문장 끝의 '~함/~음' (완료함/지킴/끝냄 등) 은 물리적 사물/인물 아닌 '명사형 종결 어미' 로 해석.\n"
        "3. [구어체 조사 생략 검증] 단어 뒤 조사가 생략·결합된 경우 (차가/배가/말이 등) 단순 명사 단독으로 해석하지 말고 뒤에 오는 문맥 전체 관계 확인.\n"
        "4. [신조어 대조] 사전적 의미로 문장이 어색하면 인터넷 줄임말/구어체 (억까/알잘딱깔센/~팟/~각 등) 인지 먼저 대조.\n"
        "5. [환원 검증] 생성된 답변의 문맥이 어색하면 해당 줄임말을 기본 원형 (예: 심해→심하다, ~팟→파티) 으로 복원 후 문장 재작성.\n"
        "- 강도 표현 보존: '엄청', '가끔', '자주', '절대' 같은 수식어가 있으면 reply 에도 반영.\n"
        "- 예: 질문='무엇이 가장 귀찮고 무기력하게 만드나요?' 답='직장' → reply: '직장 때문에 귀찮고 무기력한 편이구나'\n"
        "- 예: 질문='좋아하는 음식은?' 답='엽떡' → reply: '엽떡을 제일 좋아하는구나!'\n"
        "- 예: 질문='유별날 정도로 집착하는 영역은?' 답='게임할때 심해' → reply: '게임할 때 심하게 꽂히는구나!' (X: '게임할 때 심해에 꽂히는구나' — '심해' 를 장소로 잘못 해석)\n"
        "- 반말 · 이모티콘 1~2개 허용 · 존댓말 금지 · 2문장 이내.\n"
        "- reply 끝에 '맞을까?' 같은 명시적 확인은 안 넣어도 됨 (예/아니요 버튼이 옆에 있음).\n"
        "\n"
        "출력 전 자가 체크 (내부 사고, 출력 금지): "
        "① 오너 답변의 핵심 방향(긍정/부정/선택지)을 한 단어로 요약할 수 있는가? "
        "② reply 가 그 방향과 일치하는가? 반대되면 다시 작성. "
        "③ reply 에 주어(페르소나 이름, 너/당신) 가 있으면 삭제. "
        "④ reply 를 한국어로 읽었을 때 자연스러운 문장인가? '심해에 꽂힘' 처럼 축약형(심해=심하다) 을 명사로 오독한 결과가 나오면 반드시 다시 작성 (형용사/부사로 되돌림).\n"
    )
    if extra_rules and extra_rules.strip():
        # 어드민이 재배포 없이 튜닝하는 추가 규칙. 시스템 프롬프트 끝에 append.
        system = system + "\n\n[관리자 추가 규칙]\n" + extra_rules.strip()
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


import re as _re


def _lenient_extract(raw: str) -> dict:
    """LLM 이 truncate/malformed JSON 을 뱉었을 때도 slots/reply 를 최대한 뽑아냄.
    Ollama format:'json' 이라도 실무에서 종종 잘림. regex 로 각 필드 개별 추출.
    """
    out: dict = {}
    # reply: "..."  (마지막이면 종결 " 없이도 그대로 살림)
    m_reply = _re.search(r'"reply"\s*:\s*"((?:[^"\\]|\\.)*)"?', raw)
    if m_reply:
        out["reply"] = m_reply.group(1)
    # slots: [ {..}, {..} ]  — 개별 {key,value} 짝 여러개 스캔.
    kv_pairs = _re.findall(
        r'"key"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*"((?:[^"\\]|\\.)*)"',
        raw,
    )
    if kv_pairs:
        out["slots"] = [{"key": k, "value": v} for k, v in kv_pairs]
    return out


def _fallback_reply(slot_values: list[str]) -> str:
    """slot 값 있으면 '~구나' 로 즉석 조합, 아니면 generic."""
    joined = ", ".join(v for v in slot_values if v)
    if not joined:
        return "이렇게 정리하면 맞을까?"
    return f"{joined} 이렇게 이해했어. 맞아?"


def _sanitize_llm_json(raw: str, slots: list[dict]) -> tuple[list[dict], str]:
    """LLM JSON → {slot.key: value} 매핑 + reply 문자열. 오류 시 lenient 파서 + 슬롯 기반 fallback."""
    obj: dict
    try:
        obj = json.loads(raw)
    except json.JSONDecodeError:
        log.warning("LLM output not JSON: %s", raw[:200])
        obj = _lenient_extract(raw)  # 부분 추출 시도
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
        # LLM 이 reply 를 못 뱉었으면 slot 값으로 '~구나' 즉석 조합.
        reply = _fallback_reply([it["a"] for it in slot_out])
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
    persona_name_raw = body.get("persona_name")
    persona_name: str | None = None
    if isinstance(persona_name_raw, str):
        s = persona_name_raw.strip()
        if s:
            persona_name = s[:_MAX_PERSONA_NAME_CHARS]
    extra_rules_raw = body.get("extra_rules")
    extra_rules: str | None = None
    if isinstance(extra_rules_raw, str):
        s2 = extra_rules_raw.strip()
        if s2:
            extra_rules = s2[:_MAX_EXTRA_RULES_CHARS]
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

    messages = _build_prompt(question, answer, slots, persona_name, extra_rules)
    try:
        raw = await chat_once(messages, fmt="json", temperature=0.3, num_predict=1024)
    except Exception as e:
        log.exception("LLM call failed: %s", e)
        return web.json_response({"error": "llm_failed"}, status=502)

    slot_out, reply = _sanitize_llm_json(raw, slots)
    return web.json_response({"slots": slot_out, "reply": reply})


def register_knowledge_interpret_routes(app: web.Application) -> None:
    app.router.add_post("/knowledge/interpret", knowledge_interpret)
