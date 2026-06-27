#!/usr/bin/env bash
# _remote_t088_continuation_run.sh — T-088 게이트0 측정 전용 :8811 서버로 실행
#
# 로컬 Mac 에서 실행. SSH 로 가비아에 접속해 컨테이너 내 비교 스크립트를 돌린다.
#
# ──────────────────────────────────────────────────────────────────────────
# 측정 구조:
#   - 측정 전용 렌더서버 :8811 을 t088_cont/ 에서 기동 → 비교 실행 → 종료(GPU 회수)
#   - 운영 :8810 렌더서버: 절대 재기동/변경 없음 (실통화 무영향)
#   - 의존성: PYTHONPATH=/root/FasterLivePortrait 로 운영 경로 참조
#   - 예상 소요: TRT 로드 ~30s + 렌더 3회 ~2~4분 = 총 3~5분
#
# ──────────────────────────────────────────────────────────────────────────
# 사전 조건:
#   _remote_t088_continuation_deploy.sh 로 t088_cont/ 에 파일 배포 완료.
#
# 사용법:
#   WAV=<answer.wav 가비아 절대경로> SRC=<face.jpg 가비아 절대경로> \
#     ./afterlife-server/fifth/scripts/_remote_t088_continuation_run.sh
#
# 환경 변수:
#   GABIA   SSH 별칭 (기본: afterlife-gabia)
#   WAV     가비아 내 wav 절대경로 (필수)
#   SRC     가비아 내 face.jpg 절대경로 (필수)
#   OUT     결과 JSON 저장 경로 (기본: 공유마운트 .fifth-tmp/t088/g0.json)
#
# 클론 선택 안내:
#   - gominju(정면 클로즈업 사진 보유) 권장 — PASS 가능성 최고.
#   - answer.wav 목록: ssh afterlife-gabia "ls /data/records/<clone_id>/*-answer.wav | sort | tail -5"
#   - face.jpg:       ssh afterlife-gabia "ls /home/afterlife/afterlife-server/prethird/video-ref/<clone_id>/"
#
# 예시:
#   WAV=/data/records/9055/20260627-120000-answer.wav \
#   SRC=/home/afterlife/afterlife-server/prethird/video-ref/9055/9055-face.jpg \
#     ./afterlife-server/fifth/scripts/_remote_t088_continuation_run.sh
#
# PASS 조건:  boundary_head_jump_px < 2.0  AND  boundary_ssim > 0.95
# FAIL:       연속성 불량 (경계 점프 ≥ 2px 또는 SSIM ≤ 0.95)
# SKIP_NO_LANDMARK: detect_landmarks 미동작 (TRT GPU 메모리 충돌 의심)
# ──────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ---- 설정 -------------------------------------------------------------------
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
PYPATH="/root/FasterLivePortrait"

# 측정 전용 포트 (:8810 운영 절대 미사용)
MEASURE_PORT="8811"

# fifth_render_server.py 기동 env.
# ⚠️ cwd=$PYPATH(/root/FasterLivePortrait)로 기동해야 FLP 내부 상대경로(./checkpoints/*.so, ./configs)가 동작.
#    스크립트는 $T088_DIR 절대경로로 실행 → sys.path[0]=t088_cont 라 우리 fifth_render_server/fifth_render/render_offline/phase_token 우선.
#    PYTHONPATH=$T088_DIR:$PYPATH → 우리 코드 우선 + flp_engine/audio2lip/base_source 의존성.
RENDER_ENV="LD_LIBRARY_PATH=$LD_PATH PYTHONPATH=$T088_DIR:$PYPATH FIFTH_RENDER_PORT=$MEASURE_PORT FIFTH_CFG_YAML=$PYPATH/configs/trt_infer.yaml FIFTH_LIP_OPEN=0.24 FIFTH_CFG_SCALE=2.0 FIFTH_BLINK=1 FIFTH_HEAD_SMOOTH=3.5"

# compare/render 서버 베이스 URL (컨테이너 내부 self, /health 없는 베이스)
SERVER_INTERNAL="http://127.0.0.1:${MEASURE_PORT}"

