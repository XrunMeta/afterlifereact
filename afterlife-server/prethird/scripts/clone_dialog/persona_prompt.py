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

# 클론 자신의 속성 — "## 너의 정보" 블록.
_SELF_LABELS: list[tuple[str, str]] = [
    ("tone", "말투"),
    ("personality_core", "핵심 성격"),
    ("voice_style", "발화 스타일"),
    ("speech_patterns", "말버릇"),
    ("mood_overrides", "감정 상태"),
]

# 대화 상대의 속성 — "## 상대 정보" 블록.
# memory_summary 는 소유자가 혼재하지만, 클론이 상대의 기억을 자기 것으로
# 착각하는 쪽이 그 반대보다 해로우므로 상대 쪽으로 보수 배치한다(T-252 설계 4.3).
_OTHER_LABELS: list[tuple[str, str]] = [
    ("relation", "너와의 관계"),
    ("relationship", "관계 맥락"),
    ("preference_personal", "취향"),
    ("memories_personal", "기억"),
    ("preference_history", "취향 변화"),
    ("memory_summary", "기억 요약"),
    ("recent_topics", "최근 화제"),
]

# 소유자가 없거나 불명 — "## 참고" 블록.
_NEUTRAL_LABELS: list[tuple[str, str]] = [
    ("context", "현재 맥락"),
]

# displayName 은 머리말로 승격되므로 속성 줄에서 제외한다.
# knowledge 는 "## 전문 지식" 전용 섹션으로 분리된다.
_EXCLUDED_KEYS = {"displayName", "knowledge"}


def _format_val(val) -> str:
    """dict → 'k: v, k: v', list → 'a, b', 그 외 → str. 파이썬 repr 노출 방지."""
    if isinstance(val, dict):
        return ", ".join(f"{k}: {v}" for k, v in val.items() if str(v).strip())
    if isinstance(val, (list, tuple)):
        return ", ".join(str(x) for x in val if str(x).strip())
    return str(val)


def _format_knowledge(val) -> str:
    """[{key,q,a,updated_at}] → '- q: a' 줄 목록. q 없으면 '- a'. dict repr 유출 방지."""
    if not isinstance(val, (list, tuple)):
        return ""
    lines = []
    for x in val:
        if not isinstance(x, dict):
            continue
        a = str(x.get("a", "")).strip()
        if not a:
            continue
        q = str(x.get("q") or "").strip()
        lines.append(f"- {q}: {a}" if q else f"- {a}")
    return "\n".join(lines)


def _format_pref_history(val) -> str:
    """[{key,from,to,at}] → '음료: 콜라→사이다; 음식: 김치→라면'. dict repr 노출 방지."""
    if not isinstance(val, (list, tuple)):
        return ""
    parts = []
    for x in val:
        if isinstance(x, dict) and str(x.get("key", "")).strip():
            parts.append(f"{x['key']}: {x.get('from', '?')}→{x.get('to', '?')}")
    return "; ".join(parts)


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

    # 2) 소유자별 속성 블록
    persona: dict = pb.get("persona") or {}

    def _render(labels: list[tuple[str, str]]) -> list[str]:
        out: list[str] = []
        for key, label in labels:
            val = persona.get(key)
            if val is None:
                continue
            text = _format_pref_history(val) if key == "preference_history" else _format_val(val)
            if text.strip():
                out.append(f"- {label}: {text}")
        return out

    self_lines = _render(_SELF_LABELS)
    other_lines = _render(_OTHER_LABELS)
    neutral_lines = _render(_NEUTRAL_LABELS)

    # 위 세 표에 없는 키는 소유자를 알 수 없다 → 중립 블록으로 격리한다.
    # 상대 정보에 넣으면 클론 속성이 상대 것으로 오염될 수 있다.
    known_keys = (
        {k for k, _ in _SELF_LABELS}
        | {k for k, _ in _OTHER_LABELS}
        | {k for k, _ in _NEUTRAL_LABELS}
        | _EXCLUDED_KEYS
    )
    for key, val in persona.items():
        if key in known_keys or val is None:
            continue
        text = _format_val(val)
        if text.strip():
            neutral_lines.append(f"- {key}: {text}")

    knowledge_text = _format_knowledge(persona.get("knowledge"))

    if not (self_lines or other_lines or neutral_lines or lines or knowledge_text):
        # l0 도 없고 속성도 없고 knowledge 도 없으면 의미 없음
        return []

    if self_lines:
        lines.append("## 너의 정보")
        lines.extend(self_lines)

    if other_lines:
        lines.append("## 상대 정보")
        lines.extend(other_lines)

    if neutral_lines:
        lines.append("## 참고")
        lines.extend(neutral_lines)

    if knowledge_text:
        lines.append("## 전문 지식")
        lines.append(knowledge_text)

    content = "\n".join(lines).strip()
    if not content:
        return []

    return [{"role": "system", "content": content}]
