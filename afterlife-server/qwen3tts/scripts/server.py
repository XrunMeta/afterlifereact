from __future__ import annotations
import os, time, logging
from fastapi import FastAPI, Response, HTTPException
from pydantic import BaseModel
import config

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
