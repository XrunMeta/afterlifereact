# scripts/ 직하(비패키지) → 절대 import. learn_writeback.py/l2_extract.py의 ollama
# 호출 관례(타임아웃·예외 삼킴)를 그대로 복제한다.
from __future__ import annotations
import asyncio
import json
import logging
from clone_dialog.llm_client import chat_once

log = logging.getLogger("prethird.name_extract")

_TIMEOUT_S = 5.0

# JSON-only 이름 추출 프롬프트. 화자 "본인" 이름만 — 상대방/제3자 이름은 대상이 아니다.
_SYSTEM = (
    "You extract the SPEAKER's own name (the person talking, not anyone they mention) "
    'from one utterance. Output STRICT JSON only, exactly {"name": "..."}. '
    'If the speaker does not state their own name, or it is unclear, output {"name": ""}. '
    "No prose, no extra keys."
)


def _safe_name(content: str) -> str:
    """LLM 출력에서 첫 { ~ 마지막 } 구간을 JSON 파싱해 name 문자열만 추출.
    실패/형식오류 시 빈 문자열(카드 수동입력 폴백)."""
    if not content:
        return ""
    s = content.find("{")
    e = content.rfind("}")
    if s < 0 or e <= s:
        return ""
    try:
        data = json.loads(content[s:e + 1])
    except Exception:
        return ""
    if not isinstance(data, dict):
        return ""
    name = data.get("name")
    return name.strip() if isinstance(name, str) else ""


async def extract_name(text: str) -> str:
    """발화 텍스트에서 화자 본인 이름 1회 추출.

    빈 입력/LLM 예외/타임아웃/파싱 실패는 전부 빈 문자열로 흡수한다(호출측=signaling이
    이 결과를 그대로 enroll_suggest에 실어 보내므로, 실패해도 RN 카드 수동 입력 폴백이
    항상 성립 — 절대 예외를 전파하지 않는다).
    """
    text = (text or "").strip()
    if not text:
        return ""
    messages = [
        {"role": "system", "content": _SYSTEM},
        {"role": "user", "content": text},
    ]
    try:
        content = await asyncio.wait_for(
            chat_once(messages, temperature=0.0, fmt="json"), timeout=_TIMEOUT_S,
        )
    except Exception as e:
        log.warning("name_extract failed: %s", e)
        return ""
    return _safe_name(content)
