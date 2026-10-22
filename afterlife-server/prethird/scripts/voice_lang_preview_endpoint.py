"""AFL-1034 언어별 목소리 테스트 — POST /oth-path (앱 설정 › 목소리 테스트).

통화 로직·기존 TTS 서비스는 건드리지 않는다. 이 경로는 문장 하나를 클론 목소리로 합성해 wav 로 돌려줄 뿐이다.
- 언어 → 엔진: es = CosyVoice3(PRETHIRD_VOICE_TEST_URL_ES, 기본 :8205) · 그 밖 = 지금 통화 TTS(PRETHIRD_TTS_URL).
- 인증: 사용자 토큰으로 /oth-path 을 받아 본다(통화 시작과 같은 접근 검사).
- 문장을 비우면 언어별 예시 문장.
"""
from __future__ import annotations

import logging
import os

import aiohttp
from aiohttp import web

from clone_dialog.bundle_client import fetch_bundle

log = logging.getLogger("prethird.voice_lang_preview")

SAMPLES = {
    "ko": "안녕! 오늘 하루는 어땠어? 보고 싶었어.",
    "en": "Hi! How was your day? I missed you.",
    "ja": "こんにちは！今日はどうだった？会いたかったよ。",
    "zh": "你好！今天过得怎么样？我好想你。",
    "es": "¡Hola! ¿Qué tal tu día? Te extrañé mucho.",
}
_MAX_TEXT = 200

def _tts_url(lang: str) -> str:
    if lang == "es":
        return os.environ.get("PRETHIRD_VOICE_TEST_URL_ES", "http://127.0.0.1:8205")
    return os.environ.get("PRETHIRD_TTS_URL", "http://127.0.0.1:8203")

async def voice_lang_preview(req: web.Request) -> web.Response:
    auth = req.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    if not token:
        return web.json_response({"error": "unauthorized"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "bad_json"}, status=400)
    clone_id = body.get("clone_id") if isinstance(body, dict) else None
    lang = body.get("lang") if isinstance(body, dict) else None
    if (not isinstance(clone_id, int) or isinstance(clone_id, bool) or clone_id <= 0
            or lang not in SAMPLES):
        return web.json_response({"error": "bad_input"}, status=400)
    text = body.get("text")
    text = text.strip() if isinstance(text, str) else ""
    if not text:
        text = SAMPLES[lang]
    if len(text) > _MAX_TEXT:
        return web.json_response({"error": "text_too_long"}, status=400)

    # 접근 검사 — 이 사용자가 통화할 수 있는 클론인지(번들이 안 오면 거절).
    bundle = await fetch_bundle(os.environ.get("PRETHIRD_API_BASE"), clone_id, token)
    if not bundle:
        return web.json_response({"error": "clone_unavailable"}, status=404)

    url = f"{_tts_url(lang)}/tts/kr"
    try:
        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.post(url, json={"text": text, "clone_id": str(clone_id), "lang": lang}) as r:
                if r.status != 200:
                    detail = (await r.text())[:200]
                    log.warning("voice preview clone=%s lang=%s tts=%s %s", clone_id, lang, r.status, detail)
                    return web.json_response({"error": "tts_failed", "status": r.status}, status=502)
                wav = await r.read()
                engine = r.headers.get("X-Engine", "")
    except Exception as e:  # noqa: BLE001
        log.warning("voice preview clone=%s lang=%s 실패: %s", clone_id, lang, e)
        return web.json_response({"error": "tts_unreachable"}, status=502)
    log.info("voice preview clone=%s lang=%s engine=%s bytes=%d", clone_id, lang, engine, len(wav))
    return web.Response(body=wav, content_type="audio/wav", headers={"X-Engine": engine, "X-Lang": lang})

def register_voice_lang_preview_routes(app: web.Application) -> None:
    app.router.add_post("/voice/lang-preview", voice_lang_preview)
