#!/bin/bash
# AFL-1096 되돌리기 — drop-in 제거 + inference_lib.py 백업 복원 → prethird 재시작 (BiSeNet 마스크·기존 캐시로 복귀).
# face_parser.py·mp_face_parsing.py 는 남겨도 무해(옛 inference_lib 는 import 안 함). 통화 중이면 멈춘다.
# 사용: rollback_afl1096.sh <TS>
set -e
TS="$1"; [ -n "$TS" ] || { echo "사용: $0 <TS>"; exit 1; }
ssh afterlife-gabia "TS=$TS bash -s" <<'REMOTE'
set -e
P=/home/afterlife/afterlife-server/prethird/scripts
s=$(curl -s -m5 127.0.0.1:8600/healthz | python3 -c 'import sys,json;print(json.load(sys.stdin).get("sessions",-1))')
[ "$s" = 0 ] || { echo "통화 세션 $s — 끝난 뒤 다시"; exit 1; }
[ -f $P/bak-afl1096-$TS-inference_lib.py ] || { echo "백업 없음"; exit 1; }
cp -p $P/bak-afl1096-$TS-inference_lib.py $P/inference_lib.py
sudo rm -f /etc/systemd/system/afterlife-prethird.service.d/zz-afl1096-face-parser.conf
sudo systemctl daemon-reload
sudo systemctl restart afterlife-prethird
for i in $(seq 1 30); do sleep 3; curl -s -m3 127.0.0.1:8600/healthz | grep -q '"ok": true' && break; done
echo "healthz: $(curl -s -m5 127.0.0.1:8600/healthz)"
REMOTE
