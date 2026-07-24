

import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import { runCleanup } from "../src/scheduled/cleanup";

const db = () => env.DB as unknown as D1Database;
const bindings = () => env as unknown as Parameters<typeof runCleanup>[0];
const uniq = () => crypto.randomUUID().slice(0, 8);

async function seedUser(email: string): Promise<number> {
  await db()
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(email)
    .run();
  return (
    await db().prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first<{ id: number }>()
  )!.id;
}

async function seedOldClone(ownerId: number, username: string, ageExpr = "-1 day"): Promise<number> {
  const r = await db()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'C', ?, 'friend', 'public', datetime('now', ?)) RETURNING id`,
    )
    .bind(ownerId, username, ageExpr)
    .first<{ id: number }>();
  return r!.id;
}

async function stateOf(id: number): Promise<string | null> {
  const r = await db()
    .prepare(`SELECT deletion_state FROM clones WHERE id = ?`)
    .bind(id)
    .first<{ deletion_state: string }>();
  return r?.deletion_state ?? null;
}

describe("runCleanup — orphan sweep", () => {
  it("owner 유저가 존재하는 (공유 없는·5분 지난) 클론은 삭제하지 않는다 [버그 회귀]", async () => {
    const uid = await seedUser(`owned_${uniq()}@t.com`);
    const cid = await seedOldClone(uid, `owned_${uniq()}`);

    await runCleanup(bindings());

    expect(await stateOf(cid)).toBe("active");
  });

  it("모든 클론에 owner 가 있으면 orphan 을 하나도 찾지 않는다 (false-positive 0)", async () => {
    const uid = await seedUser(`noorphan_${uniq()}@t.com`);
    await seedOldClone(uid, `a_${uniq()}`);
    await seedOldClone(uid, `b_${uniq()}`);

    const result = await runCleanup(bindings());

    expect(result.orphansFound).toBe(0);
    expect(result.orphansSoftDeleted).toBe(0);
  });
});
