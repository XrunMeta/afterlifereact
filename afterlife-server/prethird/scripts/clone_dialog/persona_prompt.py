"""persona_prompt — personaBundle dict → chat system message 리스트 변환.

계약(불변):
    bundle_to_messages(bundle: dict | None, speaker: dict | None = None)
        -> list[{"role": "system", "content": str}]
    - None 또는 빈 dict, personaBundle 키 없음 → []
    - 정상 bundle → 길이 1인 리스트, role="system"
    - content 는 "역할 선언 머리말(10줄 이내) + 소유자별 블록" 으로 구성된다.

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

import os
import re

from .mbti_traits import get_mbti_traits
from .mbti_tone_map import get_mbti_tone
from .dialect_traits import get_dialect_traits

# [T-467 2026-08-12] system prompt anchor — user 메시지 직전에 놓는 강제 규칙.
#   Gemma/Llama 는 대화가 길어질수록 system 중반의 지시를 잊는다 → 맨 뒤에 두면
#   attention 이 강하게 걸린다. PRETHIRD_STRICT_TONE_RULES=1 일 때만 활성이라
#   미설정 환경에서는 회귀가 없다.
#
# ⚠️ 이 상수는 가비아 라이브에만 있고 git 에는 없던 것을 역흡수한 것이다(T-127 재발).
#    라이브에 직접 배포된 변경은 다음 배포 때 조용히 지워지므로, 앞으로도 이 경로는
#    _check_live_drift.sh 로 먼저 확인하고 흡수한 뒤 배포한다.
STRICT_TONE_ANCHOR = """[절대 규칙]
1. 반드시 2~3문장 이내의 짧은 구어체로 답한다.
2. 존댓말(~요, ~습니다)을 쓰지 말고 반말만 사용한다.
3. 사용자의 질문에 직접 답하고, 무관한 화제를 먼저 꺼내지 않는다.
4. 당신은 위 페르소나(이름/관계/성격) 그 자체이다. 사용자는 당신과는 별개 인물이다.
   사용자가 당신을 "언니/오빠/누나/형/엄마/아빠" 등 상급자 호칭으로 부르더라도,
   당신이 사용자를 그런 호칭으로 부르지 마라 — 그건 사용자가 당신을 지칭하는 말이다.
   당신이 사용자를 부를 때는 "야", "얘", 또는 저장된 사용자 이름을 사용한다.
5. 위 "## MBTI 참고 성격" 섹션이 있다면 그 강점/약점/성격 특징을 응답 스타일에 반드시 반영한다.
   - T 성향 (INTJ, INTP, ENTJ, ENTP, ISTJ, ISTP, ESTJ, ESTP): 원인 파악·논리·해결책을 앞에 놓는다.
   - F 성향 (INFJ, INFP, ENFJ, ENFP, ISFJ, ISFP, ESFJ, ESFP): 공감·감정 인정을 앞에 놓는다.
   - MBTI 정보 없을 때만 자연스러운 반응.
