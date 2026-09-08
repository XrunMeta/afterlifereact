"""CosyVoice2 어댑터 서버 — qwen3tts /tts/kr 계약 미러(drop-in). T-120 cosyvoice.

계약(qwen3tts 동일): POST /oth-path {text, clone_id|se_path, speed, ...} -> audio/wav bytes.
prethird 는 PRETHIRD_TTS_URL 만 :8201→:8203 로 바꾸면 교체됨(_prethird_toggle.sh).
"""
from __future__ import annotations
import os, time, logging
from fastapi import FastAPI, Response, HTTPException
from pydantic import BaseModel
import config
from clone_ref import parse_clone_id, ref_audio_path, load_ref_text, ref_pair

logging.basicConfig(level=os.environ.get("COSYVOICE_LOG_LEVEL", "INFO"))
log = logging.getLogger("cosyvoice")

app = FastAPI(title="afterlife-cosyvoice", version="0.1.0")
app.state.engine = None


@app.on_event("startup")
def _startup():
    # 로컬(GPU 없음) 단위테스트는 startup 을 띄우지 않고 라우트/목으로 검증.
    from cosy_engine import CosyEngine
    eng = CosyEngine()
    eng.load()
    eng.warmup()
    app.state.engine = eng
    log.info("cosyvoice engine ready: model=%s", config.MODEL_DIR)


class SynthReq(BaseModel):
    text: str
    speed: float = config.DEFAULT_SPEED
    # OpenVoice/qwen3 계약 호환 위해 수신만 하고 무시(회귀 0).
    sdp_ratio: float = 0.5
    noise_scale: float = 0.6
    noise_scale_w: float = 1.0
    # qwen3 gen 파라미터 — CV2 미사용, 계약 호환 위해 수신만.
    # qwen3 호환 필드 — CosyVoice 엔진은 쓰지 않는다(스키마 호환용으로만 유지).
    temperature: float | None = None
    top_p: float | None = None
    top_k: int | None = None
    repetition_penalty: float | None = None
    max_new_tokens: int | None = None

    # CosyVoice 전용 per-request 파라미터(lab-tuner). None 이면 config 기본값 = 회귀 0.
    sampling_top_k: int | None = None
    sampling_top_p: float | None = None
    ramble_base_sec: float | None = None
    ramble_per_char_sec: float | None = None
    ramble_retries: int | None = None
    ramble_fallback_top_k: int | None = None
    # 클론 지정: ① clone_id(우선) → ② se_path(하위호환).
    clone_id: str | None = None
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

    # clone_id 결정: ① req.clone_id → ② parse_clone_id(req.se_path) → ③ 400
    if req.clone_id:
        clone_id = req.clone_id
    elif req.se_path:
        clone_id = parse_clone_id(req.se_path)
    else:
        raise HTTPException(400, "no clone specified (clone_id and se_path both absent)")

    # 오디오·텍스트를 **짝으로** 받는다(ref_pair). 짧은 프롬프트 쌍이 있으면 그것을,
    # 없으면 기존 voice.wav + ref_text.txt. 한쪽만 바꾸면 ICL 전제가 깨진다.
    voice_wav, ref_text = ref_pair(clone_id)
    if not os.path.isfile(voice_wav):
        raise HTTPException(503, f"voice.wav missing for clone '{clone_id}'")
    if os.path.getsize(voice_wav) < 100:
        raise HTTPException(503, f"voice.wav too small for clone '{clone_id}'")

    t0 = time.time()
    try:
        # per-request 파라미터를 엔진으로 넘긴다. 지금까지는 스키마로 받기만 하고
        # 버려서 lab-tuner 에서 무엇을 보내도 speed 외에는 반영되지 않았다.
        from synth_opts import SYNTH_OPT_KEYS
        opts = {k: getattr(req, k, None) for k in SYNTH_OPT_KEYS}
        opts = {k: v for k, v in opts.items() if v is not None}
        wav = eng.synth(txt, clone_id=clone_id, voice_wav=voice_wav,
                        ref_text=ref_text, speed=req.speed, opts=opts or None)
    except ValueError as exc:
        log.warning("synth fail clone '%s': %s", clone_id, exc)
        raise HTTPException(503, f"synth failed for clone '{clone_id}': {exc}")
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
            "X-Engine": "cosyvoice2",
        },
    )


@app.get("/healthz")
def healthz():
    eng = app.state.engine
    return {
        "ok": eng is not None,
        "service": "cosyvoice",
        "model": config.MODEL_DIR,
        "warmup_clone": config.WARMUP_CLONE,
        "icl_capable": True,
    }
