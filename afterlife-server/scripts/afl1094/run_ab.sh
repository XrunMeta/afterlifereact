#!/bin/bash
# AFL-1094 A/B: InsightFace vs MediaPipe 랜드마크 비교 (운영 설정·서비스 무변경, 컨테이너 /tmp/ab 만 씀)
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
scp -q "$HERE/ab_face.py" afterlife-gabia:/tmp/ab_face.py
ssh afterlife-gabia 'set -e
docker exec fifth_poc_flp mkdir -p /tmp/ab
cd ~/afterlife-server/prethird/video-ref
for f in */*-face.jpg; do docker cp "$f" fifth_poc_flp:/tmp/ab/ >/dev/null; done
echo "faces: $(docker exec fifth_poc_flp sh -c "ls /tmp/ab | wc -l")"
docker cp /tmp/ab_face.py fifth_poc_flp:/tmp/ab_face.py
docker exec -e LD_LIBRARY_PATH=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib fifth_poc_flp \
  /root/miniconda3/bin/python /tmp/ab_face.py 2>/tmp/ab_err.log > /tmp/ab_out.jsonl || echo "rc=$?"
echo "rows: $(wc -l < /tmp/ab_out.jsonl)"; grep -v "^\s*$" /tmp/ab_err.log | tail -5'
scp -q afterlife-gabia:/tmp/ab_out.jsonl "$HERE/ab_out.jsonl"
echo "saved: $HERE/ab_out.jsonl"
