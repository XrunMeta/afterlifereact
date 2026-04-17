#!/bin/bash
# ALE v3 Slice 4 T7: 삭제 상태머신 smoke suite.
# 8+ 시나리오: self soft-delete/restore, 90d 윈도우 초과, clone/message delete+restore,
# admin cold-restore round-trip, quorum force_hard_delete (user 허용 / message 거부).
# 전제: wrangler dev 127.0.0.1:8787, ADMIN_BOOTSTRAP_TOKEN=dev-bootstrap-token-change-me.

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

# super_admin 부트스트랩 + TOTP 로그인 → accessToken
bootstrap_login() {
  local tag="$1" email="$2"
  curl -s -X POST $API/admin/auth/bootstrap -H 'Content-Type: application/json' \
    -d "{\"token\":\"$BT\",\"email\":\"$email\",\"password\":\"AdminPass-1234!\",\"role\":\"super_admin\"}" > /dev/null
  local L P S C V
  L=$(curl -s -X POST $API/admin/auth/login -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"AdminPass-1234!\"}")
  P=$(echo "$L" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).pendingToken||""))')
  curl -s -o /tmp/ds_enroll_$tag.json -X POST $API/admin/auth/totp/enroll -H "Authorization: Bearer $P" > /dev/null
  S=$(node -e "console.log(require('/tmp/ds_enroll_$tag.json').secret||'')")
  C=$(totp_code "$S")
  V=$(curl -s -X POST $API/admin/auth/totp/verify -H "Authorization: Bearer $P" -H 'Content-Type: application/json' \
    -d "{\"code\":\"$C\"}")
  echo "$V" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))'
}

# moderator 부트스트랩 + TOTP 로그인 → accessToken
moderator_login() {
  local tag="$1" email="$2"
  curl -s -X POST $API/admin/auth/bootstrap -H 'Content-Type: application/json' \
    -d "{\"token\":\"$BT\",\"email\":\"$email\",\"password\":\"AdminPass-1234!\",\"role\":\"moderator\"}" > /dev/null
  local L P S C V
  L=$(curl -s -X POST $API/admin/auth/login -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"AdminPass-1234!\"}")
  P=$(echo "$L" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).pendingToken||""))')
  curl -s -o /tmp/ds_mod_enroll_$tag.json -X POST $API/admin/auth/totp/enroll -H "Authorization: Bearer $P" > /dev/null
  S=$(node -e "console.log(require('/tmp/ds_mod_enroll_$tag.json').secret||'')")
  C=$(totp_code "$S")
  V=$(curl -s -X POST $API/admin/auth/totp/verify -H "Authorization: Bearer $P" -H 'Content-Type: application/json' \
    -d "{\"code\":\"$C\"}")
  echo "$V" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))'
}

# seconds + RANDOM → 14~15자리. JS Number.MAX_SAFE_INTEGER 안쪽 (Slice 3 교훈).
ts="$(date +%s)$RANDOM"
U_EMAIL="ds_user_${ts}@test.io"
U_PW="TestPass-1234!"

echo "=== 0) 사전 준비: 테스트 유저 생성 ==="
SIGNUP_RESP=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d "{\"email\":\"$U_EMAIL\",\"password\":\"$U_PW\",\"name\":\"DS Test User\"}")
U_ID=$(echo "$SIGNUP_RESP" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).user?.id||""))')
U_TOKEN=$(echo "$SIGNUP_RESP" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).accessToken||""))')
[[ -z "$U_ID" || -z "$U_TOKEN" ]] && { echo "user signup failed: $SIGNUP_RESP"; exit 1; }
echo "user_id=$U_ID"

# ─── Scenario 1: 유저 self soft-delete ──────────────────────────────────────
echo ""
echo "=== S1) 유저 self soft-delete: DELETE /oth-path → 200 ==="
R=$(curl -s -o /tmp/ds_s1.json -w "%{http_code}" -X DELETE $API/me \
  -H "Authorization: Bearer $U_TOKEN")
