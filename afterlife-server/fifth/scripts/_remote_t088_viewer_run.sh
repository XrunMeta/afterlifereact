#!/usr/bin/env bash
# _remote_t088_viewer_run.sh — T-088 continuation 뷰어 서버 기동 (slew on/off 선택)
#
# 로컬 Mac 에서 실행. SSH 로 가비아에 접속해:
#   ① 측정 전용 렌더서버 :8811 (t088_cont/) 기동 (지정 SLEW env)
#   ② 가비아 호스트에 뷰어 서버 :8812 기동
#   ③ 로컬에서 SSH 터널 명령 안내 → 브라우저로 육안 확인
#
# ===========================================================================
# 측정 구조:
#   - 렌더서버 :8811: 컨테이너 t088_cont/fifth_render_server.py (지정 FIFTH_HEAD_SLEW_FRAMES)
#   - 뷰어 서버 :8812: 가비아 호스트 t088_continuation_viewer_server.py
#     → RENDER_URL=http://203.0.113.30:8811 로 렌더서버 호출
#     → 브라우저에 MJPEG 재전송 (phase_token 위상 이어가기)
#   - 운영 :8810 렌더서버: 절대 재기동/변경 없음 (실통화 무영향)
# ===========================================================================
# 사용법:
#   WAV=<answer.wav 가비아 절대경로> SRC=<face.jpg 가비아 절대경로> \
#     SLEW=0 ./afterlife-server/fifth/scripts/_remote_t088_viewer_run.sh   # slew off
#
#   WAV=<answer.wav 가비아 절대경로> SRC=<face.jpg 가비아 절대경로> \
#     SLEW=5 ./afterlife-server/fifth/scripts/_remote_t088_viewer_run.sh   # slew on
#
# 환경 변수:
#   GABIA        SSH 별칭 (기본: afterlife-gabia)
#   WAV          가비아 내 wav 절대경로 (필수)
#   SRC          가비아 내 face.jpg 절대경로 (필수)
#   SLEW         FIFTH_HEAD_SLEW_FRAMES 값 (기본: 0 = slew off)
#   SILENCE_SEC  무음 청크 길이 초 (기본: 2.0)
#   PATTERN      청크 패턴 (기본: silence,speech,silence,speech,silence)
#   VIEWER_PORT  뷰어 포트 (기본: 8812)
#
# 결과:
#   가비아 :8811 — 측정 전용 렌더서버 (slew env 지정)
#   가비아 :8812 — MJPEG 뷰어 서버 (phase_token 위상 이어가기)
#   로컬에서 SSH 터널 후 http://localhost:8812 에서 육안 확인
#
# 종료:
#   Ctrl+C → cleanup trap 이 렌더서버(:8811) + 뷰어(:8812) 종료
#   또는 별도 터미널에서: ssh afterlife-gabia "pkill -f t088_cont/fifth_render_server.py; pkill -f t088_continuation_viewer_server.py"
# ===========================================================================
set -euo pipefail

# ---- 설정 ------------------------------------------------------------------
GABIA="${GABIA:-afterlife-gabia}"
CONTAINER="${CONTAINER:-fifth_poc_flp}"

# 측정 전용 서브디렉토리 (컨테이너 경로)
T088_DIR="/root/FasterLivePortrait/t088_cont"

# 공유마운트 tmp (컨테이너 + 호스트 동일 경로)
SHARED="/home/afterlife/afterlife-server/.fifth-tmp/t088"

# 컨테이너 Python 절대경로
PY_CONTAINER="/root/miniconda3/bin/python"

# 가비아 호스트 Python (시스템 python3 또는 afterlife venv)
PY_HOST="python3"

# TRT 라이브러리
LD_PATH="/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib"

# PYTHONPATH: 운영 코드에서 flp_engine 등 로드
PYPATH="/root/FasterLivePortrait"

# 측정 전용 포트 (운영 :8810 절대 미사용)
RENDER_PORT="8811"

# 뷰어 서버 포트 (가비아 호스트)
VIEWER_PORT="${VIEWER_PORT:-8812}"

