from __future__ import annotations
import os, time, logging
from fastapi import FastAPI, Response, HTTPException
from pydantic import BaseModel
import config
from clone_ref import parse_clone_id, ref_audio_path

logging.basicConfig(level=os.environ.get("QWEN3TTS_LOG_LEVEL", "INFO"))
log = logging.getLogger("qwen3tts")

app = FastAPI(title="afterlife-qwen3tts", version="0.1.0")
app.state.engine = None


@app.on_event("startup")
def _startup():
    # GPU 모델 로드. 로컬(GPU 없음) 단위테스트는 이 startup 을 띄우지 않고 라우트/목으로 검증.
    from tts_engine import Qwen3Engine
    eng = Qwen3Engine()
    eng.load()
    eng.warmup()
    app.state.engine = eng
    log.info("qwen3tts engine ready: model=%s device=%s", config.MODEL_NAME, config.DEVICE)


class SynthReq(BaseModel):
    text: str
    speed: float = 1.0
    # 아래 3개는 OpenVoice 전용 — 계약 호환 위해 수신만, 무시.
    sdp_ratio: float = 0.5
    noise_scale: float = 0.6
    noise_scale_w: float = 1.0
    se_path: str | None = None


@app.post("/tts/kr")
def synth(req: SynthReq):
    eng = app.state.engine
    if eng is None:
        raise HTTPException(503, "engine not loaded")
    txt = req.text.strip()
    if not txt:
        raise HTTPException(400, "empty text")
    if len(txt) > 1500:
        raise HTTPException(413, "text too long (max 1500)")

    clone_id = parse_clone_id(req.se_path) if req.se_path else config.DEFAULT_CLONE
    if not clone_id:
        raise HTTPException(400, "no clone_id (se_path absent and DEFAULT_CLONE empty)")
    voice_wav = ref_audio_path(clone_id)
    if not os.path.isfile(voice_wav):
        raise HTTPException(503, f"voice.wav missing for clone '{clone_id}'")

    t0 = time.time()
    wav = eng.synth(txt, clone_id=clone_id, voice_wav=voice_wav, speed=req.speed)
    total_ms = int((time.time() - t0) * 1000)
    return Response(
        content=wav,
        media_type="audio/wav",
        headers={
            "X-Synth-Ms": str(total_ms),
            "X-Text-Len": str(len(txt)),
            "X-Wav-Bytes": str(len(wav)),
            "X-Clone-Id": clone_id,
        },
    )


@app.get("/healthz")
def healthz():
    eng = app.state.engine
    return {
        "ok": eng is not None,
        "service": "qwen3tts",
        "model": config.MODEL_NAME,
        "device": config.DEVICE,
        "default_clone": config.DEFAULT_CLONE,
    }
