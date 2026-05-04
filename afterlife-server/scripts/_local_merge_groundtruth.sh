#!/usr/bin/env bash
# _local_merge_groundtruth.sh — 회차 029-D-2c-after-2-fix2
# mac 측에서 sync-mirror 의 debug-dump (wav + sidecar JSON) 와 musetalk-outputs (mp4)
# 를 ffmpeg 으로 merge → publisher 입력까지의 데이터 sync 검증용 mp4 생성.
#
# 사용법:
#   1) 가비아 → mac 으로 testbed/debug-dump 와 musetalk outputs 가 sync-mirror 에
#      이미 동기화되어 있다고 가정 (사용자 sync 도구).
#   2) 이 스크립트 실행 → sess-*-gt.mp4 가 sync-mirror/debug-dump/ 에 떨어짐.
#   3) Finder 에서 받아 들어보면 publisher 가 받은 입력 (wav + mp4) 의 sync 가
#      그대로 들리고 보임 → 만약 chat client 와 sync 가 어긋나면 publisher 이후
#      RTP/decoder 단계 문제. 만약 이 mp4 자체가 어긋나면 testbed concat 단계 문제.
#
# 의존: ffmpeg, jq

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DUMP_DIR="${DUMP_DIR:-$REPO_ROOT/afterlife-server/sync-mirror/debug-dump}"
MP4_DIR="${MP4_DIR:-$REPO_ROOT/afterlife-server/sync-mirror/musetalk-outputs}"

[[ -d "$DUMP_DIR" ]] || { echo "[error] DUMP_DIR not found: $DUMP_DIR"; exit 2; }
[[ -d "$MP4_DIR" ]] || { echo "[error] MP4_DIR not found: $MP4_DIR"; exit 2; }
command -v ffmpeg >/dev/null 2>&1 || { echo "[error] ffmpeg not in PATH"; exit 2; }
command -v jq >/dev/null 2>&1 || { echo "[error] jq not in PATH"; exit 2; }

echo "===== ground truth merge ====="
echo "DUMP_DIR=$DUMP_DIR"
echo "MP4_DIR=$MP4_DIR"
echo ""

shopt -s nullglob
sidecars=("$DUMP_DIR"/sess-*.json)
if [[ ${#sidecars[@]} -eq 0 ]]; then
  echo "[info] no sidecar JSON found in $DUMP_DIR"
  exit 0
fi

processed=0
skipped=0
for sidecar in "${sidecars[@]}"; do
  base="$(basename "$sidecar" .json)"   # sess-XXXX
  wav="$DUMP_DIR/${base}.wav"
  out="$DUMP_DIR/${base}-gt.mp4"

  if [[ -f "$out" ]]; then
    skipped=$((skipped+1))
    continue
  fi
  if [[ ! -f "$wav" ]]; then
    echo "[skip] $base: wav missing"
    skipped=$((skipped+1))
    continue
  fi

  mp4_basename="$(jq -r '.mp4_basename // empty' "$sidecar" 2>/dev/null || true)"
  if [[ -z "$mp4_basename" || "$mp4_basename" == "null" ]]; then
    # sidecar 가 아직 mp4_basename 안 채워졌을 수 있음 (musetalk inference 미완료).
    echo "[wait] $base: mp4_basename pending in sidecar (musetalk still running?)"
    skipped=$((skipped+1))
    continue
  fi

  mp4="$MP4_DIR/$mp4_basename"
  if [[ ! -f "$mp4" ]]; then
    echo "[wait] $base: mp4 not synced yet ($mp4_basename)"
    skipped=$((skipped+1))
    continue
  fi

  echo "[merge] $base"
  echo "  wav=$wav"
  echo "  mp4=$mp4"
  echo "  out=$out"

  # mp4 의 video stream + wav 의 audio stream 합치기. mp4 자체에도 audio 가
  # 있을 수 있어 -map 으로 명시.
  ffmpeg -y -hide_banner -loglevel error \
    -i "$mp4" -i "$wav" \
    -map 0:v:0 -map 1:a:0 \
    -c:v copy -c:a aac -b:a 128k \
    -shortest \
    "$out" || { echo "[error] ffmpeg failed for $base"; continue; }

  processed=$((processed+1))
done

echo ""
echo "===== summary ====="
echo "processed=$processed skipped=$skipped total=${#sidecars[@]}"
echo "출력: $DUMP_DIR/sess-*-gt.mp4"
