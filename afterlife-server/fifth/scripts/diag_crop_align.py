"""
diag_crop_align.py — 두 source의 crop box 차이 진단 스크립트.

가비아 실행:
  docker exec fifth_poc_flp bash -c "
    cd /root/FasterLivePortrait && \
    CUDA_VISIBLE_DEVICES=0 \
    LD_LIBRARY_PATH=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib:\$LD_LIBRARY_PATH \
    /root/miniconda3/bin/python scripts/diag_crop_align.py \
      --closed-src gominju_source.jpg \
      --open-src gominju_v2_mouth_rank1_f119.jpg \
      --cfg-yaml configs/trt_infer.yaml
  "
"""
import argparse
import copy
import sys

import cv2
import numpy as np


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--closed-src", required=True)
    ap.add_argument("--open-src", required=True)
    ap.add_argument("--cfg-yaml", default="configs/trt_infer.yaml")
    args = ap.parse_args()

    from omegaconf import OmegaConf
    from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline

    cfg = OmegaConf.load(args.cfg_yaml)
    cfg.infer_params.flag_normalize_lip = False
    cfg.infer_params.flag_lip_retargeting = True
    cfg.infer_params.flag_eye_retargeting = False
    cfg.infer_params.flag_relative_motion = False
    cfg.infer_params.flag_stitching = True
    cfg.infer_params.animation_region = "all"

    pipe = FasterLivePortraitPipeline(cfg=cfg)

    results = {}
    for label, path in [("closed", args.closed_src), ("open", args.open_src)]:
        ok = pipe.prepare_source(path, realtime=True)
        assert ok, f"face detect fail: {path}"

        src_img = pipe.src_imgs[0]
        src_info = pipe.src_infos[0][0]  # 첫 얼굴

        # src_info 구조: [x_s_info, source_lmk, R_s, f_s, x_s, x_c_s, ...]
        x_s_info = src_info[0]
        source_lmk = src_info[1]  # 정밀 lmk (106x2, crop 좌표계)

        # motion_extractor scale = 얼굴 크기 상대 파라미터
        scale_val = float(x_s_info["scale"])

        # source lmk bounding box (crop 좌표계)
        lmk_np = np.array(source_lmk)
        lx, ly = lmk_np.min(axis=0)
        rx, ry = lmk_np.max(axis=0)
        bbox_w = rx - lx
        bbox_h = ry - ly

        # M_c2o (src_info 마지막 원소 = M tensor)
        M_c2o = src_info[-1]  # torch Tensor
        M_np = M_c2o.cpu().numpy()

        # M_c2o[0,0], M[1,1] 에서 crop→original 스케일 추출
        # M_c2o = inv(M_o2c). M_o2c[0,0] = s (pixel scale factor)
        # so M_c2o 의 s = M_np[:2,:2] 의 norm
        s_c2o = float(np.linalg.norm(M_np[0, :2]))

        results[label] = {
            "scale": scale_val,
            "lmk_bbox_w": float(bbox_w),
            "lmk_bbox_h": float(bbox_h),
            "M_c2o_s": s_c2o,
            "M_c2o_tx": float(M_np[0, 2]),
            "M_c2o_ty": float(M_np[1, 2]),
            "src_img_shape": src_img.shape,
        }
        print(f"\n[{label}] {path}")
        print(f"  motion_extractor scale : {scale_val:.6f}")
        print(f"  lmk bbox (crop coords) : w={bbox_w:.1f} h={bbox_h:.1f}")
        print(f"  M_c2o pixel scale      : {s_c2o:.6f}")
        print(f"  M_c2o translation      : tx={M_np[0,2]:.2f} ty={M_np[1,2]:.2f}")
        print(f"  src_img shape          : {src_img.shape}")

    # 차이 계산
    c = results["closed"]
    o = results["open"]
    print("\n[DIFF] closed vs open")
    print(f"  scale diff            : {abs(c['scale'] - o['scale']):.6f}  "
          f"(closed={c['scale']:.4f} open={o['scale']:.4f})")
    print(f"  M_c2o pixel scale diff: {abs(c['M_c2o_s'] - o['M_c2o_s']):.6f}  "
          f"(closed={c['M_c2o_s']:.4f} open={o['M_c2o_s']:.4f})")
    print(f"  tx diff               : {abs(c['M_c2o_tx'] - o['M_c2o_tx']):.2f} px")
    print(f"  ty diff               : {abs(c['M_c2o_ty'] - o['M_c2o_ty']):.2f} px")
    print(f"  lmk_bbox_w diff       : {abs(c['lmk_bbox_w'] - o['lmk_bbox_w']):.1f} px")

    scale_ratio = c["M_c2o_s"] / o["M_c2o_s"] if o["M_c2o_s"] > 0 else float("nan")
    print(f"\n[VERDICT] M_c2o scale ratio (closed/open): {scale_ratio:.4f}")
    if abs(scale_ratio - 1.0) > 0.02:
        print("  >>> JITTER LIKELY: 두 source 출력 얼굴 크기 차이 >2% — 블렌드 시 널뛰기 발생 확인")
    else:
        print("  >>> scale 차이 <=2% — jitter 원인이 scale 이외에 있을 수 있음")


if __name__ == "__main__":
    main()
