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

  it("POST /oth-path sends personaBundle with l0 + persona to orchestrator", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((opts) => {
        capturedBody = JSON.parse(opts.body as string) as Record<string, unknown>;
        return {
          statusCode: 200,
          data: JSON.stringify({
            callId: "c1",
            subscribeToken: "t",
            tracks: { video: "v", audio: "a" },
            state: "live",
          }),
          responseOptions: { headers: { "content-type": "application/json" } },
        };
      });
    const ownerId = await seedUser("call-pb@t");
    const cloneId = await seedClone(ownerId, "pbcall");
    const tok = await issueAccessToken(ownerId);
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    expect(capturedBody!.personaBundle).toBeTruthy();
    expect(typeof (capturedBody!.personaBundle as { l0: { rules_text: unknown } }).l0.rules_text).toBe("string");
    expect(capturedBody!.personaBundle).toHaveProperty("persona");
  });

  it("POST /oth-path — public 클론(is_system=1)은 stranger도 통화 허용(orchestrator까지 진행)", async () => {
    const db = env.DB as unknown as D1Database;
    const sysOwner = await seedUser("sysowner-sys@test.local");
    await db
      .prepare(
        `INSERT OR IGNORE INTO clones (owner_id, name, username, clone_type, visibility, is_system, created_at)
         VALUES (?, 'System', 'sysclone_test1', 'memlow', 'public', 1, CURRENT_TIMESTAMP)`,
      )
      .bind(sysOwner)
      .run();
    const sysClone = await db
      .prepare("SELECT id FROM clones WHERE username = 'sysclone_test1'")
      .first<{ id: number }>();

    const stranger = await seedUser("stranger-sys@test.local");
    const tok = await issueAccessToken(stranger);
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, {
        callId: "pub-sys-call",
        subscribeToken: "pub-tok",
        tracks: { video: "v-pub", audio: "a-pub" },
        state: "live",
      });
    const res = await SELF.fetch(`http://localhost/oth-path${sysClone!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { callId: string };
    expect(body.callId).toBe("pub-sys-call");
  });

  it("POST /oth-path — public 클론(is_system=0)은 stranger도 통화 허용", async () => {
    const owner = await seedUser("pub-owner@test.local");
    const cloneId = await seedClone(owner, "pubclone_stranger");

    const stranger = await seedUser("pub-stranger@test.local");
    const tok = await issueAccessToken(stranger);
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, {
        callId: "pub-clone-call",
        subscribeToken: "pub-tok2",
        tracks: { video: "v", audio: "a" },
        state: "live",
      });
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
  });

  it("POST /oth-path — private 클론은 stranger에게 403", async () => {
    const db = env.DB as unknown as D1Database;
    const owner = await seedUser("priv-owner@test.local");
    await db
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Private', 'privateclone_403', 'memlow', 'private', CURRENT_TIMESTAMP)`,
      )
      .bind(owner)
      .run();
    const privClone = await db.prepare("SELECT id FROM clones WHERE username = 'privateclone_403'").first<{ id: number }>();
    const stranger = await seedUser("priv-stranger@test.local");
    const tok = await issueAccessToken(stranger);
    const res = await SELF.fetch(`http://localhost/oth-path${privClone!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(403);
  });

  it("POST /oth-path — followers 클론은 non-follower에게 403", async () => {
    const db = env.DB as unknown as D1Database;
    const owner = await seedUser("foll-owner@test.local");
    await db
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Followers', 'followersclone_403', 'memlow', 'followers', CURRENT_TIMESTAMP)`,
      )
      .bind(owner)
      .run();
    const follClone = await db.prepare("SELECT id FROM clones WHERE username = 'followersclone_403'").first<{ id: number }>();
    const nonFollower = await seedUser("nonfoll@test.local");
    const tok = await issueAccessToken(nonFollower);
    const res = await SELF.fetch(`http://localhost/oth-path${follClone!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(403);
  });

  it("POST /oth-path — followers 클론은 follower에게 허용", async () => {
    const db = env.DB as unknown as D1Database;
    const owner = await seedUser("foll-owner2@test.local");
    await db
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Followers', 'followersclone_ok', 'memlow', 'followers', CURRENT_TIMESTAMP)`,
      )
      .bind(owner)
      .run();
    const follClone = await db.prepare("SELECT id FROM clones WHERE username = 'followersclone_ok'").first<{ id: number }>();
    const follower = await seedUser("follower-ok@test.local");

    await db
      .prepare("INSERT INTO clone_follows (clone_id, user_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
      .bind(follClone!.id, follower)
      .run();
    const tok = await issueAccessToken(follower);
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, {
        callId: "foll-call",
        subscribeToken: "foll-tok",
        tracks: { video: "v", audio: "a" },
        state: "live",
      });
    const res = await SELF.fetch(`http://localhost/oth-path${follClone!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
  });

  it("POST /oth-path — 시스템 클론(is_system=1) 소유자는 200", async () => {
    const db = env.DB as unknown as D1Database;
    const sysOwner = await seedUser("sysowner-owner@test.local");
    await db
      .prepare(
        `INSERT OR IGNORE INTO clones (owner_id, name, username, clone_type, visibility, is_system, created_at)
         VALUES (?, 'System', 'sysclone_owner_test', 'memlow', 'public', 1, CURRENT_TIMESTAMP)`,
      )
      .bind(sysOwner)
      .run();
    const sysClone = await db
      .prepare("SELECT id FROM clones WHERE username = 'sysclone_owner_test'")
      .first<{ id: number }>();
    const tok = await issueAccessToken(sysOwner);
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, {
        callId: "sys-owner-call",
        subscribeToken: "sys-tok",
        tracks: { video: "v-sys", audio: "a-sys" },
        state: "live",
      });
    const res = await SELF.fetch(`http://localhost/oth-path${sysClone!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { callId: string };
    expect(body.callId).toBe("sys-owner-call");
  });

  it("POST /oth-path — private 클론(is_system=0)은 비-follower에게 403", async () => {
    const db = env.DB as unknown as D1Database;
    const owner = await seedUser("normal-owner-sys@test.local");
    await db
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'NormalPriv', 'normalclone_sys_test', 'memlow', 'private', CURRENT_TIMESTAMP)`,
      )
      .bind(owner)
      .run();
    const privClone = await db.prepare("SELECT id FROM clones WHERE username = 'normalclone_sys_test'").first<{ id: number }>();

    const stranger = await seedUser("stranger-normal@test.local");
    const tok = await issueAccessToken(stranger);

    const res = await SELF.fetch(`http://localhost/oth-path${privClone!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(403);
  });

  it("POST /oth-path — 타인 통화 시도 → ok 반환하되 세션 ended_at 미변경(M-1)", async () => {
    const owner = await seedUser("end-owner-m1@test.local");
    const attacker = await seedUser("end-attacker-m1@test.local");
    const cloneId = await seedClone(owner, "call_end_m1");
    const db = env.DB as unknown as D1Database;
    await db.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at, ended_at) VALUES (?,?,?,?,NULL)"
    ).bind("m1-target-call", owner, cloneId, Date.now() - 3000).run();
    const tok = await issueAccessToken(attacker);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call/m1-target-call/end`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const row = await db.prepare("SELECT ended_at FROM call_sessions WHERE call_id = ?").bind("m1-target-call").first<{ ended_at: number | null }>();
    expect(row!.ended_at).toBeNull();
  });

  it("system clone call rejects unauthenticated (401)", async () => {

    const res = await SELF.fetch(`http://localhost/oth-path`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /oth-path — voice_se_url 있는 클론은 orchestrator body.assets.voiceSeUrl 전달", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("asset-seurl@test.local");
    const cloneId = await seedClone(ownerId, "clone_se_url");

    await db
      .prepare("UPDATE clones SET voice_se_url = ?, idle_video_url = ?, avatar_url = ? WHERE id = ?")
      .bind("https://r2.example.com/voice/se.pth", "https://r2.example.com/idle.mp4", "https://r2.example.com/avatar.jpg", cloneId)
      .run();
    const tok = await issueAccessToken(ownerId);
    let capturedBody: Record<string, unknown> | null = null;
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((opts) => {
        capturedBody = JSON.parse(opts.body as string) as Record<string, unknown>;
        return {
          statusCode: 200,
          data: JSON.stringify({ callId: "asset-c1", subscribeToken: "t", tracks: { video: "v", audio: "a" }, state: "live" }),
          responseOptions: { headers: { "content-type": "application/json" } },
        };
      });
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    const assets = capturedBody!.assets as { voiceSeUrl: string | null; idleVideoUrl: string | null; voiceSeKey: string | null; avatarUrl: string | null };
    expect(assets.voiceSeUrl).toBe("https://r2.example.com/voice/se.pth");
    expect(assets.idleVideoUrl).toBe("https://r2.example.com/idle.mp4");
    expect(assets.avatarUrl).toBe("https://r2.example.com/avatar.jpg");
    expect(assets.voiceSeKey).toBeNull(); 
  });

  it("POST /oth-path — voice_preset_id만 있는 클론은 assets.voiceSeKey 전달", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("asset-preset@test.local");
    const cloneId = await seedClone(ownerId, "clone_preset_key");

    await db
      .prepare("INSERT INTO voice_presets (name, gender, age_range, sample_url, description, is_active, se_key) VALUES (?, ?, ?, ?, ?, 1, ?)")
      .bind("테스트목소리", "female", "20s", "/sample/test.mp3", "테스트", "test-se-key")
      .run();
    const vp = await db.prepare("SELECT id FROM voice_presets WHERE se_key = 'test-se-key'").first<{ id: number }>();
    await db
      .prepare("UPDATE clones SET voice_preset_id = ? WHERE id = ?")
      .bind(vp!.id, cloneId)
      .run();
    const tok = await issueAccessToken(ownerId);
    let capturedBody: Record<string, unknown> | null = null;
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((opts) => {
        capturedBody = JSON.parse(opts.body as string) as Record<string, unknown>;
        return {
          statusCode: 200,
          data: JSON.stringify({ callId: "preset-c1", subscribeToken: "t", tracks: { video: "v", audio: "a" }, state: "live" }),
          responseOptions: { headers: { "content-type": "application/json" } },
        };
      });
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(res.status).toBe(200);
    const assets = capturedBody!.assets as { voiceSeUrl: string | null; voiceSeKey: string | null };
    expect(assets.voiceSeUrl).toBeNull(); 
    expect(assets.voiceSeKey).toBe("test-se-key");
  });

  it("POST /oth-path — is_system=1이지만 viewerRole 없는 stranger는 403", async () => {
    const db = env.DB as unknown as D1Database;
    const sysOwner = await seedUser("sysowner-403@test.local");
    await db
      .prepare(
        `INSERT OR IGNORE INTO clones (owner_id, name, username, clone_type, visibility, is_system, created_at)
         VALUES (?, 'SysPrivate', 'sysclone_private_403', 'memlow', 'private', 1, CURRENT_TIMESTAMP)`,
      )
      .bind(sysOwner)
      .run();
    const sysClone = await db.prepare("SELECT id FROM clones WHERE username = 'sysclone_private_403'").first<{ id: number }>();
    const stranger = await seedUser("stranger-403@test.local");
    const tok = await issueAccessToken(stranger);

    const res = await SELF.fetch(`http://localhost/oth-path${sysClone!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
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
