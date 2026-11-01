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
#
# 길이 버전(KB AFL-1064 6-4절): EMO_LEN_SECS="2 3 … 9" 이면 감정 클립마다 <pkl>_<N>s.pkl(build_length_versions.py,
# 전 클론 공용)을 FLP 렌더해 <clone>-emo-<clip>-<N>s.mp4 로 굽고, MuseTalk 캐시는 정방향만 채운 뒤 "<clip>@<N>" 표시.
# 비어 있으면 길이 단계 건너뜀.
#
# 이어 굽기: 표시된 클립·버전은 건너뛴다. FLP 결과는 .part 로 쓰고 다 쓴 뒤 바꿔 끼우며, 새로 렌더한 영상은
# 그 이름의 MuseTalk 디스크 캐시(좌표·latent·마스크)를 지워 옛 영상 캐시가 섞이지 않게 한다.
# 같은 클론을 두 곳(통화 대기열·이어 굽기·손)에서 동시에 굽지 않게 flock 으로 막는다(이미 굽는 중이면 0 으로 끝).
# 라이브 통화에 이미 쓰인 클론을 다시 구우면 prethird 메모리 캐시가 옛 영상을 들고 있을 수 있다 → 굽고 나서 재시작.
set -euo pipefail

CLONE="${1:?usage: bake_clone_emo.sh <clone_id>}"
PRETHIRD_DIR="${PRETHIRD_DIR:-/home/afterlife/afterlife-server/prethird}"
FLP_CONTAINER="${FLP_CONTAINER:-fifth_poc_flp}"
EMO_TOOLS_DIR="${EMO_TOOLS_DIR:-/root/emote-poc/afl1064/src-v2}"  # 컨테이너 안 render_emotion_clip.py 위치(보정 version 2)
EMO_PKL_DIR="${EMO_PKL_DIR:-/root/emote-poc/afl1064/v2}"            # 컨테이너 안 보정 pkl 위치(구동영상 v2, 11-01)
EMO_CLIPS="${EMO_CLIPS:-neutral:v2_neutral warm_calm:v2_warm_calm agreement:v2_agreement serious:v2_serious disagreement:v2_disagreement}"
EMO_LEN_SECS="${EMO_LEN_SECS:-}"            # 예: "2 3 4 5 6 7 8 9" — 비면 길이 버전 안 굽기
LOCK_DIR="${EMO_BAKE_LOCK_DIR:-/tmp}"
EMO_BASE="${EMO_BASE:-neutral agreement}"   # 먼저 굽는 클립(idle 은 neutral 과 같이 구워진다)
MUSETALK_PY="${MUSETALK_PY:-/home/afterlife/miniconda3/envs/musetalk/bin/python}"
LD="/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib:/usr/local/nvidia/lib64"
HERE="$(cd "$(dirname "$0")" && pwd)"

FACE="$PRETHIRD_DIR/video-ref/$CLONE/$CLONE-face.jpg"
OUT="$PRETHIRD_DIR/video-ref/$CLONE/emo"
WORK="/root/emote-poc/bake-$CLONE"
[ -f "$FACE" ] || { echo "얼굴 사진 없음: $FACE" >&2; exit 1; }
mkdir -p "$OUT"
exec 9>"$LOCK_DIR/afl1064-bake-$CLONE.lock"
flock -n 9 || { echo "[준비] 클론 $CLONE 이미 굽는 중 — 건너뜀"; exit 0; }
MT_CACHE="$PRETHIRD_DIR/musetalk-outputs"
now() { date +%s.%N; }
since() { echo "$(now) - $1" | bc; }
T0=$(now)

READY="$OUT/ready.txt"
if [ "${EMO_REBAKE:-0}" = 1 ]; then
  # 다시 굽기(구동영상 교체 등): 표시를 비우고 처음부터. 비운 순간부터 통화는 이 클론에 감정 영상을 안 쓴다.
  : > "$READY.tmp" && mv "$READY.tmp" "$READY"
  echo "[준비] EMO_REBAKE=1 — 표시 비우고 처음부터"
