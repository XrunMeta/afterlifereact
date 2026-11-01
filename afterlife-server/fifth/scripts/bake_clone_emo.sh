#!/usr/bin/env bash
# 클론 감정 영상 세트 굽기 (AFL-1064) — 가비아 호스트에서 실행.
#
#   bake_clone_emo.sh <clone_id>
#
# 입력: $PRETHIRD_DIR/video-ref/<clone>/<clone>-face.jpg (512x1024, idle 과 같은 구도)
#       보정 동작 pkl — build_driving_motion.py 로 구동영상당 1회 만든 것(전 클론 공용, 컨테이너 $EMO_PKL_DIR)
# 출력: $PRETHIRD_DIR/video-ref/<clone>/emo/<clone>-emo-{neutral,warm_calm,agreement,serious,disagreement,idle}.mp4
#       + 라이브 MuseTalk 캐시(사이클 전체)
#       + emo/ready.txt — MuseTalk 캐시까지 끝난 클립 목록(통화는 여기 적힌 클립만 쓴다)
# 켜기: PRETHIRD_EMO_VIDEO_AUTO=1 이면 ready.txt 로 자동(통화 시작 때 prethird emo_bake 가 이 스크립트를 부른다).
#       또는 PRETHIRD_EMO_VIDEO_CLONES 에 클론 추가 + prethird 재시작.
#
# 단계별 굽기(sungjius 11-01): 기본 세트(무감정·idle·찬성) 먼저 → 나머지(따뜻·진지·반대).
# 기본 세트가 표시되면 다음 통화부터 감정 영상이 켜지고, 없는 감정은 무감정으로 대신한다.
# 이미 표시된 클립은 건너뛴다 — 중간에 죽으면 다시 돌리면 이어서 굽는다.
#
# 클립당 시간(2026-10-30 쿄카 실측, 전체 4분 37초):
#   FLP 동작 전이 — 개당 약 11초(GPU1 컨테이너)
#   MuseTalk idle 무음 프리베이크 — 약 63초(GPU0) · 감정 클립 캐시 — 개당 35~39초(GPU0)
# MuseTalk 단계는 통화가 있으면 끝날 때까지 기다린다(GPU0 공유, EMO_BAKE_WAIT_IDLE=0 이면 안 기다림).
#
# 클립 ↔ 동작 pkl 대응은 EMO_CLIPS 로 바꾼다(구동영상을 새로 만들면 pkl 이름만 바꾸면 된다).
set -euo pipefail

CLONE="${1:?usage: bake_clone_emo.sh <clone_id>}"
PRETHIRD_DIR="${PRETHIRD_DIR:-/home/afterlife/afterlife-server/prethird}"
FLP_CONTAINER="${FLP_CONTAINER:-fifth_poc_flp}"
EMO_TOOLS_DIR="${EMO_TOOLS_DIR:-/root/emote-poc/afl1064/src}"   # 컨테이너 안 render_emotion_clip.py 위치
EMO_PKL_DIR="${EMO_PKL_DIR:-/root/emote-poc/afl1064}"           # 컨테이너 안 보정 pkl 위치
EMO_CLIPS="${EMO_CLIPS:-neutral:neutral_v5_phone warm_calm:loop04_warm_calm agreement:dasom_loop06_pondering serious:loop03_serious disagreement:disagreement}"
EMO_BASE="${EMO_BASE:-neutral agreement}"   # 먼저 굽는 클립(idle 은 neutral 과 같이 구워진다)
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

READY="$OUT/ready.txt"
if [ ! -f "$READY" ]; then
  # 표시 파일을 먼저 만든다 — 이후 굽는 중인 mp4 는 적히기 전까지 통화가 쓰지 않는다.
  # 표시 없이 옛 스크립트로 다 구운 세트(9232·9194)는 있는 클립을 그대로 적어 둔다(옛 스크립트는 캐시까지 채웠다).
  : > "$READY.tmp"
  if [ -f "$OUT/$CLONE-emo-neutral.mp4" ] && [ -f "$OUT/$CLONE-emo-idle.mp4" ]; then
    for clip in neutral idle warm_calm agreement serious disagreement; do
      [ -f "$OUT/$CLONE-emo-$clip.mp4" ] && echo "$clip" >> "$READY.tmp"
    done
  fi
  mv "$READY.tmp" "$READY"
fi
is_ready() { grep -qx "$1" "$READY"; }

# 한 단계 = FLP 동작 전이(컨테이너) → MuseTalk 캐시·표시(호스트). 보정 표시 없는 pkl 은 render_emotion_clip 이 거부한다.
bake_stage() {
  local name="$1"; shift
  local todo=() pair clip pkl t
  for clip in "$@"; do is_ready "$clip" || todo+=("$clip"); done
  if [ ${#todo[@]} -eq 0 ]; then echo "[시간] $name 단계 — 이미 준비됨"; return; fi
  t=$(now)
  docker exec "$FLP_CONTAINER" mkdir -p "$WORK"
  docker cp "$FACE" "$FLP_CONTAINER:$WORK/face.jpg"
  for clip in "${todo[@]}"; do
    pkl=""
    for pair in $EMO_CLIPS; do [ "${pair%%:*}" = "$clip" ] && pkl=${pair#*:}; done
    [ -n "$pkl" ] || { echo "EMO_CLIPS 에 $clip 없음" >&2; exit 1; }
    local tc; tc=$(now)
    docker exec -e LD_LIBRARY_PATH="$LD" "$FLP_CONTAINER" /root/miniconda3/bin/python "$EMO_TOOLS_DIR/render_emotion_clip.py" \
      --pkl "$EMO_PKL_DIR/$pkl.pkl" --src "$WORK/face.jpg" --out "$WORK/$CLONE-emo-$clip.mp4" 2>&1 | grep -v objc | grep render_emotion
    docker cp "$FLP_CONTAINER:$WORK/$CLONE-emo-$clip.mp4" "$OUT/"
    printf '[시간] FLP %s %.1fs\n' "$clip" "$(since "$tc")"
  done
  # MuseTalk(호스트, GPU0) — neutral 이면 idle 무음 프리베이크, 나머지는 캐시 사이클 전체. 끝난 클립마다 표시.
  CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:-0}" MUSETALK_BATCH_SIZE="${MUSETALK_BATCH_SIZE:-16}" PRETHIRD_DIR="$PRETHIRD_DIR" \
    "$MUSETALK_PY" "$HERE/bake_clone_emo_host.py" "$CLONE" "$OUT" "${todo[@]}" 2>&1 | grep -E "^\[시간\]|^\[대기\]|silent_mouth|Error occurred|Traceback"
  printf '[시간] %s 단계 %.1fs\n' "$name" "$(since "$t")"
}

all=(); for pair in $EMO_CLIPS; do all+=("${pair%%:*}"); done
rest=(); for clip in "${all[@]}"; do [[ " $EMO_BASE " == *" $clip "* ]] || rest+=("$clip"); done
# shellcheck disable=SC2086
bake_stage 기본 $EMO_BASE
bake_stage 나머지 "${rest[@]}"
echo "[준비] $(tr '\n' ' ' < "$READY")"
printf '[시간] 클론 %s 전체 %.1fs\n' "$CLONE" "$(since "$T0")"
