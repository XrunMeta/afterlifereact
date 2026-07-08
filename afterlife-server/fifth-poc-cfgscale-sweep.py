"""
T-068 Round 2: cfg_scale 단일변수 스윕 실험
- 교란변수 통제: cfg_scale ∈ {1.2, 2.0, 2.8, 3.5} × qwen 한국어 오디오
- 대조: 중국어 번들 오디오 × cfg_scale=2.8
- 출력: motion 변동량 지표(IQR·mean_abs·frame_delta) + H.264 영상
"""
import sys
import os
import time
import copy
import argparse
import numpy as np
import cv2
import torch
import pickle
from omegaconf import OmegaConf, DictConfig

sys.path.insert(0, "/root/FasterLivePortrait")

from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline
from src.pipelines.joyvasa_audio_to_motion_pipeline import JoyVASAAudio2MotionPipeline


def compute_motion_stats(motion_list):
    """exp 계수의 변동량 지표 계산"""
    # motion_list: list of dict or tensor per frame
    # JoyVASA motion 구조: dict with 'exp' key (expression coefficients)
    exp_frames = []
    for m in motion_list:
        if isinstance(m, dict) and "exp" in m:
            exp = m["exp"]
            if hasattr(exp, "cpu"):
                exp = exp.cpu().numpy()
            exp_frames.append(np.array(exp).flatten())
        elif hasattr(m, "cpu"):
            exp_frames.append(m.cpu().numpy().flatten())
        else:
            exp_frames.append(np.array(m).flatten())

    if len(exp_frames) < 2:
        return {"iqr": 0.0, "mean_abs": 0.0, "mean_frame_delta": 0.0, "n_frames": len(exp_frames)}

    arr = np.stack(exp_frames, axis=0)  # (N, D)

    # 전체 분포 IQR (표현 다양성)
    q75 = np.percentile(arr, 75)
    q25 = np.percentile(arr, 25)
    iqr = float(q75 - q25)

    # 평균 절댓값 (motion magnitude)
    mean_abs = float(np.mean(np.abs(arr)))

    # 프레임 간 delta (temporal motion)
    deltas = np.diff(arr, axis=0)
    mean_frame_delta = float(np.mean(np.abs(deltas)))

    return {
        "iqr": iqr,
        "mean_abs": mean_abs,
        "mean_frame_delta": mean_frame_delta,
        "n_frames": len(exp_frames),
    }


