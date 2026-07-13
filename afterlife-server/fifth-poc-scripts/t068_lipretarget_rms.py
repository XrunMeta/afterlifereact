"""
T-068 방향 A — LivePortrait lip retargeting × RMS envelope 직접 구동

핵심 전략:
- flag_lip_retargeting=True: retarget_lip(x_s, combined_lip_ratio) 모델이 x_s를 직접 변형
- c_d_lip_i (driving lip close ratio): 입 열림/닫힘 비율
  - calc_lip_close_ratio = |lmk[90]-lmk[102]| / |lmk[48]-lmk[66]|
    (상하 입술 세로 거리 / 입 가로 너비)
  - 작을수록 닫힘, 클수록 열림
- RMS 매핑: c_d_lip = lip_closed_ratio + rms * (lip_open_target - lip_closed_ratio)
  - lip_closed_ratio = source lmk에서 calc_lip_close_ratio (자연 닫힘)
  - lip_open_target = 0.5 (실험값 — source 닫힘 ratio + 여유)

산출:
- /root/FasterLivePortrait/gominju_out/audio_muxed/acoustic_lipretarget.mp4
- docker cp 로 호스트 /data/afterlife/fifth-poc/audio_muxed/ 복사
"""
import sys, os, time, copy
os.chdir("/root/FasterLivePortrait")
sys.path.insert(0, "/root/FasterLivePortrait")

import numpy as np
import cv2
import torch
from omegaconf import OmegaConf
import subprocess
import torchaudio
from scipy.ndimage import gaussian_filter1d

SRC_CLOSED = "/root/FasterLivePortrait/gominju_source.jpg"
AUDIO      = "/root/FasterLivePortrait/gominju_speech.wav"
CFG_YAML   = "/root/FasterLivePortrait/configs/trt_infer.yaml"
OUT_DIR    = "/root/FasterLivePortrait/gominju_out"
MUXED_DIR  = os.path.join(OUT_DIR, "audio_muxed")
os.makedirs(MUXED_DIR, exist_ok=True)

FPS = 25
# 입 완전 열림 목표 lip ratio (실험값: 자연 말하기 최대 기준)
LIP_OPEN_TARGET   = 0.45   # 크면 더 크게 벌어짐 (0.3~0.6 실험 범위)
OPEN_SCALE        = 1.0    # RMS 최대값에 대한 스케일 (1.0 = LIP_OPEN_TARGET 100% 적용)
SILENCE_THRESH    = 0.05

# ─────────────────────────────────────────────────────────────
# 1. 파이프라인 로드 — lip_retargeting=True
# ─────────────────────────────────────────────────────────────
print("[1] FLP 파이프라인 로드 (lip_retargeting=True)...")
infer_cfg = OmegaConf.load(CFG_YAML)
infer_cfg.infer_params.flag_normalize_lip    = False  # 우리가 직접 제어
infer_cfg.infer_params.flag_lip_retargeting  = True   # 핵심 ON
infer_cfg.infer_params.flag_eye_retargeting  = False
infer_cfg.infer_params.driving_multiplier    = 1.0
infer_cfg.infer_params.animation_region      = "all"  # retargeting 경로는 all
infer_cfg.infer_params.flag_stitching        = True
infer_cfg.infer_params.flag_relative_motion  = True

from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline
from src.pipelines.joyvasa_audio_to_motion_pipeline import JoyVASAAudio2MotionPipeline
from src.utils.utils import calc_lip_close_ratio

pipe = FasterLivePortraitPipeline(cfg=infer_cfg)
ret  = pipe.prepare_source(SRC_CLOSED, realtime=True)
assert ret, "source face detect fail"
src_img  = pipe.src_imgs[0]
src_info = pipe.src_infos[0]

# source lmk → 자연 닫힘 lip ratio
x_s_info  = src_info[0][0]
source_lmk = src_info[0][1] if len(src_info[0]) > 1 else None

if source_lmk is not None:
    lip_closed_ratio = float(calc_lip_close_ratio(source_lmk[None])[0, 0])
