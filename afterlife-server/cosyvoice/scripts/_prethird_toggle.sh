#!/usr/bin/env bash
# prethird TTS 백엔드를 CosyVoice2(:8203) ↔ qwen3(:8201) 로 토글. qwen3tts/_prethird_toggle.sh 미러.
# 사용: bash _prethird_toggle.sh on|off
#   on  = systemd drop-in 으로 PRETHIRD_TTS_URL=http://127.0.0.1:8203 주입 + prethird 재기동
#   off = drop-in 삭제(정식 unit 값 :8201 qwen3 복귀) + prethird 재기동
# 실행: ssh afterlife-gabia "sudo bash /home/afterlife/cosyvoice-poc/adapter/_prethird_toggle.sh on"
set -euo pipefail
PORT="${COSYVOICE_PORT:-8203}"
DROPIN_DIR=/etc/systemd/system/afterlife-prethird.service.d
DROPIN="$DROPIN_DIR/cosyvoice.conf"
ACTION="${1:-}"

case "$ACTION" in
  on)
    mkdir -p "$DROPIN_DIR"
    cat > "$DROPIN" <<EOF
[Service]
Environment=PRETHIRD_TTS_URL=http://127.0.0.1:$PORT
EOF
    echo "drop-in 작성: $DROPIN → PRETHIRD_TTS_URL=http://127.0.0.1:$PORT (CosyVoice2)"
    ;;
  off)
    rm -f "$DROPIN"
    echo "drop-in 삭제: $DROPIN (정식 unit :8201 qwen3 복귀)"
    ;;
  *)
    echo "usage: $0 on|off"; exit 2 ;;
esac

systemctl daemon-reload
systemctl restart afterlife-prethird
echo "prethird 재기동 완료. 현재 PRETHIRD_TTS_URL:"
systemctl show afterlife-prethird -p Environment | tr ' ' '\n' | grep PRETHIRD_TTS_URL || echo "  (unit 기본값 사용)"
