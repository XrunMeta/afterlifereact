#!/usr/bin/env bash
# lab-tuner 가비아 배포 + 기동. 로컬에서 실행(rsync push).
# 라이브 prethird/fifth 무수정 — 테스트베드는 별도 :8700 프로세스, 공유 백엔드 사용.
#
# 사용: bash afterlife-server/lab-tuner/scripts/_remote_lab_deploy.sh
#   HOST 환경변수로 ssh 대상 재지정 가능(기본 afterlife-gabia).
set -euo pipefail

HOST="${HOST:-afterlife-gabia}"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"          # .../afterlife-server/lab-tuner
REMOTE_DIR="/home/afterlife/afterlife-server/lab-tuner"

echo "[deploy] rsync ${LOCAL_DIR}/ -> ${HOST}:${REMOTE_DIR}/"
rsync -az --delete \
  --exclude '__pycache__' --exclude '.pytest_cache' --exclude 'tests' \
  "${LOCAL_DIR}/" "${HOST}:${REMOTE_DIR}/"

echo "[deploy] 원격 기동(setsid) + 검증"
ssh "$HOST" 'bash -s' <<'REMOTE'
set -e
cd /home/afterlife/afterlife-server/lab-tuner
pkill -f run_testbed.py 2>/dev/null || true
sleep 1
# promote 인증 토큰(최초 1회 생성, 재사용).
TOKEN=$(cat /home/afterlife/.lab_tuner_token 2>/dev/null || openssl rand -hex 16)
echo "$TOKEN" > /home/afterlife/.lab_tuner_token
chmod 600 /home/afterlife/.lab_tuner_token

export LAB_TUNER_PORT=8700
# fifth 렌더는 라이브 공유(컨테이너 bridge IP). 라이브 prethird FIFTH_RENDER_URL과 동일.
export FIFTH_RENDER_URL=http://203.0.113.30:8810
export LAB_LIVE_HEALTHZ=http://127.0.0.1:8600/healthz
export PRETHIRD_API_BASE=https://edge-alt-preview.example.invalid
export PRETHIRD_REFERENCE_VIDEO=/home/afterlife/afterlife-server/musetalk-afterlife/reference_videos/halbae/halbae-d18m04-25fps.mp4
export LAB_ARTIFACTS=/home/afterlife/afterlife-server/.lab-artifacts
# 테스트베드 say가 실클론 L2 학습을 오염시키지 않도록 강제 비활성.
export PRETHIRD_LEARN_ENABLED=0
# fifth 렌더(컨테이너)가 infer wav를 읽으려면 공유마운트 하위 TMPDIR 필수(T-088 교훈).
export TMPDIR=/home/afterlife/afterlife-server/.fifth-tmp
# 라이브와 동일 TTS 엔진(qwen 8201) — 클론 음성 정합.
export PRETHIRD_TTS_URL=http://127.0.0.1:8201
export PRETHIRD_TTS_PATH=/tts/kr
export LAB_TUNER_TOKEN="$TOKEN"
# dev-token 자동주입 활성 — 이 호스트는 단일테넌트 SSH-터널 개발 전용이라
# loopback /dev-token 으로 UI 가 admin 토큰을 받아 promote(apply/restart) 인증을 통과한다.
# ⚠️ 공유/멀티테넌트 호스트에선 절대 설정 금지(app.py 주석 참조).
export LAB_TUNER_DEV_TOKEN_ENABLE=1

# 파이썬은 라이브 prethird와 동일 conda env(aiortc/av/numpy 보유).
setsid /home/afterlife/miniconda3/envs/musetalk/bin/python run_testbed.py \
  > /tmp/lab-tuner.log 2>&1 < /dev/null &
disown 2>/dev/null || true
sleep 7
echo "[health]"
curl -sf http://127.0.0.1:8700/healthz && echo " OK" || { echo DOWN; tail -25 /tmp/lab-tuner.log; exit 1; }
REMOTE

echo "[deploy] 완료. 터널:  ssh -N -L 8700:127.0.0.1:8700 ${HOST}   → http://localhost:8700"