check "S1.soft_delete.200" "200" "$R"
STATE=$(node -e 'console.log(require("/tmp/ds_s1.json").state||"")')
check "S1.state=soft_deleted" "soft_deleted" "$STATE"
# DB 확인
DB_STATE=$(d1_query "SELECT deletion_state FROM users WHERE id=$U_ID" | \
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d)[0].results[0]?.deletion_state||""))')
check "S1.db.deletion_state=soft_deleted" "soft_deleted" "$DB_STATE"

# ─── Scenario 2: 유저 self restore ──────────────────────────────────────────
echo ""
echo "=== S2) 유저 self restore: POST /oth-path → 200 ==="
R=$(curl -s -o /tmp/ds_s2.json -w "%{http_code}" -X POST $API/me/restore \
  -H "Authorization: Bearer $U_TOKEN")
check "S2.restore.200" "200" "$R"
STATE=$(node -e 'console.log(require("/tmp/ds_s2.json").state||"")')
check "S2.state=active" "active" "$STATE"
DB_STATE=$(d1_query "SELECT deletion_state FROM users WHERE id=$U_ID" | \
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d)[0].results[0]?.deletion_state||""))')
check "S2.db.deletion_state=active" "active" "$DB_STATE"

# ─── Scenario 3: 복구 윈도우 초과(91d) → 410 SHREDDED ──────────────────────
echo ""
echo "=== S3) 복구 윈도우 초과: soft_deleted_at 91d 전으로 SQL 조작 후 restore → 410 ==="
# 먼저 다시 soft_delete
curl -s -X DELETE $API/me -H "Authorization: Bearer $U_TOKEN" > /dev/null
# soft_deleted_at을 91일 전으로 직접 수정
d1_query "UPDATE users SET soft_deleted_at=datetime('now','-91 days') WHERE id=$U_ID" > /dev/null
R=$(curl -s -o /tmp/ds_s3.json -w "%{http_code}" -X POST $API/me/restore \
  -H "Authorization: Bearer $U_TOKEN")
check "S3.expired_window.410" "410" "$R"
# 복구 실패했으므로 여전히 soft_deleted 상태
DB_STATE=$(d1_query "SELECT deletion_state FROM users WHERE id=$U_ID" | \
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d)[0].results[0]?.deletion_state||""))')
check "S3.db.still_soft_deleted" "soft_deleted" "$DB_STATE"
# 리셋: active로 복원 (이후 시나리오용)
d1_query "UPDATE users SET deletion_state='active', soft_deleted_at=NULL WHERE id=$U_ID" > /dev/null

# ─── Scenario 4: clone soft-delete + restore (소유권 체크) ──────────────────
echo ""
echo "=== S4) clone soft-delete + restore ==="
# clone 생성
CLONE_RESP=$(curl -s -X POST $API/clones -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $U_TOKEN" \
  -H "X-Idempotency-Key: ds-clone-create-$ts" \
  -d '{"name":"DS Clone","username":"dsclone_'$ts'","clone_type":"friend","category":"lifestyle","visibility":"public"}')
CLONE_ID=$(echo "$CLONE_RESP" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).clone?.id||JSON.parse(d).id||""))')
[[ -z "$CLONE_ID" ]] && { echo "clone create failed: $CLONE_RESP"; FAIL=$((FAIL+1)); } || echo "clone_id=$CLONE_ID"

if [[ -n "$CLONE_ID" ]]; then
  R=$(curl -s -o /tmp/ds_s4_del.json -w "%{http_code}" -X DELETE $API/clones/$CLONE_ID \
    -H "Authorization: Bearer $U_TOKEN")
  check "S4.clone_soft_delete.200" "200" "$R"
  STATE=$(node -e 'console.log(require("/tmp/ds_s4_del.json").state||"")')
  check "S4.clone.state=soft_deleted" "soft_deleted" "$STATE"

  # 소유권 체크: 다른 유저(없음)이 삭제 시도 → DB에서 직접 다른 owner_id로 시뮬레이션 불가 → 이미 deleted인 row에 재삭제 → CONFLICT
  R_DUP=$(curl -s -o /tmp/ds_s4_dup.json -w "%{http_code}" -X DELETE $API/clones/$CLONE_ID \
    -H "Authorization: Bearer $U_TOKEN")
  check "S4.clone_double_delete.409" "409" "$R_DUP"

  R=$(curl -s -o /tmp/ds_s4_rst.json -w "%{http_code}" -X POST $API/clones/$CLONE_ID/restore \
    -H "Authorization: Bearer $U_TOKEN")
  check "S4.clone_restore.200" "200" "$R"
  STATE=$(node -e 'console.log(require("/tmp/ds_s4_rst.json").state||"")')
  check "S4.clone.state=active" "active" "$STATE"
