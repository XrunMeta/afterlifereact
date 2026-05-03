"""
afterlife-musetalk — FastAPI wrapper around MuseTalk inference (port 8300).

설계 (회차 029-A — in-process 모델 상주):
  - 회차 029-C subprocess 방식 (모델 매번 30s 적재) 의 속도 튜닝
  - startup 에서 1회 모델 적재 + warmup → 메모리 상주
  - /infer 가 직접 inference_lib.run_inference() 호출 (subprocess X)
  - 단일 inference lock (직렬화 — VRAM 안전, 동시 호출 차단)
  - 롤백: musetalk_server.subprocess.bak.py 보존

회차 029-D-2c — frame stream 모드:
  /infer body 에 stream=true 추가 시, inference 가 frame 만들 때마다
  publisher (port 8400) 로 POST /oth-path (JPEG 80% quality).
  inference 끝나면 POST /oth-path
  mp4 파일 출력은 그대로 유지 (병행).

회차 029-D-3 — fps 향상:
  - MUSETALK_BATCH_SIZE 환경변수 (default 16) — unet+vae batch 크기
    (RTX A6000 49GB, fp16, peak 사용 ~5GB → 32 도 안전)
  - frame_callback 비동기화 (ThreadPoolExecutor) — publisher push 가 inference 차단 안 함
  - phase timing 로그 (preprocess / batch_loop / padding)

CWD: source/ 강제 (inference_lib 도 상대경로 ./models/, ./ffmpeg-4.4-amd64-static/, configs/inference/ 가정).

출력 명명: result_dir/v15/<video_basename>_<audio_basename>.mp4
"""

import io
import os
import sys
import time
import threading
import argparse
from concurrent.futures import ThreadPoolExecutor
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
DEFAULT_VIDEO = Path(
    os.environ.get(
        "MUSETALK_DEFAULT_VIDEO",
        str(SOURCE_DIR / "data/video/yongen.mp4"),
    )
)

# inference_lib 가 source/ cwd + 상대 import 가정 — 강제 변경
os.chdir(SOURCE_DIR)
sys.path.insert(0, str(SOURCE_DIR))
sys.path.insert(0, str(SOURCE_DIR / "scripts"))
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "0")

# 지연 import (sys.path 설정 후) — load_all_model 등 musetalk 패키지 의존
import inference_lib  # noqa: E402

# Stream 모드 의존성 (PIL, requests, cv2)
import requests  # noqa: E402
from PIL import Image  # noqa: E402
import cv2  # noqa: E402

PUBLISHER_URL = os.environ.get("MUSETALK_PUBLISHER_URL", "http://127.0.0.1:8400")
STREAM_JPEG_QUALITY = int(os.environ.get("MUSETALK_STREAM_JPEG_Q", "80"))
STREAM_PUSH_WORKERS = int(os.environ.get("MUSETALK_STREAM_PUSH_WORKERS", "4"))


