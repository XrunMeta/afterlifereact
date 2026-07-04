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

_ENGINE_URLS = {"openvoice": "http://127.0.0.1:8200", "qwen": "http://127.0.0.1:8201"}
_TTS_PATH = os.environ.get("PRETHIRD_TTS_PATH", "/tts/kr")

def build_say_fn(registry):
    """registry.tts에서 engine URL·speed·denoise를 읽어 TTS POST."""
    async def say_fn(text: str, se_path=None) -> bytes:
        tk: TtsKnobs = registry.get().tts
        base = tk.url or _ENGINE_URLS.get(tk.engine, _ENGINE_URLS["openvoice"])
        body = {
            "text": text, "speed": float(tk.speed),
            "sdp_ratio": 0.5, "noise_scale": 0.6, "noise_scale_w": 1.0,
        }
        if se_path:
            body["se_path"] = se_path
        if tk.denoise:
            body["denoise"] = True
        async with aiohttp.ClientSession() as sess:
            async with sess.post(f"{base}{_TTS_PATH}", json=body) as resp:
                resp.raise_for_status()
                return await resp.read()
    return say_fn
