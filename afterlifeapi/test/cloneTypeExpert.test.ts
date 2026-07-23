import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

describe("0092 clone_type expert", () => {
  let ownerId: number;

  beforeAll(async () => {
    const db = env.DB as unknown as D1Database;
    const email = `owner_clone_type_${Date.now()}@x.test`;
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
    ownerId = u!.id;
  });

  const insert = (type: string) => {
    const db = env.DB as unknown as D1Database;
    return db
      .prepare(
        "INSERT INTO clones (owner_id, clone_type, name, username, visibility) VALUES (?, ?, ?, ?, 'private')",
      )
      .bind(ownerId, type, `t-${type}`, `u_${type}_${Date.now()}_${Math.random()}`)
      .run();
  };

  it("accepts expert", async () => {
    await expect(insert("expert")).resolves.toBeTruthy();
  });

  it("still accepts legacy 4 types", async () => {
    for (const t of ["memlow", "friend", "mentor", "celeb"]) {
      await expect(insert(t)).resolves.toBeTruthy();
    }
  });

  it("still rejects unknown type", async () => {
    await expect(insert("wizard")).rejects.toThrow();
  });
});

describe("POST /oth-path rejects expert clone_type (미개방 API 고정)", () => {
  async function issueAccessToken(userId: number): Promise<string> {
    const { issueToken } = await import("../src/lib/jwt");
    const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
    return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
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

  it("POST /oth-path with clone_type=expert returns 400", async () => {
    const userId = await seedUser(`expert-api-test-${Date.now()}-${Math.random()}@test.local`);
    const token = await issueAccessToken(userId);
    const idempotencyKey = `test-expert-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const res = await SELF.fetch(`http://localhost/oth-path`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        clone_type: "expert",
        name: "Expert Clone",
        username: `expert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        visibility: "private",
      }),
    });

    expect(res.status).toBe(422);
    const body = await res.json<{ error?: { code?: string } }>();

    expect(body.error?.code).toBe("VALIDATION_FAILED");
  });

});
