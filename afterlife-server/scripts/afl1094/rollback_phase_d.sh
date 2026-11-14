#!/bin/bash
# AFL-1094 4단계 되돌리기 — 백업 폴더에서 모델·__init__.py 복원 + 컨테이너 insightface 0.7.3 재설치 + 두 서비스 재시작.
# (설정은 MediaPipe 그대로. InsightFace 로 되돌리려면 이어서 rollback_phase_b.sh)
# 사용: rollback_phase_d.sh <TS>
set -e
TS="$1"; [ -n "$TS" ] || { echo "사용: $0 <TS>"; exit 1; }
ssh afterlife-gabia "TS=$TS bash -s" <<'REMOTE'
set -e
C=fifth_poc_flp
FLPH=/data/afterlife/fifth-poc/FasterLivePortrait
BAK=/data/afterlife/bak-afl1094-insightface-$TS
[ -d $BAK ] || { echo "백업 없음: $BAK"; exit 1; }
sudo cp -p $BAK/flp-checkpoints/* $FLPH/checkpoints/liveportrait_onnx/
cp -p $BAK/flp-src/__init__.py $FLPH/src/models/__init__.py
[ -d $BAK/home-insightface ] && cp -a $BAK/home-insightface /home/afterlife/.insightface
[ -d $BAK/liveportrait-afterlife-insightface ] && cp -a $BAK/liveportrait-afterlife-insightface /home/afterlife/afterlife-server/liveportrait-afterlife/source/pretrained_weights/insightface
docker exec $C /root/miniconda3/bin/pip install -q insightface==0.7.3 2>&1 | tail -1
sudo systemctl restart afterlife-fifth-render afterlife-emote-render
sleep 20
echo "fifth-render=$(systemctl is-active afterlife-fifth-render) emote-render=$(systemctl is-active afterlife-emote-render)"
REMOTE