fi

# ─── Scenario 5: message soft-delete + restore (소유권 체크) ────────────────
echo ""
echo "=== S5) message soft-delete + restore ==="
# messages는 session_id NOT NULL, clone_id nullable → DB 직접 삽입
MSG_ID_VAL="$((ts+100))"
d1_query "INSERT INTO messages (id, clone_id, user_id, session_id, role, content, created_at) VALUES ($MSG_ID_VAL, NULL, $U_ID, 'sess-$ts', 'user', 'test content $ts', datetime('now'))" > /dev/null

R=$(curl -s -o /tmp/ds_s5_del.json -w "%{http_code}" -X DELETE $API/messages/$MSG_ID_VAL \
  -H "Authorization: Bearer $U_TOKEN")
check "S5.msg_soft_delete.200" "200" "$R"
STATE=$(node -e 'console.log(require("/tmp/ds_s5_del.json").state||"")')
check "S5.msg.state=soft_deleted" "soft_deleted" "$STATE"

# 소유권 체크: active 상태인 다른 유저의 message로 테스트
OTHER_MSG_ID="$((ts+101))"
OTHER_UID="$((ts+102))"
# 다른 유저 생성 및 다른 유저 메시지 삽입
OTHER_EMAIL="ds_other_${ts}@test.io"
OTHER_SIGNUP=$(curl -s -X POST $API/auth/signup -H 'Content-Type: application/json' \
  -d "{\"email\":\"$OTHER_EMAIL\",\"password\":\"$U_PW\",\"name\":\"DS Other\"}")
OTHER_UID=$(echo "$OTHER_SIGNUP" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).user?.id||""))')
d1_query "INSERT INTO messages (id, clone_id, user_id, session_id, role, content, created_at) VALUES ($OTHER_MSG_ID, NULL, $OTHER_UID, 'sess-other-$ts', 'user', 'other user msg', datetime('now'))" > /dev/null
R_OWN=$(curl -s -o /tmp/ds_s5_own.json -w "%{http_code}" -X DELETE $API/messages/$OTHER_MSG_ID \
  -H "Authorization: Bearer $U_TOKEN")
check "S5.msg_ownership.403" "403" "$R_OWN"

R=$(curl -s -o /tmp/ds_s5_rst.json -w "%{http_code}" -X POST $API/messages/$MSG_ID_VAL/restore \
  -H "Authorization: Bearer $U_TOKEN")
check "S5.msg_restore.200" "200" "$R"
STATE=$(node -e 'console.log(require("/tmp/ds_s5_rst.json").state||"")')
check "S5.msg.state=active" "active" "$STATE"

# ─── Scenario 6: Admin cold restore round-trip ──────────────────────────────
echo ""
echo "=== S6) Admin cold restore round-trip ==="
MOD_EMAIL="ds_mod_${ts}@test.io"
MOD_TOKEN=$(moderator_login "mod_${ts}" "$MOD_EMAIL")
[[ -z "$MOD_TOKEN" ]] && { echo "moderator login failed"; exit 1; }

# cold restore 대상 user row를 직접 SQL로 archived_cold 상태로 조작
COLD_UID_VAL="$((ts+200))"
d1_query "INSERT INTO users (id, email, password_hash, name, deletion_state, archived_cold_at, phone, age_enc) VALUES ($COLD_UID_VAL, 'ds_cold_${ts}@test.io', 'dummy-hash', 'Cold User', 'archived_cold', datetime('now'), NULL, NULL)" > /dev/null

