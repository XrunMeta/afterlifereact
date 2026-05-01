#!/usr/bin/env bash
# _remote_chat_smoke.sh — 회차 020: /oth-path SSE 스트림 검증
# server.js 잠시 띄우고 curl 로 SSE 스트림 받아서 첫 chunk + done 확인
set +e

REMOTE_DIR="/home/afterlife/afterlife-server/testbed"

echo "===== 1) testbed server 백그라운드 기동 ====="
sudo -u afterlife -H bash -lc "
  cd $REMOTE_DIR
  : > /tmp/testbed-chat-smoke.log
  nohup node server.js >> /tmp/testbed-chat-smoke.log 2>&1 &
  echo \$! > /tmp/testbed-chat-smoke.pid
"
sleep 2
echo "pid: $(cat /tmp/testbed-chat-smoke.pid)"

echo ""
echo "===== 2) /healthz 확인 ====="
curl -sS -w "\n[http %{http_code}]\n" --max-time 5 http://127.0.0.1:8100/healthz

echo ""
echo "===== 3) /oth-path ====="
curl -sS --max-time 5 http://127.0.0.1:8100/api/version | head -c 400
echo ""

echo ""
echo "===== 4) /oth-path ====="
curl -sS --max-time 5 http://127.0.0.1:8100/api/persona | head -c 600
echo ""

echo ""
echo "===== 5) /oth-path SSE 스트림 (할매한테 인사) ====="
START=$(date +%s)
curl -sS -N --max-time 60 \
  -H 'Content-Type: application/json' \
  -d '{"message":"할매 나야 히즈키. 오늘 회사 일이 너무 힘들었어."}' \
  http://127.0.0.1:8100/api/chat | head -c 4000
END=$(date +%s)
echo ""
echo "[총 소요: $((END-START))초]"

echo ""
echo "===== 6) 두번째 호출 (다른 질문, history 없음) ====="
curl -sS -N --max-time 60 \
  -H 'Content-Type: application/json' \
  -d '{"message":"할매가 가장 좋아한 꽃이 뭐였더라?"}' \
  http://127.0.0.1:8100/api/chat | head -c 4000

echo ""
echo "===== 7) 서버 로그 마지막 30줄 ====="
tail -n 30 /tmp/testbed-chat-smoke.log

echo ""
echo "===== 8) 종료 ====="
kill "$(cat /tmp/testbed-chat-smoke.pid)" 2>/dev/null
sleep 1
rm -f /tmp/testbed-chat-smoke.log /tmp/testbed-chat-smoke.pid

echo ""
echo "===== DONE ====="
