

import { v_64acc4 } from "atanakbvjkneuejhky";
import { v_9a15ad, v_5f30e2 } from "hikhkjexnsh";
import { v_6f7712 } from "wiosxndes";
import { v_685e17 } from "bujvoezm";
import { v_597fc8, v_f8df46, v_3c06d2 } from "./local-db.mjs";

const v_0d2333 =
  process.argv[1] && import.meta.url === v_685e17(v_6f7712(process.argv[1])).href;

export const v_445bad = {
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
};

const v_83500a = "e2e-";

const v_f791ed = 1 << 15;
const v_bef3bf = 8;
const v_2d1179 = 1;
const v_18af92 = 32;

const v_8a9589 = (v_83ee53) => Buffer.from(v_83ee53).toString("base64").replace(/=+$/, "");

export function v_54846c(v_adc076) {
  const v_83f336 = v_5f30e2(16);
  const v_bff627 = v_9a15ad(Buffer.from(v_adc076, "utf8"), v_83f336, v_18af92, {
    N: v_f791ed,
    r: v_bef3bf,
    p: v_2d1179,
    maxmem: 128 * v_f791ed * v_bef3bf * 2, 
  });
  return `$scrypt$N=${v_f791ed},r=${v_bef3bf},p=${v_2d1179}$${v_8a9589(v_83f336)}$${v_8a9589(v_bff627)}`;
}

export async function v_b3d616(v_adc076, v_c2bc74) {
  let v_38446f;
  try {
    const v_06a17d = await import(`${v_3c06d2}/node_modules/@noble/hashes/scrypt.js`);
    v_38446f = v_06a17d.scrypt ?? v_06a17d.default?.scrypt;
  } catch {
    return null; 
  }
  if (!v_38446f) return null;
  const v_468545 = v_c2bc74.split("$");
  const v_83f336 = Buffer.from(v_468545[3] + "=".repeat((4 - (v_468545[3].length % 4)) % 4), "base64");
  const v_bff627 = v_38446f(new TextEncoder().encode(v_adc076), new Uint8Array(v_83f336), {
    N: v_f791ed,
    r: v_bef3bf,
    p: v_2d1179,
    dkLen: v_18af92,
  });
  return v_8a9589(v_bff627) === v_468545[4];
}

const v_ab6401 = (v_81e2ef) => (v_81e2ef === null || v_81e2ef === undefined ? "NULL" : `'${String(v_81e2ef).replace(/'/g, "''")}'`);

