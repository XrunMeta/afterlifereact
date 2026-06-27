#!/usr/bin/env bash
# _remote_t088_sim_run.sh — T-088 무음↔발화 연속 시뮬 mp4 산출 (slew off/on 비교)
#
# 로컬 Mac 에서 실행. SSH 로 가비아에 접속해 슬루 off/on 두 버전 mp4를 생성한다.
#
# ──────────────────────────────────────────────────────────────────────────
# 측정 구조:
#   - 측정 전용 렌더서버 :8811 을 t088_cont/ 에서 기동
#   - slew off (FIFTH_HEAD_SLEW_FRAMES=0): seq_slewoff.mp4
#   - slew on  (FIFTH_HEAD_SLEW_FRAMES=5): seq_slewon.mp4
#   - 운영 :8810 렌더서버: 절대 재기동/변경 없음 (실통화 무영향)
#   - 서버를 2회 기동해 슬루 env 전환 (FIFTH_HEAD_SLEW_FRAMES는 서버 env 로 제어)
#   - 예상 소요: TRT 로드 ~30s × 2 + 렌더 4청크 × 2 = 총 10~20분
#
# ──────────────────────────────────────────────────────────────────────────
# 사전 조건:
#   _remote_t088_continuation_deploy.sh 로 t088_cont/ 에 파일 배포 완료
#   (t088_continuation_sim.py 포함 — deploy 스크립트 DEPLOY_FILES에 추가됨)
#
# 사용법:
#   WAV=<answer.wav 가비아 절대경로> SRC=<face.jpg 가비아 절대경로> \
#     ./afterlife-server/fifth/scripts/_remote_t088_sim_run.sh
#
# 환경 변수:
#   GABIA        SSH 별칭 (기본: afterlife-gabia)
#   WAV          가비아 내 wav 절대경로 (필수)
#   SRC          가비아 내 face.jpg 절대경로 (필수)
#   SILENCE_SEC  무음 청크 길이(초, 기본 2.0)
#   PATTERN      청크 패턴 (기본: silence,speech,silence,speech)
#   SLEW_ON      slew on 값 (기본 5)
#
# 결과:
#   가비아 SHARED/seq_slewoff.mp4  (FIFTH_HEAD_SLEW_FRAMES=0)
#   가비아 SHARED/seq_slewon.mp4   (FIFTH_HEAD_SLEW_FRAMES=SLEW_ON)
#   stdout: 각 mp4 경로 + scp 명령
#
# 다운로드:
#   scp afterlife-gabia:/home/afterlife/afterlife-server/.fifth-tmp/t088/seq_slewoff.mp4 .
#   scp afterlife-gabia:/home/afterlife/afterlife-server/.fifth-tmp/t088/seq_slewon.mp4  .
# ──────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ---- 설정 ------------------------------------------------------------------
GABIA="${GABIA:-afterlife-gabia}"
CONTAINER="${CONTAINER:-fifth_poc_flp}"

# 측정 전용 서브디렉토리 (컨테이너 경로)
T088_DIR="/root/FasterLivePortrait/t088_cont"

# 공유마운트 tmp (컨테이너도 동일 경로로 접근 가능)
SHARED="/home/afterlife/afterlife-server/.fifth-tmp/t088"

# 컨테이너 Python 절대경로
PY="/root/miniconda3/bin/python"

# TRT 라이브러리 (컨테이너 내)
LD_PATH="/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib"

# PYTHONPATH: 운영 코드에서 flp_engine/audio2lip/base_source 등 로드
# T088_DIR 을 앞에 두어 우리 수정 파일 우선 로드
PYPATH="/root/FasterLivePortrait"

# 측정 전용 포트 (:8810 운영 절대 미사용)
MEASURE_PORT="8811"

# FIFTH_CFG_YAML 절대 경로 (cwd 무관하게 동작)
CFG_YAML="$PYPATH/configs/trt_infer.yaml"

# 측정서버 로그 (컨테이너 내)
RENDER_LOG="/tmp/t088_sim_render_${MEASURE_PORT}.log"

# health URL (가비아 호스트 → 컨테이너 docker 브리지)
HEALTH_HOST="http://203.0.113.30:${MEASURE_PORT}/health"

# ---- 인자 ------------------------------------------------------------------
WAV="${WAV:-}"
SRC="${SRC:-}"
SILENCE_SEC="${SILENCE_SEC:-2.0}"
PATTERN="${PATTERN:-silence,speech,silence,speech}"
SLEW_ON="${SLEW_ON:-5}"

