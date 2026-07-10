#!/usr/bin/env python3
"""ramble 완화 — 9075 프롬프트 짧게(문장분할·비례트림). T-120 cosyvoice.

발견: ramble ∝ ref_text 길이(9075=76자 37% vs 9074=41자 12%). 짧은 정합 프롬프트가 fix.
의존성 없이 테스트: ref_text 문장분할 후 앞 k문장 + 오디오를 문자비례로 트림(+뒤침묵).
"""
import sys, re, functools
import numpy as np, soundfile as sf
POC = "/home/afterlife/cosyvoice-poc"
sys.path.insert(0, f"{POC}/repo"); sys.path.insert(0, f"{POC}/repo/third_party/Matcha-TTS")
REF = "/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices/9075"
TEXT = "안녕하세요, 오늘 날씨가 참 좋네요."; THRESH = 7.4; N = 8

from cosyvoice.cli.cosyvoice import CosyVoice2
from cosyvoice.utils.common import ras_sampling
cv = CosyVoice2(f"{POC}/pretrained_models/CosyVoice2-0.5B", load_jit=False, load_trt=False, fp16=False)
cv.model.llm.sampling = functools.partial(ras_sampling, top_p=0.8, top_k=10, win_size=10, tau_r=0.1)
sr = cv.sample_rate
full_text = open(f"{REF}/ref_text.txt", encoding="utf-8").read().strip()
sents = [s.strip() for s in re.split(r'(?<=[.!?])\s+', full_text) if s.strip()]
data, wsr = sf.read(f"{REF}/voice.wav", dtype="float32")
if data.ndim > 1: data = data[:, 0]
SIL = np.zeros(int(0.3*wsr), np.float32); AUD10 = 10.0

def mk(spk, audio_sec, text):
    a = np.concatenate([data[:int(audio_sec*wsr)], SIL]); p=f"/tmp/sp_{spk}.wav"; sf.write(p,a,wsr)
    cv.add_zero_shot_spk(text, p, spk)

def dur(spk):
    ch=[o["tts_speech"].squeeze(0).cpu().numpy() for o in
        cv.inference_zero_shot(TEXT,"","",zero_shot_spk_id=spk,stream=False,speed=1.0)]
    return (sum(len(c) for c in ch))/sr if ch else 0.0

t1=sents[0]; t2=" ".join(sents[:2]); tot=len(full_text)
cfgs = {
  "A_full10s_76c":   (AUD10, full_text),
  "B_aud10s_s1":     (AUD10, t1),                          # 오디오full+짧은텍스트
  "C_prop_s1s2":     (round(len(t2)/tot*AUD10,1), t2),     # 앞2문장 비례
  "D_prop_s1":       (round(len(t1)/tot*AUD10,1), t1),     # 앞1문장 비례
}
print(f"# top_k=10 N={N} TEXT={TEXT!r} ramble>dur{THRESH}s  (sents={[len(s) for s in sents]}자)")
for name,(sec,txt) in cfgs.items():
    mk(name, sec, txt)
    ds=[round(dur(name),1) for _ in range(N)]
    print(f"{name:16s} aud={sec}s txt={len(txt)}자 ramble={sum(1 for d in ds if d>THRESH)}/{N} durs={sorted(ds)}")
