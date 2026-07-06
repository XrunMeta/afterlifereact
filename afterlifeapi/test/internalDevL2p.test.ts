import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";
import type { Bindings } from "../src/lib/env";

const E = env as unknown as Bindings;
const SECRET = E.DEV_SECRET; 

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`
    )
    .bind(ownerId, username)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function seedPerson(userId: number, cloneId: number, name: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const r = await db
    .prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
       VALUES (?, ?, ?, 'none', ?)`
    )
    .bind(userId, cloneId, name, Date.now())
    .run();
  return r.meta.last_row_id as number;
}

function getL2pRaw(cloneId: number, personId: number, tok?: string) {
  return SELF.fetch(`https://x/oth-path${cloneId}/l2p-raw?personId=${personId}`, {
    headers: tok ? { Authorization: `Bearer ${tok}` } : {},
  });
}

function postOntMergePerson(cloneId: number, body: unknown, tok?: string) {
  return SELF.fetch(`https://x/oth-path${cloneId}/ont-merge-person`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("dev person l2p endpoints", () => {
  let userId: number, cloneId: number, personId: number;

  beforeAll(async () => {
    userId = await seedUser("dev-l2p-person@test.local");
    cloneId = await seedClone(userId, "dev-l2p-person-clone");
    personId = await seedPerson(userId, cloneId, "형");
  });

  it("l2p-raw 401 without DEV_SECRET", async () => {
    const r = await getL2pRaw(cloneId, personId);
    expect(r.status).toBe(401);
  });

  it("l2p-raw returns null data before learning + displayName", async () => {
    const r = await getL2pRaw(cloneId, personId, SECRET);
    expect(r.status).toBe(200);
    const b = await r.json<{ data: unknown; displayName: string | null }>();
    expect(b.data).toBeNull();
    expect(b.displayName).toBe("형");
  });

  it("ont-merge-person writes then l2p-raw reflects it", async () => {
    const m = await postOntMergePerson(
      cloneId,
      { personId, source: "chat", extracted: { relation: "형", preference_personal: { 음료: "아메리카노" } } },
      SECRET,
    );
    expect(m.status).toBe(200);
    const mb = await m.json<{ rev: number; skipped: boolean; data: { relation?: string } }>();
    expect(mb.skipped).toBe(false);
    expect(mb.data.relation).toBe("형");

    const r = await getL2pRaw(cloneId, personId, SECRET);
    const b = await r.json<{ data: { relation?: string; preference_personal?: Record<string, unknown> } | null }>();
    expect(b.data?.relation).toBe("형");
    expect(b.data?.preference_personal?.음료).toBe("아메리카노");
  });

  it("ont-merge-person 404 for unknown person", async () => {
    const m = await postOntMergePerson(
      cloneId,
      { personId: 999999, source: "chat", extracted: { relation: "x" } },
      SECRET,
    );
    expect(m.status).toBe(404);
  });

  it("ont-merge-person 404 for unknown clone", async () => {
    const m = await postOntMergePerson(
      999998,
      { personId, source: "chat", extracted: { relation: "x" } },
      SECRET,
    );
    expect(m.status).toBe(404);
  });

  it("ont-merge-person 401 without DEV_SECRET", async () => {
    const m = await postOntMergePerson(cloneId, { personId, source: "chat", extracted: {} });
    expect(m.status).toBe(401);
  });
});
