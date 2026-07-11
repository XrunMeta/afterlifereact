#!/usr/bin/env bash
# T-127 재발방지: 가비아 라이브(prethird) ↔ preview(워크트리) 정본 drift 감지.
#
# 배경: T-127 근본원인=미머지 기능 브랜치(T-113/T-120 계측·continuation 등)가
#   preview 를 거치지 않고 라이브에 직접 누적 배포되어 6파일이 양방향으로
#   분기(라이브에만 있는 코드 / preview 에만 있는 코드)했던 사고. 재발방지를 위해
#   라이브 scripts/ 를 임시 fetch 해 preview 워크트리와 파일별로 3분류 대조한다.
#
# 사용:
#   afterlife-server/prethird/scripts/_check_live_drift.sh
#   GABIA_SSH=afterlife-gabia ./_check_live_drift.sh
#
# 분류:
#   ≠ DIFF        — 양쪽 존재하나 내용 다름 (줄수 표기)
#   ◀ LIVE-only   — 라이브에만 존재 (preview 미반영 의심 — 흡수 검토)
#   ▶ PREVIEW-only — preview 에만 존재 (라이브 미배포. test_*.py 는 정상)
#   = 일치         — 양쪽 동일
#
# 종료코드: 0 = drift 없음 / 1 = drift 있음(≠ DIFF 또는 test_*.py 아닌 LIVE-only 존재) / 2 = 접속·fetch 실패
set -uo pipefail

SSH=${GABIA_SSH:-afterlife-gabia}
REMOTE_DIR=/home/afterlife/afterlife-server/prethird/scripts
HERE="$(cd "$(dirname "$0")" && pwd)"                 # afterlife-server/prethird/scripts (preview)
TMP_LIVE="$(mktemp -d /tmp/t127-drift-live.XXXXXX 2>/dev/null || echo /tmp/t127-drift-live)"

cleanup() { rm -rf "$TMP_LIVE"; }
trap cleanup EXIT INT TERM

echo "=== T-127 라이브↔preview drift 감지 ==="
echo "라이브: $SSH:$REMOTE_DIR"
echo "preview: $HERE"
echo ""

if ! ssh -o ConnectTimeout=15 "$SSH" 'true' 2>/dev/null; then
  echo "❌ 가비아 SSH 접속 실패: $SSH"
  exit 2
fi

rm -rf "$TMP_LIVE"
if ! scp -q -r "$SSH:$REMOTE_DIR" "$TMP_LIVE" 2>/dev/null; then
  echo "❌ 라이브 scripts/ fetch 실패(scp)"
  exit 2
fi
[ -d "$TMP_LIVE" ] || { echo "❌ fetch 결과 디렉토리 없음: $TMP_LIVE"; exit 2; }

# 파일 목록(basename 기준) 수집 — *.py 만 대상
live_files=()
while IFS= read -r f; do
  live_files+=("$(basename "$f")")
done < <(cd "$TMP_LIVE" && find . -maxdepth 1 -name '*.py' -type f | sed 's|^\./||')

preview_files=()
while IFS= read -r f; do
  preview_files+=("$(basename "$f")")
done < <(cd "$HERE" && find . -maxdepth 1 -name '*.py' -type f | sed 's|^\./||')

# 합집합(union) — 정렬·중복제거
union=()
while IFS= read -r f; do
  union+=("$f")
done < <(printf '%s\n' "${live_files[@]}" "${preview_files[@]}" | sort -u)

in_list() {
  local needle="$1"; shift
  local x
  for x in "$@"; do [ "$x" = "$needle" ] && return 0; done
  return 1
}

diff_count=0
live_only_count=0
preview_only_count=0
match_count=0
drift=0

for f in "${union[@]}"; do
  [ -z "$f" ] && continue
  has_live=0; has_preview=0
  in_list "$f" "${live_files[@]}" && has_live=1
  in_list "$f" "${preview_files[@]}" && has_preview=1

  if [ "$has_live" -eq 1 ] && [ "$has_preview" -eq 1 ]; then
    if cmp -s "$TMP_LIVE/$f" "$HERE/$f"; then
      match_count=$((match_count + 1))
    else
      lines_live=$(wc -l < "$TMP_LIVE/$f" | tr -d ' ')
      lines_preview=$(wc -l < "$HERE/$f" | tr -d ' ')
      echo "  ≠ DIFF        $f  (라이브 ${lines_live}줄 / preview ${lines_preview}줄)"
      diff_count=$((diff_count + 1))
      drift=1
    fi
  elif [ "$has_live" -eq 1 ]; then
    echo "  ◀ LIVE-only    $f  (preview 미반영 의심 — 흡수 검토)"
    live_only_count=$((live_only_count + 1))
    drift=1
  else
    case "$f" in
      test_*.py)
        echo "  ▶ PREVIEW-only $f  (정상 — 서버 미배포 테스트 파일)"
        ;;
      *)
        echo "  ▶ PREVIEW-only $f  (라이브 미배포)"
        ;;
    esac
    preview_only_count=$((preview_only_count + 1))
  fi
done

echo ""
echo "--- 요약 ---"
echo "일치: $match_count / DIFF: $diff_count / LIVE-only: $live_only_count / PREVIEW-only: $preview_only_count"
echo ""

if [ "$drift" -eq 0 ]; then
  echo "✅ drift 없음 — 라이브 = preview 정본 일치(PREVIEW-only 는 미배포 신규/테스트 파일)"
else
  echo "❌ drift 있음 — 위 ≠ DIFF / ◀ LIVE-only 항목을 preview 로 역포팅(흡수) 검토 필요"
fi
exit $drift
