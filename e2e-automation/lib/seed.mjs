

import { execFileSync } from "node:child_process";
import { scryptSync, randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveLocalD1, sql, API_DIR } from "./local-db.mjs";

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

export const FIXTURE = {
  user: {
    email: process.env.E2E_EMAIL ?? "e2e-user@afterlife.test",
    password: process.env.E2E_PASSWORD ?? "E2eTest1",
    name: "E2E 테스터",
  },
  clone: {
    username: "e2e-clone-edit",
    name: "E2E 편집용 클론",
    description: "E2E 자동화 전용. 이 클론의 값은 테스트가 덮어씁니다.",
    clone_type: "friend",
    visibility: "private",
    training_status: "ready",
  },

  credits: 3000,

  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@afterlife.test",
    password: process.env.E2E_ADMIN_PASSWORD ?? "E2eAdmin1",
  },
};

const MARK = "e2e-";

const N = 1 << 15;
const R = 8;
const P = 1;
const KEY_LEN = 32;

const b64 = (buf) => Buffer.from(buf).toString("base64").replace(/=+$/, "");

export function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(Buffer.from(password, "utf8"), salt, KEY_LEN, {
    N,
    r: R,
    p: P,
    maxmem: 128 * N * R * 2, 
  });
  return `$scrypt$N=${N},r=${R},p=${P}$${b64(salt)}$${b64(derived)}`;
}

export async function verifyAgainstProduct(password, phc) {
  let scrypt;
  try {
    const mod = await import(`${API_DIR}/node_modules/@noble/hashes/scrypt.js`);
    scrypt = mod.scrypt ?? mod.default?.scrypt;
  } catch {
    return null; 
  }
  if (!scrypt) return null;
  const parts = phc.split("$");
  const salt = Buffer.from(parts[3] + "=".repeat((4 - (parts[3].length % 4)) % 4), "base64");
  const derived = scrypt(new TextEncoder().encode(password), new Uint8Array(salt), {
    N,
    r: R,
    p: P,
    dkLen: KEY_LEN,
  });
  return b64(derived) === parts[4];
}

const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);

