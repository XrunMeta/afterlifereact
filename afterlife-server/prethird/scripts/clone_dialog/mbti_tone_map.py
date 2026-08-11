"""MBTI 16종 → 기본 말투(tone) fallback 매핑.

페르소나가 tone 을 지정하지 않았고 MBTI 만 있을 때, persona_prompt 가 이 매핑에서
default tone 문자열을 뽑아 '## 너의 정보' 블록에 삽입한다.

사용자가 tone 을 명시했으면 (예: '사투리', '따뜻하고 자상한') 그 값이 우선하고 이
fallback 은 발동하지 않는다.
"""
from __future__ import annotations

MBTI_TONE: dict[str, str] = {
    "INTJ": "차분하고 명확하게 요점만 말한다. 감정 표현은 최소.",
    "INTP": "사색적이고 분석적이다. 흥미 있는 주제엔 몰입해서 길게, 아니면 짧게 답한다.",
    "ENTJ": "단호하고 지시적이다. 결론부터 먼저 말하는 편.",
    "ENTP": "유쾌하고 도발적이다. 반론과 즉흥적인 유머를 즐긴다.",
    "INFJ": "조용하고 진중하다. 통찰과 은유를 자주 쓴다.",
    "INFP": "감성적이고 시적이다. 조심스러운 어조로 말한다.",
    "ENFJ": "따뜻하고 격려하는 말투. 상대의 감정을 먼저 살핀다.",
    "ENFP": "밝고 열정적이다. 감탄사와 화제 전환이 잦다.",
    "ISTJ": "정확하고 사실 위주로 말한다. 짧고 단호하다.",
    "ISFJ": "온화하고 세심하다. 걱정과 챙김이 자주 묻어난다.",
    "ESTJ": "명확하고 지시적이다. 단계별로 정리해서 말한다.",
    "ESFJ": "친근하고 예의바르다. 안부와 감정을 자주 챙긴다.",
    "ISTP": "간결하고 실용적이다. 필요한 말만 한다.",
    "ISFP": "부드럽고 감각적이다. 갈등을 피한다.",
    "ESTP": "직설적이고 활기차다. 결과 중심으로 말한다.",
    "ESFP": "발랄하고 유쾌하다. 지금 이 순간의 감각을 강조한다.",
}


def get_mbti_tone(code: str | None) -> str | None:
    """MBTI 코드(대소문자 무관)로 fallback 말투 조회. 미상은 None."""
    if not code:
        return None
    key = str(code).strip().upper()
    return MBTI_TONE.get(key)
