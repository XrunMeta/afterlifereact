"""AFL-1033 응답 언어 태그 — LLM 답 맨 앞 `<lang=코드>` 를 떼어 언어 플래그로 쓴다.

채팅(/chat/reply)과 통화(AFL-1034, 스트리밍)가 같은 파서를 쓴다.
- 태그는 **맨 앞에서만** 인정. 중간에 나온 `<lang=…>` 는 지우고 플래그로 쓰지 않는다.
- 태그가 없거나 · 깨졌거나 · 모르는 코드면 → 사용자 언어 → `ko`.
- 코드는 짧은 형식(ko·en·ja·zh·es·fr·id … ISO 639-1 두 글자).

AFL-1067: 머리 태그에 `<emo=감정>` 을 더한다(EMOTIONS 6종). 답 하나에 하나, 순서는 상관없이 머리에서만
인정하고 없거나 모르는 값이면 neutral. TTS 에는 텍스트가 아니라 파라미터로 넘긴다(감정 견본 선택용).
"""
from __future__ import annotations

import os
import re

DEFAULT_LANG = "ko"

# 맨 앞 태그(앞 공백 허용). 코드는 영문 2~3자 + 선택 지역(zh-CN → zh 로 줄임).
_HEAD_RE = re.compile(r"^\s*<\s*lang\s*=\s*([A-Za-z]{2,3})(?:[-_][A-Za-z]{2,4})?\s*>\s*", re.I)
# 본문 어디든 남은 태그(깨진 것 포함 `<lang=>`·`<lang=xx`) — 사용자에게 보이지 않게 지운다.
# 닫는 꼴(`</ask=who>`·`</lang=ko>`)도 지운다 — LLM 이 태그를 답 끝에 닫는 태그로 붙인 실측(2026-10-23).
# 2026-10-23: `</lang>`(= 없는 닫는 태그)도 지운다 — 영어 실통화에서 답 끝에 그대로 나와 TTS 로 갔다.
# 2026-10-23(AFL-1039 실통화): 이름과 상관없이 영문 닫는 태그 꼴(`</final` 등)도 지운다 — 답 끝에
#   `</final` 이 붙어 화면·TTS 로 갔다. 닫는 꼴만 — 여는 `<word>` 는 본문일 수 있어 건드리지 않는다.
_ANY_RE = re.compile(
    r"<\s*/?\s*lang\b\s*(?:=\s*[A-Za-z_-]{0,10}\s*)?>?|<\s*/?\s*ask\b\s*(?:=\s*[^>\s<]{0,24}\s*)?>?"
    # AFL-1067: `<emo=…>` 는 값이 무엇이든(기호·한글·쉼표) `>` 까지 지운다(값 꼬리가 TTS 로 새지 않게).
    #   `>` 가 없으면 값 앞부분만(본문을 먹지 않게). `=` 없는 `<emo 설명>` 같은 본문은 건드리지 않는다.
    r"|<\s*emo\s*=[^<>\n]{0,40}>|<\s*/?\s*emo\s*>|<\s*emo\s*=\s*[A-Za-z_-]{0,12}\s*"
    r"|<\s*/\s*[A-Za-z_][A-Za-z0-9_-]{0,15}\s*>?",
    re.I,
)
# 스트림 조각 끝에 걸린 태그 앞부분(`<`·`</as`·`<lang=k`·`<emo=s` …) — 다음 조각과 붙여 판정하려고 붙잡는다.
_TAG_PREFIX_RE = re.compile(
    r"<\s*/?\s*(?:l(?:a(?:n(?:g(?:\s*=\s*[A-Za-z_-]{0,10}\s*)?)?)?)?|a(?:s(?:k(?:\s*=\s*[^>\s<]{0,24}\s*)?)?)?"
    r"|e(?:m(?:o(?:\s*(?:=[^<>\n]{0,40})?)?)?)?)?"
    r"|<\s*/\s*[A-Za-z_][A-Za-z0-9_-]{0,15}\s*",
    re.I,
)
# AFL-1039: `<lang=xx>` 바로 뒤의 `<ask=who>` 만 플래그로 인정. 그 밖의 값(이름 등)은 플래그 없이 지운다.
_ASK_RE = re.compile(r"^\s*<\s*ask\s*=\s*(who)\s*>\s*", re.I)
ASK_VALUES = frozenset({"who"})
# AFL-1067: 머리의 `<emo=값>`(값이 깨졌으면 플래그 없이 지운다).
# 값 칸은 넓게 받아(`>` 까지) 통째로 떼고, EMOTIONS 밖이면 neutral.
_EMO_RE = re.compile(r"^\s*<\s*emo\s*=([^<>\n]{0,40})>\s*", re.I)
EMOTIONS = ("neutral", "calm", "happy", "sad", "angry", "warm")
DEFAULT_EMOTION = "neutral"

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


