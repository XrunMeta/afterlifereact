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
import sys
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

# AFL-1017: CosyVoice ICL 견본쌍(voice_prompt.wav + ref_prompt.txt) 생성기.
# voice_lab.py(DEFAULT_MAKE_PROMPT_REF) 와 같은 라이브 스크립트를 그대로 부른다.
MAKE_PROMPT_REF = os.environ.get(
    "PRETHIRD_MAKE_PROMPT_REF",
    "/home/afterlife/afterlife-server/cosyvoice/scripts/make_prompt_ref.py",
)
# cosyvoice 서비스(afterlife-cosyvoice.service)가 쓰는 conda env python.
COSYVOICE_PYTHON = os.environ.get(
    "COSYVOICE_PYTHON",
    "/home/afterlife/miniconda3/envs/cosyvoice-poc/bin/python",
)
PROMPT_PAIR_TIMEOUT = float(os.environ.get("PREBUILD_PROMPT_PAIR_TIMEOUT", "180"))

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
        # 의도: 견본쌍 생성은 _sem 안에 둔다 — PREBUILD_MAX_CONCURRENCY 로 ffmpeg/STT
        # 동시 실행을 제한(리소스 보호). _sem 밖으로 빼지 말 것.
        try:
            await _make_prompt_pair(clone_id)
        except Exception as e:  # 견본쌍은 부가 단계 — 선빌드를 깨지 않는다
            log.warning("prompt pair 단계 예외 clone=%s: %s", clone_id, e)


async def _make_prompt_pair(clone_id: str) -> bool:
    """CosyVoice ICL 짧은 견본쌍 생성(make_prompt_ref.py <clone_id>). 전 단계 graceful.

    쌍이 없으면 서빙은 긴 voice.wav 프롬프트로 폴백한다(ramble 위험). 실패해도 예외 없음.
    """
    script = MAKE_PROMPT_REF
    if not os.path.isfile(script):
        log.warning("prompt pair 생성기 없음(%s) clone=%s — 긴 프롬프트 폴백", script, clone_id)
        return False
    py = COSYVOICE_PYTHON if os.path.isfile(COSYVOICE_PYTHON) else sys.executable
    env = dict(os.environ, COSYVOICE_REF_ROOT=REF_VOICES_ROOT, PRETHIRD_STT_URL=STT_URL)
    proc = None
    try:
        proc = await asyncio.create_subprocess_exec(
            py, script, clone_id,
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT,
            cwd=os.path.dirname(script), env=env,
        )
        out, _ = await asyncio.wait_for(proc.communicate(), timeout=PROMPT_PAIR_TIMEOUT)
    except asyncio.TimeoutError:
        log.warning("prompt pair 타임아웃 clone=%s (%ss)", clone_id, PROMPT_PAIR_TIMEOUT)
        try:
            proc.kill()
        except Exception:
            pass
        try:  # 자식 회수(파이프 transport 잔류 방지)
            await asyncio.wait_for(proc.wait(), 5)
        except Exception:
            pass
        return False
    except Exception as e:
        log.warning("prompt pair 실행 실패 clone=%s: %s", clone_id, e)
        return False
    if proc.returncode != 0:
        tail = (out or b"").decode("utf-8", "replace")[-300:]
        log.warning("prompt pair 실패 clone=%s rc=%s: %s", clone_id, proc.returncode, tail)
        return False
    d = os.path.join(REF_VOICES_ROOT, clone_id)
    made = (os.path.isfile(os.path.join(d, "voice_prompt.wav"))
            and os.path.isfile(os.path.join(d, "ref_prompt.txt")))
    if made:
        log.info("prompt pair ok clone=%s", clone_id)
    else:
        log.warning("prompt pair 미생성 clone=%s (rc=0, 산출물 없음) — 긴 프롬프트 폴백", clone_id)
    return made


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
