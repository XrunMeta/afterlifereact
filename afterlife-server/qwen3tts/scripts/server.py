from __future__ import annotations
import os, time, logging, threading
from fastapi import FastAPI, Response, HTTPException
from pydantic import BaseModel
import config
from clone_ref import parse_clone_id, ref_audio_path, load_ref_text

# 동시통화 음성 섞임 방지: GPU synth 직렬화 Lock
_SYNTH_LOCK = threading.Lock()

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
    # clone_id: 신규 필드. 우선순위 1위. se_path 보다 우선 적용.
    clone_id: str | None = None
    # se_path: deprecated. 하위호환 유지. clone_id 없을 때 parse_clone_id() 로 추출.
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

    # clone_id 결정 우선순위: ① req.clone_id → ② parse_clone_id(req.se_path) → ③ 400
    if req.clone_id:
        clone_id = req.clone_id
    elif req.se_path:
        clone_id = parse_clone_id(req.se_path)
    else:
        raise HTTPException(400, "no clone specified (clone_id and se_path both absent)")

    voice_wav = ref_audio_path(clone_id)
    if not os.path.isfile(voice_wav):
        raise HTTPException(503, f"voice.wav missing for clone '{clone_id}'")

    # 경량 선검증: 파일 크기 비정상 시 조기 503 (sion MAJOR3).
    # magic bytes 검사는 하지 않음 — soundfile 이 다양한 포맷을 지원하므로 과검증 금지.
    _wav_size = os.path.getsize(voice_wav)
    if _wav_size < 100:
        raise HTTPException(503, f"voice.wav too small ({_wav_size}B) for clone '{clone_id}'")

    # ICL ref_text 배선: ref_text.txt 있으면 ICL 모드, 없으면 x_vector_only (기존 경로)
    ref_text = load_ref_text(clone_id)

    t0 = time.time()
    try:
        with _SYNTH_LOCK:
            wav = eng.synth(txt, clone_id=clone_id, voice_wav=voice_wav, ref_text=ref_text, speed=req.speed)
    except ValueError as exc:
        # extract_ref_clip 에서 raise 하는 "corrupt/unreadable wav" 를 503 으로 매핑.
        # 무음 응답 대신 명시적 에러 반환 (sion MAJOR3).
        log.warning("voice.wav unreadable for clone '%s': %s", clone_id, exc)
        raise HTTPException(503, f"voice.wav unreadable for clone '{clone_id}'")
    total_ms = int((time.time() - t0) * 1000)
    return Response(
        content=wav,
        media_type="audio/wav",
        headers={
            "X-Synth-Ms": str(total_ms),
            "X-Text-Len": str(len(txt)),
            "X-Wav-Bytes": str(len(wav)),
            "X-Clone-Id": clone_id,
            "X-Icl-Mode": "true" if ref_text is not None else "false",
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
        "warmup_clone": config.WARMUP_CLONE,
        "icl_capable": True,
    }
