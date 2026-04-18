#!/bin/bash
# M-6 통합 테스트 — HIBP / age_enc / SSE / tokens pricing / ledger message_send.
# 사전 조건: `npm run dev` (wrangler dev @ 127.0.0.1:8787) + 0001~0006 마이그레이션 적용.

set -e
API=http://127.0.0.1:8787/api
PASS=0
FAIL=0
check() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    echo "✅ $name ($actual)"; PASS=$((PASS+1))
  else
    echo "❌ $name expected=$expected actual=$actual"; FAIL=$((FAIL+1))
  fi
}
contains() {
  local name="$1" needle="$2" haystack="$3"
  if [[ "$haystack" == *"$needle"* ]]; then
    echo "✅ $name (contains)"; PASS=$((PASS+1))
  else
    echo "❌ $name missing=$needle"; FAIL=$((FAIL+1))
  fi
}
json() { node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write(String(eval("JSON.parse(d)."+process.argv[1])))}catch(e){process.stdout.write("")}})' "$1"; }
idk() { node -e 'console.log("idk-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))'; }
ts=$(date +%s%N)

EMAIL_A="alice_m6_${ts}@test.io"

echo "########## M-6.3: HIBP + age_enc ##########"

echo "=== signup with age=42 (dev HIBP skip 경로) ==="
A=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_A\",\"password\":\"Correct-Horse-9-Battery-Staple\",\"name\":\"Alice\",\"age\":42,\"phone\":\"010-1234-5678\"}")
AT=$(echo "$A" | json "accessToken")
[[ -z "$AT" ]] && { echo "signup failed: $A"; exit 1; }
echo "access token OK"

echo "=== GET /oth-path age/phone 복호화 왕복 ==="
ME=$(curl -s $API/users/me -H "Authorization: Bearer $AT")
AGE=$(echo "$ME" | json "user.age")
check "GET /oth-path age=42 (age_enc 복호화)" "42" "$AGE"
PHONE=$(echo "$ME" | json "user.phone")
check "GET /oth-path phone 복호화" "010-1234-5678" "$PHONE"

echo "=== PATCH /oth-path age=50 → 재암호화 ==="
PAT=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $API/users/me \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -d '{"age":50}')
check "PATCH age 200" "200" "$PAT"
ME2=$(curl -s $API/users/me -H "Authorization: Bearer $AT")
AGE2=$(echo "$ME2" | json "user.age")
check "GET /oth-path age=50 (재암호화 반영)" "50" "$AGE2"

echo "=== PATCH age=null → age_enc 지워짐 ==="
curl -s -o /dev/null -X PATCH $API/users/me \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -d '{"age":null}'
ME3=$(curl -s $API/users/me -H "Authorization: Bearer $AT")
AGE3=$(echo "$ME3" | json "user.age")
check "GET /oth-path age=null" "null" "$AGE3"

echo "=== signup password too short (min=8) 422 ==="
BAD=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/auth/signup \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"short_${ts}@x.io\",\"password\":\"short\",\"name\":\"X\"}")
check "signup short pw 422" "422" "$BAD"

echo ""
echo "########## M-6.5: tokens-based pricing ##########"

echo "=== credits charge starter=10 ==="
CH=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/credits/charge \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d '{"package_id":"starter","payment_provider":"mock_beta"}')
check "charge 200" "200" "$CH"

echo "=== public memlow clone 생성 ==="
UNAME="m6_${ts: -8}"
CL=$(curl -s -X POST $API/clones -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d "{\"clone_type\":\"memlow\",\"name\":\"Grandma\",\"username\":\"$UNAME\",\"visibility\":\"public\",\"memlow_profile\":{\"nickname\":\"halmi\"}}")
CID=$(echo "$CL" | json "clone.id")
[[ -z "$CID" ]] && { echo "clone failed: $CL"; exit 1; }
echo "clone_id=$CID"

echo "=== POST /oth-path 짧은 메시지 (min=1 credits) ==="
SHORT=$(curl -s -X POST $API/clones/$CID/messages \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d '{"content":"hi"}')
C_SHORT=$(echo "$SHORT" | json "billing.credits")
check "short msg billing.credits=1" "1" "$C_SHORT"

echo "=== POST /oth-path 긴 메시지 (≥2 credits) ==="
BIG=$(node -e 'console.log("a".repeat(400))')
LONG=$(curl -s -X POST $API/clones/$CID/messages \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d "{\"content\":\"$BIG\"}")
C_LONG=$(echo "$LONG" | json "billing.credits")
T_LONG=$(echo "$LONG" | json "billing.tokens")
if [[ -n "$C_LONG" && "$C_LONG" -ge 2 ]]; then
  echo "✅ long msg billing.credits≥2 (got=$C_LONG tokens=$T_LONG)"; PASS=$((PASS+1))
else
  echo "❌ long msg credits should be ≥2 got=$C_LONG"; FAIL=$((FAIL+1))
fi

echo "=== GET /oth-path type=message_send 기록 ==="
LED=$(curl -s "$API/credits/ledgers?type=message_send" -H "Authorization: Bearer $AT")
L0=$(echo "$LED" | json "items.0.type")
check "ledger.0.type=message_send" "message_send" "$L0"
L0A=$(echo "$LED" | json "items.0.amount")
if [[ "$L0A" =~ ^-[0-9]+$ ]]; then
  echo "✅ ledger amount negative (spend) ($L0A)"; PASS=$((PASS+1))
else
  echo "❌ ledger amount should be negative got=$L0A"; FAIL=$((FAIL+1))
fi

echo ""
echo "########## M-6.4: SSE stream ##########"

echo "=== POST /oth-path event-stream 파싱 ==="
SSE=$(curl -sN -X POST $API/clones/$CID/messages/stream \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -H "Accept: text/event-stream" \
  -d '{"content":"hello world"}')
contains "SSE event:start" "event: start" "$SSE"
contains "SSE event:token" "event: token" "$SSE"
contains "SSE event:done" "event: done" "$SSE"
contains "SSE start sessionId payload" "sessionId" "$SSE"
contains "SSE done credits payload" "\"credits\"" "$SSE"

echo "=== SSE 비인증 401 ==="
SSE401=$(curl -sN -o /dev/null -w "%{http_code}" -X POST $API/clones/$CID/messages/stream \
  -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d '{"content":"ignored"}')
check "SSE unauth 401" "401" "$SSE401"

echo ""
echo "########## M-6.1: ledger CHECK (message_send) ##########"

echo "=== credit_ledgers.type='message_send' D1 CHECK 통과 확인 ==="
# 정상 메시지 → 200이면 CHECK 통과한 것.
OK=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/clones/$CID/messages \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d '{"content":"probe"}')
check "post msg 200 (CHECK passes)" "200" "$OK"

echo ""
echo "========================="
echo "M-6 합계: PASS=$PASS FAIL=$FAIL"
echo "========================="
[[ $FAIL -eq 0 ]] || exit 1
