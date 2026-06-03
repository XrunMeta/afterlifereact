#!/bin/bash
# gen_idle_asset.sh <src_image> <out_mp4>
# 사진 1장 → idle 영상(얼굴/머리 미세동작).
# LivePortrait + 고정 calm 구동(normal-idle) multiplier 0.4 → 25fps.
# 구동(driving) 모션 교체: 아래 DRIVING 변수만 바꾸면 -d 경로·출력 find 패턴이 함께 갱신됨.
# stdout: "OK <out_mp4>" (성공) / "ERR: ..." + exit 1 (실패)
#
# GPU: CUDA_VISIBLE_DEVICES=1 (GPU1 고정 — musetalk은 GPU0).
# 의존: liveportrait conda env, ffmpeg.
set -e
set -o pipefail

SRC="$1"
OUT="$2"

if [ -z "$SRC" ] || [ -z "$OUT" ]; then
  echo "ERR: usage: gen_idle_asset.sh <src_image> <out_mp4>" >&2
  exit 1
fi

if [ ! -f "$SRC" ]; then
  echo "ERR: src not found: $SRC" >&2
  exit 1
fi

LP=/home/afterlife/afterlife-server/liveportrait-afterlife/source
PY=/home/afterlife/miniconda3/envs/liveportrait/bin/python
# 구동 모션 소스(확장자 제외 stem). driving 폴더에 <DRIVING>.mp4 또는 <DRIVING>.pkl 이 있어야 함.
# mp4 지정 시 첫 실행에서 <DRIVING>.pkl 캐시가 driving 폴더에 자동 생성됨(systemd ReadWritePaths 허용).
DRIVING=normal-idle
TMP=$(mktemp -d)

cd "$LP"

LPLOG="$TMP/lp.log"
if ! CUDA_VISIBLE_DEVICES=1 "$PY" inference.py \
  -s "$SRC" \
  -d "$LP/assets/examples/driving/$DRIVING.mp4" \
  --driving_multiplier 0.4 \
  --no-flag_do_torch_compile \
  -o "$TMP" > "$LPLOG" 2>&1; then
  echo "ERR: LivePortrait exited nonzero" >&2
  echo "--- LivePortrait log (tail) ---" >&2
  tail -20 "$LPLOG" >&2
  rm -rf "$TMP"
  exit 1
fi

GEN=$(find "$TMP" -name "*--$DRIVING.mp4" ! -name "*concat*" | head -1)

if [ -z "$GEN" ]; then
  echo "ERR: no output generated" >&2
  rm -rf "$TMP"
  exit 1
fi

ffmpeg -y -loglevel error \
  -i "$GEN" \
  -r 25 \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -an \
  "$OUT"

rm -rf "$TMP"
echo "OK $OUT"
