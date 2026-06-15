#!/usr/bin/env bash
#
# fifth 입싱크 파라미터 테스트 (로컬 Mac 에서 실행)
# ─────────────────────────────────────────────────────────────
# 로컬 워크트리의 .py 를 가비아 컨테이너(fifth_poc_flp)로 동기화 →
# render_offline.py 실행 → 결과 mp4 를 로컬로 자동 다운로드.
#
# 기본값 = calm4b 체크포인트 (2026-06-15, 히즈키 "꽤 괜찮음" 확정).
#
# 사용법:
#   1) 그대로 실행 (calm4b 재현):
#        ./fifth_param_test.sh
#   2) 프리셋 파일 로드 (presets/ 안의 .env):
#        PRESET=calm4b ./fifth_param_test.sh
#        PRESET=presets/calm4b.env ./fifth_param_test.sh
#   3) 파라미터만 바꿔 빠르게 (env override 가 프리셋·기본값보다 우선):
#        LIP_OPEN=0.26 TAG=open26 ./fifth_param_test.sh
#        CFG_SCALE=2.5 DRIVING_MULT=0.7 TAG=calm ./fifth_param_test.sh
#   4) 코드(.py) 안 바꿨으면 동기화 생략해 더 빠르게:
#        SYNC=0 LIP_OPEN=0.26 TAG=open26 ./fifth_param_test.sh
#
# 결과: /Volumes/exDN/devExdn/fifth-tests/fifth_<TAG>.mp4 (로컬, 음성 포함)
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ===== 프리셋 로딩 (PRESET=name 또는 PRESET=path) =====
# 프리셋 파일은 `: "${VAR:=value}"` 형식이라, 명령줄 env override 가 프리셋보다 우선.
PRESET="${PRESET:-}"
if [ -n "$PRESET" ]; then
  [ -f "$PRESET" ] || PRESET="$SCRIPT_DIR/presets/$PRESET"
  [ -f "$PRESET" ] || PRESET="$SCRIPT_DIR/presets/${PRESET##*/}.env"
  if [ -f "$PRESET" ]; then echo "[preset] $PRESET"; source "$PRESET"; else echo "⚠️ 프리셋 못 찾음: $PRESET"; fi
fi

# ===== 튜닝 파라미터 (env override > 프리셋 > 아래 기본=calm4b) =====
# --- 움직임 (calm4b: 차분) ---
CFG_SCALE="${CFG_SCALE:-2.0}"         # 머리/표정 강도(JoyVASA). ▲크게=뚜렷(3.5) ▼작게=차분. <1.5면 머리 굳음
DRIVING_MULT="${DRIVING_MULT:-0.5}"   # 전체 motion 댐핑 배율. ▼작게=차분 · 1.0=기본 · 1.5↑=과함
LIP_OPEN="${LIP_OPEN:-0.24}"          # 입 최대 벌림. ▼작게=입 작게/덜 벌림
# --- 입싱크/닫힘 ---
LIP_CLOSED="${LIP_CLOSED:-0.0023}"    # 무음 시 입 닫힘(단일모드용). 입마스크 모드는 closed_src 가 담당
SIGMA="${SIGMA:-1.0}"                 # RMS envelope 스무딩. 크면 입 움직임 둔해짐
GAMMA="${GAMMA:-1.0}"                 # 입 반응 곡선. >1=또렷한 발음만 <1=민감
OFFSET="${OFFSET:-2}"                 # 입싱크 보정(프레임). +면 입이 소리보다 앞섬
OPEN_SCALE="${OPEN_SCALE:-1.0}"       # 입 벌림 추가 배율
SILENCE="${SILENCE:-0.05}"            # 무음 게이트(raw RMS)
CDLIP_SMOOTH="${CDLIP_SMOOTH:-0}"     # 1=입 개폐 전환 추가 스무딩
CDLIP_SIGMA="${CDLIP_SIGMA:-1.5}"     # 위 스무딩 강도
FPS="${FPS:-25}"

