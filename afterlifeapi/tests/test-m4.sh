#!/bin/bash
# M-4 Messages 플로우 검증
set -e
API=http:
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
ts=$(date +%s%N)
EMAIL_A="alice_m4_${ts}@test.io"
EMAIL_B="bob_m4_${ts}@test.io"

echo "=== signup A + B ==="
A=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_A\",\"password\":\"Correct-Horse-9!\",\"name\":\"Alice\"}")
AT=$(echo "$A" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))')
B=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_B\",\"password\":\"Correct-Horse-9!\",\"name\":\"Bob\"}")
BT=$(echo "$B" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))')
[[ -z "$AT" || -z "$BT" ]] && { echo "signup failed"; exit 1; }

echo "=== alice charge starter (10크레딧) ==="
IDK=$(node -e 'console.log("idk-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
curl -s -o /dev/null -X POST $API/credits/charge -H "Authorization: Bearer $AT" \
  -H "Content-Type: application/json" -H "X-Idempotency-Key: $IDK" \
  -d '{"package_id":"starter"}'

echo "=== alice 생성 public memlow 클론 ==="
IDK_C=$(node -e 'console.log("ic-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
UNAME="m4_memlow_${ts: -8}"
CL=$(curl -s -X POST $API/clones -H "Authorization: Bearer $AT" \
  -H "Content-Type: application/json" -H "X-Idempotency-Key: $IDK_C" \
  -d "{\"clone_type\":\"memlow\",\"name\":\"Echo\",\"username\":\"$UNAME\",\"visibility\":\"public\",\"memlow_profile\":{\"nickname\":\"echo\"}}")
CID=$(echo "$CL" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).clone.id))')
[[ -z "$CID" ]] && { echo "clone failed: $CL"; exit 1; }
echo "clone_id=$CID"

echo "=== POST /oth-path (첫 번째) ==="
IDK_M=$(node -e 'console.log("im-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
M1=$(curl -s -o /tmp/m1.json -w "%{http_code}" -X POST $API/clones/$CID/messages \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDK_M" \
  -d '{"content":"안녕 에코, 첫 인사야"}')
check "message.send 200" "200" "$M1"
REPLY=$(node -e 'console.log(require("/tmp/m1.json").clone_reply.content)')
check "mock reply echo matches" "[Echo] echo: 안녕 에코, 첫 인사야" "$REPLY"
SID=$(node -e 'console.log(require("/tmp/m1.json").session_id)')
UMID=$(node -e 'console.log(require("/tmp/m1.json").user_message.id)')
CMID=$(node -e 'console.log(require("/tmp/m1.json").clone_reply.id)')

echo "=== 크레딧 9 (1 차감) ==="
CR=$(curl -s $API/credits/me -H "Authorization: Bearer $AT" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).credits))')
check "credits after 1 msg" "9" "$CR"

echo "=== POST /oth-path (같은 idempotency-key 재시도 → 멱등) ==="
M2=$(curl -s -o /tmp/m2.json -w "%{http_code}" -X POST $API/clones/$CID/messages \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDK_M" \
  -d '{"content":"안녕 에코, 첫 인사야"}')
check "message idempotent 200" "200" "$M2"
CR2=$(curl -s $API/credits/me -H "Authorization: Bearer $AT" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).credits))')
check "credits no double spend" "9" "$CR2"

echo "=== POST 새 세션 같은 session_id 명시 ==="
IDK_M2=$(node -e 'console.log("im-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
M3=$(curl -s -o /tmp/m3.json -w "%{http_code}" -X POST $API/clones/$CID/messages \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDK_M2" \
  -d "{\"session_id\":\"$SID\",\"content\":\"두 번째 메시지\"}")
check "message 2nd 200" "200" "$M3"
SID2=$(node -e 'console.log(require("/tmp/m3.json").session_id)')
check "session_id reuse" "$SID" "$SID2"

echo "=== GET /oth-path?session_id=X 복호화 확인 ==="
LIST=$(curl -s "$API/clones/$CID/messages?session_id=$SID" -H "Authorization: Bearer $AT")
ITEMS=$(echo "$LIST" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).items.length))')
check "messages listed 4" "4" "$ITEMS"
FIRST=$(echo "$LIST" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const it=JSON.parse(d).items; console.log(it[it.length-1].content)})')
check "oldest content decrypted" "안녕 에코, 첫 인사야" "$FIRST"

