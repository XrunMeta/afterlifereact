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
# 이전 인스턴스 정지. `pkill + sleep 1` 만으로는 부족했다 — SIGTERM 후 1초 안에 안 죽는
# 프로세스가 소켓만 놓고 살아남아 배포할 때마다 좀비가 쌓였다(2026-08-15 실측: 3개 동시
# 기동, 포트는 최신 것이 잡고 나머지는 유령). 죽을 때까지 기다리고 안 죽으면 -9 로 끝낸다.
for _ in 1 2 3 4 5 6 7 8 9 10; do
  pgrep -f "[r]un_testbed.py" >/dev/null || break   # [r] = pgrep 자기자신 매치 회피
  pkill -f "[r]un_testbed.py" 2>/dev/null || true
  sleep 1
done
pkill -9 -f "[r]un_testbed.py" 2>/dev/null || true
sleep 1
if pgrep -f "[r]un_testbed.py" >/dev/null; then
  echo "[deploy] 🔴 이전 run_testbed.py 를 못 죽였다 — 수동 확인 필요:" >&2
  pgrep -af "[r]un_testbed.py" >&2
  exit 1
fi
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
# 세로 정합(T-078) — 라이브는 drop-in input-vertical.conf 로 576x1024 를 준다.
# 랩만 빠져 있어서 config.WIDTH/HEIGHT 기본값(640x480)으로 dummy 프레임이 나갔다.
# 그러면 첫 화면(640x480) → idle → 렌더(576x1024)로 트랙 해상도가 두 번 바뀌어
# 브라우저 영상이 커졌다 작아졌다 한다. fifth 출력과 같은 576x1024 로 맞춘다
# (fifth/scripts/image_normalize.py TARGET_W/TARGET_H).
export PRETHIRD_WIDTH=576
export PRETHIRD_HEIGHT=1024
# 라이브와 동일 TTS 엔진 — 클론 음성 정합.
# 2026-08-14: 라이브가 CosyVoice2(:8203)로 바뀐 뒤에도 여기가 qwen(:8201)에 묶여 있어
# 랩이 라이브와 다른 엔진으로 튜닝하고 있었다. 라이브 값을 실측해 맞춘다.
# 라이브 확인: systemctl show afterlife-prethird -p Environment | grep TTS_URL
export PRETHIRD_TTS_URL=http://127.0.0.1:8203
export PRETHIRD_TTS_PATH=/tts/kr
# idle 전환 완화(2026-08-18 시험) — 문장 사이 짧은 갭에서 idle 로 빠졌다 돌아오길
# 반복하면 "뚝뚝 끊긴다"로 보인다. grace 를 늘려 짧은 갭은 마지막 프레임으로 버티고,
# 전환이 필요할 때는 dissolve 를 길게 줘 튀지 않게 한다.
#   IDLE_GRACE_SEC          큐가 빈 뒤 idle 로 넘어가기까지 대기(코드 기본 0.5)
#   PRETHIRD_IDLE_BLEND_FRAMES  speak→idle 크로스디졸브 프레임 수(코드 기본 5 = 0.2초)
export IDLE_GRACE_SEC=1.8
export PRETHIRD_IDLE_BLEND_FRAMES=15
# 말이 **끝난** 지점에서만 쓰는 짧은 grace(media_tracks._stream_ended 분기).
# 문장 중간 갭은 위 IDLE_GRACE_SEC 로 길게 버티고, 말이 끝나면 곧바로 idle 로
# 디졸브해 입 모양을 물고 있지 않게 한다. 미설정이면 IDLE_GRACE_SEC 와 동일(회귀 0).
export PRETHIRD_IDLE_GRACE_END_SEC=0.3
# 리드 버퍼(프리롤) — 응답 시작 시 큐에 이만큼 쌓일 때까지 재생을 늦춘다. 중간에
# 렌더가 잠깐 늦어도 버퍼가 버텨 큐 고갈(= idle 로 빠짐)을 줄인다.
# 대가: 첫 소리까지 그만큼 늦어진다(12프레임 = 0.48초 @25fps). 코드 기본 0 = 비활성.
export PRETHIRD_PREROLL_FRAMES=12
# 🔴 렌더 생성 방식. prethird pipeline._resolve_render_mode() 가 **노브가 아니라 이 env**
# 를 읽고, 미설정이면 "partial" 로 떨어진다 — 랩 노브에는 batch 로 보이는데 실제로는
# partial 로 돌고 있었다(2026-08-18 실측). partial 은 조각마다 큐가 마르기 쉬워
# "버퍼링처럼 끊긴다"(히즈키). 라이브도 batch 다.
export PRETHIRD_RENDER_MODE=batch
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