# FIFTH_CFG_YAML 절대 경로
CFG_YAML="$PYPATH/configs/trt_infer.yaml"

# 측정서버 로그 (컨테이너 내)
RENDER_LOG="/tmp/t088_viewer_render_${RENDER_PORT}.log"
VIEWER_LOG="/tmp/t088_viewer_${VIEWER_PORT}.log"

# health URL (가비아 호스트 → 컨테이너 docker 브리지)
RENDER_HEALTH="http://203.0.113.30:${RENDER_PORT}/health"
VIEWER_HEALTH="http://localhost:${VIEWER_PORT}/health"

# 가비아 호스트에서 뷰어 스크립트 경로
# (t088_cont/ 에 배포됨 — deploy 스크립트와 동일 대상. stdlib 전용이라 호스트에서도 직접 실행 가능)
VIEWER_SCRIPT="/data/afterlife/fifth-poc/FasterLivePortrait/t088_cont/t088_continuation_viewer_server.py"

# ---- 인자 ------------------------------------------------------------------
WAV="${WAV:-}"
SRC="${SRC:-}"
SLEW="${SLEW:-0}"
EYE_SCALE="${EYE_SCALE:-0.5}"   # idle 눈 retarget scale (운영 0.8, 줄이면 눈 작게 — 놀란눈 방지)
SILENCE_SEC="${SILENCE_SEC:-2.0}"
PATTERN="${PATTERN:-silence,speech,silence,speech,silence}"

if [ -z "$WAV" ] || [ -z "$SRC" ]; then
  echo ""
  echo "사용법:"
  echo "  WAV=<answer.wav> SRC=<face.jpg> SLEW=0 $0   # slew off"
  echo "  WAV=<answer.wav> SRC=<face.jpg> SLEW=5 $0   # slew on"
  echo ""
  echo "예시:"
  echo "  WAV=/data/records/9055/20260627-120000-answer.wav \\"
  echo "  SRC=/home/afterlife/afterlife-server/prethird/video-ref/9055/9055-face.jpg \\"
  echo "  SLEW=0 $0"
  exit 1
fi

# ---- cleanup trap ----------------------------------------------------------
cleanup() {
  local exit_code=$?
  echo ""
  echo "==> [cleanup] 렌더서버(:$RENDER_PORT) + 뷰어(:$VIEWER_PORT) 종료"
  ssh "$GABIA" \
    "docker exec $CONTAINER pkill -9 -f t088_cont/fifth_render_server.py" 2>/dev/null \
    || true
  ssh "$GABIA" \
    "pkill -9 -f t088_continuation_viewer_server.py" 2>/dev/null \
    || true
  echo "  완료. GPU 메모리 회수됨."
  exit $exit_code
}
trap cleanup EXIT

# ---- 헬퍼 -----------------------------------------------------------------
_kill_render_server() {
  ssh "$GABIA" \
    "docker exec $CONTAINER pkill -9 -f t088_cont/fifth_render_server.py" 2>/dev/null \
    || true
  sleep 2
}

_kill_viewer_server() {
  ssh "$GABIA" \
    "pkill -9 -f t088_continuation_viewer_server.py" 2>/dev/null \
    || true
}

echo "========================================================"
echo " T-088 continuation 뷰어 서버 기동"
echo "   gabia       = $GABIA"
echo "   container   = $CONTAINER"
echo "   렌더포트    = :$RENDER_PORT  (운영 :8810 무영향)"
echo "   뷰어포트    = :$VIEWER_PORT"
echo "   SLEW        = FIFTH_HEAD_SLEW_FRAMES=$SLEW"
echo "   WAV         = $WAV"
echo "   SRC         = $SRC"
echo "   silence_sec = $SILENCE_SEC"
echo "   pattern     = $PATTERN"
echo "========================================================"

