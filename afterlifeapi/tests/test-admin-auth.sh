#!/bin/bash
# Critical 테마 (가) A단계 회귀: 어드민 2FA 플로우 smoke test.
# 전제: wrangler dev가 127.0.0.1:8787에서 떠 있고, ADMIN_BOOTSTRAP_TOKEN=dev-bootstrap-token-change-me 설정.
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

# node inline — RFC 6238 TOTP 6자리 계산 (테스트용).
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

ts=$(date +%s%N)
EMAIL="admin_${ts}@test.io"
PW="AdminPass-1234!"

echo "=== bootstrap 잘못된 토큰은 404 ==="
R=$(curl -s -o /tmp/bb1.json -w "%{http_code}" -X POST $API/admin/auth/bootstrap \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"wrong\",\"email\":\"$EMAIL\",\"password\":\"$PW\",\"role\":\"moderator\"}")
check "bootstrap.bad_token 404" "404" "$R"

echo "=== bootstrap 정상 생성 ==="
R=$(curl -s -o /tmp/bb2.json -w "%{http_code}" -X POST $API/admin/auth/bootstrap \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"email\":\"$EMAIL\",\"password\":\"$PW\",\"role\":\"moderator\"}")
check "bootstrap.ok 201" "201" "$R"

echo "=== bootstrap 중복은 409 ==="
R=$(curl -s -o /tmp/bb3.json -w "%{http_code}" -X POST $API/admin/auth/bootstrap \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"email\":\"$EMAIL\",\"password\":\"$PW\",\"role\":\"moderator\"}")
check "bootstrap.dup 409" "409" "$R"

echo "=== login 잘못된 비밀번호 401 ==="
R=$(curl -s -o /tmp/l1.json -w "%{http_code}" -X POST $API/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"wrong-password-1\"}")
check "login.bad_pw 401" "401" "$R"

echo "=== login 정상 → pendingToken ==="
LOGIN=$(curl -s -X POST $API/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}")
PENDING=$(echo "$LOGIN" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).pendingToken||""))')
ENROLLED=$(echo "$LOGIN" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).totpEnrolled))')
[[ -z "$PENDING" ]] && { echo "pendingToken missing"; exit 1; }
check "login.enrolled=false" "false" "$ENROLLED"

echo "=== totp/enroll ==="
ENROLL=$(curl -s -o /tmp/enroll.json -w "%{http_code}" -X POST $API/admin/auth/totp/enroll \
  -H "Authorization: Bearer $PENDING")
check "totp.enroll 201" "201" "$ENROLL"
SECRET=$(node -e 'console.log(require("/tmp/enroll.json").secret||"")')
[[ -z "$SECRET" ]] && { echo "secret missing"; exit 1; }
REC1=$(node -e 'const r=require("/tmp/enroll.json").recoveryCodes||[]; console.log(r.length)')
check "totp.enroll codes=10" "10" "$REC1"

echo "=== totp/verify 잘못된 코드 401 ==="
R=$(curl -s -o /tmp/v1.json -w "%{http_code}" -X POST $API/admin/auth/totp/verify \
  -H "Authorization: Bearer $PENDING" -H 'Content-Type: application/json' \
  -d '{"code":"000000"}')
check "totp.verify bad 401" "401" "$R"

echo "=== totp/verify 정상 코드 ==="
CODE=$(totp_code "$SECRET")
R=$(curl -s -o /tmp/v2.json -w "%{http_code}" -X POST $API/admin/auth/totp/verify \
  -H "Authorization: Bearer $PENDING" -H 'Content-Type: application/json' \
  -d "{\"code\":\"$CODE\"}")
check "totp.verify ok 200" "200" "$R"
ACCESS=$(node -e 'console.log(require("/tmp/v2.json").accessToken||"")')
[[ -z "$ACCESS" ]] && { echo "access missing"; exit 1; }

echo "=== 새 로그인 → enrolled=true ==="
LOGIN2=$(curl -s -X POST $API/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}")
ENROLLED2=$(echo "$LOGIN2" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).totpEnrolled))')
PENDING2=$(echo "$LOGIN2" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).pendingToken||""))')
check "login2.enrolled=true" "true" "$ENROLLED2"

echo "=== 복구코드로 폴백 로그인 ==="
RCODE=$(node -e 'console.log(require("/tmp/enroll.json").recoveryCodes[0])')
R=$(curl -s -o /tmp/rec.json -w "%{http_code}" -X POST $API/admin/auth/recovery \
  -H "Authorization: Bearer $PENDING2" -H 'Content-Type: application/json' \
  -d "{\"code\":\"$RCODE\"}")
check "recovery.ok 200" "200" "$R"
REMAIN=$(node -e 'console.log(require("/tmp/rec.json").codesRemaining)')
check "recovery.codesRemaining=9" "9" "$REMAIN"

echo "=== 같은 복구코드 재사용은 실패(401) ==="
LOGIN3=$(curl -s -X POST $API/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}")
PENDING3=$(echo "$LOGIN3" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).pendingToken||""))')
R=$(curl -s -o /tmp/rec2.json -w "%{http_code}" -X POST $API/admin/auth/recovery \
  -H "Authorization: Bearer $PENDING3" -H 'Content-Type: application/json' \
  -d "{\"code\":\"$RCODE\"}")
check "recovery.reuse 401" "401" "$R"

echo ""
echo "=============================="
echo "PASS=$PASS FAIL=$FAIL"
[[ $FAIL -eq 0 ]] || exit 1