else:
    lip_closed_ratio = 0.0   # fallback
print(f"  source lip_closed_ratio: {lip_closed_ratio:.4f}")
print(f"  LIP_OPEN_TARGET: {LIP_OPEN_TARGET}")
print(f"  lip range: [{lip_closed_ratio:.4f} → {LIP_OPEN_TARGET:.4f}]")

# ─────────────────────────────────────────────────────────────
# 2. RMS envelope 추출 (25fps)
# ─────────────────────────────────────────────────────────────
print("\n[2] RMS envelope 추출...")
waveform, sr_orig = torchaudio.load(AUDIO)
if waveform.shape[0] > 1:
    waveform = waveform.mean(dim=0, keepdim=True)
TARGET_SR = 16000
if sr_orig != TARGET_SR:
    waveform = torchaudio.functional.resample(waveform, sr_orig, TARGET_SR)
sr = TARGET_SR
y_wav     = waveform[0].numpy()
audio_dur = len(y_wav) / sr
n_frames  = int(np.ceil(audio_dur * FPS))
hop_len   = max(1, int(sr / FPS))
win_len   = hop_len * 2
print(f"  audio: {audio_dur:.2f}s  sr={sr}  n_frames={n_frames}")

pad_len = win_len
y_pad   = np.pad(y_wav, (pad_len // 2, pad_len), mode='reflect')
frames_arr = np.array([y_pad[i*hop_len: i*hop_len+win_len] for i in range(n_frames)])
rms     = np.sqrt((frames_arr ** 2).mean(axis=1)).astype(np.float32)
rms_sm  = gaussian_filter1d(rms.astype(np.float64), sigma=1.5).astype(np.float32)
rms_max = rms_sm.max()
rms_n   = rms_sm / (rms_max + 1e-8)
rms_g   = np.where(rms_n < SILENCE_THRESH, 0.0, rms_n).astype(np.float32)
print(f"  rms_gated: min={rms_g.min():.3f}  max={rms_g.max():.3f}  mean={rms_g.mean():.3f}")

# ─────────────────────────────────────────────────────────────
# 3. JoyVASA motion 생성 (헤드/눈 motion 재사용)
# ─────────────────────────────────────────────────────────────
print("\n[3] JoyVASA motion 생성...")
joy_pipe = JoyVASAAudio2MotionPipeline(
    motion_model_path=infer_cfg.joyvasa_models.motion_model_path,
    audio_model_path=infer_cfg.joyvasa_models.audio_model_path,
    motion_template_path=infer_cfg.joyvasa_models.motion_template_path,
    cfg_mode=infer_cfg.infer_params.cfg_mode,
    cfg_scale=2.8,
)
_ = joy_pipe.gen_motion_sequence(AUDIO)  # warmup
dri        = joy_pipe.gen_motion_sequence(AUDIO)
motion_list= dri["motion"]
c_eyes_lst = dri.get("c_eyes_lst", [])
n_joy      = dri["n_frames"]
print(f"  JoyVASA frames: {n_joy}  audio frames: {n_frames}")

# ─────────────────────────────────────────────────────────────
# 4. 렌더링 — lip_retargeting 직접 구동
#    c_d_lip_i = lip_closed_ratio + rms * (LIP_OPEN_TARGET - lip_closed_ratio) * OPEN_SCALE
#    → dri_motion_info[2] = c_d_lip_i 로 전달
# ─────────────────────────────────────────────────────────────
print("\n[4] 렌더링 (lip retargeting RMS 구동)...")
out_raw = os.path.join(OUT_DIR, "acoustic_lipretarget_raw.mp4")
fourcc  = cv2.VideoWriter_fourcc(*'mp4v')
vout    = cv2.VideoWriter(out_raw, fourcc, FPS, (512, 512))

render_ms   = []
mouth_deltas= []
lip_ratios  = []
prev_frame  = None
n_render    = max(n_frames, n_joy)

for i in range(n_render):
    joy_idx = min(i, n_joy - 1)
    rms_val = float(rms_g[min(i, n_frames-1)])

    # lip close ratio 계산: rms=0 → lip_closed_ratio, rms=1 → LIP_OPEN_TARGET
    c_d_lip_i = lip_closed_ratio + rms_val * (LIP_OPEN_TARGET - lip_closed_ratio) * OPEN_SCALE
    lip_ratios.append(c_d_lip_i)

    m = copy.deepcopy(motion_list[joy_idx])
    # dri_motion_info = [motion_dict, c_eyes, c_lips]
    # c_lips = c_d_lip_i (scalar → pipeline 내부에서 np.array reshaping)
    frame_info = [m, c_eyes_lst[joy_idx] if c_eyes_lst else None, [c_d_lip_i]]

    t0 = time.perf_counter()
    result = pipe.run_with_pkl(frame_info, src_img, src_info, first_frame=(i == 0))
    elapsed = (time.perf_counter() - t0) * 1000
    if i >= 3:
        render_ms.append(elapsed)

    out_crop = result[0] if result else None
    if out_crop is not None:
        out_bgr = cv2.cvtColor(out_crop, cv2.COLOR_RGB2BGR)
        vout.write(out_bgr)
        if prev_frame is not None:
            mh, mw = out_bgr.shape[:2]
            y0m, y1m = int(mh*0.55), int(mh*0.85)
            x0m, x1m = int(mw*0.25), int(mw*0.75)
            d = float(np.mean(np.abs(
                out_bgr[y0m:y1m, x0m:x1m].astype(np.float32) -
                prev_frame[y0m:y1m, x0m:x1m].astype(np.float32)
            )))
            mouth_deltas.append(d)
        prev_frame = out_bgr.copy()

    if i % 10 == 0:
        print(f"  [{i:3d}/{n_render}] rms={rms_val:.3f}  c_d_lip={c_d_lip_i:.4f}  render={elapsed:.1f}ms")

vout.release()
ra = np.array(render_ms)
print(f"\n  render: mean={ra.mean():.1f}ms  p95={np.percentile(ra,95):.1f}ms")
print(f"  mouth_delta: mean={np.mean(mouth_deltas):.2f}  max={np.max(mouth_deltas):.2f}")
print(f"  lip_ratio range: min={min(lip_ratios):.4f}  max={max(lip_ratios):.4f}")
print(f"  raw saved: {out_raw}")

# ─────────────────────────────────────────────────────────────
# 5. 방향 B — jaw-open 축 탐색 (row별 ±0.05 단독 변조)
#    입 계수 row[6,12,14,17,19,20] x/y/z 각 축 단독 변조 → 어느 row/축이 입 열림인지 판별
# ─────────────────────────────────────────────────────────────
print("\n[5] 방향 B — jaw-open 축 탐색 (probe, 3초 고정 영상)...")

infer_cfg_b = OmegaConf.load(CFG_YAML)
infer_cfg_b.infer_params.flag_normalize_lip   = False
infer_cfg_b.infer_params.flag_lip_retargeting = False
infer_cfg_b.infer_params.flag_eye_retargeting = False
infer_cfg_b.infer_params.driving_multiplier   = 1.0
infer_cfg_b.infer_params.animation_region     = "lip"
infer_cfg_b.infer_params.flag_stitching       = True
infer_cfg_b.infer_params.flag_relative_motion = True

pipe_b = FasterLivePortraitPipeline(cfg=infer_cfg_b)
ret_b  = pipe_b.prepare_source(SRC_CLOSED, realtime=True)
assert ret_b
src_img_b  = pipe_b.src_imgs[0]
src_info_b = pipe_b.src_infos[0]
x_s_info_b = src_info_b[0][0]

PROBE_FRAMES = 75  # 3초 @ 25fps
PROBE_DELTA  = 0.08  # 변조량 (큰 값으로 육안 판별 용이)
LIP_IDX      = [6, 12, 14, 17, 19, 20]
AXIS_NAMES   = ['x', 'y', 'z']

# JoyVASA motion_list[0] (첫 프레임)을 base로 사용 — exp만 source로 덮어씀
# x_s_info에는 R 키가 없으므로 JoyVASA motion에서 R/scale/t/pitch/yaw/roll 가져옴
base_motion = copy.deepcopy(motion_list[0])
base_motion['exp'] = x_s_info_b['exp'].copy()  # source exp로 고정

probe_dir = os.path.join(OUT_DIR, "probe_b")
os.makedirs(probe_dir, exist_ok=True)

# 관심 있는 row/axis 조합만 탐색 (입 세로 열림 = y축이 유력)
PROBE_TARGETS = [
    (6, 1),   # row6 y
    (12, 1),  # row12 y
    (14, 1),  # row14 y
    (17, 1),  # row17 y
    (19, 1),  # row19 y
    (20, 1),  # row20 y
    (6, 0),   # row6 x (비교)
    (14, 0),  # row14 x
]

probe_results = {}
for (row, axis) in PROBE_TARGETS:
    tag = f"probe_row{row}_{AXIS_NAMES[axis]}"
    out_probe = os.path.join(probe_dir, f"{tag}.mp4")
    vp = cv2.VideoWriter(out_probe, fourcc, FPS, (512, 512))

    deltas = []
    prev_p = None
    for i in range(PROBE_FRAMES):
        # 절반은 +delta, 절반은 -delta (비교용)
        sign = 1.0 if i < PROBE_FRAMES // 2 else -1.0
        m = copy.deepcopy(base_motion)
        m['exp'][:, row, axis] += sign * PROBE_DELTA
        fi = [m, None, None]
        result_p = pipe_b.run_with_pkl(fi, src_img_b, src_info_b, first_frame=(i == 0))
        out_c = result_p[0] if result_p else None
        if out_c is not None:
            bgr = cv2.cvtColor(out_c, cv2.COLOR_RGB2BGR)
            # 프레임에 태그 텍스트 삽입
            cv2.putText(bgr, f"{tag} sign={'+' if sign>0 else '-'}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            vp.write(bgr)
            if prev_p is not None:
                mh, mw = bgr.shape[:2]
                y0m, y1m = int(mh*0.55), int(mh*0.85)
                x0m, x1m = int(mw*0.25), int(mw*0.75)
                d = float(np.mean(np.abs(
                    bgr[y0m:y1m,x0m:x1m].astype(np.float32) -
                    prev_p[y0m:y1m,x0m:x1m].astype(np.float32)
                )))
                deltas.append(d)
            prev_p = bgr.copy()
    vp.release()
    probe_results[tag] = np.mean(deltas) if deltas else 0.0
    print(f"  {tag}: mouth_delta_mean={probe_results[tag]:.2f}  saved={out_probe}")

print("\n  [Probe 순위 (mouth_delta 내림차순)]")
for k, v in sorted(probe_results.items(), key=lambda x: -x[1]):
    print(f"    {k}: {v:.2f}")

# 최대 mouth_delta 축으로 jawaxis RMS 구동
best_tag  = max(probe_results, key=probe_results.get)
best_row  = int(best_tag.split('_')[1].replace('row',''))
best_axis = AXIS_NAMES.index(best_tag.split('_')[2])
print(f"\n  best jaw-open axis: row={best_row}  axis={AXIS_NAMES[best_axis]}  delta={probe_results[best_tag]:.2f}")

# best axis로 RMS 구동 (방향 B RMS)
print(f"\n[5B-RMS] best axis ({best_tag}) × RMS 구동...")
out_jaw_raw = os.path.join(OUT_DIR, "acoustic_jawaxis_raw.mp4")
vj = cv2.VideoWriter(out_jaw_raw, fourcc, FPS, (512, 512))
jaw_deltas = []
prev_j     = None
for i in range(n_render):
    joy_idx = min(i, n_joy - 1)
    rms_val = float(rms_g[min(i, n_frames-1)])

    m = copy.deepcopy(motion_list[joy_idx])
    # jaw open: row/axis에 rms * PROBE_DELTA 적용
    m['exp'][:, best_row, best_axis] = (
        x_s_info_b['exp'][:, best_row, best_axis] + rms_val * PROBE_DELTA * 1.5
    )
    fi = [m, c_eyes_lst[joy_idx] if c_eyes_lst else None, None]
    result_j = pipe_b.run_with_pkl(fi, src_img_b, src_info_b, first_frame=(i == 0))
    out_cj = result_j[0] if result_j else None
    if out_cj is not None:
        bgr_j = cv2.cvtColor(out_cj, cv2.COLOR_RGB2BGR)
        vj.write(bgr_j)
        if prev_j is not None:
            mh, mw = bgr_j.shape[:2]
            y0m, y1m = int(mh*0.55), int(mh*0.85)
            x0m, x1m = int(mw*0.25), int(mw*0.75)
            d = float(np.mean(np.abs(
                bgr_j[y0m:y1m,x0m:x1m].astype(np.float32) -
                prev_j[y0m:y1m,x0m:x1m].astype(np.float32)
            )))
            jaw_deltas.append(d)
        prev_j = bgr_j.copy()
    if i % 10 == 0:
        print(f"  [{i:3d}/{n_render}] rms={rms_val:.3f}  render")
vj.release()
print(f"  jaw RMS raw: {out_jaw_raw}")
print(f"  jaw mouth_delta: mean={np.mean(jaw_deltas):.2f}  max={np.max(jaw_deltas):.2f}")

# ─────────────────────────────────────────────────────────────
# 6. FFmpeg mux (모든 결과물)
# ─────────────────────────────────────────────────────────────
print("\n[6] FFmpeg mux...")
ENV = {**os.environ,
       "LD_LIBRARY_PATH": "/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib:" + os.environ.get("LD_LIBRARY_PATH", "")}

mux_jobs = [
    (out_raw,     os.path.join(MUXED_DIR, "acoustic_lipretarget.mp4")),
    (out_jaw_raw, os.path.join(MUXED_DIR, "acoustic_jawaxis.mp4")),
]
for raw, out_muxed in mux_jobs:
    r = subprocess.run([
        "ffmpeg", "-y",
        "-i", raw, "-i", AUDIO,
        "-c:v", "libx264", "-crf", "18", "-preset", "fast",
        "-c:a", "aac", "-b:a", "128k", "-shortest",
        out_muxed
    ], capture_output=True, text=True, env=ENV)
    if r.returncode == 0:
        sz = os.path.getsize(out_muxed) / 1024
        print(f"  mux OK: {out_muxed}  ({sz:.0f}KB)")
    else:
        print(f"  mux FAIL: {out_muxed}\n{r.stderr[-400:]}")

# probe_b 영상들도 mux (오디오 없이 그냥 h264 변환)
for tag in probe_results:
    src_p  = os.path.join(probe_dir, f"{tag}.mp4")
    dst_p  = os.path.join(MUXED_DIR, f"{tag}.mp4")
    r2 = subprocess.run([
        "ffmpeg", "-y", "-i", src_p,
        "-c:v", "libx264", "-crf", "20", "-preset", "fast",
        dst_p
    ], capture_output=True, text=True, env=ENV)
    if r2.returncode == 0:
        print(f"  probe mux OK: {dst_p}")
    else:
        print(f"  probe mux FAIL: {dst_p}")

print("\n[DONE] 전체 완료")
print(f"  방향A (lip retargeting RMS): {MUXED_DIR}/acoustic_lipretarget.mp4")
print(f"  방향B (jaw-axis RMS):        {MUXED_DIR}/acoustic_jawaxis.mp4")
print(f"  probe 영상:                  {MUXED_DIR}/probe_row*.mp4")
print(f"\n[QUANT SUMMARY]")
print(f"  A mouth_delta: mean={np.mean(mouth_deltas):.2f}  max={np.max(mouth_deltas):.2f}")
print(f"  B mouth_delta: mean={np.mean(jaw_deltas):.2f}  max={np.max(jaw_deltas):.2f}")
print(f"  best probe:    {best_tag} ({probe_results[best_tag]:.2f})")
print(f"  lip ratio range (A): {min(lip_ratios):.4f} → {max(lip_ratios):.4f}")
