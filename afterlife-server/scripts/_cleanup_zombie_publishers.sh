#!/usr/bin/env bash
# _cleanup_zombie_publishers.sh
# ─────────────────────────────────────────────────────────────────────────────
# 좀비 publisher 정리 — 통화 종료 후 죽지 않고 남은 publisher.py 프로세스를 kill 하고
# afterlife-testbed 를 재기동해 orchestrator 포트풀/call state 를 리셋한다.
#
# 배경(T-057): publisher teardown 이 실패하면 publisher.py 가 orphan 으로 남아
#   idle 영상을 계속 송출하며 포트(84xx)를 점유한다. 좀비가 포트풀을 막으면
#   새 통화 allocate 가 실패해 "연결 실패"가 된다. (실측: 6일째 살아있던 좀비 발견)
#
# ⚠️ 주의: 이 스크립트는 **모든** publisher.py 를 kill 한다. 진행 중인 정상 통화도
#   끊긴다. 활성 통화가 없는 점검/복구 상황에서만 실행할 것.
#
# 사용법:
#   (로컬에서 원격 실행)  ssh afterlife-gabia 'bash -s' < _cleanup_zombie_publishers.sh
#   (서버에서 직접)        bash _cleanup_zombie_publishers.sh
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

TESTBED_HEALTH="http://127.0.0.1:8100/healthz"
SERVICE="afterlife-testbed"

echo "=== [1] 현재 publisher 프로세스 ==="
ps aux | grep '[p]ublisher\.py' | awk '{print "  pid="$2" started="$9" cputime="$10}' || true
COUNT_BEFORE=$(pgrep -fc 'publisher\.py' || echo 0)
echo "  → publisher 수: ${COUNT_BEFORE}"

if [ "${COUNT_BEFORE}" -gt 0 ]; then
  PIDS=$(pgrep -f 'publisher\.py' | tr '\n' ' ')
  echo "=== [2] kill -9: ${PIDS}==="
  kill -9 ${PIDS} 2>/dev/null || sudo kill -9 ${PIDS} 2>/dev/null || true
  sleep 2
else
  echo "=== [2] 좀비 없음 — kill 생략 ==="
fi

echo "=== [3] ${SERVICE} 재기동 ==="
sudo systemctl restart "${SERVICE}" 2>/dev/null \
  || systemctl --user restart "${SERVICE}" 2>/dev/null \
  || { echo "  !! 재기동 실패 — 서비스명/권한 확인 필요"; exit 1; }
sleep 5

echo "=== [4] 검증 ==="
ACTIVE=$(systemctl is-active "${SERVICE}" 2>/dev/null || systemctl --user is-active "${SERVICE}" 2>/dev/null || echo unknown)
HEALTH=$(curl -s -m 5 "${TESTBED_HEALTH}" 2>/dev/null || echo "no-response")
LEFT=$(pgrep -fc 'publisher\.py' || echo 0)
PORTS=$(ss -tlnp 2>/dev/null | grep -cE ':84[0-9][0-9]' || echo 0)

echo "  service active : ${ACTIVE}"
echo "  healthz        : ${HEALTH}"
echo "  publisher 잔존  : ${LEFT}  (0 이어야 정상 — 새 통화 시 재spawn)"
echo "  84xx 포트       : ${PORTS}  (0 이어야 정상)"

if [ "${ACTIVE}" = "active" ] && [ "${HEALTH}" = "ok" ] && [ "${LEFT}" = "0" ]; then
  echo "=== ✅ 정리 완료 — 새 통화 allocate 가능 상태 ==="
else
  echo "=== ⚠️ 점검 필요 — 위 값 확인 ==="
  exit 1
fi
