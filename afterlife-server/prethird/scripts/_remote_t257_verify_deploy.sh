#!/usr/bin/env bash
# T-257 후속(PR#735) — /oth-path 대화 트레이닝 랩에 "얼굴 기반 화자만" 반영.
#
# 배포 대상 2파일:
#   scripts/chat_endpoint.py   — verify_persons 가 faceCount·isSelf 를 통과
#   static/verify_chat.html    — 드롭다운 필터·표기·토글
#
# 특징: 통화 파이프라인(pipeline/signaling/session)을 건드리지 않는다. verify 랩 전용
# 경로만 바뀌므로 통화 중 배포해도 실통화 영향은 없다. 다만 프로세스 재시작은 필요하다
# (aiohttp 핸들러가 모듈 로드 시점에 바인딩되므로).
#
# ⚠️ 선행: _check_live_drift.sh 로 라이브 고유 코드 없음을 확인할 것.
#          2026-08-06 확인 결과 chat_endpoint.py 라이브 고유 2줄(=구 버전),
#          signaling.py 0줄 — 흡수 대상 없음.
set -euo pipefail
HOST=${GABIA_SSH:-afterlife-gabia}
REMOTE_SCRIPTS=/home/afterlife/afterlife-server/prethird/scripts
REMOTE_STATIC=/home/afterlife/afterlife-server/prethird/static
LOCAL_SCRIPTS="$(cd "$(dirname "$0")" && pwd)"
LOCAL_STATIC="$(cd "$(dirname "$0")/../static" && pwd)"
TS=$(date +%Y%m%d-%H%M%S)
SERVICE=afterlife-prethird.service
PORT=8600

echo "=== T-257 verify 랩 배포 (${TS}) ==="

# 1) 백업 — 롤백 경로를 먼저 확보한다.
ssh "$HOST" "cd $REMOTE_SCRIPTS && mkdir -p .bak-t257v-$TS && cp chat_endpoint.py .bak-t257v-$TS/"
ssh "$HOST" "cd $REMOTE_STATIC && mkdir -p .bak-t257v-$TS && cp verify_chat.html .bak-t257v-$TS/"
echo "  백업 완료: .bak-t257v-$TS"

# 2) 원자적 교체 — 임시 업로드 후 mv (반쯤 쓰인 파일이 로드되는 창을 없앤다).
scp -q "$LOCAL_SCRIPTS/chat_endpoint.py" "$HOST:$REMOTE_SCRIPTS/.stage-chat_endpoint.py"
scp -q "$LOCAL_STATIC/verify_chat.html"  "$HOST:$REMOTE_STATIC/.stage-verify_chat.html"
ssh "$HOST" "set -e; mv $REMOTE_SCRIPTS/.stage-chat_endpoint.py $REMOTE_SCRIPTS/chat_endpoint.py; mv $REMOTE_STATIC/.stage-verify_chat.html $REMOTE_STATIC/verify_chat.html"
echo "  교체 완료"

# 3) 문법 확인 — 재시작 전에 import 가능한지 본다(깨진 파일로 서비스가 죽는 것 방지).
ssh "$HOST" "cd $REMOTE_SCRIPTS && python3 -m py_compile chat_endpoint.py && echo SYNTAX_OK"

# 4) 재시작 + 헬스체크
ssh "$HOST" "sudo systemctl restart $SERVICE && sleep 3 && systemctl is-active $SERVICE"
sleep 2
ssh "$HOST" "curl -sf http://127.0.0.1:$PORT/healthz >/dev/null && echo HEALTHZ_OK"

echo ""
echo "T-257 verify 배포 완료."
echo "롤백: ssh $HOST 'cp $REMOTE_SCRIPTS/.bak-t257v-$TS/chat_endpoint.py $REMOTE_SCRIPTS/ && cp $REMOTE_STATIC/.bak-t257v-$TS/verify_chat.html $REMOTE_STATIC/ && sudo systemctl restart $SERVICE'"
