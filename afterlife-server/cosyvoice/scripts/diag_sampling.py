#!/usr/bin/env python3
"""ramble(과생성) 근본진단 — 샘플링 top_k/top_p별 폭주율 측정. T-120 cosyvoice.

가설: LLM ras_sampling top_k=25(기본)가 과랜덤 → 폭주. top_k↓(결정론적)이면 폭주율↓?
방법: 모델 1회 로드 후 cv.model.llm.sampling 을 top_k별 monkeypatch, 같은 문장 N회 합성,
      dur>THRESH(7.4s) 비율 집계. 자연성 훼손 확인용 dur 분포도 출력.
"""
import sys, functools
import numpy as np, soundfile as sf
POC = "/home/afterlife/cosyvoice-poc"
sys.path.insert(0, f"{POC}/repo"); sys.path.insert(0, f"{POC}/repo/third_party/Matcha-TTS")
REF = "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices/9075"
TEXT = "안녕하세요, 오늘 날씨가 참 좋네요."
THRESH = 7.4; N = 10

from cosyvoice.cli.cosyvoice import CosyVoice2
from cosyvoice.utils.common import ras_sampling
cv = CosyVoice2(f"{POC}/pretrained_models/CosyVoice2-0.5B", load_jit=False, load_trt=False, fp16=False)
sr = cv.sample_rate
ref_text = open(f"{REF}/ref_text.txt", encoding="utf-8").read().strip()
data, wsr = sf.read(f"{REF}/voice.wav", dtype="float32")
if data.ndim > 1: data = data[:, 0]
prompt = np.concatenate([data[:int(10*wsr)], np.zeros(int(0.3*wsr), np.float32)])
sf.write("/tmp/ps.wav", prompt, wsr); cv.add_zero_shot_spk(ref_text, "/tmp/ps.wav", "9075")

def synth_dur():
    ch = [o["tts_speech"].squeeze(0).cpu().numpy() for o in
          cv.inference_zero_shot(TEXT, "", "", zero_shot_spk_id="9075", stream=False, speed=1.0)]
    return (sum(len(c) for c in ch))/sr if ch else 0.0

print(f"# {N}회/설정, TEXT={TEXT!r}, ramble=dur>{THRESH}s")
for (tp, tk) in [(0.8, 25), (0.8, 10), (0.8, 5), (0.6, 5), (0.5, 3), (1.0, 1)]:
    cv.model.llm.sampling = functools.partial(ras_sampling, top_p=tp, top_k=tk, win_size=10, tau_r=0.1)
    durs = [round(synth_dur(), 1) for _ in range(N)]
    ramble = sum(1 for d in durs if d > THRESH)
    print(f"top_p={tp} top_k={tk:2d}: ramble={ramble}/{N}  durs={sorted(durs)}")
