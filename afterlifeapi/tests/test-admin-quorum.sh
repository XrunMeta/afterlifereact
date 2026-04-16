#!/bin/bash
# Critical 테마 (가) D단계 회귀: super_admin 쿼럼 smoke test.
# 전제: wrangler dev 127.0.0.1:8787, ADMIN_BOOTSTRAP_TOKEN=dev-bootstrap-token-change-me.
# 4-eyes: 요청자 본인 승인 금지, 실행은 요청자만.
set -e
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

# super_admin 1명 로그인 후 accessToken 반환. 전역 /tmp/q_enroll_$tag.json 재사용.
bootstrap_login() {
  local tag="$1" email="$2"
  curl -s -X POST $API/admin/auth/bootstrap -H 'Content-Type: application/json' \
    -d "{\"token\":\"$BT\",\"email\":\"$email\",\"password\":\"AdminPass-1234!\",\"role\":\"super_admin\"}" > /dev/null
  local L P S C V
  L=$(curl -s -X POST $API/admin/auth/login -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"AdminPass-1234!\"}")
  P=$(echo "$L" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).pendingToken||""))')
  curl -s -o /tmp/q_enroll_$tag.json -X POST $API/admin/auth/totp/enroll -H "Authorization: Bearer $P" > /dev/null
  S=$(node -e "console.log(require('/tmp/q_enroll_$tag.json').secret||'')")
  C=$(totp_code "$S")
  V=$(curl -s -X POST $API/admin/auth/totp/verify -H "Authorization: Bearer $P" -H 'Content-Type: application/json' \
    -d "{\"code\":\"$C\"}")
  echo "$V" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))'
}

ts=$(date +%s%N)
E1="qadmin1_${ts}@test.io"
E2="qadmin2_${ts}@test.io"

echo "=== super_admin 2명 부트스트랩 + TOTP 로그인 ==="
T1=$(bootstrap_login "1" "$E1")
T2=$(bootstrap_login "2" "$E2")
[[ -z "$T1" || -z "$T2" ]] && { echo "token missing"; exit 1; }

echo "=== moderator는 쿼럼 403 확인 ==="
EM="qmod_${ts}@test.io"
TM=$(
  curl -s -X POST $API/admin/auth/bootstrap -H 'Content-Type: application/json' \
    -d "{\"token\":\"$BT\",\"email\":\"$EM\",\"password\":\"AdminPass-1234!\",\"role\":\"moderator\"}" > /dev/null
  L=$(curl -s -X POST $API/admin/auth/login -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EM\",\"password\":\"AdminPass-1234!\"}")
  P=$(echo "$L" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).pendingToken||""))')
  curl -s -o /tmp/q_mod.json -X POST $API/admin/auth/totp/enroll -H "Authorization: Bearer $P" > /dev/null
  S=$(node -e "console.log(require('/tmp/q_mod.json').secret||'')")
  C=$(totp_code "$S")
  V=$(curl -s -X POST $API/admin/auth/totp/verify -H "Authorization: Bearer $P" -H 'Content-Type: application/json' \
    -d "{\"code\":\"$C\"}")
  echo "$V" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))'
)
R=$(curl -s -o /tmp/q_mod_list.json -w "%{http_code}" -H "Authorization: Bearer $TM" $API/admin/quorum/requests)
check "quorum.moderator 403" "403" "$R"

echo "=== s1 쿼럼 요청 생성 (requiredApprovals=1) ==="
R=$(curl -s -o /tmp/q_create.json -w "%{http_code}" -X POST $API/admin/quorum/requests \
  -H "Authorization: Bearer $T1" -H 'Content-Type: application/json' \
  -d '{"actionType":"celeb_ip_transfer","payload":{"cloneId":99},"reason":"test quorum path","requiredApprovals":1}')
check "create.ok 201" "201" "$R"
RID=$(node -e 'console.log(require("/tmp/q_create.json").request.id)')