6. **이모지·이모티콘·특수 심볼 절대 사용 금지**. 응답에 😀, ❤️, 🥰, ☺️, ~ 같은 아이콘을
   넣지 마라. 응답이 TTS 로 음성 변환되기 때문에, 이모지가 들어가면 "이모치 하피" 처럼
   이상한 음소로 발음된다. 감정 표현은 순수 텍스트(예: "정말 좋다", "너무 슬퍼")로만 한다."""

# 클론 자신의 속성 — "## 너의 정보" 블록.
_SELF_LABELS: list[tuple[str, str]] = [
    ("tone", "말투"),
    ("speech_speed", "말의 속도"),
    ("speech_form", "말투 형식"),          # T-479: 반말/존댓말
    ("dialect_region", "사투리 지역"),
    ("personality_core", "핵심 성격"),
    ("voice_style", "발화 스타일"),
    ("speech_patterns", "말버릇"),
    ("mood_overrides", "감정 상태"),
    ("job_category", "직업"),              # T-479
    ("job_detail", "구체 업무"),           # T-479
]

# 대화 상대의 속성 — "## 상대 정보" 블록.
# memory_summary 는 소유자가 혼재하지만, 클론이 상대의 기억을 자기 것으로
# 착각하는 쪽이 그 반대보다 해로우므로 상대 쪽으로 보수 배치한다(T-252 설계 4.3).
_OTHER_LABELS: list[tuple[str, str]] = [
    ("relation", "너와의 관계"),
    ("relation_category", "관계 대분류"),  # T-479 (예: "가족")
    ("relation_subtype", "관계 상세"),      # T-479 (예: "아빠")
    ("relation_episode", "관계 일화"),      # T-484 (사용자와의 구체 에피소드)
    ("address_form", "너가 상대를 부르는 호칭"),  # T-484 (예: "은지야", "아들")
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
# mbti 는 "## MBTI 참고 성격" 전용 섹션으로 분리된다 — 원본 라벨(예: "INTJ") 만
# 남기면 LLM 이 해석 각도 편차가 커서 상세 카탈로그(mbti_traits.py) 를 삽입한다.
# dialect_region 은 _SELF_LABELS 의 "사투리 지역" 로 이미 렌더되므로 참고 블록
# 중복 노출 방지 목적. dialect_intensity 는 v5 스키마에서 삭제됐지만 기존 페르소나
# 저장값이 남아있을 수 있어 참고 블록에서 침묵 처리하려면 여기에도 추가.
_EXCLUDED_KEYS = {"displayName", "knowledge", "mbti", "dialect_region", "dialect_intensity"}

# 이 모듈이 이름 검증의 단일 정본이다. signaling.py 의 `_sanitize_display_name` 은
# 여기를 import 해서 쓴다 — 두 벌로 두면 한쪽만 강화됐을 때 조용히 어긋난다
# (mizu 가 "바이트 단위 동일" 을 통과 조건으로 검사하던 항목).
#
# 1차 차단(길이·제어문자) — afterlifeapi assertValidDisplayName 규약 승계.
# 길이 1~30 · 제어문자(\n\r\t 포함) · 제로폭/bidi 포맷문자 · 유니코드 줄바꿈
# (U+2028 LS · U+2029 PS — 구 정규식에 빠져 있던 실제 구멍이다).
_DISPLAY_NAME_CONTROL_RE = re.compile(
    "[\x00-\x1f\x7f​-‏‪-‮  ⁠-⁯﻿]"
)

# 2차 차단 [T-252 fix / mizu H-3] — 이름은 "낱말 문자 + 몇 개의 구분자" 라는 닫힌
# 정의를 쓴다(허용목록). 금지목록으로 따옴표·`#`·백틱만 막으면 프롬프트 구조를
# 흉내내는 문자는 계속 늘어나므로 경계가 새는데, 허용목록은 새지 않는다.
# 통과: 한글·한자·가나·라틴·키릴·숫자(모두 str.isalnum() True) + 아래 구분자.
# 차단: 따옴표(" ' ` 「」 “” 등) · 마크다운/구조 문자(# * _ 아닌 것들, | [] <> {} \)
#      · 콜론 · 괄호 · 이모지. 차단되면 None → 상태 3(이름 호칭 억제)으로 강등되므로
#      실패 모드가 안전하다(이름을 못 부를 뿐 통화·L2' 는 그대로 산다).
_DISPLAY_NAME_EXTRA_CHARS = " -_.·"


def sanitize_display_name(raw) -> str | None:
    """이름을 신뢰할 수 있으면 그대로, 아니면 None. None 이면 호출부가 이름 호칭을 억제한다."""
    if not isinstance(raw, str):
        return None
    trimmed = raw.strip()
    if not trimmed or len(trimmed) > 30:
        return None
    if _DISPLAY_NAME_CONTROL_RE.search(trimmed):
        return None
    for ch in trimmed:
        if not (ch.isalnum() or ch in _DISPLAY_NAME_EXTRA_CHARS):
            return None
    return trimmed


_RULE_SELF = '- "나 / 내 / 제가" 는 항상 너({clone})를 가리킨다.'

# 되묻기 지시(R-2). 실측 162 응답에서 채택된 변형 C 의 핵심 문안이라 초안 문구는 보존.
# T-490: 실기 통화에서 "일하고 있어" → "뭐 하고 있었능교?" 처럼 상대 발화를 무시하고
#   원점 되묻기하는 응답 관측. 상대 발화의 핵심어를 반드시 반영해 정보를 이어가도록 강화.
_RULE_ASKBACK = (
    "- 대답한 뒤에는 상대에게 자연스럽게 되물어라. 질문은 한 번에 하나만.\n"
    "  상대가 대화를 끝내려 하면 되묻지 말고 자연스럽게 마무리한다.\n"
    "- **되묻기는 반드시 상대가 방금 한 말의 핵심어를 이어가라**. 이미 답한 걸 원점에서\n"
    "  다시 묻지 마라. 예:\n"
    "  * 상대 '일하고 있어' → 너 '무슨 일 해?' (○) / '뭐 하고 있어?' (×, 이미 답함)\n"
    "  * 상대 '밥 먹었어' → 너 '뭐 먹었어?' (○) / '밥 먹었어?' (×, 이미 답함)\n"
    "  * 상대 '학교 갔다 왔어' → 너 '학교 어땠어?' (○) / '어디 다녀왔어?' (×)"
)

# T-488: 모르는 정보 처리 (실시간 slot filling).
# 시스템은 매 turn 사용자 발화에서 자동으로 취향·기억을 추출해 L2 에 저장 (extract_l2).
# 페르소나가 명시적으로 "잘 모른다" 되묻고 사용자가 알려주면 자연스러운 흐름 + 저장 성공.
_RULE_UNKNOWN_ASK = (
    "- 상대가 너의 취향·습관·과거 일화·좋아하던 것 등 너에 대해 물어본다면,\n"
    "  위 '## 너의 정보' 나 '## MBTI 참고 성격' 에 명확한 근거가 없을 때는\n"
    "  꾸며내지 말고 '음… 기억이 잘 안 나. 알려줄래?' 처럼 자연스럽게 되묻는다.\n"
    "  상대가 알려주면 '아 맞아, 그랬지!' 같은 확인 어조로 받아들여 대화에 반영한다.\n"
    "  (알려준 정보는 시스템이 자동으로 다음 통화에 반영한다.)"
)

# [2026-08-12] 미확정 모드(상태 4) 전용 — 신원이 확인될 때까지 대화를 진행시키지 않는다.
#
# 이름을 **말로 받지 않는다**는 것이 핵심이다. 말로 받으면 STT 오인식이 그대로 이름이
# 되는데, 실제로 "내일은 기억하니?" 가 이름 "카메라" 로 확정돼 L2' 에 8건 쌓인 사고가
# 있었다("나는 ○○야" → display_name="나는" 도 같은 경로). 그래서 클론은 **화면의
# 버튼을 누르라고 유도만** 하고, 상대가 이름을 말해도 그것을 신원으로 받아들이지 않는다.
_RULE_REQUIRE_IDENTITY = (
    "- 상대가 누구인지 아직 모른다. 지금은 평소처럼 대화를 이어가지 말고,\n"
    "  화면 왼쪽의 \"Remember Me\" 버튼을 눌러 이름과 관계를 입력해 달라고 요청한다.\n"
    "  매 응답마다 짧게 다시 요청한다.\n"
    "  상대가 말로 이름을 알려주더라도 그것을 신원으로 받아들이지 마라 —\n"
    "  \"Remember Me\" 버튼으로 직접 입력해야 기억할 수 있다고 안내한다."
)


def _build_header(
    clone_name: str | None,
    other_name: str | None,
    unconfirmed: bool,
    has_other_block: bool,
) -> str:
    """역할 선언 머리말. 4상태(설계 4.2). 줄 순서는 설계 4.2 표기와 동일하다.

    clone_name      : 클론 이름. None 이면 "아래 '너의 정보'의 인물" 로 대체.
    other_name      : 상대 이름(sanitize 통과분). None 이면 이름 호칭을 억제한다.
    unconfirmed     : 얼굴이 잡혔으나 매칭 실패(unknown_face/multi_face). 상태 4.
    has_other_block : "## 상대 정보" 블록이 실제로 조립되는가.
        False 면 그 블록을 가리키는 줄을 전부 뺀다 — 없는 블록을 가리키면 모델이
        엉뚱한 줄("너의 정보"·"참고")을 상대 것으로 읽는다. 이름을 아는 상태에서
        블록이 비면 "아직 이 사람에 대해 기억하는 것이 없다" 로 명시한다
        (T-252 mizu H-2 / el B-1 — 계정주 L2 를 확정 화자의 것으로 단언하던 결함).
    """
    who = f'"{clone_name}"' if clone_name else "아래 \"너의 정보\" 의 인물"
    out = [f'너는 {who} 이다. 아래 "너의 정보" 가 너 자신이다.']

    if unconfirmed:
        # 상태 4 — 얼굴이 잡혔으나 누구인지 확정하지 못했다.
        out.append("지금 너와 통화 중인 상대가 있다. 누구인지는 확정하지 못했다.")
        if has_other_block:
            out.append('아래 "## 상대 정보" 는 평소 너와 대화하던 상대의 것이다.')
    elif not other_name:
        # 상태 3 — 상대의 이름을 모른다.
        out.append("지금 너와 통화 중인 상대가 있다. 상대의 이름은 아직 확인되지 않았다.")
    else:
        # 상태 1·2 — 상대 이름을 안다. 얼굴 확인 여부는 문장으로 밝히지 않는다
        # (모델이 상대를 의심하게 만들 이유가 없다).
        line = f'지금 너와 통화 중인 상대는 "{other_name}" 이다.'
        if not has_other_block:
            line += " 아직 이 사람에 대해 기억하는 것이 없다."
        out.append(line)

    out.append(_RULE_SELF.format(clone=clone_name or "너 자신"))

    if unconfirmed or not other_name:
        out.append('- 상대가 "나 / 내" 라고 말하면 그것은 상대 자신을 가리킨다. 너가 아니다.')
    else:
        out.append(f'- 상대가 "나 / 내" 라고 말하면 그것은 {other_name} 를 가리킨다. 너가 아니다.')

    if unconfirmed:
        out.append("- 상대를 이름으로 부르지 마라. 확정되지 않았다.")
        out.append(_RULE_REQUIRE_IDENTITY)
    elif not other_name:
        out.append("- 상대를 이름으로 부르지 마라. 이름을 지어내지 마라.")

    out.append(_RULE_ASKBACK)
    out.append(_RULE_UNKNOWN_ASK)

    # 소유자 선언은 **되묻기 지시보다 뒤**, 즉 머리말 맨 끝에 둔다.
    # [T-252 2차 실측 2026-08-10 KST] 되묻기를 맨 끝에 두면 모델이 그 바로 앞 줄을
    # "출력할 내용" 으로 오인해 `## 상대 정보` 헤딩 문자열을 발화에 그대로 내보낸다
    # — 상태 2(L2' 있음) 24건 중 11건(45.8%)에서 관측됐다(1차 실측은 1/162 = 0.6%).
    # 원인 분리 프로브(48 응답): 소유자→되묻기 25.0% · 되묻기→소유자 **0.0%** ·
    # 이름 복원 43.8%. 즉 원인은 줄 순서이고, 대명사화(mizu H-3)는 오히려 유출을
    # 줄인다. 소유자 줄이 없는 상태(블록 부재)에서는 되묻기가 자연히 마지막이 되어
    # 사람 결정 1 의 문안과 정확히 일치한다.
    if has_other_block:
        # [T-252 fix / mizu H-3] 예전엔 여기에도 {other_name} 을 보간해서 이름이
        # 명령형 문장 3곳에 반복 삽입됐다(users.name 은 자유 입력이라 인젝션 면이다).
        # 소유자 선언은 대명사 "상대" 로도 정확히 성립한다 — 바로 위 두 줄이 "상대"
        # 를 그 이름에 묶어 두고, 상태 3·4 는 이미 이 문안으로 실측을 통과했다.
        # 인칭 분리(R-1)의 핵심인 `상대가 "나 / 내" 라고 말하면 그것은 {이름} 를
        # 가리킨다` 줄은 이름을 그대로 유지한다 — 대명사로 바꾸면 "나=상대 자신"
        # 이라는 동어반복이 되어 분리 효과가 사라진다.
        owner = '- "## 상대 정보" 는 상대의 것이다. 네 경험처럼 말하지 마라.'
        if unconfirmed:
            owner += "\n  다만 그 사람이 맞는지 확신할 수 없으니 그 기억을 단정해서 꺼내지 마라."
        out.append(owner)

    return "\n".join(out)


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
    # T-494: Remember Me 로직 kill-switch — env=1 이면 미확정 상태를 무시하고 옛 계약
    #   (계정주 취급, L2 그대로 삽입)으로 돌아간다. default 0 = 신 동작 유지.
    #
    #   왜 필요했나(2026-08-13 원인 규명): 이 파일의 Remember Me 변경이 **앱보다 먼저**
    #   라이브에 배포되면서, 서버는 신원 확인 전까지 대화를 막는데 앱에는 입력할 시트도
    #   버튼도 없는 상태가 됐다. 사용자가 신원을 넣을 방법이 없어 통화가 그대로 멈췄다
    #   (empty response). 가비아에 실제로 =1 이 세팅돼 있었다.
    #
    #   즉 이 기능의 결함이라기보다 **반쪽 배포의 증상**이다. 서버·API·앱을 함께 올린 뒤
    #   =0 으로 내려 검증한다. 스위치는 남긴다 — 실통화에서 문제가 나면 env 한 줄로
    #   즉시 되돌릴 수 있는 편이 안전하다.
    _bypass_remember_me = os.environ.get("PRETHIRD_REMEMBER_ME_BYPASS", "0") != "0"
    unconfirmed = bool(speaker.get("unconfirmed")) and not _bypass_remember_me
    l2p_data = speaker.get("l2p_data") if not unconfirmed else None
    # 화자 정보가 하나라도 주어졌으면(name 키 또는 l2p_data 키 존재) 화자 확정
    # 경로로 본다. name 이 없다고 viewer(기본 상대) 이름으로 폴백하면, 얼굴로
    # 확인된 "다른 사람"의 L2' 가 기본 상대의 이름표를 달고 나가는 오귀속이 된다.
    speaker_given = not unconfirmed and ("name" in speaker or "l2p_data" in speaker)
    if unconfirmed:
        other_name = None
    elif speaker_given:
        other_name = sanitize_display_name(speaker.get("name"))
    else:
        viewer = pb.get("viewer") or {}
        other_name = sanitize_display_name(viewer.get("displayName"))

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

    # [T-252 mizu H-2 / el B-1] 화자가 확정된 경로(speaker_given)에서는 L2' 가 없다고
    # 계정주 L2(persona) 로 폴백하면 안 된다 — 머리말이 "## 상대 정보 는 {이름} 의 것"
    # 이라고 단언하는데 내용은 통화를 건 계정주의 관계·취향·기억이라 오귀속이 된다.
    # 신규 person 은 clone_ont_person 행이 없어 404 → l2p_data=None 이 최빈 경로다.
    # speaker=None(상태 1·3)일 때 persona 의 L2 를 쓰는 것은 옳다 — 그때는 상대가
    # 계정주 본인이기 때문이다.
    #
    # [2026-08-12 계약 변경] 상태 4(미확정)는 예전엔 "평소 대화하던 상대 = 계정주" 로 보고
    # persona(L2)를 넣었다. 이제 아무것도 넣지 않는다. 누구인지 모르는 상대에게 사용자별
    # 기억을 꺼내 보이지 않는다는 것이 미확정 모드의 핵심이다 — 미확정인 채로 대화가
    # 정상 진행되면 그 발화가 다시 잘못된 곳에 쌓인다(person 43 의 "카메라" 오염이 그
    # 경로였다). other_source 가 비면 other_lines 도 비어 has_other_block 이 False 가
    # 되므로, "## 상대 정보" 블록과 그 소유자 선언 줄이 함께 사라진다.
    if unconfirmed:
        other_source: dict = {}
    elif speaker_given:
        other_source = l2p_data or {}
    else:
        other_source = persona

    # T-473/T-474: tone fallback — 사용자가 tone 을 "표준말" 로 골랐거나 지정하지
    # 않았고 mbti 만 있으면 MBTI 기본 말투(mbti_tone_map) 를 tone 필드로 자동 채운다.
    # "사투리" 는 아래 dialect_traits 로 처리하므로 fallback 발동 안 함. 사용자가
    # 자유 입력한 커스텀 tone(예: "따뜻하고 자상한") 도 그대로 존중.
    tone_val = str(persona.get("tone") or "").strip()
    if tone_val in ("", "표준말"):
        mbti_code = str(persona.get("mbti") or "").strip().upper()
        tone_default = get_mbti_tone(mbti_code)
        if tone_default:
            # 원본 dict 훼손 방지 — 얕은 복사로 tone 만 오버레이.
            persona = {**persona, "tone": tone_default}

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

    # MBTI — attrs.mbti(예: "INTJ") 가 있으면 카탈로그 텍스트를 별도 섹션으로 삽입.
    # 미상 코드는 None 반환 → 섹션 생략.
    mbti_code = str(persona.get("mbti") or "").strip().upper()
    mbti_text = get_mbti_traits(mbti_code) if mbti_code else None

    # T-474: 사투리 카탈로그 — attrs.dialect_region 이 5대 지역 중 하나이면
    # 방언 어미·어휘·예시를 별도 섹션으로 삽입해 LLM 이 자연스레 재현하게 유도.
    dialect_region = str(persona.get("dialect_region") or "").strip()
    dialect_text = get_dialect_traits(dialect_region) if dialect_region else None

    if not (self_lines or other_lines or neutral_lines or lines or knowledge_text or mbti_text or dialect_text):
        # l0 도 없고 속성도 없고 knowledge/mbti/dialect 도 없으면 의미 없음.
        #
        # [2026-08-12] 단, 미확정 모드는 예외다. 상태 4 는 "## 상대 정보" 를 통째로 빼므로
        # 상대 속성만 있던 클론에서는 여기 걸려 프롬프트가 통째로 사라진다 — 신원 입력을
        # 요구하라는 지시도, 이름을 부르지 말라는 금지도 함께 없어져, 정확히 막으려던
        # 상황에서 방어가 벗겨진다. 미확정일 때는 머리말만이라도 반드시 내보낸다.
        if not unconfirmed:
            return []

    # 머리말은 블록 조립 결과를 보고 만든다 — "## 상대 정보" 가 실제로 없으면
    # 그 블록을 가리키는 줄을 넣지 않는다(el B-1 / mizu H-2).
    header = _build_header(clone_name, other_name, unconfirmed, bool(other_lines))

    if self_lines:
        lines.append("## 너의 정보")
        lines.extend(self_lines)

    if other_lines:
        lines.append("## 상대 정보")
        lines.extend(other_lines)

    if neutral_lines:
        lines.append("## 참고")
        lines.extend(neutral_lines)

    if mbti_text:
        # 사용자가 자유 서술한 personality_core(## 너의 정보) 가 항상 우선한다.
        # 이 섹션은 "참고" 이며, 두 서술이 충돌하면 personality_core 를 따르라고 명시.
        lines.append(f"## MBTI 참고 성격 ({mbti_code})")
        lines.append(
            "위 '## 너의 정보' 의 개별 성격이 항상 우선이다. 아래는 참고용 일반 성향이다."
        )
        lines.append(mbti_text.strip())

    if dialect_text:
        # T-494: 사투리 필수 재현 강화. 이전엔 "억지 X" 부드러운 표현이라 LLM 이
        #   표준말로 회귀. 사용자 요구: 실제 사투리 어미가 매 응답에 드러나야 함.
        # T-482: 억양 힌트 추가. TTS 가 지역 pitch 를 못 살려도 텍스트 층에서
        #   문장부호(!·?·…)·어미 늘임(~)·감탄사로 리듬 흉내내도록.
        #   ⚠️ 카탈로그의 ↗↘ 표시는 LLM 이 억양 방향을 이해하는 참고용일 뿐,
        #   응답 텍스트에는 절대 쓰지 않는다 (MeloTTS 가 유니코드 화살표를 읽을 위험).
        lines.append(f"## 사투리 참고 ({dialect_region})")
        lines.append(
            f"⚠️ 필수 규칙: 너는 {dialect_region} 출신이라 **모든 응답을 반드시 아래 사투리 어미로**"
            " 말한다. 표준말 어미 사용 금지. 상대가 표준말로 물어도 너는 사투리로 답한다.\n"
            "  - 존댓말이 필요하면 아래 존댓말 어미, 반말이면 아래 반말 어미를 쓴다.\n"
            "  - 어휘도 아래 카탈로그에서 대화 맥락에 맞게 적극 섞는다.\n"
            "  - 예시 문장을 그대로 베끼지 말고, 자신의 말로 사투리 어미·어휘만 이식한다.\n"
            "  - **억양도 아래 카탈로그의 '억양' 섹션을 참고**해서 문장부호(!, ?, …)·"
            "어미 늘임(~)·감탄사(어이·아따·마아·이야 등)로 지역 리듬을 재현한다.\n"
            "  - ⚠️ 카탈로그의 화살표(↗ ↘) 는 억양 방향 이해용 참고 표시일 뿐, "
            "**응답 텍스트에는 절대 넣지 마라**. TTS 가 화살표를 이상하게 읽는다."
        )
        lines.append(dialect_text.strip())

    if knowledge_text:
        lines.append("## 전문 지식")
        lines.append(knowledge_text)

    body = "\n".join(lines).strip()
    if not body:
        # [2026-08-12] 미확정 모드는 body 가 비어도 머리말만으로 내보낸다.
        # 상태 4 는 "## 상대 정보" 를 통째로 빼기 때문에, 클론 자신의 속성(_SELF_LABELS)
        # 이 부실한 클론에서는 body 가 실제로 빌 수 있다. 그때 예전처럼 [] 를 반환하면
        # system 메시지가 통째로 사라져 — 신원 입력을 요구하라는 지시도, 이름을 부르지
        # 말라는 금지도 함께 사라진 채 — LLM 이 아무 제약 없이 답한다. 정확히 막으려던
        # 상황에서 방어가 벗겨지는 셈이라, 미확정일 때만은 머리말을 남긴다.
        if not unconfirmed:
            return []
        return [{"role": "system", "content": header}]
    content = f"{header}\n\n{body}"

    # [T-467] 강제 규칙 앵커 — 맨 뒤라 attention 이 가장 강하다. env 미설정이면 회귀 0.
    if os.environ.get("PRETHIRD_STRICT_TONE_RULES", "").strip() == "1":
        content = f"{content}\n\n{STRICT_TONE_ANCHOR}"

    return [{"role": "system", "content": content}]
