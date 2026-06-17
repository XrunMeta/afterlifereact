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
) -> AsyncGenerator[str, None]:
    """ollama /oth-path 스트림 → 토큰(content) async generator.

    환경변수:
        PRETHIRD_OLLAMA_URL  : ollama 엔드포인트 (기본 http://127.0.0.1:11435)
        PRETHIRD_OLLAMA_MODEL: 모델명 (기본 gemma3:27b)

    model/temperature 미지정 시 기본 모델·기본 옵션(운영 경로 호출과 동일).
    """
    payload: dict = {"model": model or MODEL, "messages": messages, "stream": True}
    if temperature is not None:
        payload["options"] = {"temperature": temperature}
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
) -> str:
    """ollama /oth-path 비스트리밍 — 전체 응답 content 문자열 반환.

    fmt="json" 이면 ollama format 강제(JSON만 출력 유도). 추출 등 1회 완성 용도.
    """
    payload: dict = {"model": model or MODEL, "messages": messages, "stream": False}
    if temperature is not None:
        payload["options"] = {"temperature": temperature}
    if fmt:
        payload["format"] = fmt
    async with aiohttp.ClientSession() as sess:
        async with sess.post(f"{OLLAMA_URL}/oth-path", json=payload) as resp:
            resp.raise_for_status()
            obj = await resp.json()
            return obj.get("message", {}).get("content", "")
