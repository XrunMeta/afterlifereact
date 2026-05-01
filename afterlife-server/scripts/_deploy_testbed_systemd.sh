#!/usr/bin/env bash
# _deploy_testbed_systemd.sh — afterlife-testbed.service 배포 (회차 022)
# 1) 떠있는 임시 서버 정리
# 2) systemd unit 업로드
# 3) daemon-reload + enable + start
# 4) listen / healthz / chat 검증
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
UNIT_LOCAL="$REPO_ROOT/afterlife-server/configs/systemd/afterlife-testbed.service"

[[ -f "$UNIT_LOCAL" ]] || { echo "[error] $UNIT_LOCAL not found"; exit 2; }

echo "===== 1) 8100 포트 점유자 정리 (수동 떠있는 인스턴스) ====="
ssh -o BatchMode=yes gabia '
  ss -ltnp 2>/dev/null | awk -F"pid=" "/8100/{split(\$2,a,\",\"); print a[1]}" | xargs -r kill 2>/dev/null
  sleep 1
  ss -ltnp | grep 8100 || echo "(8100 free)"
'

echo ""
echo "===== 2) systemd unit 업로드 ====="
scp -o BatchMode=yes -q "$UNIT_LOCAL" gabia:/etc/systemd/system/afterlife-testbed.service
ssh -o BatchMode=yes gabia '
  chown root:root /etc/systemd/system/afterlife-testbed.service
  chmod 644 /etc/systemd/system/afterlife-testbed.service
  ls -la /etc/systemd/system/afterlife-testbed.service
'

echo ""
echo "===== 3) daemon-reload + enable + start ====="
ssh -o BatchMode=yes gabia '
  set -e
  systemctl daemon-reload
  systemctl enable afterlife-testbed.service
  systemctl start afterlife-testbed.service
  sleep 2
  systemctl is-active afterlife-testbed.service
'

echo ""
echo "===== 4) status (헤더만) ====="
ssh -o BatchMode=yes gabia 'systemctl status afterlife-testbed.service --no-pager 2>&1 | head -18'

echo ""
echo "===== 5) :8100 listen ====="
ssh -o BatchMode=yes gabia 'ss -ltnp | grep 8100'

echo ""
echo "===== 6) /healthz + /oth-path ====="
ssh -o BatchMode=yes gabia '
  curl -sS -w "\n[http %{http_code}, time %{time_total}s]\n" --max-time 5 http://127.0.0.1:8100/healthz
  curl -sS --max-time 5 http://127.0.0.1:8100/api/version | head -c 300
  echo
'

echo ""
echo "===== 7) /oth-path 스트림 짧은 검증 (10s) ====="
ssh -o BatchMode=yes gabia "curl -sS -N --max-time 30 -H 'Content-Type: application/json' -d '{\"message\":\"할매 한마디만 해 봐\"}' http://127.0.0.1:8100/api/chat | head -c 1500"

echo ""
echo "===== 8) journal 마지막 15줄 ====="
ssh -o BatchMode=yes gabia 'journalctl -u afterlife-testbed.service --no-pager -n 15'

echo ""
echo "===== 9) ollama-afterlife 의존성 / 회귀 ====="
ssh -o BatchMode=yes gabia '
  systemctl is-active ollama-afterlife.service
  curl -sS --max-time 5 http://127.0.0.1:11435/api/tags | head -c 250
  echo
  echo "metahint :11434 회귀:"
  curl -sS --max-time 5 http://127.0.0.1:11434/api/tags | head -c 200
  echo
'

echo ""
echo "===== DONE ====="
