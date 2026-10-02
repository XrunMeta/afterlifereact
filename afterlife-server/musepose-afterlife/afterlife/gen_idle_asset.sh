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
# T-942 (2026-10-02): driving 영상 5초로 trim → LivePortrait inference 시간 ~1/4.
#   사용자 "눈 깜박임만 나오는데 5분이나 걸려". normal-idle.mp4 는 20s 길이,
#   inference 가 프레임 수에 선형이므로 5s 로 자르면 ~2~5분 → ~1분으로 단축.
#   결과 영상도 5s 지만 CallScreen idlePlayer 가 loop 재생해 체감 영향 없음.
#   driving pkl 캐시는 trimmed 영상 기준으로 자동 생성(첫 호출만 추가 비용).
DRIVING_TRIM_SEC=5
TMP=$(mktemp -d)

cd "$LP"

# driving 영상 trim (ffmpeg -t) — 짧은 driving → 더 빠른 inference
TRIMMED_DRIVING="$TMP/driving-${DRIVING_TRIM_SEC}s.mp4"
ffmpeg -y -loglevel error \
  -i "$LP/assets/examples/driving/$DRIVING.mp4" \
  -t "$DRIVING_TRIM_SEC" \
  -c:v libx264 -pix_fmt yuv420p -an \
  "$TRIMMED_DRIVING"

LPLOG="$TMP/lp.log"
if ! CUDA_VISIBLE_DEVICES=1 "$PY" inference.py \
  -s "$SRC" \
  -d "$TRIMMED_DRIVING" \
  --driving_multiplier 0.4 \
  --no-flag_do_torch_compile \
  -o "$TMP" > "$LPLOG" 2>&1; then
  echo "ERR: LivePortrait exited nonzero" >&2
  echo "--- LivePortrait log (tail) ---" >&2
  tail -20 "$LPLOG" >&2
  rm -rf "$TMP"
  exit 1
fi

# T-942: trimmed driving 파일명 기준 (driving-5s.mp4 → *--driving-5s.mp4)
TRIMMED_STEM=$(basename "$TRIMMED_DRIVING" .mp4)
GEN=$(find "$TMP" -name "*--$TRIMMED_STEM.mp4" ! -name "*concat*" | head -1)

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
