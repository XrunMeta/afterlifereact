"""T-545 한국어 텍스트 → viseme 시퀀스 매퍼.

한글 음절 → 초성/중성/종성 분해 → 각각 대응하는 viseme 매핑.
결과: [{"v": "A"|"E"|..., "dur_ms": 100~200}, ...]

Viseme 종류 (10개):
    REST   — 침묵 (문장 시작/공백)
    A      — 아 (ㅏ ㅑ) 크게 벌림
    E      — 에 (ㅐ ㅔ ㅖ ㅢ) 중간
    I      — 이 (ㅣ) 좁게 옆으로
    O      — 오 (ㅗ ㅛ) 동그랗게 크게
    U      — 우 (ㅜ ㅠ) 동그랗게 좁게
    EO     — 어 (ㅓ ㅕ) 벌림 중간
    EU     — 으 (ㅡ) 옆으로 좁게
    BILAB  — 양순 (ㅁ ㅂ ㅍ ㅃ ㅄ ㅁ 종성) 입 다물기 순간
    DENT   — 치음 (ㅅ ㅆ ㅈ ㅊ ㄴ ㄷ) 이 살짝 보임 (선택)

MeloTTS/CosyVoice 는 phoneme timing 을 직접 안 주므로 char count 기반 균등 분포로 근사.
정밀한 sync 필요하면 후속 트랙에서 forced alignment (aeneas) 도입.
"""
from __future__ import annotations

# ── 자모 → viseme 매핑 ─────────────────────────────────────────────

# 중성(모음) 지배 원칙 — 자음 짧게, 모음이 실제 입 모양 결정.
VOWEL_TO_VISEME = {
    "ㅏ": "A", "ㅑ": "A",
    "ㅐ": "E", "ㅔ": "E", "ㅒ": "E", "ㅖ": "E", "ㅢ": "E",
    "ㅣ": "I",
    "ㅗ": "O", "ㅛ": "O", "ㅘ": "O", "ㅙ": "O", "ㅚ": "O",
    "ㅜ": "U", "ㅠ": "U", "ㅝ": "U", "ㅞ": "U", "ㅟ": "U",
    "ㅓ": "EO", "ㅕ": "EO",
    "ㅡ": "EU",
}

# 양순 자음 — 초성일 때 짧게 BILAB 삽입 (닫혔다 벌리는 효과).
BILABIAL_INITIALS = {"ㅁ", "ㅂ", "ㅍ", "ㅃ"}

# 치음 계열 — 선택적 DENT (없어도 자연스러움 큰 손해 X, 우선 skip).
DENTAL_INITIALS = {"ㅅ", "ㅆ", "ㅈ", "ㅊ", "ㄴ", "ㄷ", "ㄹ", "ㅌ"}

# 종성이 양순이면 음절 끝에 짧은 BILAB 추가 (예: "밥" 의 마지막 ㅂ).
BILABIAL_FINALS = {"ㅁ", "ㅂ", "ㅍ"}

# ── 한글 음절 분해 ─────────────────────────────────────────────────

_HANGUL_START = 0xAC00  # 가
_HANGUL_END = 0xD7A3    # 힣
_INITIALS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"
_MEDIALS = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"
_FINALS = " ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"


def decompose_syllable(ch: str) -> tuple[str, str, str] | None:
    """한글 음절 → (초성, 중성, 종성). 종성 없으면 빈문자열. 한글 아니면 None."""
    code = ord(ch)
    if not (_HANGUL_START <= code <= _HANGUL_END):
        return None
    offset = code - _HANGUL_START
    ini = _INITIALS[offset // (21 * 28)]
    med = _MEDIALS[(offset % (21 * 28)) // 28]
    fin_idx = offset % 28
    fin = _FINALS[fin_idx].strip()
    return (ini, med, fin)


# ── 메인 매퍼 ─────────────────────────────────────────────────────

def text_to_visemes(text: str, total_ms: int | None = None) -> list[dict]:
    """텍스트 → [{v, dur_ms}, ...] viseme 시퀀스.

    total_ms 주어지면 그 길이에 맞춰 dur 균등 분포. None 이면 char 당 200ms 기본.
    한글 이외 (숫자·영문·구두점) 는 REST 삽입 (짧게).
    """
    events: list[dict] = []
    # 1단계: 각 char → viseme 열 (dur 없이 시퀀스만).
    for ch in text:
        parts = decompose_syllable(ch)
        if parts is None:
            if ch.strip() == "":
                events.append({"v": "REST"})  # 공백 → 쉼
            else:
                events.append({"v": "A"})  # 영/숫/기호 → 기본 벌림
            continue
        ini, med, fin = parts
        # 초성이 양순이면 앞에 짧은 BILAB
        if ini in BILABIAL_INITIALS:
            events.append({"v": "BILAB"})
        # 모음 결정 viseme
        events.append({"v": VOWEL_TO_VISEME.get(med, "A")})
        # 종성이 양순이면 뒤에 짧은 BILAB (음절 끝 입 다물기)
        if fin in BILABIAL_FINALS:
            events.append({"v": "BILAB"})

    if not events:
        return [{"v": "REST", "dur_ms": 200}]

    # 2단계: dur 배분.
    if total_ms is None:
        # 기본 — 종류별 대략 길이
        for ev in events:
            if ev["v"] == "BILAB":
                ev["dur_ms"] = 80    # 짧게
            elif ev["v"] == "REST":
                ev["dur_ms"] = 150
            else:
                ev["dur_ms"] = 200
    else:
        # 총 길이 맞춰 균등 분포 (양순/휴지 는 짧게 가중)
        weights = [0.4 if e["v"] == "BILAB" else 0.7 if e["v"] == "REST" else 1.0
                   for e in events]
        weight_sum = sum(weights)
        for ev, w in zip(events, weights):
            ev["dur_ms"] = max(30, int(total_ms * (w / weight_sum)))
        # 합계 맞춤 (마지막에 나머지 흡수)
        cur = sum(e["dur_ms"] for e in events)
        diff = total_ms - cur
        if diff != 0:
            events[-1]["dur_ms"] = max(30, events[-1]["dur_ms"] + diff)

    return events


# ── self-test ─────────────────────────────────────────────────────

if __name__ == "__main__":
    tests = [
        "가나다라마바사아자차카오",
        "안녕하세요",
        "밥 먹었어?",
        "오늘 날씨 좋네요",
    ]
    for t in tests:
        seq = text_to_visemes(t)
        print(f'"{t}"  → {len(seq)}개')
        for ev in seq:
            print(f"    {ev['v']:6s} {ev['dur_ms']}ms")
        total = sum(e["dur_ms"] for e in seq)
        print(f"    (총 {total}ms)\n")
