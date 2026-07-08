"""
T-068 방향 A 튜닝 — lip retargeting × RMS, argparse로 파라미터 조정 + 싱크 offset
실행(컨테이너 내): python t068_tune.py --lip-open 0.6 --offset 2 --sigma 1.0 --tag t1
보통은 run_tune.sh 래퍼로 호출(자동 mux+호스트복사).
"""
import sys, os, time, copy, argparse
os.chdir("/root/FasterLivePortrait")
sys.path.insert(0, "/root/FasterLivePortrait")
import numpy as np, cv2, torch, subprocess, torchaudio
from omegaconf import OmegaConf
from scipy.ndimage import gaussian_filter1d

ap = argparse.ArgumentParser()
ap.add_argument("--lip-open", type=float, default=0.45, help="입 최대 벌림(0.3~0.8). 클수록 크게 벌어짐")
ap.add_argument("--open-scale", type=float, default=1.0, help="RMS→벌림 전체 배율(0.7~1.5)")
ap.add_argument("--silence", type=float, default=0.05, help="무음 게이트(0~0.2). 이하 RMS는 입닫힘")
ap.add_argument("--sigma", type=float, default=1.5, help="RMS 스무딩(0.5~3). 작으면 빠릿/떨림, 크면 부드럽/지연")
ap.add_argument("--offset", type=int, default=0, help="싱크 보정 프레임(@25fps). +면 입이 빨라짐(소리보다 앞), -면 늦어짐")
ap.add_argument("--gamma", type=float, default=1.0, help="반응곡선(0.5~2). <1 작은소리도 벌림, >1 큰소리만")
ap.add_argument("--tag", type=str, default="tune", help="출력 파일명 suffix")
args = ap.parse_args()

SRC="/root/FasterLivePortrait/gominju_source.jpg"; AUDIO="/root/FasterLivePortrait/gominju_speech.wav"
CFG="/root/FasterLivePortrait/configs/trt_infer.yaml"; OUT="/root/FasterLivePortrait/gominju_out"
MUX=os.path.join(OUT,"audio_muxed"); os.makedirs(MUX, exist_ok=True); FPS=25
print(f"[params] lip_open={args.lip_open} open_scale={args.open_scale} silence={args.silence} sigma={args.sigma} offset={args.offset} gamma={args.gamma} tag={args.tag}")

cfg=OmegaConf.load(CFG)
cfg.infer_params.flag_normalize_lip=False; cfg.infer_params.flag_lip_retargeting=True
cfg.infer_params.flag_eye_retargeting=False; cfg.infer_params.driving_multiplier=1.0
cfg.infer_params.animation_region="all"; cfg.infer_params.flag_stitching=True; cfg.infer_params.flag_relative_motion=True
from src.pipelines.faster_live_portrait_pipeline import FasterLivePortraitPipeline
from src.pipelines.joyvasa_audio_to_motion_pipeline import JoyVASAAudio2MotionPipeline
from src.utils.utils import calc_lip_close_ratio
pipe=FasterLivePortraitPipeline(cfg=cfg); assert pipe.prepare_source(SRC, realtime=True)
src_img=pipe.src_imgs[0]; src_info=pipe.src_infos[0]
source_lmk=src_info[0][1] if len(src_info[0])>1 else None
lip_closed=float(calc_lip_close_ratio(source_lmk[None])[0,0]) if source_lmk is not None else 0.0
print(f"  lip_closed_ratio={lip_closed:.4f}  range=[{lip_closed:.4f}→{args.lip_open}]")

# RMS envelope
wf,sr0=torchaudio.load(AUDIO)
if wf.shape[0]>1: wf=wf.mean(0,keepdim=True)
if sr0!=16000: wf=torchaudio.functional.resample(wf,sr0,16000)
sr=16000; y=wf[0].numpy(); dur=len(y)/sr; n_frames=int(np.ceil(dur*FPS))
hop=max(1,int(sr/FPS)); win=hop*2
yp=np.pad(y,(win//2,win),mode='reflect')
fr=np.array([yp[i*hop:i*hop+win] for i in range(n_frames)])
rms=np.sqrt((fr**2).mean(1)).astype(np.float32)
rms=gaussian_filter1d(rms.astype(np.float64),sigma=args.sigma).astype(np.float32)
rms=rms/(rms.max()+1e-8)
rms=np.where(rms<args.silence,0.0,rms).astype(np.float32)
rms=np.power(rms, args.gamma).astype(np.float32)  # gamma 곡선
print(f"  rms: max={rms.max():.3f} mean={rms.mean():.3f}")

# JoyVASA 헤드/눈 motion
jp=JoyVASAAudio2MotionPipeline(motion_model_path=cfg.joyvasa_models.motion_model_path,
    audio_model_path=cfg.joyvasa_models.audio_model_path, motion_template_path=cfg.joyvasa_models.motion_template_path,
    cfg_mode=cfg.infer_params.cfg_mode, cfg_scale=2.8)
_=jp.gen_motion_sequence(AUDIO); dri=jp.gen_motion_sequence(AUDIO)
ml=dri["motion"]; ce=dri.get("c_eyes_lst",[]); nj=dri["n_frames"]

out_raw=os.path.join(OUT,f"acoustic_{args.tag}_raw.mp4")
vo=cv2.VideoWriter(out_raw,cv2.VideoWriter_fourcc(*'mp4v'),FPS,(512,512))
rms_ms=[]; prev=None; nr=max(n_frames,nj)
for i in range(nr):
    ji=min(i,nj-1)
    # 싱크 offset: i+offset 프레임의 rms 사용
    ri=int(np.clip(i+args.offset,0,n_frames-1)); rv=float(rms[ri])
    c_d_lip=lip_closed + rv*(args.lip_open-lip_closed)*args.open_scale
    m=copy.deepcopy(ml[ji]); fi=[m, ce[ji] if ce else None, [c_d_lip]]
    r=pipe.run_with_pkl(fi,src_img,src_info,first_frame=(i==0))
    if r and r[0] is not None:
        vo.write(cv2.cvtColor(r[0],cv2.COLOR_RGB2BGR))
vo.release()
print(f"  raw: {out_raw}")

out_mux=os.path.join(MUX,f"acoustic_{args.tag}.mp4")
ENV={**os.environ,"LD_LIBRARY_PATH":"/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib:"+os.environ.get("LD_LIBRARY_PATH","")}
rc=subprocess.run(["ffmpeg","-y","-i",out_raw,"-i",AUDIO,"-c:v","libx264","-crf","18","-preset","fast",
    "-c:a","aac","-b:a","128k","-shortest",out_mux],capture_output=True,text=True,env=ENV)
print(f"  MUXED: {out_mux}" if rc.returncode==0 else f"  mux FAIL:{rc.stderr[-300:]}")
print(f"[DONE] {out_mux}")
