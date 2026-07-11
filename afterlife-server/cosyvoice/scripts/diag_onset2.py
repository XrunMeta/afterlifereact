#!/usr/bin/env python3
"""선행 아티팩트 + 과생성 안정성 통계 — 프롬프트 변형 × 5회. T-120 cosyvoice.

측정: (a) lead = 첫 150ms 평균RMS(아티팩트=높음, 클린=낮음) (b) dur = 총길이(과생성 탐지).
변형: hard10s(현재) · sil10s(10s+뒤침묵0.3s, ref_text 정합) · sil6s(6s+침묵, ref_text 정합깨짐).
"""
import os, sys, statistics as st
import numpy as np, soundfile as sf
POC = "/home/afterlife/cosyvoice-poc"
sys.path.insert(0, f"{POC}/repo"); sys.path.insert(0, f"{POC}/repo/third_party/Matcha-TTS")
REF = "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices/9075"
TEXTS = ["안녕하세요, 오늘 날씨가 참 좋네요.", "네, 알겠습니다.", "밥은 드셨어요?"]
N = 5

from cosyvoice.cli.cosyvoice import CosyVoice2
cv = CosyVoice2(f"{POC}/pretrained_models/CosyVoice2-0.5B", load_jit=False, load_trt=False, fp16=False)
sr = cv.sample_rate
ref_text = open(f"{REF}/ref_text.txt", encoding="utf-8").read().strip()
data, wsr = sf.read(f"{REF}/voice.wav", dtype="float32")
if data.ndim > 1: data = data[:, 0]

def mk(arr, name):
    p = f"/tmp/pp_{name}.wav"; sf.write(p, arr, wsr); cv.add_zero_shot_spk(ref_text, p, name)

h10 = data[:int(10*wsr)]
mk(h10, "hard10s")
mk(np.concatenate([h10, np.zeros(int(0.3*wsr), np.float32)]), "sil10s")
mk(np.concatenate([data[:int(6*wsr)], np.zeros(int(0.3*wsr), np.float32)]), "sil6s")

def lead_rms(a):
    w = a[:int(sr*0.15)]; return int(np.sqrt(np.mean(w**2))*32768) if len(w) else 0

def synth(spk):
    ch = [o["tts_speech"].squeeze(0).cpu().numpy() for o in
          cv.inference_zero_shot(TEXTS[0], "", "", zero_shot_spk_id=spk, stream=False, speed=1.0)]
    a = np.concatenate(ch) if ch else np.zeros(1, np.float32)
    return len(a)/sr, lead_rms(a)

print(f"# 5x per variant, TEXT={TEXTS[0]!r}, sr={sr}  (lead<100=클린, dur~3.5s 기대)")
for spk in ("hard10s", "sil10s", "sil6s"):
    durs, leads = [], []
    for _ in range(N):
        d, l = synth(spk); durs.append(d); leads.append(l)
    print(f"{spk:9s} dur[min/mean/max]={min(durs):.2f}/{st.mean(durs):.2f}/{max(durs):.2f}  "
          f"lead[mean/max]={int(st.mean(leads))}/{max(leads)}  durs={[round(x,1) for x in durs]}  leads={leads}")
