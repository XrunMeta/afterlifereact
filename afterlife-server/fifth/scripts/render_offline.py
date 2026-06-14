"""
render_offline.py — wav + base 이미지 2장 → 립싱크 mp4 (Plan 1/2 통합)

사용법 (컨테이너 /root/FasterLivePortrait 에서):

  [Plan 2 블렌드 모드] closed_src + open_src 모두 지정:
    python render_offline.py \
        --wav gominju_speech.wav \
        --open-src gominju_v2_mouth_rank1_f119.jpg \
        --closed-src gominju_source.jpg \
        --out gominju_out/blend_v1.mp4

  [Plan 1 단일 모드] open_src만 (하위호환):
    python render_offline.py \
        --wav gominju_speech.wav \
        --open-src gominju_gen_open_f36.jpg \
        --out gominju_out/fifth_engine_e2e.mp4

Plan 2 (블렌드):
  발화 강도(RMS)에 따라 closed_src / open_src 프레임을 픽셀 alpha 블렌드.
  - 무음(env 낮음, w=0) → closed_src 프레임 → 완전히 닫힘
  - 발화(env 높음, w=1) → open_src 프레임 → 치아 자연스러움
  - 중간 → 두 프레임 addWeighted 블렌드
  pipe 1개 공유 (VRAM 절약), source 스왑 렌더.
  first_frame 은 source별 독립 (closed_first_frame / open_first_frame).

Plan 1 (단일): --closed-src 미지정 시 기존 동작 유지 (회귀 안전).
"""
import argparse
import copy
import os
import subprocess
import time

import cv2
import numpy as np
import soundfile as sf

from audio2lip import compute_rms_envelope, rms_to_cdlip
from base_source import base_blend_weight
from config import FifthConfig
from flp_engine import FifthFLPEngine


