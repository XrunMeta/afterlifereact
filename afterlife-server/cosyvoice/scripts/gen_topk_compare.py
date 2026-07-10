#!/usr/bin/env python3
"""top_k별 자연성 비교 샘플 생성(폭주 아닌 클린 샘플 재롤). T-120 cosyvoice. 히즈키 청취용."""
import sys, functools
import numpy as np, soundfile as sf
POC = "/home/afterlife/cosyvoice-poc"
sys.path.insert(0, f"{POC}/repo"); sys.path.insert(0, f"{POC}/repo/third_party/Matcha-TTS")
REF = "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices/9075"
OUT = "/tmp/topk"; import os; os.makedirs(OUT, exist_ok=True)
SENTS = [("A", "안녕하세요, 오늘 날씨가 참 좋네요."), ("B", "밥은 잘 챙겨 먹고 다니는 거지?")]
THRESH = 7.4

from cosyvoice.cli.cosyvoice import CosyVoice2
from cosyvoice.utils.common import ras_sampling
cv = CosyVoice2(f"{POC}/pretrained_models/CosyVoice2-0.5B", load_jit=False, load_trt=False, fp16=False)
sr = cv.sample_rate
rt = open(f"{REF}/ref_text.txt", encoding="utf-8").read().strip()
d, wsr = sf.read(f"{REF}/voice.wav", dtype="float32")
if d.ndim > 1: d = d[:, 0]
pr = np.concatenate([d[:int(10*wsr)], np.zeros(int(0.3*wsr), np.float32)])
sf.write("/tmp/pk.wav", pr, wsr); cv.add_zero_shot_spk(rt, "/tmp/pk.wav", "9075")

def synth():
    ch = [o["tts_speech"].squeeze(0).cpu().numpy() for o in
          cv.inference_zero_shot(TXT, "", "", zero_shot_spk_id="9075", stream=False, speed=1.0)]
    return np.concatenate(ch) if ch else np.zeros(1, np.float32)

for tk in [1, 5, 10, 25]:
    cv.model.llm.sampling = functools.partial(ras_sampling, top_p=0.8, top_k=tk, win_size=10, tau_r=0.1)
    for sid, TXT in SENTS:
        a = synth()
        for _ in range(6):  # 폭주면 재롤(클린 목소리 청취용)
            if len(a)/sr <= THRESH: break
            a = synth()
        sf.write(f"{OUT}/topk{tk:02d}_{sid}.wav", a, sr)
        print(f"topk={tk:2d} {sid} dur={len(a)/sr:.1f}s")
