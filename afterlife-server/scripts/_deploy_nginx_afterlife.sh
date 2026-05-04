#!/usr/bin/env bash
# _deploy_nginx_afterlife.sh — memorial.example.invalid server block 가비아에 배포
# 1) 가비아의 sites-available 백업 (혹시 모를 충돌 대비)
# 2) 신규 server block 업로드
# 3) sites-enabled symlink 추가
# 4) nginx -t (dry-run)
# 5) systemctl reload nginx
# 6) Cloudflare 통한 외부 검증 (healthz, root)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONF_LOCAL="$REPO_ROOT/afterlife-server/configs/nginx/memorial.example.invalid.conf"

[[ -f "$CONF_LOCAL" ]] || { echo "[error] $CONF_LOCAL not found"; exit 2; }

echo "===== 1) 가비아 sites-available/default 백업 (시각 명시) ====="
ssh -o BatchMode=yes gabia 'ts=$(date +%Y%m%d-%H%M%S); cp -p /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak."$ts" && ls -la /etc/nginx/sites-available/ | tail -5'

echo ""
echo "===== 2) 신규 server block 업로드 ====="
scp -o BatchMode=yes -q "$CONF_LOCAL" gabia:/etc/nginx/sites-available/memorial.example.invalid
ssh -o BatchMode=yes gabia 'chown root:root /etc/nginx/sites-available/memorial.example.invalid; chmod 644 /etc/nginx/sites-available/memorial.example.invalid; ls -la /etc/nginx/sites-available/memorial.example.invalid'

echo ""
echo "===== 3) sites-enabled symlink ====="
ssh -o BatchMode=yes gabia 'ln -sfn /etc/nginx/sites-available/memorial.example.invalid /etc/nginx/sites-enabled/memorial.example.invalid; ls -la /etc/nginx/sites-enabled/'

echo ""
echo "===== 4) nginx -t (dry-run) ====="
ssh -o BatchMode=yes gabia 'nginx -t'

echo ""
echo "===== 5) systemctl reload nginx ====="
ssh -o BatchMode=yes gabia 'systemctl reload nginx && systemctl is-active nginx'

echo ""
echo "===== 6) origin 직접 검증 (가비아 내부 from localhost) ====="
ssh -o BatchMode=yes gabia 'curl -sk -o- -w "\n[origin] HTTP %{http_code}\n" --resolve memorial.example.invalid:443:127.0.0.1 https://memorial.example.invalid/healthz; curl -sk -o- -w "\n[origin] HTTP %{http_code}\n" --resolve memorial.example.invalid:443:127.0.0.1 https://memorial.example.invalid/'

echo ""
echo "===== 7) Cloudflare 통한 외부 검증 ====="
echo "(주의: Cloudflare 캐시/전파 1~2분 걸릴 수 있음)"
sleep 3
curl -s -o- -w "\n[CF] HTTP %{http_code}  cert: %{ssl_verify_result}\n" --max-time 15 https://memorial.example.invalid/healthz || echo "[warn] CF 외부 호출 실패 (DNS 캐시/전파 대기)"
echo ""
curl -s -o- -w "\n[CF] HTTP %{http_code}\n" --max-time 15 https://memorial.example.invalid/ || echo "[warn] CF root 호출 실패"

echo ""
echo "===== chat.metahint.ai 회귀 확인 ====="
curl -s -I --max-time 10 https://chat.metahint.ai/ | head -5

echo ""
echo "===== DONE ====="
