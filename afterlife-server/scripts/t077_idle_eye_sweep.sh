#!/bin/bash
# t077_idle_eye_sweep.sh <src_image> [out_dir]
#
# T-077: 클론 생성 idle 영상 눈 크기 튜닝용 sweep.
# 같은 사진으로 driving_multiplier / driving 영상 조합을 일괄 생성해 육안 비교한다.
# 목표 = 원본 사진 눈 크기 유지 + 자연스러운 blink만(눈 키우지 말 것).
#
# 사용: ssh afterlife-gabia 'bash /home/afterlife/afterlife-server/scripts/t077_idle_eye_sweep.sh <src.jpg>'
# 결과: <out_dir>/<label>.mp4 (기본 /tmp/t077_idle_sweep). 각 label 은 파라미터 조합.
#
# GPU1 고정(musetalk=GPU0). gen_idle_asset.sh 와 동일 LP/PY/ffmpeg 경로.
set -e
set -o pipefail

SRC="$1"
OUTDIR="${2:-/tmp/t077_idle_sweep}"

LP=/home/afterlife/afterlife-server/liveportrait-afterlife/source
PY=/home/afterlife/miniconda3/envs/liveportrait/bin/python

if [ -z "$SRC" ]; then
  echo "ERR: usage: t077_idle_eye_sweep.sh <src_image> [out_dir]" >&2
  exit 1
fi
if [ ! -f "$SRC" ]; then
  echo "ERR: src not found: $SRC" >&2
  exit 1
fi

mkdir -p "$OUTDIR"
cd "$LP"

# 한 조합 실행: run <label> <inference 추가인자...>
run() {
  local label="$1"; shift
  local tmp; tmp=$(mktemp -d)
  echo ">>> $label"
  if CUDA_VISIBLE_DEVICES=1 "$PY" inference.py \
       -s "$SRC" \
       --no-flag_do_torch_compile \
       -o "$tmp" \
       "$@" > "$tmp/lp.log" 2>&1; then
    local gen; gen=$(find "$tmp" -name "*.mp4" ! -name "*concat*" | head -1)
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

D_NORMAL="assets/examples/driving/normal-idle.mp4"

# 1) 현재 운영값(기준선)
run "m040_normal-idle"  -d "$D_NORMAL" --driving_multiplier 0.4
# 2) multiplier 낮춤 — 눈 변화 줄지만 blink·머리동작도 같이 감소
run "m025_normal-idle"  -d "$D_NORMAL" --driving_multiplier 0.25
run "m015_normal-idle"  -d "$D_NORMAL" --driving_multiplier 0.15
# 3) 차분한 후보 driving (눈 모션 적은지 비교용 — 필요시 교체)
run "m040_d0"           -d "assets/examples/driving/d0.pkl"  --driving_multiplier 0.4

echo "=== done: $OUTDIR ==="
ls -la "$OUTDIR"
