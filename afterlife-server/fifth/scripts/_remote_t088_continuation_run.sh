#!/usr/bin/env bash
# _remote_t088_continuation_run.sh — T-088 게이트0 가비아 실행
#
# 로컬 Mac 에서 실행. SSH 로 가비아에 접속해 컨테이너 내 비교 스크립트를 돌린다.
#
# ──────────────────────────────────────────────────────────────────────────
# 사용법:
#   WAV=<answer.wav 경로(가비아)> SRC=<face.jpg 경로(가비아)> \
#     ./afterlife-server/fifth/scripts/_remote_t088_continuation_run.sh
#
# 환경 변수:
#   GABIA   SSH 별칭 (기본: afterlife-gabia)
#   WAV     가비아 내 wav 절대경로 (필수)
#   SRC     가비아 내 face.jpg 절대경로 (필수)
#   OUT     결과 JSON 저장 경로 (기본: 공유tmp/g0.json)
#
# 클론 선택 안내:
#   - gominju(정면 클로즈업 사진 보유)가 PASS 가능성 최고 — 우선 권장.
#   - answer.wav 목록:
#       ssh afterlife-gabia "ls /data/records/<clone_id>/*-answer.wav | tail -5"
#   - face.jpg 확인:
#       ssh afterlife-gabia "ls /home/afterlife/afterlife-server/prethird/video-ref/<clone_id>/"
#
# 예시 (clone_id=9055 청이, 최신 answer.wav 자동 선택):
#   LATEST=$(ssh afterlife-gabia "ls /data/records/9055/*-answer.wav | sort | tail -1")
#   WAV="$LATEST" \
#   SRC="/home/afterlife/afterlife-server/prethird/video-ref/9055/9055-face.jpg" \
#     ./afterlife-server/fifth/scripts/_remote_t088_continuation_run.sh
#
# 실행 순서:
#   1) _remote_t088_continuation_deploy.sh 로 코드 배포 완료
#   2) 렌더서버(:8810) 기동 상태 — 이 스크립트가 체크하고 기동법 안내
#   3) 이 스크립트 실행 → 수 분 소요 → verdict JSON 출력
#
# PASS 조건:  boundary_head_jump_px < 2.0  AND  boundary_ssim > 0.95
# FAIL:       경계 연속성 불량 (청크 경계 머리 위치 점프 ≥ 2px 또는 SSIM ≤ 0.95)
# SKIP_NO_LANDMARK: FLP detect_landmarks 미동작 (컨테이너 env 문제 의심)
# ──────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ---- 설정 -------------------------------------------------------------------
GABIA="${GABIA:-afterlife-gabia}"
CONTAINER="${CONTAINER:-fifth_poc_flp}"

# 공유마운트 tmp (컨테이너에서 /tmp 경로는 마운트 밖 → 금지)
SHARED="/home/afterlife/afterlife-server/.fifth-tmp/t088"

# fifth/scripts 공유마운트 경로 (배포 스크립트가 여기에 scp)
SCRIPTS="/home/afterlife/afterlife-server/fifth/scripts"

# 컨테이너 Python (conda init 없이도 동작하는 절대경로)
PY="/root/miniconda3/bin/python"

# 렌더서버 URL — 가비아 호스트에서 컨테이너(203.0.113.30)로 접근
RENDER_HOST_URL="http://203.0.113.30:8810"

# 컨테이너 내부에서 렌더서버 접근 URL (127.0.0.1 = 같은 컨테이너)
RENDER_INTERNAL_URL="http://127.0.0.1:8810"

# TRT 라이브러리 경로 (컨테이너 내)
LD_PATH="/opt/TensorRT-8.6.1.6/targets/x86_64-linux-gnu/lib"

# FLP 설정 yaml 절대경로 (컨테이너 내 — cwd 무관)
CFG_YAML="/root/FasterLivePortrait/configs/trt_infer.yaml"

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
  echo "answer.wav 목록 확인:"
  echo "  ssh $GABIA \"ls /data/records/<clone_id>/*-answer.wav | sort | tail -5\""
  echo ""
  echo "face.jpg 확인:"
  echo "  ssh $GABIA \"ls /home/afterlife/afterlife-server/prethird/video-ref/<clone_id>/\""
  exit 1
fi

echo "========================================================"
echo " T-088 게이트0 실행"
echo "   gabia     = $GABIA"
echo "   container = $CONTAINER"
echo "   WAV       = $WAV"
echo "   SRC       = $SRC"
echo "   OUT       = $OUT"
echo "========================================================"

