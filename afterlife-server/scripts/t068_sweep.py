"""
T-068: 입술 뭉개짐 파라미터 스윕
cfg_scale=2.8 고정, 한 축씩 변경
실험:
  S1: 기준(baseline) — src=gominju_source.jpg, multiplier=1.0, region=all, stitching=True
  S2: 축A(source) — src=gominju_source_open.jpg (입 살짝 벌린 프레임)
  S3: 축C(multiplier) — 0.8
  S4: 축C(multiplier) — 1.5
  S5: 축C(region) — animation_region=exp
  S6: 축C(stitching) — flag_stitching=False, flag_lip_retargeting=False
출력: /root/FasterLivePortrait/gominju_out/sweep/  (raw mp4)
"""
import sys, os, time
import numpy as np
import cv2
import torch
from omegaconf import OmegaConf

sys.path.insert(0, "/root/FasterLivePortrait")

from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline
from src.pipelines.joyvasa_audio_to_motion_pipeline import JoyVASAAudio2MotionPipeline

SRC_CLOSED = "/root/FasterLivePortrait/gominju_source.jpg"
SRC_OPEN   = "/root/FasterLivePortrait/gominju_source_open.jpg"
AUDIO      = "/root/FasterLivePortrait/gominju_speech.wav"
CFG_YAML   = "/root/FasterLivePortrait/configs/trt_infer.yaml"
OUT_DIR    = "/root/FasterLivePortrait/gominju_out/sweep"
CFG_SCALE  = 2.8

os.makedirs(OUT_DIR, exist_ok=True)

# 공통 cfg 로드
base_cfg = OmegaConf.load(CFG_YAML)

EXPERIMENTS = [
    # (tag, src, multiplier, region, stitching, lip_retarget)
    ("S1_baseline",         SRC_CLOSED, 1.0, "all", True,  False),
    ("S2_src_open",         SRC_OPEN,   1.0, "all", True,  False),
    ("S3_mult0p8",          SRC_CLOSED, 0.8, "all", True,  False),
    ("S4_mult1p5",          SRC_CLOSED, 1.5, "all", True,  False),
    ("S5_region_exp",       SRC_CLOSED, 1.0, "exp", True,  False),
    ("S6_nostitch",         SRC_CLOSED, 1.0, "all", False, False),
]

import torchaudio
audio_tensor, sr = torchaudio.load(AUDIO)
audio_duration_s = audio_tensor.shape[-1] / sr
print(f"[INFO] audio duration: {audio_duration_s:.2f}s  sr={sr}")

# JoyVASA motion 1회 생성 (cfg_scale 고정이므로 재사용)
print("[INIT] JoyVASA motion gen (cfg_scale=2.8)...")
joy_cfg = OmegaConf.load(CFG_YAML)
joy_pipe = JoyVASAAudio2MotionPipeline(
    motion_model_path=joy_cfg.joyvasa_models.motion_model_path,
    audio_model_path=joy_cfg.joyvasa_models.audio_model_path,
    motion_template_path=joy_cfg.joyvasa_models.motion_template_path,
    cfg_mode=joy_cfg.infer_params.cfg_mode,
    cfg_scale=CFG_SCALE,
)
_ = joy_pipe.gen_motion_sequence(AUDIO)  # warmup
dri_motion_infos = joy_pipe.gen_motion_sequence(AUDIO)
n_frames    = dri_motion_infos["n_frames"]
output_fps  = dri_motion_infos["output_fps"]
motion_list = dri_motion_infos["motion"]
c_eyes      = dri_motion_infos.get("c_eyes_lst", [])
c_lips      = dri_motion_infos.get("c_lip_lst", [])
print(f"  motion: {n_frames}frames @ {output_fps}fps")

for tag, src_path, multiplier, region, stitching, lip_retarget in EXPERIMENTS:
    print(f"\n{'='*60}")
    print(f"[RUN] {tag}  src={os.path.basename(src_path)}  mult={multiplier}  region={region}  stitch={stitching}")
    print(f"{'='*60}")

    # cfg 오버라이드
    cfg = OmegaConf.load(CFG_YAML)
    cfg.infer_params.driving_multiplier   = multiplier
    cfg.infer_params.animation_region     = region
    cfg.infer_params.flag_stitching       = stitching
    cfg.infer_params.flag_lip_retargeting = lip_retarget
    cfg.infer_params.cfg_scale            = CFG_SCALE

    pipe = FasterLivePortraitPipeline(cfg=cfg)
    ret  = pipe.prepare_source(src_path, realtime=True)
    if not ret:
        print(f"[ERROR] 얼굴 검출 실패: {src_path}")
        continue

    src_img  = pipe.src_imgs[0]
    src_info = pipe.src_infos[0]
    h, w = src_img.shape[:2]
    print(f"  source: {w}x{h}")

    out_raw = os.path.join(OUT_DIR, f"{tag}_raw.mp4")
    fourcc  = cv2.VideoWriter_fourcc(*'mp4v')
    vout    = cv2.VideoWriter(out_raw, fourcc, int(output_fps), (512, 512))

    WARMUP = 3
    render_times = []

    for i in range(n_frames):
        frame_info = [motion_list[i]]
        frame_info.append(c_eyes[i] if c_eyes else None)
        frame_info.append(c_lips[i] if c_lips else None)

        t0 = time.perf_counter()
        result = pipe.run_with_pkl(frame_info, src_img, src_info, first_frame=(i == 0))
        elapsed_ms = (time.perf_counter() - t0) * 1000

        if i >= WARMUP:
            render_times.append(elapsed_ms)

        out_crop = result[0]
        if out_crop is not None:
            out_bgr = cv2.cvtColor(out_crop, cv2.COLOR_RGB2BGR)
            vout.write(out_bgr)

        if i % 5 == 0:
            print(f"  frame {i:3d}/{n_frames}: {elapsed_ms:.2f}ms")

    vout.release()
    r = np.array(render_times)
    if len(r) > 0:
        print(f"  render mean={r.mean():.2f}ms  p95={np.percentile(r,95):.2f}ms")
    print(f"  saved: {out_raw}")

print("\n[DONE] 스윕 완료. 다음: ffmpeg mux on host")
