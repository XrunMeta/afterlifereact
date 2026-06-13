import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db.prepare(
    `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
  ).bind(email).run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string, visibility = "public"): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db.prepare(
    `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, 'memlow', ?, CURRENT_TIMESTAMP)`,
  ).bind(ownerId, username, visibility).run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

const SID = "abcdef012345"; 

describe("POST /oth-path", () => {
  it("public clone — 200 + call_sessions INSERT", async () => {
    const owner = await seedUser("pt-o@test.local");
    const cloneId = await seedClone(owner, "pt_owner");
    const tok = await issueAccessToken(owner);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: SID }),
    });
    expect(res.status).toBe(200);
    const row = await (env.DB as unknown as D1Database)
      .prepare("SELECT user_id, clone_id, persona_slug, ended_at FROM call_sessions WHERE call_id = ?")
      .bind(SID).first<{ user_id: number; clone_id: number; persona_slug: string; ended_at: number | null }>();
    expect(row).toMatchObject({ user_id: owner, clone_id: cloneId, persona_slug: null, ended_at: null });
  });

  it("멱등 — 재호출해도 1행", async () => {
    const owner = await seedUser("pt-idem@test.local");
    const cloneId = await seedClone(owner, "pt_idem");
    const tok = await issueAccessToken(owner);
    const sid = "fedcba543210";
    const call = () => SELF.fetch(`http://localhost/oth-path${cloneId}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sid }),
    });
    expect((await call()).status).toBe(200);
    expect((await call()).status).toBe(200);
    const cnt = await (env.DB as unknown as D1Database)
      .prepare("SELECT COUNT(*) AS n FROM call_sessions WHERE call_id = ?").bind(sid).first<{ n: number }>();
    expect(cnt!.n).toBe(1);
  });

  it("무토큰 — 401", async () => {
    const res = await SELF.fetch(`http://localhost/oth-path`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: SID }),
    });
    expect(res.status).toBe(401);
  });

  it("sessionId 형식 위반 — 400", async () => {
    const owner = await seedUser("pt-bad@test.local");
    const cloneId = await seedClone(owner, "pt_bad");
    const tok = await issueAccessToken(owner);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "bad id!" }),
    });
    expect(res.status).toBe(400);
  });

  it("클론 미존재 — 404", async () => {
    const owner = await seedUser("pt-404@test.local");
    const tok = await issueAccessToken(owner);
    const res = await SELF.fetch(`http://localhost/oth-path`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "abcdef012345" }),
    });
    expect(res.status).toBe(404);
  });

  it("private clone — 비owner 403", async () => {
    const owner = await seedUser("pt-priv-o@test.local");
    const stranger = await seedUser("pt-priv-s@test.local");
    const cloneId = await seedClone(owner, "pt_priv", "private");
    const tok = await issueAccessToken(stranger);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: SID }),
    });
    expect(res.status).toBe(403);
  });
});