echo "=== s1이 본인 요청에 투표 시도 → 403 ==="
R=$(curl -s -o /tmp/q_self.json -w "%{http_code}" -X POST $API/admin/quorum/requests/$RID/decisions \
  -H "Authorization: Bearer $T1" -H 'Content-Type: application/json' \
  -d '{"decision":"approve"}')
check "decision.self 403" "403" "$R"

echo "=== s2 approve → 200, status=approved ==="
R=$(curl -s -o /tmp/q_d1.json -w "%{http_code}" -X POST $API/admin/quorum/requests/$RID/decisions \
  -H "Authorization: Bearer $T2" -H 'Content-Type: application/json' \
  -d '{"decision":"approve","comment":"ok"}')
check "decision.approve 200" "200" "$R"
ST=$(node -e 'console.log(require("/tmp/q_d1.json").status)')
check "status=approved" "approved" "$ST"

echo "=== s2 재투표 → 409 (UNIQUE) ==="
R=$(curl -s -o /tmp/q_d2.json -w "%{http_code}" -X POST $API/admin/quorum/requests/$RID/decisions \
  -H "Authorization: Bearer $T2" -H 'Content-Type: application/json' \
  -d '{"decision":"approve"}')
check "decision.double 409" "409" "$R"

echo "=== s2가 실행 시도 → 403 (requester 아님) ==="
R=$(curl -s -o /tmp/q_e1.json -w "%{http_code}" -X POST $API/admin/quorum/requests/$RID/execute \
  -H "Authorization: Bearer $T2")
check "execute.not_requester 403" "403" "$R"

echo "=== s1 실행 → 200, status=executed ==="
R=$(curl -s -o /tmp/q_e2.json -w "%{http_code}" -X POST $API/admin/quorum/requests/$RID/execute \
  -H "Authorization: Bearer $T1")
check "execute.ok 200" "200" "$R"
ST2=$(node -e 'console.log(require("/tmp/q_e2.json").status)')
check "execute.status=executed" "executed" "$ST2"

echo "=== 이미 executed 재실행 → 409 ==="
R=$(curl -s -o /tmp/q_e3.json -w "%{http_code}" -X POST $API/admin/quorum/requests/$RID/execute \
  -H "Authorization: Bearer $T1")
check "execute.already 409" "409" "$R"

echo "=== reject 1건 → 즉시 rejected ==="
R=$(curl -s -o /tmp/q_c2.json -w "%{http_code}" -X POST $API/admin/quorum/requests \
  -H "Authorization: Bearer $T1" -H 'Content-Type: application/json' \
  -d '{"actionType":"crypto_shredding","payload":{"userId":7},"reason":"GDPR DSR shred test","requiredApprovals":2}')
check "create2.ok 201" "201" "$R"
RID2=$(node -e 'console.log(require("/tmp/q_c2.json").request.id)')
R=$(curl -s -o /tmp/q_rej.json -w "%{http_code}" -X POST $API/admin/quorum/requests/$RID2/decisions \
  -H "Authorization: Bearer $T2" -H 'Content-Type: application/json' \
  -d '{"decision":"reject","comment":"scope unclear"}')
check "decision.reject 200" "200" "$R"
ST3=$(node -e 'console.log(require("/tmp/q_rej.json").status)')
check "rejected.status" "rejected" "$ST3"

echo "=== 잘못된 actionType → 400 ==="
R=$(curl -s -o /tmp/q_bad.json -w "%{http_code}" -X POST $API/admin/quorum/requests \
  -H "Authorization: Bearer $T1" -H 'Content-Type: application/json' \
  -d '{"actionType":"not_allowed","payload":{},"reason":"bad action type"}')
check "create.bad_action 400" "400" "$R"

echo ""
echo "=============================="
echo "PASS=$PASS FAIL=$FAIL"
[[ $FAIL -eq 0 ]] || exit 1
