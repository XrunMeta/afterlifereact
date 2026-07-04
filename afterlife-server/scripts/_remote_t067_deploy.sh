#!/usr/bin/env bash
# _remote_t067_deploy.sh — T-067(얼굴 화자 식별) prethird 코드 배포 (Task 15)
#
# 기능: 이번 브랜치(feat/t067-face-speaker-id)에서 변경된 prethird 스크립트만
#       선별 rsync(전체 디렉토리 rsync 금지 — 가비아에는 워크트리에 없는 로컬 패치
#       가 있음. 예: fifth_inproc.py의 phase_token 지원, Task 8 보고서 참고).
#       배포 자체는 face_event 토글 **off 기본**(회귀 0) — drop-in 켜기는
#       `--enable-react` 지정 시에만 별도 수행.
#
# 사전(배포자, 스크립트 밖):
#   - Vectorize 인덱스·D1 마이그(0082/0083)·wrangler deploy --env preview 는
#     이 스크립트 범위 밖(docs/AFTERLIFE_SYSTEM_MASTER.md §8, Task 8 배포 선행 4단계).
#   - ~/.ssh/config 에 afterlife-gabia 등록돼 있어야 함.
#
# 실행(로컬, 기본=토글 off 유지):
#   bash afterlife-server/scripts/_remote_t067_deploy.sh
# 실행(토글 on까지 수행):
#   bash afterlife-server/scripts/_remote_t067_deploy.sh --enable-react
#
# 롤백(코드는 그대로 두고 토글만 끄기 — 회귀 0 설계):
#   ssh afterlife-gabia "sudo rm -f /etc/systemd/system/afterlife-prethird.service.d/facereact.conf \
#     && sudo systemctl daemon-reload && sudo systemctl restart afterlife-prethird"
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/.." && pwd)"   # afterlife-server/

SSH_HOST="${AFTERLIFE_SSH:-afterlife-gabia}"
REMOTE_SCRIPTS_DIR="${REMOTE_SCRIPTS_DIR:-/home/afterlife/afterlife-server/prethird/scripts}"
REMOTE_DROPIN_DIR="/etc/systemd/system/afterlife-prethird.service.d"

ENABLE_REACT=0
if [ "${1:-}" = "--enable-react" ]; then
  ENABLE_REACT=1
fi

# ⚠️ 선별 목록 — 이번 브랜치(feat/t067-face-speaker-id)에서 origin/preview 대비
#    변경된 prethird 스크립트만 명시(git diff origin/preview --name-only 로 뽑음).
#    새 파일 추가 시 이 목록에 반드시 추가할 것(전체 디렉토리 rsync 금지 이유는 상단 주석).
FILES=(
  "pipeline.py"
  "session.py"
  "signaling.py"
  "l2p_client.py"
  "learn_writeback.py"
  "name_extract.py"
)

echo "=== T-067 Task 15: prethird 배포 (선별 rsync) ==="
echo "  대상: $SSH_HOST"
echo "  원격 경로: $REMOTE_SCRIPTS_DIR"
echo "  파일 수: ${#FILES[@]}"
echo ""

for f in "${FILES[@]}"; do
  test -f "$REPO_ROOT/prethird/scripts/$f" || { echo "FATAL: 로컬 파일 없음: $f"; exit 1; }
done

echo "[1/5] 선별 rsync..."
for f in "${FILES[@]}"; do
  rsync -av "$REPO_ROOT/prethird/scripts/$f" "$SSH_HOST:$REMOTE_SCRIPTS_DIR/$f"
done

if [ "$ENABLE_REACT" = "1" ]; then
  echo "[2/5] drop-in facereact.conf 설치(--enable-react 지정됨, 토글 ON)..."
  scp "$REPO_ROOT/prethird/deploy/facereact.conf" "$SSH_HOST:/tmp/facereact.conf"
  ssh "$SSH_HOST" "sudo install -d -m755 '$REMOTE_DROPIN_DIR' \
    && sudo cp /tmp/facereact.conf '$REMOTE_DROPIN_DIR/facereact.conf' \
    && sudo systemctl daemon-reload"
else
  echo "[2/5] drop-in 설치 스킵(토글 off 기본 — --enable-react 미지정)"
fi

echo "[3/5] restart 전 MainPID 기록..."
PID_BEFORE=$(ssh "$SSH_HOST" "systemctl show -p MainPID --value afterlife-prethird")
echo "  MainPID(before): $PID_BEFORE"

echo "[4/5] systemctl restart afterlife-prethird..."
ssh "$SSH_HOST" "sudo systemctl restart afterlife-prethird"
sleep 10  # musetalk in-proc 로드 ~6.5s + 여유 (records/cd-sync 배포 관례)

echo "[5/5] restart 후 MainPID 확인(T-088 교훈: 미변경 시 실패 처리)..."
PID_AFTER=$(ssh "$SSH_HOST" "systemctl show -p MainPID --value afterlife-prethird")
echo "  MainPID(after): $PID_AFTER"

if [ "$PID_AFTER" = "$PID_BEFORE" ] || [ "$PID_AFTER" = "0" ]; then
  echo "FATAL: MainPID 미변경(재기동 실패 의심) — before=$PID_BEFORE after=$PID_AFTER"
  exit 1
fi

echo ""
echo "================ 검증 ================"
echo -n "prethird healthz: "
ssh "$SSH_HOST" "curl -s --max-time 8 http://127.0.0.1:8600/healthz"; echo

echo -n "실효 env(face-react): "
ssh "$SSH_HOST" "tr '\\0' '\\n' < /proc/$PID_AFTER/environ 2>/dev/null | grep PRETHIRD_FACE_REACT_ENABLED || echo '(미설정=off, 정상 — --enable-react 미지정 시 기대값)'"

echo "================ 완료 ================"
echo ""
echo "다음:"
echo "  - 토글 off 상태에서 기존 통화(say) 스모크 정상 확인 후 완료 판정."
echo "  - 토글 on 검증(Task 16 실기 E2E)은 배포 선행 4단계(Vectorize/마이그/deploy/threshold) 완료 후."
echo "  - 롤백: ssh $SSH_HOST \"sudo rm -f $REMOTE_DROPIN_DIR/facereact.conf && sudo systemctl daemon-reload && sudo systemctl restart afterlife-prethird\""