# ===== 블렌드/정렬 (calm4b: 입마스크 + affine 정렬) =====
BLEND_REGION="${BLEND_REGION:-mouth}"   # mouth=입 영역만 블렌드(얼굴/배경 단일=부들거림 없음) · full=전체블렌드
ALIGN_SOURCES="${ALIGN_SOURCES:-1}"     # 1=closed_src 를 open_src 기준 정렬(jitter 제거). 블렌드 모드 전용
ALIGN_MODE="${ALIGN_MODE:-affine}"      # crop(B1) · affine(B2, 눈·코 landmark 정밀 정렬·구도 일치)
W_SIGMA="${W_SIGMA:-1.0}"               # 블렌드 w 스무딩 sigma(전환 부드러움). ▲크게=부드러움
MOUTH_DILATE="${MOUTH_DILATE:-28}"      # 입 마스크 크기(px). 크면 입 주변 더 넓게
MOUTH_FEATHER="${MOUTH_FEATHER:-22}"    # 입 마스크 경계 부드러움. 크면 경계 티 덜 남

# ===== 눈깜빡임 · 머리 스무딩 (calm4b 체크포인트) =====
BLINK="${BLINK:-1}"                     # 눈 깜빡임 on (idle 주입)
BLINK_INTERVAL="${BLINK_INTERVAL:-3.2}" # 평균 간격(초)
BLINK_DUR="${BLINK_DUR:-6}"             # 깜빡임 1회 프레임수
HEAD_SMOOTH="${HEAD_SMOOTH:-3.5}"       # 머리 흔들림 속도 완화(시간축 스무딩). 0=off · 3.5=천천히 · 5=더

# ===== 입력 자산 (컨테이너 /root/FasterLivePortrait 안에 있어야 함) =====
SOURCE="${SOURCE:-gominju_v2_mouth_rank1_f119.jpg}"  # open source (치아 보이는 입벌림=v2r1)
WAV="${WAV:-gominju_speech.wav}"                      # 입력 음성
CLOSED_SRC="${CLOSED_SRC-gominju_source.jpg}"         # 입다묾 원본. CLOSED_SRC="" 로 단일 모드 강제

# ===== 출력/식별 =====
TAG="${TAG:-calm4b}"                  # 결과 파일 구분 라벨 → fifth_<TAG>.mp4
SYNC="${SYNC:-1}"                     # 1=로컬 .py 컨테이너 재동기화(코드 바꿨을 때) · 0=생략(빠름)
# ==============================================================================

GABIA="afterlife-gabia"
CONTAINER="fifth_poc_flp"
REPO="/root/FasterLivePortrait"
OUT_HOST="/data/afterlife/fifth-poc/audio_muxed"
GABIA_TMP="/tmp/fifth_py"
LOCAL_OUT="/Volumes/exDN/devExdn/fifth-tests"
PY_MODULES=(audio2lip base_source config flp_engine render_offline)

mkdir -p "$LOCAL_OUT"

echo "── fifth param test ───────────────────────────────"
echo "TAG=$TAG  CFG_SCALE=$CFG_SCALE  DRIVING_MULT=$DRIVING_MULT  LIP_OPEN=$LIP_OPEN"
echo "BLEND_REGION=$BLEND_REGION  ALIGN=$ALIGN_SOURCES/$ALIGN_MODE  W_SIGMA=$W_SIGMA  mouth=$MOUTH_DILATE/$MOUTH_FEATHER"
echo "SOURCE=$SOURCE  CLOSED_SRC=${CLOSED_SRC:-<none·단일모드>}  WAV=$WAV"
echo "───────────────────────────────────────────────────"

# 1) 로컬 .py → 가비아 호스트 동기화
if [ "$SYNC" = "1" ]; then
  echo "[sync] 로컬 .py → 가비아 ($GABIA_TMP)"
  ssh "$GABIA" "mkdir -p $GABIA_TMP"
  for f in "${PY_MODULES[@]}"; do
    scp -q "$SCRIPT_DIR/$f.py" "$GABIA:$GABIA_TMP/$f.py"
  done
fi

