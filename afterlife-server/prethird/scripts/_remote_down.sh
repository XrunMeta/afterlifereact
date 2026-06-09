#!/bin/bash
# prethird 정지 (가비아). transient unit 이라 stop 시 unit 정의도 사라짐.
# 실행: ssh afterlife-gabia "bash /home/afterlife/afterlife-server/prethird/scripts/_remote_down.sh"
sudo systemctl stop afterlife-prethird 2>/dev/null || true
sudo systemctl reset-failed afterlife-prethird 2>/dev/null || true
echo "[prethird] stopped"
ss -ltn | grep 8600 && echo "(아직 LISTEN — 확인 필요)" || echo "(8600 해제됨)"
