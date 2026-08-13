#!/usr/bin/env python3
# extract_se_no_sr.py — silenceremove 없이 se.pth 추출.
# 원본 afl_extract_se_io.py 는 silenceremove 가 aggressive 해서
# 문장 사이 0.3s pause 만 있어도 첫 pause 에서 잘림. preset-9520~9522 같은
# multi-sentence sample 은 후반부 다 날아가 VAD 실패.
# 이 변형은 44.1kHz mono 변환만 하고 silenceremove skip.
#
# 사용: python extract_se_no_sr.py <voice_wav> <out_se_pth>
import os, sys, subprocess
os.environ.setdefault("NUMBA_CACHE_DIR", "/tmp/numba_cache")
os.environ.setdefault("MPLCONFIGDIR", "/tmp/mpl_cache")
for _d in (os.environ["NUMBA_CACHE_DIR"], os.environ["MPLCONFIGDIR"]):
    os.makedirs(_d, exist_ok=True)
import torch
from openvoice import se_extractor
from openvoice.api import ToneColorConverter

SRC = sys.argv[1]
OUT = sys.argv[2]

OV = "/home/afterlife/afterlife-server/openvoice-afterlife"
CKPT = f"{OV}/checkpoints_v2"
PROC = os.path.join(os.path.dirname(OUT), "_proc_nosr")
WAV = os.path.join(PROC, "voice.wav")
os.makedirs(PROC, exist_ok=True)

# 포맷 변환만 (silenceremove skip)
subprocess.run(
    ["ffmpeg", "-y", "-loglevel", "error", "-i", SRC,
     "-ar", "44100", "-ac", "1", WAV],
    check=True,
)

device = "cuda:0" if torch.cuda.is_available() else "cpu"
print(f"[extract_se_no_sr] device={device} src={SRC}", flush=True)

conv = ToneColorConverter(f"{CKPT}/converter/config.json", device=device)
conv.load_ckpt(f"{CKPT}/converter/checkpoint.pth")
target_se, _ = se_extractor.get_se(WAV, conv, target_dir=PROC, vad=True)
torch.save(target_se, OUT)
print(f"[extract_se_no_sr] saved {OUT} shape={tuple(target_se.shape)}", flush=True)
