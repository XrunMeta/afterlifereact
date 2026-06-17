from __future__ import annotations
import os, aiohttp

TTS_URL = os.environ.get("PRETHIRD_TTS_URL", "http://127.0.0.1:8200")
TTS_PATH = os.environ.get("PRETHIRD_TTS_PATH", "/tts/kr")
DEFAULT_SE_PATH = os.environ.get("PRETHIRD_TTS_SE_PATH", "")

async def say(text: str, se_path: str | None = None) -> bytes:
    """text → TTS wav bytes. MeloTTS(KR) base → OpenVoice ToneColorConverter(se_path).
    testbed/lib/tts.js 와 동일 계약(/tts/kr, speed/sdp_ratio/noise_scale/noise_scale_w)."""
    body = {
        "text": text,
        "speed": float(os.environ.get("PRETHIRD_TTS_SPEED", "1.0")),
        "sdp_ratio": 0.5,
        "noise_scale": 0.6,
        "noise_scale_w": 1.0,
    }
    se = se_path or DEFAULT_SE_PATH
    if se:
        body["se_path"] = se
    async with aiohttp.ClientSession() as sess:
        async with sess.post(f"{TTS_URL}{TTS_PATH}", json=body) as resp:
            resp.raise_for_status()
            return await resp.read()
