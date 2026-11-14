#!/bin/bash
# AFL-1096 영상 A/B 실행 — 라이브 무변경(가비아 /tmp 만 씀). 통화 중이면 멈춘다(GPU 공유).
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
s=$(ssh afterlife-gabia 'curl -s -m5 127.0.0.1:8600/healthz' | python3 -c 'import sys,json;print(json.load(sys.stdin).get("sessions",-1))')
[ "$s" = 0 ] || { echo "통화 세션 $s 개 — 끝난 뒤 다시"; exit 1; }
ssh afterlife-gabia 'mkdir -p /tmp/afl1096 && rm -rf /tmp/afl1096-render/out'
scp -q "$HERE/../../prethird/scripts/mp_face_parsing.py" "$HERE/render_ab.py" afterlife-gabia:/tmp/afl1096/
ssh afterlife-gabia 'cd /tmp && CUDA_VISIBLE_DEVICES=0 PYTHONDONTWRITEBYTECODE=1 MUSETALK_BATCH_SIZE=16 \
  /home/afterlife/miniconda3/envs/musetalk/bin/python /tmp/afl1096/render_ab.py 2>/tmp/afl1096-render-err.log | grep "render_ab"; \
  grep -E "Traceback|Error" -A3 /tmp/afl1096-render-err.log | tail -8'
rm -rf "$HERE/render"; mkdir -p "$HERE/render"
scp -q "afterlife-gabia:/tmp/afl1096-render/out/*_cmp.mp4" "$HERE/render/"
ls "$HERE/render"
open "$HERE/render"
