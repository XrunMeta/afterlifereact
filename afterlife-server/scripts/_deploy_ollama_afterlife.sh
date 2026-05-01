#!/usr/bin/env bash
# _deploy_ollama_afterlife.sh — 격리 ollama 인스턴스 배포 (회차 016)
# 전제: configs/systemd/ollama-afterlife.service 가 로컬에 존재
# 이 스크립트는 로컬에서 실행 — 내부적으로 ssh gabia(root) 사용

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
UNIT_LOCAL="$REPO_ROOT/afterlife-server/configs/systemd/ollama-afterlife.service"

[[ -f "$UNIT_LOCAL" ]] || { echo "[error] $UNIT_LOCAL not found"; exit 2; }

echo "===== 1) 모델 디렉토리 준비 (/data/afterlife/ollama-models) ====="
ssh -o BatchMode=yes gabia '
  set -e
  mkdir -p /data/afterlife/ollama-models
  chown -R afterlife:afterlife /data/afterlife
  chmod 750 /data/afterlife
  chmod 750 /data/afterlife/ollama-models
  ls -ld /data/afterlife /data/afterlife/ollama-models
  df -h /data | tail -1
'

echo ""
echo "===== 2) systemd unit 업로드 ====="
scp -o BatchMode=yes -q "$UNIT_LOCAL" gabia:/etc/systemd/system/ollama-afterlife.service
ssh -o BatchMode=yes gabia '
  chown root:root /etc/systemd/system/ollama-afterlife.service
  chmod 644 /etc/systemd/system/ollama-afterlife.service
  ls -la /etc/systemd/system/ollama-afterlife.service
'

echo ""
echo "===== 3) systemctl daemon-reload + enable + start ====="
ssh -o BatchMode=yes gabia '
  set -e
  systemctl daemon-reload
  systemctl enable ollama-afterlife.service
  systemctl start ollama-afterlife.service
  sleep 3
  systemctl is-active ollama-afterlife.service
'

echo ""
echo "===== 4) 상태 확인 ====="
ssh -o BatchMode=yes gabia 'systemctl status ollama-afterlife.service --no-pager 2>&1 | head -25'

echo ""
echo "===== 5) :11435 listen 검증 ====="
ssh -o BatchMode=yes gabia '
  ss -ltnp | grep -E ":11434|:11435" || echo "(no listener yet)"
'

echo ""
echo "===== 6) /oth-path 호출 (빈 목록 정상) ====="
ssh -o BatchMode=yes gabia '
  curl -sS --max-time 5 http://127.0.0.1:11435/api/tags && echo
'

echo ""
echo "===== 7) 격리 확인 — 기존 :11434 도 살아있어야 함 ====="
ssh -o BatchMode=yes gabia '
  curl -sS --max-time 5 http://127.0.0.1:11434/api/tags | head -c 200 && echo
'

echo ""
echo "===== 8) journal 최근 20줄 ====="
ssh -o BatchMode=yes gabia 'journalctl -u ollama-afterlife.service --no-pager -n 20'

echo ""
echo "===== DONE ====="
