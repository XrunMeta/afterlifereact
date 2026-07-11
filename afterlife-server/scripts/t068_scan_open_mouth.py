"""
T-068 입벌린 프레임 스캔 스크립트
prepare_source로 전프레임 landmark 일괄 추출 → mouth-open ratio top-k 프레임 저장
usage: python t068_scan_open_mouth.py --video <mp4> --tag <gominju|halbae> --topk 3
"""
import sys, os, argparse
os.chdir("/root/FasterLivePortrait")
sys.path.insert(0, "/root/FasterLivePortrait")

import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--video", type=str, required=True, help="입력 mp4 경로")
ap.add_argument("--tag", type=str, default="scan", help="출력 파일명 prefix")
ap.add_argument("--topk", type=int, default=3, help="top-k 프레임 수")
ap.add_argument("--out", type=str, default="/root/FasterLivePortrait", help="출력 디렉토리")
args = ap.parse_args()

from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline
from src.utils.utils import calc_lip_close_ratio
from omegaconf import OmegaConf

CFG = "/root/FasterLivePortrait/configs/trt_infer.yaml"
cfg = OmegaConf.load(CFG)
cfg.infer_params.flag_normalize_lip = False
cfg.infer_params.flag_lip_retargeting = False
cfg.infer_params.flag_eye_retargeting = False

print(f"[scan] loading FLP pipeline...")
pipe = FasterLivePortraitPipeline(cfg=cfg)

print(f"[scan] prepare_source (전프레임 landmark 추출)...")
ok = pipe.prepare_source(args.video, realtime=True)
if not ok:
    print("[ERROR] prepare_source failed")
    sys.exit(1)

print(f"[scan] extracted {len(pipe.src_imgs)} frames, {len(pipe.src_infos)} infos")

results = []  # (frame_idx, open_ratio, close_ratio)

for fidx, (img, info) in enumerate(zip(pipe.src_imgs, pipe.src_infos)):
    if not info or not info[0]:
        continue
    frame_info = info[0]  # list with ~10 elements
    # src_infos structure from prepare_source:
    # info[0] is a list; element[1] is lmk (203,2) based on debug output
    if len(frame_info) < 2:
        continue
    lmk = frame_info[1]
    if lmk is None:
        continue
    try:
        close_r = float(calc_lip_close_ratio(lmk[None])[0, 0])
        open_r = 1.0 - close_r
        results.append((fidx, open_r, close_r))
    except Exception as e:
        pass

print(f"[scan] {len(results)} frames with valid landmark")

if not results:
    print("[ERROR] no valid landmarks")
    sys.exit(1)

# stats
open_vals = [r[1] for r in results]
print(f"[stats] mouth_open_ratio: min={min(open_vals):.4f} max={max(open_vals):.4f} mean={np.mean(open_vals):.4f}")

# top-k 정렬
results.sort(key=lambda x: x[1], reverse=True)

print(f"\n[top-{args.topk}] 입 가장 크게 벌린 프레임:")
os.makedirs(args.out, exist_ok=True)

# 비디오 다시 열어서 해당 프레임 추출
cap = cv2.VideoCapture(args.video)
total_frames_v = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"[extract] video total frames={total_frames_v}")

# top-k 인덱스 세트
top_indices = {r[0]: (i, r[1], r[2]) for i, r in enumerate(results[:args.topk])}

# 순차 읽기로 해당 프레임 추출
extracted = {}
fidx = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break
    if fidx in top_indices:
        extracted[fidx] = frame.copy()
    fidx += 1
cap.release()

saved_paths = []
for rank, (ridx, open_r, close_r) in enumerate(results[:args.topk]):
    if ridx not in extracted:
        print(f"  rank{rank+1}: frame={ridx} NOT extracted (skip)")
        continue
    out_path = os.path.join(args.out, f"{args.tag}_open_rank{rank+1}_f{ridx}.jpg")
    cv2.imwrite(out_path, extracted[ridx])
    print(f"  rank{rank+1}: frame={ridx} mouth_open_ratio={open_r:.4f} (close={close_r:.4f}) -> {out_path}")
    saved_paths.append((rank+1, ridx, open_r, out_path))

print(f"\n[DONE] {len(saved_paths)} frames saved")
if saved_paths:
    best = saved_paths[0]
    print(f"[BEST] rank1 frame={best[1]} open_ratio={best[2]:.4f} path={best[3]}")

# bottom-3
print(f"\n[bottom-3] 가장 입 다문:")
for fidx, open_r, close_r in results[-3:]:
    print(f"  frame={fidx} open_ratio={open_r:.4f} close_ratio={close_r:.4f}")
