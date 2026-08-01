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

async function seedClone(
  ownerId: number,
  username: string,
  opts: { isSystem?: boolean; visibility?: string } = {},
): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, primary_editor_user_id, name, username, clone_type, visibility, is_system, created_at)
       VALUES (?, ?, 'CT', ?, 'friend', ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, ownerId, username, opts.visibility ?? "public", opts.isSystem ? 1 : 0)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function getClone(
  cloneId: number,
): Promise<{ deletion_state: string; deleted_at: string | null; soft_deleted_at: string | null }> {
  const db = env.DB as unknown as D1Database;
  return (await db
    .prepare("SELECT deletion_state, deleted_at, soft_deleted_at FROM clones WHERE id = ?")
    .bind(cloneId)
    .first())! as never;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 600);
}

function authGet(path: string, token: string): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

function authDelete(path: string, token: string): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

function authPost(path: string, token: string, body?: unknown): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const PW = "Abcdef1";

describe("T-201 — 클론 삭제 시 전면 비노출 + 상태 필드 정합화", () => {
  beforeAll(async () => {
    if (!(await hasClonesTable())) throw new Error("D1 migrations not applied.");
  });

  it("DELETE /oth-path 는 deletion_state 와 deleted_at 을 함께 세팅한다 (쓰기 경로 통일)", async () => {
    const owner = await seedUserWithPassword("t201-write@test.local", PW);
    const cloneId = await seedClone(owner, "t201_write_clone");
    const token = await issueAccessToken(owner);

    const res = await authDelete(`/oth-path${cloneId}`, token);
    expect(res.status).toBe(200);

    const row = await getClone(cloneId);
    expect(row.deletion_state).toBe("soft_deleted");
    expect(row.soft_deleted_at).not.toBeNull();

    expect(row.deleted_at).not.toBeNull();
  });

  it("삭제된 시스템 클론은 GET /oth-path('통화 가능' 목록)에서 사라진다", async () => {
    const owner = await seedUserWithPassword("t201-sys@test.local", PW);
    const viewer = await seedUserWithPassword("t201-sys-viewer@test.local", PW);
    const cloneId = await seedClone(owner, "t201_sys_clone", { isSystem: true });

    const viewerToken = await issueAccessToken(viewer);
    const before = await authGet("/oth-path", viewerToken);
    const beforeJson = (await before.json()) as { items: Array<{ id: number }> };
    expect(beforeJson.items.map((i) => i.id)).toContain(cloneId);

    const ownerToken = await issueAccessToken(owner);
    expect((await authDelete(`/oth-path${cloneId}`, ownerToken)).status).toBe(200);

    const after = await authGet("/oth-path", viewerToken);
    const afterJson = (await after.json()) as { items: Array<{ id: number }> };
    expect(afterJson.items.map((i) => i.id)).not.toContain(cloneId);
  });

  it("삭제된 클론은 소유자 본인의 GET /oth-path 목록에서도 사라진다", async () => {
    const owner = await seedUserWithPassword("t201-owner@test.local", PW);
    const cloneId = await seedClone(owner, "t201_owner_clone");
    const token = await issueAccessToken(owner);

    const before = await authGet("/oth-path", token);
    const beforeJson = (await before.json()) as { items?: Array<{ id: number }> };
    expect((beforeJson.items ?? []).map((i) => i.id)).toContain(cloneId);

    expect((await authDelete(`/oth-path${cloneId}`, token)).status).toBe(200);

    const after = await authGet("/oth-path", token);
    const afterJson = (await after.json()) as { items?: Array<{ id: number }> };
    expect((afterJson.items ?? []).map((i) => i.id)).not.toContain(cloneId);
  });

  it("삭제된 클론 cloneId 로 통화 시작 시도 → 404 (딥링크·캐시된 cloneId 방어)", async () => {
    const owner = await seedUserWithPassword("t201-call@test.local", PW);
    const cloneId = await seedClone(owner, "t201_call_clone");
    const token = await issueAccessToken(owner);

    expect((await authDelete(`/oth-path${cloneId}`, token)).status).toBe(200);

    const callRes = await authPost(`/oth-path${cloneId}/call`, token, {});
    expect(callRes.status).toBe(404);

    const bundleRes = await authGet(`/oth-path${cloneId}/bundle`, token);
    expect(bundleRes.status).toBe(404);
  });

  it("복구(restore) 시 deleted_at 도 함께 클리어되고 목록에 다시 노출된다", async () => {
    const owner = await seedUserWithPassword("t201-restore@test.local", PW);
    const cloneId = await seedClone(owner, "t201_restore_clone");
    const token = await issueAccessToken(owner);

    expect((await authDelete(`/oth-path${cloneId}`, token)).status).toBe(200);
    const deleted = await getClone(cloneId);
    expect(deleted.deleted_at).not.toBeNull();

    const restoreRes = await authPost(`/oth-path${cloneId}/restore`, token);
    expect(restoreRes.status).toBe(200);

    const restored = await getClone(cloneId);
    expect(restored.deletion_state).toBe("active");
    expect(restored.deleted_at).toBeNull();
    expect(restored.soft_deleted_at).toBeNull();

    const after = await authGet("/oth-path", token);
    const afterJson = (await after.json()) as { items?: Array<{ id: number }> };
    expect((afterJson.items ?? []).map((i) => i.id)).toContain(cloneId);
  });

  it("⚠️ 회귀 1순위 — 다른 클론을 삭제해도 정상(active) 클론은 계속 노출된다", async () => {
    const owner = await seedUserWithPassword("t201-regress@test.local", PW);
    const keep = await seedClone(owner, "t201_regress_keep", { isSystem: true });
    const drop = await seedClone(owner, "t201_regress_drop", { isSystem: true });
    const token = await issueAccessToken(owner);

    expect((await authDelete(`/oth-path${drop}`, token)).status).toBe(200);

    const sys = await authGet("/oth-path", token);
    const sysJson = (await sys.json()) as { items: Array<{ id: number }> };
    const sysIds = sysJson.items.map((i) => i.id);
    expect(sysIds).toContain(keep);
    expect(sysIds).not.toContain(drop);

    const mine = await authGet("/oth-path", token);
    const mineJson = (await mine.json()) as { items?: Array<{ id: number }> };
    const mineIds = (mineJson.items ?? []).map((i) => i.id);
    expect(mineIds).toContain(keep);
    expect(mineIds).not.toContain(drop);

    const bundleRes = await authGet(`/oth-path${keep}/bundle`, token);
    expect(bundleRes.status).toBe(200);

    const feed = await SELF.fetch("http://localhost/oth-path?limit=200");
    const feedJson = (await feed.json()) as { items?: Array<{ cloneId?: number }> };
    const feedIds = (feedJson.items ?? []).map((i) => i.cloneId);
    expect(feedIds).toContain(keep);
    expect(feedIds).not.toContain(drop);
  });
});

