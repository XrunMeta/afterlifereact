#!/usr/bin/env bash
# _remote_create_afterlife.sh — 가비아 서버에서 root 로 실행 (ssh gabia 'bash -s' < 이 파일)
# afterlife 계정 + sudo NOPASSWD + 공개키 + /home/afterlife/afterlife-server 디렉토리 셋업
# idempotent: 이미 존재하는 항목은 건너뜀

set -euo pipefail

PUBKEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIImAyDVBAYIikJosW3yXupLI+ZF2RIqOt4UMn6j9PShz afterlife-gabia-2026-04-30'
SSH_DIR=/home/afterlife/.ssh
AUTH=$SSH_DIR/authorized_keys
SUDOERS=/etc/sudoers.d/afterlife
WORKDIR=/home/afterlife/afterlife-server

echo "=== whoami ==="
whoami

echo ""
echo "=== user afterlife ==="
if id afterlife >/dev/null 2>&1; then
  echo "user 'afterlife' already exists — skipping useradd"
else
  useradd -m -s /bin/bash -G sudo,video afterlife
  echo "user 'afterlife' created (groups: sudo, video)"
fi

echo ""
echo "=== sudoers NOPASSWD ==="
if [[ ! -f "$SUDOERS" ]]; then
  echo "afterlife ALL=(ALL) NOPASSWD:ALL" > "$SUDOERS"
  chmod 440 "$SUDOERS"
  echo "sudoers entry created -> $SUDOERS"
else
  echo "sudoers entry already exists -> $SUDOERS"
fi
visudo -c -f "$SUDOERS"

echo ""
echo "=== authorized_keys ==="
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"
touch "$AUTH"
if grep -qF "$PUBKEY" "$AUTH"; then
  echo "public key already present"
else
  echo "$PUBKEY" >> "$AUTH"
  echo "public key appended"
fi
chmod 600 "$AUTH"
chown -R afterlife:afterlife "$SSH_DIR"
ls -la "$SSH_DIR"

echo ""
echo "=== work directory ==="
mkdir -p "$WORKDIR"
chown afterlife:afterlife "$WORKDIR"
chmod 755 "$WORKDIR"
ls -ld "$WORKDIR"

echo ""
echo "=== verify ==="
id afterlife
groups afterlife
echo "-- as afterlife --"
sudo -u afterlife bash -c 'whoami; pwd; ls -la /home/afterlife/; sudo -n true && echo "sudo NOPASSWD: ok"'

echo ""
echo "=== DONE ==="
