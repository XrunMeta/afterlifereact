#!/usr/bin/env bash
# _remote_t067_fixtures.sh — T-067 Task 8 픽스처 생성 SSH 오케스트레이션.
#
# SSH 호스트/원격 경로 컨벤션: _remote_stack_up.sh/_remote_stack_down.sh 에서 차용.
#   AFTERLIFE_SSH=afterlife-gabia (env override 변수명 통일)
#   REMOTE_DIR=/home/afterlife/afterlife-server/fifth/scripts  (fifth_inproc 상대경로 재사용 전제)
#
# 흐름: ① scp t067_make_fixtures.py → 가비아 fifth/scripts/
#       ② 가비아에서 렌더서버(:8810, 컨테이너 fifth_poc_flp) health 확인
#       ③ python3 t067_make_fixtures.py 실행 (인물 discover → 렌더 → 6샷 샘플)
#       ④ rsync 로 로컬 afterlife-server/fixtures/t067-faces/ 로 회수
#
# 실행(로컬): bash afterlife-server/scripts/_remote_t067_fixtures.sh
# 기대 출력: OK: identities=N(>=4) shots=6 each
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
LOCAL_REPO_ROOT="$(cd "$HERE/.." && pwd)"   # afterlife-server/

SSH_HOST="${AFTERLIFE_SSH:-afterlife-gabia}"
REMOTE_DIR="${REMOTE_DIR:-/home/afterlife/afterlife-server/fifth/scripts}"
REMOTE_OUT_DIR="${REMOTE_OUT_DIR:-/home/afterlife/afterlife-server/fixtures/t067-faces}"
REMOTE_SHARED_TMP="${REMOTE_SHARED_TMP:-/home/afterlife/afterlife-server/.fifth-tmp/t067}"
RENDER_URL="${RENDER_URL:-http://203.0.113.30:8810}"
MAX_IDENTITIES="${MAX_IDENTITIES:-8}"
SILENCE_SEC="${SILENCE_SEC:-8.0}"
IDS="${IDS:-}"

LOCAL_OUT_DIR="$LOCAL_REPO_ROOT/fixtures/t067-faces"

echo "=== T-067 Task 8: 픽스처 생성 ==="
echo "  대상: $SSH_HOST"
echo "  원격 스크립트: $REMOTE_DIR/t067_make_fixtures.py"
echo "  원격 출력: $REMOTE_OUT_DIR"
echo "  로컬 회수: $LOCAL_OUT_DIR"
echo ""

echo "[1/4] 원격 디렉토리 확인..."
ssh "$SSH_HOST" "mkdir -p '$REMOTE_DIR' && echo '  디렉토리 OK: $REMOTE_DIR'"

echo ""
echo "[2/4] scp t067_make_fixtures.py..."
scp "$HERE/t067_make_fixtures.py" "$SSH_HOST:$REMOTE_DIR/t067_make_fixtures.py"
echo "  OK"

echo ""
echo "[3/4] 렌더서버 health 확인 + 픽스처 생성 실행 (가비아)..."
ssh "$SSH_HOST" "curl -sf '$RENDER_URL/health' > /dev/null" \
  || { echo "  ERROR: 렌더서버 :8810 health 실패 — docker ps -a | grep fifth 로 상태 확인 후 'docker start fifth_poc_flp' (새 컨테이너 생성 금지)"; exit 1; }
echo "  health OK"

ID_ARG=()
if [[ -n "$IDS" ]]; then
  ID_ARG=(--ids "$IDS")
fi

ssh "$SSH_HOST" \
  "cd '$REMOTE_DIR' && python3 t067_make_fixtures.py \
     --out-dir '$REMOTE_OUT_DIR' \
     --shared-tmp '$REMOTE_SHARED_TMP' \
     --render-url '$RENDER_URL' \
     --max-identities '$MAX_IDENTITIES' \
     --silence-sec '$SILENCE_SEC' \
     ${IDS:+--ids "$IDS"}"

echo ""
echo "[4/4] rsync 회수 → $LOCAL_OUT_DIR ..."
mkdir -p "$LOCAL_OUT_DIR"
rsync -av "$SSH_HOST:$REMOTE_OUT_DIR/" "$LOCAL_OUT_DIR/"

echo ""
echo "================================================================"
echo " 완료 — $LOCAL_OUT_DIR/manifest.json 확인"
echo "================================================================"
