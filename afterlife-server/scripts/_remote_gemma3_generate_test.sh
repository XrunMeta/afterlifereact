#!/usr/bin/env bash
# _remote_gemma3_generate_test.sh — 018 회차: /oth-path 검증 + GPU 적재 확인
set +e

echo "===== 1) GPU 0 사전 상태 ====="
nvidia-smi --query-gpu=memory.used,memory.free --format=csv

echo ""
echo "===== 2) /oth-path (한국어 짧은 prompt, stream=false) ====="
START=$(date +%s)
curl -sS --max-time 120 http://127.0.0.1:11435/api/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemma3:27b",
    "prompt": "안녕? 너는 누구야? 한 문장으로 짧게 대답해.",
    "stream": false,
    "options": {"temperature": 0.7, "num_predict": 64}
  }'
END=$(date +%s)
echo ""
echo "[총 소요: $((END-START))초]"

echo ""
echo "===== 3) GPU 0 적재 후 상태 ====="
nvidia-smi --query-gpu=memory.used,memory.free,utilization.gpu --format=csv

echo ""
echo "===== 4) ollama-afterlife 프로세스 ====="
pgrep -af "ollama runner" | head -5

echo ""
echo "===== 5) /oth-path (현재 적재된 모델) ====="
curl -sS --max-time 5 http://127.0.0.1:11435/api/ps

echo ""
echo "===== 6) 두번째 호출 (warm — 빠르게 응답해야) ====="
START2=$(date +%s)
curl -sS --max-time 60 http://127.0.0.1:11435/api/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemma3:27b",
    "prompt": "1+1은?",
    "stream": false,
    "options": {"num_predict": 16}
  }' | head -c 500
END2=$(date +%s)
echo ""
echo "[warm 호출 소요: $((END2-START2))초]"

echo ""
echo "===== 7) metahint :11434 회귀 ====="
curl -sS --max-time 5 http://127.0.0.1:11434/api/tags | head -c 200
echo ""

echo ""
echo "===== DONE ====="
