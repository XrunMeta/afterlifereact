#!/usr/bin/env bash
# _remote_t088_continuation_deploy.sh — T-088 continuation 변경 파일 가비아 배포
#
# 로컬 Mac 에서 실행. scp 로 가비아 공유마운트에 파일을 배포한다.
# 대상 경로(/home/afterlife/afterlife-server/fifth/scripts/)는
# 컨테이너 fifth_poc_flp 에 동일 경로로 마운트돼 있어 배포 즉시 반영된다.
#
# ──────────────────────────────────────────────────────────────────────────
# 사용법:
#   ./afterlife-server/fifth/scripts/_remote_t088_continuation_deploy.sh
#
# 환경 변수:
#   GABIA      SSH 별칭 (기본: afterlife-gabia)  ~/.ssh/config 에 정의돼 있어야 함.
#   DRY_RUN=1  실제 파일 전송 없이 무엇을 할지 출력만.
#
# 실행 순서:
#   1) 이 스크립트 실행 (로컬)
#   2) 렌더서버(:8810) 기동 확인 (죽어있으면 run 스크립트가 안내)
#   3) _remote_t088_continuation_run.sh 실행 → verdict JSON 확인
#
# 배포 파일 (S3/S4 변경분):
#   phase_token.py          위상 토큰 dataclass (PhaseToken)
#   fifth_render.py         렌더 루프 (_stream_single/_stream_blend, S3 빈wav 패스스루)
#   fifth_render_server.py  HTTP 렌더서버 (S4 토큰 트레일러 프로토콜, 타입검증 헬퍼)
#   render_offline.py       오프라인 렌더 유틸
#   t088_continuation_compare.py  게이트0 비교 스크립트
#
# 멱등: 재실행 안전. .t088-bak 백업은 기존 파일이 있을 때만 생성(덮어쓰기).
# ──────────────────────────────────────────────────────────────────────────
set -euo pipefail

GABIA="${GABIA:-afterlife-gabia}"
DEST="/home/afterlife/afterlife-server/fifth/scripts"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN="${DRY_RUN:-0}"

# S3/S4 변경 파일 목록
DEPLOY_FILES=(
  phase_token.py
  fifth_render.py
  fifth_render_server.py
  render_offline.py
  t088_continuation_compare.py
)

# DRY_RUN 래퍼
run()  { echo "+ $*"; [ "$DRY_RUN" = "1" ] || "$@"; }
rrun() { echo "+ ssh $GABIA \"$*\""; [ "$DRY_RUN" = "1" ] || ssh "$GABIA" "$*"; }

echo "========================================================"
echo " T-088 continuation 배포  (gabia=$GABIA  DRY_RUN=$DRY_RUN)"
echo "========================================================"

# ---- 0. 로컬 파일 존재 확인 -------------------------------------------------
echo ""
echo "==> [0] 로컬 파일 확인 ($HERE/)"
for f in "${DEPLOY_FILES[@]}"; do
  src="$HERE/$f"
  if [ ! -f "$src" ]; then
    echo "  FATAL: 없음 — $src"
    exit 1
  fi
  echo "  OK  $f"
done

# ---- 1. 가비아 대상 디렉토리 확인 -------------------------------------------
echo ""
echo "==> [1] 가비아 대상 디렉토리 확인"
rrun "[ -d '$DEST' ] && echo '  OK: $DEST 존재' || { echo 'FATAL: $DEST 없음'; exit 1; }"

# ---- 2. 기존 파일 백업 (.t088-bak) ------------------------------------------
echo ""
echo "==> [2] 기존 파일 백업 (.t088-bak)"
for f in "${DEPLOY_FILES[@]}"; do
  rrun "[ -f '$DEST/$f' ] && cp -a '$DEST/$f' '$DEST/$f.t088-bak' && echo '  bak: $f' || echo '  (skip bak — 신규: $f)'"
done

# ---- 3. scp 배포 ------------------------------------------------------------
echo ""
echo "==> [3] scp 배포 → $GABIA:$DEST/"
for f in "${DEPLOY_FILES[@]}"; do
  echo "  scp $f"
  [ "$DRY_RUN" = "1" ] || scp "$HERE/$f" "$GABIA:$DEST/$f"
done

# ---- 4. 배포 후 타임스탬프 확인 ---------------------------------------------
echo ""
echo "==> [4] 배포 파일 타임스탬프 (가비아)"
for f in "${DEPLOY_FILES[@]}"; do
  rrun "ls -la '$DEST/$f'"
done

echo ""
echo "========================================================"
echo " 배포 완료."
echo ""
echo " 다음 단계:"
echo "   1) 렌더서버(:8810) 기동 확인 — run 스크립트가 체크해 안내."
echo "   2) _remote_t088_continuation_run.sh 실행:"
echo "      WAV=<answer.wav> SRC=<face.jpg> \\"
echo "        ./afterlife-server/fifth/scripts/_remote_t088_continuation_run.sh"
echo ""
echo " ⚠️  렌더서버가 이미 떠 있으면 배포 파일이 즉시 반영."
echo "    (컨테이너 재기동 없이 공유마운트로 파이썬 파일 교체됨)"
echo "========================================================"
