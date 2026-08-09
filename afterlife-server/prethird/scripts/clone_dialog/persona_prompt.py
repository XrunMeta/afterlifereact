"""persona_prompt — personaBundle dict → chat system message 리스트 변환.

계약(불변):
    bundle_to_messages(bundle: dict | None, speaker: dict | None = None)
        -> list[{"role": "system", "content": str}]
    - None 또는 빈 dict, personaBundle 키 없음 → []
    - 정상 bundle → 길이 1인 리스트, role="system"
    - content 는 "역할 선언 머리말(8줄 이내) + 소유자별 블록" 으로 구성된다.

speaker 인자 — 얼굴로 확정된 화자(L2'). 통화 상대가 누구인지에 따라 4상태로 나뉜다.
    speaker=None                                  # 상태 1(이름 있음)·3(이름 없음) — bundle.viewer 사용
    speaker={"name": str, "l2p_data": dict}        # 상태 2 — 화자 확정, 상대 정보는 L2' 로 대체
    speaker={"unconfirmed": True}                  # 상태 4 — 얼굴은 잡혔으나 누구인지 미확정

bundle 구조 (fetch_bundle 반환 전체 형식):
    {
        "personaBundle": {
            "cloneId": str,
            "l0": {"rules_text": str, "blocklist": [str, ...]},  # 선택
            "persona": {
                "displayName": str,       # 클론 이름 — 머리말로 승격, 속성 줄엔 안 실림
                "tone": str,              # 말투               (## 너의 정보)
                "personality_core": str,  # 핵심 성격          (## 너의 정보)
                "voice_style": str,       # 발화 스타일        (## 너의 정보)
                "speech_patterns": str,   # 말버릇             (## 너의 정보)
                "mood_overrides": str,    # 감정 상태          (## 너의 정보)
                "relation": str,          # 너와의 관계        (## 상대 정보)
                "relationship": str,      # 관계 맥락          (## 상대 정보)
                "preference_personal": dict,   # 취향          (## 상대 정보)
                "memories_personal": list,     # 기억          (## 상대 정보)
                "preference_history": list,    # 취향 변화     (## 상대 정보)
                "memory_summary": str,    # 기억 요약          (## 상대 정보)
                "recent_topics": str,     # 최근 화제          (## 상대 정보)
                "context": str,           # 현재 맥락          (## 참고 — 소유자 불명)
                "knowledge": [...],       # 전문 지식 — 별도 "## 전문 지식" 섹션
            },
            "viewer": {"displayName": str},  # 기본 상대(얼굴 미확정 시 사용, 선택)
        },
        "assets": {...}
    }
"""
from __future__ import annotations

import re

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

# signaling.py 의 _sanitize_display_name 과 동등 기준(afterlifeapi assertValidDisplayName 규약).
# 길이 1~30 · 제어문자 · 제로폭/bidi 포맷문자 차단. 프롬프트 인젝션 완화(T-135 mizu HIGH1).
_DISPLAY_NAME_CONTROL_RE = re.compile(
    "[\x00-\x1f\x7f​-‏‪-‮⁠-⁯﻿]"
)


def sanitize_display_name(raw) -> str | None:
    """이름을 신뢰할 수 있으면 그대로, 아니면 None. None 이면 호출부가 이름 호칭을 억제한다."""
    if not isinstance(raw, str):
        return None
    trimmed = raw.strip()
    if not trimmed or len(trimmed) > 30:
        return None
    if _DISPLAY_NAME_CONTROL_RE.search(trimmed):
        return None
    return trimmed


_RULES_COMMON = (
    '- "나 / 내 / 제가" 는 항상 너({clone})를 가리킨다.\n'
    "- 대답한 뒤에는 상대에게 자연스럽게 되물어라. 질문은 한 번에 하나만.\n"
    "  상대가 대화를 끝내려 하면 되묻지 말고 자연스럽게 마무리한다."
)


