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

  it("POST /oth-path 성공 시 call_sessions INSERT(started_at)", async () => {
    const userId = await seedUser("caller@x.com");
    const cloneId = await seedClone(userId, "halbaeclone");
    const token = await issueAccessToken(userId);
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, { callId: "sess-c1", subscribeToken: "t", tracks: { video: "v", audio: "a" }, state: "live" });
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const row = await env.DB.prepare("SELECT * FROM call_sessions WHERE call_id = ?").bind("sess-c1").first();
    expect(row).toBeTruthy();
    expect((row as { user_id: number }).user_id).toBe(userId);
    expect((row as { ended_at: number | null }).ended_at).toBeNull();
  });

  it("POST /oth-path call_sessions UPDATE(ended_at, duration)", async () => {
    const userId = await seedUser("ender@x.com");
    const cloneId = await seedClone(userId, "halbaeclone2");
    const token = await issueAccessToken(userId);

    await env.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at, ended_at, duration_sec) VALUES (?,?,?,?,NULL,NULL)"
    ).bind("abcd1234-5678", userId, cloneId, Date.now() - 5000).run();
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "DELETE" })
      .reply(200, { ok: true });
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/abcd1234-5678/end`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const row = await env.DB.prepare("SELECT * FROM call_sessions WHERE call_id = ?").bind("abcd1234-5678").first<{ ended_at: unknown; duration_sec: unknown }>();
    expect(Number(row!.ended_at)).toBeGreaterThan(0);
    expect(Number(row!.duration_sec)).toBeGreaterThanOrEqual(4);
  });

  it("POST /oth-path 202 + call_turns(user) INSERT + orchestrator 프록시", async () => {
    const userId = await seedUser("sayer@x.com");
    const cloneId = await seedClone(userId, "halbaeclone3");
    const token = await issueAccessToken(userId);
    await env.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("say-c1", userId, cloneId, Date.now()).run();
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(202, { ok: true });
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/say-c1/say`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: "안녕하세요" }),
    });
    expect(res.status).toBe(202);
    const turn = await env.DB.prepare(
      "SELECT * FROM call_turns WHERE call_id = ? AND role = ?"
    ).bind("say-c1", "user").first() as { text: string; seq: number } | null;
    expect(turn!.text).toBe("안녕하세요");
    expect(turn!.seq).toBe(1);
  });

  it("POST /oth-path 빈 text → 400", async () => {
    const userId = await seedUser("sayer2@x.com");
    const cloneId = await seedClone(userId, "hc4");
    const token = await issueAccessToken(userId);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/x/say`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /oth-path 타인 세션 → 403", async () => {
    const owner = await seedUser("owner@x.com");
    const other = await seedUser("other@x.com");
    const cloneId = await seedClone(owner, "hc5");
    await env.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("owned-c1", owner, cloneId, Date.now()).run();
    const token = await issueAccessToken(other);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/owned-c1/say`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hi" }),
    });
    expect(res.status).toBe(403);
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
