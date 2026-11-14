#!/bin/bash
# AFL-1094 2단계 되돌리기 — apply_phase_b.sh 가 만든 백업(TS)으로 복원 후 두 서비스 재시작.
# 사용: rollback_phase_b.sh <TS>
set -e
TS="$1"; [ -n "$TS" ] || { echo "사용: $0 <TS>"; exit 1; }
ssh afterlife-gabia "TS=$TS bash -s" <<'REMOTE'
set -e
C=fifth_poc_flp
SD=/etc/systemd/system
BDM=/root/emote-poc/afl1064/src-v2/build_driving_motion.py
sudo cp -p $SD/afterlife-fifth-render.service.bak-afl1094-$TS $SD/afterlife-fifth-render.service
sudo cp -p $SD/afterlife-fifth-render.service.d/.lab-tuner.conf.bak-afl1094-$TS $SD/afterlife-fifth-render.service.d/lab-tuner.conf
sudo cp -p $SD/afterlife-emote-render.service.bak-afl1094-$TS $SD/afterlife-emote-render.service
docker exec $C cp -p $BDM.bak-afl1094-$TS $BDM
sudo systemctl daemon-reload
sudo systemctl restart afterlife-fifth-render afterlife-emote-render
sleep 15
echo "fifth-render=$(systemctl is-active afterlife-fifth-render) emote-render=$(systemctl is-active afterlife-emote-render)"
systemctl show afterlife-fifth-render -p ExecStart | grep -o "FIFTH_CFG_YAML=[^ ]*"
REMOTE
