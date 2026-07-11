#!/usr/bin/env bash
# T-127 preview 정본 → 가비아 라이브 선별 재배포 + continuation 제거.
# 원자적 배포(6파일 동시) + 타임스탬프 백업 + continuation_loop.py 삭제.
#
# ⚠️ 실행 금지 — Task 5(히즈키 승인) 이후에만 수동 실행.
set -euo pipefail
HOST=afterlife-gabia
REMOTE=/home/afterlife/afterlife-server/prethird/scripts
LOCAL="$(cd "$(dirname "$0")" && pwd)"
TS=$(date +%Y%m%d-%H%M%S)
FILES="pipeline.py server.py fifth_inproc.py signaling.py media_tracks.py session.py"
SERVICE=afterlife-prethird.service
PORT=8600

# 1) 백업 — 6파일(정본)은 엄격 백업(실패 시 중단), continuation_loop.py는 존재 불확실하므로 관용 처리
ssh "$HOST" "cd $REMOTE && mkdir -p .bak-t127-$TS && cp $FILES .bak-t127-$TS/"
ssh "$HOST" "cd $REMOTE && cp continuation_loop.py .bak-t127-$TS/ 2>/dev/null || true"
# 2) 6파일 원자적 배포(임시 업로드 후 일괄 mv)
for f in $FILES; do scp -q "$LOCAL/$f" "$HOST:$REMOTE/.stage-$f"; done
ssh "$HOST" "set -e; cd $REMOTE && for f in $FILES; do mv .stage-\$f \$f; done"
# 3) continuation 제거
ssh "$HOST" "cd $REMOTE && rm -f continuation_loop.py"
# 4) idle_policy.py 등 의존 모듈 존재 확인(signaling import)
ssh "$HOST" "cd $REMOTE && python3 -c 'import idle_policy' && echo IDLE_POLICY_OK"
# 5) restart + healthz
ssh "$HOST" "sudo systemctl restart $SERVICE && sleep 3 && systemctl is-active $SERVICE"
sleep 2
ssh "$HOST" "curl -sf http://127.0.0.1:$PORT/healthz && echo HEALTHZ_OK"
echo "T-127 배포 완료 (백업 .bak-t127-$TS). 롤백: cp .bak-t127-$TS/* ."
