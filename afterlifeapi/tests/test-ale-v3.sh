#!/bin/bash
# Critical 테마 (바) Slice 1 회귀: ALE v3 + KEK 멀티버전 + Lazy Rotation.
# 전제: wrangler dev 127.0.0.1:8787, ADMIN_BOOTSTRAP_TOKEN, MASTER_ROOT 세팅됨.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
API=http:
BT=${ADMIN_BOOTSTRAP_TOKEN:-dev-bootstrap-token-change-me}
PASS=0
FAIL=0
check() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    echo "✅ $name ($actual)"
    PASS=$((PASS+1))
  else
    echo "❌ $name expected=$expected actual=$actual"
    FAIL=$((FAIL+1))
  fi
}

totp_code() {
  local secret="$1"
  node -e '
    const c = require("crypto");
    const ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const s = process.argv[1].replace(/=+$/g,"").toUpperCase().replace(/\s+/g,"");
    const out = [];
    let buf = 0, bits = 0;
    for (const ch of s) {
      const v = ALPH.indexOf(ch);
      if (v < 0) continue;
      buf = (buf<<5) | v;
      bits += 5;
      if (bits >= 8) { bits -= 8; out.push((buf>>bits) & 0xff); }
    }
    const key = Buffer.from(out);
    const counter = Math.floor(Date.now()/1000/30);
    const cb = Buffer.alloc(8);
    cb.writeBigUInt64BE(BigInt(counter));
    const h = c.createHmac("sha1", key).update(cb).digest();
    const offset = h[h.length-1] & 0x0f;
    const code = ((h[offset] & 0x7f)<<24) | (h[offset+1]<<16) | (h[offset+2]<<8) | h[offset+3];
    console.log(String(code % 1000000).padStart(6,"0"));
  ' "$secret"
}

bootstrap_login() {
  local tag="$1" email="$2"
  curl -s -X POST $API/admin/auth/bootstrap -H 'Content-Type: application/json' \
    -d "{\"token\":\"$BT\",\"email\":\"$email\",\"password\":\"AdminPass-1234!\",\"role\":\"super_admin\"}" > /dev/null
  local L P S C V
  L=$(curl -s -X POST $API/admin/auth/login -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"AdminPass-1234!\"}")
  P=$(echo "$L" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).pendingToken||""))')
  curl -s -o /tmp/alev3_enroll_$tag.json -X POST $API/admin/auth/totp/enroll -H "Authorization: Bearer $P" > /dev/null
  S=$(node -e "console.log(require('/tmp/alev3_enroll_$tag.json').secret||'')")
  C=$(totp_code "$S")
  V=$(curl -s -X POST $API/admin/auth/totp/verify -H "Authorization: Bearer $P" -H 'Content-Type: application/json' \
    -d "{\"code\":\"$C\"}")
  echo "$V" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))'
}

d1_query() {
  (cd "$REPO_ROOT/afterlifeapi" && npx wrangler d1 execute DB --local --command "$1" --json 2>/dev/null)
}

ts=$(date +%s%N)
E1="alev3_admin1_${ts}@test.io"
E2="alev3_admin2_${ts}@test.io"

echo "=== 0) 사전 정리: encryption_keys / dek_registry 비우기 (로컬 dev 한정) ==="
d1_query "DELETE FROM dek_registry" > /dev/null
d1_query "DELETE FROM encryption_keys" > /dev/null

echo "=== 1) super_admin 2명 부트스트랩 + TOTP 로그인 ==="
T1=$(bootstrap_login "1" "$E1")
T2=$(bootstrap_login "2" "$E2")
[[ -z "$T1" || -z "$T2" ]] && { echo "token missing"; exit 1; }

echo "=== 2) kek_rotate 쿼럼 요청 생성 (부트스트랩 첫 KEK) ==="
R=$(curl -s -o /tmp/alev3_c1.json -w "%{http_code}" -X POST $API/admin/quorum/requests \
  -H "Authorization: Bearer $T1" -H 'Content-Type: application/json' \
  -d '{"actionType":"kek_rotate","payload":{},"reason":"initial KEK bootstrap for ALE v3","requiredApprovals":1}')
check "kek_rotate.create 201" "201" "$R"
RID=$(node -e 'console.log(require("/tmp/alev3_c1.json").request.id)')

echo "=== 3) s2 승인 + s1 실행 → 첫 KEK 등록 ==="
curl -s -X POST $API/admin/quorum/requests/$RID/decisions \
  -H "Authorization: Bearer $T2" -H 'Content-Type: application/json' \
  -d '{"decision":"approve","comment":"bootstrap"}' > /dev/null
R=$(curl -s -o /tmp/alev3_e1.json -w "%{http_code}" -X POST $API/admin/quorum/requests/$RID/execute \
  -H "Authorization: Bearer $T1")