def run_single(
    joy_pipe_factory,
    flp_cfg,
    audio_path,
    cfg_scale,
    out_dir,
    tag,
    src_img_path="assets/examples/source/s10.jpg",
):
    """단일 cfg_scale + audio 조합 실행 → motion 지표 + H.264 반환"""
    print(f"\n{'='*60}")
    print(f"  [실험] {tag}  |  cfg_scale={cfg_scale}  |  audio={os.path.basename(audio_path)}")
    print(f"{'='*60}")

    # JoyVASA 파이프 생성 (cfg_scale 주입)
    t0 = time.perf_counter()
    joy_pipe = joy_pipe_factory(cfg_scale=cfg_scale)
    load_ms = (time.perf_counter() - t0) * 1000
    print(f"  JoyVASA 로드: {load_ms:.0f}ms")

    # warmup 1회
    _ = joy_pipe.gen_motion_sequence(audio_path)

    # 실제 측정
    t1 = time.perf_counter()
    dri_motion_infos = joy_pipe.gen_motion_sequence(audio_path)
    motion_ms = (time.perf_counter() - t1) * 1000

    n_frames = dri_motion_infos["n_frames"]
    output_fps = dri_motion_infos["output_fps"]
    motion_list = dri_motion_infos["motion"]

    print(f"  motion 생성: {n_frames}f @ {output_fps}fps  ({motion_ms:.0f}ms)")

    # motion 변동량 지표
    stats = compute_motion_stats(motion_list)
    print(f"  motion stats:")
    print(f"    IQR         : {stats['iqr']:.6f}")
    print(f"    mean_abs    : {stats['mean_abs']:.6f}")
    print(f"    frame_delta : {stats['mean_frame_delta']:.6f}")
    print(f"    n_frames    : {stats['n_frames']}")

    # FLP 렌더
    flp_load_start = time.perf_counter()
    pipe = FasterLivePortraitPipeline(cfg=flp_cfg)
    ret = pipe.prepare_source(src_img_path, realtime=True)
    if not ret:
        print(f"  [ERROR] 얼굴 검출 실패: {src_img_path}")
        return stats, None

    src_img_c = pipe.src_imgs[0]
    src_info_c = pipe.src_infos[0]
    flp_load_ms = (time.perf_counter() - flp_load_start) * 1000
    print(f"  FLP 로드+source: {flp_load_ms:.0f}ms")

    # 렌더 + 영상 저장 (H.264 via ffmpeg)
    tmp_path = os.path.join(out_dir, f"{tag}_tmp.mp4")
    out_path = os.path.join(out_dir, f"{tag}_h264.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    vout = cv2.VideoWriter(tmp_path, fourcc, int(output_fps), (512, 512))

    c_eyes = dri_motion_infos.get("c_eyes_lst", [])
    c_lips = dri_motion_infos.get("c_lip_lst", [])

    render_times = []
    for frame_idx in range(n_frames):
        dri_motion_info_ = [motion_list[frame_idx]]
        dri_motion_info_.append(c_eyes[frame_idx] if c_eyes else None)
        dri_motion_info_.append(c_lips[frame_idx] if c_lips else None)

        t_r = time.perf_counter()
        result = pipe.run_with_pkl(dri_motion_info_, src_img_c, src_info_c, first_frame=(frame_idx == 0))
        render_times.append((time.perf_counter() - t_r) * 1000)

        if result[0] is not None:
            vout.write(cv2.cvtColor(result[0], cv2.COLOR_RGB2BGR))

    vout.release()

    # mp4v → H.264 변환
    ret_ffmpeg = os.system(
        f"ffmpeg -y -i {tmp_path} -vcodec libx264 -crf 23 -preset fast {out_path} 2>/dev/null"
    )
    if ret_ffmpeg == 0 and os.path.exists(out_path):
        os.remove(tmp_path)
        print(f"  H.264 출력: {out_path}")
    else:
        out_path = tmp_path
        print(f"  (ffmpeg 실패, mp4v 유지) 출력: {out_path}")

    r = np.array(render_times[5:]) if len(render_times) > 5 else np.array(render_times)
    print(f"  렌더 mean: {r.mean():.1f}ms  p95: {np.percentile(r,95):.1f}ms")

    return stats, out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cfg", default="/root/FasterLivePortrait/configs/trt_infer.yaml")
    parser.add_argument("--src", default="/root/FasterLivePortrait/assets/examples/source/s10.jpg")
    parser.add_argument("--audio_ko", default="/root/FasterLivePortrait/test_qwen_ko.wav",
                        help="qwen 한국어 오디오")
    parser.add_argument("--audio_cn", default="/root/FasterLivePortrait/test_audio.wav",
                        help="중국어 번들 오디오")
    parser.add_argument("--out_dir", default="/root/FasterLivePortrait/poc1b_output/cfg_sweep")
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)

    base_cfg = OmegaConf.load(args.cfg)

    def joy_pipe_factory(cfg_scale):
        return JoyVASAAudio2MotionPipeline(
            motion_model_path=base_cfg.joyvasa_models.motion_model_path,
            audio_model_path=base_cfg.joyvasa_models.audio_model_path,
            motion_template_path=base_cfg.joyvasa_models.motion_template_path,
            cfg_mode=base_cfg.infer_params.cfg_mode,
            cfg_scale=cfg_scale,
        )

    # ─────────────────────────────────────────────
    # 실험 A: qwen 한국어 × cfg_scale 스윕
    # ─────────────────────────────────────────────
    cfg_scales = [1.2, 2.0, 2.8, 3.5]
    ko_results = {}

    print("\n" + "=" * 60)
    print("실험 A: qwen 한국어 오디오 × cfg_scale 스윕")
    print("=" * 60)

    for cfg_s in cfg_scales:
        tag = f"ko_cfg{cfg_s:.1f}".replace(".", "p")
        # FLP cfg도 cfg_scale 반영 (infer_params 오버라이드)
        flp_cfg = copy.deepcopy(base_cfg)
        flp_cfg.infer_params.cfg_scale = cfg_s

        stats, out_path = run_single(
            joy_pipe_factory=joy_pipe_factory,
            flp_cfg=flp_cfg,
            audio_path=args.audio_ko,
            cfg_scale=cfg_s,
            out_dir=args.out_dir,
            tag=tag,
            src_img_path=args.src,
        )
        ko_results[cfg_s] = {"stats": stats, "out": out_path}

    # ─────────────────────────────────────────────
    # 실험 B: 중국어 번들 × cfg_scale=2.8 (대조)
    # ─────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("실험 B: 중국어 번들 오디오 × cfg_scale=2.8 (대조)")
    print("=" * 60)

    flp_cfg_28 = copy.deepcopy(base_cfg)
    flp_cfg_28.infer_params.cfg_scale = 2.8
    cn_stats, cn_out = run_single(
        joy_pipe_factory=joy_pipe_factory,
        flp_cfg=flp_cfg_28,
        audio_path=args.audio_cn,
        cfg_scale=2.8,
        out_dir=args.out_dir,
        tag="cn_cfg2p8",
        src_img_path=args.src,
    )

    # ─────────────────────────────────────────────
    # 결과 표
    # ─────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("=== T-068 Round2: cfg_scale 스윕 결과 표 ===")
    print("=" * 60)
    print(f"{'언어':<8} {'cfg_scale':<10} {'IQR':>10} {'mean_abs':>12} {'frame_delta':>13} {'n_frames':>9}")
    print("-" * 65)

    for cfg_s in cfg_scales:
        s = ko_results[cfg_s]["stats"]
        print(
            f"{'한국어':<8} {cfg_s:<10.1f} {s['iqr']:>10.6f} {s['mean_abs']:>12.6f} {s['mean_frame_delta']:>13.6f} {s['n_frames']:>9}"
        )

    print("-" * 65)
    print(
        f"{'중국어':<8} {'2.8(대조)':<10} {cn_stats['iqr']:>10.6f} {cn_stats['mean_abs']:>12.6f} {cn_stats['mean_frame_delta']:>13.6f} {cn_stats['n_frames']:>9}"
    )
    print("=" * 60)

    # ─────────────────────────────────────────────
    # 판정 로직
    # ─────────────────────────────────────────────
    ko_12 = ko_results[1.2]["stats"]["mean_frame_delta"]
    ko_28 = ko_results[2.8]["stats"]["mean_frame_delta"]
    cn_28 = cn_stats["mean_frame_delta"]

    print("\n=== 판정 ===")

    # cfg_scale 효과: 1.2→2.8 사이 한국어 증가율
    if ko_12 > 0:
        cfg_lift_ratio = ko_28 / ko_12
    else:
        cfg_lift_ratio = float("inf")

    # 같은 cfg_scale(2.8)에서 한국어 vs 중국어 비율
    if cn_28 > 0:
        lang_ratio = ko_28 / cn_28
    else:
        lang_ratio = float("inf")

    print(f"  cfg_scale 1.2→2.8 한국어 frame_delta 배율: {cfg_lift_ratio:.2f}x")
    print(f"  cfg=2.8 에서 한국어/중국어 frame_delta 비율: {lang_ratio:.2f} (1.0=동등)")

    LANG_THRESHOLD = 0.6   # 한국어가 중국어의 60% 미만이면 언어 효과 유의
    CFG_THRESHOLD = 1.3    # cfg 상향으로 30% 이상 증가하면 cfg 효과 유의

    h3_cfg_effect = cfg_lift_ratio >= CFG_THRESHOLD
    h1_lang_effect = lang_ratio < LANG_THRESHOLD

    print()
    if h3_cfg_effect and not h1_lang_effect:
        verdict = "H3 확정(cfg_scale 주원인). H1 기각."
        next_step = "cfg_scale=2.8 로 상향 후 FLP+qwen 경로 GO."
    elif h1_lang_effect and not h3_cfg_effect:
        verdict = "H1 확정(언어 주원인). H3 기각."
        next_step = "다국어 HuBERT 교체 필요 — 대공사 결정 필요."
    elif h1_lang_effect and h3_cfg_effect:
        verdict = "H1+H3 복합 원인."
        next_step = "cfg 상향 후에도 한국어 열세 잔존 → HuBERT 교체 검토."
    else:
        verdict = "H1·H3 모두 기각 (차이 미미)."
        next_step = "다른 변수 탐색 필요."

    print(f"  [root cause] {verdict}")
    print(f"  [권장 다음] {next_step}")

    # ─────────────────────────────────────────────
    # 영상 경로 정리 (scp 판정용)
    # ─────────────────────────────────────────────
    print("\n=== 정성 비교용 H.264 영상 경로 (scp) ===")
    key_videos = {
        "한국어 cfg=1.2 (기준)": ko_results[1.2]["out"],
        "한국어 cfg=2.8 (H3 검증)": ko_results[2.8]["out"],
        "한국어 cfg=3.5 (최대)": ko_results[3.5]["out"],
        "중국어 cfg=2.8 (대조)": cn_out,
    }
    for label, path in key_videos.items():
        print(f"  {label}: {path}")

    print("\n완료.")


if __name__ == "__main__":
    main()
