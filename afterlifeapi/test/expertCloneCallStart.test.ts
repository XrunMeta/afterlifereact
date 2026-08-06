import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { SELF, env, fetchMock } from "cloudflare:test";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
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
       VALUES (?, 'CT', ?, ?, 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username, cloneType)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

async function personCount(userId: number, cloneId: number): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM persons WHERE user_id = ? AND clone_id = ?")
    .bind(userId, cloneId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

async function findPersonId(userId: number, cloneId: number): Promise<number | null> {
  const db = env.DB as unknown as D1Database;
  const row = await db
    .prepare("SELECT id FROM persons WHERE user_id = ? AND clone_id = ?")
    .bind(userId, cloneId)
    .first<{ id: number }>();
  return row?.id ?? null;
}

async function l2pExists(cloneId: number, personId: number): Promise<boolean> {
  const db = env.DB as unknown as D1Database;
  const row = await db
    .prepare("SELECT 1 AS x FROM clone_ont_person WHERE clone_id = ? AND person_id = ?")
    .bind(cloneId, personId)
    .first<{ x: number }>();
  return !!row;
}

const ORCH = "http://orchestrator.test";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});
afterEach(() => fetchMock.assertNoPendingInterceptors());

function mockOrchestrator(callId: string) {
  fetchMock
    .get(ORCH)
    .intercept({ path: "/oth-path", method: "POST" })
    .reply(200, { callId, subscribeToken: "t", tracks: { video: "v", audio: "a" }, state: "live" });
}

describe("POST /oth-path — 전문가 클론 계정 직접 식별 배선", () => {
  it("전문가 클론 통화 시작 → person 1개 + L2′ 즉시 확보", async () => {
    const owner = await seedUser("ecs-owner1@test.local");
    const cloneId = await seedClone(owner, "ecs-expert1", "expert");
    const guest = await seedUser("ecs-guest1@test.local");
    const tok = await issueAccessToken(guest);

    mockOrchestrator("ecs-call-1");
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);

    expect(await personCount(guest, cloneId)).toBe(1);
    const personId = await findPersonId(guest, cloneId);
    expect(personId).not.toBeNull();
    expect(await l2pExists(cloneId, personId!)).toBe(true);
  });

  it("재통화해도 같은 person 재사용 — 중복 생성 없음", async () => {
    const owner = await seedUser("ecs-owner2@test.local");
    const cloneId = await seedClone(owner, "ecs-expert2", "expert");
    const guest = await seedUser("ecs-guest2@test.local");
    const tok = await issueAccessToken(guest);

    mockOrchestrator("ecs-call-2a");
    const r1 = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(r1.status).toBe(200);
    const firstPersonId = await findPersonId(guest, cloneId);

    mockOrchestrator("ecs-call-2b");
    const r2 = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(r2.status).toBe(200);

    expect(await personCount(guest, cloneId)).toBe(1);
    expect(await findPersonId(guest, cloneId)).toBe(firstPersonId);
  });

  it("개인(memlow) 클론 통화 시작은 계정 person을 만들지 않는다", async () => {
    const owner = await seedUser("ecs-owner3@test.local");
    const cloneId = await seedClone(owner, "ecs-personal3", "memlow");
    const guest = await seedUser("ecs-guest3@test.local");
    const tok = await issueAccessToken(guest);

    mockOrchestrator("ecs-call-3");
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);

    expect(await personCount(guest, cloneId)).toBe(0);
  });

  it("ensureAccountPerson 실패해도 통화 시작은 깨지지 않는다(best-effort)", async () => {
    const owner = await seedUser("ecs-owner4@test.local");
    const cloneId = await seedClone(owner, "ecs-expert4", "expert");
    const guest = await seedUser("ecs-guest4@test.local");
    const tok = await issueAccessToken(guest);
    const db = env.DB as unknown as D1Database;

    await db.prepare("ALTER TABLE clone_ont_person RENAME TO clone_ont_person_bak_t257").run();
    try {
      mockOrchestrator("ecs-call-4");
      const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}` },
      });

      expect(res.status).toBe(200);
    } finally {
      await db.prepare("ALTER TABLE clone_ont_person_bak_t257 RENAME TO clone_ont_person").run();
    }
  });
});

describe("POST /oth-path — 전문가 클론 계정 직접 식별 배선", () => {
  it("전문가 클론 prethird-start → person 1개 + L2′ 즉시 확보", async () => {
    const owner = await seedUser("ecs-p-owner1@test.local");
    const cloneId = await seedClone(owner, "ecs-p-expert1", "expert");
    const guest = await seedUser("ecs-p-guest1@test.local");
    const tok = await issueAccessToken(guest);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "aaaaaaaaaaaa" }),
    });
    expect(res.status).toBe(200);

    expect(await personCount(guest, cloneId)).toBe(1);
    const personId = await findPersonId(guest, cloneId);
    expect(await l2pExists(cloneId, personId!)).toBe(true);
  });

  it("개인(memlow) 클론 prethird-start는 계정 person을 만들지 않는다", async () => {
    const owner = await seedUser("ecs-p-owner2@test.local");
    const cloneId = await seedClone(owner, "ecs-p-personal2", "memlow");
    const guest = await seedUser("ecs-p-guest2@test.local");
    const tok = await issueAccessToken(guest);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "bbbbbbbbbbbb" }),
    });
    expect(res.status).toBe(200);
    expect(await personCount(guest, cloneId)).toBe(0);
  });
});
