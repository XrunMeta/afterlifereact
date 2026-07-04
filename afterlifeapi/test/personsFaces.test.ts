import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

async function createPerson(tok: string): Promise<number> {
  const res = await SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const { id } = (await res.json()) as { id: number };
  return id;
}

async function grantConsent(tok: string, personId: number) {
  const res = await SELF.fetch(`http://localhost/oth-path${personId}/consent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ state: "granted" }),
  });
  expect(res.status).toBe(200);
}

function vec(fill = 0.1): number[] {
  return Array(512).fill(fill);
}

describe("POST /oth-path", () => {
  it("consent 없는 person enroll → 403", async () => {
    const userId = await seedUser("faces-noconsent@test.local");
    const tok = await issueAccessToken(userId);
    const personId = await createPerson(tok);

    const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [vec()] }),
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("consent granted → 200, face_embeddings 행 N개 생성", async () => {
    const db = env.DB as unknown as D1Database;
    const userId = await seedUser("faces-granted@test.local");
    const tok = await issueAccessToken(userId);
    const personId = await createPerson(tok);
    await grantConsent(tok, personId);

    const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [vec(0.1), vec(0.2), vec(0.3)] }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { enrolled: number };
    expect(body.enrolled).toBe(3);

    const row = await db
      .prepare("SELECT COUNT(*) c FROM face_embeddings WHERE person_id = ?")
      .bind(personId)
      .first<{ c: number }>();
    expect(row?.c).toBe(3);
  });

  it("vectors 검증: 512 아님/6개 초과/비수치 → 422 VALIDATION_FAILED", async () => {
    const userId = await seedUser("faces-invalid@test.local");
    const tok = await issueAccessToken(userId);
    const personId = await createPerson(tok);
    await grantConsent(tok, personId);

    const res1 = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [Array(10).fill(0.1)] }),
    });
    expect(res1.status).toBe(422);
    expect(((await res1.json()) as { error: { code: string } }).error.code).toBe("VALIDATION_FAILED");

    const res2 = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: Array(6).fill(vec()) }),
    });
    expect(res2.status).toBe(422);

    const badVec = vec();
    badVec[0] = "x" as unknown as number;
    const res3 = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [badVec] }),
    });
    expect(res3.status).toBe(422);
  });

  it("타인 소유 person → 404", async () => {
    const owner = await seedUser("faces-owner@test.local");
    const attacker = await seedUser("faces-attacker@test.local");
    const ownerTok = await issueAccessToken(owner);
    const attackerTok = await issueAccessToken(attacker);

    const personId = await createPerson(ownerTok);
    await grantConsent(ownerTok, personId);

    const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${attackerTok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [vec()] }),
    });

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
