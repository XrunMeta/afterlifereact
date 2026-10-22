"""AFL-1033 응답 언어 태그 — LLM 답 맨 앞 `<lang=코드>` 를 떼어 언어 플래그로 쓴다.

채팅(/chat/reply)과 통화(AFL-1034, 스트리밍)가 같은 파서를 쓴다.
- 태그는 **맨 앞에서만** 인정. 중간에 나온 `<lang=…>` 는 지우고 플래그로 쓰지 않는다.
- 태그가 없거나 · 깨졌거나 · 모르는 코드면 → 사용자 언어 → `ko`.
- 코드는 짧은 형식(ko·en·ja·zh·es·fr·id … ISO 639-1 두 글자).
"""
from __future__ import annotations

import re

DEFAULT_LANG = "ko"

# 맨 앞 태그(앞 공백 허용). 코드는 영문 2~3자 + 선택 지역(zh-CN → zh 로 줄임).
_HEAD_RE = re.compile(r"^\s*<\s*lang\s*=\s*([A-Za-z]{2,3})(?:[-_][A-Za-z]{2,4})?\s*>\s*", re.I)
# 본문 어디든 남은 태그(깨진 것 포함 `<lang=>`·`<lang=xx`) — 사용자에게 보이지 않게 지운다.
_ANY_RE = re.compile(r"<\s*lang\s*=\s*[A-Za-z_-]{0,10}\s*>?", re.I)

# ISO 639-1 두 글자만 인정(오탈자·임의 문자열 차단). 필요한 언어가 늘면 여기에 더한다.
KNOWN_LANGS = frozenset({
    "ko", "en", "ja", "zh", "es", "fr", "id", "de", "it", "ru", "pt", "vi", "th", "ar", "hi",
    "tr", "nl", "pl", "ms", "tl",
})


def normalize_lang(code: str | None) -> str | None:
    """'zh-CN'·'ja_JP'·'EN' → 'zh'·'ja'·'en'. 모르는 코드면 None."""
    if not isinstance(code, str):
        return None
    base = re.split(r"[-_]", code.strip().lower(), maxsplit=1)[0]
    return base if base in KNOWN_LANGS else None


def split_lang_tag(text: str, fallback: str | None = None) -> tuple[str, str]:
    """완성된 답에서 (lang, 태그를 뗀 본문). fallback = 사용자 언어(없으면 ko)."""
    fb = normalize_lang(fallback) or DEFAULT_LANG
    s = text or ""
    lang = None
    m = _HEAD_RE.match(s)
    if m:
        lang = normalize_lang(m.group(1))
        s = s[m.end():]
    s = _ANY_RE.sub("", s).strip()
    return (lang or fb), s


class LangTagStream:
    """스트리밍용 — 첫 조각들에서 태그를 기다렸다가 언어가 정해지면 본문만 흘린다.

    feed(chunk) → 지금 내보낼 본문(아직 태그 판정 중이면 "").
    lang       → 정해진 언어(판정 전이면 None). finish() 후엔 항상 값이 있다.
    """

    # 태그가 이 길이 안에 안 끝나면 태그 없는 답으로 본다.
    _MAX_HEAD = 24

    def __init__(self, fallback: str | None = None) -> None:
        self._fb = normalize_lang(fallback) or DEFAULT_LANG
        self._buf = ""
        self.lang: str | None = None

    def feed(self, chunk: str) -> str:
        if self.lang is not None:
            return _ANY_RE.sub("", chunk or "")
        self._buf += chunk or ""
        head = self._buf.lstrip()
        if not head:
            return ""
        m = _HEAD_RE.match(self._buf)
        if m:
            self.lang = normalize_lang(m.group(1)) or self._fb
            rest, self._buf = self._buf[m.end():], ""
            return _ANY_RE.sub("", rest)
        # '<' 로 시작했는데 아직 '>' 가 안 왔으면 태그가 만들어지는 중 — 더 기다린다.
        if head.startswith("<") and ">" not in head and len(head) < self._MAX_HEAD:
            return ""
        self.lang = self._fb
        rest, self._buf = self._buf, ""
        return _ANY_RE.sub("", rest)

    def finish(self) -> str:
        """스트림 끝 — 남은 버퍼를 내보내고 언어를 확정한다."""
        if self.lang is None:
            lang, rest = split_lang_tag(self._buf, self._fb)
            self.lang, self._buf = lang, ""
            return rest
        return ""


# AFL-1034: 통화에서 목소리로 말할 수 있는 언어(TTS 지원). ko·en·ja·zh = CosyVoice2 · es = CosyVoice3.
CALL_LANGS = ("ko", "en", "ja", "zh", "es")
# 통화에서 지원 밖 언어로 말을 걸면 이 언어로 답한다.
CALL_FALLBACK_LANG = "en"


def lang_instruction(user_lang: str | None, allowed: tuple[str, ...] | None = None) -> str:
    """답 언어 규칙(AFL-1033 2절) + 태그 출력 지시 + 한국어 전용 규칙 해제(4절).

    allowed: 통화처럼 답할 수 있는 언어가 정해진 경우(AFL-1034). 그 밖의 언어면 영어로 답하게 한다.
    """
    ul = normalize_lang(user_lang) or DEFAULT_LANG
    if allowed and ul not in allowed:
        ul = CALL_FALLBACK_LANG if CALL_FALLBACK_LANG in allowed else allowed[0]
    limit = (
        f"- 답할 수 있는 언어는 {'·'.join(allowed)} 뿐이야. 상대가 다른 언어로 말하면 "
        f"`{CALL_FALLBACK_LANG}` 언어로 답해.\n"
        if allowed else ""
    )
    return (
        "[답 언어 규칙 — 가장 중요]\n"
        "- 상대가 **마지막에 보낸 메시지의 언어**로 답해. 앞의 대화·기억·설정이 한국어여도 따라가지 마.\n"
        f"- 마지막 메시지의 언어가 분명하지 않으면(예: 'ok', 'ㅋㅋ', 이모지, '?') `{ul}` 언어로 답해.\n"
        + limit +
        "- 한국어로 답할 때만 반말/존댓말·사투리 규칙을 지켜. 다른 언어면 그 규칙 대신 "
        "반말이면 친근한 말투, 존댓말이면 정중한 말투로 답하고 사투리는 쓰지 마.\n"
        "- 답의 **맨 앞**에 답한 언어를 `<lang=코드>` 로 붙여(코드: ko·en·ja·zh·es·fr·id 등 두 글자). "
        "예: `<lang=ja>こんにちは！` · `<lang=ko>안녕!` — 태그는 맨 앞에 한 번만."
    )
