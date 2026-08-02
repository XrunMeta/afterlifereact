import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const SUPER_ADMIN_ID = 9101;
const PLAIN_ADMIN_ID = 9102; 
const XRUN_BRIDGE_ORIGIN = "https://xrun-admin.pages.dev"; 

async function issueToken(extra: Record<string, unknown>): Promise<string> {
  const { issueToken: _issue } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return _issue(extra, secret, 600);
}

async function issueSuperAdminToken(): Promise<string> {
  return issueToken({ sub: SUPER_ADMIN_ID, kind: "access", admin: true });
}

async function issuePlainAdminToken(): Promise<string> {
  return issueToken({ sub: PLAIN_ADMIN_ID, kind: "access", admin: true });
}

beforeAll(async () => {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(SUPER_ADMIN_ID, "superadmin-clonemod@afterlife.test", "hashed-placeholder")
    .run();

  await db
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'moderator', 1)`,
    )
    .bind(PLAIN_ADMIN_ID, "plainadmin-clonemod@afterlife.test", "hashed-placeholder")
    .run();
});

async function seedClone(username: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const owner = await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'Owner', CURRENT_TIMESTAMP)`)
    .bind(`${username}-owner@afterlife.test`)
    .run();
  const ownerId = owner.meta.last_row_id as number;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, primary_editor_user_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, 'CloneMod', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, ownerId, username)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function getCloneState(cloneId: number) {
  const db = env.DB as unknown as D1Database;
  return (await db
    .prepare(
      `SELECT deletion_state, deleted_at, soft_deleted_at, admin_suspended_at, admin_suspend_reason
         FROM clones WHERE id = ?`,
    )
    .bind(cloneId)
    .first())! as {
    deletion_state: string;
    deleted_at: string | null;
    soft_deleted_at: string | null;
    admin_suspended_at: string | null;
    admin_suspend_reason: string | null;
  };
}