# ---- 0. 배포 파일 확인 ----------------------------------------------------
echo ""
echo "==> [0] t088_cont/ 배포 파일 확인"
# 렌더서버: 컨테이너 내 확인 (docker exec)
ssh "$GABIA" \
  "docker exec $CONTAINER bash -c \
    '[ -f $T088_DIR/fifth_render_server.py ] \
       && echo \"  OK(container): $T088_DIR/fifth_render_server.py\" \
       || { echo \"FATAL: $T088_DIR/fifth_render_server.py 없음 — deploy 먼저\"; exit 1; }'"
# 뷰어서버: 호스트 경로 확인 (t088_cont/ 는 호스트 볼륨마운트 경로이기도 함)
ssh "$GABIA" \
  "[ -f '$VIEWER_SCRIPT' ] \
     && echo '  OK(host): $VIEWER_SCRIPT' \
     || { echo 'FATAL: $VIEWER_SCRIPT 없음 — _remote_t088_continuation_deploy.sh 먼저 실행'; exit 1; }"

# ---- 1. 입력 파일 확인 ----------------------------------------------------
echo ""
echo "==> [1] 입력 파일 확인 (가비아)"
ssh "$GABIA" "[ -f '$WAV' ] && echo '  OK  wav: $WAV' || { echo 'FATAL: $WAV 없음'; exit 1; }"
ssh "$GABIA" "[ -f '$SRC' ] && echo '  OK  src: $SRC' || { echo 'FATAL: $SRC 없음'; exit 1; }"

# ---- 2. 공유마운트 tmp 준비 -----------------------------------------------
echo ""
echo "==> [2] 공유마운트 tmp 준비 ($SHARED)"
ssh "$GABIA" "mkdir -p '$SHARED'"
ssh "$GABIA" "cp '$WAV' '$SHARED/seq.wav'"
ssh "$GABIA" "cp '$SRC' '$SHARED/face.jpg'"
echo "  seq.wav / face.jpg 복사 완료"

# ---- 3. 기존 프로세스 정리 ------------------------------------------------
echo ""
echo "==> [3] 기존 :$RENDER_PORT + :$VIEWER_PORT 프로세스 정리"
_kill_render_server
_kill_viewer_server
echo "  완료"

# ---- 4. 렌더서버 :8811 기동 (SLEW env 반영) --------------------------------
echo ""
echo "==> [4] 렌더서버 :$RENDER_PORT 기동 (FIFTH_HEAD_SLEW_FRAMES=$SLEW)"
ssh "$GABIA" \
  "docker exec -d $CONTAINER bash -c \
    'cd $PYPATH && \
     LD_LIBRARY_PATH=$LD_PATH \
     PYTHONPATH=$T088_DIR:$PYPATH \
     FIFTH_RENDER_PORT=$RENDER_PORT \
     FIFTH_CFG_YAML=$CFG_YAML \
     FIFTH_LIP_OPEN=0.24 \
     FIFTH_CFG_SCALE=2.0 \
     FIFTH_BLINK=1 \
     FIFTH_HEAD_SMOOTH=3.5 \
     FIFTH_HEAD_SLEW_FRAMES=$SLEW \
     FIFTH_EYE_SOURCE_LOCK=1 \
     FIFTH_EYE_TARGET_SCALE=$EYE_SCALE \
     nohup $PY_CONTAINER $T088_DIR/fifth_render_server.py >$RENDER_LOG 2>&1 &'"

echo "  렌더서버 기동 명령 전송. TRT 로드 대기 중 (최대 120s)..."
ok=0
for i in $(seq 1 40); do
  sleep 3
  if ssh "$GABIA" "curl -sf '$RENDER_HEALTH' > /dev/null 2>&1"; then
    echo "  렌더서버 health OK (~$((i * 3))s)"
    ok=1
    break
  fi
  printf "  ... %ds\r" $((i * 3))
done

if [ "$ok" != "1" ]; then
  echo ""
  echo "  ERROR: :$RENDER_PORT health FAIL (~120s)"
  echo "  로그: ssh $GABIA \"docker exec $CONTAINER tail -30 $RENDER_LOG\""
  exit 1
fi

