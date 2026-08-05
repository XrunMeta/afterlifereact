"""prebuild — 신규 클론 음성 선빌드 핸들러.
POST /oth-path {cloneId, voiceRawUrl} → 202 즉시 응답 후 백그라운드로
ensure_voice_wav(voice.wav) + STT 전사(ref_text.txt). 모든 실패 graceful.

인증: Authorization: Bearer == PREBUILD_SECRET(env). /prethird/ 외부 노출이라 필수.
"""
from __future__ import annotations
import os
import re
import asyncio
import hmac
import logging
from aiohttp import web

from voice_fetch import ensure_voice_wav
from stt_client import transcribe_clone
import ref_quality

log = logging.getLogger("prethird.prebuild")

REF_VOICES_ROOT = os.environ.get(
    "PRETHIRD_REF_VOICES_ROOT",
    "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices",
)
STT_URL = os.environ.get("PRETHIRD_STT_URL", "http://127.0.0.1:8202")

_CLONE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")

_MAX_CONCURRENCY = int(os.environ.get("PREBUILD_MAX_CONCURRENCY", "3"))
_sem = asyncio.Semaphore(_MAX_CONCURRENCY)

_bg_tasks: set[asyncio.Task] = set()

def _authorized(request: web.Request) -> bool:
    secret = os.environ.get("PREBUILD_SECRET", "")
    if not secret:
        return False
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return False
    token = header[len("Bearer "):]
    return hmac.compare_digest(token, secret)

async def _run_prebuild(clone_id: str, voice_raw_url: str) -> None:
    async with _sem:
        try:
            await ensure_voice_wav(clone_id, voice_raw_url, REF_VOICES_ROOT)
        except Exception as e:
            log.warning("prebuild ensure_voice_wav failed clone=%s: %s", clone_id, e)
            return
        ok = await transcribe_clone(clone_id, stt_url=STT_URL)
        log.info("prebuild done clone=%s stt_ok=%s", clone_id, ok)
        _log_ref_quality(clone_id)

def _log_ref_quality(clone_id: str) -> None:
    """STT 결과로 ref 음성 품질을 판정해 로그·리포트로 남긴다(경고 전용).

    노이즈 ref 는 STT 가 글자를 거의 못 뽑는데도 stt_ok=True 로 통과해 왔다(클론 9104).
    판정 자체가 등록을 막지는 않는다 — 지금 필요한 건 차단이 아니라 탐지다.
    어떤 예외도 삼킨다: 부가 판정이 선빌드 완료를 되돌리면 안 된다.
    """
    try:
        r = ref_quality.check(REF_VOICES_ROOT, clone_id)
    except Exception as e:
        log.warning("ref quality 판정 실패 clone=%s: %s", clone_id, e)
        return
    if r.get("ok") is False:
        log.warning(
            "⚠️ ref 음성 품질 미달 clone=%s density=%s(<%s) — %s",
            clone_id, r.get("density"), r.get("threshold"), r.get("reason"),
        )
    elif r.get("ok") is None:
        log.info("ref quality 판정 불가 clone=%s: %s", clone_id, r.get("reason"))
    else:
        log.info("ref quality ok clone=%s density=%s", clone_id, r.get("density"))

async def prebuild_handler(request: web.Request) -> web.Response:
    if not _authorized(request):
        return web.json_response({"error": "unauthorized"}, status=401)
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
    clone_id = body.get("cloneId")
    voice_raw_url = body.get("voiceRawUrl")
    if not clone_id or not voice_raw_url:
        return web.json_response({"error": "cloneId and voiceRawUrl required"}, status=400)
    if not _CLONE_ID_RE.match(str(clone_id)):
        return web.json_response({"error": "invalid cloneId"}, status=400)

    task = asyncio.ensure_future(_run_prebuild(str(clone_id), str(voice_raw_url)))
    _bg_tasks.add(task)
    task.add_done_callback(_bg_tasks.discard)
    return web.json_response({"accepted": True}, status=202)

async def _drain_tasks_for_test() -> None:
    """테스트 전용: 진행 중 백그라운드 task 완료 대기."""
    if _bg_tasks:
        await asyncio.gather(*list(_bg_tasks), return_exceptions=True)