fi
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

pkl_for() { local pair; for pair in $EMO_CLIPS; do [ "${pair%%:*}" = "$1" ] && { echo "${pair#*:}"; return; }; done; echo "EMO_CLIPS 에 $1 없음" >&2; exit 1; }

# FLP 동작 전이(컨테이너) 1개 → OUT/<name>.mp4. .part 로 받아 바꿔 끼우고, 그 이름의 MuseTalk 디스크 캐시를 지운다.
flp_render() {
  local pkl="$1" name="$2" tc; tc=$(now)
  docker exec -e LD_LIBRARY_PATH="$LD" "$FLP_CONTAINER" /root/miniconda3/bin/python "$EMO_TOOLS_DIR/render_emotion_clip.py" \
    --pkl "$EMO_PKL_DIR/$pkl.pkl" --src "$WORK/face.jpg" --out "$WORK/$name.mp4" 2>&1 | grep -v objc | grep render_emotion
  docker cp "$FLP_CONTAINER:$WORK/$name.mp4" "$OUT/$name.part.mp4"
  mv "$OUT/$name.part.mp4" "$OUT/$name.mp4"
  rm -f "$MT_CACHE/$name".*
  printf '[시간] FLP %s %.1fs\n' "$name" "$(since "$tc")"
}

# 한 단계 = FLP(컨테이너) → MuseTalk 캐시·표시(호스트). 항목 = 클립 이름 또는 "<clip>@<N>"(길이 버전).
# 보정 표시 없는 pkl 은 render_emotion_clip 이 거부한다.
bake_stage() {
  local name="$1"; shift
  local todo=() item clip sec t
  for item in "$@"; do is_ready "$item" || todo+=("$item"); done
  if [ ${#todo[@]} -eq 0 ]; then echo "[시간] $name 단계 — 이미 준비됨"; return; fi
  t=$(now)
  docker exec "$FLP_CONTAINER" mkdir -p "$WORK"
  docker cp "$FACE" "$FLP_CONTAINER:$WORK/face.jpg"
  for item in "${todo[@]}"; do
    if [[ "$item" == *@* ]]; then
      clip=${item%@*}; sec=${item#*@}
      flp_render "$(pkl_for "$clip")_${sec}s" "$CLONE-emo-$clip-${sec}s"
    else
      flp_render "$(pkl_for "$item")" "$CLONE-emo-$item"
    fi
  done
  # MuseTalk(호스트, GPU0) — neutral 이면 idle 무음 프리베이크, 클립은 캐시 사이클 전체, 길이 버전은 정방향만. 끝난 것마다 표시.
  CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:-0}" MUSETALK_BATCH_SIZE="${MUSETALK_BATCH_SIZE:-16}" PRETHIRD_DIR="$PRETHIRD_DIR" \
    "$MUSETALK_PY" "$HERE/bake_clone_emo_host.py" "$CLONE" "$OUT" "${todo[@]}" 2>&1 | grep -E "^\[시간\]|^\[대기\]|silent_mouth|Error occurred|Traceback"
  printf '[시간] %s 단계 %.1fs\n' "$name" "$(since "$t")"
}

all=(); for pair in $EMO_CLIPS; do all+=("${pair%%:*}"); done
rest=(); for clip in "${all[@]}"; do [[ " $EMO_BASE " == *" $clip "* ]] || rest+=("$clip"); done
# shellcheck disable=SC2086
bake_stage 기본 $EMO_BASE
bake_stage 나머지 "${rest[@]}"
if [ -n "$EMO_LEN_SECS" ]; then
  lens=()
  for clip in "${all[@]}"; do
    [ "$clip" = neutral ] && continue   # 무감정은 idle 과 같은 영상(한 시계) — 길이 버전 불필요
    for sec in $EMO_LEN_SECS; do lens+=("$clip@$sec"); done
  done
  bake_stage 길이 "${lens[@]}"
fi
echo "[준비] $(tr '\n' ' ' < "$READY")"
printf '[시간] 클론 %s 전체 %.1fs\n' "$CLONE" "$(since "$T0")"
