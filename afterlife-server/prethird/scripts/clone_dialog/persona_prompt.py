"""persona_prompt — personaBundle dict → chat system message 리스트 변환.

계약(불변):
    bundle_to_messages(bundle: dict | None) -> list[{"role": "system", "content": str}]
    - None 또는 빈 dict, personaBundle 키 없음 → []
    - 정상 bundle → 길이 1인 리스트, role="system"

bundle 구조 (fetch_bundle 반환 전체 형식):
    {
        "personaBundle": {
            "cloneId": str,
            "l0": {"rules_text": str, "blocklist": [str, ...]},  # 선택
            "persona": {
                "displayName": str,       # 이름
                "relation": str,          # 사용자와의 관계
                "tone": str,              # 말투
                "personality_core": str,  # 핵심 성격
                "voice_style": str,       # 발화 스타일
                "speech_patterns": str,   # 말버릇
                "mood_overrides": str,    # 감정 오버라이드
                "memory_summary": str,    # 기억 요약
                "relationship": str,      # 관계 맥락
                "context": str,           # 현재 맥락
                "recent_topics": str,     # 최근 화제
            }
        },
        "assets": {...}
    }
"""
from __future__ import annotations

_KNOWN_PERSONA_LABELS: list[tuple[str, str]] = [
    ("displayName", "이름"),
    ("relation", "사용자와의 관계"),
    ("tone", "말투"),
    ("personality_core", "핵심 성격"),
    ("voice_style", "발화 스타일"),
    ("speech_patterns", "말버릇"),
    ("mood_overrides", "감정 상태"),
    ("memory_summary", "기억 요약"),
    ("relationship", "관계 맥락"),
    ("context", "현재 맥락"),
    ("recent_topics", "최근 화제"),
    ("preference_personal", "사용자 취향"),   # 학습 키(E)
    ("memories_personal", "기억"),            # 학습 키(E)
]


def _format_val(val) -> str:
    """dict → 'k: v, k: v', list → 'a, b', 그 외 → str. 파이썬 repr 노출 방지."""
    if isinstance(val, dict):
        return ", ".join(f"{k}: {v}" for k, v in val.items() if str(v).strip())
    if isinstance(val, (list, tuple)):
        return ", ".join(str(x) for x in val if str(x).strip())
    return str(val)


def bundle_to_messages(bundle: dict | None) -> list[dict]:
    """personaBundle dict → [{"role": "system", "content": str}].

    None, 빈 dict, personaBundle 키 없음 → [].
    """
    if not bundle:
        return []

    pb = bundle.get("personaBundle")
    if not pb:
        return []

    lines: list[str] = []

    # 1) L0 안전 규칙
    l0 = pb.get("l0") or {}
    rules_text = l0.get("rules_text", "")
    blocklist: list = l0.get("blocklist") or []
    if rules_text:
        lines.append("## 안전 규칙")
        lines.append(rules_text.strip())
    if blocklist:
        lines.append("## 금지어")
        lines.append(", ".join(str(x) for x in blocklist))

    # 2) 페르소나 속성
    persona: dict = pb.get("persona") or {}
    persona_lines: list[str] = []
    for key, label in _KNOWN_PERSONA_LABELS:
        val = persona.get(key)
        text = _format_val(val) if val is not None else ""
        if text.strip():
            persona_lines.append(f"- {label}: {text}")

    # 위 목록에 없는 나머지 속성도 포함
    known_keys = {k for k, _ in _KNOWN_PERSONA_LABELS}
    for key, val in persona.items():
        if key in known_keys or val is None:
            continue
        text = _format_val(val)
        if text.strip():
            persona_lines.append(f"- {key}: {text}")

    if not persona_lines and not lines:
        # l0도 없고 persona 속성도 없으면 의미 없음
        return []

    if persona_lines:
        lines.append("## 페르소나")
        lines.extend(persona_lines)

    content = "\n".join(lines).strip()
    if not content:
        return []

    return [{"role": "system", "content": content}]
