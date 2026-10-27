from __future__ import annotations
import os
import time
import logging
from fastapi import FastAPI, Response, HTTPException
from pydantic import BaseModel, Field
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
    # 모델은 첫 요청 시 lazy-load (startup 중 모델 로딩 제외 — HTTP 타임아웃 회피)
    pass


# ─── 전사 공통 로직 ───────────────────────────────────────────────────────────

_SAMPLE_RATE = 16000  # faster-whisper 고정 입력 샘플레이트


def _transcribe_wav(wav_path: str, max_sec: float | None = None,
                    words: bool = False) -> tuple[str, float, int, list[dict] | None]:
    """wav_path 를 faster-whisper 로 전사. (text, duration_sec, segments_count, words) 반환.

    words=True 면 단어별 시각 [{w, s, e}] 도 준다(견본 쪽이 쉼 자리에 문장부호를 넣는 데 쓴다, AFL-1059).

    ICL ref_audio↔ref_text 구간 정합: audio 를 **물리적으로** STT_MAX_SEC 로 cut 한 뒤
    전사한다. clip_timestamps(논리범위)는 경계에 걸친 세그먼트의 끝(>MAX)을 truncate 하지
    못해 ref_text 가 ref_audio(qwen3 엔진 extract_ref_clip = data[:max_samples]) 보다
    길어지고, 그 초과분이 ICL 합성 출력 앞에 누설된다. 엔진과 동일한 물리 cut 으로 맞춘다.
    """
    _load_model()
    if app.state.model is None:
        raise HTTPException(503, f"model not loaded: {app.state.model_error}")

    model = app.state.model

    from faster_whisper import decode_audio
    try:
        audio = decode_audio(wav_path, sampling_rate=_SAMPLE_RATE)
    except Exception as exc:
        # 손상/읽기불가 wav → 503 (qwen3tts extract_ref_clip 의 ValueError→503 매핑과 일관)
        raise HTTPException(503, f"corrupt/unreadable wav: {wav_path!r}") from exc
    # max_sec: 견본 쌍(voice_prompt.wav)처럼 파일 전체가 ref 인 경우 호출자가 넘긴다(AFL-1059).
    limit = max_sec if max_sec is not None else config.STT_MAX_SEC
    max_samples = int(limit * _SAMPLE_RATE)
    # 물리 cut. STT는 16k 리샘플 후 cut, 엔진 extract_ref_clip은 원본 sr 기준 cut 이지만
    # 둘 다 "앞 N초"라 커버하는 시간구간은 동일(STT_MAX_SEC == REF_CLIP_MAX_SEC 전제).
    audio = audio[:max_samples]

    kw = {"word_timestamps": True} if words else {}
    segments, info = model.transcribe(
        audio,
        language=config.LANG,
        beam_size=5,
        **kw,
    )
    parts = []
    seg_count = 0
    word_list: list[dict] | None = [] if words else None
    for seg in segments:
        parts.append(seg.text)
        seg_count += 1
        if words:
            for w in getattr(seg, "words", None) or []:
                word_list.append({"w": w.word, "s": round(float(w.start), 2),
                                  "e": round(float(w.end), 2)})

    text = "".join(parts).strip()
    duration = min(len(audio) / _SAMPLE_RATE, limit)
    return text, duration, seg_count, word_list


# ─── 요청 모델 ────────────────────────────────────────────────────────────────

class TranscribeReq(BaseModel):
    clone_id: str


class TranscribePathReq(BaseModel):
    wav_path: str
    out_clone_id: str
    # 없으면 STT_MAX_SEC(10초, ref_text.txt 정합). 견본 쌍은 파일 전체를 전사해야 해서 30초까지 받는다.
    max_sec: float | None = Field(default=None, gt=0, le=30)
    # True 면 응답에 단어별 시각(words)을 싣는다 — 견본 글에 문장부호를 넣는 데 쓴다(AFL-1059).
    words: bool = False


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
    text, duration, seg_count, _ = _transcribe_wav(wav)
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
    text, duration, seg_count, word_list = _transcribe_wav(safe_wav, req.max_sec, req.words)
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
    body = {
        "ok": True,
        "clone_id": clone_id,
        "ref_text": text,
        "chars": len(text),
        "model": config.MODEL,
    }
    if word_list is not None:
        body["words"] = word_list
    return body


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
