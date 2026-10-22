from __future__ import annotations
import asyncio
import os
import json
import logging
import aiohttp
from typing import AsyncGenerator

from .cfai_client import chat_stream_cf, chat_once_cf  # noqa: F401  (테스트가 monkeypatch)
from .openai_client import chat_stream_openai, chat_once_openai  # noqa: F401  (동일)

log = logging.getLogger("clone_dialog.llm")

OLLAMA_URL = os.environ.get("PRETHIRD_OLLAMA_URL", "http://127.0.0.1:11435")
MODEL = os.environ.get("PRETHIRD_OLLAMA_MODEL", "gemma3:27b")

# model 문자열 앞에 붙여 백엔드를 고르는 접두어. `/oth-path` 웹페이지의 model 입력칸에
# 그대로 타이핑할 수 있어 UI 수정 없이 A/B 가 된다.
#   "gemma3:27b"        → ollama (기존 경로, 회귀 0)
#   "cfai:@cf/meta/..." → Cloudflare Workers AI
#   "openai:gpt-4.1-mini" → OpenAI (AFL-926 · 실패 시 gpt-5-mini 1회 폴백)
#   "ollama:gemma3:27b" → env 로 전역 cfai/openai 를 켰어도 이 호출만 ollama 강제
_PROVIDERS = ("ollama", "cfai", "openai")
_ENV_PROVIDER = "PRETHIRD_LLM_PROVIDER"

# AFL-926 폴백. 원격 provider(openai·cfai)가 **첫 토큰 전에** 실패·지연되면 1회 다시 부른다.
# 토큰이 이미 나간 뒤에는 넘어가지 않는다(한 문장이 두 모델로 섞임).
# AFL-1031 (2026-10-22 sungjius): 폴백 대상은 ollama 가 아니라 OpenAI gpt-5-mini. ollama 로는 폴백하지 않는다.
#   PRETHIRD_LLM_FALLBACK              : "none" 이면 폴백 끔. 그 밖의 값(예전 "ollama" 포함)은 gpt-5-mini 폴백
#   PRETHIRD_LLM_FALLBACK_MODEL        : 폴백 OpenAI 모델(기본 gpt-5-mini)
#   PRETHIRD_LLM_FIRST_TOKEN_TIMEOUT_S : 스트림 첫 토큰 대기 상한(기본 6초)
#   PRETHIRD_LLM_ONCE_TIMEOUT_S        : chat_once 전체 상한(기본 30초)
_REMOTE_STREAM = {"cfai": "chat_stream_cf", "openai": "chat_stream_openai"}
_REMOTE_ONCE = {"cfai": "chat_once_cf", "openai": "chat_once_openai"}


def _env_float(name: str, default: float) -> float:
    try:
        v = float(os.environ.get(name, ""))
        return v if v > 0 else default
    except ValueError:
        return default


def _fallback_model(provider: str, failed_model: str | None) -> str | None:
    """폴백할 OpenAI 모델. 끔이거나 방금 실패한 게 바로 그 모델이면 None(같은 호출 반복 안 함)."""
    if os.environ.get("PRETHIRD_LLM_FALLBACK", "").strip().lower() == "none":
        return None
    fb = (os.environ.get("PRETHIRD_LLM_FALLBACK_MODEL") or "gpt-5-mini").strip()
    if provider == "openai":
        from .openai_client import _DEFAULT_MODEL as _oai_default
        tried = failed_model or os.environ.get("OPENAI_MODEL") or _oai_default
        if tried == fb:
            return None
    return fb


