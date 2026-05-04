#!/usr/bin/env bash
# _remote_ollama_inspect.sh — 가비아의 ollama 인프라 인스펙트 (root 로 실행)
# Stage 1 격리 인스턴스 (:11435) 셋업 전 사전 정보 수집
set +e

echo "===== ollama binary ====="
which ollama
ollama --version 2>&1 | head -3

echo ""
echo "===== systemd unit (system level) ====="
systemctl cat ollama 2>&1 | head -40
echo "---"
systemctl status ollama --no-pager 2>&1 | head -15

echo ""
echo "===== /etc/systemd/system/ollama* + /lib/systemd/system/ollama* ====="
ls -la /etc/systemd/system/ 2>/dev/null | grep -i ollama
ls -la /lib/systemd/system/ 2>/dev/null | grep -i ollama
ls -la /usr/lib/systemd/system/ 2>/dev/null | grep -i ollama

echo ""
echo "===== ollama 환경 / 데이터 디렉토리 ====="
ls -la /usr/share/ollama 2>/dev/null
ls -la /var/lib/ollama 2>/dev/null
ls -la /root/.ollama 2>/dev/null | head -5
ls /usr/share/ollama/.ollama/models 2>/dev/null | head -10
getent passwd ollama 2>/dev/null

echo ""
echo "===== ollama 프로세스 + 환경 ====="
pgrep -a ollama
PID=$(pgrep -x ollama | head -1)
if [[ -n "$PID" ]]; then
  echo "--- /proc/$PID/environ ---"
  tr '\0' '\n' < /proc/$PID/environ 2>/dev/null | grep -iE "OLLAMA|HOME|PATH" | head -20
fi

echo ""
echo "===== 현재 모델 목록 (기존 :11434) ====="
curl -sS --max-time 5 http://127.0.0.1:11434/api/tags 2>&1 | head -40

echo ""
echo "===== 디스크 여유 ====="
df -h / /home /data 2>/dev/null

echo ""
echo "===== /data 소유 / 권한 ====="
ls -ld /data /data/* 2>/dev/null | head -10
stat -c '%U:%G %a %n' /data 2>/dev/null

echo ""
echo "===== GPU 메모리 현황 ====="
nvidia-smi --query-gpu=memory.used,memory.free,memory.total --format=csv

echo ""
echo "===== DONE ====="
