import { describe, it, expect, beforeAll } from "vitest";
import { env } from "cloudflare:test";

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
