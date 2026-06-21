#!/usr/bin/env bash
# 서버 코드 drift 감지 — 레포 정본 vs 가비아 실행본 md5 비교.
#
# 배경(KB T-078): fifth/prethird 서버는 git 정본이 있으나 배포가 docker cp/scp 수동.
#   여러 작업(T-069/070/078)이 같은 파일을 다른 시점에 배포하며 drift 누적, 심지어
#   git 어느 브랜치에도 없는 코드(T-070 timing 계측·PLAYBACK_BUFFER_MS)가 가비아에만
#   직접배포된 orphan으로 발견됨. → PR 전·배포 후 정합 검증을 자동화한다.
#
#   fifth    = docker 컨테이너 (fifth_poc_flp:/root/FasterLivePortrait/)
#   prethird = 가비아 호스트   (/home/afterlife/afterlife-server/prethird/scripts/)
#
# 사용:
#   afterlife-server/scripts/_check_server_drift.sh
#   GABIA_SSH=afterlife-gabia FIFTH_CONTAINER=fifth_poc_flp ./_check_server_drift.sh
#
# 종료코드: 0 = drift 없음 / 1 = DRIFT 발견(양쪽 존재 + md5 불일치) / 2 = 접속 실패
#   ⚠️ (레포에만 있고 가비아 미존재)는 미배포 신규파일일 수 있어 drift로 치지 않음(정보만).
set -uo pipefail

SSH=${GABIA_SSH:-afterlife-gabia}
CONTAINER=${FIFTH_CONTAINER:-fifth_poc_flp}
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"                 # afterlife-server/
FIFTH_DIR="$ROOT/fifth/scripts"
PRETHIRD_DIR="$ROOT/prethird/scripts"
CONTAINER_FIFTH=/root/FasterLivePortrait
HOST_PRETHIRD=/home/afterlife/afterlife-server/prethird/scripts

# 로컬 md5 (macOS md5 / Linux md5sum 호환)
lmd5() { if command -v md5 >/dev/null 2>&1; then md5 -q "$1"; else md5sum "$1" | cut -d' ' -f1; fi; }

if ! ssh -o ConnectTimeout=15 "$SSH" 'true' 2>/dev/null; then
  echo "❌ 가비아 SSH 접속 실패: $SSH"
  exit 2
fi

drift=0

# $1=레이블 $2=레포디렉토리 $3=원격 'md5sum *.py' 명령(디렉토리 전체 → 'md5 name' 출력)
check_group() {
  local label="$1" repo_dir="$2" remote_cmd="$3"
  echo "=== $label ==="
  local files
  files=$(cd "$repo_dir" && echo *.py)
  [ "$files" = "*.py" ] && { echo "  (레포 *.py 없음)"; return; }

  # 원격 디렉토리 전체 *.py md5 일괄 수집: basename → md5
  declare -A RMD5=()
  while read -r h f; do
    [ -n "$h" ] && RMD5["$(basename "$f")"]="$h"
  done < <(ssh "$SSH" "$remote_cmd")

  local f r g
  for f in $files; do
    r=$(lmd5 "$repo_dir/$f")
    g=${RMD5[$f]:-MISSING}
    if [ "$g" = "MISSING" ]; then
      echo "  ⚠️  $f — 가비아 미존재(미배포 신규?)"
    elif [ "$r" = "$g" ]; then
      echo "  ✅ $f"
    else
      echo "  ❌ $f  레포=${r:0:8} 가비아=${g:0:8}"
      drift=1
    fi
  done
}

check_group "fifth (컨테이너 $CONTAINER:$CONTAINER_FIFTH)" "$FIFTH_DIR" \
  "docker exec $CONTAINER bash -lc 'cd $CONTAINER_FIFTH && md5sum *.py 2>/dev/null'"
echo ""
check_group "prethird (호스트 $HOST_PRETHIRD)" "$PRETHIRD_DIR" \
  "cd $HOST_PRETHIRD && md5sum *.py 2>/dev/null"

echo ""
if [ "$drift" -eq 0 ]; then
  echo "✅ drift 없음 — 레포 정본 = 가비아 실행본 일치"
else
  echo "❌ DRIFT 발견 — 위 ❌ 파일은 가비아 직접배포 미커밋 의심. 흡수(가비아→레포 커밋) 또는 재배포(레포→가비아) 필요."
fi
exit $drift
