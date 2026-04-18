#!/bin/bash
# M-3 로컬 플로우 검증: Credits + Memory read
# 각 단계 실패 시 즉시 종료.
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
EMAIL_A="alice_m3_${ts}@test.io"
EMAIL_B="bob_m3_${ts}@test.io"

echo "=== signup A (alice, clone owner) ==="
A=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_A\",\"password\":\"Correct-Horse-9!\",\"name\":\"Alice\"}")
echo "$A" | head -c 200; echo
AT=$(echo "$A" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))')
if [[ -z "$AT" ]]; then echo "signup A failed"; exit 1; fi

echo "=== signup B (bob, viewer) ==="
B=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_B\",\"password\":\"Correct-Horse-9!\",\"name\":\"Bob\"}")
BT=$(echo "$B" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))')

echo "=== GET /oth-path (신규 0 크레딧) ==="
C1=$(curl -s -o /tmp/c1.json -w "%{http_code}" $API/credits/me -H "Authorization: Bearer $AT")
check "credits.me 200" "200" "$C1"
CRED0=$(node -e 'console.log(require("/tmp/c1.json").credits)')
check "credits.me initial=0" "0" "$CRED0"

echo "=== POST /oth-path starter ==="
IDK=$(node -e 'console.log("idk-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
CH=$(curl -s -o /tmp/ch.json -w "%{http_code}" -X POST $API/credits/charge \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDK" \
  -d '{"package_id":"starter"}')
check "charge 200" "200" "$CH"
CRED1=$(node -e 'console.log(require("/tmp/ch.json").credits)')
check "charge starter +10" "10" "$CRED1"

echo "=== POST /oth-path (same idempotency key → 중복 방지) ==="
CH2=$(curl -s -o /tmp/ch2.json -w "%{http_code}" -X POST $API/credits/charge \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDK" \
  -d '{"package_id":"starter"}')
check "charge idempotent 200" "200" "$CH2"
CRED2=$(curl -s $API/credits/me -H "Authorization: Bearer $AT" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).credits))')
check "credits.me no-double-credit" "10" "$CRED2"

echo "=== POST /oth-path plus (새 키) ==="
IDK2=$(node -e 'console.log("idk-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
CH3=$(curl -s -o /tmp/ch3.json -w "%{http_code}" -X POST $API/credits/charge \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDK2" \
  -d '{"package_id":"plus"}')
check "charge plus 200" "200" "$CH3"
CRED3=$(node -e 'console.log(require("/tmp/ch3.json").credits)')
check "charge plus 10+105=115" "115" "$CRED3"

echo "=== POST /oth-path xrun_wallet → UPSTREAM_FAILURE 502 ==="
IDK3=$(node -e 'console.log("idk-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
CH4=$(curl -s -o /tmp/ch4.json -w "%{http_code}" -X POST $API/credits/charge \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDK3" \
  -d '{"package_id":"starter","payment_provider":"xrun_wallet"}')
check "charge xrun_wallet 502" "502" "$CH4"

echo "=== POST /oth-path bad package_id → 400 ==="
IDK4=$(node -e 'console.log("idk-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
CH5=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/credits/charge \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDK4" \
  -d '{"package_id":"whale"}')
check "charge bad package 400" "400" "$CH5"

echo "=== GET /oth-path ==="
LG=$(curl -s $API/credits/ledgers -H "Authorization: Bearer $AT")
LG_COUNT=$(echo "$LG" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).items.length))')
# 적립 2건(starter + plus) 예상
check "ledgers count=2" "2" "$LG_COUNT"

echo "=== GET /oth-path?type=charge_inapp ==="
LG2_COUNT=$(curl -s "$API/credits/ledgers?type=charge_inapp" -H "Authorization: Bearer $AT" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).items.length))')
check "ledgers type filter" "2" "$LG2_COUNT"

echo "=== GET /oth-path?limit=1 cursor ==="
LG3=$(curl -s "$API/credits/ledgers?limit=1" -H "Authorization: Bearer $AT")
NEXT=$(echo "$LG3" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).nextAfterId||""))')
LG3_N=$(echo "$LG3" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).items.length))')
check "ledgers page1 len=1" "1" "$LG3_N"
if [[ -z "$NEXT" ]]; then echo "❌ nextAfterId empty"; FAIL=$((FAIL+1)); else echo "✅ nextAfterId=$NEXT"; PASS=$((PASS+1)); fi
LG4_N=$(curl -s "$API/credits/ledgers?limit=10&after_id=$NEXT" -H "Authorization: Bearer $AT" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).items.length))')
check "ledgers page2 len=1" "1" "$LG4_N"

