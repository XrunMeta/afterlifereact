"""clone_dialog — 클론 대화 LLM 공통 모듈.

prethird 운영 pipeline과 /oth-path 검증 엔드포인트가 공유한다.
미래에 second/third 등 새 영상생성 백엔드가 생기면 이 패키지를 재사용한다.

re-export:
    fetch_bundle(api_base, clone_id, access_token) -> dict | None
    bundle_to_messages(bundle) -> list[dict]
    chat_stream(messages, model=None, temperature=None) -> AsyncGenerator[str, None]
"""
from __future__ import annotations

from .bundle_client import fetch_bundle
from .persona_prompt import bundle_to_messages
from .llm_client import chat_stream

__all__ = ["fetch_bundle", "bundle_to_messages", "chat_stream"]
