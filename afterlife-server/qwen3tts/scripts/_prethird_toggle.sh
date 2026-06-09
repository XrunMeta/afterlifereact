#!/usr/bin/env bash
# prethird TTS 엔진 토글: qwen3(8201) ↔ OpenVoice(8200 기본).
#   on  → PRETHIRD_TTS_URL=8201 drop-in 추가 (qwen3)
#   off → drop-in 제거 (OpenVoice 8200 복귀)
# 둘 다 daemon-reload + prethird 재기동. sudo 필요.
set -euo pipefail
MODE="${1:-on}"
CONF=/etc/systemd/system/afterlife-prethird.service.d/qwen3tts.conf

if [ "$MODE" = "on" ]; then
  sudo mkdir -p "$(dirname "$CONF")"
  sudo tee "$CONF" >/dev/null <<'C'
[Service]
Environment=PRETHIRD_TTS_URL=http://127.0.0.1:8201
C
  echo "prethird TTS → qwen3tts(8201) ON"
elif [ "$MODE" = "off" ]; then
  sudo rm -f "$CONF"
  echo "prethird TTS → OpenVoice(8200) 복귀"
else
  echo "usage: $0 [on|off]"; exit 1
fi

sudo systemctl daemon-reload
sudo systemctl restart afterlife-prethird
echo "재기동 후 healthz 대기..."
for i in $(seq 1 20); do
  R=$(curl -fsS http://127.0.0.1:8600/healthz 2>/dev/null || true)
  if echo "$R" | grep -q '"ok": *true'; then echo "READY: $R"; break; fi
  sleep 3
done
