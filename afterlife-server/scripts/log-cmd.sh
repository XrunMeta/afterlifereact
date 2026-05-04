#!/usr/bin/env bash
# log-cmd.sh — 서버 작업 명령을 afterlife-server-log/ 에 회차별로 기록
#
# 사용법:
#   ./log-cmd.sh <tag> <command...>
#     tag      : 짧은 동작 식별자 (예: ssh-init, gpu-check)
#     command  : 실제 실행할 셸 명령 (따옴표로 감싸도 되고 분리해도 됨)
#
# 파일 규약:
#   afterlife-server-log/terminalYYYYMMDD-NNN-<tag>.log
#   NNN 은 그날의 회차 (해당 날짜 폴더 내 기존 파일 검사 후 +1, 3자리 zero-pad)
#
# 헤더에 시간/호스트/작업자/명령/종료코드 포함.

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <tag> <command...>" >&2
  exit 2
fi

TAG="$1"
shift
CMD=("$@")

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$REPO_ROOT/afterlife-server-log"

mkdir -p "$LOG_DIR"

DATE_STR="$(date +%Y%m%d)"
PREFIX="terminal${DATE_STR}-"

# 회차 계산: 같은 날짜의 가장 큰 NNN + 1
LAST_NUM=$(ls "$LOG_DIR" 2>/dev/null \
  | grep -E "^${PREFIX}[0-9]{3}-" \
  | sed -E "s/^${PREFIX}([0-9]{3})-.*/\1/" \
  | sort -n | tail -1 || true)

if [[ -z "${LAST_NUM:-}" ]]; then
  NEXT_NUM="001"
else
  NEXT_NUM=$(printf "%03d" $((10#$LAST_NUM + 1)))
fi

LOG_FILE="$LOG_DIR/${PREFIX}${NEXT_NUM}-${TAG}.log"

{
  echo "# afterlife server command log"
  echo "# file        : $(basename "$LOG_FILE")"
  echo "# datetime    : $(date -Iseconds)"
  echo "# host        : $(hostname)"
  echo "# user        : ${USER:-unknown}"
  echo "# tag         : $TAG"
  echo "# command     : ${CMD[*]}"
  echo "# ----- begin output -----"
} > "$LOG_FILE"

set +e
"${CMD[@]}" 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}
set -e

{
  echo "# ----- end output -----"
  echo "# exit_code   : $EXIT_CODE"
  echo "# finished_at : $(date -Iseconds)"
} >> "$LOG_FILE"

echo ""
echo "[log-cmd] saved -> $LOG_FILE (exit=$EXIT_CODE)"
exit "$EXIT_CODE"