def _build_header(clone_name: str | None, other_name: str | None, unconfirmed: bool) -> str:
    """역할 선언 머리말. 4상태(설계 4.2).

    clone_name  : 클론 이름. None 이면 "아래 '너의 정보'의 인물" 로 대체.
    other_name  : 상대 이름(sanitize 통과분). None 이면 이름 호칭을 억제한다.
    unconfirmed : 얼굴이 잡혔으나 매칭 실패(unknown_face/multi_face). 상태 4.
    """
    who = f'"{clone_name}"' if clone_name else "아래 \"너의 정보\" 의 인물"
    head = f'너는 {who} 이다. 아래 "너의 정보" 가 너 자신이다.'
    common = _RULES_COMMON.format(clone=clone_name or "너 자신")

    if unconfirmed:
        # 상태 4 — 얼굴이 잡혔으나 누구인지 확정하지 못했다.
        return (
            f"{head}\n"
            "지금 너와 통화 중인 상대가 있다. 누구인지는 확정하지 못했다.\n"
            '아래 "## 상대 정보" 는 평소 너와 대화하던 상대의 것이다.\n'
            f"{common}\n"
            '- 상대가 "나 / 내" 라고 말하면 그것은 상대 자신을 가리킨다. 너가 아니다.\n'
            "- 상대를 이름으로 부르지 마라. 확정되지 않았다.\n"
            '- "## 상대 정보" 는 상대의 것이다. 네 경험처럼 말하지 마라.\n'
            "  다만 그 사람이 맞는지 확신할 수 없으니 그 기억을 단정해서 꺼내지 마라."
        )

    if not other_name:
        # 상태 3 — 상대의 이름을 모른다.
        return (
            f"{head}\n"
            "지금 너와 통화 중인 상대가 있다. 상대의 이름은 아직 확인되지 않았다.\n"
            f"{common}\n"
            '- 상대가 "나 / 내" 라고 말하면 그것은 상대 자신을 가리킨다. 너가 아니다.\n'
            "- 상대를 이름으로 부르지 마라. 이름을 지어내지 마라.\n"
            '- "## 상대 정보" 는 상대의 것이다. 네 경험처럼 말하지 마라.'
        )

    # 상태 1·2 — 상대 이름을 안다. 얼굴 확인 여부는 문장으로 밝히지 않는다
    # (모델이 상대를 의심하게 만들 이유가 없다).
    return (
        f"{head}\n"
        f'지금 너와 통화 중인 상대는 "{other_name}" 이다.\n'
        f"{common}\n"
        f'- 상대가 "나 / 내" 라고 말하면 그것은 {other_name} 를 가리킨다. 너가 아니다.\n'
        f'- "## 상대 정보" 는 {other_name} 의 것이다. 네 경험처럼 말하지 마라.'
    )


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


def bundle_to_messages(bundle: dict | None, speaker: dict | None = None) -> list[dict]:
    """personaBundle dict → [{"role": "system", "content": str}].

    None, 빈 dict, personaBundle 키 없음 → [].

    speaker: 얼굴로 확정된 화자. None 이면 bundle 의 viewer(기본 상대)를 쓴다.
        {"name": str | None, "l2p_data": dict | None}  — 화자 확정(상태 2)
        {"unconfirmed": True}                          — 얼굴 미확정(상태 4)
    """
    if not bundle:
        return []

    pb = bundle.get("personaBundle")
    if not pb:
        return []

    lines: list[str] = []

    persona: dict = pb.get("persona") or {}
    clone_name = sanitize_display_name(persona.get("displayName"))

    # 상대 결정 — 상태 4 > 화자 확정 > 기본 상대(viewer) 순.
    speaker = speaker or {}
    unconfirmed = bool(speaker.get("unconfirmed"))
    l2p_data = speaker.get("l2p_data") if not unconfirmed else None
    if unconfirmed:
        other_name = None
    elif speaker.get("name") is not None:
        other_name = sanitize_display_name(speaker.get("name"))
    else:
        viewer = pb.get("viewer") or {}
        other_name = sanitize_display_name(viewer.get("displayName"))

    header = _build_header(clone_name, other_name, unconfirmed)

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
    # src 를 인자로 받는 이유는 상대 블록 하나뿐이다 — 화자가 확정되면 상대 정보는
    # base L2(persona) 가 아니라 그 화자의 L2' 로 채운다. 너/참고 블록은 항상 persona.
    # 형식은 동일한 "- 라벨: 값" 줄 목록으로 통일한다 — 같은 정보가 화자에 따라
    # 다른 형식으로 보이면 모델이 둘을 다른 것으로 취급한다.
    def _render_from(src: dict, labels: list[tuple[str, str]]) -> list[str]:
        out: list[str] = []
        for key, label in labels:
            val = src.get(key)
            if val is None:
                continue
            text = _format_pref_history(val) if key == "preference_history" else _format_val(val)
            if text.strip():
                out.append(f"- {label}: {text}")
        return out

    other_source = l2p_data if l2p_data else persona

    self_lines = _render_from(persona, _SELF_LABELS)
    other_lines = _render_from(other_source, _OTHER_LABELS)
    neutral_lines = _render_from(persona, _NEUTRAL_LABELS)

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

    body = "\n".join(lines).strip()
    if not body:
        return []
    content = f"{header}\n\n{body}"

    return [{"role": "system", "content": content}]
