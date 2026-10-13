"""voice_analyze — 클론 생성 업로드 음성 품질 동기 판정 (AFL-1005).

POST /oth-path {voiceRawUrl} → 임시 wav 로 변환해 길이·쉼·STT char/s 판정 →
{ok, reason?}. clone_id 없음(클론 미생성)이라 ref 디렉터리에 쓰지 않는다.

쉼/길이 상수는 cosyvoice/scripts/make_prompt_ref.py 가 소스오브트루스다. 크로스 conda-env
import 를 피하려 동일 env 이름·동일 기본값으로 미러한다(값은 test 로 고정). char/s 는
prethird ref_quality 를 그대로 재사용한다.
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
