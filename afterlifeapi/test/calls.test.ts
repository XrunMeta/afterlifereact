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

async function seedClone(ownerId: number, username: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`)
    .bind(ownerId, username)
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

const ORCH = "http://orchestrator.test";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});
afterEach(() => fetchMock.assertNoPendingInterceptors());

describe("calls route", () => {
  it("POST /oth-path — owner 는 200 + 티켓(subscribeToken 포함)", async () => {
    const owner = await seedUser("call-o@test.local");
    const cloneId = await seedClone(owner, "call_owner");
    const tok = await issueAccessToken(owner);
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, {
        callId: "abcd1234-ef",
        subscribeToken: "secret-tok",
        tracks: { video: "v-abcd1234", audio: "a-abcd1234" },
        state: "live",
      });

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      callId: string;
      subscribeUrl: string;
      renegotiateUrl: string;
      subscribeToken: string;
    };
    expect(body.callId).toBe("abcd1234-ef");
    expect(body.subscribeUrl).toBe(`${ORCH}/oth-path`);
    expect(body.renegotiateUrl).toBe(`${ORCH}/oth-path`);
    expect(body.subscribeToken).toBe("secret-tok");
  });

  it("POST /oth-path — 비로그인 401", async () => {
    const owner = await seedUser("call-anon@test.local");
    const cloneId = await seedClone(owner, "call_anon");
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /oth-path — 없는 clone 404", async () => {
    const owner = await seedUser("call-404@test.local");
    const tok = await issueAccessToken(owner);
    const res = await SELF.fetch(`http://localhost/oth-path`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(404);
  });

  it("POST /oth-path — orchestrator no_capacity → 503", async () => {
    const owner = await seedUser("call-503@test.local");
    const cloneId = await seedClone(owner, "call_503");
    const tok = await issueAccessToken(owner);
    fetchMock.get(ORCH).intercept({ path: "/oth-path", method: "POST" }).reply(503, { error: "no_capacity" });
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(503);
  });

  it("POST /oth-path — 멱등 200", async () => {
    const owner = await seedUser("call-end@test.local");
    const cloneId = await seedClone(owner, "call_end");
    const tok = await issueAccessToken(owner);
    fetchMock.get(ORCH).intercept({ path: "/oth-path", method: "DELETE" }).reply(200, { ok: true });
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/abcd1234-ef/end`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("POST /oth-path — 형식 위반 callId 는 멱등 200(orchestrator 미호출)", async () => {
    const owner = await seedUser("call-badid@test.local");
    const cloneId = await seedClone(owner, "call_badid");
    const tok = await issueAccessToken(owner);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/tooshort/end`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
