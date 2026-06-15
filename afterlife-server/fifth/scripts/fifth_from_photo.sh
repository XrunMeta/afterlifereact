#!/usr/bin/env bash
#
# fifth — 사진 1장으로 입싱크 영상 생성 (단일 모드 + MW 움직임 + 눈깜빡임)
# ─────────────────────────────────────────────────────────────
# 이 스크립트와 같은 폴더에 사진(+선택 음성)을 두고 실행하면,
# 가비아 컨테이너로 업로드 → 렌더 → 결과 mp4 를 로컬로 자동 다운로드.
#
# 사용법:
#   1) 사진만 (기본 음성 사용):
#        IMG=내사진.jpg ./fifth_from_photo.sh
#   2) 내 음성도 같이 (같은 폴더에 wav):
#        IMG=내사진.jpg WAV=내음성.wav TAG=test1 ./fifth_from_photo.sh
#   3) 입 크기/움직임 조정:
#        IMG=내사진.jpg LIP_OPEN=0.28 CFG_SCALE=2.4 ./fifth_from_photo.sh
#
# ⚠️ 입력 사진 권장: 정면, 입 살짝 벌리고 윗니가 조금 보이는 사진.
#    - 입 꽉 다문 사진 → 발화 시 치아가 안 보임(생성 불가)
#    - 활짝 웃는 사진   → 무음에 입이 덜 닫힘
#    (무음 다묾 + 발화 치아를 둘 다 원하면 사진 2장[다묾+웃는] = 2장 모드 필요)
#
# 결과: /Volumes/exDN/devExdn/fifth-tests/fifth_<TAG>.mp4
# ─────────────────────────────────────────────────────────────
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

IMG="${IMG:-photo.jpg}"          # 입력 사진 (이 스크립트와 같은 폴더)
WAV="${WAV:-}"                   # 입력 음성 (같은 폴더). 비우면 컨테이너 기본 gominju_speech.wav
TAG="${TAG:-photo}"
SYNC="${SYNC:-1}"                # 1=.py 재동기화 · 0=생략(빠름)

# ===== 파라미터 (MW 단일 + 눈깜빡임. env 로 override 가능) =====
CFG_SCALE="${CFG_SCALE:-2.0}"        # 머리/표정 강도
DRIVING_MULT="${DRIVING_MULT:-0.5}"  # 전체 motion 댐핑
LIP_OPEN="${LIP_OPEN:-0.24}"         # 입 최대 벌림
LIP_CLOSED="${LIP_CLOSED:-0.0023}"   # 무음 닫힘 (입 벌린 사진이면 ▲0.03~0.05 로 접힘 완화)
BLINK="${BLINK:-1}"                  # 눈 깜빡임 on
BLINK_INTERVAL="${BLINK_INTERVAL:-3.2}"
BLINK_DUR="${BLINK_DUR:-6}"
HEAD_SMOOTH="${HEAD_SMOOTH:-3.5}"    # 머리 흔들림 속도 완화(motion 시간축 스무딩). 0=off · 3.5=천천히 · 5=더 느리게
OFFSET="${OFFSET:-2}"; SIGMA="${SIGMA:-1.0}"; GAMMA="${GAMMA:-1.0}"; FPS="${FPS:-25}"

GABIA=afterlife-gabia; CONTAINER=fifth_poc_flp; REPO=/root/FasterLivePortrait
OUT_HOST=/data/afterlife/fifth-poc/audio_muxed; GABIA_TMP=/tmp/fifth_py
LOCAL_OUT=/Volumes/exDN/devExdn/fifth-tests
PY_MODULES=(audio2lip base_source config flp_engine render_offline)
mkdir -p "$LOCAL_OUT"

# 입력 사진 확인
[ -f "$SCRIPT_DIR/$IMG" ] || { echo "❌ 사진 없음: $SCRIPT_DIR/$IMG (이 스크립트와 같은 폴더에 두세요)"; exit 1; }
echo "── fifth from photo ──────────────────────────"
echo "IMG=$IMG  WAV=${WAV:-<기본 gominju_speech.wav>}  TAG=$TAG"
echo "cfg=$CFG_SCALE mult=$DRIVING_MULT lip_open=$LIP_OPEN lip_closed=$LIP_CLOSED blink=$BLINK"
echo "──────────────────────────────────────────────"

