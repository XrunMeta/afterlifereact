#!/usr/bin/env bash
# _ssh_config_setup.sh — ~/.ssh/config 에 'afterlife-gabia' 호스트 항목 추가 (idempotent)
# 백업: ~/.ssh/config.bak.<epoch>

set -euo pipefail

CFG="$HOME/.ssh/config"

if [[ ! -f "$CFG" ]]; then
  echo "[ssh_config_setup] $CFG does not exist; creating empty file"
  install -m 600 /dev/null "$CFG"
fi

if grep -qE "^Host[[:space:]]+afterlife-gabia([[:space:]]|$)" "$CFG"; then
  echo "[ssh_config_setup] 'Host afterlife-gabia' already present — skipping append"
  exit 0
fi

BACKUP="${CFG}.bak.$(date +%s)"
cp "$CFG" "$BACKUP"
echo "[ssh_config_setup] backup -> $BACKUP"

cat >> "$CFG" <<'EOF'

Host afterlife-gabia
  HostName 121.254.172.32
  User afterlife
  IdentityFile ~/.ssh/id_afterlife_gabia
  IdentitiesOnly yes
  ServerAliveInterval 60
  ServerAliveCountMax 3
EOF

echo "[ssh_config_setup] appended Host afterlife-gabia"