def _make_frame_callback(session_id: str):
    """combine_frame (BGR) → JPEG bytes → POST /oth-path

    회차 029-D-3 — ThreadPoolExecutor 로 비동기 push.
      - inference loop 는 cv2 BGR2RGB + PIL JPEG encode 만 sync 로 (수 ms)
      - HTTP POST 는 worker thread 에 던짐 → inference 차단 X
      - cb.flush() 호출 시 모든 push 완료 대기 (run_inference 끝나고 호출).
    """
    sess = requests.Session()
    sess.headers["Content-Type"] = "image/jpeg"
    sess.headers["X-Frame-Format"] = "jpeg"
    if session_id:
        sess.headers["X-Stream-Session"] = session_id
    push_count = {"n": 0, "fail": 0, "submitted": 0}
    pool = ThreadPoolExecutor(max_workers=STREAM_PUSH_WORKERS)
    futures: list = []

    def _do_post(idx: int, data: bytes) -> None:
        try:
            r = sess.post(f"{PUBLISHER_URL}/push_frame", data=data, timeout=4.0)
            push_count["n"] += 1
            if r.status_code >= 400:
                push_count["fail"] += 1
                if push_count["fail"] <= 3:
                    print(f"[push_frame] {r.status_code}: {r.text[:200]}", flush=True)
        except Exception as e:
            push_count["fail"] += 1
            if push_count["fail"] <= 3:
                print(f"[push_frame] err idx={idx}: {e}", flush=True)

    def cb(idx: int, combine_frame_bgr) -> None:
        try:
            # encode in inference thread (cheap)
            rgb = cv2.cvtColor(combine_frame_bgr, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(rgb)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=STREAM_JPEG_QUALITY)
            data = buf.getvalue()
            # backpressure: 너무 많이 쌓이면 drop / wait
            if len(futures) > 64:
                # 가장 오래된 future 들 정리 (완료된 것만)
                futures[:] = [f for f in futures if not f.done()]
            fut = pool.submit(_do_post, idx, data)
            futures.append(fut)
            push_count["submitted"] += 1
        except Exception as e:
            push_count["fail"] += 1
            if push_count["fail"] <= 3:
                print(f"[push_frame] enc err idx={idx}: {e}", flush=True)

    def flush(timeout: float = 30.0) -> None:
        """run_inference 완료 후 호출 — 남은 push 모두 대기."""
        deadline = time.time() + timeout
        for f in futures:
            remaining = deadline - time.time()
            if remaining <= 0:
                break
            try:
                f.result(timeout=remaining)
            except Exception:
                pass
        pool.shutdown(wait=False)

    cb.stats = push_count  # type: ignore[attr-defined]
    cb.flush = flush  # type: ignore[attr-defined]
    return cb


def _signal_stream_end() -> None:
    try:
        requests.post(f"{PUBLISHER_URL}/push_frame_end", timeout=2.0)
    except Exception as e:
        print(f"[push_frame_end] err: {e}", flush=True)

# ===== Default args (inference.py 의 argparse defaults 와 동일) =====
def _default_args():
    """inference_lib.load_models / run_inference 가 사용하는 args namespace."""
    a = argparse.Namespace()
    a.ffmpeg_path = "./ffmpeg-4.4-amd64-static/"
    a.gpu_id = 0
    a.vae_type = "sd-vae"
    a.unet_config = "./models/musetalkV15/musetalk.json"
    a.unet_model_path = "./models/musetalkV15/unet.pth"
    a.whisper_dir = "./models/whisper"
    a.inference_config = ""  # set per-call
    a.bbox_shift = 0
    a.result_dir = ""        # set per-call
    a.extra_margin = 10
    a.fps = 25
    a.audio_padding_length_left = 2
    a.audio_padding_length_right = 2
    a.batch_size = int(os.environ.get("MUSETALK_BATCH_SIZE", "16"))
    a.output_vid_name = None
    # 회차 029-D-3: 같은 video 반복 시 landmark 추출 (~13s) 캐시 재사용
    a.use_saved_coord = os.environ.get("MUSETALK_USE_SAVED_COORD", "1") == "1"
    a.saved_coord = a.use_saved_coord
    a.use_float16 = True
    a.parsing_mode = "jaw"
    a.left_cheek_width = 90
    a.right_cheek_width = 90
    a.version = "v15"
    # 029-D-3a: stream 모드일 때 mp4 출력 skip (publisher 가 frame_callback 으로 받음)
    a.skip_mp4_output = False
    return a


# ===== App =====
app = FastAPI(title="afterlife-musetalk", version="0.2.0")
infer_lock = threading.Lock()

# 글로벌 모델 (startup 시 적재)
MODELS = None
LOAD_T_MS = None


@app.on_event("startup")
def _startup_load_models():
    global MODELS, LOAD_T_MS
    print("[startup] MuseTalk loading on cuda:0...", flush=True)
    t0 = time.time()
    args = _default_args()
    MODELS = inference_lib.load_models(args)
    LOAD_T_MS = int((time.time() - t0) * 1000)
    print(f"[startup] models loaded in {LOAD_T_MS} ms", flush=True)