# 측정서버 로그 (컨테이너 내)
RENDER_LOG="/tmp/t088_render_${MEASURE_PORT}.log"

# health URL (가비아 호스트 → 컨테이너 docker 브리지)
HEALTH_HOST="http://203.0.113.30:${MEASURE_PORT}/health"
# health URL (컨테이너 내부 self)
HEALTH_INTERNAL="http://127.0.0.1:${MEASURE_PORT}/health"

# ---- 인자 -------------------------------------------------------------------
WAV="${WAV:-}"
SRC="${SRC:-}"
OUT="${OUT:-$SHARED/g0.json}"

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
  echo ""
  echo "answer.wav 목록:"
  echo "  ssh $GABIA \"ls /data/records/<clone_id>/*-answer.wav | sort | tail -5\""
  exit 1
fi

echo "========================================================"
echo " T-088 게이트0 측정 실행"
echo "   gabia      = $GABIA"
echo "   container  = $CONTAINER"
echo "   측정포트   = :$MEASURE_PORT  (운영 :8810 무영향)"
echo "   WAV        = $WAV"
echo "   SRC        = $SRC"
echo "   OUT        = $OUT"
echo "   예상소요   = TRT 로드 ~30s + 렌더 3회 ~2~4분 = 총 3~5분"
echo "========================================================"

# ---- 측정서버 종료 트랩 (스크립트 정상/비정상 종료 모두) --------------------
# 가비아에서 :8811 python 프로세스를 kill 해 GPU 메모리 회수.
cleanup() {
  local exit_code=$?
  echo ""
  echo "==> [cleanup] 측정서버(:$MEASURE_PORT) 종료 (GPU 회수)"
  ssh "$GABIA" \
    "docker exec '$CONTAINER' bash -c \
      'pkill -f \"FIFTH_RENDER_PORT=$MEASURE_PORT\" 2>/dev/null || true; \
       sleep 1; \
       pgrep -f \"FIFTH_RENDER_PORT=$MEASURE_PORT\" > /dev/null && pkill -9 -f \"FIFTH_RENDER_PORT=$MEASURE_PORT\" || true; \
       echo \"  :$MEASURE_PORT 종료 완료\"'" \
    2>/dev/null || echo "  (cleanup ssh 실패 — 가비아에서 수동 확인: docker exec $CONTAINER pkill -f FIFTH_RENDER_PORT=$MEASURE_PORT)"
  exit $exit_code
}
trap cleanup EXIT

# ---- 0. t088_cont 디렉토리 + 배포 파일 확인 ---------------------------------
echo ""
echo "==> [0] t088_cont/ 배포 파일 확인 (가비아)"
ssh "$GABIA" \
  "docker exec '$CONTAINER' bash -c \
    '[ -f $T088_DIR/fifth_render_server.py ] \
       && echo \"  OK: $T088_DIR/fifth_render_server.py\" \
       || { echo \"FATAL: $T088_DIR/fifth_render_server.py 없음 — deploy 먼저 실행\"; exit 1; }'"

# ---- 1. 입력 파일 존재 확인 -------------------------------------------------
echo ""
echo "==> [1] 입력 파일 확인 (가비아)"
ssh "$GABIA" "[ -f '$WAV' ] && echo '  OK  wav: $WAV' || { echo 'FATAL: 없음 — $WAV'; exit 1; }"
ssh "$GABIA" "[ -f '$SRC' ] && echo '  OK  src: $SRC' || { echo 'FATAL: 없음 — $SRC'; exit 1; }"

# ---- 2. 공유마운트 tmp 준비 + 파일 복사 ------------------------------------
echo ""
echo "==> [2] 공유마운트 tmp 준비 ($SHARED)"
# /tmp 는 컨테이너 마운트 밖 → 금지. 반드시 공유볼륨 경로 사용.
ssh "$GABIA" "mkdir -p '$SHARED'"
ssh "$GABIA" "cp '$WAV' '$SHARED/seq.wav'"
ssh "$GABIA" "cp '$SRC' '$SHARED/face.jpg'"
echo "  seq.wav / face.jpg 복사 완료"

