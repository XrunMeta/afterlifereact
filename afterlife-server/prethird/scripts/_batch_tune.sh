#!/usr/bin/env bash
# prethird musetalk unet batch_size 실험용 drop-in. sudo 필요.
#   on <N>  → MUSETALK_BATCH_SIZE=N drop-in 추가 (기본 32)
#   off     → drop-in 제거 (코드 기본 16 복귀)
# daemon-reload + prethird 재기동.
set -euo pipefail
MODE="${1:-on}"
N="${2:-32}"
CONF=/etc/systemd/system/afterlife-prethird.service.d/batch.conf

if [ "$MODE" = "on" ]; then
  sudo mkdir -p "$(dirname "$CONF")"
  sudo tee "$CONF" >/dev/null <<C
[Service]
Environment=MUSETALK_BATCH_SIZE=$N
C
  echo "MUSETALK_BATCH_SIZE=$N ON"
elif [ "$MODE" = "off" ]; then
  sudo rm -f "$CONF"
  echo "batch_size 코드 기본(16) 복귀"
else
  echo "usage: $0 [on N|off]"; exit 1
fi

sudo systemctl daemon-reload
sudo systemctl restart afterlife-prethird
echo "재기동 후 healthz 대기..."
for i in $(seq 1 20); do
  R=$(curl -fsS http://127.0.0.1:8600/healthz 2>/dev/null || true)
  if echo "$R" | grep -q '"ok": *true'; then echo "READY: $R"; break; fi
  sleep 3
done
