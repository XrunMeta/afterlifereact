#!/usr/bin/env bash
# _remote_node_install.sh — Node 22 LTS + pnpm 설치 (root)
set -e

echo "===== 1) NodeSource 저장소 추가 (Node 22 LTS) ====="
if [[ ! -f /etc/apt/keyrings/nodesource.gpg ]]; then
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -qq
fi

echo ""
echo "===== 2) nodejs 설치 ====="
apt-get install -y nodejs >/dev/null
node --version
npm --version

echo ""
echo "===== 3) corepack enable + pnpm 활성화 ====="
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version

echo ""
echo "===== 4) /home/afterlife/afterlife-server/testbed 디렉토리 ====="
mkdir -p /home/afterlife/afterlife-server/testbed
chown -R afterlife:afterlife /home/afterlife/afterlife-server
ls -la /home/afterlife/afterlife-server/

echo ""
echo "===== 5) afterlife 계정에서 node/pnpm 사용 가능 확인 ====="
sudo -u afterlife -H bash -lc 'node --version; npm --version; pnpm --version'

echo ""
echo "===== DONE ====="
