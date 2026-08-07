#!/usr/bin/env bash
# T-257(PR#721) prethird 잔여분 — signaling.py 의 face_event clone_id 방어층을 라이브로.
#
# 배경: T-257 은 preview 에 머지됐지만 가비아는 git 이 아니라 수동 배포라, signaling.py 만
# 라이브에 미반영된 채 남아 드리프트(라이브 1111줄 / preview 1168줄)를 만들고 있었다.
# T-127 사고가 바로 이 "미배포 분기 누적"에서 출발했으므로 정리해둔다.
#
# 동작 변화: 현재는 없다. RN 이 face_event 에 clone_id 를 아직 싣지 않아 게이트는 항상
# 통과 분기만 탄다(dormant). 서버측 (user_id, clone_id) 스코프가 실질 방어이고, 이건 2층.
#
# ⚠️ signaling.py 는 통화 핵심 파일 — 재시작 시 진행 중 통화가 끊긴다. 배포 전 sessions=0 확인.
# ⚠️ 선행: _check_live_drift.sh 로 라이브 고유 코드 없음 확인(2026-08-06 기준 0줄).
set -euo pipefail
HOST=${GABIA_SSH:-afterlife-gabia}
REMOTE=/home/afterlife/afterlife-server/prethird/scripts
LOCAL="$(cd "$(dirname "$0")" && pwd)"
TS=$(date +%Y%m%d-%H%M%S)
SERVICE=afterlife-prethird.service
PORT=8600

echo "=== T-257 signaling.py 배포 (${TS}) ==="

# 0) 진행 중 통화 확인 — 있으면 중단한다(끊지 않는다).
SESSIONS=$(ssh "$HOST" "curl -sf http://127.0.0.1:$PORT/healthz" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("sessions", -1))')
echo "  현재 활성 세션: $SESSIONS"
if [ "$SESSIONS" != "0" ]; then
  echo "❌ 통화가 진행 중이라 중단합니다(재시작 시 끊김). 세션이 0 이 되면 다시 실행하세요."
  exit 1
fi

# 1) 백업
ssh "$HOST" "cd $REMOTE && mkdir -p .bak-t257s-$TS && cp signaling.py .bak-t257s-$TS/"
echo "  백업 완료: .bak-t257s-$TS"

# 2) 원자적 교체
scp -q "$LOCAL/signaling.py" "$HOST:$REMOTE/.stage-signaling.py"
ssh "$HOST" "mv $REMOTE/.stage-signaling.py $REMOTE/signaling.py"
echo "  교체 완료"

# 3) 문법 + import 확인 — signaling 은 의존 모듈이 많아 컴파일만으로는 부족하다.
#    ⚠️ 시스템 python3 에는 aiohttp 가 없다. 서비스가 실제로 쓰는 conda 인터프리터로 확인해야
#    한다(2026-08-06 실측: ExecStart 가 miniconda3/envs/musetalk/bin/python).
PY=/home/afterlife/miniconda3/envs/musetalk/bin/python
ssh "$HOST" "cd $REMOTE && $PY -m py_compile signaling.py && echo SYNTAX_OK"
ssh "$HOST" "cd $REMOTE && $PY -c 'import signaling; print(\"IMPORT_OK\", hasattr(signaling, \"face_event_clone_matches\"))'"

# 4) 재시작 + 헬스체크
ssh "$HOST" "sudo systemctl restart $SERVICE && sleep 3 && systemctl is-active $SERVICE"
sleep 2
ssh "$HOST" "curl -sf http://127.0.0.1:$PORT/healthz && echo"

echo ""
echo "T-257 signaling 배포 완료."
echo "롤백: ssh $HOST 'cp $REMOTE/.bak-t257s-$TS/signaling.py $REMOTE/ && sudo systemctl restart $SERVICE'"
