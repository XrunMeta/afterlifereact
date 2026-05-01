"""
afterlife-musetalk — FastAPI wrapper around MuseTalk inference (port 8300).

설계 (회차 029-C):
  - afterlife-tts (port 8200) 와 동일 패턴 (uvicorn + FastAPI + 단일 inference lock)
  - POST /oth-path { audio_path, video_path?, output_id }
      → subprocess 로 source/scripts/inference.py 호출 (격리 + 간섭 방지)
      → output mp4 의 절대 경로 반환
  - 모델 메모리 상주 X (subprocess 매번 적재 — 단순화). 회차 030 즈음에 직접 호출 + 상주 가능.
  - 단일 inference lock (동시 호출 직렬화 — VRAM 안전)
  - inference 1회 = 보통 1~2분 걸린다고 가정 (timeout 600s)

CWD 처리:
  inference.py 가 상대경로 (./models/, ./ffmpeg-4.4-amd64-static/, configs/inference/) 로 동작하므로
  subprocess cwd = SOURCE_DIR 로 강제. 그리고 yaml 의 video_path 도 source 기준 상대경로 또는 절대경로.

출력 파일 명명:
  inference.py 는 result_dir/v15/<video_basename>_<audio_basename>.mp4 로 저장한다.
  ex) yongen + halmoni_v4_old.wav → outputs/v15/yongen_halmoni_v4_old.mp4
"""

import os
import sys
import time
import threading
import subprocess
from pathlib import Path

import yaml
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# ===== Paths =====
ROOT_DIR = Path("/home/afterlife/afterlife-server/musetalk-afterlife")
SOURCE_DIR = ROOT_DIR / "source"
MODELS_DIR = ROOT_DIR / "models"
OUTPUTS_DIR = ROOT_DIR / "outputs"
CONFIG_DIR = SOURCE_DIR / "configs/inference"
DEFAULT_VIDEO = SOURCE_DIR / "data/video/yongen.mp4"

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "0")

app = FastAPI(title="afterlife-musetalk", version="0.1.0")
infer_lock = threading.Lock()


@app.get("/healthz")
def healthz():
    return {
        "ok": SOURCE_DIR.is_dir() and DEFAULT_VIDEO.is_file(),
        "model": "musetalk-v15",
        "device": "cuda:0",
        "default_video": str(DEFAULT_VIDEO),
    }


@app.get("/oth-path")
def version():
    return {
        "name": "afterlife-musetalk",
        "version": "0.1.0",
        "model": "MuseTalk v15 (subprocess inference)",
    }


class InferReq(BaseModel):
    audio_path: str
    video_path: str | None = None
    output_id: str  # ex: "session-abc123-msg-1"
    bbox_shift: int = 0


@app.post("/infer")
def infer(req: InferReq):
    # input 검증
    audio_path = Path(req.audio_path).resolve()
    if not audio_path.is_file():
        raise HTTPException(400, f"audio not found: {audio_path}")

    video_path = Path(req.video_path).resolve() if req.video_path else DEFAULT_VIDEO
    if not video_path.is_file():
        raise HTTPException(400, f"video not found: {video_path}")

    # output_id sanitize (path injection 방지)
    safe_id = "".join(c for c in req.output_id if c.isalnum() or c in "-_") or f"job{int(time.time())}"

    # 출력 디렉토리 (inference.py 가 result_dir/v15/ 로 저장)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    out_subdir = OUTPUTS_DIR / "v15"
    out_subdir.mkdir(parents=True, exist_ok=True)

    # 임시 yaml config — 절대경로 기록
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    cfg_path = CONFIG_DIR / f"runtime_{safe_id}.yaml"
    cfg_data = {
        "task_0": {
            "video_path": str(video_path),
            "audio_path": str(audio_path),
            "bbox_shift": int(req.bbox_shift),
        }
    }
    cfg_path.write_text(yaml.safe_dump(cfg_data, allow_unicode=True), encoding="utf-8")

    # 예상 출력 파일 경로 (inference.py 의 명명 규칙)
    video_base = video_path.stem
    audio_base = audio_path.stem
    expected = out_subdir / f"{video_base}_{audio_base}.mp4"

    t0 = time.time()
    with infer_lock:
        try:
            result = subprocess.run(
                [
                    sys.executable, "-m", "scripts.inference",
                    "--inference_config", str(cfg_path),
                    "--result_dir", str(OUTPUTS_DIR),
                    "--unet_model_path", "./models/musetalkV15/unet.pth",
                    "--unet_config", "./models/musetalkV15/musetalk.json",
                    "--whisper_dir", "./models/whisper",
                    "--use_float16",
                    "--version", "v15",
                ],
                cwd=str(SOURCE_DIR),
                capture_output=True,
                text=True,
                timeout=600,
            )
        except subprocess.TimeoutExpired as e:
            cfg_path.unlink(missing_ok=True)
            raise HTTPException(504, f"inference timeout after 600s: {e}")
        finally:
            cfg_path.unlink(missing_ok=True)

    elapsed_ms = int((time.time() - t0) * 1000)

    if result.returncode != 0:
        tail = (result.stderr or "")[-800:]
        raise HTTPException(500, f"inference failed (rc={result.returncode}): {tail}")

    # output mp4 검증
    if not expected.is_file():
        # fallback — find any new mp4 in out_subdir
        mp4s = sorted(out_subdir.glob("*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not mp4s:
            raise HTTPException(500, "output mp4 not found after inference")
        expected = mp4s[0]

    return {
        "mp4_path": str(expected),
        "mp4_basename": expected.name,
        "infer_ms": elapsed_ms,
        "stderr_tail": (result.stderr or "")[-200:],
    }
