#!/usr/bin/env bash
# _remote_node_check.sh — 서버 Node/pnpm 환경 확인
set +e

echo "===== node ====="
which node && node --version

echo ""
echo "===== npm ====="
which npm && npm --version

echo ""
echo "===== pnpm ====="
which pnpm && pnpm --version

echo ""
echo "===== corepack ====="
which corepack && corepack --version

echo ""
echo "===== apt 가능한 nodejs 버전 ====="
apt-cache policy nodejs 2>/dev/null | head -10

echo ""
echo "===== /home/afterlife 디렉토리 구조 ====="
ls -la /home/afterlife/

echo ""
echo "===== :8100 포트 사용 여부 ====="
ss -ltnp | grep -E ":8100|:8101|:8102" || echo "(8100 free)"

echo ""
echo "===== DONE ====="
