#!/bin/bash
# Critical 테마 (바) Slice 2 회귀: v2→v3 Lazy Migrate on Read.
# 전제: wrangler dev 127.0.0.1:8787, ADMIN_BOOTSTRAP_TOKEN, MASTER_ROOT, ALE_KEK 세팅됨.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
API=http://127.0.0.1:8787/api
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

d1_query() {
  (cd "$REPO_ROOT/afterlifeapi" && npx wrangler d1 execute DB --local --command "$1" --json 2>/dev/null)
}

# seconds + RANDOM → 14~15자리 정수. JS Number.MAX_SAFE_INTEGER(2^53-1 ≈ 9e15) 안쪽.
# nanosecond ts는 JSON 정수 정밀도 손실 → openAny UPDATE WHERE id=? 불일치 버그.
ts="$(date +%s)$RANDOM"
UID_TEST=$ts
UID_TEST_2=$((ts + 1))

echo "=== 0) 사전 정리: test user row 생성 ==="
d1_query "DELETE FROM users WHERE id IN ($UID_TEST, $UID_TEST_2)" > /dev/null
d1_query "INSERT INTO users (id, email, password_hash, name, credits, funnel_stage, created_at) VALUES ($UID_TEST, 'migrate_${ts}@test.io', 'dummy-hash', 'Migrate Test', 0, 'explorer', datetime('now'))" > /dev/null

echo "=== 1) /_dev/seal-v2로 v2 블롭 생성 ==="
V2_RESP=$(curl -s -X POST $API/admin/_dev/seal-v2 -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"hkdfContext\":\"user.phone\",\"plaintext\":\"+82-10-1234-5678\"}")
V2_BLOB=$(echo "$V2_RESP" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).blob||""))')
[[ -z "$V2_BLOB" ]] && { echo "seal-v2 failed: $V2_RESP"; exit 1; }
if [[ "$V2_BLOB" == v2.* ]]; then PASS=$((PASS+1)); echo "✅ seal-v2.prefix (v2.)"; else FAIL=$((FAIL+1)); echo "❌ seal-v2.prefix actual=${V2_BLOB:0:10}..."; fi

V2_BLOB_ESC=$(printf '%s' "$V2_BLOB" | sed "s/'/''/g")
d1_query "UPDATE users SET phone='$V2_BLOB_ESC' WHERE id=$UID_TEST" > /dev/null

echo "=== S1) openAny로 v2 blob 복호화 → plain 정확 ==="
R=$(curl -s -X POST $API/admin/_dev/open-any -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"blob\":\"$V2_BLOB\",\"hkdfContext\":\"user.phone\",\"lazyMigrateOverride\":false}")
PLAIN=$(echo "$R" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).plain||""))')
check "S1.plain" "+82-10-1234-5678" "$PLAIN"

echo "=== S2) 플래그 OFF → DB column 변화 없음 ==="
COL_AFTER_S2=$(d1_query "SELECT substr(phone,1,3) AS p FROM users WHERE id=$UID_TEST" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0]?.p||"")})')
check "S2.db_prefix=v2." "v2." "$COL_AFTER_S2"

echo "=== S3) 플래그 ON + hint → DB v3으로 재암호화, dek_registry 새 row ==="
DEK_COUNT_BEFORE=$(d1_query "SELECT COUNT(*) AS c FROM dek_registry WHERE resource_type='user.phone' AND resource_id='$UID_TEST'" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0].c)})')

R=$(curl -s -X POST $API/admin/_dev/open-any -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"blob\":\"$V2_BLOB\",\"hkdfContext\":\"user.phone\",\"lazyMigrateOverride\":true,\"hint\":{\"key\":\"users.phone\",\"resourceId\":$UID_TEST}}")
PLAIN2=$(echo "$R" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).plain||""))')
check "S3.plain" "+82-10-1234-5678" "$PLAIN2"

COL_AFTER_S3=$(d1_query "SELECT substr(phone,1,3) AS p FROM users WHERE id=$UID_TEST" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0]?.p||"")})')
check "S3.db_prefix=v3." "v3." "$COL_AFTER_S3"

DEK_COUNT_AFTER=$(d1_query "SELECT COUNT(*) AS c FROM dek_registry WHERE resource_type='user.phone' AND resource_id='$UID_TEST'" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0].c)})')
check "S3.dek_registry.delta=1" "1" "$((DEK_COUNT_AFTER - DEK_COUNT_BEFORE))"

echo "=== S4) 플래그 ON + hint 없음 → plain 반환, DB 변동 없음 ==="
d1_query "INSERT INTO users (id, email, password_hash, name, credits, funnel_stage, created_at) VALUES ($UID_TEST_2, 'migrate2_${ts}@test.io', 'dummy-hash', 'Migrate2', 0, 'explorer', datetime('now'))" > /dev/null
V2_RESP2=$(curl -s -X POST $API/admin/_dev/seal-v2 -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"hkdfContext\":\"user.phone\",\"plaintext\":\"+82-10-9999-8888\"}")
V2_BLOB2=$(echo "$V2_RESP2" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).blob||""))')
V2_BLOB2_ESC=$(printf '%s' "$V2_BLOB2" | sed "s/'/''/g")
d1_query "UPDATE users SET phone='$V2_BLOB2_ESC' WHERE id=$UID_TEST_2" > /dev/null

R=$(curl -s -X POST $API/admin/_dev/open-any -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"blob\":\"$V2_BLOB2\",\"hkdfContext\":\"user.phone\",\"lazyMigrateOverride\":true}")
PLAIN3=$(echo "$R" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).plain||""))')
check "S4.plain" "+82-10-9999-8888" "$PLAIN3"
COL_AFTER_S4=$(d1_query "SELECT substr(phone,1,3) AS p FROM users WHERE id=$UID_TEST_2" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0]?.p||"")})')
check "S4.db_prefix=v2." "v2." "$COL_AFTER_S4"

echo "=== S5) decryption_audit_log에 v2_migrate 항목 기록 확인 ==="
AUDIT_HIT=$(d1_query "SELECT COUNT(*) AS c FROM decryption_audit_log WHERE op='v2_migrate' AND resource_type='user.phone' AND resource_id='$UID_TEST'" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d)[0].results[0].c)})')
if [[ "$AUDIT_HIT" -ge 1 ]]; then PASS=$((PASS+1)); echo "✅ S5.audit_log.entries>=1 ($AUDIT_HIT)"; else FAIL=$((FAIL+1)); echo "❌ S5.audit_log.entries>=1 actual=$AUDIT_HIT"; fi

echo ""
echo "=== 정리: 테스트 user 삭제 ==="
d1_query "DELETE FROM users WHERE id IN ($UID_TEST, $UID_TEST_2)" > /dev/null

echo "=============================="
echo "PASS=$PASS FAIL=$FAIL"
[[ $FAIL -eq 0 ]] || exit 1