function v_a215ca(v_a1651b, v_be9ad5) {
  v_64acc4("sqlite3", [v_a1651b, v_be9ad5.join("\n")], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function v_84aec9(v_a1651b, v_810063) {
  const v_18b8bf = v_f8df46(v_a1651b, v_810063);
  return v_18b8bf[0]?.[0] ?? null;
}

export function v_487a25(v_a1651b) {
  const v_0c8987 = v_84aec9(v_a1651b, `SELECT id FROM users WHERE email = ${v_ab6401(v_445bad.user.email)};`);
  const v_3e6264 = [
    "PRAGMA foreign_keys = ON;",
    `DELETE FROM clones WHERE username LIKE '${v_83500a}%';`,
  ];
  if (v_0c8987) {
    v_3e6264.push(
      `DELETE FROM credit_lots WHERE user_id = ${v_0c8987};`,
      `DELETE FROM credit_ledgers WHERE user_id = ${v_0c8987};`,
      `DELETE FROM users WHERE id = ${v_0c8987};`,
    );
  }
  v_a215ca(v_a1651b, v_3e6264);
  return v_0c8987;
}

export function v_bdb39e(v_a1651b) {
  const v_5c2f9f = Math.floor(Date.now() / 1000);
  const v_4d20ae = v_5c2f9f + 5 * 365 * 24 * 3600;
  const v_c2bc74 = v_54846c(v_445bad.user.password);
  const v_ceb55a = v_445bad.user;
  const v_3f4e2e = v_445bad.clone;

  let v_0c8987 = v_84aec9(v_a1651b, `SELECT id FROM users WHERE email = ${v_ab6401(v_ceb55a.email)};`);
  if (v_0c8987) {
    v_a215ca(v_a1651b, [
      `UPDATE users SET name = ${v_ab6401(v_ceb55a.name)}, password_hash = ${v_ab6401(v_c2bc74)},
              credits = ${v_445bad.credits}, credits_free = ${v_445bad.credits},
              credits_sub = 0, credits_topup = 0,
              balance_checkpoint = ${v_445bad.credits}, checkpoint_at = CURRENT_TIMESTAMP,
              deleted_at = NULL, deletion_state = 'active',
              failed_login_count = 0, locked_until = NULL
        WHERE id = ${v_0c8987};`,
    ]);
  } else {
    v_a215ca(v_a1651b, [
      "PRAGMA foreign_keys = ON;",
      `INSERT INTO users (name, email, password_hash, credits, credits_free, balance_checkpoint, checkpoint_at)
         VALUES (${v_ab6401(v_ceb55a.name)}, ${v_ab6401(v_ceb55a.email)}, ${v_ab6401(v_c2bc74)},
                 ${v_445bad.credits}, ${v_445bad.credits}, ${v_445bad.credits}, CURRENT_TIMESTAMP);`,
    ]);
    v_0c8987 = v_84aec9(v_a1651b, `SELECT id FROM users WHERE email = ${v_ab6401(v_ceb55a.email)};`);
  }
  v_0c8987 = Number(v_0c8987);

  v_a215ca(v_a1651b, [
    `DELETE FROM credit_lots WHERE user_id = ${v_0c8987};`,
    `DELETE FROM credit_ledgers WHERE user_id = ${v_0c8987};`,
    `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
       VALUES (${v_0c8987}, ${v_445bad.credits}, 'admin_grant', 'e2e-seed', ${v_ab6401(`${v_83500a}seed-${v_0c8987}-${v_5c2f9f}`)});`,
  ]);
  const v_b9e521 = Number(
    v_84aec9(v_a1651b, `SELECT id FROM credit_ledgers WHERE user_id = ${v_0c8987} ORDER BY id DESC LIMIT 1;`),
  );
  v_a215ca(v_a1651b, [
    `INSERT INTO credit_lots (user_id, amount, remaining, granted_at, expires_at, ledger_id)
       VALUES (${v_0c8987}, ${v_445bad.credits}, ${v_445bad.credits}, ${v_5c2f9f}, ${v_4d20ae}, ${v_b9e521});`,
    `UPDATE users SET last_ledger_id = ${v_b9e521} WHERE id = ${v_0c8987};`,
  ]);

  let v_6e0fd3 = v_84aec9(v_a1651b, `SELECT id FROM clones WHERE username = ${v_ab6401(v_3f4e2e.username)};`);
  if (v_6e0fd3) {
    v_a215ca(v_a1651b, [
      `UPDATE clones SET owner_id = ${v_0c8987}, name = ${v_ab6401(v_3f4e2e.name)}, description = ${v_ab6401(v_3f4e2e.description)},
              clone_type = ${v_ab6401(v_3f4e2e.clone_type)}, visibility = ${v_ab6401(v_3f4e2e.visibility)},
              training_status = ${v_ab6401(v_3f4e2e.training_status)},
              deleted_at = NULL, deletion_state = 'active', ownership_state = 'active',
              admin_suspended_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${v_6e0fd3};`,
    ]);
  } else {
    v_a215ca(v_a1651b, [
      `INSERT INTO clones (owner_id, name, username, description, clone_type, visibility, training_status, pipeline)
         VALUES (${v_0c8987}, ${v_ab6401(v_3f4e2e.name)}, ${v_ab6401(v_3f4e2e.username)}, ${v_ab6401(v_3f4e2e.description)},
                 ${v_ab6401(v_3f4e2e.clone_type)}, ${v_ab6401(v_3f4e2e.visibility)}, ${v_ab6401(v_3f4e2e.training_status)}, 'fifth');`,
    ]);
    v_6e0fd3 = v_84aec9(v_a1651b, `SELECT id FROM clones WHERE username = ${v_ab6401(v_3f4e2e.username)};`);
  }

  return { userId: v_0c8987, cloneId: Number(v_6e0fd3), ledgerId: v_b9e521 };
}

export function v_d308b5(v_a1651b) {
  const v_0c8987 = v_84aec9(v_a1651b, `SELECT id FROM users WHERE email = ${v_ab6401(v_445bad.user.email)};`);
  if (!v_0c8987) return null;
  const [v_3ac7e7] = v_f8df46(
    v_a1651b,
    `SELECT u.id, u.email, u.credits, u.credits_free,
            (SELECT COALESCE(SUM(remaining),0) FROM credit_lots WHERE user_id = u.id),
            (SELECT COUNT(*) FROM clones WHERE owner_id = u.id AND deleted_at IS NULL)
       FROM users u WHERE u.id = ${v_0c8987};`,
  );
  const v_eb25ce = v_f8df46(
    v_a1651b,
    `SELECT id, username, name, description FROM clones WHERE username = ${v_ab6401(v_445bad.clone.username)};`,
  )[0];
  return {
    userId: Number(v_3ac7e7[0]),
    email: v_3ac7e7[1],
    credits: Number(v_3ac7e7[2]),
    creditsFree: Number(v_3ac7e7[3]),
    lotsRemaining: Number(v_3ac7e7[4]),
    cloneCount: Number(v_3ac7e7[5]),
    clone: v_eb25ce ? { id: Number(v_eb25ce[0]), username: v_eb25ce[1], name: v_eb25ce[2] } : null,
  };
}

if (v_0d2333) {
  const v_a1651b = v_597fc8();
  console.log(`DB: ${v_a1651b}\n`);

  if (process.argv.includes("--reset")) {
    v_487a25(v_a1651b);
    console.log("픽스처 제거 완료.");
  } else if (!process.argv.includes("--print")) {
    const v_cb35cb = v_bdb39e(v_a1651b);
    const v_3ed4c3 = await v_b3d616(
      v_445bad.user.password,
      v_84aec9(v_a1651b, `SELECT password_hash FROM users WHERE id = ${v_cb35cb.userId};`),
    );
    console.log(
      `비밀번호 해시 제품(@noble/hashes) 대조: ${v_3ed4c3 === null ? "생략(라이브러리 없음)" : v_3ed4c3 ? "일치 ✅" : "불일치 ❌"}`,
    );
    if (v_3ed4c3 === false) process.exit(1);
  }

  const v_fd5f43 = v_d308b5(v_a1651b);
  if (!v_fd5f43) {
    console.log("픽스처 없음.");
  } else {
    console.log(`user   #${v_fd5f43.userId}  ${v_fd5f43.email}  (비번: ${v_445bad.user.password})`);
    console.log(`크레딧  credits=${v_fd5f43.credits} / free=${v_fd5f43.creditsFree} / lots남음=${v_fd5f43.lotsRemaining}`);
    if (v_fd5f43.credits !== v_fd5f43.lotsRemaining) {
      console.error(`  ⚠️ credits 와 lots 합계가 다릅니다 — 과금 경로 검증에 쓰기 전에 확인하세요.`);
    }
    console.log(
      v_fd5f43.clone ? `clone  #${v_fd5f43.clone.id}  @${v_fd5f43.clone.username}  ${v_fd5f43.clone.name}` : "clone  (없음)",
    );
  }
}
