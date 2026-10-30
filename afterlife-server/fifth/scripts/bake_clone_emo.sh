#!/usr/bin/env bash
# 클론 감정 영상 세트 굽기 (AFL-1064) — 가비아 호스트에서 실행.
#
#   bake_clone_emo.sh <clone_id>
#
# 입력: $PRETHIRD_DIR/video-ref/<clone>/<clone>-face.jpg (512x1024, idle 과 같은 구도)
#       보정 동작 pkl — build_driving_motion.py 로 구동영상당 1회 만든 것(전 클론 공용, 컨테이너 $EMO_PKL_DIR)
# 출력: $PRETHIRD_DIR/video-ref/<clone>/emo/<clone>-emo-{neutral,warm_calm,agreement,serious,disagreement,idle}.mp4
#       + 라이브 MuseTalk 캐시(사이클 전체)
# 켜기는 따로: PRETHIRD_EMO_VIDEO_CLONES 에 클론 추가 + prethird 재시작.
#
# 단계(2026-10-30 쿄카 실측 합계 4분 37초):
#   1. FLP 동작 전이 — render_emotion_clip.py, 클립 5개 · 개당 약 11초(GPU1 컨테이너)
#   2. MuseTalk idle 무음 프리베이크 — 약 63초(GPU0)
#   3. 감정 클립 MuseTalk 캐시 — 개당 35~39초(대부분 프레임별 얼굴 분석)
#
# 클립 ↔ 동작 pkl 대응은 EMO_CLIPS 로 바꾼다(구동영상을 새로 만들면 pkl 이름만 바꾸면 된다).
set -euo pipefail

CLONE="${1:?usage: bake_clone_emo.sh <clone_id>}"
PRETHIRD_DIR="${PRETHIRD_DIR:-/home/afterlife/afterlife-server/prethird}"
FLP_CONTAINER="${FLP_CONTAINER:-fifth_poc_flp}"
EMO_TOOLS_DIR="${EMO_TOOLS_DIR:-/root/emote-poc/afl1064/src}"   # 컨테이너 안 render_emotion_clip.py 위치
EMO_PKL_DIR="${EMO_PKL_DIR:-/root/emote-poc/afl1064}"           # 컨테이너 안 보정 pkl 위치
EMO_CLIPS="${EMO_CLIPS:-neutral:neutral_v5_phone warm_calm:loop04_warm_calm agreement:dasom_loop06_pondering serious:loop03_serious disagreement:disagreement}"
MUSETALK_PY="${MUSETALK_PY:-/home/afterlife/miniconda3/envs/musetalk/bin/python}"
LD="/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib:/usr/local/nvidia/lib64"
HERE="$(cd "$(dirname "$0")" && pwd)"

FACE="$PRETHIRD_DIR/video-ref/$CLONE/$CLONE-face.jpg"
OUT="$PRETHIRD_DIR/video-ref/$CLONE/emo"
WORK="/root/emote-poc/bake-$CLONE"
[ -f "$FACE" ] || { echo "얼굴 사진 없음: $FACE" >&2; exit 1; }
mkdir -p "$OUT"
now() { date +%s.%N; }
since() { echo "$(now) - $1" | bc; }
T0=$(now)

# 1) FLP 동작 전이(컨테이너). 보정 표시 없는 pkl 은 render_emotion_clip 이 거부한다.
docker exec "$FLP_CONTAINER" mkdir -p "$WORK"
docker cp "$FACE" "$FLP_CONTAINER:$WORK/face.jpg"
for pair in $EMO_CLIPS; do
  clip=${pair%%:*}; pkl=${pair#*:}; t=$(now)
  docker exec -e LD_LIBRARY_PATH="$LD" "$FLP_CONTAINER" /root/miniconda3/bin/python "$EMO_TOOLS_DIR/render_emotion_clip.py" \
    --pkl "$EMO_PKL_DIR/$pkl.pkl" --src "$WORK/face.jpg" --out "$WORK/$CLONE-emo-$clip.mp4" 2>&1 | grep -v objc | grep render_emotion
  printf '[시간] FLP %s %.1fs\n' "$clip" "$(since "$t")"
done
docker cp "$FLP_CONTAINER:$WORK/." "$OUT/"
rm -f "$OUT/face.jpg"
printf '[시간] FLP 단계 합계 %.1fs\n' "$(since "$T0")"

# 2) MuseTalk(호스트, GPU0) — idle 무음 프리베이크 + 클립별 캐시 사이클 전체
CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:-0}" MUSETALK_BATCH_SIZE="${MUSETALK_BATCH_SIZE:-16}" PRETHIRD_DIR="$PRETHIRD_DIR" \
  "$MUSETALK_PY" "$HERE/bake_clone_emo_host.py" "$CLONE" "$OUT" 2>&1 | grep -E "^\[시간\]|silent_mouth|Error occurred|Traceback"
ls -la "$OUT" | tail -n +2
printf '[시간] 클론 %s 전체 %.1fs\n' "$CLONE" "$(since "$T0")"