async function auditCount(op: string, resourceId: number): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM decryption_audit_log
        WHERE op = ? AND resource_type = 'clone' AND resource_id = ?`,
    )
    .bind(op, String(resourceId))
    .first<{ cnt: number }>();
  return row?.cnt ?? 0;
}

describe("admin clone moderation (T-203)", () => {
  it("requireAdmin 브릿지(Origin 화이트리스트, 토큰 없음)로는 disable 거부 — 401", async () => {
    const cloneId = await seedClone("t203-bridge-block");
    const res = await SELF.fetch(`https://x/oth-path${cloneId}/disable`, {
      method: "POST",
      headers: { Origin: XRUN_BRIDGE_ORIGIN, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "브릿지 우회 시도 테스트" }),
    });
    expect(res.status).toBe(401);
  });

  it("일반 admin 토큰(super_admin 아님)으로는 disable 거부 — 403", async () => {
    const cloneId = await seedClone("t203-plain-admin-block");
    const token = await issuePlainAdminToken();
    const res = await SELF.fetch(`https://x/oth-path${cloneId}/disable`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "권한 없는 관리자 테스트" }),
    });
    expect(res.status).toBe(403);
  });

  it("사유 10자 미만이면 400", async () => {
    const cloneId = await seedClone("t203-short-reason");
    const token = await issueSuperAdminToken();
    const res = await SELF.fetch(`https://x/oth-path${cloneId}/disable`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "짧음" }),
    });
    expect(res.status).toBe(422);
  });

  it("disable — deletion_state 는 active 유지, admin_suspended_at 만 세팅 + 감사 로그", async () => {
    const cloneId = await seedClone("t203-disable-ok");
    const token = await issueSuperAdminToken();
    const res = await SELF.fetch(`https://x/oth-path${cloneId}/disable`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "커뮤니티 가이드라인 위반 신고 다수 접수" }),
    });
    expect(res.status).toBe(200);
    const state = await getCloneState(cloneId);
    expect(state.deletion_state).toBe("active"); 
    expect(state.admin_suspended_at).not.toBeNull();
    expect(state.admin_suspend_reason).toBe("커뮤니티 가이드라인 위반 신고 다수 접수");
    expect(await auditCount("disable", cloneId)).toBe(1);
  });

  it("disable 멱등 — 이미 중지된 클론 재호출 시 alreadySuspended", async () => {
    const cloneId = await seedClone("t203-disable-idempotent");
    const token = await issueSuperAdminToken();
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const body = JSON.stringify({ reason: "최초 중지 사유 10자 이상" });
    const first = await SELF.fetch(`https://x/oth-path${cloneId}/disable`, { method: "POST", headers: auth, body });
    expect(first.status).toBe(200);
    const second = await SELF.fetch(`https://x/oth-path${cloneId}/disable`, { method: "POST", headers: auth, body });
    expect(second.status).toBe(200);
    const secondBody = await second.json<{ alreadySuspended?: boolean }>();
    expect(secondBody.alreadySuspended).toBe(true);
  });

  it("activate — 중지 해제만 필요한 경우 admin_suspended_at 클리어, deletion_state 는 그대로 active", async () => {
    const cloneId = await seedClone("t203-unsuspend");
    const token = await issueSuperAdminToken();
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    await SELF.fetch(`https://x/oth-path${cloneId}/disable`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ reason: "중지 해제 테스트용 사유" }),
    });
    const res = await SELF.fetch(`https://x/oth-path${cloneId}/activate`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const state = await getCloneState(cloneId);
    expect(state.deletion_state).toBe("active");
    expect(state.admin_suspended_at).toBeNull();
    expect(state.admin_suspend_reason).toBeNull();
    expect(await auditCount("activate", cloneId)).toBe(1);
  });

  it("delete — soft_deleted + deleted_at 동기화(T-201 술어와 정합) + 감사 로그", async () => {
    const cloneId = await seedClone("t203-delete-ok");
    const token = await issueSuperAdminToken();
    const res = await SELF.fetch(`https://x/oth-path${cloneId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "정책 위반으로 삭제 처리함" }),
    });
    expect(res.status).toBe(200);
    const state = await getCloneState(cloneId);
    expect(state.deletion_state).toBe("soft_deleted");
    expect(state.deleted_at).not.toBeNull();
    expect(state.soft_deleted_at).not.toBeNull();
    expect(await auditCount("soft_delete", cloneId)).toBe(1);
  });

  it("activate — soft_deleted 복원 시 deleted_at·soft_deleted_at 모두 클리어(T-201 대칭)", async () => {
    const cloneId = await seedClone("t203-restore-after-delete");
    const token = await issueSuperAdminToken();
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    await SELF.fetch(`https://x/oth-path${cloneId}`, {
      method: "DELETE",
      headers: auth,
      body: JSON.stringify({ reason: "복원 테스트를 위한 임시 삭제" }),
    });
    const res = await SELF.fetch(`https://x/oth-path${cloneId}/activate`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ reason: "오조작으로 판단되어 즉시 복구함" }),
    });
    expect(res.status).toBe(200);
    const state = await getCloneState(cloneId);
    expect(state.deletion_state).toBe("active");
    expect(state.deleted_at).toBeNull();
    expect(state.soft_deleted_at).toBeNull();
  });

  it("이미 삭제된(soft_deleted) 클론은 disable 호출 시 CONFLICT", async () => {
    const cloneId = await seedClone("t203-disable-on-deleted");
    const token = await issueSuperAdminToken();
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    await SELF.fetch(`https://x/oth-path${cloneId}`, {
      method: "DELETE",
      headers: auth,
      body: JSON.stringify({ reason: "선행 삭제 처리 테스트용" }),
    });
    const res = await SELF.fetch(`https://x/oth-path${cloneId}/disable`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ reason: "삭제된 클론 중지 시도 테스트" }),
    });
    expect(res.status).toBe(409);
  });
});
