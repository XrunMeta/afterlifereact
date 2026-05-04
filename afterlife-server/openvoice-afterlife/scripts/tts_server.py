import os
import time
import threading
import tempfile
from fastapi import FastAPI, Response, HTTPException
from pydantic import BaseModel
import torch

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "0")

from melo.api import TTS
from openvoice.api import ToneColorConverter

app = FastAPI(title="afterlife-tts", version="0.2.0")
tts = None
spk = None
converter = None
source_se = None  # KR base SE
target_se = None  # cloned target SE (env: TTS_VOICE_CLONE)
load_lock = threading.Lock()
synth_lock = threading.Lock()

CKPT_V2 = "/home/afterlife/afterlife-server/openvoice-afterlife/checkpoints_v2"
REF_DIR = "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices"


@app.on_event("startup")
def load_model():
    global tts, spk, converter, source_se, target_se
    print("[startup] MeloTTS KR loading on cuda:0...", flush=True)
    t0 = time.time()
    tts = TTS(language="KR", device="cuda:0")
    spk = tts.hps.data.spk2id["KR"]
    print(
        f"[startup] MeloTTS loaded in {time.time()-t0:.1f}s, speakers={list(tts.hps.data.spk2id.keys())}",
        flush=True,
    )

    voice_clone = os.environ.get("TTS_VOICE_CLONE", "").strip()
    if voice_clone:
        try:
            t0 = time.time()
            print(f"[startup] voice clone enabled: target='{voice_clone}'", flush=True)
            converter = ToneColorConverter(
                f"{CKPT_V2}/converter/config.json",
                device="cuda:0",
            )
            converter.load_ckpt(f"{CKPT_V2}/converter/checkpoint.pth")
            print(
                f"[startup] ToneColorConverter loaded in {time.time()-t0:.1f}s",
                flush=True,
            )

            t1 = time.time()
            source_se = torch.load(
                f"{CKPT_V2}/base_speakers/ses/kr.pth",
                map_location="cuda:0",
            )

            target_se_path = f"{REF_DIR}/{voice_clone}/se.pth"
            if not os.path.isfile(target_se_path):
                print(
                    f"[startup] WARN target SE not found: {target_se_path}; voice clone disabled",
                    flush=True,
                )
                converter = None
                source_se = None
            else:
                target_se = torch.load(target_se_path, map_location="cuda:0")
                print(
                    f"[startup] SE loaded (source=kr, target={voice_clone}, target_shape={tuple(target_se.shape)}) in {time.time()-t1:.2f}s",
                    flush=True,
                )
        except Exception as e:
            print(f"[startup] ERROR voice clone setup failed: {e!r}; disabled", flush=True)
            converter = None
            source_se = None
            target_se = None

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
        t0 = time.time()
        tts.tts_to_file("워밍업", spk, tmp.name, speed=1.0)
        print(f"[startup] warmup {time.time()-t0:.2f}s", flush=True)


@app.get("/healthz")
def healthz():
    return {
        "ok": tts is not None,
        "model": "melotts-kr",
        "device": "cuda:0",
        "voice_clone": converter is not None and target_se is not None,
        "voice_target": os.environ.get("TTS_VOICE_CLONE", "") if (converter is not None and target_se is not None) else "",
    }


@app.get("/oth-path")
def version():
    return {
        "name": "afterlife-tts",
        "version": "0.2.0",
        "model": "MeloTTS KR (OpenVoice v2 base) + ToneColorConverter",
        "language": "KR",
        "voice_clone": converter is not None and target_se is not None,
    }


class SynthReq(BaseModel):
    text: str
    speed: float = 0.9
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
        base_path = tmp.name
    convert_path = base_path + ".cv.wav"

    convert_ms = 0
    try:
        t_total = time.time()
        with synth_lock:
            t0 = time.time()
            tts.tts_to_file(
                txt, spk, base_path,
                speed=req.speed,
                sdp_ratio=req.sdp_ratio,
                noise_scale=req.noise_scale,
                noise_scale_w=req.noise_scale_w,
            )
            base_ms = int((time.time() - t0) * 1000)

            if converter is not None and target_se is not None and source_se is not None:
                t1 = time.time()
                converter.convert(
                    audio_src_path=base_path,
                    src_se=source_se,
                    tgt_se=target_se,
                    output_path=convert_path,
                    message="@MyShell",
                )
                convert_ms = int((time.time() - t1) * 1000)
                final_path = convert_path
            else:
                final_path = base_path

        total_ms = int((time.time() - t_total) * 1000)
        with open(final_path, "rb") as f:
            wav = f.read()
    finally:
        for p in (base_path, convert_path):
            try:
                os.unlink(p)
            except Exception:
                pass

    return Response(
        content=wav,
        media_type="audio/wav",
        headers={
            "X-Synth-Ms": str(total_ms),
            "X-Synth-Base-Ms": str(base_ms),
            "X-Synth-Convert-Ms": str(convert_ms),
            "X-Text-Len": str(len(txt)),
            "X-Wav-Bytes": str(len(wav)),
        },
    )
