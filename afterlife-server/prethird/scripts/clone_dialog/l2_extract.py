from __future__ import annotations
import json
import re
from .llm_client import chat_once

# mizu M-1: 프롬프트 우회(간접표현)에 대한 2차 정규식 방어. 매칭 항목은 저장 전 drop.
_PII_PATTERNS = [
    re.compile(r"01[016-9][-\s]?\d{3,4}[-\s]?\d{4}"),          # 휴대전화
    re.compile(r"\d{6}[-\s]?\d{7}"),                            # 주민등록번호
    re.compile(r"\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}"),     # 카드번호
]


def _has_pii(s: str) -> bool:
    return any(p.search(s) for p in _PII_PATTERNS)

# JSON-only 추출 프롬프트. PII allowlist 명시(mizu 게이트 회귀 대상).
_EXTRACT_SYSTEM = (
    "You extract durable facts about the USER from one conversation turn, "
    "to personalize future replies. Output STRICT JSON only, no prose, with exactly these keys:\n"
    '  "preference_personal": object of short key:value the user revealed about themselves '
    "(likes, interests, habits). {} if none.\n"
    '  "relation": short string of how the user relates to the clone (e.g. "손녀", "오랜 친구"), '
    "or null if unclear/unchanged.\n"
    '  "memories_personal": array of short factual statements worth remembering about the user. [] if none.\n'
    "RULES:\n"
    "- Only facts explicitly stated by the USER in this turn. Never guess.\n"
    "- For preference_personal, use a normalized CATEGORY as the key "
    "(e.g. 음료/음식/취미/색상), and always the SAME key for the same category "
    "so a changed preference reuses the key (음료: 콜라 → 음료: 사이다).\n"
    "- PRIVACY: NEVER include full street address, resident registration number, phone number, "
    "card/account number, or passwords. Skip them entirely.\n"
    '- Keep values short. If nothing new: {"preference_personal":{},"relation":null,"memories_personal":[]}.'
)


def _safe_json(content: str) -> dict:
    """LLM 출력에서 첫 { ~ 마지막 } 구간을 JSON 파싱. 실패 시 빈 dict."""
    if not content:
        return {}
    s = content.find("{")
    e = content.rfind("}")
    if s < 0 or e <= s:
        return {}
    try:
        data = json.loads(content[s:e + 1])
    except Exception:
        return {}
    return data if isinstance(data, dict) else {}


async def extract_l2(user_text: str, clone_reply: str) -> dict:
    """통화 한 턴 → L2 자동학습 키:값 추출. 실패/빈 입력 시 빈 dict(학습 skip)."""
    user_text = (user_text or "").strip()
    if not user_text:
        return {}
    messages = [
        {"role": "system", "content": _EXTRACT_SYSTEM},
        {"role": "user", "content": f"USER said: {user_text}\nCLONE replied: {clone_reply or ''}"},
    ]
    try:
        content = await chat_once(messages, temperature=0.0, fmt="json")
    except Exception:
        return {}
    data = _safe_json(content)

    out: dict = {}
    pp = data.get("preference_personal")
    if isinstance(pp, dict) and pp:
        clean_pp: dict = {}
        for k, v in pp.items():
            # mizu H-1: primitive(str/int/float/bool)만 — 중첩 객체/배열에 PII 은닉 차단
            if not isinstance(v, (str, int, float, bool)):
                continue
            # mizu M-1: 값 문자열이 PII 패턴이면 drop
            if isinstance(v, str) and _has_pii(v):
                continue
            clean_pp[str(k)] = v
        if clean_pp:
            out["preference_personal"] = clean_pp
    rel = data.get("relation")
    if isinstance(rel, str) and rel.strip() and not _has_pii(rel):
        out["relation"] = rel.strip()
    mems = data.get("memories_personal")
    if isinstance(mems, list):
        clean = [str(m).strip() for m in mems if str(m).strip() and not _has_pii(str(m))]
        if clean:
            out["memories_personal"] = clean
    return out
