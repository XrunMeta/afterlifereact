#!/usr/bin/env bash
# 음색 카탈로그 9종 R2 업로드 + D1 시드. 사전: convert.sh 실행, wrangler 로그인.
# ⚠️ 이 스크립트는 R2(preview 버킷)에 실제 쓰기가 발생한다. 사용자 승인 후 수동 실행.
set -euo pipefail
cd "$(dirname "$0")/../.."   # afterlifeapi/
BUCKET="afterlife-archive-dev"
OUT="seeds/voice_catalog/out"
# slug → files.id (seed.sql 과 일치 유지)
declare -A FID=( [yeongji]=9500 [miju]=9501 [yeonhwa]=9502 [sangjun]=9503 \
                 [cheolsu]=9504 [hocheol]=9505 [wonmi]=9506 [cheongi]=9507 [geumi]=9508 )

echo "[1/3] R2 put — $BUCKET/voice/sample/..."
for mp3 in "$OUT"/*.mp3; do
  key="voice/sample/$(basename "$mp3")"
  echo "  put $key"
  wrangler r2 object put "$BUCKET/$key" --file="$mp3" --content-type=audio/mpeg --remote
done

echo "[2/3] D1 시드 — afterlife-db-preview..."
wrangler d1 execute afterlife-db-preview --remote --file=seeds/voice_catalog/seed.sql

echo "[3/3] size_bytes 실측 보정(sei I-1)..."
for mp3 in "$OUT"/*.mp3; do
  slug="$(basename "$mp3" .mp3)"
  bytes=$(stat -f%z "$mp3")   # macOS. Linux: stat -c%s
  wrangler d1 execute afterlife-db-preview --remote --command \
    "UPDATE files SET size_bytes=$bytes WHERE id=${FID[$slug]};"
done
echo "완료. GET /oth-path 로 9종 확인."
