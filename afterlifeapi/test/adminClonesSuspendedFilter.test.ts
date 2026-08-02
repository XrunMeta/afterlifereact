import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

let seq = 0;
function db(): D1Database {
  return env.DB as unknown as D1Database;
}

async function seedUser(): Promise<number> {
  seq += 1;
  const email = `acsf-${seq}-${Date.now()}@test.local`;
  await db()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  return (await db().prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>())!.id;
}

async function seedClone(ownerId: number): Promise<number> {
  seq += 1;
  const username = `acsf_clone_${seq}`;
  await db()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username)
    .run();
  return (await db().prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>())!.id;
}

async function suspendClone(cloneId: number): Promise<void> {
  await db()
    .prepare(`UPDATE clones SET admin_suspended_at = CURRENT_TIMESTAMP, admin_suspend_reason = '테스트' WHERE id = ?`)
    .bind(cloneId)
    .run();
}

async function adminToken(): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return issueToken({ sub: 88801, kind: "access", admin: true }, secret, 600);
}

async function fetchClones(qs: string, t: string): Promise<{ items: Array<{ id: number }> }> {
  const res = await SELF.fetch(`http://localhost/oth-path${qs}`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  return res.json();
}

describe("GET /oth-path?suspended= — 정지 필터", () => {
  it("suspended=1 이면 정지된 클론만, suspended=0 이면 정지 안 된 클론만 반환", async () => {
    const owner = await seedUser();
    const suspended = await seedClone(owner);
    const normal = await seedClone(owner);
    await suspendClone(suspended);
    const t = await adminToken();

    const onlySuspended = await fetchClones("?suspended=1&limit=200", t);
    const ids1 = onlySuspended.items.map((i) => i.id);
    expect(ids1).toContain(suspended);
    expect(ids1).not.toContain(normal);

    const onlyNotSuspended = await fetchClones("?suspended=0&limit=200", t);
    const ids0 = onlyNotSuspended.items.map((i) => i.id);
    expect(ids0).not.toContain(suspended);
    expect(ids0).toContain(normal);

    const noFilter = await fetchClones("?limit=200", t);
    const idsAll = noFilter.items.map((i) => i.id);
    expect(idsAll).toContain(suspended);
    expect(idsAll).toContain(normal);
  });
});
