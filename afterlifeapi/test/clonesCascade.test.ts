import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

async function hasClonesTable(): Promise<boolean> {
  try {
    const db = env.DB as unknown as D1Database;
    const row = await db.prepare("SELECT COUNT(*) AS cnt FROM clones").first<{ cnt: number }>();
    return typeof row?.cnt === "number";
  } catch {
    return false;
  }
}

async function seedUserWithPassword(email: string, password: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const { hashPassword } = await import("../src/lib/password");
  const hash = await hashPassword(password);
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`)
    .bind(email, hash)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, primary_editor_user_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, 'CT', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, ownerId, username)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function addAcceptedCoOwner(cloneId: number, ownerId: number, targetUserId: number): Promise<void> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clone_shares (clone_id, owner_id, target_user_id, role, status, created_at)
       VALUES (?, ?, ?, 'owner', 'accepted', CURRENT_TIMESTAMP)`,
    )
    .bind(cloneId, ownerId, targetUserId)
    .run();
}

async function getClone(cloneId: number): Promise<{ owner_id: number; deletion_state: string; owner_cascade_deleted_at: string | null }> {
  const db = env.DB as unknown as D1Database;
  return (await db
    .prepare("SELECT owner_id, deletion_state, owner_cascade_deleted_at FROM clones WHERE id = ?")
    .bind(cloneId)
    .first())! as never;
}

async function softDeleteCloneDirect(cloneId: number): Promise<void> {

  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`UPDATE clones SET deletion_state='soft_deleted', soft_deleted_at=CURRENT_TIMESTAMP WHERE id=?`)
    .bind(cloneId)
    .run();
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 600);
}

function deleteMe(token: string): Promise<Response> {
  return SELF.fetch("http://localhost/oth-path", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

function restore(email: string, password: string): Promise<Response> {
  return SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

const PW = "Abcdef1";

describe("회원 탈퇴 cascade — 소유 클론 숨김 + 복구 시 부활", () => {
  beforeAll(async () => {
    if (!(await hasClonesTable())) throw new Error("D1 migrations not applied.");
  });

  it("탈퇴 시 솔로 소유 active 클론 → soft_deleted + cascade 표식", async () => {
    const uid = await seedUserWithPassword("casc-solo@test.local", PW);
    const c1 = await seedClone(uid, "casc_solo_1");
    const c2 = await seedClone(uid, "casc_solo_2");

    const res = await deleteMe(await issueAccessToken(uid));
    expect(res.status).toBe(200);

    for (const id of [c1, c2]) {
      const row = await getClone(id);
      expect(row.deletion_state).toBe("soft_deleted");
      expect(row.owner_cascade_deleted_at).not.toBeNull();
      expect(row.owner_id).toBe(uid);
    }
  });

  it("복구 시 cascade 클론만 부활, 직접 지운 클론은 그대로 soft_deleted", async () => {
    const uid = await seedUserWithPassword("casc-restore@test.local", PW);
    const cascaded = await seedClone(uid, "casc_r_cascaded");
    const manual = await seedClone(uid, "casc_r_manual");

    await softDeleteCloneDirect(manual);

    expect((await deleteMe(await issueAccessToken(uid))).status).toBe(200);

    expect((await getClone(cascaded)).owner_cascade_deleted_at).not.toBeNull();
    expect((await getClone(manual)).owner_cascade_deleted_at).toBeNull();

    const r = await restore("casc-restore@test.local", PW);
    expect(r.status).toBe(200);

    expect((await getClone(cascaded)).deletion_state).toBe("active");
    expect((await getClone(manual)).deletion_state).toBe("soft_deleted");
  });

  it("공동관리자(successor) 있는 클론은 위임 — soft-delete 아님, owner 변경", async () => {
    const owner = await seedUserWithPassword("casc-owner@test.local", PW);
    const coOwner = await seedUserWithPassword("casc-coowner@test.local", PW);
    const shared = await seedClone(owner, "casc_shared");
    await addAcceptedCoOwner(shared, owner, coOwner);

    expect((await deleteMe(await issueAccessToken(owner))).status).toBe(200);

    const row = await getClone(shared);
    expect(row.deletion_state).toBe("active"); 
    expect(row.owner_id).toBe(coOwner); 
    expect(row.owner_cascade_deleted_at).toBeNull();
  });

  it("탈퇴 유저의 cascade 클론은 discover 피드에서 사라짐", async () => {
    const uid = await seedUserWithPassword("casc-feed@test.local", PW);
    const cloneId = await seedClone(uid, "casc_feed_clone");

    const before = await SELF.fetch("http://localhost/oth-path?limit=50");
    const beforeJson = (await before.json()) as { items?: Array<{ cloneId?: number }> };
    const beforeIds = (beforeJson.items ?? []).map((i) => i.cloneId);
    expect(beforeIds).toContain(cloneId);

    expect((await deleteMe(await issueAccessToken(uid))).status).toBe(200);

    const after = await SELF.fetch("http://localhost/oth-path?limit=50");
    const afterJson = (await after.json()) as { items?: Array<{ cloneId?: number }> };
    const afterIds = (afterJson.items ?? []).map((i) => i.cloneId);
    expect(afterIds).not.toContain(cloneId);
  });
});
