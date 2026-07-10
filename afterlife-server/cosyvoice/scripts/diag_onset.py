#!/usr/bin/env python3
"""선행 아티팩트("똥") 진단 — stream True/False · 프롬프트 경계 변형 비교. T-120 cosyvoice.

가설:
  H1) stream=False 가 선행 환청 유발(Phase1 벤치는 stream=True 였고 GO).
  H2) 프롬프트 10s 하드컷(고정.) 이 경계 아티팩트 유발 → 뒤 침묵 추가/짧은 클린컷으로 완화.

실행(cosyvoice-poc env, GPU1):
  CUDA_VISIBLE_DEVICES=1 python diag_onset.py
"""
import io, os, sys
import numpy as np, soundfile as sf

POC = "/home/afterlife/cosyvoice-poc"
sys.path.insert(0, f"{POC}/repo"); sys.path.insert(0, f"{POC}/repo/third_party/Matcha-TTS")
REF = "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices/9075"
OUT = "/tmp/onset"; os.makedirs(OUT, exist_ok=True)
TEXT = "안녕하세요, 오늘 날씨가 참 좋네요."

from cosyvoice.cli.cosyvoice import CosyVoice2
cv = CosyVoice2(f"{POC}/pretrained_models/CosyVoice2-0.5B", load_jit=False, load_trt=False, fp16=False)
sr = cv.sample_rate
ref_text = open(f"{REF}/ref_text.txt", encoding="utf-8").read().strip()

data, wsr = sf.read(f"{REF}/voice.wav", dtype="float32")
if data.ndim > 1: data = data[:, 0]
head10 = data[: int(10.0 * wsr)]

def onset_prof(audio):
    win = int(sr * 0.05)
    return [int(np.sqrt(np.mean(audio[i:i+win]**2))*32768) if len(audio[i:i+win]) else 0
            for i in range(0, min(len(audio), int(sr*0.8)), win)]

def synth(spk, stream):
    chunks = [o["tts_speech"].squeeze(0).cpu().numpy() for o in
              cv.inference_zero_shot(TEXT, "", "", zero_shot_spk_id=spk, stream=stream, speed=1.0)]
    return np.concatenate(chunks) if chunks else np.zeros(1, np.float32)

# 프롬프트 변형 등록
def mkwav(arr, name):
    p = f"{OUT}/prompt_{name}.wav"; sf.write(p, arr, wsr); return p

variants = {
    "hard10s": head10,                                                   # 현재(하드컷)
    "sil10s":  np.concatenate([head10, np.zeros(int(0.3*wsr), np.float32)]),  # +뒤침묵0.3s
    "clean8s": np.concatenate([head10[: int(8.0*wsr)], np.zeros(int(0.3*wsr), np.float32)]),  # 8s+침묵
}
for name, arr in variants.items():
    cv.add_zero_shot_spk(ref_text, mkwav(arr, name), name)

print(f"# TEXT={TEXT!r}  sr={sr}")
for name in variants:
    for stream in (False, True):
        a = synth(name, stream)
        tag = f"{name}_{'stream' if stream else 'whole'}"
        sf.write(f"{OUT}/out_{tag}.wav", a, sr)
        print(f"{tag:22s} dur={len(a)/sr:4.2f}s onset50ms={onset_prof(a)}")