def normalize_emotion(value: str | None) -> str | None:
    """'SAD'·' warm ' → 'sad'·'warm'. 모르는 값이면 None."""
    if not isinstance(value, str):
        return None
    v = value.strip().lower()
    return v if v in EMOTIONS else None


class _HeadTags:
    """머리 태그 판정 상태 — split_reply_tags(완성본)와 LangTagStream(스트림)이 같은 규칙을 쓴다.

    lang: 머리 어디서든 1회 · ask: lang 태그 바로 뒤에서만 · emo: 머리 어디서든 1회.
    """

    def __init__(self) -> None:
        self.lang: str | None = None
        self.ask: str | None = None
        self.emo: str | None = None
        self.seen_lang = False
        self.seen_emo = False
        self._ask_ok = False    # 직전에 lang 태그를 뗐을 때만 ask 를 본다

    def take(self, s: str) -> int:
        """s 맨 앞의 머리 태그 하나를 떼면 그 길이, 아니면 0."""
        if not self.seen_lang:
            m = _HEAD_RE.match(s)
            if m:
                self.lang, self.seen_lang, self._ask_ok = normalize_lang(m.group(1)), True, True
                return m.end()
        if self._ask_ok:
            am = _ASK_RE.match(s)
            if am:
                v = am.group(1).lower()
                self.ask, self._ask_ok = (v if v in ASK_VALUES else None), False
                return am.end()
        if not self.seen_emo:
            em = _EMO_RE.match(s)
            if em:
                self.emo, self.seen_emo, self._ask_ok = normalize_emotion(em.group(1)), True, False
                return em.end()
        return 0


def split_reply_tags(text: str, fallback: str | None = None) -> tuple[str, str | None, str, str]:
    """완성된 답에서 (lang, ask, emo, 태그를 뗀 본문). emo 는 없거나 모르는 값이면 neutral."""
    fb = normalize_lang(fallback) or DEFAULT_LANG
    s = text or ""
    h = _HeadTags()
    while True:
        n = h.take(s)
        if not n:
            break
        s = s[n:]
    s = _ANY_RE.sub("", s).strip()
    return (h.lang or fb), h.ask, (h.emo or DEFAULT_EMOTION), s


def split_head_tags(text: str, fallback: str | None = None) -> tuple[str, str | None, str]:
    """완성된 답에서 (lang, ask, 태그를 뗀 본문). ask 는 lang 태그 바로 뒤 `<ask=who>` 일 때만 "who"."""
    lang, ask, _emo, body = split_reply_tags(text, fallback)
    return lang, ask, body


def split_lang_tag(text: str, fallback: str | None = None) -> tuple[str, str]:
    """완성된 답에서 (lang, 태그를 뗀 본문). fallback = 사용자 언어(없으면 ko)."""
    lang, _ask, body = split_head_tags(text, fallback)
    return lang, body


