#!/bin/bash
# M-5 Memory write + Sharing 통합 테스트
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
json() { node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write(String(eval("JSON.parse(d)."+process.argv[1])))}catch(e){process.stdout.write("")}})' "$1"; }
idk() { node -e 'console.log("idk-"+Date.now()+"-"+Math.random().toString(36).slice(2,10))'; }
ts=$(date +%s%N)

EMAIL_A="alice_m5_${ts}@test.io"
EMAIL_B="bob_m5_${ts}@test.io"
EMAIL_C="carol_m5_${ts}@test.io"

echo "=== signup A/B/C ==="
A=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL_A\",\"password\":\"Correct-Horse-9!\",\"name\":\"Alice\"}")
AT=$(echo "$A" | json "accessToken")
B=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL_B\",\"password\":\"Correct-Horse-9!\",\"name\":\"Bob\"}")
BT=$(echo "$B" | json "accessToken")
C=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL_C\",\"password\":\"Correct-Horse-9!\",\"name\":\"Carol\"}")
CT=$(echo "$C" | json "accessToken")
[[ -z "$AT" || -z "$BT" || -z "$CT" ]] && { echo "signup failed"; exit 1; }

echo "=== alice memlow clone 생성 (public) ==="
UNAME="m5_memlow_${ts: -8}"
CL=$(curl -s -X POST $API/clones -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d "{\"clone_type\":\"memlow\",\"name\":\"Halmoni\",\"username\":\"$UNAME\",\"visibility\":\"public\",\"memlow_profile\":{\"nickname\":\"halmi\"}}")
CID=$(echo "$CL" | json "clone.id")
[[ -z "$CID" ]] && { echo "clone failed"; exit 1; }
echo "clone_id=$CID"

echo ""
echo "########## TRACK A: Memory write ##########"
echo ""

echo "=== PUT /oth-path (owner 병합 persona) ==="
L1=$(curl -s -o /tmp/m51.json -w "%{http_code}" -X PUT $API/clones/$CID/memory/l1 \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d '{"persona":{"age":72,"hobby":"cooking"},"family":[{"role":"granddaughter","name":"Eunha"}]}')
check "L1 PUT 200" "200" "$L1"
REV=$(cat /tmp/m51.json | json "rev")
check "L1 rev=2 (init=1 -> +1)" "2" "$REV"

echo "=== GET L1 반영 확인 ==="
GL1=$(curl -s $API/clones/$CID/memory/l1 -H "Authorization: Bearer $AT")
AGE=$(echo "$GL1" | json "persona.age")
check "persona.age=72" "72" "$AGE"
NICK=$(echo "$GL1" | json "persona.nickname")
check "persona.nickname 보존" "halmi" "$NICK"
FAM=$(echo "$GL1" | json "family.length")
check "family length=1" "1" "$FAM"

echo "=== non-editor(bob) PUT L1 → 403 ==="
L1B=$(curl -s -o /dev/null -w "%{http_code}" -X PUT $API/clones/$CID/memory/l1 \
  -H "Authorization: Bearer $BT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d '{"persona":{"hack":true}}')
check "L1 bob 403" "403" "$L1B"

echo "=== POST shared/events append ==="
EV1=$(curl -s -o /tmp/ev1.json -w "%{http_code}" -X POST $API/clones/$CID/memory/shared/events \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d '{"category":"memories.shared","key":"first_cook","value":{"dish":"kimchi-jjigae","year":1985}}')
check "shared append 200" "200" "$EV1"
EV1ID=$(cat /tmp/ev1.json | json "event.id")

EV2=$(curl -s -o /tmp/ev2.json -w "%{http_code}" -X POST $API/clones/$CID/memory/shared/events \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d "{\"category\":\"memories.shared\",\"key\":\"first_cook\",\"value\":{\"dish\":\"kimchi-stew\",\"year\":1985},\"correction_of\":\"$EV1ID\"}")
check "correction append 200" "200" "$EV2"

echo "=== GET shared 2건 반영 ==="
SH=$(curl -s $API/clones/$CID/memory/shared -H "Authorization: Bearer $AT")
EVN=$(echo "$SH" | json "events.length")
check "shared events=2" "2" "$EVN"
REV_SH=$(echo "$SH" | json "rev")
check "shared rev=2" "2" "$REV_SH"

echo "=== correction_of 존재하지 않는 id → 422 ==="
BADCOR=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/clones/$CID/memory/shared/events \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d '{"category":"events","key":"x","value":1,"correction_of":"ghost"}')
check "bad correction_of 422" "422" "$BADCOR"

echo "=== PUT L2 (alice 본인) ==="
L2A=$(curl -s -o /tmp/l2a.json -w "%{http_code}" -X PUT $API/clones/$CID/memory/l2 \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d '{"address":"할머니","relation":"손녀","preference_personal":{"tone":"warm"}}')
check "L2 PUT 200" "200" "$L2A"
GL2=$(curl -s $API/clones/$CID/memory/l2 -H "Authorization: Bearer $AT")
ADDR=$(echo "$GL2" | json "address")
check "L2 address 할머니" "할머니" "$ADDR"
REL=$(echo "$GL2" | json "relation")
check "L2 relation 손녀" "손녀" "$REL"

echo "=== 32KB 초과 L1 → 422 ==="
BIG=$(node -e 'let o={persona:{}};for(let i=0;i<5000;i++)o.persona["k"+i]="xxxxxxxxxxxxxxxxxxxxxxxx";console.log(JSON.stringify(o))')
HUGE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT $API/clones/$CID/memory/l1 \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d "$BIG")
check "L1 size cap 422" "422" "$HUGE"

echo ""
echo "########## TRACK B: Sharing ##########"
echo ""

