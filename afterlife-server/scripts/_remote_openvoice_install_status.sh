#!/usr/bin/env bash
# _remote_openvoice_install_status.sh — 설치 진행 상황 폴링
set +e

LOG=/home/afterlife/afterlife-server/openvoice-afterlife/install.log
PID_FILE=/home/afterlife/afterlife-server/openvoice-afterlife/install.pid

echo "===== install 상태 ====="
if [[ -f "$PID_FILE" ]]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "[running] pid=$PID"
  else
    echo "[finished] pid=$PID (process exited)"
  fi
else
  echo "[no pid file]"
fi

echo ""
echo "===== 로그 마지막 30줄 ====="
tail -n 30 "$LOG" 2>/dev/null

echo ""
echo "===== 디렉토리 크기 ====="
du -sh /home/afterlife/miniconda3 /home/afterlife/afterlife-server/openvoice-afterlife 2>/dev/null

echo ""
echo "===== 핵심 산출물 존재 여부 ====="
BASE=/home/afterlife/afterlife-server/openvoice-afterlife
for p in \
  /home/afterlife/miniconda3/envs/openvoice/bin/python \
  $BASE/source/openvoice/api.py \
  $BASE/melotts/melo/api.py \
  $BASE/checkpoints_v2/converter/checkpoint.pth; do
  if [[ -e "$p" ]]; then echo "✅ $p"; else echo "❌ $p"; fi
done

echo ""
echo "===== /home 디스크 ====="
df -h /home | tail -1
