"""
T-068 SD Open → FLP 합성
SD inpaint로 생성한 입벌린 사진(gominju_sd_open.jpg)을 FLP source로 사용해 입싱크 영상 생성.
실행(fifth_poc_flp 컨테이너 내):
  python t068_sd_flp_synth.py [--lip-open 0.5] [--offset 2] [--sigma 1.0]

t068_tune.py 기반, src만 sd_open.jpg로 교체.
"""
import sys, os, time, copy, argparse, subprocess
os.chdir("/root/FasterLivePortrait")
sys.path.insert(0, "/root/FasterLivePortrait")
import numpy as np, cv2, torch, torchaudio
from omegaconf import OmegaConf
from scipy.ndimage import gaussian_filter1d

ap = argparse.ArgumentParser()
ap.add_argument("--src", default="/data/afterlife/fifth-poc/gominju_sd_open.jpg",
                help="SD inpaint 생성 입벌린 소스 이미지")
ap.add_argument("--audio", default="/root/FasterLivePortrait/gominju_speech.wav")
ap.add_argument("--cfg", default="/root/FasterLivePortrait/configs/trt_infer.yaml")
ap.add_argument("--out-dir", default="/root/FasterLivePortrait/gominju_out")
ap.add_argument("--lip-open", type=float, default=0.5)
ap.add_argument("--offset", type=int, default=2)
ap.add_argument("--sigma", type=float, default=1.0)
ap.add_argument("--silence", type=float, default=0.05)
ap.add_argument("--gamma", type=float, default=1.0)
ap.add_argument("--tag", type=str, default="sd_open")
args = ap.parse_args()

MUX = "/data/afterlife/fifth-poc/audio_muxed"
os.makedirs(MUX, exist_ok=True)
FPS = 25

print(f"[params] src={args.src} lip_open={args.lip_open} offset={args.offset} sigma={args.sigma} tag={args.tag}")

cfg = OmegaConf.load(args.cfg)
cfg.infer_params.flag_normalize_lip = False
cfg.infer_params.flag_lip_retargeting = True
cfg.infer_params.flag_eye_retargeting = False
cfg.infer_params.driving_multiplier = 1.0
cfg.infer_params.animation_region = "all"
cfg.infer_params.flag_stitching = True
cfg.infer_params.flag_relative_motion = True

from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline
from src.pipelines.joyvasa_audio_to_motion_pipeline import JoyVASAAudio2MotionPipeline
from src.utils.utils import calc_lip_close_ratio

pipe = FasterLivePortraitPipeline(cfg=cfg)
assert pipe.prepare_source(args.src, realtime=True), f"FLP source 준비 실패: {args.src}"
src_img = pipe.src_imgs[0]
src_info = pipe.src_infos[0]
source_lmk = src_info[0][1] if len(src_info[0]) > 1 else None
lip_closed = float(calc_lip_close_ratio(source_lmk[None])[0, 0]) if source_lmk is not None else 0.0
print(f"  source lip_closed_ratio={lip_closed:.4f}  range=[{lip_closed:.4f}→{args.lip_open}]")

# RMS envelope
wf, sr0 = torchaudio.load(args.audio)
if wf.shape[0] > 1:
    wf = wf.mean(0, keepdim=True)
if sr0 != 16000:
    wf = torchaudio.functional.resample(wf, sr0, 16000)
sr = 16000
y = wf[0].numpy()
dur = len(y) / sr
n_frames = int(np.ceil(dur * FPS))
hop = max(1, int(sr / FPS))
win = hop * 2
yp = np.pad(y, (win // 2, win), mode='reflect')
fr = np.array([yp[i * hop:i * hop + win] for i in range(n_frames)])
rms = np.sqrt((fr ** 2).mean(1)).astype(np.float32)
rms = gaussian_filter1d(rms.astype(np.float64), sigma=args.sigma).astype(np.float32)
rms = rms / (rms.max() + 1e-8)
rms = np.where(rms < args.silence, 0.0, rms).astype(np.float32)
rms = np.power(rms, args.gamma).astype(np.float32)
print(f"  rms: max={rms.max():.3f} mean={rms.mean():.3f}")

# JoyVASA motion
jp = JoyVASAAudio2MotionPipeline(
    motion_model_path=cfg.joyvasa_models.motion_model_path,
    audio_model_path=cfg.joyvasa_models.audio_model_path,
    motion_template_path=cfg.joyvasa_models.motion_template_path,
    cfg_mode=cfg.infer_params.cfg_mode,
    cfg_scale=2.8
)
_ = jp.gen_motion_sequence(args.audio)
dri = jp.gen_motion_sequence(args.audio)
ml = dri["motion"]
ce = dri.get("c_eyes_lst", [])
nj = dri["n_frames"]

out_raw = os.path.join(args.out_dir, f"sd_open_{args.tag}_raw.mp4")
vo = cv2.VideoWriter(out_raw, cv2.VideoWriter_fourcc(*'mp4v'), FPS, (512, 512))
nr = max(n_frames, nj)

t0 = time.time()
for i in range(nr):
    ji = min(i, nj - 1)
    ri = int(np.clip(i + args.offset, 0, n_frames - 1))
    rv = float(rms[ri])
    c_d_lip = lip_closed + rv * (args.lip_open - lip_closed)
    m = copy.deepcopy(ml[ji])
    fi = [m, ce[ji] if ce else None, [c_d_lip]]
    r = pipe.run_with_pkl(fi, src_img, src_info, first_frame=(i == 0))
    if r and r[0] is not None:
        vo.write(cv2.cvtColor(r[0], cv2.COLOR_RGB2BGR))
vo.release()
print(f"  raw 영상: {out_raw}  ({time.time()-t0:.1f}s)")

# mux 오디오
out_mux = os.path.join(MUX, "sd_open_muxed.mp4")
ENV = {**os.environ, "LD_LIBRARY_PATH": "/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib:" + os.environ.get("LD_LIBRARY_PATH", "")}
rc = subprocess.run(
    ["ffmpeg", "-y", "-i", out_raw, "-i", args.audio,
     "-c:v", "libx264", "-crf", "18", "-preset", "fast",
     "-c:a", "aac", "-b:a", "128k", "-shortest", out_mux],
    env=ENV, capture_output=True, text=True
)
if rc.returncode == 0:
    print(f"  mux 완료: {out_mux}")
else:
    print(f"  [WARN] ffmpeg 에러:\n{rc.stderr[-500:]}")

print("\n[완료] SD inpaint → FLP 합성 끝.")
print(f"  raw: {out_raw}")
print(f"  muxed: {out_mux}")
