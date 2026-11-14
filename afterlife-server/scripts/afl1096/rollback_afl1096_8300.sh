#!/bin/bash
# AFL-1096 후속 되돌리기 — BiSeNet 가중치 복귀 + :8300 inference_lib 원복·drop-in 제거 → :8300 재시작.
# prethird 까지 BiSeNet 으로 되돌리려면 이 스크립트 다음에 rollback_afl1096.sh <prethird TS> (가중치가 먼저 돌아와 있어야 함).
# 사용: rollback_afl1096_8300.sh <TS>
set -e
TS="$1"; [ -n "$TS" ] || { echo "사용: $0 <TS>"; exit 1; }
ssh afterlife-gabia "TS=$TS bash -s" <<'REMOTE'
set -e
MT=/home/afterlife/afterlife-server/musetalk-afterlife
BAK=/data/afterlife/bak-afl1096-bisenet-$TS
[ -d $BAK/face-parse-bisent ] && [ ! -d $MT/models/face-parse-bisent ] && cp -a $BAK/face-parse-bisent $MT/models/ && echo "가중치 복귀"
[ -f $MT/source/scripts/bak-afl1096-$TS-inference_lib.py ] && cp -p $MT/source/scripts/bak-afl1096-$TS-inference_lib.py $MT/source/scripts/inference_lib.py && echo "inference_lib 원복"
sudo rm -f /etc/systemd/system/afterlife-musetalk.service.d/zz-afl1096-face-parser.conf
sudo systemctl daemon-reload
sudo systemctl restart afterlife-musetalk
for i in $(seq 1 40); do sleep 3; ss -ltn | grep -q '127.0.0.1:8300' && break; done
echo ":8300 listen: $(ss -ltn | grep -c '127.0.0.1:8300')"
REMOTE