class LangTagStream:
    """스트리밍용 — 첫 조각들에서 머리 태그를 기다렸다가 정해지면 본문만 흘린다.

    feed(chunk) → 지금 내보낼 본문(아직 태그 판정 중이면 "").
    lang       → 정해진 언어(판정 전이면 None). finish() 후엔 항상 값이 있다.
    ask        → lang 태그 바로 뒤 `<ask=who>` 가 있으면 "who", 아니면 None (finish() 후 확정).
    emo        → AFL-1067 머리의 `<emo=…>`(없거나 모르는 값이면 neutral). 머리가 끝나기 전엔 None.
    """

    # 태그가 이 길이 안에 안 끝나면 태그 없는 답으로 본다.
    _MAX_HEAD = 24

    def __init__(self, fallback: str | None = None) -> None:
        self._fb = normalize_lang(fallback) or DEFAULT_LANG
        self._buf = ""
        self.lang: str | None = None
        self.ask: str | None = None
        self.emo: str | None = None
        self._head = _HeadTags()
        # 머리 태그 판정이 끝났는지 — 끝나기 전엔 본문을 붙잡는다.
        self._head_done = False
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

    def _consume_head(self, final: bool) -> str:
        """버퍼 맨 앞의 머리 태그를 하나씩 뗀다. 본문이 시작되면 머리를 닫고 본문을 내보낸다."""
        h = self._head
        while True:
            n = h.take(self._buf)
            if n:
                self._buf = self._buf[n:]
                if h.seen_lang and self.lang is None:
                    self.lang = h.lang or self._fb
                if h.ask:
                    self.ask = h.ask
                continue
            head = self._buf.lstrip()
            if not head and not final:
                return ""
            # '<' 로 시작했는데 아직 '>' 가 안 왔으면 태그가 만들어지는 중 — 더 기다린다.
            if not final and head.startswith("<") and ">" not in head and len(head) < self._MAX_HEAD:
                return ""
            break
        self._head_done = True
        if self.lang is None:
            self.lang = self._fb
        self.emo = h.emo or DEFAULT_EMOTION
        rest, self._buf = self._buf, ""
        return self._body(rest)

    def feed(self, chunk: str) -> str:
        if self._head_done:
            return self._body(chunk)
        self._buf += chunk or ""
        return self._consume_head(final=False)

    def finish(self) -> str:
        """스트림 끝 — 남은 버퍼를 내보내고 언어·감정을 확정한다."""
        out = "" if self._head_done else self._consume_head(final=True)
        # 끝까지 붙잡힌 태그 앞부분 — 태그 꼴만 지우고 나머지는 본문으로 돌려준다.
        #   (`<` 하나는 그대로 · `</as`·`<lang=fr` 은 사라짐 · `<emo=sad 응.` 은 "응." 이 남는다)
        held, self._hold = self._hold, ""
        rest = _ANY_RE.sub("", held)
        if rest != "<" and _TAG_PREFIX_RE.fullmatch(rest):
            rest = ""   # 끊긴 태그 이름(`<as`·`<e`)만 남았다 — 버린다
        return out + rest


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


def emo_tag_enabled() -> bool:
    """AFL-1067: 감정 태그 지시문을 넣을지(env PRETHIRD_EMO_TAG, 기본 켬 · "0" 이면 끔).
    꺼도 파서는 그대로 — 태그가 와도 지우고 neutral 로 본다."""
    return os.environ.get("PRETHIRD_EMO_TAG", "1") != "0"


def emotion_instruction() -> str:
    """AFL-1067: 답 머리에 말투 감정 `<emo=값>` 을 붙이라는 지시. 언어 규칙 뒤에 이어 붙인다."""
    return (
        "[감정 태그]\n"
        "- 언어 태그 바로 뒤에(`<ask=who>` 를 붙일 땐 그 뒤에) 이번 답을 말할 목소리의 감정을 "
        "`<emo=값>` 으로 하나 붙여.\n"
        "- 값: neutral(평소) · calm(차분) · happy(기쁨·신남) · sad(슬픔·그리움) · angry(화남·짜증) · "
        "warm(다정·위로).\n"
        "- 대화 내용이 아니라 **네가 지금 어떤 감정으로 말하는지**로 골라. 애매하면 neutral.\n"
        "- 답 전체에 하나만, 맨 앞에만. 본문 중간이나 끝에 쓰지 말고 닫는 태그(`</emo>`)도 쓰지 마.\n"
        "- 예: `<lang=ko><emo=warm>괜찮아, 내가 있잖아.` · `<lang=ko><emo=happy>와, 진짜 잘됐다!`\n"
        "\n"
        "[감정에 맞는 말투]\n"
        "- 고른 감정이 말투에도 드러나게 해. 네 목소리와 표정도 그 감정으로 바뀐다.\n"
        "  · angry: 짧고 퉁명스럽게 끊어 말해. 첫머리에 \"어어?\", \"하…\", \"뭐?\", \"야,\" 같은 감탄사를 써도 돼. "
        "평소 존댓말을 쓰더라도 화가 났을 때만은 반말이 섞여도 돼. 욕설·비하·위협은 절대 하지 마.\n"
        "  · happy: \"와,\", \"진짜?\" 같은 들뜬 감탄사로 시작해도 되고, 말끝을 밝게.\n"
        "  · sad: 말수를 줄이고 \"…\"로 여운을 남겨.\n"
        "  · warm: 부드럽게 다독이는 말투로(\"괜찮아\", \"~지\").\n"
        "  · neutral·calm: 평소 말투 그대로.\n"
        "- 말투만 바꾸고 길이는 평소처럼 짧게(2~3문장). 이모지·특수 기호(🎉, ~ 등)는 어떤 감정에서도 쓰지 마.\n"
        "- 이 감탄사들은 '첫머리에 짧은 감탄을 붙이지 마라'는 규칙의 예외야. 다만 감정이 뚜렷할 때만, 매 답마다 쓰지는 마.\n"
        "- angry 가 아닐 때는 평소 말투(반말·존댓말)를 그대로 지켜."
    )
