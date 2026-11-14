#!/bin/bash
# AFL-1096 A/B 실행 — 운영 무변경. 가비아 /tmp/afl1096/ 에 스크립트를 올리고 /tmp/afl1096-ab/ 에 결과를 쓴 뒤 로컬로 가져온다.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
ssh afterlife-gabia 'mkdir -p /tmp/afl1096 /tmp/afl1096-ab && rm -f /tmp/afl1096-ab/*.png'
scp -q "$HERE/../../prethird/scripts/mp_face_parsing.py" "$HERE/ab_mask.py" afterlife-gabia:/tmp/afl1096/
ssh afterlife-gabia 'CUDA_VISIBLE_DEVICES=0 /home/afterlife/miniconda3/envs/musetalk/bin/python /tmp/afl1096/ab_mask.py 2>/tmp/afl1096-ab/err.log | tee /tmp/afl1096-ab/result.jsonl | tail -4; echo "rows: $(grep -c stem /tmp/afl1096-ab/result.jsonl)"; grep -vE "^\s*$|Warning|warn|WARNING|I0000|W0000" /tmp/afl1096-ab/err.log | tail -5'
rm -rf "$HERE/ab"; mkdir -p "$HERE/ab"
scp -q "afterlife-gabia:/tmp/afl1096-ab/*" "$HERE/ab/"
echo "saved: $HERE/ab/"