# ---- 3. 기존 :8811 프로세스 정리 (재실행 안전) ------------------------------
echo ""
echo "==> [3] 기존 :$MEASURE_PORT 프로세스 정리"
ssh "$GABIA" \
  "docker exec '$CONTAINER' bash -c \
    'pkill -f \"FIFTH_RENDER_PORT=$MEASURE_PORT\" 2>/dev/null && echo \"  이전 프로세스 정리\" || echo \"  (없음 — 정상)\"'" || true
sleep 2

# ---- 4. 측정 전용 렌더서버 :8811 기동 (백그라운드) --------------------------
echo ""
echo "==> [4] 측정서버 :$MEASURE_PORT 기동 (백그라운드)"
echo "   cwd=$T088_DIR  PYTHONPATH=$PYPATH"
ssh "$GABIA" \
  "docker exec -d '$CONTAINER' bash -c \
    'cd $PYPATH && $RENDER_ENV nohup $PY $T088_DIR/fifth_render_server.py >$RENDER_LOG 2>&1 &'"
echo "  기동 명령 전송 완료. TRT 모델 로드 대기 중..."

# ---- 5. health 폴링 (최대 120초, 3초 간격) ----------------------------------
echo ""
echo "==> [5] health 폴링 (최대 120s)"
ok=0
for i in $(seq 1 40); do
  sleep 3
  if ssh "$GABIA" "curl -sf '$HEALTH_HOST' > /dev/null 2>&1"; then
    echo "  health OK (~$((i * 3))s)"
    ok=1
    break
  fi
  printf "  ... %ds\r" $((i * 3))
done

if [ "$ok" != "1" ]; then
  echo ""
  echo "  ERROR: :$MEASURE_PORT health FAIL (~120s) — 렌더서버 기동 실패"
  echo ""
  echo "  로그 (마지막 30줄):"
  ssh "$GABIA" "docker exec '$CONTAINER' tail -30 '$RENDER_LOG' 2>/dev/null || echo '(로그 없음)'"
  echo ""
  echo "  가비아 수동 확인:"
  echo "    ssh $GABIA \"docker exec $CONTAINER tail -50 $RENDER_LOG\""
  exit 1
fi

# ---- 6. 게이트0 비교 실행 ---------------------------------------------------
echo ""
echo "==> [6] 게이트0 비교 실행 (컨테이너 내, 수 분 소요)"
echo "   통짜 렌더 × 1 + 2청크 렌더 × 2 + landmark diff + SSIM"
echo ""
ssh "$GABIA" \
  "docker exec '$CONTAINER' bash -c \
    'cd $PYPATH && \
     LD_LIBRARY_PATH=$LD_PATH PYTHONPATH=$T088_DIR:$PYPATH FIFTH_CFG_YAML=$PYPATH/configs/trt_infer.yaml \
     $PY $T088_DIR/t088_continuation_compare.py \
       --server $SERVER_INTERNAL \
       --wav   $SHARED/seq.wav \
       --src   $SHARED/face.jpg \
       --out   $SHARED/g0.json'"

# ---- 7. 결과 확인 -----------------------------------------------------------
echo ""
echo "==> [7] 결과"
ssh "$GABIA" "[ -f '$SHARED/g0.json' ] && cat '$SHARED/g0.json' || echo '(결과 파일 없음 — 위 오류 확인)'"

echo ""
echo "결과 파일: $GABIA:$SHARED/g0.json"
echo ""
echo "PASS 조건:  boundary_head_jump_px < 2.0  AND  boundary_ssim > 0.95"
echo "FAIL:       경계 연속성 불량"
echo "SKIP_NO_LANDMARK: detect_landmarks 미동작 (TRT GPU 메모리 충돌 의심)"
echo ""
echo "FAIL/SKIP 시:"
echo "  측정서버 로그: ssh $GABIA \"docker exec $CONTAINER tail -50 $RENDER_LOG\""
echo "  (측정서버는 이 스크립트 종료 시 cleanup trap 으로 자동 종료됩니다)"
echo "========================================================"

# trap cleanup 이 EXIT 에서 :8811 종료 처리
