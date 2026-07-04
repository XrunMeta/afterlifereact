from __future__ import annotations
import os
import aiohttp

from clone_dialog import chat_stream          # prethird
from knobs import DialogueKnobs, TtsKnobs


def build_chat_fn(registry):
    """registry에서 model/temperature를 매 호출 읽어 chat_stream에 위임."""
    async def chat_fn(messages):
        dk = registry.get().dialogue
        async for tok in chat_stream(messages, model=dk.model, temperature=dk.temperature):
            yield tok
    return chat_fn


def apply_persona_knobs(base_persona: list, dk: DialogueKnobs) -> list:
    """system_override 지정 시 맨 앞에 system 메시지 삽입. 없으면 base 그대로."""
    if dk.system_override:
        return [{"role": "system", "content": dk.system_override}] + list(base_persona)
    return base_persona
