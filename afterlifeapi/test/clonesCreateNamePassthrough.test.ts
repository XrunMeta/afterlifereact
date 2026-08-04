

import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

interface ClonesRow { cnt: number }

async function hasClonesTable(): Promise<boolean> {
  try {
    const db = env.DB as unknown as D1Database;
    const row = await db
      .prepare("SELECT COUNT(*) AS cnt FROM clones")
      .first<ClonesRow>();
    return typeof row?.cnt === "number";
  } catch {
    return false;
  }
}

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(email)
    .run();
  const u = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();
  return u!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

async function createClone(token: string, name: string, username: string) {
  return SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `t219-${username}-${Date.now()}-${Math.random()}`,
    },
    body: JSON.stringify({
      name,
      username,
      clone_type: "friend",
      visibility: "public",
    }),
  });
}

describe("T-219 clone name pass-through", () => {
  beforeAll(async () => {
    if (!(await hasClonesTable())) {
      throw new Error("D1 migrations not applied.");
    }
  });

  it("한국어 이름을 그대로 저장한다", async () => {
    const uid = await seedUser("t219-ko@test.local");
    const token = await issueAccessToken(uid);
    const res = await createClone(token, "별이", "t219_star");
    expect(res.status).toBe(201);
    const body = (await res.json()) as { clone: { name: string; username: string } };
    expect(body.clone.name).toBe("별이");
    expect(body.clone.username).toBe("t219_star");
  });

  it("공백/특수문자 포함 이름을 그대로 저장한다 (trim 등의 조용한 가공 없음)", async () => {
    const uid = await seedUser("t219-special@test.local");
    const token = await issueAccessToken(uid);

    const raw = "할머니 · 모리 (2대)";
    const res = await createClone(token, raw, "t219_special");
    expect(res.status).toBe(201);
    const body = (await res.json()) as { clone: { name: string } };
    expect(body.clone.name).toBe(raw);
  });

  it("이모지 이름을 그대로 저장한다", async () => {
    const uid = await seedUser("t219-emoji@test.local");
    const token = await issueAccessToken(uid);
    const res = await createClone(token, "🌟 별이", "t219_emoji");
    expect(res.status).toBe(201);
    const body = (await res.json()) as { clone: { name: string } };
    expect(body.clone.name).toBe("🌟 별이");
  });

  it("DB 저장값도 요청값과 100% 일치한다 (트리거·마이그로 인한 조용한 변형 방지)", async () => {
    const uid = await seedUser("t219-db@test.local");
    const token = await issueAccessToken(uid);
    const res = await createClone(token, "미주", "t219_db");
    expect(res.status).toBe(201);
    const body = (await res.json()) as { clone: { id: number } };
    const db = env.DB as unknown as D1Database;
    const row = await db
      .prepare("SELECT name FROM clones WHERE id = ?")
      .bind(body.clone.id)
      .first<{ name: string }>();
    expect(row?.name).toBe("미주");
  });
});
