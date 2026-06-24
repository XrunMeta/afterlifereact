#!/bin/bash
# prethird "통화 선인사(greet)" 코드 E2E용 가비아 배포.
# 변경: signaling.py(greet 분기 + speech_start echo), pipeline.py(greet() + on_first_audio).
#
# 실행(로컬, sudo 아님): bash _remote_greet_deploy.sh
#   → 원격 백업(.greet-bak) 생성 후 두 파일 scp.
# restart(히즈키 sudo, ! 로 실행):
#   ssh afterlife-gabia "sudo systemctl restart afterlife-prethird"
# 확인:
#   ssh afterlife-gabia "curl -fsS --max-time 5 http://127.0.0.1:8600/healthz"
# 롤백:
#   ssh afterlife-gabia "cp <RDIR>/signaling.py.greet-bak <RDIR>/signaling.py && cp <RDIR>/pipeline.py.greet-bak <RDIR>/pipeline.py" 후 restart
#
# 토글: PRETHIRD_GREETING_ENABLED 기본 "1"(활성). 끄려면 .service env에 =0.
set -e

HOST=afterlife-gabia
RDIR=/home/afterlife/afterlife-server/prethird/scripts
LOCAL="$(cd "$(dirname "$0")" && pwd)"

echo "[1/3] 원격 백업(.greet-bak)..."
ssh "$HOST" "cp '$RDIR/signaling.py' '$RDIR/signaling.py.greet-bak' && cp '$RDIR/pipeline.py' '$RDIR/pipeline.py.greet-bak' && echo '  백업 생성됨: signaling.py.greet-bak, pipeline.py.greet-bak'"

echo "[2/3] scp 배포..."
scp "$LOCAL/signaling.py" "$HOST:$RDIR/signaling.py"
scp "$LOCAL/pipeline.py"  "$HOST:$RDIR/pipeline.py"
echo "  배포 완료: signaling.py, pipeline.py"

echo "[3/3] 다음 단계(히즈키 sudo, ! 로):"
echo "  ssh $HOST \"sudo systemctl restart afterlife-prethird\""
echo "  ssh $HOST \"curl -fsS --max-time 5 http://127.0.0.1:8600/healthz\""
