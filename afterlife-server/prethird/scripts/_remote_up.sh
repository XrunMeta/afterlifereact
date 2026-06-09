#!/bin/bash
# prethird 정식 기동 (가비아, sudo systemd-run transient unit).
# 실행: ssh afterlife-gabia "bash /home/afterlife/afterlife-server/prethird/scripts/_remote_up.sh"
#   (sudo 포함 — 히즈키가 ! 로 실행)
# 정지: scripts/_remote_down.sh
#
# 포트 8600 / GPU1(CUDA_VISIBLE_DEVICES=1) / musetalk in-process 자체 로드.
# 8300(musetalk) · 8400(publisher) · 8500(예약) · CF Realtime 와 완전 무관(별도 프로세스/포트/디렉토리).
set -e

REF=/home/afterlife/afterlife-server/musetalk-afterlife/reference_videos/halbae/halbae-d18m04-25fps.mp4
IDLE=/home/afterlife/afterlife-server/musetalk-afterlife/reference_videos/halbae/halbae-idle.mp4
SE=/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices/nohsanghyun/se.pth
PY=/home/afterlife/miniconda3/envs/musetalk/bin/python
SRV=/home/afterlife/afterlife-server/prethird/scripts/server.py

sudo systemctl stop afterlife-prethird 2>/dev/null || true
sudo systemctl reset-failed afterlife-prethird 2>/dev/null || true
sudo systemd-run --unit=afterlife-prethird --uid=afterlife --gid=afterlife \
  -p WorkingDirectory=/home/afterlife/afterlife-server/prethird \
  --setenv=HOME=/home/afterlife \
  --setenv=CUDA_VISIBLE_DEVICES=1 \
  --setenv=PRETHIRD_PORT=8600 \
  --setenv=PRETHIRD_BIND=127.0.0.1 \
  --setenv=PRETHIRD_REFERENCE_VIDEO="$REF" \
  --setenv=PRETHIRD_IDLE_MP4="$IDLE" \
  --setenv=PRETHIRD_TTS_SE_PATH="$SE" \
  --setenv=PRETHIRD_OLLAMA_URL=http://127.0.0.1:11435 \
  --setenv=PRETHIRD_TTS_URL=http://127.0.0.1:8200 \
  "$PY" "$SRV"

echo "[prethird] 기동 대기(모델 로드 ~7s)..."
sleep 15
echo "=== is-active ==="
systemctl is-active afterlife-prethird || true
echo "=== healthz ==="
curl -fsS --max-time 5 http://127.0.0.1:8600/healthz || echo "(healthz 실패 — journalctl -u afterlife-prethird 확인)"
echo ""
echo "=== 8600 LISTEN ==="
ss -ltn | grep 8600 || echo "(미LISTEN)"
