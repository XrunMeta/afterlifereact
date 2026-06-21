#!/usr/bin/env python
# t078_render_fifth_idle.py <face_jpg> <out_mp4>
#
# fifth 통화 idle 재현 — 정면사진 + 무음 wav 를 FifthInproc.infer 로 렌더(통화 idle_prebake 와 동일 경로).
# 컨테이너 fifth_render_server 가 입력 9:16 정규화(FIFTH_INPUT_NORMALIZE)·pasteback 적용.
# 결과 idle 프레임을 25fps mp4 로 저장해 눈/입/시선 육안 확인용.
#
# 실행: /home/afterlife/miniconda3/envs/musetalk/bin/python t078_render_fifth_idle.py <face> <out>
import sys
import os
import numpy as np
import cv2

sys.path.insert(0, "/home/afterlife/afterlife-server/prethird/scripts")
os.environ.setdefault("FIFTH_RENDER_URL", "http://203.0.113.30:8810")

from fifth_inproc import FifthInproc
from idle_prebake import make_silent_wav

face = sys.argv[1]
out = sys.argv[2]
secs = int(os.environ.get("FIFTH_IDLE_SEC", "6"))

tmpdir = "/home/afterlife/afterlife-server/.fifth-tmp"
os.makedirs(tmpdir, exist_ok=True)
wav = make_silent_wav(os.path.join(tmpdir, "t078_silent_idle.wav"), seconds=secs)

f5 = FifthInproc(face)
f5.load()

frames: list = []
f5.infer(wav, lambda fr: frames.append(np.ascontiguousarray(fr)), video_path=face)

print(f"frames={len(frames)}")
if not frames:
    print("NO FRAMES — idle 렌더 실패")
    sys.exit(1)

h, w = frames[0].shape[:2]
print(f"size={w}x{h}")
vw = cv2.VideoWriter(out, cv2.VideoWriter_fourcc(*"mp4v"), 25, (w, h))
for fr in frames:
    vw.write(cv2.cvtColor(fr, cv2.COLOR_RGB2BGR))
vw.release()
print(f"OK {out}")
