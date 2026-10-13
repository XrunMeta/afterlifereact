"""voice_analyze — 클론 생성 업로드 음성 품질 동기 판정 (AFL-1005).

POST /oth-path {voiceRawUrl} → 임시 wav 로 변환해 길이·쉼·STT char/s 판정 →
{ok, reason?}. clone_id 없음(클론 미생성)이라 ref 디렉터리에 쓰지 않는다.

쉼/길이 상수는 cosyvoice/scripts/make_prompt_ref.py 가 소스오브트루스다. 크로스 conda-env
import 를 피하려 동일 env 이름·동일 기본값으로 미러한다(값은 test 로 고정). char/s 는
prethird ref_quality 를 그대로 재사용한다.
경고: 한쪽(여기 또는 make_prompt_ref.py)을 바꾸면 반드시 다른 쪽도 함께 바꿀 것 —
test_constants_match_make_prompt_ref_spec 은 이쪽 리터럴만 고정한다.
"""
from __future__ import annotations

import os
import re

import ref_quality

# make_prompt_ref.py 와 동일 env·기본값 (Global Constraints)
RECORD_MIN_SEC = float(os.environ.get("COSYVOICE_PROMPT_RECORD_MIN_SEC", "15.0"))
CUT_AFTER_SEC = float(os.environ.get("COSYVOICE_PROMPT_CUT_AFTER_SEC", "8.0"))
MAX_PROMPT_SEC = float(os.environ.get("COSYVOICE_PROMPT_MAX_SEC", "30.0"))
SILENCE_DB = os.environ.get("COSYVOICE_PROMPT_SILENCE_DB", "-40dB")
SILENCE_MIN = float(os.environ.get("COSYVOICE_PROMPT_SILENCE_MIN", "0.2"))
TAIL_SILENCE_SEC = float(os.environ.get("COSYVOICE_PROMPT_TAIL_SILENCE", "0.35"))
# STT 서버가 오디오를 이 길이로 물리 컷(stt config STT_MAX_SEC)하므로 char/s 분모도 동일 캡.
STT_DURATION_CAP_SEC = float(os.environ.get("STT_MAX_SEC", "10.0"))


def _pick_end_reason(
    start: float, total: float, sil_starts: list[float], sil_ends: list[float],
) -> tuple[float | None, str]:
    """make_prompt_ref.pick_end 미러(순수). (끝 시각|None, "ok"|"too_short"|"no_pause")."""
    if total - start < RECORD_MIN_SEC:
        return None, "too_short"
    lo, hi = start + CUT_AFTER_SEC, start + MAX_PROMPT_SEC
    for i, s in enumerate(sil_starts):
        if lo <= s <= hi:
            gap = (sil_ends[i] if i < len(sil_ends) else total) - s
            return s + min(TAIL_SILENCE_SEC, gap), "ok"
    return None, "no_pause"


def classify(
    duration_sec: float,
    speech_start_sec: float,
    sil_starts: list[float],
    sil_ends: list[float],
    stt_text: str | None,
    *,
    threshold: float | None = None,
) -> dict:
    """길이·목소리·쉼 순으로 판정. {"ok":True} 또는 {"ok":False,"reason":...}."""
    # 1. 길이
    if duration_sec < RECORD_MIN_SEC:
        return {"ok": False, "reason": "TOO_SHORT"}
    # 2. 목소리 (STT char/s)
    if not stt_text:
        return {"ok": False, "reason": "NO_VOICE"}
    non_space = len(re.sub(r"\s+", "", stt_text))
    cap = min(duration_sec, STT_DURATION_CAP_SEC)
    q = ref_quality.evaluate({"non_space_len": non_space, "duration_sec": cap}, threshold)
    if q.get("ok") is not True:
        return {"ok": False, "reason": "NO_VOICE"}
    # 3. 쉼
    _, reason = _pick_end_reason(speech_start_sec, duration_sec, sil_starts, sil_ends)
    if reason == "too_short":
        return {"ok": False, "reason": "TOO_SHORT"}
    if reason == "no_pause":
        return {"ok": False, "reason": "NO_PAUSE"}
    return {"ok": True}


