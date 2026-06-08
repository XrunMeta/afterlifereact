import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

async function hasUsersTable(): Promise<boolean> {
  try {
    const db = env.DB as unknown as D1Database;
    const row = await db
      .prepare("SELECT COUNT(*) AS cnt FROM users")
      .first<{ cnt: number }>();
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
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(email, hash)
    .run();
  const u = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();
  return u!.id;
}

async function setDeletionState(userId: number, state: string): Promise<void> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `UPDATE users
          SET deletion_state = ?,
              soft_deleted_at = CASE WHEN ? = 'soft_deleted' THEN CURRENT_TIMESTAMP ELSE soft_deleted_at END
        WHERE id = ?`,
    )
    .bind(state, state, userId)
    .run();
}

async function getDeletionState(userId: number): Promise<string> {
  const db = env.DB as unknown as D1Database;
  const r = await db
    .prepare("SELECT deletion_state FROM users WHERE id = ?")
    .bind(userId)
    .first<{ deletion_state: string }>();
  return r!.deletion_state;
}

function postJson(path: string, body: unknown): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const PW = "Abcdef1";

describe("auth — 탈퇴 계정 로그인 차단 (복구 없음)", () => {
  beforeAll(async () => {
    if (!(await hasUsersTable())) throw new Error("D1 migrations not applied.");
  });

  it("active 계정은 정상 로그인 (200 + accessToken)", async () => {
    const email = "del-active@test.local";
    await seedUserWithPassword(email, PW);
    const res = await postJson("/oth-path", { email, password: PW });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { accessToken?: string };
    expect(typeof json.accessToken).toBe("string");
  });

  it("soft_deleted 계정 로그인 → 403 ACCOUNT_DELETED", async () => {
    const email = "del-soft@test.local";
    const uid = await seedUserWithPassword(email, PW);
    await setDeletionState(uid, "soft_deleted");
    const res = await postJson("/oth-path", { email, password: PW });
    expect(res.status).toBe(403);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("ACCOUNT_DELETED");
  });

  it("archived_cold 계정도 로그인 차단 (ACCOUNT_DELETED)", async () => {
    const email = "del-cold@test.local";
    const uid = await seedUserWithPassword(email, PW);
    await setDeletionState(uid, "archived_cold");
    const res = await postJson("/oth-path", { email, password: PW });
    expect(res.status).toBe(403);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("ACCOUNT_DELETED");
  });

  it("soft_deleted + 틀린 비번 → ACCOUNT_DELETED 누설 없이 401 UNAUTHENTICATED", async () => {
    const email = "del-soft-wrongpw@test.local";
    const uid = await seedUserWithPassword(email, PW);
    await setDeletionState(uid, "soft_deleted");
    const res = await postJson("/oth-path", { email, password: "WRONGpw9" });
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("UNAUTHENTICATED");
  });

  it("복구 엔드포인트는 제거됨 — POST /oth-path 는 더 이상 없음(404)", async () => {
    const email = "del-norestore@test.local";
    const uid = await seedUserWithPassword(email, PW);
    await setDeletionState(uid, "soft_deleted");
    const res = await postJson("/oth-path", { email, password: PW });
    expect(res.status).toBe(404);

    expect(await getDeletionState(uid)).toBe("soft_deleted");
  });
});
