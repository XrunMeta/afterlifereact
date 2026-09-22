"""한국어 문장 속 아라비아 숫자 → 한글 읽기.

CosyVoice 텍스트 정규화(wetext)가 한국어 문장 속 숫자에서 AssertionError 로 죽어
/tts/kr 가 500 을 냈다. 엔진에 넘기기 전에 숫자를 한글로 풀어 우회한다.

- 기본은 한자어 읽기(이십, 백오, 이천이십육).
- 뒤에 고유어 단위(시·살·개·명 …)가 오고 99 이하면 고유어 관형형(세 시, 스물한 살).
"""
from __future__ import annotations

import re

_DIGITS = "영일이삼사오육칠팔구"
_SMALL_UNITS = ["", "십", "백", "천"]
_BIG_UNITS = ["", "만", "억", "조", "경"]

# 고유어 수 관형형(1~9, 10 단위)
_NATIVE_ONES = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"]
_NATIVE_TENS = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"]
_NATIVE_COUNTERS = ("시", "살", "개", "명", "마리", "번", "잔", "권", "장", "시간", "달", "군데", "사람")

_NUM_RE = re.compile(r"\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?")

def _sino_under_10000(n: int) -> str:
    out = []
    for pos, ch in enumerate(reversed(f"{n:04d}")):
        d = int(ch)
        if d == 0:
            continue
        # 십·백·천 앞의 1 은 읽지 않는다(십, 백, 천)
        digit = "" if (d == 1 and pos > 0) else _DIGITS[d]
        out.append(digit + _SMALL_UNITS[pos])
    return "".join(reversed(out))

def sino(n: int) -> str:
    if n == 0:
        return "영"
    parts = []
    group = 0
    while n > 0 and group < len(_BIG_UNITS):
        chunk = n % 10000
        if chunk:
            word = _sino_under_10000(chunk)
            # 만 앞의 1 은 읽지 않는다(만 원). 억 이상은 일억.
            if group == 1 and chunk == 1:
                word = ""
            parts.append(word + _BIG_UNITS[group])
        n 
        group += 1
    return "".join(reversed(parts))

def native(n: int) -> str:
    """1~99 고유어 관형형(한, 두, 스물한 …)."""
    tens, ones = divmod(n, 10)
    if n == 20:
        return "스무"
    return _NATIVE_TENS[tens] + _NATIVE_ONES[ones]

def _replace(m: re.Match, text: str) -> str:
    raw = m.group(0).replace(",", "")
    after = text[m.end():]
    if "." in raw:
        # 소수부는 한 자리씩 읽는다(3.14 → 삼 점 일사)
        whole, frac = raw.split(".", 1)
        return f"{sino(int(whole))} 점 {''.join(_DIGITS[int(c)] for c in frac)}"
    n = int(raw)
    stripped = after.lstrip()
    if 1 <= n <= 99 and stripped.startswith(_NATIVE_COUNTERS):
        # "3시" / "3 시" 모두 "세 시" 로 — 관형형 뒤는 띄어 읽는 편이 자연스럽다.
        return native(n) + ("" if after[:1] == " " else " ")
    return sino(n)

def spell_numbers(text: str) -> str:
    if not any(c.isdigit() for c in text):
        return text
    out, last = [], 0
    for m in _NUM_RE.finditer(text):
        out.append(text[last:m.start()])
        out.append(_replace(m, text))
        last = m.end()
    out.append(text[last:])
    return "".join(out)
