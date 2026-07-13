"""
T-068 입벌린 프레임 스캔 v2
calc_lip_close_ratio = 상하입술거리/입너비 → 이 값이 클수록 입이 열린 것(open ratio)
"""
import sys, os, argparse
os.chdir("/root/FasterLivePortrait")
sys.path.insert(0, "/root/FasterLivePortrait")

import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--video", type=str, required=True)
ap.add_argument("--tag", type=str, default="scan")
ap.add_argument("--topk", type=int, default=5)
ap.add_argument("--out", type=str, default="/root/FasterLivePortrait")
args = ap.parse_args()

from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline
from src.utils.utils import calc_lip_close_ratio
from omegaconf import OmegaConf

cfg = OmegaConf.load("configs/trt_infer.yaml")
cfg.infer_params.flag_normalize_lip = False
cfg.infer_params.flag_lip_retargeting = False
cfg.infer_params.flag_eye_retargeting = False

print(f"[scan_v2] loading FLP...")
pipe = FasterLivePortraitPipeline(cfg=cfg)

print(f"[scan_v2] prepare_source: {args.video}")
ok = pipe.prepare_source(args.video, realtime=True)
if not ok:
    print("[ERROR] prepare_source failed")
    sys.exit(1)

print(f"[scan_v2] {len(pipe.src_imgs)} frames")

results = []  # (frame_idx, raw_lip_ratio)
for fidx, info in enumerate(pipe.src_infos):
    if not info or not info[0] or len(info[0]) < 2:
        continue
    lmk = info[0][1]
    if lmk is None:
        continue
    try:
        # calc_lip_close_ratio: 상하거리/입너비 → 클수록 입 열림
        lip_ratio = float(calc_lip_close_ratio(lmk[None])[0, 0])
        results.append((fidx, lip_ratio))
    except Exception:
        pass

if not results:
    print("[ERROR] no results")
    sys.exit(1)

vals = [r[1] for r in results]
print(f"[stats] lip_ratio(상하/너비): min={min(vals):.6f} max={max(vals):.6f} mean={np.mean(vals):.6f}")

# 입 열린 순(내림차순)
results.sort(key=lambda x: x[1], reverse=True)

print(f"\n[top-{args.topk}] 입 가장 크게 벌린 프레임 (lip_ratio 높을수록 열림):")

# 비디오 재읽기
cap = cv2.VideoCapture(args.video)
top_set = {r[0]: (i, r[1]) for i, r in enumerate(results[:args.topk])}
extracted = {}
fidx = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break
    if fidx in top_set:
        extracted[fidx] = frame.copy()
    fidx += 1
cap.release()

os.makedirs(args.out, exist_ok=True)
saved = []
for rank, (ridx, ratio) in enumerate(results[:args.topk]):
    if ridx not in extracted:
        continue
    # 이미지 저장 시 원본 해상도 유지 (소스로 사용할 때 FLP가 resize 함)
    out_path = os.path.join(args.out, f"{args.tag}_mouth_rank{rank+1}_f{ridx}.jpg")
    cv2.imwrite(out_path, extracted[ridx])
    print(f"  rank{rank+1}: frame={ridx} lip_ratio={ratio:.6f} -> {out_path}")
    saved.append(out_path)

print(f"\n[bottom-3] 가장 입 다문 프레임:")
for ridx, ratio in results[-3:]:
    print(f"  frame={ridx} lip_ratio={ratio:.6f}")

if saved:
    print(f"\n[BEST SOURCE] {saved[0]}")
    print(f"[SECOND] {saved[1] if len(saved) > 1 else 'N/A'}")