echo "=== GET /oth-path ==="
SESS=$(curl -s $API/clones/$CID/sessions -H "Authorization: Bearer $AT")
SN=$(echo "$SESS" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).sessions.length))')
check "sessions count=1" "1" "$SN"
MC=$(echo "$SESS" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).sessions[0].messageCount))')
check "sessions messageCount=4" "4" "$MC"

echo "=== 권한: bob(타인)이 alice 세션 조회 → items 비어있음 ==="
B_LIST=$(curl -s "$API/clones/$CID/messages" -H "Authorization: Bearer $BT")
B_N=$(echo "$B_LIST" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).items.length))')
check "bob sees 0 messages (public clone)" "0" "$B_N"

echo "=== bob star 시도 → 본인 대화 아님 403 ==="
BSTAR=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/messages/$CMID/star -H "Authorization: Bearer $BT" -H "Content-Type: application/json" -d '{}')
check "bob star foreign msg 403" "403" "$BSTAR"

echo "=== POST /oth-path (alice 본인) ==="
ST=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/messages/$CMID/star -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -d '{"note":"좋은 답변"}')
check "star 200" "200" "$ST"

echo "=== star 멱등 (같은 user+msg 재호출) ==="
ST2=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/messages/$CMID/star -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -d '{"note":"업데이트"}')
check "star idempotent 200" "200" "$ST2"

echo "=== DELETE /oth-path ==="
UNST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API/messages/$CMID/star -H "Authorization: Bearer $AT")
check "unstar 200" "200" "$UNST"
UNST2=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API/messages/$CMID/star -H "Authorization: Bearer $AT")
check "unstar idempotent 200" "200" "$UNST2"

echo "=== 크레딧 고갈 시 INSUFFICIENT_CREDITS ==="
# alice 남은 9 크레딧 모두 소비 (9회 더 메시지)
for i in $(seq 1 9); do
  IDK_L=$(node -e 'console.log("idl-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
  curl -s -o /dev/null -X POST $API/clones/$CID/messages \
    -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
    -H "X-Idempotency-Key: $IDK_L" -d "{\"content\":\"spam $i\"}"
done
CR3=$(curl -s $API/credits/me -H "Authorization: Bearer $AT" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).credits))')
check "credits zero after 10 total" "0" "$CR3"
IDK_F=$(node -e 'console.log("idf-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
INSUF=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/clones/$CID/messages \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDK_F" -d '{"content":"one more"}')
check "insufficient credits 402" "402" "$INSUF"

echo "=== private 클론: bob 접근 403 ==="
curl -s -X PATCH $API/clones/$CID -H "Authorization: Bearer $AT" \
  -H "Content-Type: application/json" -d '{"visibility":"private"}' > /dev/null
IDK_X=$(node -e 'console.log("idx-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))')
BMSG=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/clones/$CID/messages \
  -H "Authorization: Bearer $BT" -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDK_X" -d '{"content":"hi"}')
check "bob private clone 403" "403" "$BMSG"

echo "=== GET messages 비로그인 → 401 ==="
UL=$(curl -s -o /dev/null -w "%{http_code}" $API/clones/$CID/messages)
check "list unauth 401" "401" "$UL"

echo "=== bad clone id ==="
BID=$(curl -s -o /dev/null -w "%{http_code}" $API/clones/abc/messages -H "Authorization: Bearer $AT")
check "messages bad id 422" "422" "$BID"

echo ""
echo "====================================="
echo "PASS=$PASS FAIL=$FAIL"
echo "====================================="
exit $FAIL