describe("T-201 el/sei 게이트 — admin 은 삭제 상태와 무관하게 L1 프로필 조회·수정 가능", () => {

  const SUPER_ADMIN_ID = 9101;

  async function issueAdminToken(extra: Record<string, unknown>): Promise<string> {
    const { issueToken: _issue } = await import("../src/lib/jwt");
    const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
    return _issue(extra, secret, 600);
  }

  beforeAll(async () => {
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        `INSERT OR REPLACE INTO admin_users (id, email, password_hash, role, is_active)
         VALUES (?, ?, ?, 'super_admin', 1)`,
      )
      .bind(SUPER_ADMIN_ID, "t201-superadmin@afterlife.test", "hashed-placeholder")
      .run();
  });

  it("GET/PUT /oth-path 은 soft_deleted 클론도 404 없이 조회·수정된다", async () => {
    const owner = await seedUserWithPassword("t201-admin-l1@test.local", PW);
    const cloneId = await seedClone(owner, "t201_admin_l1_clone");
    const ownerToken = await issueAccessToken(owner);

    expect((await authDelete(`/oth-path${cloneId}`, ownerToken)).status).toBe(200);
    const deleted = await getClone(cloneId);
    expect(deleted.deletion_state).toBe("soft_deleted");
    expect(deleted.deleted_at).not.toBeNull();

    const adminToken = await issueAdminToken({ sub: SUPER_ADMIN_ID, kind: "access", admin: true });

    const getRes = await SELF.fetch(`http://localhost/oth-path${cloneId}/l1-profile`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(getRes.status).toBe(200);
    const getJson = (await getRes.json()) as { id: number };
    expect(getJson.id).toBe(cloneId);

    const putRes = await SELF.fetch(`http://localhost/oth-path${cloneId}/l1-profile`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ l1_profile: { notes: "admin 조회 확인용" } }),
    });
    expect(putRes.status).toBe(200);
    const putJson = (await putRes.json()) as { ok: boolean; l1_profile: { notes?: string } };
    expect(putJson.ok).toBe(true);
    expect(putJson.l1_profile.notes).toBe("admin 조회 확인용");
  });
});
