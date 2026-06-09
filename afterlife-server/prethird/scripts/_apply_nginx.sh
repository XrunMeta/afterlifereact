#!/bin/bash
# prethird nginx location 반영 (가비아). /tmp/prethird.nginx 가 미리 scp 되어 있어야 함.
# 실행: ssh afterlife-gabia "bash /home/afterlife/afterlife-server/prethird/scripts/_apply_nginx.sh"
#   (sudo nginx -t / reload 포함 — 히즈키가 ! 로 실행)
# nginx -t 실패 시 백업 자동 롤백.
set -e
F=/etc/nginx/sites-available/memorial.example.invalid
BAK="${F}.bak-prethird-20260608"
SRC=/tmp/prethird.nginx

[ -f "$SRC" ] || { echo "ERROR: $SRC 없음 — 로컬에서 scp 먼저"; exit 1; }

sudo cp "$F" "$BAK"
echo "백업: $BAK"
sudo cp "$SRC" "$F"
echo "반영: $F"

echo "=== diff (prethird block만 추가됐는지) ==="
diff "$BAK" "$F" || true

echo "=== nginx -t ==="
if ! sudo nginx -t; then
  echo "!! nginx -t 실패 → 백업 롤백"
  sudo cp "$BAK" "$F"
  exit 1
fi

sudo systemctl reload nginx
echo "=== reload OK. prethird/healthz via nginx ==="
curl -fsS --max-time 5 https://memorial.example.invalid/prethird/healthz && echo "" || \
  echo "(CF 경유 실패 — origin 직접: $(curl -fsS --max-time 5 http://127.0.0.1:8600/healthz))"
