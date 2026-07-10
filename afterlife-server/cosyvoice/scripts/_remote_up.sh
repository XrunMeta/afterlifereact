#!/usr/bin/env bash
# CosyVoice2 어댑터 임시 기동 (PoC, 가비아 GPU1). 정식 배포는 deploy/afterlife-cosyvoice.service.
# 실행: ssh afterlife-gabia "bash /home/afterlife/cosyvoice-poc/adapter/_remote_up.sh"
set -uo pipefail
CONDA=/home/afterlife/miniconda3
POC=/home/afterlife/cosyvoice-poc
SCRIPTS="${COSYVOICE_SCRIPTS:-$POC/adapter}"   # 어댑터 *.py 위치(scp 대상)
PORT="${COSYVOICE_PORT:-8203}"
LOG="$POC/adapter.log"

source "$CONDA/etc/profile.d/conda.sh"; conda activate cosyvoice-poc
export PYTHONPATH="$POC/repo:$POC/repo/third_party/Matcha-TTS"
export CUDA_VISIBLE_DEVICES=1                  # GPU1(여유 40GB) 고정

# 기존 인스턴스 종료(포트 재사용)
pkill -f "uvicorn server:app.*--port $PORT" 2>/dev/null && sleep 2 || true

cd "$SCRIPTS"
nohup env COSYVOICE_PORT="$PORT" uvicorn server:app \
     --host 127.0.0.1 --port "$PORT" --app-dir "$SCRIPTS" > "$LOG" 2>&1 &
echo "cosyvoice adapter started pid=$! port=$PORT scripts=$SCRIPTS log=$LOG"
echo "healthz: curl -s http://127.0.0.1:$PORT/healthz"