# ---------------------------------------------------------------------------
# I/O 래퍼 + HTTP 핸들러 (Task 2)
# ---------------------------------------------------------------------------
import asyncio
import hmac
import json as _json
import logging
import tempfile
import urllib.error
import urllib.request

from aiohttp import web

import voice_fetch

log = logging.getLogger("prethird.voice_analyze")

STT_URL = os.environ.get("PRETHIRD_STT_URL", "http://127.0.0.1:8202")
STT_SINK_CLONE = os.environ.get("COSYVOICE_PROMPT_STT_SINK", "zz-stt-sink")
_SIL_START = re.compile(r"silence_start:\s*([0-9.]+)")
_SIL_END = re.compile(r"silence_end:\s*([0-9.]+)")


def _run(cmd: list[str]) -> str:
    import subprocess
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    return (p.stdout or "") + (p.stderr or "")


def _duration(path: str) -> float:
    out = _run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "csv=p=0", path]).strip()
    try:
        return float(out.splitlines()[0])
    except (ValueError, IndexError):
        return 0.0


def _silences(path: str) -> tuple[list[float], list[float]]:
    out = _run(["ffmpeg", "-hide_banner", "-i", path,
                "-af", f"silencedetect=noise={SILENCE_DB}:d={SILENCE_MIN}",
                "-f", "null", "/dev/null"])
    return ([float(m) for m in _SIL_START.findall(out)],
            [float(m) for m in _SIL_END.findall(out)])


def _speech_start(sil_starts: list[float], sil_ends: list[float]) -> float:
    if sil_starts and sil_ends and sil_starts[0] < 0.3:
        return sil_ends[0]
    return 0.0


def _transcribe(wav_path: str) -> str | None:
    payload = _json.dumps({"wav_path": wav_path, "out_clone_id": STT_SINK_CLONE}).encode()
    req = urllib.request.Request(f"{STT_URL}/transcribe_path", data=payload,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = _json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code == 422:  # 빈 전사/한글비율 미달 = 진짜 발화 없음 → NO_VOICE
            log.info("voice-analyze STT 422: no speech")
            return None
        raise  # 5xx 등 인프라 오류는 전파 → 핸들러 500 (fail-closed)
    return data.get("ref_text") or None


def _analyze_sync(wav_path: str) -> dict:
    dur = _duration(wav_path)
    sil_starts, sil_ends = _silences(wav_path)
    start = _speech_start(sil_starts, sil_ends)
    text = _transcribe(wav_path)
    return classify(dur, start, sil_starts, sil_ends, text)


async def analyze(voice_raw_url: str) -> dict:
    """voiceRawUrl → 임시 wav 변환 → 판정. 임시 파일은 finally 로 정리."""
    tmpdir = tempfile.mkdtemp(prefix="afl1005-")
    src = os.path.join(tmpdir, "in.src")
    wav = os.path.join(tmpdir, "in.wav")
    try:
        await voice_fetch.fetch_to(voice_raw_url, src)
        await voice_fetch._ffmpeg_to_wav(src, wav)
        # ffmpeg/ffprobe/STT 는 블로킹 → 이벤트 루프 밖에서.
        return await asyncio.get_running_loop().run_in_executor(None, _analyze_sync, wav)
    finally:
        for p in (src, wav):
            try:
                os.remove(p)
            except OSError:
                pass
        try:
            os.rmdir(tmpdir)
        except OSError:
            pass


def _authorized(request: web.Request) -> bool:
    secret = os.environ.get("PREBUILD_SECRET", "")
    if not secret:
        return False
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return False
    return hmac.compare_digest(header[len("Bearer "):], secret)


async def voice_analyze_handler(request: web.Request) -> web.Response:
    if not _authorized(request):
        return web.json_response({"error": "unauthorized"}, status=401)
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
    voice_raw_url = body.get("voiceRawUrl") if isinstance(body, dict) else None
    if not voice_raw_url:
        return web.json_response({"error": "voiceRawUrl required"}, status=400)
    try:
        verdict = await analyze(str(voice_raw_url))
    except Exception as exc:  # noqa: BLE001 — 내부 오류는 500(API 가 fail-closed 처리)
        log.warning("voice-analyze failed: %s", exc)
        return web.json_response({"error": "analyze failed"}, status=500)
    return web.json_response(verdict, status=200)
