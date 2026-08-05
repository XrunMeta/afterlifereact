import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import { issueToken } from "../src/lib/jwt";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1)`,
    )
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string, cloneType: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, ?, 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username, cloneType)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function login(email: string): Promise<string> {
  const db = env.DB as unknown as D1Database;
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: u!.id, kind: "access" }, secret, 60 * 10);
}

describe("전문가 클론 얼굴 정책", () => {
  it("개인 클론은 faceIdentifyEnabled=true", async () => {
    const userId = await seedUser("t257j@x.com");
    const cloneId = await seedClone(userId, "t257j-clone", "memlow");
    const token = await login("t257j@x.com");

    const res = await SELF.fetch(`https://x/oth-path${cloneId}/face-policy`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = await res.json<{ faceIdentifyEnabled: boolean }>();
    expect(res.status).toBe(200);
    expect(body.faceIdentifyEnabled).toBe(true);
  });

  it("전문가 클론은 faceIdentifyEnabled=false", async () => {
    const ownerId = await seedUser("t257k-owner@x.com");
    const cloneId = await seedClone(ownerId, "t257k-clone", "expert");
    await seedUser("t257k-guest@x.com");
    const token = await login("t257k-guest@x.com");

    const res = await SELF.fetch(`https://x/oth-path${cloneId}/face-policy`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = await res.json<{ faceIdentifyEnabled: boolean }>();
    expect(res.status).toBe(200);
    expect(body.faceIdentifyEnabled).toBe(false);
  });

  it("존재하지 않는 클론은 404", async () => {
    const userId = await seedUser("t257m@x.com");
    const token = await login("t257m@x.com");

    const res = await SELF.fetch(`https://x/oth-path`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
    void userId;
  });

  it("cloneId가 잘못되면 422", async () => {
    const userId = await seedUser("t257n@x.com");
    const token = await login("t257n@x.com");

    const res = await SELF.fetch(`https://x/oth-path`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(422);
    void userId;
  });

  it("전문가 클론은 재통화 시 같은 L2′를 재사용한다", async () => {
    const ownerId = await seedUser("t257l-owner@x.com");
    const cloneId = await seedClone(ownerId, "t257l-clone", "expert");
    const guestId = await seedUser("t257l-guest@x.com");
    const db = env.DB as unknown as D1Database;

    const { ensureAccountPerson } = await import("../src/lib/cloneFaceScope");
    const first = await ensureAccountPerson(env as never, { userId: guestId, cloneId });
    const second = await ensureAccountPerson(env as never, { userId: guestId, cloneId });
    expect(second).toBe(first);

    const n = await db
      .prepare("SELECT COUNT(*) AS n FROM persons WHERE user_id = ? AND clone_id = ?")
      .bind(guestId, cloneId)
      .first<{ n: number }>();
    expect(n?.n).toBe(1);

    const cpf = await db
      .prepare("SELECT COUNT(*) AS n FROM clone_person_faces WHERE clone_id = ?")
      .bind(cloneId)
      .first<{ n: number }>();
    expect(cpf?.n).toBe(0);
  });
});
