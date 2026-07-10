#!/bin/bash
# t077_idle_final_test.sh [clone_ids...]
#
# T-077 최종 설정으로 여러 클론 idle 영상 생성 (교차검증용).
# 각 클론: <C>.mp4(영상) + <C>_fr0.png(모션0 baseline, 눈/입 확인) + <C>_src.jpg(원본) 저장.
#
# 최종 설정 (눈 크기 정상 + blink + 입 닫힘 + 머리 미세 + 시선 살짝):
#   --animation-region all --driving_multiplier 0.25 --flag-normalize-lip
#   IDLE_EYE_SOURCE_LOCK=1 IDLE_EYE_TARGET_SCALE=0.5
#   IDLE_LIP_FREEZE=1
#   IDLE_GAZE_AMP=0.018 IDLE_GAZE_AXIS=0 IDLE_GAZE_PERIOD=90
#
# 사용: ssh afterlife-gabia 'bash /home/afterlife/afterlife-server/scripts/t077_idle_final_test.sh 9056 9058 ...'
set -e
set -o pipefail

LP=/home/afterlife/afterlife-server/liveportrait-afterlife/source
PY=/home/afterlife/miniconda3/envs/liveportrait/bin/python
OUTDIR=/tmp/t077_clones
REFDIR=/home/afterlife/afterlife-server/prethird/video-ref

CLONES="${@:-9056 9058 9059 9060 9061 9062}"
mkdir -p "$OUTDIR"
cd "$LP"

for C in $CLONES; do
  SRC="$REFDIR/$C/$C-face.jpg"
  if [ ! -f "$SRC" ]; then echo "skip $C (no face.jpg)"; continue; fi
  tmp=$(mktemp -d)
  echo ">>> $C"
  if IDLE_EYE_SOURCE_LOCK=1 IDLE_EYE_TARGET_SCALE=0.5 \
     IDLE_LIP_FREEZE=1 \
     IDLE_GAZE_AMP=0.018 IDLE_GAZE_AXIS=0 IDLE_GAZE_PERIOD=90 \
     CUDA_VISIBLE_DEVICES=1 "$PY" inference.py \
       -s "$SRC" \
       -d "$LP/assets/examples/driving/normal-idle.pkl" \
       --driving_multiplier 0.25 \
       --animation-region all \
       --flag-normalize-lip \
       --no-flag_do_torch_compile \
       -o "$tmp" > "$tmp/lp.log" 2>&1; then
    GEN=$(find "$tmp" -name "*--normal-idle.mp4" ! -name "*concat*" ! -name "*with_aud*" | head -1)
    if [ -n "$GEN" ]; then
      ffmpeg -y -loglevel error -i "$GEN" -r 25 -c:v libx264 -pix_fmt yuv420p -an "$OUTDIR/$C.mp4"
      ffmpeg -y -loglevel error -i "$GEN" -vf select="eq(n\,0)" -frames:v 1 "$OUTDIR/${C}_fr0.png"
      cp "$SRC" "$OUTDIR/${C}_src.jpg"
      echo "    OK $C"
    else
      echo "    ERR $C: no output"; tail -6 "$tmp/lp.log" | sed 's/^/      /'
    fi
  else
    echo "    ERR $C: inference failed"; tail -10 "$tmp/lp.log" | sed 's/^/      /'
  fi
  rm -rf "$tmp"
done

echo "=== done: $OUTDIR ==="
ls -la "$OUTDIR"
