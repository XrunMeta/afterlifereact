from __future__ import annotations
import json
import logging
import os
from typing import AsyncGenerator

import aiohttp

log = logging.getLogger("clone_dialog.cfai")

# Workers AI 의 OpenAI 호환 엔드포인트. `/chat/completions` 를 뒤에 붙여 쓴다.
# AI Gateway 를 앞에 두려면 CF_AI_BASE_URL 로 base 만 갈아끼우면 된다
# (예: https:
_DEFAULT_BASE = "https://oth-path.cloudflare.com/client/v4/accounts/{account_id}/ai/v1"

class CfAiConfigError(RuntimeError):
    """CF 자격증명·모델 설정 누락. 조용히 폴백하지 않고 명시적으로 터뜨린다.

    통화 중 LLM 이 조용히 빈 응답을 내면 "클론이 무응답"으로 보여 원인 추적에
    시간이 오래 걸린다(2026-08 실사고 다수). 설정 문제는 즉시 이름을 대고 죽는다.
    """

def _base_url() -> str:
    override = os.environ.get("CF_AI_BASE_URL")
    if override:
        return override.rstrip("/")
    account_id = os.environ.get("CF_ACCOUNT_ID")
    if not account_id:
        raise CfAiConfigError(
            "CF_ACCOUNT_ID 가 설정되지 않았다 (또는 CF_AI_BASE_URL 로 전체 base 지정)")
    return _DEFAULT_BASE.format(account_id=account_id)

def _headers() -> dict:
    token = os.environ.get("CF_AI_TOKEN")
    if not token:
        raise CfAiConfigError("CF_AI_TOKEN 이 설정되지 않았다 (Workers AI 권한 API 토큰)")
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def _resolve_model(model: str | None) -> str:
    resolved = model or os.environ.get("CF_AI_MODEL")
    if not resolved:
        raise CfAiConfigError(
            "CF_AI_MODEL 이 설정되지 않았다 (예: @cf/meta/llama-3.3-70b-instruct-fp8-fast)")
    return resolved

def _payload(messages, model, temperature, max_tokens, *, stream: bool) -> dict:
    """공통 payload. 미지정 파라미터는 키 자체를 싣지 않아 모델 기본값 경로를 탄다."""
    body: dict = {
        "model": _resolve_model(model),
        "messages": messages,
        "stream": stream,
    }
    if temperature is not None:
        body["temperature"] = temperature
    if max_tokens is not None:
        body["max_tokens"] = max_tokens
    return body

def _delta_token(line: bytes) -> str | None:
    """SSE 한 줄 → 토큰 문자열. 토큰이 아니면 None, 스트림 종료면 빈 문자열."""
    s = line.strip()
    if not s or s.startswith(b":") or not s.startswith(b"data:"):
        return None                       # 빈 줄·주석·event 라인
    data = s[len(b"data:"):].strip()
    if data == b"[DONE]":
        return ""                         # 종료 신호
    try:
        obj = json.loads(data)
    except (ValueError, UnicodeDecodeError):
        # 깨진 줄 하나로 통화 전체를 죽이지 않는다 — 그 줄만 버리고 계속.
        log.warning("cfai: SSE 파싱 실패, 해당 줄 skip: %r", data[:120])
        return None
    choices = obj.get("choices") or [{}]
    content = choices[0].get("delta", {}).get("content")
    if content is None or content == "":
        return None
    # 일부 모델(@cf/meta/llama-4-scout-…)이 content 를 숫자로 실어 보낸다 —
    # 실호출로만 드러나는 동작이라 여기서 정규화한다. 상위는 "".join() 을 하므로
    # str 이 아닌 값이 새면 통화 도중 TypeError 로 죽는다.
    return content if isinstance(content, str) else str(content)

async def chat_stream_cf(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> AsyncGenerator[str, None]:
    """Cloudflare Workers AI 스트리밍 → 토큰 async generator.

    환경변수:
        CF_ACCOUNT_ID : Cloudflare 계정 ID
        CF_AI_TOKEN   : Workers AI 권한 API 토큰
        CF_AI_MODEL   : 기본 모델(@cf/... ) — model 인자로 덮어쓸 수 있다
        CF_AI_BASE_URL: (선택) AI Gateway 등 base 전체 교체
    """
    url = f"{_base_url()}/chat/completions"
    headers = _headers()
    body = _payload(messages, model, temperature, max_tokens, stream=True)
    async with aiohttp.ClientSession() as sess:
        async with sess.post(url, json=body, headers=headers) as resp:
            resp.raise_for_status()
            async for raw in resp.content:
                tok = _delta_token(raw)
                if tok is None:
                    continue
                if tok == "":
                    break
                yield tok

async def chat_once_cf(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    fmt: str | None = None,
    max_tokens: int | None = None,
) -> str:
    """비스트리밍 1회 호출 — 전체 응답 문자열.

    fmt="json" 은 ollama 의 `format:"json"` 에 대응한다. CF 는 OpenAI 어휘를 쓰므로
    `response_format:{"type":"json_object"}` 로 옮긴다.
    ⚠ 이 옵션의 지원 여부는 모델마다 다르다 — JSON 강제에 의존하는 경로
    (l2_extract·name_extract·knowledge interpret)를 CF 로 옮기기 전에 반드시 실측할 것.
    """
    url = f"{_base_url()}/chat/completions"
    headers = _headers()
    body = _payload(messages, model, temperature, max_tokens, stream=False)
    if fmt == "json":
        body["response_format"] = {"type": "json_object"}
    async with aiohttp.ClientSession() as sess:
        async with sess.post(url, json=body, headers=headers) as resp:
            resp.raise_for_status()
            obj = await resp.json()
    choices = obj.get("choices") or []
    if not choices:
        # 형태가 예상과 다르면 KeyError 대신 빈 문자열 — 상위 호출자가 이미
        # 빈 응답을 다루고 있다. 대신 원문을 로그로 남겨 추적 가능하게 한다.
        log.warning("cfai: choices 없음 — 응답 형태 확인 필요: %r", str(obj)[:200])
        return ""
    content = choices[0].get("message", {}).get("content", "")
    # 스트림과 같은 이유로 str 정규화 — 호출부는 문자열을 기대한다.
    return content if isinstance(content, str) else str(content)
