#!/usr/bin/env bash
# 데모 v2 이미지 10장을 R2 (afterlife-archive-dev) 에 업로드 + SQL 적용.
#
# 실행:
#   cd afterlifeapi
#   bash seeds/upload_v2.sh
#
# 사전: wrangler 로그인 + afterlife-db-preview / afterlife-archive-dev 접근권한.

set -e

cd "$(dirname "$0")/.."   # afterlifeapi/

BUCKET="afterlife-archive-dev"
PREFIX="uploadedfiles/seed/v2"

echo "[1/3] R2 업로드 — afterlife-archive-dev / $PREFIX/..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  echo "  putting persona$i.png → $PREFIX/p$i.png"
  wrangler r2 object put "$BUCKET/$PREFIX/p$i.png" \
    --file="seeds/images/persona$i.png" \
    --remote
done

echo "[2/3] D1 시드 SQL 적용 — afterlife-db-preview..."
wrangler d1 execute afterlife-db-preview --remote --file=seeds/demo_v2.sql

echo "[3/3] 완료."
echo ""
echo "유저:"
echo "  9001 민수   (minsoo@demo.afterlife)"
echo "  9004 지호   (jiho@demo.afterlife)"
echo "  9005 서준   (seojun@demo.afterlife)"
echo ""
echo "페르소나:"
echo "  9002 상혁  (owner=9001)"
echo "  9003 지훈  (owner=9001)"
echo "  9006 유나  (owner=9004)"
echo "  9007 도현  (owner=9004)"
echo "  9008 은우  (owner=9005)"
echo "  9009 하준  (owner=9005)"
echo "  9010 민재  (owner=9005)"