# R2 snapshot 수동 생성 — wrangler r2 object put --local
SNAPSHOT_JSON="{\"schema_version\":\"2026-04-16\",\"type\":\"user\",\"id\":\"$COLD_UID_VAL\",\"archived_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"data\":{\"phone\":null,\"age_enc\":null},\"dekRegistry\":[]}"
SNAPSHOT_GZ_FILE="/tmp/ds_snapshot_${ts}.json.gz"
echo -n "$SNAPSHOT_JSON" | gzip -c > "$SNAPSHOT_GZ_FILE"
R2_KEY="cold/user/$COLD_UID_VAL/snapshot.json.gz"

# wrangler r2 object put with --local flag
(cd "$REPO_ROOT/afterlifeapi" && npx wrangler r2 object put "afterlife-archive-dev/$R2_KEY" --file "$SNAPSHOT_GZ_FILE" --local 2>/dev/null) || \
  echo "warn: wrangler r2 put failed — cold restore test may fail"

R=$(curl -s -o /tmp/ds_s6.json -w "%{http_code}" -X POST "$API/admin/deletion/user/$COLD_UID_VAL/restore-from-cold" \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"reason":"test cold restore for smoke suite T7"}')
check "S6.cold_restore.200" "200" "$R"
STATE=$(node -e 'console.log(require("/tmp/ds_s6.json").state||"")')
check "S6.cold_restore.state=active" "active" "$STATE"
# DB 확인
DB_STATE=$(d1_query "SELECT deletion_state FROM users WHERE id=$COLD_UID_VAL" | \
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d)[0].results[0]?.deletion_state||""))')
check "S6.db.deletion_state=active" "active" "$DB_STATE"

# ─── Scenario 7: quorum force_hard_delete user → row 물리 삭제 ────────────
echo ""
echo "=== S7) quorum force_hard_delete user → row 물리 삭제 ==="
SA_EMAIL1="ds_sa1_${ts}@test.io"
SA_EMAIL2="ds_sa2_${ts}@test.io"
T1=$(bootstrap_login "sa1_${ts}" "$SA_EMAIL1")
T2=$(bootstrap_login "sa2_${ts}" "$SA_EMAIL2")
[[ -z "$T1" || -z "$T2" ]] && { echo "super_admin tokens missing"; exit 1; }

# hard_delete 대상 user row 생성
HD_UID="$((ts+300))"
d1_query "INSERT INTO users (id, email, password_hash, name, deletion_state) VALUES ($HD_UID, 'ds_hd_${ts}@test.io', 'dummy-hash', 'HD User', 'soft_deleted')" > /dev/null
# row 존재 확인
PRE_COUNT=$(d1_query "SELECT COUNT(*) AS c FROM users WHERE id=$HD_UID" | \
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d)[0].results[0]?.c))')
check "S7.pre_count=1" "1" "$PRE_COUNT"

# 쿼럼 요청: force_hard_delete
R=$(curl -s -o /tmp/ds_s7_create.json -w "%{http_code}" -X POST $API/admin/quorum/requests \
  -H "Authorization: Bearer $T1" -H 'Content-Type: application/json' \
  -d "{\"actionType\":\"force_hard_delete\",\"payload\":{\"type\":\"user\",\"id\":$HD_UID,\"reason\":\"T7 smoke test force hard delete\"},\"reason\":\"T7 smoke test\",\"requiredApprovals\":1}")
check "S7.quorum_create.201" "201" "$R"
HD_RID=$(node -e 'console.log(require("/tmp/ds_s7_create.json").request?.id||"")')
[[ -z "$HD_RID" ]] && { echo "quorum request id missing"; exit 1; }

# T2가 승인
curl -s -X POST $API/admin/quorum/requests/$HD_RID/decisions \
  -H "Authorization: Bearer $T2" -H 'Content-Type: application/json' \
  -d '{"decision":"approve","comment":"approve for T7 smoke"}' > /dev/null

# T1이 실행
R=$(curl -s -o /tmp/ds_s7_exec.json -w "%{http_code}" -X POST $API/admin/quorum/requests/$HD_RID/execute \
  -H "Authorization: Bearer $T1")