function exec(db, statements) {
  execFileSync("sqlite3", [db, statements.join("\n")], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function one(db, statement) {
  const rows = sql(db, statement);
  return rows[0]?.[0] ?? null;
}

export function reset(db) {
  const uid = one(db, `SELECT id FROM users WHERE email = ${q(FIXTURE.user.email)};`);
  const stmts = [
    "PRAGMA foreign_keys = ON;",
    `DELETE FROM clones WHERE username LIKE '${MARK}%';`,
  ];
  if (uid) {
    stmts.push(
      `DELETE FROM credit_lots WHERE user_id = ${uid};`,
      `DELETE FROM credit_ledgers WHERE user_id = ${uid};`,
      `DELETE FROM users WHERE id = ${uid};`,
    );
  }
  exec(db, stmts);
  return uid;
}

export function seed(db) {
  const now = Math.floor(Date.now() / 1000);
  const fiveYears = now + 5 * 365 * 24 * 3600;
  const phc = hashPassword(FIXTURE.user.password);
  const u = FIXTURE.user;
  const c = FIXTURE.clone;

  let uid = one(db, `SELECT id FROM users WHERE email = ${q(u.email)};`);
  if (uid) {
    exec(db, [
      `UPDATE users SET name = ${q(u.name)}, password_hash = ${q(phc)},
              credits = ${FIXTURE.credits}, credits_free = ${FIXTURE.credits},
              credits_sub = 0, credits_topup = 0,
              balance_checkpoint = ${FIXTURE.credits}, checkpoint_at = CURRENT_TIMESTAMP,
              deleted_at = NULL, deletion_state = 'active',
              failed_login_count = 0, locked_until = NULL
        WHERE id = ${uid};`,
    ]);
  } else {
    exec(db, [
      "PRAGMA foreign_keys = ON;",
      `INSERT INTO users (name, email, password_hash, credits, credits_free, balance_checkpoint, checkpoint_at)
         VALUES (${q(u.name)}, ${q(u.email)}, ${q(phc)},
                 ${FIXTURE.credits}, ${FIXTURE.credits}, ${FIXTURE.credits}, CURRENT_TIMESTAMP);`,
    ]);
    uid = one(db, `SELECT id FROM users WHERE email = ${q(u.email)};`);
  }
  uid = Number(uid);

  exec(db, [
    `DELETE FROM credit_lots WHERE user_id = ${uid};`,
    `DELETE FROM credit_ledgers WHERE user_id = ${uid};`,
    `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
       VALUES (${uid}, ${FIXTURE.credits}, 'admin_grant', 'e2e-seed', ${q(`${MARK}seed-${uid}-${now}`)});`,
  ]);
  const ledgerId = Number(
    one(db, `SELECT id FROM credit_ledgers WHERE user_id = ${uid} ORDER BY id DESC LIMIT 1;`),
  );
  exec(db, [
    `INSERT INTO credit_lots (user_id, amount, remaining, granted_at, expires_at, ledger_id)
       VALUES (${uid}, ${FIXTURE.credits}, ${FIXTURE.credits}, ${now}, ${fiveYears}, ${ledgerId});`,
    `UPDATE users SET last_ledger_id = ${ledgerId} WHERE id = ${uid};`,
  ]);

  let cloneId = one(db, `SELECT id FROM clones WHERE username = ${q(c.username)};`);
  if (cloneId) {
    exec(db, [
      `UPDATE clones SET owner_id = ${uid}, name = ${q(c.name)}, description = ${q(c.description)},
              clone_type = ${q(c.clone_type)}, visibility = ${q(c.visibility)},
              training_status = ${q(c.training_status)},
              deleted_at = NULL, deletion_state = 'active', ownership_state = 'active',
              admin_suspended_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${cloneId};`,
    ]);
  } else {
    exec(db, [
      `INSERT INTO clones (owner_id, name, username, description, clone_type, visibility, training_status, pipeline)
         VALUES (${uid}, ${q(c.name)}, ${q(c.username)}, ${q(c.description)},
                 ${q(c.clone_type)}, ${q(c.visibility)}, ${q(c.training_status)}, 'fifth');`,
    ]);
    cloneId = one(db, `SELECT id FROM clones WHERE username = ${q(c.username)};`);
  }

  const adminEmail = q(FIXTURE.admin.email);
  const adminPhc = hashPassword(FIXTURE.admin.password);
  let aid = one(db, `SELECT id FROM admin_users WHERE email = ${adminEmail};`);
  if (aid) {
    exec(db, [
      `UPDATE admin_users SET password_hash = ${q(adminPhc)},
              role = 'moderator', is_active = 1, requires_webauthn = 0,
              failed_login_count = 0, locked_until = NULL
        WHERE id = ${aid};`,
    ]);
  } else {
    exec(db, [
      `INSERT INTO admin_users (email, password_hash, role, is_active, requires_webauthn)
         VALUES (${adminEmail}, ${q(adminPhc)}, 'moderator', 1, 0);`,
    ]);
    aid = one(db, `SELECT id FROM admin_users WHERE email = ${adminEmail};`);
  }
  exec(db, [`DELETE FROM admin_totp WHERE admin_user_id = ${Number(aid)};`]);

  return { userId: uid, cloneId: Number(cloneId), ledgerId, adminId: Number(aid) };
}

export function status(db) {
  const uid = one(db, `SELECT id FROM users WHERE email = ${q(FIXTURE.user.email)};`);
  if (!uid) return null;
  const [row] = sql(
    db,
    `SELECT u.id, u.email, u.credits, u.credits_free,
            (SELECT COALESCE(SUM(remaining),0) FROM credit_lots WHERE user_id = u.id),
            (SELECT COUNT(*) FROM clones WHERE owner_id = u.id AND deleted_at IS NULL)
       FROM users u WHERE u.id = ${uid};`,
  );
  const clone = sql(
    db,
    `SELECT id, username, name, description FROM clones WHERE username = ${q(FIXTURE.clone.username)};`,
  )[0];
  return {
    userId: Number(row[0]),
    email: row[1],
    credits: Number(row[2]),
    creditsFree: Number(row[3]),
    lotsRemaining: Number(row[4]),
    cloneCount: Number(row[5]),
    clone: clone ? { id: Number(clone[0]), username: clone[1], name: clone[2] } : null,
  };
}

if (isMain) {
  const db = resolveLocalD1();
  console.log(`DB: ${db}\n`);

  if (process.argv.includes("--reset")) {
    reset(db);
    console.log("픽스처 제거 완료.");
  } else if (!process.argv.includes("--print")) {
    const r = seed(db);
    const ok = await verifyAgainstProduct(
      FIXTURE.user.password,
      one(db, `SELECT password_hash FROM users WHERE id = ${r.userId};`),
    );
    console.log(
      `비밀번호 해시 제품(@noble/hashes) 대조: ${ok === null ? "생략(라이브러리 없음)" : ok ? "일치 ✅" : "불일치 ❌"}`,
    );
    if (ok === false) process.exit(1);
  }

  const s = status(db);
  if (!s) {
    console.log("픽스처 없음.");
  } else {
    console.log(`user   #${s.userId}  ${s.email}  (비번: ${FIXTURE.user.password})`);
    console.log(`크레딧  credits=${s.credits} / free=${s.creditsFree} / lots남음=${s.lotsRemaining}`);
    if (s.credits !== s.lotsRemaining) {
      console.error(`  ⚠️ credits 와 lots 합계가 다릅니다 — 과금 경로 검증에 쓰기 전에 확인하세요.`);
    }
    console.log(
      s.clone ? `clone  #${s.clone.id}  @${s.clone.username}  ${s.clone.name}` : "clone  (없음)",
    );
  }
}