if [ -z "$WAV" ] || [ -z "$SRC" ]; then
  echo ""
  echo "사용법:"
  echo "  WAV=<answer.wav 가비아 절대경로> SRC=<face.jpg 가비아 절대경로> \\"
  echo "    $0"
  echo ""
  echo "예시:"
  echo "  WAV=/data/records/9055/20260627-120000-answer.wav \\"
  echo "  SRC=/home/afterlife/afterlife-server/prethird/video-ref/9055/9055-face.jpg \\"
  echo "    $0"
  exit 1
fi

# ---- 측정서버 cleanup trap -----------------------------------------------
# 스크립트 정상/비정상 종료 시 :8811 python 프로세스를 kill 해 GPU 메모리 회수.
# t088_cont/fifth_render_server.py 는 $T088_DIR/fifth_render_server.py 절대경로로
# 기동하므로 pkill -f 로 argv 매칭 가능 (운영 :8810 서버와 다른 패턴).
cleanup() {
  local exit_code=$?
  echo ""
  echo "==> [cleanup] 측정서버(:$MEASURE_PORT) 종료 (GPU 회수)"
  ssh "$GABIA" \
    "docker exec $CONTAINER pkill -9 -f t088_cont/fifth_render_server.py" 2>/dev/null \
    && echo "  :$MEASURE_PORT 종료 완료" \
    || echo "  (이미 종료됨 또는 프로세스 없음 — OK)"
  exit $exit_code
}
trap cleanup EXIT

# ---- 헬퍼 함수 -------------------------------------------------------------

_kill_measure_server() {
  ssh "$GABIA" \
    "docker exec $CONTAINER pkill -9 -f t088_cont/fifth_render_server.py" 2>/dev/null \
    || true
  sleep 2
}

_start_measure_server() {
  local slew_k="$1"
  echo ""
  echo "==> 측정서버 :$MEASURE_PORT 기동 (FIFTH_HEAD_SLEW_FRAMES=$slew_k)"
  echo "   cwd=$PYPATH  스크립트=$T088_DIR/fifth_render_server.py"

  # 전체 경로($T088_DIR/fifth_render_server.py)로 기동 →
  # pkill -f t088_cont/fifth_render_server.py 으로 안전하게 구분.
  # 운영 :8810 서버는 fifth_render_server.py(t088_cont 없이)로 기동되므로 미영향.
  ssh "$GABIA" \
    "docker exec -d $CONTAINER bash -c \
      'cd $PYPATH && \
       LD_LIBRARY_PATH=$LD_PATH \
       PYTHONPATH=$T088_DIR:$PYPATH \
       FIFTH_RENDER_PORT=$MEASURE_PORT \
       FIFTH_CFG_YAML=$CFG_YAML \
       FIFTH_LIP_OPEN=0.24 \
       FIFTH_CFG_SCALE=2.0 \
       FIFTH_BLINK=1 \
       FIFTH_HEAD_SMOOTH=3.5 \
       FIFTH_HEAD_SLEW_FRAMES=$slew_k \
       nohup $PY $T088_DIR/fifth_render_server.py >$RENDER_LOG 2>&1 &'"

  echo "   기동 명령 전송. TRT 모델 로드 대기 중 (최대 120s)..."
  local ok=0
  for i in $(seq 1 40); do
    sleep 3
    if ssh "$GABIA" "curl -sf '$HEALTH_HOST' > /dev/null 2>&1"; then
      echo "   health OK (~$((i * 3))s)"
      ok=1
      break
    fi
    printf "   ... %ds\r" $((i * 3))
  done

  if [ "$ok" != "1" ]; then
    echo ""
    echo "  ERROR: :$MEASURE_PORT health FAIL (~120s) — 렌더서버 기동 실패"
    echo ""
    echo "  로그 (마지막 30줄):"
    ssh "$GABIA" \
      "docker exec $CONTAINER tail -30 $RENDER_LOG 2>/dev/null || echo '(로그 없음)'"
    exit 1
  fi
}

_run_sim() {
  local slew_k="$1"
  local out_name="$2"
  echo ""
  echo "==> 시뮬 실행 (FIFTH_HEAD_SLEW_FRAMES=$slew_k) → $out_name"
  echo "   pattern=$PATTERN  silence_sec=$SILENCE_SEC"

  ssh "$GABIA" \
    "docker exec $CONTAINER bash -c \
      'LD_LIBRARY_PATH=$LD_PATH \
       PYTHONPATH=$T088_DIR:$PYPATH \
       FIFTH_CFG_YAML=$CFG_YAML \
       FIFTH_HEAD_SLEW_FRAMES=$slew_k \
       $PY $T088_DIR/t088_continuation_sim.py \
         --answer \"$SHARED/seq.wav\" \
         --src    \"$SHARED/face.jpg\" \
         --out    \"$SHARED/$out_name\" \
         --silence-sec $SILENCE_SEC \
         --pattern \"$PATTERN\" \
         --slew-frames $slew_k \
         --server http://127.0.0.1:$MEASURE_PORT'"
}

