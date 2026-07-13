#!/usr/bin/env bash
# T-068 입싱크 튜닝 래퍼 — 컨테이너서 렌더 → 호스트 복사 → 경로 출력
# 사용: ssh afterlife-gabia 'bash ~/run_tune.sh --tag t1 --lip-open 0.6 --offset 2 --sigma 1.0'
# 그 후 로컬: scp afterlife-gabia:/data/afterlife/fifth-poc/audio_muxed/acoustic_<tag>.mp4 ~/Desktop/
set -uo pipefail
TAG="tune"
for ((i=1;i<=$#;i++)); do [ "${!i}" = "--tag" ] && j=$((i+1)) && TAG="${!j}"; done

docker cp /data/afterlife/fifth-poc/scripts/t068_tune.py fifth_poc_flp:/root/FasterLivePortrait/t068_tune.py 2>/dev/null || true
docker exec fifth_poc_flp bash -lc \
  "cd /root/FasterLivePortrait && LD_LIBRARY_PATH=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib:\$LD_LIBRARY_PATH CUDA_VISIBLE_DEVICES=0 /root/miniconda3/bin/python t068_tune.py $*"

mkdir -p /data/afterlife/fifth-poc/audio_muxed
docker cp fifth_poc_flp:/root/FasterLivePortrait/gominju_out/audio_muxed/acoustic_${TAG}.mp4 \
  /data/afterlife/fifth-poc/audio_muxed/acoustic_${TAG}.mp4 2>/dev/null \
  && echo ">> 완료: /data/afterlife/fifth-poc/audio_muxed/acoustic_${TAG}.mp4" \
  || echo ">> 렌더 실패 — 위 로그 확인"
echo ">> 로컬 받기: scp afterlife-gabia:/data/afterlife/fifth-poc/audio_muxed/acoustic_${TAG}.mp4 ~/Desktop/"
