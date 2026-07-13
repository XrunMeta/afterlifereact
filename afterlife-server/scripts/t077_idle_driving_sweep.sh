#!/bin/bash
# t077_idle_driving_sweep.sh <src_image> [out_dir]
#
# T-077 어색함 개선: s0.5 눈패치(IDLE_EYE_SOURCE_LOCK) 고정 상태에서 구동영상(driving) 후보별 idle 생성.
# 목표 = 머리 움직임 적고 미세 호흡·blink 만 있는 "차분한" 구동영상 선택.
# 각 driving 결과를 영상(<d>.mp4) + 머리움직임 타일(head_<d>.png, 8프레임)로 저장해 비교한다.
#
# 사용: ssh afterlife-gabia 'bash /home/afterlife/afterlife-server/scripts/t077_idle_driving_sweep.sh <src.jpg>'
set -e
set -o pipefail

SRC="$1"
OUTDIR="${2:-/tmp/t077_driving}"
LP=/home/afterlife/afterlife-server/liveportrait-afterlife/source
PY=/home/afterlife/miniconda3/envs/liveportrait/bin/python

# 표정/말하기 특화(laugh/wink/shy/talking/shake_face/open_lip/aggrieved) 제외, 일반 구동 위주.
DRIVINGS="normal-idle d0 d1 d2 d3 d5 d7 d8 d11"

[ -n "$SRC" ] || { echo "ERR: usage: $0 <src_image> [out_dir]" >&2; exit 1; }
[ -f "$SRC" ] || { echo "ERR: src not found: $SRC" >&2; exit 1; }
mkdir -p "$OUTDIR"
cd "$LP"

run() {
  local d="$1"
  local dfile=""
  if [ -f "assets/examples/driving/$d.mp4" ]; then
    dfile="$LP/assets/examples/driving/$d.mp4"
  elif [ -f "assets/examples/driving/$d.pkl" ]; then
    dfile="$LP/assets/examples/driving/$d.pkl"
  else
    echo "skip $d (no mp4/pkl)"; return
  fi
  local tmp; tmp=$(mktemp -d)
  echo ">>> $d ($dfile)"
  if IDLE_EYE_SOURCE_LOCK=1 IDLE_EYE_TARGET_SCALE=0.5 CUDA_VISIBLE_DEVICES=1 "$PY" inference.py \
       -s "$SRC" \
       -d "$dfile" \
       --driving_multiplier 0.4 \
       --no-flag_do_torch_compile \
       -o "$tmp" > "$tmp/lp.log" 2>&1; then
    local gen; gen=$(find "$tmp" -name "*.mp4" ! -name "*concat*" | head -1)
    if [ -n "$gen" ]; then
      ffmpeg -y -loglevel error -i "$gen" -r 25 -c:v libx264 -pix_fmt yuv420p -an "$OUTDIR/$d.mp4"
      ffmpeg -y -loglevel error -i "$gen" -vf "select=not(mod(n\,8)),scale=180:-1,tile=4x2" -frames:v 1 "$OUTDIR/head_$d.png"
      echo "    OK $OUTDIR/$d.mp4"
    else
      echo "    ERR: no output"; tail -8 "$tmp/lp.log" | sed 's/^/      /'
    fi
  else
    echo "    ERR: inference failed"; tail -12 "$tmp/lp.log" | sed 's/^/      /'
  fi
  rm -rf "$tmp"
}

for d in $DRIVINGS; do run "$d"; done

echo "=== done: $OUTDIR ==="
ls -la "$OUTDIR"
