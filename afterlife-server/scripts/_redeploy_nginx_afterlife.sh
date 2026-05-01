#!/usr/bin/env bash
# _redeploy_nginx_afterlife.sh — memorial.example.invalid 의 location / 을 proxy_pass 로 교체 (회차 023)
# 이전 stub 버전 백업 → 신규 업로드 → nginx -t → reload → 회귀 검증

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONF_LOCAL="$REPO_ROOT/afterlife-server/configs/nginx/memorial.example.invalid.conf"

[[ -f "$CONF_LOCAL" ]] || { echo "[error] $CONF_LOCAL not found"; exit 2; }

echo "===== 1) 기존 conf 백업 (시각 명시) ====="
ssh -o BatchMode=yes gabia '
  ts=$(date +%Y%m%d-%H%M%S)
  cp -p /etc/nginx/sites-available/memorial.example.invalid /etc/nginx/sites-available/memorial.example.invalid.bak."$ts"
  ls -la /etc/nginx/sites-available/memorial.example.invalid* | tail -5
'

echo ""
echo "===== 2) 신규 conf 업로드 ====="
scp -o BatchMode=yes -q "$CONF_LOCAL" gabia:/etc/nginx/sites-available/memorial.example.invalid
ssh -o BatchMode=yes gabia '
  chown root:root /etc/nginx/sites-available/memorial.example.invalid
  chmod 644 /etc/nginx/sites-available/memorial.example.invalid
  ls -la /etc/nginx/sites-available/memorial.example.invalid
'

echo ""
echo "===== 3) nginx -t (dry-run) ====="
ssh -o BatchMode=yes gabia 'nginx -t'

echo ""
echo "===== 4) systemctl reload nginx ====="
ssh -o BatchMode=yes gabia 'systemctl reload nginx && systemctl is-active nginx'

echo ""
echo "===== 5) origin 직접 (가비아 내부) — /healthz, /, /chat.css ====="
ssh -o BatchMode=yes gabia '
  echo "--- /healthz (Express)"
  curl -sk -w "\n[origin %{http_code}, len %{size_download}]\n" --resolve memorial.example.invalid:443:127.0.0.1 https://memorial.example.invalid/healthz
  echo "--- /nginx-health (nginx)"
  curl -sk -w "\n[origin %{http_code}]\n" --resolve memorial.example.invalid:443:127.0.0.1 https://memorial.example.invalid/nginx-health
  echo "--- / (index.html, head)"
  curl -sk --resolve memorial.example.invalid:443:127.0.0.1 https://memorial.example.invalid/ | head -c 400
  echo
  echo "--- /chat.css head"
  curl -sk -w "\n[origin %{http_code}, len %{size_download}]\n" -o /dev/null --resolve memorial.example.invalid:443:127.0.0.1 https://memorial.example.invalid/chat.css
'

echo ""
echo "===== 6) origin SSE 스트림 (POST /oth-path) ====="
ssh -o BatchMode=yes gabia 'curl -sk -N --max-time 30 \
  --resolve memorial.example.invalid:443:127.0.0.1 \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"할매 nginx 통과 잘 되나?\"}" \
  https://memorial.example.invalid/oth-path | head -c 1500'

echo ""
echo "===== 7) Cloudflare 외부 검증 ====="
sleep 2
echo "--- /nginx-health (CF)"
curl -s -w "\n[CF %{http_code}]\n" --max-time 15 https://memorial.example.invalid/nginx-health || echo "[warn] CF /nginx-health 실패"
echo "--- / (CF, head)"
curl -s --max-time 15 https://memorial.example.invalid/ | head -c 400 || echo "[warn] CF / 실패"
echo
echo "--- /chat.css (CF)"
curl -s -w "\n[CF %{http_code}, len %{size_download}]\n" -o /dev/null --max-time 15 https://memorial.example.invalid/chat.css || true

echo ""
echo "===== 8) Cloudflare SSE 외부 검증 (POST /oth-path) ====="
curl -s -N --max-time 30 \
  -H "Content-Type: application/json" \
  -d '{"message":"할매 클플 통과도 되나?"}' \
  https://memorial.example.invalid/oth-path | head -c 2000
echo ""

echo ""
echo "===== 9) chat.metahint.ai 회귀 ====="
curl -s -I --max-time 10 https://chat.metahint.ai/ | head -5

echo ""
echo "===== DONE ====="
