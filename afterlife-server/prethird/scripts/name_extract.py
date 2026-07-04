# scripts/ 직하(비패키지) → 절대 import. learn_writeback.py/l2_extract.py의 ollama
# 호출 관례(예외 삼킴)를 참고하되, 타임아웃(asyncio.wait_for)은 이번에 새로 추가한 안전망이다
# — extract_l2/chat_once 자체엔 타임아웃이 없다(report 참고).
from __future__ import annotations
import asyncio
import json
import logging
import re
from clone_dialog.llm_client import chat_once

log = logging.getLogger("prethird.name_extract")

_TIMEOUT_S = 5.0
# api displayName 검증(persons 테이블)과 정합 — 이름 길이 상한.
_MAX_NAME_LEN = 30
_CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f]")

# JSON-only 이름 추출 프롬프트. 화자 "본인" 이름만 — 상대방/제3자 이름은 대상이 아니다.
_SYSTEM = (
    "You extract the SPEAKER's own name (the person talking, not anyone they mention) "
    'from one utterance. Output STRICT JSON only, exactly {"name": "..."}. '
    'If the speaker does not state their own name, or it is unclear, output {"name": ""}. '
    "No prose, no extra keys."
)


def _clean_name(name: str) -> str:
    """제어문자(개행 등) 제거 + 앞뒤 공백 정리 + 30자 상한 절단.
    api displayName 검증(persons 테이블)과 정합시켜, RN 카드 프리필용으로 안전하게 만든다."""
    name = _CONTROL_CHARS.sub("", name).strip()
    return name[:_MAX_NAME_LEN]


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
    if not isinstance(name, str):
        return ""
    return _clean_name(name)


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