# 1) 사진(+음성, +.py) 가비아 호스트로
ssh "$GABIA" "mkdir -p $GABIA_TMP"
scp -q "$SCRIPT_DIR/$IMG" "$GABIA:$GABIA_TMP/$IMG"
WAV_NAME="gominju_speech.wav"
if [ -n "$WAV" ]; then
  [ -f "$SCRIPT_DIR/$WAV" ] || { echo "❌ 음성 없음: $SCRIPT_DIR/$WAV"; exit 1; }
  scp -q "$SCRIPT_DIR/$WAV" "$GABIA:$GABIA_TMP/$WAV"
  WAV_NAME="$WAV"
fi
if [ "$SYNC" = "1" ]; then
  for f in "${PY_MODULES[@]}"; do scp -q "$SCRIPT_DIR/$f.py" "$GABIA:$GABIA_TMP/$f.py"; done
fi

# 2) 원격: 컨테이너 cp + 단일 모드 render + 호스트로
ssh "$GABIA" "\
  IMG='$IMG' WAV_NAME='$WAV_NAME' WAV_GIVEN='$WAV' TAG='$TAG' SYNC='$SYNC' \
  FIFTH_CFG_SCALE='$CFG_SCALE' FIFTH_DRIVING_MULTIPLIER='$DRIVING_MULT' \
  FIFTH_LIP_OPEN='$LIP_OPEN' FIFTH_LIP_CLOSED='$LIP_CLOSED' FIFTH_OFFSET='$OFFSET' \
  FIFTH_SIGMA='$SIGMA' FIFTH_GAMMA='$GAMMA' FIFTH_FPS='$FPS' \
  FIFTH_BLINK='$BLINK' FIFTH_BLINK_INTERVAL='$BLINK_INTERVAL' FIFTH_BLINK_DUR='$BLINK_DUR' \
  FIFTH_HEAD_SMOOTH='$HEAD_SMOOTH' \
  bash -s" <<'REMOTE'
set -e
C=fifth_poc_flp; R=/root/FasterLivePortrait; TMP=/tmp/fifth_py
LDP=/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib
OUT=/data/afterlife/fifth-poc/audio_muxed
docker cp "$TMP/$IMG" "$C:$R/$IMG"
[ -n "$WAV_GIVEN" ] && docker cp "$TMP/$WAV_NAME" "$C:$R/$WAV_NAME"
if [ "$SYNC" = "1" ]; then
  for f in audio2lip base_source config flp_engine render_offline; do docker cp "$TMP/$f.py" "$C:$R/$f.py"; done
fi
docker exec \
  -e FIFTH_CFG_SCALE -e FIFTH_DRIVING_MULTIPLIER -e FIFTH_LIP_OPEN -e FIFTH_LIP_CLOSED \
  -e FIFTH_OFFSET -e FIFTH_SIGMA -e FIFTH_GAMMA -e FIFTH_FPS \
  -e FIFTH_BLINK -e FIFTH_BLINK_INTERVAL -e FIFTH_BLINK_DUR -e FIFTH_HEAD_SMOOTH \
  "$C" bash -lc "cd $R && LD_LIBRARY_PATH=$LDP:\$LD_LIBRARY_PATH CUDA_VISIBLE_DEVICES=0 /root/miniconda3/bin/python render_offline.py --wav $WAV_NAME --open-src $IMG --out gominju_out/fifth_$TAG.mp4"
docker cp "$C:$R/gominju_out/fifth_$TAG.mp4" "$OUT/fifth_$TAG.mp4"
echo "[remote] $OUT/fifth_$TAG.mp4"
REMOTE

# 3) 로컬 다운로드
scp -q "$GABIA:$OUT_HOST/fifth_$TAG.mp4" "$LOCAL_OUT/fifth_$TAG.mp4"
echo "✅ [LOCAL] $LOCAL_OUT/fifth_$TAG.mp4"