check "kek_rotate.execute 200" "200" "$R"
KID1=$(node -e 'const d=require("/tmp/alev3_e1.json"); console.log(d.result?.kekId||"")')
check "kek_rotate.kekId=kek_v1" "kek_v1" "$KID1"

echo "=== 4) encryption_keys 테이블에 active 1건 확인 ==="
ACTIVE=$(d1_query "SELECT kek_id FROM encryption_keys WHERE status='active'" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0]?.kek_id||"")})')
check "encryption_keys.active=kek_v1" "kek_v1" "$ACTIVE"

echo "=== 5) v3 fixture seal (kek_v1 래핑) ==="
FIX=$(curl -s -X POST $API/admin/_dev/seal-v3 -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"resourceType\":\"message.content\",\"resourceId\":\"fixture-1\",\"plaintext\":\"slice1 lazy rotation test\"}")
FIXTURE_DEK_ID=$(echo "$FIX" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).dekId||""))')
FIXTURE_BLOB=$(echo "$FIX" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).blob||""))')
[[ -z "$FIXTURE_DEK_ID" || -z "$FIXTURE_BLOB" ]] && { echo "fixture seal failed: $FIX"; exit 1; }

echo "=== 6) 두 번째 kek_rotate (회전) ==="
R=$(curl -s -o /tmp/alev3_c2.json -w "%{http_code}" -X POST $API/admin/quorum/requests \
  -H "Authorization: Bearer $T1" -H 'Content-Type: application/json' \
  -d '{"actionType":"kek_rotate","payload":{},"reason":"90d rotation cycle","requiredApprovals":1}')
check "kek_rotate2.create 201" "201" "$R"
RID2=$(node -e 'console.log(require("/tmp/alev3_c2.json").request.id)')
curl -s -X POST $API/admin/quorum/requests/$RID2/decisions \
  -H "Authorization: Bearer $T2" -H 'Content-Type: application/json' \
  -d '{"decision":"approve"}' > /dev/null
R=$(curl -s -o /tmp/alev3_e2.json -w "%{http_code}" -X POST $API/admin/quorum/requests/$RID2/execute \
  -H "Authorization: Bearer $T1")
check "kek_rotate2.execute 200" "200" "$R"
KID2=$(node -e 'console.log(require("/tmp/alev3_e2.json").result?.kekId||"")')
check "kek_rotate2.kekId=kek_v2" "kek_v2" "$KID2"

echo "=== 7) active_count=1, retired_count=1 검증 ==="
COUNT_ACTIVE=$(d1_query "SELECT COUNT(*) AS c FROM encryption_keys WHERE status='active'" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0].c)})')
COUNT_RETIRED=$(d1_query "SELECT COUNT(*) AS c FROM encryption_keys WHERE status='retired'" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0].c)})')
check "encryption_keys.active_count=1" "1" "$COUNT_ACTIVE"
check "encryption_keys.retired_count=1" "1" "$COUNT_RETIRED"

echo "=== 8) Lazy Rotation OFF: openV3 → dek_registry.kek_id 변경 없음 ==="
curl -s -X POST $API/admin/_dev/open-v3 -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"blob\":\"$FIXTURE_BLOB\",\"lazyRotationOverride\":false}" > /tmp/alev3_open_off.json
PLAIN_OFF=$(node -e 'console.log(require("/tmp/alev3_open_off.json").plain||"")')
check "lazy_off.plain" "slice1 lazy rotation test" "$PLAIN_OFF"
KEK_AFTER_OFF=$(d1_query "SELECT kek_id FROM dek_registry WHERE dek_id='$FIXTURE_DEK_ID'" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0]?.kek_id||"")})')
check "lazy_off.kek_id=kek_v1" "kek_v1" "$KEK_AFTER_OFF"

echo "=== 9) Lazy Rotation ON: openV3 → kek_v2 재래핑 + rotated_at=SET ==="
curl -s -X POST $API/admin/_dev/open-v3 -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"blob\":\"$FIXTURE_BLOB\",\"lazyRotationOverride\":true}" > /tmp/alev3_open_on.json
PLAIN_ON=$(node -e 'console.log(require("/tmp/alev3_open_on.json").plain||"")')
check "lazy_on.plain" "slice1 lazy rotation test" "$PLAIN_ON"
KEK_AFTER_ON=$(d1_query "SELECT kek_id FROM dek_registry WHERE dek_id='$FIXTURE_DEK_ID'" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0]?.kek_id||"")})')
ROTATED_AT=$(d1_query "SELECT rotated_at FROM dek_registry WHERE dek_id='$FIXTURE_DEK_ID'" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0]?.rotated_at?"SET":"NULL")})')
check "lazy_on.kek_id=kek_v2" "kek_v2" "$KEK_AFTER_ON"
check "lazy_on.rotated_at=SET" "SET" "$ROTATED_AT"

echo ""
echo "=============================="
echo "PASS=$PASS FAIL=$FAIL"
[[ $FAIL -eq 0 ]] || exit 1
