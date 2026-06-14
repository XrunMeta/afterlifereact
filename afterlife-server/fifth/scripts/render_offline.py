"""
render_offline.py — wav + base 이미지 2장 → 립싱크 mp4 (Plan 1 통합 E2E)

사용법 (컨테이너 /root/FasterLivePortrait 에서):
    python render_offline.py \
        --wav gominju_speech.wav \
        --open-src gominju_gen_open_f36.jpg \
        --closed-src gominju_source.jpg \
        --out gominju_out/fifth_engine_e2e.mp4

Plan 1: open_src 단일 워핑으로 닫기/벌리기 커버 (closed_src는 Plan 2 용도로 수신만 함).
JoyVASA가 헤드/눈 motion 생성, RMS → c_d_lip 로 입을 직접 구동.
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
from base_source import base_blend_weight  # noqa: F401 (Plan 2 예정)
from config import FifthConfig
from flp_engine import FifthFLPEngine


def main():
    ap = argparse.ArgumentParser(description="wav + base 이미지 → 립싱크 mp4 (Plan 1)")
    ap.add_argument("--wav", required=True, help="입력 wav 파일 경로")
    ap.add_argument("--open-src", required=True, help="입벌림+치아 base 이미지 (Plan 1 워핑 소스)")
    ap.add_argument("--closed-src", required=True, help="입다문 base 이미지 (Plan 2 용도, 현재 미사용)")
    ap.add_argument("--cfg-yaml", default="configs/trt_infer.yaml", help="FasterLivePortrait configs yaml")
    ap.add_argument("--out", required=True, help="출력 mp4 경로")
    args = ap.parse_args()

    cfg = FifthConfig.from_env()
    print(f"[cfg] fps={cfg.fps} lip_closed={cfg.lip_closed} lip_open={cfg.lip_open} "
          f"open_scale={cfg.open_scale} offset={cfg.offset} sigma={cfg.sigma} "
          f"gamma={cfg.gamma} silence={cfg.silence}", flush=True)

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
    # c_d_lip_seq는 step 4b에서 동적 lip_closed 확정 후 생성 (동적 실측 먼저, 시퀀스 나중).
    env = compute_rms_envelope(
        y, sr=sr, fps=cfg.fps, sigma=cfg.sigma,
        silence=cfg.silence, gamma=cfg.gamma,
    )
    print(f"[rms] frames={len(env)} max={env.max():.3f} mean={env.mean():.3f}", flush=True)
    # offset=2 메모: 입이 오디오보다 2프레임(80ms@25fps) 선행. 싱크 어긋나면 cfg.offset 튜닝.

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

    # --- 4. FLP 엔진 초기화 + open_src 로드 ---
    # Plan 1: open_src 단일 워핑 (치아 prior 보존). closed_src는 Plan 2에서 도입.
    eng = FifthFLPEngine(args.cfg_yaml)
    dyn_lip_closed = eng.load_source(args.open_src)

    # C-2 클램프: 동적값이 lip_open 이상이면 c_d_lip 단조성 깨짐 → 역전 방지
    if dyn_lip_closed > 0.0:
        lip_closed = min(dyn_lip_closed, cfg.lip_open * 0.85)
        print(
            f"[lip_closed] dynamic={dyn_lip_closed:.4f} clamped={lip_closed:.4f} "
            f"(lip_open={cfg.lip_open} * 0.85 = {cfg.lip_open * 0.85:.4f})",
            flush=True,
        )
    else:
        # load_source 동적 실측 실패 시 config 기본값 폴백
        lip_closed = cfg.lip_closed
        print(
            f"[lip_closed] dynamic 실측 실패 → fallback cfg.lip_closed={lip_closed:.4f}",
            flush=True,
        )

    # --- 4b. RMS → c_d_lip 시퀀스 재생성 (동적 lip_closed 적용) ---
    c_d_lip_seq = rms_to_cdlip(
        env,
        lip_closed=lip_closed,
        lip_open=cfg.lip_open,
        open_scale=cfg.open_scale,
        offset=cfg.offset,
    )

    # --- 5. 프레임 렌더 ---
    n = max(len(env), nj)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    raw = args.out.replace(".mp4", "_raw.mp4")

    vout = cv2.VideoWriter(raw, cv2.VideoWriter_fourcc(*"mp4v"), cfg.fps, (512, 512))
    render_times = []

    for i in range(n):
        ji = min(i, nj - 1)
        # 빈 env 가드: c_d_lip_seq가 없으면 lip_closed 폴백
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

    if render_times:
        avg_ms = np.mean(render_times)
        print(f"[render] total={n} frames  avg={avg_ms:.1f}ms  raw={raw}", flush=True)
    else:
        print("[render] 프레임 없음 — 빈 영상 생성됨", flush=True)

    # --- 6. ffmpeg mux (video + audio) ---
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
