from __future__ import annotations
import logging
import os
import re
from typing import AsyncGenerator

import aiohttp

from .cfai_client import _delta_token  # 같은 OpenAI SSE 형식 — 파서 재사용

log = logging.getLogger("clone_dialog.openai")

# AFL-926: 통화 LLM 을 OpenAI GPT 로 이사. 대화 맥락은 OpenAI 서버 세션
# (previous_response_id·Conversations)에 맡기지 않는다 — 매 요청을 상태 없이 보내고
# 맥락은 우리가 call_turns 에서 조립한다(화자 전환 시 페르소나 교체·폴백·백엔드 교체 때문).
_DEFAULT_BASE = "https://oth-path.openai.com/v1"
_DEFAULT_MODEL = "gpt-4.1-mini"

# 추론(reasoning) 모델은 temperature≠1 을 400 으로 거절한다. "-chat" 계열은 비추론.
_REASONING_RE = re.compile(r"^(o\d|gpt-5|gpt-6)", re.IGNORECASE)


class OpenAiConfigError(RuntimeError):
    """OPENAI_API_KEY 누락 등 설정 문제. 조용히 빈 응답을 내지 않고 이름을 대고 죽는다
    (상위 llm_client 가 로그를 남기고 ollama 로 1회 폴백한다)."""


def _base_url() -> str:
    return (os.environ.get("OPENAI_BASE_URL") or _DEFAULT_BASE).rstrip("/")


def _headers() -> dict:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise OpenAiConfigError("OPENAI_API_KEY 가 설정되지 않았다")
    # UA 명시 — 파이썬 기본 UA 가 CF WAF(1010)에 걸린 전례가 있다(2026-09-08 cfai).
    return {"Authorization": f"Bearer {key}", "Content-Type": "application/json",
            "User-Agent": "afterlife-prethird/1.0"}


def _is_reasoning(model: str) -> bool:
    return bool(_REASONING_RE.match(model)) and "-chat" not in model


def _payload(messages, model, temperature, max_tokens, *, stream: bool) -> dict:
    """미지정 파라미터는 키 자체를 싣지 않아 모델 기본값 경로를 탄다."""
    resolved = model or os.environ.get("OPENAI_MODEL") or _DEFAULT_MODEL
    body: dict = {"model": resolved, "messages": messages, "stream": stream}
    if _is_reasoning(resolved):
        effort = os.environ.get("OPENAI_REASONING_EFFORT")
        if effort:
            body["reasoning_effort"] = effort
    elif temperature is not None:
        body["temperature"] = temperature
    if max_tokens is not None:
        # max_tokens 는 구형 어휘(추론 모델은 거절). 전 모델 공통은 max_completion_tokens.
        body["max_completion_tokens"] = max_tokens
    return body


async def chat_stream_openai(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> AsyncGenerator[str, None]:
    """OpenAI Chat Completions 스트리밍 → 토큰 async generator.

    환경변수:
        OPENAI_API_KEY          : API 키 (필수)
        OPENAI_MODEL            : 기본 모델 (기본 gpt-4.1-mini) — model 인자로 덮어씀
        OPENAI_BASE_URL         : (선택) 프록시·게이트웨이로 base 교체
        OPENAI_REASONING_EFFORT : (선택) 추론 모델일 때만 싣는다 (예: minimal)
    """
    url = f"{_base_url()}/chat/completions"
    headers = _headers()
    body = _payload(messages, model, temperature, max_tokens, stream=True)
    async with aiohttp.ClientSession() as sess:
        async with sess.post(url, json=body, headers=headers) as resp:
            if resp.status >= 400:
                detail = (await resp.text())[:300]
                raise RuntimeError(f"openai http {resp.status}: {detail}")
            async for raw in resp.content:
                tok = _delta_token(raw)
                if tok is None:
                    continue
                if tok == "":
                    break
                yield tok


async def chat_once_openai(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    fmt: str | None = None,
    max_tokens: int | None = None,
) -> str:
    """비스트리밍 1회 호출. fmt="json" → response_format json_object.

    ⚠ json_object 모드는 messages 어딘가에 "JSON" 단어가 있어야 한다(OpenAI 규칙).
    기존 JSON 호출부 프롬프트는 전부 JSON 출력을 지시하고 있어 그대로 통과한다.
    """
    url = f"{_base_url()}/chat/completions"
    headers = _headers()
    body = _payload(messages, model, temperature, max_tokens, stream=False)
    if fmt == "json":
        body["response_format"] = {"type": "json_object"}
    async with aiohttp.ClientSession() as sess:
        async with sess.post(url, json=body, headers=headers) as resp:
            if resp.status >= 400:
                detail = (await resp.text())[:300]
                raise RuntimeError(f"openai http {resp.status}: {detail}")
            obj = await resp.json()
    choices = obj.get("choices") or []
    if not choices:
        log.warning("openai: choices 없음 — 응답 형태 확인 필요: %r", str(obj)[:200])
        return ""
    content = choices[0].get("message", {}).get("content") or ""
    return content if isinstance(content, str) else str(content)
