from __future__ import annotations
import os
import aiohttp

from clone_dialog import chat_stream          # prethird
from fifth_inproc import FifthInproc          # prethird
from knobs import DialogueKnobs, TtsKnobs, FifthKnobs

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
_GEN_KEYS = ("temperature", "top_p", "top_k", "repetition_penalty", "max_new_tokens")

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
        for k in _GEN_KEYS:                      # None 이 아닌 gen param 만 실어보냄
            v = getattr(tk, k, None)
            if v is not None:
                body[k] = v
        async with aiohttp.ClientSession() as sess:
            async with sess.post(f"{base}{_TTS_PATH}", json=body) as resp:
                resp.raise_for_status()
                return await resp.read()
    return say_fn

class KnobsFifthInproc(FifthInproc):
    """공유 프로덕션 fifth 렌더(:8810)에 per-request 파라미터를 /render body로 주입.
    fifth_render.py가 매 호출 env를 읽으므로, body에 값이 있으면 그 값(Task 8에서 스레딩),
    없으면 env 기본 → 회귀 0. render_url 기본 = 라이브 :8810(FIFTH_RENDER_URL)."""

    def __init__(self, video_path, registry, clone_id=None, render_url=None):
        super().__init__(video_path, clone_id=clone_id, render_url=render_url)
        self._registry = registry

    def _build_body(self, wav_path: str, video_path: str, *args, **kwargs) -> dict:
        # *args

