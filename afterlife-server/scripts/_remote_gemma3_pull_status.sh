#!/usr/bin/env bash
# _remote_gemma3_pull_status.sh — pull 진행 상황 폴링
set +e

LOG=/home/afterlife/ollama-pull-gemma3-27b.log
PID_FILE=/home/afterlife/ollama-pull-gemma3-27b.pid

echo "===== pull 상태 ====="
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
echo "===== 로그 마지막 15줄 ====="
tail -n 15 "$LOG" 2>/dev/null

echo ""
echo "===== 모델 디렉토리 크기 ====="
du -sh /data/afterlife/ollama-models 2>/dev/null

echo ""
echo "===== /oth-path ====="
curl -sS --max-time 5 http://127.0.0.1:11435/api/tags

echo ""
echo "===== /data 디스크 ====="
df -h /data | tail -1

echo ""
echo "===== DONE ====="
