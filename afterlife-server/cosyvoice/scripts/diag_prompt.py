#!/usr/bin/env python3
"""ramble 프롬프트 특정성 진단 — 같은 텍스트 × 여러 클론 프롬프트. T-120 cosyvoice.

가설: ramble 이 9075 프롬프트/ref_text 특정인가(→ 참조 재생성이 fix) vs 보편(→ 모델 한계)?
top_k=10 고정, 각 클론(voice.wav 첫10s+뒤침묵0.3s + 해당 ref_text) N회, dur>7.4=ramble.
"""
import sys, os, functools
import numpy as np, soundfile as sf
POC = "/home/afterlife/cosyvoice-poc"
sys.path.insert(0, f"{POC}/repo"); sys.path.insert(0, f"{POC}/repo/third_party/Matcha-TTS")
ROOT = "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices"
TEXT = "안녕하세요, 오늘 날씨가 참 좋네요."
THRESH = 7.4; N = 8
CLONES = ["9075", "9074", "9073", "9072", "9055"]

from cosyvoice.cli.cosyvoice import CosyVoice2
from cosyvoice.utils.common import ras_sampling
cv = CosyVoice2(f"{POC}/pretrained_models/CosyVoice2-0.5B", load_jit=False, load_trt=False, fp16=False)
cv.model.llm.sampling = functools.partial(ras_sampling, top_p=0.8, top_k=10, win_size=10, tau_r=0.1)
sr = cv.sample_rate

def reg(cid):
    d = f"{ROOT}/{cid}"; vw = f"{d}/voice.wav"; rt = f"{d}/ref_text.txt"
    if not (os.path.isfile(vw) and os.path.isfile(rt)):
        return None
    a, wsr = sf.read(vw, dtype="float32")
    if a.ndim > 1: a = a[:, 0]
    a = np.concatenate([a[:int(10*wsr)], np.zeros(int(0.3*wsr), np.float32)])
    p = f"/tmp/pr_{cid}.wav"; sf.write(p, a, wsr)
    cv.add_zero_shot_spk(open(rt, encoding="utf-8").read().strip(), p, cid)
    return len(open(rt, encoding="utf-8").read().strip())

def dur(cid):
    ch = [o["tts_speech"].squeeze(0).cpu().numpy() for o in
          cv.inference_zero_shot(TEXT, "", "", zero_shot_spk_id=cid, stream=False, speed=1.0)]
    return (sum(len(c) for c in ch))/sr if ch else 0.0

print(f"# {N}회/클론, top_k=10, TEXT={TEXT!r}, ramble=dur>{THRESH}s")
for cid in CLONES:
    rtlen = reg(cid)
    if rtlen is None:
        print(f"clone {cid}: 참조 없음 skip"); continue
    ds = [round(dur(cid), 1) for _ in range(N)]
    r = sum(1 for d in ds if d > THRESH)
    print(f"clone {cid} (ref_text {rtlen}자): ramble={r}/{N}  durs={sorted(ds)}")
