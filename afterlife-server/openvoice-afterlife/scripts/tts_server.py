import os
import time
import threading
import tempfile
from fastapi import FastAPI, Response, HTTPException
from pydantic import BaseModel

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "0")
from melo.api import TTS

app = FastAPI(title="afterlife-tts", version="0.1.0")
tts = None
spk = None
load_lock = threading.Lock()
synth_lock = threading.Lock()  # MeloTTS single-instance safety

@app.on_event("startup")
def load_model():
    global tts, spk
    print("[startup] MeloTTS KR loading on cuda:0...", flush=True)
    t0 = time.time()
    tts = TTS(language="KR", device="cuda:0")
    spk = tts.hps.data.spk2id["KR"]
    print(f"[startup] loaded in {time.time()-t0:.1f}s, speakers={list(tts.hps.data.spk2id.keys())}", flush=True)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
        t0 = time.time()
        tts.tts_to_file("워밍업", spk, tmp.name, speed=1.0)
        print(f"[startup] warmup {time.time()-t0:.2f}s", flush=True)

@app.get("/healthz")
def healthz():
    return {"ok": tts is not None, "model": "melotts-kr", "device": "cuda:0"}

@app.get("/oth-path")
def version():
    return {
        "name": "afterlife-tts",
        "version": "0.1.0",
        "model": "MeloTTS KR (OpenVoice v2 base)",
        "language": "KR",
    }

class SynthReq(BaseModel):
    text: str
    speed: float = 0.85
    sdp_ratio: float = 0.5
    noise_scale: float = 0.6
    noise_scale_w: float = 1.0

@app.post("/tts/kr")
def synth(req: SynthReq):
    if tts is None:
        raise HTTPException(503, "model not loaded")
    txt = req.text.strip()
    if not txt:
        raise HTTPException(400, "empty text")
    if len(txt) > 1500:
        raise HTTPException(413, "text too long (max 1500)")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        out_path = tmp.name
    try:
        t0 = time.time()
        with synth_lock:
            tts.tts_to_file(
                txt, spk, out_path,
                speed=req.speed,
                sdp_ratio=req.sdp_ratio,
                noise_scale=req.noise_scale,
                noise_scale_w=req.noise_scale_w,
            )
        elapsed_ms = int((time.time() - t0) * 1000)
        with open(out_path, "rb") as f:
            wav = f.read()
    finally:
        try:
            os.unlink(out_path)
        except Exception:
            pass

    return Response(
        content=wav,
        media_type="audio/wav",
        headers={
            "X-Synth-Ms": str(elapsed_ms),
            "X-Text-Len": str(len(txt)),
            "X-Wav-Bytes": str(len(wav)),
        },
    )
