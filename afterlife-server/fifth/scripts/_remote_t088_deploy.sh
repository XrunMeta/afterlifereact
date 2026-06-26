#!/usr/bin/env bash
# T-088 PoC 스크립트 배포 — t088_build_sequence.py, t088_viewer_server.py 를 가비아 호스트로 scp.
#
# SSH 호스트/원격 경로 컨벤션:
#   _remote_greet_deploy.sh, _remote_learn_deploy.sh 에서 차용.
#   HOST=afterlife-gabia  /  RDIR=/home/afterlife/afterlife-server/fifth/scripts
#
# 실행(로컬, 히즈키 ! 로): bash afterlife-server/fifth/scripts/_remote_t088_deploy.sh
#
# 환경변수로 오버라이드 가능:
#   SSH_HOST=afterlife-gabia REMOTE_DIR=/home/afterlife/... bash _remote_t088_deploy.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"

# 기존 _remote_greet_deploy.sh / _remote_learn_deploy.sh 에서 확인된 값을 기본값으로 사용.
SSH_HOST="${SSH_HOST:-afterlife-gabia}"
REMOTE_DIR="${REMOTE_DIR:-/home/afterlife/afterlife-server/fifth/scripts}"

FILES=(
  "t088_build_sequence.py"
  "t088_viewer_server.py"
)

echo "=== T-088 PoC 배포 ==="
echo "  대상: $SSH_HOST:$REMOTE_DIR"
echo ""

echo "[1/2] 원격 디렉토리 확인..."
ssh "$SSH_HOST" "mkdir -p '$REMOTE_DIR' && echo '  디렉토리 OK: $REMOTE_DIR'"

echo ""
echo "[2/2] scp ${#FILES[@]} files → $SSH_HOST:$REMOTE_DIR ..."
for f in "${FILES[@]}"; do
  local_path="$HERE/$f"
  if [[ ! -f "$local_path" ]]; then
    echo "  ERROR: 로컬 파일 없음: $local_path" >&2
    exit 1
  fi
  scp "$local_path" "$SSH_HOST:$REMOTE_DIR/$f"
  echo "  OK: $f"
done

echo ""
echo "================================================================"
echo " 배포 완료 — T-088 PoC 파일 배포됨"
echo " 대상: $SSH_HOST:$REMOTE_DIR"
echo "================================================================"
echo ""
echo " 다음 단계 (히즈키 ! 실행):"
echo "   Step 2: ssh $SSH_HOST '...' # 백업 + 컨테이너 상태 확인"
echo "   Step 4: ssh $SSH_HOST 'cd $REMOTE_DIR && python t088_build_sequence.py ...'"
echo "   Step 5: ssh $SSH_HOST 'cd $REMOTE_DIR && python t088_viewer_server.py --port 8088'"
echo "   Step 5 터널: ssh -N -L 8088:localhost:8088 $SSH_HOST"
