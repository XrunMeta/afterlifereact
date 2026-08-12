from __future__ import annotations
import os
import json
import aiohttp
from typing import AsyncGenerator

OLLAMA_URL = os.environ.get("PRETHIRD_OLLAMA_URL", "http://127.0.0.1:11435")
MODEL = os.environ.get("PRETHIRD_OLLAMA_MODEL", "gemma3:27b")

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
    """
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
    """
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
