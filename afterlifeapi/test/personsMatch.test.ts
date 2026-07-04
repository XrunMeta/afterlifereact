import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

const db = () => env.DB as unknown as D1Database;

async function seedUser(email: string): Promise<number> {
  await db()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db().prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
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

async function enrollFace(tok: string, personId: number, vector: number[]) {
  const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ vectors: [vector] }),
  });
  expect(res.status).toBe(200);
}

function vec(fill = 0.1): number[] {
  return Array(512).fill(fill);
}

function orthogonalVec(): number[] {
  return Array.from({ length: 512 }, (_, i) => (i < 256 ? 1 : -1));
}

async function match(tok: string, vector: unknown) {
  return SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ vector }),
  });
}

describe("POST /oth-path", () => {
  it("enroll된 person과 같은 벡터 → best 일치·score>0.99", async () => {
    const userId = await seedUser("match-same@test.local");
    const tok = await issueAccessToken(userId);
    const personId = await createPerson(tok);
    await grantConsent(tok, personId);
    await enrollFace(tok, personId, vec(0.1));

    const res = await match(tok, vec(0.1));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      matches: { personId: number; displayName: string | null; score: number }[];
      best: { personId: number; displayName: string | null; score: number } | null;
      threshold: number;
    };
    expect(body.best).not.toBeNull();
    expect(body.best!.personId).toBe(personId);
    expect(body.best!.score).toBeGreaterThan(0.99);
  });

  it("전혀 다른(직교) 벡터 → best null", async () => {
    const userId = await seedUser("match-orth@test.local");
    const tok = await issueAccessToken(userId);
    const personId = await createPerson(tok);
    await grantConsent(tok, personId);
    await enrollFace(tok, personId, vec(0.1));

    const res = await match(tok, orthogonalVec());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { best: unknown };
    expect(body.best).toBeNull();
  });

  it("사용자 B가 A의 벡터로 match → 빈 matches(namespace 격리)", async () => {
    const ownerId = await seedUser("match-owner@test.local");
    const attackerId = await seedUser("match-attacker@test.local");
    const ownerTok = await issueAccessToken(ownerId);
    const attackerTok = await issueAccessToken(attackerId);

    const personId = await createPerson(ownerTok);
    await grantConsent(ownerTok, personId);
    await enrollFace(ownerTok, personId, vec(0.1));

    const res = await match(attackerTok, vec(0.1));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { matches: unknown[]; best: unknown };
    expect(body.matches).toEqual([]);
    expect(body.best).toBeNull();
  });

  it("vector 형식 오류(길이 부족) → 422 VALIDATION_FAILED", async () => {
    const userId = await seedUser("match-badvec@test.local");
    const tok = await issueAccessToken(userId);

    const res = await match(tok, Array(10).fill(0.1));
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("vector에 비수치 포함 → 422 VALIDATION_FAILED", async () => {
    const userId = await seedUser("match-nonnumeric@test.local");
    const tok = await issueAccessToken(userId);
    const bad = vec();
    (bad as unknown[])[0] = "x";

    const res = await match(tok, bad);
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("app_config face.match_threshold 반영 → 응답 threshold 필드 일치(임계값 충족 불가하면 best null)", async () => {
    const userId = await seedUser("match-threshold@test.local");
    const tok = await issueAccessToken(userId);
    const personId = await createPerson(tok);
    await grantConsent(tok, personId);
    await enrollFace(tok, personId, vec(0.1));

    await db()
      .prepare(
        "INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('face.match_threshold', '1.5', 1)"
      )
      .run();

    const res = await match(tok, vec(0.1));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { threshold: number; best: unknown };
    expect(body.threshold).toBe(1.5);
    expect(body.best).toBeNull();

    await db().prepare("DELETE FROM app_config WHERE key = 'face.match_threshold'").run();
  });
});