# ---- 1. 렌더서버 health 확인 ------------------------------------------------
echo ""
echo "==> [1] 렌더서버 health 확인 ($RENDER_HOST_URL/health)"
if ssh "$GABIA" "curl -sf '$RENDER_HOST_URL/health' > /dev/null 2>&1"; then
  echo "  health OK"
else
  cat <<EOF

  ⚠️  렌더서버(:8810) 미응답 — 히즈키가 가비아에서 직접 기동하세요:

  docker exec -d $CONTAINER bash -lc "\\
    cd /root/FasterLivePortrait && \\
    LD_LIBRARY_PATH=$LD_PATH \\
    FIFTH_CFG_YAML=configs/trt_infer.yaml \\
    FIFTH_LIP_OPEN=0.24 FIFTH_CFG_SCALE=2.0 \\
    FIFTH_BLINK=1 FIFTH_HEAD_SMOOTH=3.5 \\
    nohup $PY fifth_render_server.py > /tmp/fifth_render_server.log 2>&1 &"

  GPU/TRT/JoyVASA 로드 ~30초 후 health 확인:
    curl -sf $RENDER_HOST_URL/health

  로그:
    docker exec $CONTAINER tail -30 /tmp/fifth_render_server.log

  기동 완료 후 이 스크립트 재실행.
EOF
  exit 1
fi

# ---- 2. 입력 파일 존재 확인 -------------------------------------------------
echo ""
echo "==> [2] 입력 파일 확인 (가비아)"
ssh "$GABIA" "[ -f '$WAV' ] && echo '  OK  wav: $WAV' || { echo 'FATAL: 없음 — $WAV'; exit 1; }"
ssh "$GABIA" "[ -f '$SRC' ] && echo '  OK  src: $SRC' || { echo 'FATAL: 없음 — $SRC'; exit 1; }"

# ---- 3. 공유마운트 tmp 준비 + 파일 복사 ------------------------------------
echo ""
echo "==> [3] 공유마운트 tmp 준비 ($SHARED)"
# /tmp 금지 — 컨테이너 마운트 밖이어서 컨테이너에서 보이지 않음.
# 공유마운트 경로(/home/afterlife/afterlife-server/)만 컨테이너가 직접 읽는다.
ssh "$GABIA" "mkdir -p '$SHARED'"
ssh "$GABIA" "cp '$WAV' '$SHARED/seq.wav'"
ssh "$GABIA" "cp '$SRC' '$SHARED/face.jpg'"
echo "  seq.wav 복사 완료"
echo "  face.jpg 복사 완료"

# ---- 4. 컨테이너 내 게이트0 비교 실행 --------------------------------------
echo ""
echo "==> [4] 게이트0 비교 실행 (컨테이너 내)"
echo "   통짜 렌더 × 1 + 2청크 렌더 × 2 + landmark diff + SSIM 계산"
echo "   TRT 재활용(렌더서버 기동 중) — 약 1~3분 소요"
echo ""
ssh "$GABIA" "docker exec '$CONTAINER' bash -lc \"\
  LD_LIBRARY_PATH='$LD_PATH' \
  FIFTH_CFG_YAML='$CFG_YAML' \
  '$PY' '$SCRIPTS/t088_continuation_compare.py' \
    --wav  '$SHARED/seq.wav' \
    --src  '$SHARED/face.jpg' \
    --out  '$OUT' \
    --server '$RENDER_INTERNAL_URL' \
\""

# ---- 5. 결과 확인 -----------------------------------------------------------
echo ""
echo "==> [5] 결과"
ssh "$GABIA" "[ -f '$OUT' ] && cat '$OUT' || echo '(결과 파일 없음 — 위 오류 확인)'"

echo ""
echo "결과 파일: $GABIA:$OUT"
echo ""
echo "PASS 조건:  boundary_head_jump_px < 2.0  AND  boundary_ssim > 0.95"
echo "FAIL:       경계 연속성 불량 (청크 경계 점프 ≥ 2px 또는 SSIM ≤ 0.95)"
echo "SKIP_NO_LANDMARK: detect_landmarks 미동작 (TRT GPU 메모리 충돌 의심)"
echo ""
echo "FAIL/SKIP 시:"
echo "  렌더서버 로그: ssh $GABIA \"docker exec $CONTAINER tail -50 /tmp/fifth_render_server.log\""
echo "========================================================"
