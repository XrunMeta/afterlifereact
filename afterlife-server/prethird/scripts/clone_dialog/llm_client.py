from __future__ import annotations
import os
import json
import aiohttp
from typing import AsyncGenerator

from .cfai_client import chat_stream_cf, chat_once_cf  # noqa: F401  (테스트가 monkeypatch)

OLLAMA_URL = os.environ.get("PRETHIRD_OLLAMA_URL", "http://127.0.0.1:11435")
MODEL = os.environ.get("PRETHIRD_OLLAMA_MODEL", "gemma3:27b")

# model 문자열 앞에 붙여 백엔드를 고르는 접두어. `/oth-path` 웹페이지의 model 입력칸에
# 그대로 타이핑할 수 있어 UI 수정 없이 A/B 가 된다.
#   "gemma3:27b"        → ollama (기존 경로, 회귀 0)
#   "cfai:@cf/meta/..." → Cloudflare Workers AI
#   "ollama:gemma3:27b" → env 로 전역 cfai 를 켰어도 이 호출만 ollama 강제
_PROVIDERS = ("ollama", "cfai")
_ENV_PROVIDER = "PRETHIRD_LLM_PROVIDER"


def split_provider(model: str | None) -> tuple[str, str | None]:
    """model 문자열을 (provider, 실제 모델명)으로 가른다.

    접두어가 없으면 env `PRETHIRD_LLM_PROVIDER`(기본 "ollama")를 따른다.
    모르는 접두어는 provider 로 오인하지 않고 모델명의 일부로 남긴다 — "llama3:8b"
    처럼 ':' 를 포함한 정상 모델명을 엉뚱한 백엔드로 보내면 안 되기 때문이다.
    """
    default = os.environ.get(_ENV_PROVIDER, "ollama").strip().lower()
    if default not in _PROVIDERS:
        default = "ollama"
    if not model:
        return default, None
    raw = model.strip()
    head, sep, rest = raw.partition(":")
    if sep and head.lower() in _PROVIDERS:
        return head.lower(), rest.strip() or None
    return default, raw


async def chat_stream(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    num_predict: int | None = None,
) -> AsyncGenerator[str, None]:
    """ollama /oth-path 스트림 → 토큰(content) async generator.

    환경변수:
        PRETHIRD_OLLAMA_URL  : ollama 엔드포인트 (기본 http://127.0.0.1:11435)
        PRETHIRD_OLLAMA_MODEL: 모델명 (기본 gemma3:27b)

    model/temperature 미지정 시 기본 모델·기본 옵션(운영 경로 호출과 동일).
    num_predict: ollama 응답 최대 토큰 (미지정 시 서버 기본). JSON 완성 필요 시 명시.

    model 에 "cfai:" 접두어를 붙이면 Cloudflare Workers AI 로 나간다(cfai_client).
    접두어가 없으면 아래 ollama 경로 그대로 — 회귀 0.
    """
    provider, real_model = split_provider(model)
    if provider == "cfai":
        # num_predict(ollama 어휘) → max_tokens(OpenAI 어휘)
        async for tok in chat_stream_cf(messages, model=real_model,
                                        temperature=temperature, max_tokens=num_predict):
            yield tok
        return

    payload: dict = {"model": real_model or MODEL, "messages": messages, "stream": True}
    opts: dict = {}
    if temperature is not None:
        opts["temperature"] = temperature
    if num_predict is not None:
        opts["num_predict"] = num_predict
    if opts:
        payload["options"] = opts
    async with aiohttp.ClientSession() as sess:
        async with sess.post(f"{OLLAMA_URL}/oth-path", json=payload) as resp:
            resp.raise_for_status()
            async for raw in resp.content:
                line = raw.strip()
                if not line:
                    continue
                obj = json.loads(line)
                tok = obj.get("message", {}).get("content", "")
                if tok:
                    yield tok
                if obj.get("done"):
                    break


async def chat_once(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    fmt: str | None = None,
    num_predict: int | None = None,
) -> str:
    """ollama /oth-path 비스트리밍 — 전체 응답 content 문자열 반환.

    fmt="json" 이면 ollama format 강제(JSON만 출력 유도). 추출 등 1회 완성 용도.
    num_predict: ollama 응답 최대 토큰. 기본값이 작아서 JSON 이 잘려나오는 문제
    (interpret 엔드포인트 등) 회피용. 명시적으로 넘겨야 안전.

    "cfai:" 접두어면 Cloudflare Workers AI 로 나간다. ⚠ fmt="json" 의 지원 여부는
    CF 모델마다 다르므로, JSON 강제에 의존하는 호출부를 옮기기 전에 실측할 것.
    """
    provider, real_model = split_provider(model)
    if provider == "cfai":
        return await chat_once_cf(messages, model=real_model, temperature=temperature,
                                  fmt=fmt, max_tokens=num_predict)

    payload: dict = {"model": real_model or MODEL, "messages": messages, "stream": False}
    opts: dict = {}
    if temperature is not None:
        opts["temperature"] = temperature
    if num_predict is not None:
        opts["num_predict"] = num_predict
    if opts:
        payload["options"] = opts
    if fmt:
        payload["format"] = fmt
    async with aiohttp.ClientSession() as sess:
        async with sess.post(f"{OLLAMA_URL}/oth-path", json=payload) as resp:
            resp.raise_for_status()
            obj = await resp.json()
            return obj.get("message", {}).get("content", "")
