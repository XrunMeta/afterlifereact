#!/usr/bin/env bash
# qwen3tts 서비스 기동 (가비아, GPU0, 포트 8201). prethird musetalk(GPU1)와 분리.
# sudo 필요(systemd-run transient). 정식 unit 화는 검증 후.
set -euo pipefail

sudo systemd-run --unit=afterlife-qwen3tts --uid=afterlife --gid=afterlife \
  --setenv=CUDA_VISIBLE_DEVICES=0 \
  --setenv=QWEN3TTS_PORT=8201 \
  --setenv=QWEN3TTS_DEFAULT_CLONE=halbae \
  --setenv=HF_HOME=/home/afterlife/.cache/huggingface \
  /home/afterlife/miniconda3/envs/qwen3tts/bin/uvicorn server:app \
  --host 127.0.0.1 --port 8201 \
  --app-dir /home/afterlife/afterlife-server/qwen3tts/scripts

echo "started afterlife-qwen3tts (8201, GPU0). healthz: curl -fsS http://127.0.0.1:8201/healthz"