# ---- 메인 ------------------------------------------------------------------

echo "========================================================"
echo " T-088 연속 시뮬 mp4 산출 (slew off/on 비교)"
echo "   gabia       = $GABIA"
echo "   container   = $CONTAINER"
echo "   측정포트    = :$MEASURE_PORT  (운영 :8810 무영향)"
echo "   WAV         = $WAV"
echo "   SRC         = $SRC"
echo "   silence_sec = $SILENCE_SEC"
echo "   pattern     = $PATTERN"
echo "   slew_on     = $SLEW_ON"
echo "   예상 소요   = TRT 로드 ~30s×2 + 렌더 4청크×2 ≈ 10~20분"
echo "========================================================"

# ---- 0. t088_cont 배포 파일 확인 -------------------------------------------
echo ""
echo "==> [0] t088_cont/ 배포 파일 확인 (가비아)"
for f in fifth_render_server.py t088_continuation_sim.py t088_continuation_compare.py; do
  ssh "$GABIA" \
    "docker exec $CONTAINER bash -c \
      '[ -f $T088_DIR/$f ] \
         && echo \"  OK: $T088_DIR/$f\" \
         || { echo \"FATAL: $T088_DIR/$f 없음 — _remote_t088_continuation_deploy.sh 먼저\"; exit 1; }'"
done

# ---- 1. 입력 파일 확인 ------------------------------------------------------
echo ""
echo "==> [1] 입력 파일 확인 (가비아)"
ssh "$GABIA" "[ -f '$WAV' ] && echo '  OK  wav: $WAV' || { echo 'FATAL: 없음 — $WAV'; exit 1; }"
ssh "$GABIA" "[ -f '$SRC' ] && echo '  OK  src: $SRC' || { echo 'FATAL: 없음 — $SRC'; exit 1; }"

# ---- 2. 공유마운트 tmp 준비 + 파일 복사 ------------------------------------
echo ""
echo "==> [2] 공유마운트 tmp 준비 ($SHARED)"
ssh "$GABIA" "mkdir -p '$SHARED'"
ssh "$GABIA" "cp '$WAV' '$SHARED/seq.wav'"
ssh "$GABIA" "cp '$SRC' '$SHARED/face.jpg'"
echo "  seq.wav / face.jpg 복사 완료"

# ---- 3. 기존 :8811 프로세스 정리 -------------------------------------------
echo ""
echo "==> [3] 기존 :$MEASURE_PORT 프로세스 정리"
_kill_measure_server
echo "  완료"

# ============================================================
# ROUND 1: slew off (FIFTH_HEAD_SLEW_FRAMES=0)
# ============================================================
echo ""
echo "========================================================"
echo " ROUND 1/2: slew OFF (FIFTH_HEAD_SLEW_FRAMES=0)"
echo "========================================================"
_start_measure_server 0
_run_sim 0 "seq_slewoff.mp4"

echo ""
echo "  seq_slewoff.mp4 완료. 서버 종료 중..."
_kill_measure_server

# ============================================================
# ROUND 2: slew on (FIFTH_HEAD_SLEW_FRAMES=$SLEW_ON)
# ============================================================
echo ""
echo "========================================================"
echo " ROUND 2/2: slew ON (FIFTH_HEAD_SLEW_FRAMES=$SLEW_ON)"
echo "========================================================"
_start_measure_server "$SLEW_ON"
_run_sim "$SLEW_ON" "seq_slewon.mp4"

# ---- 결과 ------------------------------------------------------------------
echo ""
echo "========================================================"
echo " 완료. 결과 mp4 (가비아 공유마운트):"
echo "   slew off: $GABIA:$SHARED/seq_slewoff.mp4"
echo "   slew on:  $GABIA:$SHARED/seq_slewon.mp4"
echo ""
echo " 다운로드:"
echo "   scp $GABIA:$SHARED/seq_slewoff.mp4 ."
echo "   scp $GABIA:$SHARED/seq_slewon.mp4  ."
echo ""
echo " 비교 포인트:"
echo "   - 무음→발화 전환 순간(각 speech 시작 직전) head 점프 여부"
echo "   - slew off 에서 튀는 프레임이 slew on 에서 부드러워지는지 확인"
echo "   - R 행렬 선형 보간(lerp) 왜곡 보이면 slerp 전환 검토 보고"
echo "========================================================"

# cleanup trap 이 EXIT 에서 :8811 종료 처리 (이미 kill 했지만 혹시 대비)