@app.get("/healthz")
def healthz():
    return {
        "ok": MODELS is not None,
        "model": "musetalk-v15",
        "device": "cuda:0",
        "load_t_ms": LOAD_T_MS,
        "default_video": str(DEFAULT_VIDEO),
        "mode": "in-process (029-A)",
    }


@app.get("/oth-path")
def version():
    return {
        "name": "afterlife-musetalk",
        "version": "0.2.0",
        "model": "MuseTalk v15 (in-process inference, 029-A)",
    }


class InferReq(BaseModel):
    audio_path: str
    video_path: str | None = None
    output_id: str
    bbox_shift: int = 0
    stream: bool = False


@app.post("/infer")
def infer(req: InferReq):
    if MODELS is None:
        raise HTTPException(503, "models not loaded")

    audio_path = Path(req.audio_path).resolve()
    if not audio_path.is_file():
        raise HTTPException(400, f"audio not found: {audio_path}")
    video_path = Path(req.video_path).resolve() if req.video_path else DEFAULT_VIDEO
    if not video_path.is_file():
        raise HTTPException(400, f"video not found: {video_path}")

    safe_id = "".join(c for c in req.output_id if c.isalnum() or c in "-_") or f"job{int(time.time())}"
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    out_subdir = OUTPUTS_DIR / "v15"
    out_subdir.mkdir(parents=True, exist_ok=True)

    # Per-call yaml config
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

    video_base = video_path.stem
    audio_base = audio_path.stem
    expected = out_subdir / f"{video_base}_{audio_base}.mp4"

    args = _default_args()
    args.inference_config = str(cfg_path)
    args.result_dir = str(OUTPUTS_DIR)
    args.bbox_shift = int(req.bbox_shift)

    # Stream 모드 — frame_callback 으로 publisher 푸시
    cb = _make_frame_callback(safe_id) if req.stream else None

    # 029-D-3a: stream 모드에서 mp4 저장 skip (default 1, env 로 끌 수 있음).
    skip_mp4 = bool(req.stream) and (os.environ.get("MUSETALK_SKIP_MP4_IN_STREAM", "1") == "1")
    args.skip_mp4_output = skip_mp4

    t0 = time.time()
    with infer_lock:
        try:
            if cb is not None:
                inference_lib.run_inference(args, MODELS, frame_callback=cb)
            else:
                inference_lib.run_inference(args, MODELS)
        except Exception as e:
            if cb is not None:
                _signal_stream_end()
            raise HTTPException(500, f"inference failed: {type(e).__name__}: {e}")
    elapsed_ms = int((time.time() - t0) * 1000)

    # stream 종료 신호 (남은 push 다 보낸 뒤)
    if cb is not None:
        try:
            cb.flush(timeout=20.0)
        except Exception as _fe:
            print(f"[cb.flush] err: {_fe}", flush=True)
        _signal_stream_end()

    # cfg 정리
    try:
        cfg_path.unlink(missing_ok=True)
    except Exception:
        pass

    # output mp4 찾기 (skip_mp4=True 면 mp4 가 없을 수 있음 — None 응답)
    mp4_path_str: str | None = None
    if skip_mp4:
        mp4_path_str = None
    else:
        if not expected.is_file():
            mp4s = sorted(out_subdir.glob("*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True)
            if mp4s:
                expected = mp4s[0]
            else:
                raise HTTPException(500, "output mp4 not found")
        mp4_path_str = str(expected)

    resp = {
        "mp4_path": mp4_path_str,
        "infer_ms": elapsed_ms,
        "output_id": safe_id,
    }
    if cb is not None:
        resp["streamed"] = True
        resp["frames_pushed"] = cb.stats["n"]
        resp["frames_failed"] = cb.stats["fail"]
        resp["frames_submitted"] = cb.stats.get("submitted", cb.stats["n"])
        resp["mp4_skipped"] = bool(skip_mp4)
    resp["batch_size"] = int(os.environ.get("MUSETALK_BATCH_SIZE", "16"))
    return resp
