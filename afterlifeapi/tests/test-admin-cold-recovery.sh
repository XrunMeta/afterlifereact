#!/bin/bash
# Critical 테마 (가) C단계 회귀: Cold Recovery 마스터 코드 smoke test.
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

# RFC 6238 TOTP 6자리 계산 (테스트용). test-admin-auth.sh와 동일.
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
EMAIL="cradmin_${ts}@test.io"
PW="AdminPass-1234!"

echo "=== admin 생성 + TOTP 등록 (Cold Recovery 대상 준비) ==="
curl -s -X POST $API/admin/auth/bootstrap -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"email\":\"$EMAIL\",\"password\":\"$PW\",\"role\":\"moderator\"}" > /dev/null
LOGIN=$(curl -s -X POST $API/admin/auth/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}")
PENDING=$(echo "$LOGIN" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).pendingToken||""))')
[[ -z "$PENDING" ]] && { echo "pending missing"; exit 1; }
curl -s -o /tmp/cr_enroll.json -X POST $API/admin/auth/totp/enroll -H "Authorization: Bearer $PENDING" > /dev/null
SECRET=$(node -e 'console.log(require("/tmp/cr_enroll.json").secret||"")')
CODE=$(totp_code "$SECRET")
curl -s -X POST $API/admin/auth/totp/verify -H "Authorization: Bearer $PENDING" -H 'Content-Type: application/json' \
  -d "{\"code\":\"$CODE\"}" > /dev/null

echo "=== provision.bad_token → 404 (존재 은폐) ==="
R=$(curl -s -o /tmp/cr_p1.json -w "%{http_code}" -X POST $API/admin/cold-recovery/provision \
  -H 'Content-Type: application/json' -d "{\"token\":\"wrong\"}")
check "provision.bad_token 404" "404" "$R"

echo "=== provision.ok → 201 + masterCode ==="
R=$(curl -s -o /tmp/cr_p2.json -w "%{http_code}" -X POST $API/admin/cold-recovery/provision \
  -H 'Content-Type: application/json' -d "{\"token\":\"$BT\",\"note\":\"initial\"}")
check "provision.ok 201" "201" "$R"
MC=$(node -e 'console.log(require("/tmp/cr_p2.json").masterCode||"")')
[[ -z "$MC" ]] && { echo "masterCode missing"; exit 1; }

echo "=== provision.rotate → 기존 자동 revoke + 새 코드 ==="
R=$(curl -s -o /tmp/cr_p3.json -w "%{http_code}" -X POST $API/admin/cold-recovery/provision \
  -H 'Content-Type: application/json' -d "{\"token\":\"$BT\"}")
check "provision.rotate 201" "201" "$R"
MC2=$(node -e 'console.log(require("/tmp/cr_p3.json").masterCode||"")')

echo "=== reset.revoked_code → 401 ==="
R=$(curl -s -o /tmp/cr_r1.json -w "%{http_code}" -X POST $API/admin/cold-recovery/reset-2fa \
  -H 'Content-Type: application/json' \
  -d "{\"masterCode\":\"$MC\",\"targetEmail\":\"$EMAIL\",\"reason\":\"revoked should fail\"}")
check "reset.revoked 401" "401" "$R"

echo "=== reset.unknown_target → 404 (코드 소진 안 함) ==="
R=$(curl -s -o /tmp/cr_r2.json -w "%{http_code}" -X POST $API/admin/cold-recovery/reset-2fa \
  -H 'Content-Type: application/json' \
  -d "{\"masterCode\":\"$MC2\",\"targetEmail\":\"nobody_${ts}@test.io\",\"reason\":\"should not consume code\"}")
check "reset.unknown_target 404" "404" "$R"

echo "=== reset.ok → 200 (직전 404는 코드 유지 증명) ==="
R=$(curl -s -o /tmp/cr_r3.json -w "%{http_code}" -X POST $API/admin/cold-recovery/reset-2fa \
  -H 'Content-Type: application/json' \
  -d "{\"masterCode\":\"$MC2\",\"targetEmail\":\"$EMAIL\",\"reason\":\"admin lost all devices\"}")
check "reset.ok 200" "200" "$R"

echo "=== reset.reuse → 401 (이미 consumed) ==="
R=$(curl -s -o /tmp/cr_r4.json -w "%{http_code}" -X POST $API/admin/cold-recovery/reset-2fa \
  -H 'Content-Type: application/json' \
  -d "{\"masterCode\":\"$MC2\",\"targetEmail\":\"$EMAIL\",\"reason\":\"retry\"}")
check "reset.reuse 401" "401" "$R"

echo "=== reset 이후 로그인 → totpEnrolled=false (초기화 확인) ==="
LOGIN2=$(curl -s -X POST $API/admin/auth/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}")
ENROLLED=$(echo "$LOGIN2" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).totpEnrolled))')
check "post-reset.enrolled=false" "false" "$ENROLLED"

echo ""
echo "=============================="
echo "PASS=$PASS FAIL=$FAIL"
[[ $FAIL -eq 0 ]] || exit 1
