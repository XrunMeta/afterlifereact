import os
import sys
import time

os.environ["CUDA_VISIBLE_DEVICES"] = "0"

from melo.api import TTS

OUT_DIR = "/home/afterlife/afterlife-server/openvoice-afterlife/outputs"
os.makedirs(OUT_DIR, exist_ok=True)

print("[1/2] MeloTTS KR voice loading...")
t0 = time.time()
tts = TTS(language="KR", device="cpu")
print(f"  loaded in {time.time()-t0:.1f}s")
spk = tts.hps.data.spk2id["KR"]

# 부산 할매 톤에 맞을 만한 텍스트 (KB 영감)
text = "안녕? 우리 강아지, 밥은 묵었나? 할매가 그건 잘 모르겠다 야. 동백꽃이지, 내 새끼."

# 4가지 변형 — speed 와 sdp_ratio (운율 변동성) 조합
variants = [
    # (filename, speed, sdp_ratio, noise_scale_w, 설명)
    ("halmoni_v1_slow.wav", 0.85, 0.2, 0.8, "speed=0.85 (조금 느림), 기본 운율"),
    ("halmoni_v2_slower.wav", 0.75, 0.2, 0.8, "speed=0.75 (꽤 느림)"),
    ("halmoni_v3_wavering.wav", 0.85, 0.5, 1.2, "speed=0.85, sdp 0.5, noise_scale_w 1.2 (떨림 ↑)"),
    ("halmoni_v4_old.wav", 0.70, 0.5, 1.0, "speed=0.70, sdp 0.5 (가장 노년 흉내)"),
]

print("[2/2] synthesizing variants...")
for fname, speed, sdp, nsw, desc in variants:
    out = os.path.join(OUT_DIR, fname)
    t0 = time.time()
    try:
        tts.tts_to_file(
            text, spk, out,
            speed=speed,
            sdp_ratio=sdp,
            noise_scale=0.6,
            noise_scale_w=nsw,
        )
        sz = os.path.getsize(out)
        dur = time.time() - t0
        print(f"  {fname}: {dur:.1f}s, {sz} bytes -- {desc}")
    except TypeError as e:
        print(f"  [warn] {fname}: API param unsupported ({e}), speed only fallback")
        tts.tts_to_file(text, spk, out, speed=speed)
        print(f"  {fname}: fallback OK, {os.path.getsize(out)} bytes")

print("done")