check "S7.quorum_execute.200" "200" "$R"
HD_STATUS=$(node -e 'console.log(require("/tmp/ds_s7_exec.json").status||"")')
check "S7.quorum_status=executed" "executed" "$HD_STATUS"

# row 물리 삭제 확인 (count=0)
POST_COUNT=$(d1_query "SELECT COUNT(*) AS c FROM users WHERE id=$HD_UID" | \
  node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d)[0].results[0]?.c))')
check "S7.post_count=0" "0" "$POST_COUNT"

# ─── Scenario 8: quorum force_hard_delete type=message → VALIDATION_FAILED ─
echo ""
echo "=== S8) quorum force_hard_delete type=message → 422 VALIDATION_FAILED ==="
R=$(curl -s -o /tmp/ds_s8.json -w "%{http_code}" -X POST $API/admin/quorum/requests \
  -H "Authorization: Bearer $T1" -H 'Content-Type: application/json' \
  -d "{\"actionType\":\"force_hard_delete\",\"payload\":{\"type\":\"message\",\"id\":999,\"reason\":\"should be rejected\"},\"reason\":\"T7 message rejection test\",\"requiredApprovals\":1}")
# propose 시 422 또는 실행 시 422 둘 다 허용 — 구현에 따라 create 시 즉시 거부 가능
CODE_S8="$R"
if [[ "$CODE_S8" == "422" ]]; then
  check "S8.message_rejected.422_at_create" "422" "$CODE_S8"
else
  # create 201이면 execute 시 거부 확인
  check "S8.quorum_create.201" "201" "$CODE_S8"
  MSG_RID=$(node -e 'console.log(require("/tmp/ds_s8.json").request?.id||"")')
  if [[ -n "$MSG_RID" ]]; then
    # T2 approve
    curl -s -X POST $API/admin/quorum/requests/$MSG_RID/decisions \
      -H "Authorization: Bearer $T2" -H 'Content-Type: application/json' \
      -d '{"decision":"approve"}' > /dev/null
    # T1 execute → should fail with 422
    R_EXEC=$(curl -s -o /tmp/ds_s8_exec.json -w "%{http_code}" -X POST $API/admin/quorum/requests/$MSG_RID/execute \
      -H "Authorization: Bearer $T1")
    check "S8.message_rejected.422_at_execute" "422" "$R_EXEC"
  fi
fi

# ─── Scenario 9: cold restore missing snapshot → 404 ───────────────────────
echo ""
echo "=== S9) cold restore — snapshot 없음 → 404 ==="
NO_SNAP_UID="$((ts+400))"
d1_query "INSERT INTO users (id, email, password_hash, name, deletion_state, archived_cold_at) VALUES ($NO_SNAP_UID, 'ds_nosnap_${ts}@test.io', 'dummy-hash', 'NoSnap User', 'archived_cold', datetime('now'))" > /dev/null
R=$(curl -s -o /tmp/ds_s9.json -w "%{http_code}" -X POST "$API/admin/deletion/user/$NO_SNAP_UID/restore-from-cold" \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"reason":"testing missing snapshot case"}')
check "S9.no_snapshot.404" "404" "$R"

# ─── Scenario 10: cold restore wrong state (active) → 409 ──────────────────
echo ""
echo "=== S10) cold restore — active state → 409 CONFLICT ==="
ACTIVE_UID="$((ts+500))"
d1_query "INSERT INTO users (id, email, password_hash, name, deletion_state) VALUES ($ACTIVE_UID, 'ds_active_${ts}@test.io', 'dummy-hash', 'Active User', 'active')" > /dev/null
R=$(curl -s -o /tmp/ds_s10.json -w "%{http_code}" -X POST "$API/admin/deletion/user/$ACTIVE_UID/restore-from-cold" \
  -H "Authorization: Bearer $MOD_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"reason":"testing wrong state conflict case"}')
check "S10.wrong_state.409" "409" "$R"

echo ""
echo "=============================="
echo "PASS=$PASS FAIL=$FAIL"
[[ $FAIL -eq 0 ]] || exit 1