# ---- 5. 뷰어 서버 :8812 기동 (가비아 호스트) ------------------------------
echo ""
echo "==> [5] 뷰어 서버 :$VIEWER_PORT 기동 (가비아 호스트)"
echo "   스크립트: $VIEWER_SCRIPT"

# 뷰어 서버는 호스트에서 실행 (docker exec 없음)
# 공유마운트 경로를 렌더서버가 읽을 수 있도록 /home/afterlife/... 사용
ssh "$GABIA" \
  "T088_RENDER_URL=http://203.0.113.30:$RENDER_PORT \
   T088_WAV=$SHARED/seq.wav \
   T088_SOURCE=$SHARED/face.jpg \
   T088_PATTERN='$PATTERN' \
   T088_SILENCE_SEC=$SILENCE_SEC \
   T088_SHARED_TMP=$SHARED \
   T088_VIEWER_PORT=$VIEWER_PORT \
   FIFTH_HEAD_SLEW_FRAMES=$SLEW \
   nohup $PY_HOST $VIEWER_SCRIPT --port $VIEWER_PORT >$VIEWER_LOG 2>&1 &"

echo "  뷰어 서버 기동 명령 전송. health 대기 중 (최대 15s)..."
ok=0
for i in $(seq 1 5); do
  sleep 3
  if ssh "$GABIA" "curl -sf '$VIEWER_HEALTH' > /dev/null 2>&1"; then
    echo "  뷰어 health OK (~$((i * 3))s)"
    ok=1
    break
  fi
  printf "  ... %ds\r" $((i * 3))
done

if [ "$ok" != "1" ]; then
  echo ""
  echo "  ERROR: :$VIEWER_PORT health FAIL (~15s)"
  echo "  로그: ssh $GABIA \"tail -20 $VIEWER_LOG\""
  exit 1
fi

# ---- 6. SSH 터널 안내 + 대기 ----------------------------------------------
echo ""
echo "========================================================"
echo " 뷰어 서버 기동 완료 (FIFTH_HEAD_SLEW_FRAMES=$SLEW)"
echo ""
echo " *** 로컬 Mac 에서 SSH 터널 설정 (새 터미널에서) ***"
echo "   ssh -N -L $VIEWER_PORT:localhost:$VIEWER_PORT $GABIA"
echo ""
echo " *** 브라우저 접속 ***"
echo "   http://localhost:$VIEWER_PORT"
echo ""
echo " 확인 포인트:"
echo "   - 무음→발화 전환 순간 head 점프 여부"
if [ "$SLEW" = "0" ]; then
  echo "   - slew OFF: 경계 head 불연속 예상 (비교 기준)"
else
  echo "   - slew ON (k=$SLEW): 경계 head 점프가 부드러워야 함"
fi
echo "   - R 행렬 선형 보간(lerp) 왜곡 보이면 보고 (slerp 검토 필요)"
echo ""
echo " slew on/off 전환 방법:"
echo "   Ctrl+C 후: SLEW=0 또는 SLEW=5 로 재실행"
echo ""
echo " 종료: Ctrl+C (렌더서버 + 뷰어 자동 cleanup)"
echo ""
echo " 서버 로그:"
echo "   렌더서버: ssh $GABIA \"docker exec $CONTAINER tail -f $RENDER_LOG\""
echo "   뷰어서버: ssh $GABIA \"tail -f $VIEWER_LOG\""
echo "========================================================"

# ---- 대기 (Ctrl+C 까지) ---------------------------------------------------
echo ""
echo "Ctrl+C 로 종료하면 렌더서버 + 뷰어 자동 cleanup됩니다."
# 로컬 백그라운드 잡이 없어 `wait`는 즉시 반환 → EXIT trap cleanup 으로 서버가 죽는다.
# `sleep infinity`는 macOS(BSD sleep) 미지원 → while 루프로 무한 대기(이식성).
# 이 스크립트(및 trap)를 살려 원격 서버(:8811/:8812)를 유지한다. Ctrl+C/kill 로 종료.
while true; do sleep 3600; done
