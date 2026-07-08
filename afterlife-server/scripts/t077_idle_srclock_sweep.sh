#!/bin/bash
# t077_idle_srclock_sweep.sh <src_image> [out_dir]
#
# T-077 D안 v2: IDLE_EYE_SOURCE_LOCK retarget_eye 의 IDLE_EYE_TARGET_SCALE sweep.
# 눈 목표 eye-open 비율 = source 실측치 * scale. scale 을 낮추면 눈을 더 감긴 쪽으로 retarget.
# frame0(모션 0, 순수 재구성) 만 추출해 baseline 눈 크기 변화를 비교한다.
#
# 사용: ssh afterlife-gabia 'bash /home/afterlife/afterlife-server/scripts/t077_idle_srclock_sweep.sh <src.jpg>'
set -e
set -o pipefail

SRC="$1"
OUTDIR="${2:-/tmp/t077_srclock}"
LP=/home/afterlife/afterlife-server/liveportrait-afterlife/source
PY=/home/afterlife/miniconda3/envs/liveportrait/bin/python
DRIVING=normal-idle

[ -n "$SRC" ] || { echo "ERR: usage: $0 <src_image> [out_dir]" >&2; exit 1; }
[ -f "$SRC" ] || { echo "ERR: src not found: $SRC" >&2; exit 1; }
mkdir -p "$OUTDIR"
cd "$LP"

# run <scale>
run() {
  local s="$1"
  local tmp; tmp=$(mktemp -d)
  echo ">>> scale=$s"
  if IDLE_EYE_SOURCE_LOCK=1 IDLE_EYE_TARGET_SCALE="$s" CUDA_VISIBLE_DEVICES=1 "$PY" inference.py \
       -s "$SRC" \
       -d "$LP/assets/examples/driving/$DRIVING.mp4" \
       --driving_multiplier 0.4 \
       --no-flag_do_torch_compile \
       -o "$tmp" > "$tmp/lp.log" 2>&1; then
    local gen; gen=$(find "$tmp" -name "*--$DRIVING.mp4" ! -name "*concat*" | head -1)
    if [ -n "$gen" ]; then
      ffmpeg -y -loglevel error -i "$gen" -vf select="eq(n\,0)" -frames:v 1 "$OUTDIR/fr0_s${s}.png"
      # 타일도(blink 확인용)
      ffmpeg -y -loglevel error -i "$gen" -vf "select=not(mod(n\,12)),tile=3x2" -frames:v 1 "$OUTDIR/tile_s${s}.png"
      echo "    OK $OUTDIR/fr0_s${s}.png"
    else
      echo "    ERR: no output"; tail -8 "$tmp/lp.log" | sed 's/^/      /'
    fi
  else
    echo "    ERR: inference failed"; tail -12 "$tmp/lp.log" | sed 's/^/      /'
  fi
  rm -rf "$tmp"
}

for S in 0.3 0.5 0.7 1.0 1.3; do run "$S"; done

echo "=== done: $OUTDIR ==="
ls -la "$OUTDIR"
