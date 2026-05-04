#!/usr/bin/env bash
# _deploy_testbed.sh — testbed/ 동기화 + pnpm install (회차 019)
# 1) rsync 로 로컬 testbed/ → 서버 /home/afterlife/afterlife-server/testbed/
#    (node_modules / .env 제외)
# 2) 서버에서 pnpm install (afterlife user)
# 3) lockfile 가져오기 (있으면)
# 4) 짧게 server 실행 → /healthz curl → 종료

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCAL_DIR="$REPO_ROOT/afterlife-server/testbed"
REMOTE_DIR="/home/afterlife/afterlife-server/testbed"

[[ -d "$LOCAL_DIR" ]] || { echo "[error] $LOCAL_DIR not found"; exit 2; }

echo "===== 1) rsync up (afterlife-gabia 로 직접 sync — 권한 일관성) ====="
rsync -av --delete \
  --exclude 'node_modules/' \
  --exclude '.env' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  -e "ssh -o BatchMode=yes" \
  "$LOCAL_DIR/" \
  afterlife-gabia:"$REMOTE_DIR/"

echo ""
echo "===== 2) env 파일 (.env 가 없으면 env.example 복사) ====="
ssh -o BatchMode=yes afterlife-gabia "cd $REMOTE_DIR && [[ -f .env ]] || cp env.example .env; ls -la .env"

echo ""
echo "===== 3) pnpm install (afterlife user, testbed cwd) ====="
ssh -o BatchMode=yes afterlife-gabia "cd $REMOTE_DIR && pnpm install --prefer-offline 2>&1 | tail -20"

echo ""
echo "===== 4) lockfile 가져오기 (서버 → 로컬) ====="
scp -o BatchMode=yes -q afterlife-gabia:"$REMOTE_DIR/pnpm-lock.yaml" "$LOCAL_DIR/pnpm-lock.yaml" 2>/dev/null || echo "(no lockfile)"
ls -la "$LOCAL_DIR/pnpm-lock.yaml" 2>/dev/null || true

echo ""
echo "===== 5) server.js 짧게 실행 → /healthz 확인 → 종료 ====="
ssh -o BatchMode=yes afterlife-gabia "cd $REMOTE_DIR && nohup node server.js > /tmp/testbed-smoke.log 2>&1 & echo \$! > /tmp/testbed-smoke.pid; sleep 2; curl -sS -w '\\n[http %{http_code}, time %{time_total}s]\\n' http://127.0.0.1:8100/healthz; curl -sS http://127.0.0.1:8100/api/version; echo; sleep 1; kill \$(cat /tmp/testbed-smoke.pid) 2>/dev/null; sleep 1; echo '--- log ---'; cat /tmp/testbed-smoke.log; rm -f /tmp/testbed-smoke.log /tmp/testbed-smoke.pid"

echo ""
echo "===== DONE ====="
