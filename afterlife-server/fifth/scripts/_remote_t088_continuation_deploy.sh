#!/usr/bin/env bash
# _remote_t088_continuation_deploy.sh — T-088 continuation 파일 측정용 서브디렉토리에 배포
#
# 로컬 Mac 에서 실행. scp 로 가비아 호스트의 측정 전용 디렉토리에만 배포한다.
#
# ──────────────────────────────────────────────────────────────────────────
# ⚠️  절대 건드리지 않는 경로:
#     /data/afterlife/fifth-poc/FasterLivePortrait/*.py   (운영 :8810 렌더서버)
#     /home/afterlife/afterlife-server/fifth/scripts/     (이전 배포 경로 — 무관)
#
# 배포 대상 (측정 전용 서브디렉토리):
#   호스트: /data/afterlife/fifth-poc/FasterLivePortrait/t088_cont/
#   컨테이너: /root/FasterLivePortrait/t088_cont/  (동일 볼륨 마운트)
#
# 이 디렉토리의 fifth_render_server.py 는 :8811 (FIFTH_RENDER_PORT=8811) 로 기동되므로
# 운영 :8810 렌더서버와 완전히 별개 프로세스. 실통화에 무영향.
#
# 의존성(flp_engine/audio2lip/base_source 등)은 PYTHONPATH=/root/FasterLivePortrait 로
# 기존 운영 코드를 그대로 참조. t088_cont/ 에 있는 5개 파일만 변경분으로 우선 로드됨.
#
# ──────────────────────────────────────────────────────────────────────────
# 사용법:
#   ./afterlife-server/fifth/scripts/_remote_t088_continuation_deploy.sh
#
# 환경 변수:
#   GABIA      SSH 별칭 (기본: afterlife-gabia)
#   DRY_RUN=1  실제 전송 없이 동작 출력만
#
# 다음 단계:
#   _remote_t088_continuation_run.sh 실행 (WAV/SRC 지정)
# ──────────────────────────────────────────────────────────────────────────
set -euo pipefail

GABIA="${GABIA:-afterlife-gabia}"
DRY_RUN="${DRY_RUN:-0}"

# 호스트 배포 경로 (= 컨테이너 /root/FasterLivePortrait/t088_cont/)
HOST_DEST="/data/afterlife/fifth-poc/FasterLivePortrait/t088_cont"

# 이 스크립트와 같은 디렉토리 = afterlife-server/fifth/scripts/
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# S3/S4 변경 파일 (flp_engine 등 의존성은 PYTHONPATH 로 운영 경로에서 로드)
DEPLOY_FILES=(
  phase_token.py
  fifth_render.py
  fifth_render_server.py
  render_offline.py
  t088_continuation_compare.py
)

run()  { echo "+ $*"; [ "$DRY_RUN" = "1" ] || "$@"; }
rrun() { echo "+ ssh $GABIA \"$*\""; [ "$DRY_RUN" = "1" ] || ssh "$GABIA" "$*"; }

echo "========================================================"
echo " T-088 continuation 배포  (gabia=$GABIA  DRY_RUN=$DRY_RUN)"
echo " 배포 경로: $HOST_DEST"
echo " ⚠️  운영 :8810 렌더서버 코드 일절 미변경"
echo "========================================================"

# ---- 0. 로컬 파일 존재 확인 -------------------------------------------------
echo ""
echo "==> [0] 로컬 파일 확인 ($HERE/)"
for f in "${DEPLOY_FILES[@]}"; do
  src="$HERE/$f"
  [ -f "$src" ] || { echo "  FATAL: 없음 — $src"; exit 1; }
  echo "  OK  $f"
done

# ---- 1. 가비아 측정 디렉토리 생성 (없으면 mkdir -p) -------------------------
echo ""
echo "==> [1] 측정 디렉토리 준비 (가비아)"
rrun "mkdir -p '$HOST_DEST' && echo '  OK: $HOST_DEST'"
rrun "touch '$HOST_DEST/.write_probe' && rm -f '$HOST_DEST/.write_probe' && echo '  OK: 쓰기 가능'"

# ---- 2. 기존 파일 백업 (.t088-bak, 있는 것만) -------------------------------
echo ""
echo "==> [2] 기존 파일 백업 (.t088-bak)"
for f in "${DEPLOY_FILES[@]}"; do
  rrun "[ -f '$HOST_DEST/$f' ] && cp -a '$HOST_DEST/$f' '$HOST_DEST/$f.t088-bak' && echo '  bak: $f' || echo '  (신규: $f)'"
done

# ---- 3. scp 배포 ------------------------------------------------------------
echo ""
echo "==> [3] scp 배포 → $GABIA:$HOST_DEST/"
for f in "${DEPLOY_FILES[@]}"; do
  echo "  scp $f"
  [ "$DRY_RUN" = "1" ] || scp "$HERE/$f" "$GABIA:$HOST_DEST/$f"
done

# ---- 4. 배포 후 확인 --------------------------------------------------------
echo ""
echo "==> [4] 배포 결과 확인 (가비아)"
rrun "ls -la '$HOST_DEST/'"

echo ""
echo "========================================================"
echo " 배포 완료."
echo " 다음: WAV/SRC 지정 후 run 스크립트 실행."
echo ""
echo "   WAV=<answer.wav> SRC=<face.jpg> \\"
echo "     ./afterlife-server/fifth/scripts/_remote_t088_continuation_run.sh"
echo "========================================================"
