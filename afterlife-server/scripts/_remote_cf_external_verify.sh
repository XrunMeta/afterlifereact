#!/usr/bin/env bash
# _remote_cf_external_verify.sh — 가비아에서 자기 도메인을 외부(CF) 통해 호출
# Cloudflare DNS 따라가서 CF edge → 우리 origin 으로 round-trip 됨
set +e

echo "===== 0) DNS resolve (CF IP 확인) ====="
getent hosts memorial.example.invalid | head -3
dig +short memorial.example.invalid | head -5

echo ""
echo "===== 1) CF /nginx-health ====="
curl -sS -w "\n[CF %{http_code}]\n" --max-time 15 https://memorial.example.invalid/nginx-health

echo ""
echo "===== 2) CF /healthz (Express) ====="
curl -sS -w "\n[CF %{http_code}]\n" --max-time 15 https://memorial.example.invalid/healthz

echo ""
echo "===== 3) CF / (index.html head) ====="
curl -sS --max-time 15 https://memorial.example.invalid/ | head -c 400
echo ""

echo ""
echo "===== 4) CF /chat.css ====="
curl -sS -w "[CF %{http_code}, len %{size_download}]\n" -o /dev/null --max-time 15 https://memorial.example.invalid/chat.css

echo ""
echo "===== 5) CF /chat.js ====="
curl -sS -w "[CF %{http_code}, len %{size_download}]\n" -o /dev/null --max-time 15 https://memorial.example.invalid/chat.js

echo ""
echo "===== 6) CF /oth-path ====="
curl -sS --max-time 15 https://memorial.example.invalid/oth-path | head -c 250
echo ""

echo ""
echo "===== 7) CF SSE /oth-path (가장 중요) ====="
curl -sS -N --max-time 30 \
  -H 'Content-Type: application/json' \
  -d '{"message":"할매 클플 통과 잘 되는가?"}' \
  https://memorial.example.invalid/oth-path | head -c 2500
echo ""

echo ""
echo "===== 8) chat.metahint.ai 회귀 (헤더) ====="
curl -sS -I --max-time 10 https://chat.metahint.ai/ | head -5

echo ""
echo "===== DONE ====="
