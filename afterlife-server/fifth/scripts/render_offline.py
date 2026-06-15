"""
render_offline.py — wav + base 이미지 2장 → 립싱크 mp4 (Plan 1/2 통합)

사용법 (컨테이너 /root/FasterLivePortrait 에서):

  [입마스크 블렌드 — 부들거림 근본 제거]:
    python render_offline.py \
        --wav gominju_speech.wav \
        --open-src gominju_v2_mouth_rank1_f119.jpg \
        --closed-src gominju_source.jpg \
        --align-sources --align-mode affine \
        --blend-region mouth \
        --out gominju_out/mouth_blend_v1.mp4

  [전체 블렌드 (기존 align_v2)]:
    python render_offline.py \
        --wav gominju_speech.wav \
        --open-src gominju_v2_mouth_rank1_f119.jpg \
        --closed-src gominju_source.jpg \
        --blend-region full \
        --out gominju_out/blend_v1.mp4

  [Plan 1 단일 모드] open_src만 (하위호환):
    python render_offline.py \
        --wav gominju_speech.wav \
        --open-src gominju_gen_open_f36.jpg \
        --out gominju_out/fifth_engine_e2e.mp4

Plan 2 (블렌드):
  --blend-region mouth (기본, v6):
    얼굴·배경은 항상 open_src 단일 프레임 사용 → 부들거림 원천 제거.
    입 영역 마스크 M만 closed/open 블렌드.
    - 무음(w=0): 입 영역 = closed_src(다묾) / 나머지 = open_src
    - 발화(w=1): 전체 = open_src (치아, 단일 소스 → 완전 잔상 없음)
    - 중간: 입 영역만 살짝 블렌드
    식: out = frame_open*(1-M) + (frame_closed*(1-w) + frame_open*w)*M
      = frame_open + M*(frame_closed*(1-w) - frame_open*(1-w))
      = frame_open*(1 - M*(1-w)) + frame_closed*(M*(1-w))

  --blend-region full (구 align_v2):
    전체 프레임 addWeighted 블렌드 (얼굴/배경 포함).
    부들거림 발생 가능. 회귀·비교용 유지.

  pipe 1개 공유 (VRAM 절약), source 스왑 렌더.
  first_frame 은 source별 독립 (closed_first_frame / open_first_frame).

  [v4] --align-sources 플래그:
    closed_src 를 open_src 의 crop box(M_o2c)로 강제 재크롭 → 두 source 출력 얼굴
    크기/위치를 통일해 블렌드 jitter 제거.

  [v6] --blend-region mouth:
    입 landmark(48~107) convexHull + dilate + GaussianBlur feather 마스크.
    얼굴·배경은 항상 open_src 단일 → 부들거림 없음.

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


def make_blink_sequence(
    n_frames: int,
    fps: float,
    eye_open_ratio: float,
    eye_closed_ratio: float,
    avg_interval_sec: float = 3.2,
    blink_dur_frames: int = 6,
) -> list:
    """idle 눈 깜빡임 시퀀스 생성 (JoyVASA c_eyes 부재 시 대용).

    FLP calc_combined_eye_ratio() 계약:
      c_d_eyes_i = np.array(c_d_eyes_i).reshape(1, 1)  → 스칼라 1개
    따라서 각 프레임에서 c_eyes = [[ratio_val]] (1×1 float32) 로 반환.

    눈 방향:
      열림 = 큰 ratio (source 실측 ~0.37)
      감김 = 작은 ratio (≈ 0.0)

    깜빡임 곡선 (반正弦: 부드러운 down→up):
      frame 0~dur: ratio = open * (1 - sin(pi * t / dur))  (0에서 최소→복귀)
      나머지: ratio = open

    간격 변동: avg_interval 기준으로 3가지 간격 [0.85, 1.05, 1.10] 순환 적용 → 기계적 패턴 회피.

    Args:
        n_frames:         전체 프레임 수.
        fps:              출력 FPS.
        eye_open_ratio:   source 실측 눈 열림 ratio (calc_eye_close_ratio 결과, ~0.37).
        eye_closed_ratio: 완전 감김 ratio (기본 0.0).
        avg_interval_sec: 평균 깜빡임 간격(초). 기본 3.2.
        blink_dur_frames: 깜빡임 1회 지속 프레임 수. 기본 6 (25fps에서 240ms).

    Returns:
        list of np.ndarray (1,1) float32, length=n_frames.
        각 원소: 해당 프레임의 c_d_eyes_i 값 (스칼라 1개).
    """
    # 고정 간격 변동 패턴 (순환) — 의사난수 / deterministic
    interval_multipliers = [0.85, 1.10, 0.92, 1.08, 0.95]
    base_interval = int(round(avg_interval_sec * fps))

    # 깜빡임 시작 프레임 목록 생성
    blink_starts = []
    f = base_interval  # 첫 깜빡임은 1간격 후 시작
    mi = 0
    while f + blink_dur_frames < n_frames:
        blink_starts.append(f)
        mult = interval_multipliers[mi % len(interval_multipliers)]
        mi += 1
        f += max(blink_dur_frames + 2, int(round(base_interval * mult)))

    # 프레임별 ratio 시퀀스
    seq = []
    # 열림 ratio를 (1,1) array로 캐시
    open_arr = np.array([[eye_open_ratio]], dtype=np.float32)

    for i in range(n_frames):
        # 이 프레임이 어떤 깜빡임 구간에 속하는지 확인
        ratio_val = eye_open_ratio
        for bs in blink_starts:
            offset = i - bs
            if 0 <= offset < blink_dur_frames:
                # 반正弦 커브: 0→최소→복귀 (smooth down & up)
                t = offset / max(blink_dur_frames - 1, 1)
                factor = np.sin(np.pi * t)  # 0→1→0
                ratio_val = eye_open_ratio * (1.0 - factor) + eye_closed_ratio * factor
                break
        seq.append(np.array([[ratio_val]], dtype=np.float32))

    return seq


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
    ap.add_argument(
        "--align-sources",
        action="store_true",
        default=False,
        help="[v4] closed_src 를 open_src 기준으로 정렬 (jitter 제거). 블렌드 모드 전용.",
    )
    ap.add_argument(
        "--align-mode",
        choices=["crop", "affine"],
        default="crop",
        help=(
            "[v5] 정렬 모드. "
            "'crop'(B1, 기본): ref crop box 재크롭. "
            "'affine'(B2): 눈·코 3점 landmark similarity transform → 구도·크기 정밀 정렬."
        ),
    )
    ap.add_argument(
        "--w-sigma",
        type=float,
        default=1.0,
        help="[v4] 블렌드 가중치 w 시퀀스 Gaussian 스무딩 sigma (0=비활성). 기본 1.0.",
    )
    ap.add_argument(
        "--blend-region",
        choices=["mouth", "full"],
        default="mouth",
        help=(
            "[v6] 블렌드 영역. "
            "'mouth'(기본): 입 마스크 영역만 블렌드 → 얼굴/배경 단일(open_src), 부들거림 없음. "
            "'full'(구 align_v2): 전체 addWeighted 블렌드 (비교·회귀용)."
        ),
    )
    ap.add_argument(
        "--mouth-dilate",
        type=int,
        default=28,
        help="[v6] 입 마스크 dilate 픽셀 (기본 28). 크게 할수록 입 주변 더 넓게 포함.",
    )
    ap.add_argument(
        "--mouth-feather",
        type=int,
        default=22,
        help="[v6] 입 마스크 GaussianBlur feather sigma (기본 22). 클수록 경계 더 부드러움.",
    )
    ap.add_argument(
        "--save-frames",
        default=None,
        help="[v6] 프레임 png 저장 디렉토리 경로. 지정 시 매 프레임 png 저장.",
    )
    args = ap.parse_args()

    blend_mode = args.closed_src is not None
    blend_region = args.blend_region if blend_mode else "n/a"
    print(
        f"[mode] {'Plan 2 블렌드' if blend_mode else 'Plan 1 단일'}"
        + (f" blend_region={blend_region} align_sources={args.align_sources} "
           f"align_mode={args.align_mode} w_sigma={args.w_sigma}" if blend_mode else ""),
        flush=True,
    )

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
    # FIFTH_CFG_SCALE 환경변수로 cfg_scale 조절 가능 (기본 2.8 — 미세 자연 움직임).
    # 3.5: 더 강한 머리/표정. 1.5 이하: 약한 움직임.
    _joyvasa_cfg_scale = float(os.environ.get("FIFTH_CFG_SCALE", "2.8"))
    jp = JoyVASAAudio2MotionPipeline(
        motion_model_path=jcfg.joyvasa_models.motion_model_path,
        audio_model_path=jcfg.joyvasa_models.audio_model_path,
        motion_template_path=jcfg.joyvasa_models.motion_template_path,
        cfg_mode=jcfg.infer_params.cfg_mode,
        cfg_scale=_joyvasa_cfg_scale,
    )
    print(f"[joyvasa] cfg_scale={_joyvasa_cfg_scale}", flush=True)
    # PoC 패턴: 첫 호출 웜업 후 실제 사용 (t068_tune.py L60)
    _ = jp.gen_motion_sequence(args.wav)
    dri = jp.gen_motion_sequence(args.wav)
    ml = dri["motion"]
    ce_raw = dri.get("c_eyes_lst", [])
    nj = dri["n_frames"]
    print(f"[joyvasa] n_frames={nj} c_eyes={'yes' if ce_raw else 'no'}", flush=True)

    # --- 3b. idle 눈 깜빡임 시퀀스 생성 (FIFTH_BLINK=1 기본) ---
    _blink_enabled = os.environ.get("FIFTH_BLINK", "1") == "1"
    _blink_interval = float(os.environ.get("FIFTH_BLINK_INTERVAL", "3.2"))
    _blink_dur = int(os.environ.get("FIFTH_BLINK_DUR", "6"))
    # source 실측 눈 열림 ratio — FLP gominju 실측값 기반 기본값 0.37.
    # 실제 source 로드 후 재계산되므로 이 단계에서는 기본값으로 생성 후 후속 주입.
    # (source 로드 전이므로 일단 0.37 default 사용 — 아래 source 로드 후 갱신)
    _EYE_OPEN_DEFAULT = 0.37
    _EYE_CLOSED = 0.0

    if _blink_enabled:
        n_total_est = max(len(env), nj)
        _blink_seq_default = make_blink_sequence(
            n_total_est, cfg.fps, _EYE_OPEN_DEFAULT, _EYE_CLOSED,
            avg_interval_sec=_blink_interval, blink_dur_frames=_blink_dur,
        )
        print(
            f"[blink] ENABLED  interval={_blink_interval}s  dur={_blink_dur}frames  "
            f"fps={cfg.fps}  total_blinks≈{int(n_total_est / cfg.fps / _blink_interval)}",
            flush=True,
        )
    else:
        _blink_seq_default = None
        print("[blink] DISABLED (FIFTH_BLINK=0)", flush=True)

    # ce: JoyVASA 있으면 우선, 없으면 idle 깜빡임 사용.
    # JoyVASA c_eyes_lst가 있는 경우: 원본 그대로.
    # 없는 경우(이 wav): idle 깜빡임 시퀀스 주입.
    # 형식 통일: c_eyes per frame = np.ndarray (1,1) float32 (c_d_eyes_i 스칼라).
    if ce_raw:
        ce = ce_raw
        print("[blink] JoyVASA c_eyes 있음 → 원본 사용 (idle blink 미적용)", flush=True)
    else:
        ce = _blink_seq_default  # None(off) or list of (1,1) arrays
        if ce:
            print("[blink] JoyVASA c_eyes 없음 → idle blink 시퀀스 주입", flush=True)

    # --- 4. FLP 엔진 초기화 + source 로드 ---
    eng = FifthFLPEngine(args.cfg_yaml)

    def _get_eye_open_ratio(src_dict: dict) -> float:
        """source dict lmk에서 눈 열림 ratio 실측. 실패 시 기본값 0.37 반환."""
        try:
            from src.utils.utils import calc_eye_close_ratio as _cecr
            lmk = src_dict["src_info"][0][1]  # (N,2)
            r = _cecr(lmk[None])  # (1,2) [left, right]
            eye_open = float((r[0, 0] + r[0, 1]) / 2.0)
            print(f"[blink] source eye_open_ratio 실측: left={r[0,0]:.4f} right={r[0,1]:.4f} avg={eye_open:.4f}", flush=True)
            return eye_open
        except Exception as e:
            print(f"[blink] eye_open_ratio 실측 실패({e}) → 기본값 0.37 사용", flush=True)
            return 0.37

    def _rebuild_blink_seq_if_needed(src_dict: dict, n_frames: int) -> list:
        """source 실측 눈 ratio로 blink 시퀀스 재생성. blink off 시 None 반환."""
        if not _blink_enabled:
            return None
        eye_open = _get_eye_open_ratio(src_dict)
        seq = make_blink_sequence(
            n_frames, cfg.fps, eye_open, _EYE_CLOSED,
            avg_interval_sec=_blink_interval, blink_dur_frames=_blink_dur,
        )
        return seq

    if blend_mode:
        # ---- Plan 2 블렌드 모드 ----
        # pipe 1개 공유. load_source를 2번 호출 — 두 번째 호출이 self.src_img/src_info를 덮음.
        # 각 source 상태를 dict로 보관해 render() 주입 방식으로 스왑.

        closed_s = eng.load_source(args.closed_src)
        open_s = eng.load_source(args.open_src)

        # [v4/v5] 정렬: B1(crop) or B2(affine)
        if args.align_sources:
            mode_label = "B2/affine" if args.align_mode == "affine" else "B1/crop"
            print(f"[align] closed_src → open_src 기준 정렬 시작... (mode={mode_label})", flush=True)
            closed_s = eng.align_source_to_ref(target_s=closed_s, ref_s=open_s, mode=args.align_mode)
            print("[align] 완료.", flush=True)

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

        # [blink] JoyVASA c_eyes 없는 경우: source 실측 눈 ratio로 blink 시퀀스 재생성
        n_blend_est = max(len(env), nj)
        if not ce_raw and _blink_enabled:
            ce = _rebuild_blink_seq_if_needed(open_s, n_blend_est)

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

        # [v4] w 시퀀스 사전 계산 + Gaussian 스무딩 (전환 부드럽게)
        w_seq = np.array(
            [base_blend_weight(float(env[min(i, len(env) - 1)]), cfg.closed_thresh, cfg.open_thresh)
             for i in range(n)],
            dtype=np.float32,
        )
        if args.w_sigma > 0.0:
            from scipy.ndimage import gaussian_filter1d as _gf1d
            w_seq = np.clip(_gf1d(w_seq, sigma=args.w_sigma), 0.0, 1.0).astype(np.float32)
            print(f"[w_smooth] sigma={args.w_sigma}  w_seq max={w_seq.max():.3f} mean={w_seq.mean():.3f}", flush=True)

        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        if args.save_frames:
            os.makedirs(args.save_frames, exist_ok=True)
            print(f"[save_frames] 프레임 png 저장 경로: {args.save_frames}", flush=True)
        raw = args.out.replace(".mp4", "_raw.mp4")
        vout = cv2.VideoWriter(raw, cv2.VideoWriter_fourcc(*"mp4v"), cfg.fps, (512, 512))
        render_times = []

        # [v6] 입마스크 모드: open_src lmk를 한 번만 추출 (정렬 후 고정 lmk 사용)
        # 입 위치는 open_src 기준 (aligned closed와 lmk 일치 — 정렬 보장)
        _mouth_mask_lmk = None
        if blend_region == "mouth":
            try:
                _open_lmk = open_s["src_info"][0][1]  # (N,2) crop 좌표계
                _mouth_mask_lmk = _open_lmk
                print(
                    f"[mouth_mask] open_src lmk shape={_open_lmk.shape}  "
                    f"dilate={args.mouth_dilate}  feather={args.mouth_feather}",
                    flush=True,
                )
                # 마스크 1회 생성 (입 위치 고정 — landmark는 static source 기준)
                _M_static = eng.build_mouth_mask(
                    _mouth_mask_lmk, img_size=512,
                    dilate_px=args.mouth_dilate,
                    feather_sigma=args.mouth_feather,
                )
                print(
                    f"[mouth_mask] 생성완료  mask max={_M_static.max():.3f} "
                    f"nonzero_ratio={(_M_static > 0.1).mean():.3f}",
                    flush=True,
                )
            except Exception as e:
                import traceback
                print(f"[mouth_mask] lmk 추출 실패({e}) → full blend 폴백", flush=True)
                traceback.print_exc()
                blend_region = "full"
                _M_static = None
        else:
            _M_static = None

        # first_frame 은 source별 독립 상태 유지
        closed_first = True
        open_first = True

        for i in range(n):
            ji = min(i, nj - 1)
            cdl_c = float(cdl_closed[min(i, len(cdl_closed) - 1)]) if len(cdl_closed) else lip_closed_closed
            cdl_o = float(cdl_open[min(i, len(cdl_open) - 1)]) if len(cdl_open) else lip_closed_open
            w = float(w_seq[i])

            t0 = time.perf_counter()

            if blend_region == "mouth":
                # ---- [v6] 입마스크 블렌드 ----
                # open_src는 항상 렌더 (얼굴/배경 기반, 발화 시 입도 이걸로)
                _ce_i = ce[min(i, len(ce) - 1)] if ce else None
                frame_open = eng.render(
                    ml[ji], _ce_i, cdl_o,
                    first_frame=open_first,
                    src_img=open_s["src_img"],
                    src_info=open_s["src_info"],
                )
                open_first = False

                # closed_src는 w < 1.0일 때만 (완전 발화면 입도 open_src)
                frame_closed = None
                if w < 1.0 - 1e-4:
                    frame_closed = eng.render(
                        ml[ji], _ce_i, cdl_c,
                        first_frame=closed_first,
                        src_img=closed_s["src_img"],
                        src_info=closed_s["src_info"],
                    )
                    closed_first = False

                elapsed_ms = (time.perf_counter() - t0) * 1000
                render_times.append(elapsed_ms)

                if frame_open is not None:
                    fo_f32 = frame_open.astype(np.float32)

                    if frame_closed is not None and _M_static is not None:
                        # 입마스크 블렌드 공식:
                        # mouth_region = frame_closed*(1-w) + frame_open*w  (w=0→closed입, w=1→open입)
                        # out = frame_open*(1-M) + mouth_region*M
                        #     = frame_open + M*(mouth_region - frame_open)
                        #     = frame_open + M*(frame_closed*(1-w) - frame_open*(1-w))
                        #     = frame_open*(1 - M*(1-w)) + frame_closed*(M*(1-w))
                        fc_f32 = frame_closed.astype(np.float32)
                        alpha = _M_static * (1.0 - w)  # (H,W,1), 무음=M, 발화=0
                        out_f32 = fo_f32 * (1.0 - alpha) + fc_f32 * alpha
                        out_u8 = np.clip(out_f32, 0, 255).astype(np.uint8)
                    else:
                        # closed 렌더 없음(w≈1) → 순수 open_src
                        out_u8 = fo_f32.astype(np.uint8)

                    if args.save_frames:
                        png_path = os.path.join(args.save_frames, f"frame_{i:05d}.png")
                        cv2.imwrite(png_path, cv2.cvtColor(out_u8, cv2.COLOR_RGB2BGR))
                    vout.write(cv2.cvtColor(out_u8, cv2.COLOR_RGB2BGR))

            else:
                # ---- full blend (구 align_v2) ----
                _ce_i = ce[min(i, len(ce) - 1)] if ce else None
                # closed_src 렌더 (w < 1 일 때만 — w=1이면 완전 open)
                frame_closed = None
                if w < 1.0:
                    frame_closed = eng.render(
                        ml[ji], _ce_i, cdl_c,
                        first_frame=closed_first,
                        src_img=closed_s["src_img"],
                        src_info=closed_s["src_info"],
                    )
                    closed_first = False

                # open_src 렌더 (w > 0 일 때만 — w=0이면 완전 closed)
                frame_open = None
                if w > 0.0:
                    frame_open = eng.render(
                        ml[ji], _ce_i, cdl_o,
                        first_frame=open_first,
                        src_img=open_s["src_img"],
                        src_info=open_s["src_info"],
                    )
                    open_first = False

                elapsed_ms = (time.perf_counter() - t0) * 1000
                render_times.append(elapsed_ms)

                # 블렌드 합성 (둘 다 None이면 폴백 없음 — 프레임 스킵)
                if frame_closed is not None and frame_open is not None:
                    fc_u8 = frame_closed.astype(np.uint8)
                    fo_u8 = frame_open.astype(np.uint8)
                    blended = cv2.addWeighted(fc_u8, 1.0 - w, fo_u8, w, 0)
                    if args.save_frames:
                        png_path = os.path.join(args.save_frames, f"frame_{i:05d}.png")
                        cv2.imwrite(png_path, cv2.cvtColor(blended, cv2.COLOR_RGB2BGR))
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

        # [blink] JoyVASA c_eyes 없는 경우: source 실측 눈 ratio로 blink 시퀀스 재생성
        n_single_est = max(len(env), nj)
        if not ce_raw and _blink_enabled:
            ce = _rebuild_blink_seq_if_needed(src_d, n_single_est)

        # 단일 모드: lip_closed = cfg.lip_closed (낮은 고정값, 0.0023)
        # - 동적 ratio(dyn_lip_closed ≈ 0.313)를 lower-bound로 쓰면
        #   무음(env=0) 시에도 입이 벌어지는 D1 문제 발생 → 단일 모드에서는 사용 안 함.
        # - 동적 ratio 로그는 참고용으로만 남김 (코드 삭제 X).
        lip_closed = cfg.lip_closed  # 단일 모드 고정: 낮은 값으로 무음 시 입 완전 닫힘
        print(
            f"[lip_closed/single] dyn(참고)={dyn_lip_closed:.4f}  "
            f"사용값=cfg.lip_closed={lip_closed:.4f}  "
            f"lip_open={cfg.lip_open}",
            flush=True,
        )

        # c_d_lip 스무딩 (FIFTH_CDLIP_SMOOTH=1 시 활성, 기본 off — 회귀 안전)
        _smooth_cdlip = os.environ.get("FIFTH_CDLIP_SMOOTH", "0") == "1"

        c_d_lip_seq = rms_to_cdlip(
            env,
            lip_closed=lip_closed,
            lip_open=cfg.lip_open,
            open_scale=cfg.open_scale,
            offset=cfg.offset,
        )

        if _smooth_cdlip:
            from scipy.ndimage import gaussian_filter1d as _gf1d
            _cdlip_sigma = float(os.environ.get("FIFTH_CDLIP_SIGMA", "1.5"))
            c_d_lip_seq = _gf1d(c_d_lip_seq.astype(np.float64), sigma=_cdlip_sigma).astype(np.float32)
            print(f"[cdlip_smooth] FIFTH_CDLIP_SMOOTH=1, sigma={_cdlip_sigma}", flush=True)

        n = max(len(env), nj)
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        raw = args.out.replace(".mp4", "_raw.mp4")
        vout = cv2.VideoWriter(raw, cv2.VideoWriter_fourcc(*"mp4v"), cfg.fps, (512, 512))
        render_times = []

        for i in range(n):
            ji = min(i, nj - 1)
            cdl = float(c_d_lip_seq[min(i, len(c_d_lip_seq) - 1)]) if len(c_d_lip_seq) else lip_closed

            t0 = time.perf_counter()
            _ce_i = ce[min(i, len(ce) - 1)] if ce else None
            frame = eng.render(ml[ji], _ce_i, cdl, first_frame=(i == 0))
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