# 2) 원격: 컨테이너로 .py cp + render + 호스트로 mp4 복사
ssh "$GABIA" "\
  FIFTH_FPS='$FPS' FIFTH_LIP_OPEN='$LIP_OPEN' FIFTH_LIP_CLOSED='$LIP_CLOSED' \
  FIFTH_OPEN_SCALE='$OPEN_SCALE' FIFTH_OFFSET='$OFFSET' FIFTH_SIGMA='$SIGMA' \
  FIFTH_GAMMA='$GAMMA' FIFTH_SILENCE='$SILENCE' FIFTH_CFG_SCALE='$CFG_SCALE' \
  FIFTH_DRIVING_MULTIPLIER='$DRIVING_MULT' FIFTH_CDLIP_SMOOTH='$CDLIP_SMOOTH' \
  FIFTH_CDLIP_SIGMA='$CDLIP_SIGMA' \
  SOURCE='$SOURCE' WAV='$WAV' CLOSED_SRC='$CLOSED_SRC' TAG='$TAG' SYNC='$SYNC' \
  BLEND_REGION='$BLEND_REGION' ALIGN_SOURCES='$ALIGN_SOURCES' ALIGN_MODE='$ALIGN_MODE' \
  W_SIGMA='$W_SIGMA' MOUTH_DILATE='$MOUTH_DILATE' MOUTH_FEATHER='$MOUTH_FEATHER' \
  FIFTH_BLINK='$BLINK' FIFTH_BLINK_INTERVAL='$BLINK_INTERVAL' FIFTH_BLINK_DUR='$BLINK_DUR' \
  FIFTH_HEAD_SMOOTH='$HEAD_SMOOTH' \
  bash -s" <<'REMOTE'
set -e
CONTAINER=fifth_poc_flp
REPO=/root/FasterLivePortrait
OUT_HOST=/data/afterlife/fifth-poc/audio_muxed
GABIA_TMP=/tmp/fifth_py

if [ "$SYNC" = "1" ]; then
  for f in audio2lip base_source config flp_engine render_offline; do
    docker cp "$GABIA_TMP/$f.py" "$CONTAINER:$REPO/$f.py"
  done
fi

# 블렌드/정렬 인자 구성 (CLOSED_SRC 비면 단일 모드)
EXTRA_ARG=""
if [ -n "$CLOSED_SRC" ]; then
  EXTRA_ARG="--closed-src $CLOSED_SRC --blend-region $BLEND_REGION --w-sigma $W_SIGMA --mouth-dilate $MOUTH_DILATE --mouth-feather $MOUTH_FEATHER"
  [ "$ALIGN_SOURCES" = "1" ] && EXTRA_ARG="$EXTRA_ARG --align-sources --align-mode $ALIGN_MODE"
fi

docker exec \
  -e FIFTH_FPS -e FIFTH_LIP_OPEN -e FIFTH_LIP_CLOSED -e FIFTH_OPEN_SCALE \
  -e FIFTH_OFFSET -e FIFTH_SIGMA -e FIFTH_GAMMA -e FIFTH_SILENCE \
  -e FIFTH_CFG_SCALE -e FIFTH_DRIVING_MULTIPLIER -e FIFTH_CDLIP_SMOOTH -e FIFTH_CDLIP_SIGMA \
  -e FIFTH_BLINK -e FIFTH_BLINK_INTERVAL -e FIFTH_BLINK_DUR -e FIFTH_HEAD_SMOOTH \
  "$CONTAINER" bash -lc "cd $REPO && \
    LD_LIBRARY_PATH=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib:\$LD_LIBRARY_PATH \
    CUDA_VISIBLE_DEVICES=0 \
    /root/miniconda3/bin/python render_offline.py \
      --wav $WAV --open-src $SOURCE $EXTRA_ARG \
      --out gominju_out/fifth_$TAG.mp4"

docker cp "$CONTAINER:$REPO/gominju_out/fifth_$TAG.mp4" "$OUT_HOST/fifth_$TAG.mp4"
echo "[remote] $OUT_HOST/fifth_$TAG.mp4"
REMOTE

# 3) 결과 mp4 로컬 다운로드
scp -q "$GABIA:$OUT_HOST/fifth_$TAG.mp4" "$LOCAL_OUT/fifth_$TAG.mp4"
echo "✅ [LOCAL] $LOCAL_OUT/fifth_$TAG.mp4"
