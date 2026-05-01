#!/usr/bin/env bash
# _remote_ui_smoke.sh — 회차 021: 정적 UI + chat SSE 통합 검증
set +e

REMOTE_DIR="/home/afterlife/afterlife-server/testbed"

echo "===== 1) 8100 정리 + 서버 기동 ====="
ss -ltnp 2>/dev/null | awk -F'pid=' '/8100/{split($2,a,","); print a[1]}' | xargs -r kill 2>/dev/null
sleep 1
sudo -u afterlife -H bash -lc "
  cd $REMOTE_DIR
  : > /tmp/testbed-ui-smoke.log
  nohup node server.js >> /tmp/testbed-ui-smoke.log 2>&1 &
  echo \$! > /tmp/testbed-ui-smoke.pid
"
sleep 2
echo "pid: $(cat /tmp/testbed-ui-smoke.pid)"

echo ""
echo "===== 2) GET / (index.html) ====="
curl -sS -w "\n[http %{http_code}, type %{content_type}]\n" --max-time 5 http://127.0.0.1:8100/ | head -c 600
echo ""

echo ""
echo "===== 3) GET /oth-path ====="
curl -sS -w "[http %{http_code}, len %{size_download}]\n" -o /dev/null --max-time 5 http://127.0.0.1:8100/chat.css

echo "===== 4) GET /oth-path ====="
curl -sS -w "[http %{http_code}, len %{size_download}]\n" -o /dev/null --max-time 5 http://127.0.0.1:8100/chat.js

echo ""
echo "===== 5) GET /oth-path ====="
curl -sS --max-time 5 http://127.0.0.1:8100/api/persona | head -c 200
echo ""

echo ""
echo "===== 6) POST /oth-path 스트림 (SSE 첫 chunk + done) ====="
curl -sS -N --max-time 30 \
  -H 'Content-Type: application/json' \
  -d '{"message":"할매 잘 지냈어?","history":[]}' \
  http://127.0.0.1:8100/api/chat | head -c 2000
echo ""

echo ""
echo "===== 7) POST /oth-path with history (할매가 좋아한 꽃) ====="
curl -sS -N --max-time 30 \
  -H 'Content-Type: application/json' \
  -d '{"message":"할매가 가장 좋아한 꽃이 뭐였어?","history":[{"role":"user","content":"할매 안녕"},{"role":"assistant","content":"아구 우리 강아지, 잘 지냈나"}]}' \
  http://127.0.0.1:8100/api/chat | head -c 2500
echo ""

echo ""
echo "===== 8) 서버 로그 마지막 15줄 ====="
tail -n 15 /tmp/testbed-ui-smoke.log

echo ""
echo "===== 9) 종료 ====="
kill "$(cat /tmp/testbed-ui-smoke.pid)" 2>/dev/null
sleep 1
rm -f /tmp/testbed-ui-smoke.log /tmp/testbed-ui-smoke.pid

echo ""
echo "===== DONE ====="
