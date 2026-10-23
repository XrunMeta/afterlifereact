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
# 닫는 꼴(`</ask=who>`·`</lang=ko>`)도 지운다 — LLM 이 태그를 답 끝에 닫는 태그로 붙인 실측(2026-10-23).
# 2026-10-23: `</lang>`(= 없는 닫는 태그)도 지운다 — 영어 실통화에서 답 끝에 그대로 나와 TTS 로 갔다.
_ANY_RE = re.compile(
    r"<\s*/?\s*lang\b\s*(?:=\s*[A-Za-z_-]{0,10}\s*)?>?|<\s*/?\s*ask\b\s*(?:=\s*[^>\s<]{0,24}\s*)?>?",
    re.I,
)
# 스트림 조각 끝에 걸린 태그 앞부분(`<`·`</as`·`<lang=k` …) — 다음 조각과 붙여 판정하려고 붙잡는다.
_TAG_PREFIX_RE = re.compile(
    r"<\s*/?\s*(?:l(?:a(?:n(?:g(?:\s*=\s*[A-Za-z_-]{0,10}\s*)?)?)?)?|a(?:s(?:k(?:\s*=\s*[^>\s<]{0,24}\s*)?)?)?)?",
    re.I,
)
# AFL-1039: `<lang=xx>` 바로 뒤의 `<ask=who>` 만 플래그로 인정. 그 밖의 값(이름 등)은 플래그 없이 지운다.
_ASK_RE = re.compile(r"^\s*<\s*ask\s*=\s*(who)\s*>\s*", re.I)
ASK_VALUES = frozenset({"who"})

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


def split_head_tags(text: str, fallback: str | None = None) -> tuple[str, str | None, str]:
    """완성된 답에서 (lang, ask, 태그를 뗀 본문). ask 는 lang 태그 바로 뒤 `<ask=who>` 일 때만 "who"."""
    fb = normalize_lang(fallback) or DEFAULT_LANG
    s = text or ""
    lang = None
    ask = None
    m = _HEAD_RE.match(s)
    if m:
        lang = normalize_lang(m.group(1))
        s = s[m.end():]
        am = _ASK_RE.match(s)
        if am:
            v = am.group(1).lower()
            ask = v if v in ASK_VALUES else None
            s = s[am.end():]
    s = _ANY_RE.sub("", s).strip()
    return (lang or fb), ask, s


def split_lang_tag(text: str, fallback: str | None = None) -> tuple[str, str]:
    """완성된 답에서 (lang, 태그를 뗀 본문). fallback = 사용자 언어(없으면 ko)."""
    lang, _ask, body = split_head_tags(text, fallback)
    return lang, body


class LangTagStream:
    """스트리밍용 — 첫 조각들에서 태그를 기다렸다가 언어가 정해지면 본문만 흘린다.

    feed(chunk) → 지금 내보낼 본문(아직 태그 판정 중이면 "").
    lang       → 정해진 언어(판정 전이면 None). finish() 후엔 항상 값이 있다.
    ask        → lang 태그 바로 뒤 `<ask=who>` 가 있으면 "who", 아니면 None (finish() 후 확정).
    """

    # 태그가 이 길이 안에 안 끝나면 태그 없는 답으로 본다.
    _MAX_HEAD = 24

    def __init__(self, fallback: str | None = None) -> None:
        self._fb = normalize_lang(fallback) or DEFAULT_LANG
        self._buf = ""
        self.lang: str | None = None
        self.ask: str | None = None
        # lang 확정 직후 `<ask=…>` 가 올 수 있는 구간 — 판정 전까지 본문을 붙잡는다.
        self._ask_pending = False
        # 본문 중 조각 경계에 걸린 태그 앞부분(_body 참고).
        self._hold = ""

    def _body(self, text: str) -> str:
        """본문 조각에서 태그를 지운다. 조각 끝이 태그 앞부분이면 다음 조각까지 붙잡는다
        (토큰 단위로 `</`·`ask`·`=who>` 가 나눠 와도 지워지게)."""
        s = self._hold + (text or "")
        self._hold = ""
        i = s.rfind("<")
        if i != -1 and _TAG_PREFIX_RE.fullmatch(s[i:]):
            self._hold, s = s[i:], s[:i]
        return _ANY_RE.sub("", s)

    def _feed_ask(self, chunk: str) -> str:
        self._buf += chunk or ""
        am = _ASK_RE.match(self._buf)
        if am:
            self.ask = am.group(1).lower()
            rest, self._buf, self._ask_pending = self._buf[am.end():], "", False
            return self._body(rest)
        head = self._buf.lstrip()
        if not head:
            return ""
        if head.startswith("<") and ">" not in head and len(head) < self._MAX_HEAD:
            return ""
        rest, self._buf, self._ask_pending = self._buf, "", False
        return self._body(rest)

    def feed(self, chunk: str) -> str:
        if self.lang is not None:
            if self._ask_pending:
                return self._feed_ask(chunk)
            return self._body(chunk)
        self._buf += chunk or ""
        head = self._buf.lstrip()
        if not head:
            return ""
        m = _HEAD_RE.match(self._buf)
        if m:
            self.lang = normalize_lang(m.group(1)) or self._fb
            rest, self._buf = self._buf[m.end():], ""
            self._ask_pending = True
            return self._feed_ask(rest)
        # '<' 로 시작했는데 아직 '>' 가 안 왔으면 태그가 만들어지는 중 — 더 기다린다.
        if head.startswith("<") and ">" not in head and len(head) < self._MAX_HEAD:
            return ""
        self.lang = self._fb
        rest, self._buf = self._buf, ""
        return self._body(rest)

    def finish(self) -> str:
        """스트림 끝 — 남은 버퍼를 내보내고 언어를 확정한다."""
        if self.lang is None:
            lang, ask, rest = split_head_tags(self._buf, self._fb)
            self.lang, self.ask, self._buf = lang, ask, ""
            return rest
        if self._ask_pending:
            # ask 판정 중에 스트림이 끝남 — 남은 버퍼를 같은 규칙으로 정리.
            _l, self.ask, rest = split_head_tags("<lang=xx>" + self._buf, self._fb)
            tail = self._buf.strip().lower().replace(" ", "")
            self._buf, self._ask_pending = "", False
            # 끊긴 `<as` 같은 태그 앞부분은 사용자에게 내보내지 않는다.
            return "" if tail and "<ask=who>".startswith(tail) else rest
        # 끝까지 붙잡힌 태그 앞부분 — `<` 하나면 본문 글자로 돌려주고, 그보다 길면 끊긴 태그라 버린다.
        held, self._hold = self._hold, ""
        return held if held == "<" else ""


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
        "- 음성 인식이 엉켜 문장이 이상해도 **쓰인 글자로** 언어를 판단해(알파벳 문장이면 영어 등). "
        "알아듣기 어려우면 그 언어로 다시 말해 달라고 해.\n"
        "- 태그는 여는 태그 하나만 — 닫는 태그(`</lang>` 등)는 쓰지 마.\n"
        + limit +
        "- 한국어로 답할 때만 반말/존댓말·사투리 규칙을 지켜. 다른 언어면 그 규칙 대신 "
        "반말이면 친근한 말투, 존댓말이면 정중한 말투로 답하고 사투리는 쓰지 마.\n"
        "- 답의 **맨 앞**에 답한 언어를 `<lang=코드>` 로 붙여(코드: ko·en·ja·zh·es·fr·id 등 두 글자). "
        "예: `<lang=ja>こんにちは！` · `<lang=ko>안녕!` — 태그는 맨 앞에 한 번만."
    )
