#!/bin/bash
# Critical 17 회귀: 삭제 상태머신 + 비상연락처 + ALE v3 경로 smoke test.
# wrangler dev가 127.0.0.1:8787에서 떠 있어야 실행 가능.
set -e
API=http:
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
ts=$(date +%s%N)
EMAIL_A="alice_crit_${ts}@test.io"
EMAIL_B="bob_crit_${ts}@test.io"

echo "=== signup A/B ==="
A=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_A\",\"password\":\"Correct-Horse-9!\",\"name\":\"Alice\"}")
AT=$(echo "$A" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))')
B=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_B\",\"password\":\"Correct-Horse-9!\",\"name\":\"Bob\"}")
BT=$(echo "$B" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))')
[[ -z "$AT" || -z "$BT" ]] && { echo "signup failed"; exit 1; }

echo "=== soft delete → restore 라운드트립 ==="
D1=$(curl -s -o /tmp/d1.json -w "%{http_code}" -X POST $API/users/me/delete \
  -H "Authorization: Bearer $AT")
check "users.me/delete 200" "200" "$D1"

R1=$(curl -s -o /tmp/r1.json -w "%{http_code}" -X POST $API/users/me/restore \
  -H "Authorization: Bearer $AT")
check "users.me/restore 200" "200" "$R1"

echo "=== 두 번째 restore는 CONFLICT(이미 active) ==="
R2=$(curl -s -o /tmp/r2.json -w "%{http_code}" -X POST $API/users/me/restore \
  -H "Authorization: Bearer $AT")
check "users.me/restore 2nd conflict" "409" "$R2"

echo "=== 비상연락처 초대 ==="
INV=$(curl -s -o /tmp/inv.json -w "%{http_code}" -X POST $API/users/me/emergency-contacts \
  -H "Authorization: Bearer $AT" -H 'Content-Type: application/json' \
  -d "{\"contactEmail\":\"$EMAIL_B\",\"role\":\"primary_heir\",\"triggerCondition\":\"inactivity_N_days\",\"triggerParam\":\"180\",\"targetScope\":\"account\"}")
check "emergency.invite 201" "201" "$INV"
TOKEN=$(node -e 'console.log(require("/tmp/inv.json").inviteToken||"")')
[[ -z "$TOKEN" ]] && { echo "token missing"; exit 1; }

echo "=== 피지명자 Bob이 수락 ==="
ACC=$(curl -s -o /tmp/acc.json -w "%{http_code}" -X POST $API/inheritance-release/accept \
  -H "Authorization: Bearer $BT" -H 'Content-Type: application/json' \
  -d "{\"token\":\"$TOKEN\",\"decision\":\"accept\"}")
check "inheritance.accept 200" "200" "$ACC"

echo "=== 잘못된 토큰 거부 ==="
BAD=$(curl -s -o /tmp/bad.json -w "%{http_code}" -X POST $API/inheritance-release/accept \
  -H "Authorization: Bearer $BT" -H 'Content-Type: application/json' \
  -d "{\"token\":\"$(printf 'x%.0s' {1..64})\",\"decision\":\"accept\"}")
check "inheritance.accept invalid=404" "404" "$BAD"

echo "=== 비상연락처 철회 ==="
LIST=$(curl -s $API/users/me/emergency-contacts -H "Authorization: Bearer $AT")
CID=$(echo "$LIST" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const l=JSON.parse(d).contacts||[];console.log(l[0]?.id||"")})')
REV=$(curl -s -o /tmp/rev.json -w "%{http_code}" -X DELETE $API/users/me/emergency-contacts/$CID \
  -H "Authorization: Bearer $AT")
check "emergency.revoke 200" "200" "$REV"

echo ""
echo "=============================="
echo "PASS=$PASS FAIL=$FAIL"
[[ $FAIL -eq 0 ]] || exit 1
