#!/bin/bash
# t077_idle_eye_gain_sweep.sh <src_image> [out_dir]
#
# T-077 D안 검증: live_portrait_pipeline.py 의 IDLE_EYE_OPEN_GAIN 패치 효과 sweep.
# driving_multiplier 0.4 고정(머리·입 모션 보존), 눈 gain 만 변화시켜 눈 크기 비교.
#   g100      = gain 1.0 (패치 무효 = 현재 운영과 동일, 기준선)
#   g050/030/015 = 눈 모션 0.5/0.3/0.15 배 (대칭: 뜸·blink 둘 다 축소)
#   g030asym  = gain 0.3 + 비대칭(눈 뜨는 방향만 축소, blink 원본 유지)
#
# 사용: ssh afterlife-gabia 'bash /home/afterlife/afterlife-server/scripts/t077_idle_eye_gain_sweep.sh <src.jpg>'
set -e
set -o pipefail

SRC="$1"
OUTDIR="${2:-/tmp/t077_gain_sweep}"
LP=/home/afterlife/afterlife-server/liveportrait-afterlife/source
PY=/home/afterlife/miniconda3/envs/liveportrait/bin/python
DRIVING=normal-idle

[ -n "$SRC" ] || { echo "ERR: usage: $0 <src_image> [out_dir]" >&2; exit 1; }
[ -f "$SRC" ] || { echo "ERR: src not found: $SRC" >&2; exit 1; }
mkdir -p "$OUTDIR"
cd "$LP"

# run <label> <gain> [asym]
run() {
  local label="$1" gain="$2" asym="${3:-0}"
  local tmp; tmp=$(mktemp -d)
  echo ">>> $label (gain=$gain asym=$asym)"
  if IDLE_EYE_OPEN_GAIN="$gain" IDLE_EYE_OPEN_ASYM="$asym" CUDA_VISIBLE_DEVICES=1 "$PY" inference.py \
       -s "$SRC" \
       -d "$LP/assets/examples/driving/$DRIVING.mp4" \
       --driving_multiplier 0.4 \
       --no-flag_do_torch_compile \
       -o "$tmp" > "$tmp/lp.log" 2>&1; then
    local gen; gen=$(find "$tmp" -name "*--$DRIVING.mp4" ! -name "*concat*" | head -1)
    if [ -n "$gen" ]; then
      ffmpeg -y -loglevel error -i "$gen" -r 25 -c:v libx264 -pix_fmt yuv420p -an "$OUTDIR/$label.mp4"
      echo "    OK $OUTDIR/$label.mp4"
    else
      echo "    ERR: no output"; tail -8 "$tmp/lp.log" | sed 's/^/      /'
    fi
  else
    echo "    ERR: inference failed"; tail -15 "$tmp/lp.log" | sed 's/^/      /'
  fi
  rm -rf "$tmp"
}

run "g100"     1.0
run "g050"     0.5
run "g030"     0.3
run "g015"     0.15
run "g030asym" 0.3 1

echo "=== done: $OUTDIR ==="
ls -la "$OUTDIR"
