from __future__ import annotations
import os
import time
import logging
from fastapi import FastAPI, Response, HTTPException
from pydantic import BaseModel
import config
from clone_stt import (
    validate_clone_id,
    voice_wav_path,
    sanitize_wav_path,
    write_ref_text,
    sanity_check_transcript,
)

logging.basicConfig(level=os.environ.get("STT_LOG_LEVEL", "INFO"))
log = logging.getLogger("stt-afterlife")

app = FastAPI(title="afterlife-stt", version="0.1.0")
app.state.model = None          # WhisperModel 인스턴스 (lazy load)
app.state.model_error = None    # 로드 실패 메시지


# ─── 모델 로딩 ────────────────────────────────────────────────────────────────

def _load_model():
    """startup 또는 첫 요청 시 1회 로드. 실패 시 state.model_error 기록."""
    if app.state.model is not None:
        return
    try:
        from faster_whisper import WhisperModel
        log.info("loading faster-whisper model=%s device=%s compute=%s",
                 config.MODEL, config.DEVICE, config.COMPUTE_TYPE)
        app.state.model = WhisperModel(
            config.MODEL,
            device=config.DEVICE,
            compute_type=config.COMPUTE_TYPE,
        )
        log.info("faster-whisper model loaded")
    except Exception as exc:
        app.state.model_error = str(exc)
        log.error("model load failed: %s", exc)


@app.on_event("startup")
def _startup():
    _load_model()


# ─── 전사 공통 로직 ───────────────────────────────────────────────────────────

def _transcribe_wav(wav_path: str) -> tuple[str, float, int]:
    """wav_path 를 faster-whisper 로 전사. (text, duration_sec, segments_count) 반환."""
    _load_model()
    if app.state.model is None:
        raise HTTPException(503, f"model not loaded: {app.state.model_error}")

    model = app.state.model
    segments, info = model.transcribe(
        wav_path,
        language=config.LANG,
        beam_size=5,
        # 앞 STT_MAX_SEC 초만 전사
        clip_timestamps=f"0,{config.STT_MAX_SEC}",
    )
    parts = []
    seg_count = 0
    for seg in segments:
        # clip_timestamps 로 잘렸을 때 초과 구간 방어
        if seg.start > config.STT_MAX_SEC:
            break
        parts.append(seg.text)
        seg_count += 1

    text = "".join(parts).strip()
    duration = min(info.duration, config.STT_MAX_SEC)
    return text, duration, seg_count


# ─── 요청 모델 ────────────────────────────────────────────────────────────────

class TranscribeReq(BaseModel):
    clone_id: str


class TranscribePathReq(BaseModel):
    wav_path: str
    out_clone_id: str


# ─── 엔드포인트 ───────────────────────────────────────────────────────────────

@app.post("/transcribe")
def transcribe(req: TranscribeReq, response: Response):
    # clone_id 검증
    try:
        clone_id = validate_clone_id(req.clone_id)
    except ValueError as e:
        raise HTTPException(400, str(e))

    wav = voice_wav_path(clone_id)
    if not os.path.isfile(wav):
        raise HTTPException(404, f"voice.wav not found for clone '{clone_id}'")

    t0 = time.time()
    text, duration, seg_count = _transcribe_wav(wav)
    elapsed_ms = int((time.time() - t0) * 1000)

    if not text:
        raise HTTPException(422, "empty transcript — voice.wav has no audible speech")

    passed, sanity_metrics = sanity_check_transcript(text)
    if not passed:
        raise HTTPException(422, detail={
            "error": "transcript failed sanity",
            "reason": "hangul ratio or count below threshold",
            **sanity_metrics,
        })

    write_ref_text(
        clone_id=clone_id,
        text=text,
        wav_path=wav,
        model=config.MODEL,
        lang=config.LANG,
        duration_sec=duration,
        segments_count=seg_count,
        sanity_metrics=sanity_metrics,
    )

    response.headers["X-STT-Ms"] = str(elapsed_ms)
    return {
        "ok": True,
        "clone_id": clone_id,
        "ref_text": text,
        "chars": len(text),
        "model": config.MODEL,
    }


@app.post("/transcribe_path")
def transcribe_path(req: TranscribePathReq, response: Response):
    # clone_id 검증
    try:
        clone_id = validate_clone_id(req.out_clone_id)
    except ValueError as e:
        raise HTTPException(400, str(e))

    # wav_path sanitize (path traversal 방지)
    try:
        safe_wav = sanitize_wav_path(req.wav_path)
    except ValueError as e:
        raise HTTPException(400, str(e))

    if not os.path.isfile(safe_wav):
        raise HTTPException(404, f"wav not found: {req.wav_path!r}")

    t0 = time.time()
    text, duration, seg_count = _transcribe_wav(safe_wav)
    elapsed_ms = int((time.time() - t0) * 1000)

    if not text:
        raise HTTPException(422, "empty transcript — wav has no audible speech")

    passed, sanity_metrics = sanity_check_transcript(text)
    if not passed:
        raise HTTPException(422, detail={
            "error": "transcript failed sanity",
            "reason": "hangul ratio or count below threshold",
            **sanity_metrics,
        })

    write_ref_text(
        clone_id=clone_id,
        text=text,
        wav_path=safe_wav,
        model=config.MODEL,
        lang=config.LANG,
        duration_sec=duration,
        segments_count=seg_count,
        sanity_metrics=sanity_metrics,
    )

    response.headers["X-STT-Ms"] = str(elapsed_ms)
    return {
        "ok": True,
        "clone_id": clone_id,
        "ref_text": text,
        "chars": len(text),
        "model": config.MODEL,
    }


@app.get("/healthz")
def healthz():
    return {
        "ok": app.state.model is not None,
        "service": "stt-afterlife",
        "model": config.MODEL,
        "device": config.DEVICE,
        "lang": config.LANG,
        "model_error": app.state.model_error,
    }
