#!/usr/bin/env bash
# _remote_ollama_afterlife_recheck.sh — 016 후속 검증 (warmup 이후 재확인)
set +e

echo "===== 1) journal 마지막 40줄 ====="
journalctl -u ollama-afterlife.service --no-pager -n 40

echo ""
echo "===== 2) ps tree ====="
ps -ef | grep -E "ollama" | grep -v grep

echo ""
echo "===== 3) :11435 listen ====="
ss -ltnp | grep 11435

echo ""
echo "===== 4) /oth-path (10초 timeout) ====="
curl -sS --max-time 10 -w "\n[http %{http_code}, time %{time_total}s]\n" http://127.0.0.1:11435/api/tags

echo ""
echo "===== 5) /oth-path ====="
curl -sS --max-time 10 -w "\n[http %{http_code}]\n" http://127.0.0.1:11435/api/version

echo ""
echo "===== 6) GPU 0 메모리 / ollama-afterlife 점유 ====="
nvidia-smi --query-gpu=memory.used,memory.free --format=csv

echo ""
echo "===== 7) 격리 회귀 — 기존 :11434 정상 ====="
curl -sS --max-time 5 -w "\n[http %{http_code}]\n" http://127.0.0.1:11434/api/tags | head -c 300

echo ""
echo "===== DONE ====="