def main():
    ap = argparse.ArgumentParser(description="wav + base 이미지 → 립싱크 mp4 (Plan 1/2)")
    ap.add_argument("--wav", required=True, help="입력 wav 파일 경로")
    ap.add_argument("--open-src", required=True, help="입벌림+치아 base 이미지")
    ap.add_argument(
        "--closed-src",
        default=None,
        help="입다문 base 이미지 (지정 시 Plan 2 블렌드 모드 활성화)",
    )
    ap.add_argument("--cfg-yaml", default="configs/trt_infer.yaml", help="FasterLivePortrait configs yaml")
    ap.add_argument("--out", required=True, help="출력 mp4 경로")
    args = ap.parse_args()

    blend_mode = args.closed_src is not None
    print(f"[mode] {'Plan 2 블렌드' if blend_mode else 'Plan 1 단일'}", flush=True)

    cfg = FifthConfig.from_env()
    print(
        f"[cfg] fps={cfg.fps} lip_closed={cfg.lip_closed} lip_open={cfg.lip_open} "
        f"open_scale={cfg.open_scale} offset={cfg.offset} sigma={cfg.sigma} "
        f"gamma={cfg.gamma} silence={cfg.silence} "
        f"closed_thresh={cfg.closed_thresh} open_thresh={cfg.open_thresh}",
        flush=True,
    )

    # --- 1. 오디오 로드 & 16 kHz 모노 변환 ---
    y, sr = sf.read(args.wav, dtype="float32")
    if y.ndim > 1:
        y = y.mean(axis=1)
    if sr != 16000:
        import torch
        import torchaudio
        y = torchaudio.functional.resample(torch.from_numpy(y), sr, 16000).numpy()
        sr = 16000

    # 빈 wav 가드
    if len(y) == 0:
        print("[ERROR] wav 파일이 비어 있습니다 (0 샘플). 처리 중단.", flush=True)
        return

    dur = len(y) / sr
    print(f"[audio] dur={dur:.2f}s sr={sr}", flush=True)

    # --- 2. RMS envelope 계산 ---
    env = compute_rms_envelope(
        y, sr=sr, fps=cfg.fps, sigma=cfg.sigma,
        silence=cfg.silence, gamma=cfg.gamma,
    )
    print(f"[rms] frames={len(env)} max={env.max():.3f} mean={env.mean():.3f}", flush=True)

    # --- 3. JoyVASA 헤드/눈 motion 생성 ---
    from omegaconf import OmegaConf
    from src.pipelines.joyvasa_audio_to_motion_pipeline import JoyVASAAudio2MotionPipeline

    jcfg = OmegaConf.load(args.cfg_yaml)
    jp = JoyVASAAudio2MotionPipeline(
        motion_model_path=jcfg.joyvasa_models.motion_model_path,
        audio_model_path=jcfg.joyvasa_models.audio_model_path,
        motion_template_path=jcfg.joyvasa_models.motion_template_path,
        cfg_mode=jcfg.infer_params.cfg_mode,
        cfg_scale=2.8,
    )
    # PoC 패턴: 첫 호출 웜업 후 실제 사용 (t068_tune.py L60)
    _ = jp.gen_motion_sequence(args.wav)
    dri = jp.gen_motion_sequence(args.wav)
    ml = dri["motion"]
    ce = dri.get("c_eyes_lst", [])
    nj = dri["n_frames"]
    print(f"[joyvasa] n_frames={nj} c_eyes={'yes' if ce else 'no'}", flush=True)

    # --- 4. FLP 엔진 초기화 + source 로드 ---
    eng = FifthFLPEngine(args.cfg_yaml)

    if blend_mode:
        # ---- Plan 2 블렌드 모드 ----
        # pipe 1개 공유. load_source를 2번 호출 — 두 번째 호출이 self.src_img/src_info를 덮음.
        # 각 source 상태를 dict로 보관해 render() 주입 방식으로 스왑.

        closed_s = eng.load_source(args.closed_src)
        open_s = eng.load_source(args.open_src)

        # 동적 lip_close_ratio 실측값 로그
        print(
            f"[lip_closed] closed_src dyn={closed_s['lip_close_ratio']:.4f}  "
            f"open_src dyn={open_s['lip_close_ratio']:.4f}",
            flush=True,
        )

        # source별 클램프: lip_open * 0.85 상한 (c_d_lip 단조성 보장)
        def _clamp_ratio(dyn, label):
            if dyn > 0.0:
                clamped = min(dyn, cfg.lip_open * 0.85)
                print(
                    f"[lip_closed/{label}] dynamic={dyn:.4f} → clamped={clamped:.4f}",
                    flush=True,
                )
                return clamped
            fallback = cfg.lip_closed
            print(f"[lip_closed/{label}] 실측 실패 → fallback={fallback:.4f}", flush=True)
            return fallback

        lip_closed_closed = _clamp_ratio(closed_s["lip_close_ratio"], "closed_src")
        lip_closed_open = _clamp_ratio(open_s["lip_close_ratio"], "open_src")

        # source별 c_d_lip 시퀀스 (각자 lip_closed 기준)
        cdl_closed = rms_to_cdlip(
            env,
            lip_closed=lip_closed_closed,
            lip_open=cfg.lip_open,
            open_scale=cfg.open_scale,
            offset=cfg.offset,
        )
        cdl_open = rms_to_cdlip(
            env,
            lip_closed=lip_closed_open,
            lip_open=cfg.lip_open,
            open_scale=cfg.open_scale,
            offset=cfg.offset,
        )

        # --- 5. 블렌드 프레임 렌더 ---
        n = max(len(env), nj)
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        raw = args.out.replace(".mp4", "_raw.mp4")
        vout = cv2.VideoWriter(raw, cv2.VideoWriter_fourcc(*"mp4v"), cfg.fps, (512, 512))
        render_times = []

        # first_frame 은 source별 독립 상태 유지
        closed_first = True
        open_first = True

        for i in range(n):
            ji = min(i, nj - 1)
            cdl_c = float(cdl_closed[min(i, len(cdl_closed) - 1)]) if len(cdl_closed) else lip_closed_closed
            cdl_o = float(cdl_open[min(i, len(cdl_open) - 1)]) if len(cdl_open) else lip_closed_open
            w = base_blend_weight(float(env[min(i, len(env) - 1)]), cfg.closed_thresh, cfg.open_thresh)

            t0 = time.perf_counter()

            # closed_src 렌더 (w < 1 일 때만 — w=1이면 완전 open)
            frame_closed = None
            if w < 1.0:
                frame_closed = eng.render(
                    ml[ji], ce[ji] if ce else None, cdl_c,
                    first_frame=closed_first,
                    src_img=closed_s["src_img"],
                    src_info=closed_s["src_info"],
                )
                closed_first = False

            # open_src 렌더 (w > 0 일 때만 — w=0이면 완전 closed)
            frame_open = None
            if w > 0.0:
                frame_open = eng.render(
                    ml[ji], ce[ji] if ce else None, cdl_o,
                    first_frame=open_first,
                    src_img=open_s["src_img"],
                    src_info=open_s["src_info"],
                )
                open_first = False

            elapsed_ms = (time.perf_counter() - t0) * 1000
            render_times.append(elapsed_ms)

            # 블렌드 합성 (둘 다 None이면 폴백 없음 — 프레임 스킵)
            if frame_closed is not None and frame_open is not None:
                # cv2.addWeighted: uint8 기대 → RGB uint8 변환
                fc_u8 = frame_closed.astype(np.uint8)
                fo_u8 = frame_open.astype(np.uint8)
                blended = cv2.addWeighted(fc_u8, 1.0 - w, fo_u8, w, 0)
                vout.write(cv2.cvtColor(blended, cv2.COLOR_RGB2BGR))
            elif frame_open is not None:
                vout.write(cv2.cvtColor(frame_open.astype(np.uint8), cv2.COLOR_RGB2BGR))
            elif frame_closed is not None:
                vout.write(cv2.cvtColor(frame_closed.astype(np.uint8), cv2.COLOR_RGB2BGR))

            if i % 25 == 0:
                print(
                    f"  frame {i}/{n}  cdl_c={cdl_c:.4f} cdl_o={cdl_o:.4f}  "
                    f"w={w:.3f}  render={elapsed_ms:.1f}ms",
                    flush=True,
                )

        vout.release()

    else:
        # ---- Plan 1 단일 모드 (하위호환) ----
        src_d = eng.load_source(args.open_src)
        dyn_lip_closed = src_d["lip_close_ratio"]

        # C-2 클램프
        if dyn_lip_closed > 0.0:
            lip_closed = min(dyn_lip_closed, cfg.lip_open * 0.85)
            print(
                f"[lip_closed] dynamic={dyn_lip_closed:.4f} clamped={lip_closed:.4f} "
                f"(lip_open={cfg.lip_open} * 0.85 = {cfg.lip_open * 0.85:.4f})",
                flush=True,
            )
        else:
            lip_closed = cfg.lip_closed
            print(
                f"[lip_closed] dynamic 실측 실패 → fallback cfg.lip_closed={lip_closed:.4f}",
                flush=True,
            )

        c_d_lip_seq = rms_to_cdlip(
            env,
            lip_closed=lip_closed,
            lip_open=cfg.lip_open,
            open_scale=cfg.open_scale,
            offset=cfg.offset,
        )

        n = max(len(env), nj)
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        raw = args.out.replace(".mp4", "_raw.mp4")
        vout = cv2.VideoWriter(raw, cv2.VideoWriter_fourcc(*"mp4v"), cfg.fps, (512, 512))
        render_times = []

        for i in range(n):
            ji = min(i, nj - 1)
            cdl = float(c_d_lip_seq[min(i, len(c_d_lip_seq) - 1)]) if len(c_d_lip_seq) else lip_closed

            t0 = time.perf_counter()
            frame = eng.render(ml[ji], ce[ji] if ce else None, cdl, first_frame=(i == 0))
            elapsed_ms = (time.perf_counter() - t0) * 1000
            render_times.append(elapsed_ms)

            if frame is not None:
                vout.write(cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))

            if i % 25 == 0:
                print(f"  frame {i}/{n}  cdl={cdl:.4f}  render={elapsed_ms:.1f}ms", flush=True)

        vout.release()

    # --- 6. 렌더 통계 ---
    if render_times:
        avg_ms = np.mean(render_times)
        print(f"[render] total={n} frames  avg={avg_ms:.1f}ms  raw={raw}", flush=True)
    else:
        print("[render] 프레임 없음 — 빈 영상 생성됨", flush=True)

    # --- 7. ffmpeg mux (video + audio) ---
    env_ff = {
        **os.environ,
        "LD_LIBRARY_PATH": "/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib:"
                           + os.environ.get("LD_LIBRARY_PATH", ""),
    }
    subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", raw,
            "-i", args.wav,
            "-c:v", "libx264", "-crf", "18", "-preset", "fast",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest", args.out,
        ],
        check=True,
        env=env_ff,
    )
    print(f"[DONE] {args.out}", flush=True)


if __name__ == "__main__":
    main()