echo "=== GET /oth-path requires auth ==="
NA=$(curl -s -o /dev/null -w "%{http_code}" $API/credits/me)
check "credits.me unauth 401" "401" "$NA"

echo ""
echo "=== 클론 생성 (public) ==="
IDK_C=$(node -e 'console.log("ic-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
UNAME="alice_memlow_${ts: -8}"
CL=$(curl -s -X POST $API/clones \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDK_C" \
  -d "{\"clone_type\":\"memlow\",\"name\":\"Alice Memlow\",\"username\":\"$UNAME\",\"visibility\":\"public\",\"memlow_profile\":{\"nickname\":\"alli\"}}")
CID=$(echo "$CL" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).clone.id))')
echo "clone_id=$CID"
if [[ -z "$CID" ]]; then echo "clone create failed:$CL"; exit 1; fi

echo "=== GET /oth-path (owner) ==="
ML1=$(curl -s -o /tmp/ml1.json -w "%{http_code}" $API/clones/$CID/memory/l1 -H "Authorization: Bearer $AT")
check "memory.l1 owner 200" "200" "$ML1"
ROLE1=$(node -e 'console.log(require("/tmp/ml1.json").viewerRole)')
check "memory.l1 owner viewerRole=owner" "owner" "$ROLE1"
NICK=$(node -e 'console.log(require("/tmp/ml1.json").persona.nickname||"")')
check "memory.l1 persona.nickname=alli" "alli" "$NICK"

echo "=== GET /oth-path (비로그인, public) ==="
ML1G=$(curl -s -o /tmp/ml1g.json -w "%{http_code}" $API/clones/$CID/memory/l1)
check "memory.l1 guest 200" "200" "$ML1G"
ROLE_G=$(node -e 'console.log(require("/tmp/ml1g.json").viewerRole)')
check "memory.l1 guest viewerRole=guest" "guest" "$ROLE_G"

echo "=== GET /oth-path ==="
MSH=$(curl -s -o /tmp/msh.json -w "%{http_code}" $API/clones/$CID/memory/shared -H "Authorization: Bearer $AT")
check "memory.shared owner 200" "200" "$MSH"
EV_LEN=$(node -e 'console.log(require("/tmp/msh.json").events.length)')
check "memory.shared events=[]" "0" "$EV_LEN"

echo "=== GET /oth-path (owner, 초기 empty) ==="
ML2=$(curl -s -o /tmp/ml2.json -w "%{http_code}" $API/clones/$CID/memory/l2 -H "Authorization: Bearer $AT")
check "memory.l2 owner 200" "200" "$ML2"
INIT=$(node -e 'console.log(require("/tmp/ml2.json")._meta.initialized)')
check "memory.l2 init=false" "false" "$INIT"

echo "=== GET /oth-path (비로그인 → 401) ==="
ML2U=$(curl -s -o /dev/null -w "%{http_code}" $API/clones/$CID/memory/l2)
check "memory.l2 unauth 401" "401" "$ML2U"

echo "=== PATCH /oth-path visibility=private → bob L1 FORBIDDEN ==="
curl -s -X PATCH $API/clones/$CID -H "Authorization: Bearer $AT" \
  -H "Content-Type: application/json" -d '{"visibility":"private"}' > /dev/null
ML1B=$(curl -s -o /dev/null -w "%{http_code}" $API/clones/$CID/memory/l1 -H "Authorization: Bearer $BT")
check "memory.l1 bob private 403" "403" "$ML1B"
ML2B=$(curl -s -o /dev/null -w "%{http_code}" $API/clones/$CID/memory/l2 -H "Authorization: Bearer $BT")
check "memory.l2 bob other-user 403" "403" "$ML2B"

echo "=== GET /oth-path (not found) ==="
NF=$(curl -s -o /dev/null -w "%{http_code}" $API/clones/999999/memory/l1 -H "Authorization: Bearer $AT")
check "memory.l1 not found 404" "404" "$NF"

echo "=== 타입 에러: clone id 비정수 ==="
BAD=$(curl -s -o /dev/null -w "%{http_code}" $API/clones/abc/memory/l1 -H "Authorization: Bearer $AT")
check "memory.l1 bad id 400" "400" "$BAD"

echo ""
echo "====================================="
echo "PASS=$PASS FAIL=$FAIL"
echo "====================================="
exit $FAIL
