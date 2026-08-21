"""T-545: viseme_playback 파이프라인용 서버 endpoint.

POST /oth-path
Body: {"text": str, "se_key"?: str, "voice_se_url"?: str, "clone_id"?: int}
Response: {
    "audio_wav_b64": str,        # base64 WAV bytes (기존 TTS)
    "duration_ms": int,           # 오디오 총 길이
    "visemes": [                  # timeline sync 용 viseme 시퀀스
        {"v": "A", "dur_ms": 200}, ...
    ],
    "viseme_prefix": str | null   # clone 의 viseme R2 prefix (클라가 클립 다운로드)
}

인증: LEARN_SECRET (기존 tts_admin_endpoint 와 동일).
"""
from __future__ import annotations
import os, io, wave, base64, logging
from aiohttp import web
from viseme.korean_viseme import text_to_visemes

log = logging.getLogger("prethird.viseme")

REF_VOICES_ROOT = os.environ.get(
    "PRETHIRD_REF_VOICES_ROOT",
    "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices",
)
LEARN_SECRET = os.environ.get("LEARN_SECRET", "") or os.environ.get("PRETHIRD_LEARN_SECRET", "")


def _wav_duration_ms(wav_bytes: bytes) -> int:
    try:
        with wave.open(io.BytesIO(wav_bytes), "rb") as w:
            frames = w.getnframes()
            rate = w.getframerate() or 24000
            return int(frames * 1000 / rate)
    except Exception:
        return 0


async def viseme_synth(req: web.Request) -> web.Response:
    secret = req.headers.get("X-Admin-Secret", "")
    if not LEARN_SECRET or secret != LEARN_SECRET:
        return web.json_response({"error": "unauthorized"}, status=401)
    try:
        body = await req.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
    text = (body.get("text") or "").strip()
    se_key = body.get("se_key")
    if not text:
        return web.json_response({"error": "text required"}, status=400)
    if len(text) > 500:
        return web.json_response({"error": "text too long"}, status=400)

    # 1) TTS 오디오 생성 — 기존 tts_client 재사용
    se_path = None
    if se_key:
        candidate = os.path.join(REF_VOICES_ROOT, se_key, "se.pth")
        if os.path.isfile(candidate):
            se_path = candidate
    try:
        from tts_client import say
        wav_bytes = await say(text, se_path=se_path)
    except Exception as e:
        log.warning("viseme_synth TTS failed: %s", e)
        return web.json_response({"error": f"tts: {e}"}, status=502)

    dur_ms = _wav_duration_ms(wav_bytes)
    # 2) 텍스트 → viseme 시퀀스 (오디오 길이에 맞춰 dur 분배)
    visemes = text_to_visemes(text, total_ms=dur_ms if dur_ms > 0 else None)

    return web.json_response({
        "audio_wav_b64": base64.b64encode(wav_bytes).decode("ascii"),
        "duration_ms": dur_ms,
        "visemes": visemes,
    })


def register_viseme_routes(app: web.Application) -> None:
    app.router.add_post("/oth-path", viseme_synth)
    log.info("viseme_synth endpoint registered: POST /oth-path (T-545)")
