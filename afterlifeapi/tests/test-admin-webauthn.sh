#!/bin/bash
# Critical 테마 (가) B단계 회귀: WebAuthn smoke test.
# 실제 authenticator 없이도 서버 측 흐름 검증 (options 발급, challenge 보관/소비, 에러 정규화).
# 전제: wrangler dev가 127.0.0.1:8787에서 떠 있고, ADMIN_BOOTSTRAP_TOKEN=dev-bootstrap-token-change-me.
set -e
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

ts=$(date +%s%N)
EMAIL="admin_wa_${ts}@test.io"
PW="AdminPass-1234!"

echo "=== bootstrap(super_admin) + login → pendingToken ==="
curl -s -o /dev/null -X POST $API/admin/auth/bootstrap \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"$BT\",\"email\":\"$EMAIL\",\"password\":\"$PW\",\"role\":\"super_admin\"}"

LOGIN=$(curl -s -X POST $API/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}")
PENDING=$(echo "$LOGIN" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).pendingToken||""))')
[[ -z "$PENDING" ]] && { echo "pendingToken missing"; exit 1; }

echo "=== register/begin 비인증은 401 ==="
R=$(curl -s -o /tmp/wa1.json -w "%{http_code}" -X POST $API/admin/auth/webauthn/register/begin)
check "wa.reg.begin noauth 401" "401" "$R"

echo "=== register/begin 정상 options ==="
R=$(curl -s -o /tmp/wa2.json -w "%{http_code}" -X POST $API/admin/auth/webauthn/register/begin \
  -H "Authorization: Bearer $PENDING")
check "wa.reg.begin ok 200" "200" "$R"
CHAL=$(node -e 'console.log(require("/tmp/wa2.json").challenge||"")')
RP_ID=$(node -e 'console.log(require("/tmp/wa2.json").rp.id||"")')
USER_NAME=$(node -e 'console.log(require("/tmp/wa2.json").user.name||"")')
[[ -z "$CHAL" ]] && { echo "challenge missing"; exit 1; }
check "wa.reg.begin rp.id=localhost" "localhost" "$RP_ID"
check "wa.reg.begin user.name=email" "$EMAIL" "$USER_NAME"

echo "=== login/begin credential 미등록은 404 ==="
R=$(curl -s -o /tmp/wa3.json -w "%{http_code}" -X POST $API/admin/auth/webauthn/login/begin \
  -H "Authorization: Bearer $PENDING")
check "wa.login.begin not_enrolled 404" "404" "$R"
CODE=$(node -e 'console.log(require("/tmp/wa3.json").error.code||"")')
check "wa.login.begin code=WEBAUTHN_NOT_ENROLLED" "WEBAUTHN_NOT_ENROLLED" "$CODE"

echo "=== register/finish 가짜 attestation은 401(WEBAUTHN_INVALID) ==="
FAKE='{"response":{"id":"AAAA","rawId":"AAAA","type":"public-key","response":{"attestationObject":"invalid","clientDataJSON":"eyJ0eXAiOiJ3ZWJhdXRobi5jcmVhdGUifQ"}}}'
R=$(curl -s -o /tmp/wa4.json -w "%{http_code}" -X POST $API/admin/auth/webauthn/register/finish \
  -H "Authorization: Bearer $PENDING" -H 'Content-Type: application/json' \
  -d "$FAKE")
check "wa.reg.finish bogus 401" "401" "$R"
CODE=$(node -e 'console.log(require("/tmp/wa4.json").error.code||"")')
check "wa.reg.finish code=WEBAUTHN_INVALID" "WEBAUTHN_INVALID" "$CODE"

echo "=== register/finish 재시도는 challenge 소비됨 → 410 ==="
R=$(curl -s -o /tmp/wa5.json -w "%{http_code}" -X POST $API/admin/auth/webauthn/register/finish \
  -H "Authorization: Bearer $PENDING" -H 'Content-Type: application/json' \
  -d "$FAKE")
check "wa.reg.finish second 410" "410" "$R"
CODE=$(node -e 'console.log(require("/tmp/wa5.json").error.code||"")')
check "wa.reg.finish code=CHALLENGE_EXPIRED" "WEBAUTHN_CHALLENGE_EXPIRED" "$CODE"

echo "=== login/finish without credential → 404 ==="
FAKE_LOGIN='{"response":{"id":"AAAA","rawId":"AAAA","type":"public-key","response":{"authenticatorData":"x","clientDataJSON":"eyJ0eXAiOiJ3ZWJhdXRobi5nZXQifQ","signature":"y"}}}'
R=$(curl -s -o /tmp/wa6.json -w "%{http_code}" -X POST $API/admin/auth/webauthn/login/finish \
  -H "Authorization: Bearer $PENDING" -H 'Content-Type: application/json' \
  -d "$FAKE_LOGIN")
# challenge가 없으므로 WEBAUTHN_CHALLENGE_EXPIRED 410이 먼저 반환됨
check "wa.login.finish no_chal 410" "410" "$R"

echo "=== pending 만료 후 register/begin 시도 대체: 잘못된 토큰 401 ==="
R=$(curl -s -o /tmp/wa7.json -w "%{http_code}" -X POST $API/admin/auth/webauthn/register/begin \
  -H "Authorization: Bearer not-a-token")
check "wa.reg.begin bad_pending 401" "401" "$R"

echo ""
echo "=============================="
echo "PASS=$PASS FAIL=$FAIL"
[[ $FAIL -eq 0 ]] || exit 1
