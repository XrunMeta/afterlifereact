#!/usr/bin/env bash
# _remote_gemma3_pull_start.sh — gemma3:27b 백그라운드 pull 시작 (afterlife 계정, :11435)
# 로컬 연결 끊겨도 서버에서 계속 받도록 nohup + setsid
set +e

LOG=/home/afterlife/ollama-pull-gemma3-27b.log
PID_FILE=/home/afterlife/ollama-pull-gemma3-27b.pid

# 이미 받고 있는지 체크
if [[ -f "$PID_FILE" ]] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
  echo "[skip] pull already running pid=$(cat $PID_FILE)"
  exit 0
fi

# 모델 이미 존재?
EXISTS=$(curl -sS --max-time 5 http://127.0.0.1:11435/api/tags | grep -c '"gemma3:27b"')
if [[ "$EXISTS" -gt 0 ]]; then
  echo "[skip] gemma3:27b already present"
  exit 0
fi

# afterlife 사용자로 백그라운드 pull 시작
sudo -u afterlife bash -c "
  cd /home/afterlife
  : > $LOG
  echo '[start] $(date -Iseconds)' >> $LOG
  nohup setsid env OLLAMA_HOST=127.0.0.1:11435 \
    /usr/local/bin/ollama pull gemma3:27b \
    >> $LOG 2>&1 &
  echo \$! > $PID_FILE
"

sleep 1
echo "[started] pid=$(cat $PID_FILE)"
echo "[log] $LOG"
ls -la "$LOG" "$PID_FILE"