echo "=== POST /oth-path (alice → bob@email) ==="
IV=$(curl -s -o /tmp/iv1.json -w "%{http_code}" -X POST $API/clones/$CID/invites \
  -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d "{\"invite_email\":\"$EMAIL_B\",\"relation\":\"friend\"}")
check "invite create 201" "201" "$IV"
TOKEN=$(cat /tmp/iv1.json | json "token")
[[ -z "$TOKEN" ]] && { echo "token missing"; exit 1; }
echo "token=${TOKEN:0:16}..."

echo "=== GET /oth-path (익명 프리뷰) ==="
VW=$(curl -s -o /tmp/vw.json -w "%{http_code}" $API/invites/$TOKEN)
check "invite preview 200" "200" "$VW"
CLN=$(cat /tmp/vw.json | json "clone.name")
check "invite clone.name" "Halmoni" "$CLN"

echo "=== POST /oth-path (carol → email mismatch 403) ==="
ACC_C=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/invites/$TOKEN/accept \
  -H "Authorization: Bearer $CT" -H "X-Idempotency-Key: $(idk)" \
  -H "Content-Type: application/json" -d '{}')
check "accept wrong email 403" "403" "$ACC_C"

echo "=== POST /oth-path (bob) ==="
ACC_B=$(curl -s -o /tmp/acc.json -w "%{http_code}" -X POST $API/invites/$TOKEN/accept \
  -H "Authorization: Bearer $BT" -H "X-Idempotency-Key: $(idk)" \
  -H "Content-Type: application/json" -d '{}')
check "accept 200" "200" "$ACC_B"
BROLE=$(cat /tmp/acc.json | json "role")
check "accept role=viewer" "viewer" "$BROLE"

echo "=== 재사용 시도 (bob 다시) → 409 used ==="
REUSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/invites/$TOKEN/accept \
  -H "Authorization: Bearer $BT" -H "X-Idempotency-Key: $(idk)" \
  -H "Content-Type: application/json" -d '{}')
check "reuse used 409" "409" "$REUSE"

echo "=== bob now viewer → visibility private 전환 후 접근 가능 ==="
curl -s -X PATCH $API/clones/$CID -H "Authorization: Bearer $AT" \
  -H "Content-Type: application/json" -d '{"visibility":"private"}' > /dev/null
ML1B=$(curl -s -o /dev/null -w "%{http_code}" $API/clones/$CID/memory/l1 -H "Authorization: Bearer $BT")
check "bob private clone L1 200" "200" "$ML1B"

echo "=== bob viewer는 PUT L1 가능 (viewer도 editor) ==="
L1BV=$(curl -s -o /dev/null -w "%{http_code}" -X PUT $API/clones/$CID/memory/l1 \
  -H "Authorization: Bearer $BT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d '{"persona":{"bob_tag":"yes"}}')
check "viewer L1 PUT 200" "200" "$L1BV"

echo "=== carol는 여전히 접근 불가 (private, share 없음) ==="
ML1C=$(curl -s -o /dev/null -w "%{http_code}" $API/clones/$CID/memory/l1 -H "Authorization: Bearer $CT")
check "carol private 403" "403" "$ML1C"

echo "=== GET /oth-path (owner alice) ==="
SL=$(curl -s $API/clones/$CID/shares -H "Authorization: Bearer $AT")
SLN=$(echo "$SL" | json "shares.length")
# owner self + bob viewer = 2
check "shares count=2" "2" "$SLN"

echo "=== carol GET shares 시도 → 403 ==="
SLC=$(curl -s -o /dev/null -w "%{http_code}" $API/clones/$CID/shares -H "Authorization: Bearer $CT")
check "non-owner shares 403" "403" "$SLC"

echo "=== DELETE /oth-path bob 제거 ==="
BOB_SID=$(echo "$SL" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const s=JSON.parse(d).shares.find(x=>x.role=="viewer");console.log(s?s.id:"")})')
[[ -z "$BOB_SID" ]] && { echo "bob share id not found"; exit 1; }
DS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API/clones/$CID/shares/$BOB_SID \
  -H "Authorization: Bearer $AT" -H "X-Idempotency-Key: $(idk)")
check "share delete 200" "200" "$DS"

echo "=== bob 이제 접근 불가 (private 403) ==="
ML1B2=$(curl -s -o /dev/null -w "%{http_code}" $API/clones/$CID/memory/l1 -H "Authorization: Bearer $BT")
check "bob revoked 403" "403" "$ML1B2"

echo "=== alice 자기자신 owner share 삭제 시도 → 409 ==="
ALICE_SID=$(echo "$SL" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const s=JSON.parse(d).shares.find(x=>x.role=="owner");console.log(s?s.id:"")})')
ASD=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API/clones/$CID/shares/$ALICE_SID \
  -H "Authorization: Bearer $AT" -H "X-Idempotency-Key: $(idk)")
check "self-owner delete 409" "409" "$ASD"

echo "=== 만료된 토큰 또는 잘못된 토큰 ==="
BADTOK=$(curl -s -o /dev/null -w "%{http_code}" $API/invites/notarealtoken___)
check "bad token 422" "422" "$BADTOK"
GHOST=$(curl -s -o /dev/null -w "%{http_code}" $API/invites/$(node -e 'let s="";for(let i=0;i<64;i++)s+="f";console.log(s)'))
check "ghost token 404" "404" "$GHOST"

echo "=== non-owner invite 발급 시도 (bob) → 403 ==="
BADINV=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/clones/$CID/invites \
  -H "Authorization: Bearer $BT" -H "Content-Type: application/json" -H "X-Idempotency-Key: $(idk)" \
  -d '{}')
check "non-owner invite 403" "403" "$BADINV"

echo ""
echo "====================================="
echo "PASS=$PASS FAIL=$FAIL"
echo "====================================="
exit $FAIL