def default_model_label() -> str:
    """서버 기본 백엔드·모델 표기("openai:gpt-…" / "ollama:gemma3:27b"). 랩 화면·디버그용."""
    provider, _ = split_provider(None)
    if provider == "openai":
        from .openai_client import _DEFAULT_MODEL as _oai_default
        return f"openai:{os.environ.get('OPENAI_MODEL') or _oai_default}"
    if provider == "cfai":
        return f"cfai:{os.environ.get('CF_AI_MODEL') or '?'}"
    return f"ollama:{MODEL}"


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

    model 에 "cfai:"/"openai:" 접두어를 붙이거나 env PRETHIRD_LLM_PROVIDER 로 기본을
    바꾸면 원격으로 나간다. 원격이 첫 토큰 전에 죽으면 gpt-5-mini 로 1회 폴백(위 주석).
    접두어·env 가 없으면 ollama 경로 그대로 — 회귀 0.
    """
    provider, real_model = split_provider(model)
    if provider in _REMOTE_STREAM:
        # num_predict(ollama 어휘) → max_tokens(OpenAI 어휘). 함수는 모듈 전역에서 꺼낸다
        # — 테스트가 monkeypatch 로 갈아끼운다.
        remote = globals()[_REMOTE_STREAM[provider]](
            messages, model=real_model, temperature=temperature, max_tokens=num_predict)
        sent = False
        fb = _fallback_model(provider, real_model)
        try:
            first = await asyncio.wait_for(
                remote.__anext__(), _env_float("PRETHIRD_LLM_FIRST_TOKEN_TIMEOUT_S", 6.0))
            sent = True
            yield first
            async for tok in remote:
                yield tok
            return
        except StopAsyncIteration:
            # (el) 토큰 0개로 끝난 원격 응답도 "첫 토큰 전 실패" 로 본다 — 무음 턴 방지.
            if not fb:
                return
            log.error("llm: %s 빈 응답 → %s 폴백", provider, fb)
        except Exception as e:  # noqa: BLE001
            if sent or not fb:
                raise
            log.error("llm: %s 실패(첫 토큰 전) → %s 폴백: %s: %s",
                      provider, fb, type(e).__name__, e)
        finally:
            await remote.aclose()
        async for tok in chat_stream_openai_fallback(messages, fb, temperature, num_predict):
            yield tok
        return

    async for tok in _ollama_stream(messages, model=real_model, temperature=temperature,
                                    num_predict=num_predict):
        yield tok


async def chat_stream_openai_fallback(
    messages: list[dict], model: str, temperature: float | None, num_predict: int | None,
) -> AsyncGenerator[str, None]:
    """폴백 스트림 — OpenAI 를 지정 모델로 1회. 함수는 모듈 전역에서 꺼낸다(테스트 monkeypatch)."""
    remote = globals()["chat_stream_openai"](
        messages, model=model, temperature=temperature, max_tokens=num_predict)
    try:
        async for tok in remote:
            yield tok
    finally:
        await remote.aclose()


async def _ollama_stream(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    num_predict: int | None = None,
) -> AsyncGenerator[str, None]:
    """ollama /oth-path 스트림 (기존 경로 그대로)."""
    payload: dict = {"model": model or MODEL, "messages": messages, "stream": True}
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
    if provider in _REMOTE_ONCE:
        try:
            return await asyncio.wait_for(
                globals()[_REMOTE_ONCE[provider]](
                    messages, model=real_model, temperature=temperature,
                    fmt=fmt, max_tokens=num_predict),
                _env_float("PRETHIRD_LLM_ONCE_TIMEOUT_S", 30.0))
        except Exception as e:  # noqa: BLE001
            fb = _fallback_model(provider, real_model)
            if not fb:
                raise
            log.error("llm: %s once 실패 → %s 폴백: %s: %s",
                      provider, fb, type(e).__name__, e)
        return await asyncio.wait_for(
            globals()["chat_once_openai"](
                messages, model=fb, temperature=temperature, fmt=fmt, max_tokens=num_predict),
            _env_float("PRETHIRD_LLM_ONCE_TIMEOUT_S", 30.0))

    return await _ollama_once(messages, model=real_model, temperature=temperature,
                              fmt=fmt, num_predict=num_predict)


async def _ollama_once(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    fmt: str | None = None,
    num_predict: int | None = None,
) -> str:
    """ollama /oth-path 비스트리밍 (기존 경로 그대로)."""
    payload: dict = {"model": model or MODEL, "messages": messages, "stream": False}
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
