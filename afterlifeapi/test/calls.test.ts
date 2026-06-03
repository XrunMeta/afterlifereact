import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`)
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

const v_8fe3be = "http://orchestrator.test";

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

v_469bf2("calls route", () => {
  v_23805a("POST /oth-path — owner 는 200 + 티켓(subscribeToken 포함)", async () => {
    const v_257b90 = await v_bfb240("call-o@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "call_owner");
    const v_ea333d = await v_86c39f(v_257b90);
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, {
        callId: "abcd1234-ef",
        subscribeToken: "secret-tok",
        tracks: { video: "v-abcd1234", audio: "a-abcd1234" },
        state: "live",
      });

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as {
      callId: string;
      subscribeUrl: string;
      renegotiateUrl: string;
      subscribeToken: string;
    };
    v_4d37e3(v_4d33b2.callId).toBe("abcd1234-ef");
    v_4d37e3(v_4d33b2.subscribeUrl).toBe(`${v_8fe3be}/oth-path`);
    v_4d37e3(v_4d33b2.renegotiateUrl).toBe(`${v_8fe3be}/oth-path`);
    v_4d37e3(v_4d33b2.subscribeToken).toBe("secret-tok");
  });

  v_23805a("POST /oth-path — 비로그인 401", async () => {
    const v_257b90 = await v_bfb240("call-anon@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "call_anon");
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, { method: "POST" });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("POST /oth-path — 없는 clone 404", async () => {
    const v_257b90 = await v_bfb240("call-404@test.local");
    const v_ea333d = await v_86c39f(v_257b90);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("POST /oth-path — orchestrator no_capacity → 503", async () => {
    const v_257b90 = await v_bfb240("call-503@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "call_503");
    const v_ea333d = await v_86c39f(v_257b90);
    v_8fd90d.get(v_8fe3be).intercept({ path: "/oth-path", method: "POST" }).reply(503, { error: "no_capacity" });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(503);
  });

  v_23805a("POST /oth-path — 멱등 200", async () => {
    const v_257b90 = await v_bfb240("call-end@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "call_end");
    const v_ea333d = await v_86c39f(v_257b90);
    v_8fd90d.get(v_8fe3be).intercept({ path: "/oth-path", method: "DELETE" }).reply(200, { ok: true });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/abcd1234-ef/end`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: true });
  });

  v_23805a("POST /oth-path 성공 시 call_sessions INSERT(started_at)", async () => {
    const v_43e90c = await v_bfb240("caller@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "halbaeclone");
    const v_21cc31 = await v_86c39f(v_43e90c);
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, { callId: "sess-c1", subscribeToken: "t", tracks: { video: "v", audio: "a" }, state: "live" });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_3ac7e7 = await v_c9c489.DB.prepare("SELECT * FROM call_sessions WHERE call_id = ?").bind("sess-c1").first();
    v_4d37e3(v_3ac7e7).toBeTruthy();
    v_4d37e3((v_3ac7e7 as { user_id: number }).user_id).toBe(v_43e90c);
    v_4d37e3((v_3ac7e7 as { ended_at: number | null }).ended_at).toBeNull();
  });

  v_23805a("POST /oth-path call_sessions UPDATE(ended_at, duration)", async () => {
    const v_43e90c = await v_bfb240("ender@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "halbaeclone2");
    const v_21cc31 = await v_86c39f(v_43e90c);

    await v_c9c489.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at, ended_at, duration_sec) VALUES (?,?,?,?,NULL,NULL)"
    ).bind("abcd1234-5678", v_43e90c, v_6e0fd3, Date.now() - 5000).run();
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "DELETE" })
      .reply(200, { ok: true });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/abcd1234-5678/end`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_3ac7e7 = await v_c9c489.DB.prepare("SELECT * FROM call_sessions WHERE call_id = ?").bind("abcd1234-5678").first<{ ended_at: unknown; duration_sec: unknown }>();
    v_4d37e3(Number(v_3ac7e7!.ended_at)).toBeGreaterThan(0);
    v_4d37e3(Number(v_3ac7e7!.duration_sec)).toBeGreaterThanOrEqual(4);
  });

  v_23805a("POST /oth-path 202 + call_turns(user) INSERT + orchestrator 프록시", async () => {
    const v_43e90c = await v_bfb240("sayer@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "halbaeclone3");
    const v_21cc31 = await v_86c39f(v_43e90c);
    await v_c9c489.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("say-c1", v_43e90c, v_6e0fd3, Date.now()).run();
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(202, { ok: true });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/say-c1/say`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: "안녕하세요" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(202);
    const v_8dbe6c = await v_c9c489.DB.prepare(
      "SELECT * FROM call_turns WHERE call_id = ? AND role = ?"
    ).bind("say-c1", "user").first() as { text: string; seq: number } | null;
    v_4d37e3(v_8dbe6c!.text).toBe("안녕하세요");
    v_4d37e3(v_8dbe6c!.seq).toBe(1);
  });

  v_23805a("POST /oth-path 빈 text → 400", async () => {
    const v_43e90c = await v_bfb240("sayer2@x.com");
    const v_6e0fd3 = await v_4d24a9(v_43e90c, "hc4");
    const v_21cc31 = await v_86c39f(v_43e90c);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/x/say`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  v_23805a("POST /oth-path 타인 세션 → 403", async () => {
    const v_257b90 = await v_bfb240("owner@x.com");
    const v_a9cbf1 = await v_bfb240("other@x.com");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "hc5");
    await v_c9c489.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("owned-c1", v_257b90, v_6e0fd3, Date.now()).run();
    const v_21cc31 = await v_86c39f(v_a9cbf1);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/owned-c1/say`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hi" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("POST /oth-path sends personaBundle with l0 + persona to orchestrator", async () => {
    let v_a724b9 = null;
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((v_328259) => {
        v_a724b9 = JSON.parse(v_328259.body as string) as Record<string, unknown>;
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
    const v_1badb6 = await v_bfb240("call-pb@t");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "pbcall");
    const v_ea333d = await v_86c39f(v_1badb6);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(v_a724b9!.personaBundle).toBeTruthy();
    v_4d37e3(typeof (v_a724b9!.personaBundle as { l0: { rules_text: unknown } }).l0.rules_text).toBe("string");
    v_4d37e3(v_a724b9!.personaBundle).toHaveProperty("persona");

    const v_4f321c = v_a724b9!.personaBundle as { persona: Record<string, unknown> };
    v_4d37e3(v_4f321c.persona.displayName).toBe("CT"); 
  });

  v_23805a("POST /oth-path — public 클론(is_system=1)은 stranger도 통화 허용(orchestrator까지 진행)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_7ef28d = await v_bfb240("sysowner-sys@test.local");
    await v_a1651b
      .prepare(
        `INSERT OR IGNORE INTO clones (owner_id, name, username, clone_type, visibility, is_system, created_at)
         VALUES (?, 'System', 'sysclone_test1', 'memlow', 'public', 1, CURRENT_TIMESTAMP)`,
      )
      .bind(v_7ef28d)
      .run();
    const v_56eeab = await v_a1651b
      .prepare("SELECT id FROM clones WHERE username = 'sysclone_test1'")
      .first<{ id: number }>();

    const v_1c6644 = await v_bfb240("stranger-sys@test.local");
    const v_ea333d = await v_86c39f(v_1c6644);
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, {
        callId: "pub-sys-call",
        subscribeToken: "pub-tok",
        tracks: { video: "v-pub", audio: "a-pub" },
        state: "live",
      });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_56eeab!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { callId: string };
    v_4d37e3(v_4d33b2.callId).toBe("pub-sys-call");
  });

  v_23805a("POST /oth-path — public 클론(is_system=0)은 stranger도 통화 허용", async () => {
    const v_257b90 = await v_bfb240("pub-owner@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "pubclone_stranger");

    const v_1c6644 = await v_bfb240("pub-stranger@test.local");
    const v_ea333d = await v_86c39f(v_1c6644);
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, {
        callId: "pub-clone-call",
        subscribeToken: "pub-tok2",
        tracks: { video: "v", audio: "a" },
        state: "live",
      });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
  });

  v_23805a("POST /oth-path — private 클론은 stranger에게 403", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_257b90 = await v_bfb240("priv-owner@test.local");
    await v_a1651b
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Private', 'privateclone_403', 'memlow', 'private', CURRENT_TIMESTAMP)`,
      )
      .bind(v_257b90)
      .run();
    const v_a19ae1 = await v_a1651b.prepare("SELECT id FROM clones WHERE username = 'privateclone_403'").first<{ id: number }>();
    const v_1c6644 = await v_bfb240("priv-stranger@test.local");
    const v_ea333d = await v_86c39f(v_1c6644);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_a19ae1!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("POST /oth-path — followers 클론은 non-follower에게 403", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_257b90 = await v_bfb240("foll-owner@test.local");
    await v_a1651b
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Followers', 'followersclone_403', 'memlow', 'followers', CURRENT_TIMESTAMP)`,
      )
      .bind(v_257b90)
      .run();
    const v_2db4e5 = await v_a1651b.prepare("SELECT id FROM clones WHERE username = 'followersclone_403'").first<{ id: number }>();
    const v_b35f0c = await v_bfb240("nonfoll@test.local");
    const v_ea333d = await v_86c39f(v_b35f0c);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_2db4e5!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("POST /oth-path — followers 클론은 follower에게 허용", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_257b90 = await v_bfb240("foll-owner2@test.local");
    await v_a1651b
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Followers', 'followersclone_ok', 'memlow', 'followers', CURRENT_TIMESTAMP)`,
      )
      .bind(v_257b90)
      .run();
    const v_2db4e5 = await v_a1651b.prepare("SELECT id FROM clones WHERE username = 'followersclone_ok'").first<{ id: number }>();
    const v_7efac5 = await v_bfb240("follower-ok@test.local");

    await v_a1651b
      .prepare("INSERT INTO clone_follows (clone_id, user_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
      .bind(v_2db4e5!.id, v_7efac5)
      .run();
    const v_ea333d = await v_86c39f(v_7efac5);
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, {
        callId: "foll-call",
        subscribeToken: "foll-tok",
        tracks: { video: "v", audio: "a" },
        state: "live",
      });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_2db4e5!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
  });

  v_23805a("POST /oth-path — 시스템 클론(is_system=1) 소유자는 200", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_7ef28d = await v_bfb240("sysowner-owner@test.local");
    await v_a1651b
      .prepare(
        `INSERT OR IGNORE INTO clones (owner_id, name, username, clone_type, visibility, is_system, created_at)
         VALUES (?, 'System', 'sysclone_owner_test', 'memlow', 'public', 1, CURRENT_TIMESTAMP)`,
      )
      .bind(v_7ef28d)
      .run();
    const v_56eeab = await v_a1651b
      .prepare("SELECT id FROM clones WHERE username = 'sysclone_owner_test'")
      .first<{ id: number }>();
    const v_ea333d = await v_86c39f(v_7ef28d);
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, {
        callId: "sys-owner-call",
        subscribeToken: "sys-tok",
        tracks: { video: "v-sys", audio: "a-sys" },
        state: "live",
      });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_56eeab!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { callId: string };
    v_4d37e3(v_4d33b2.callId).toBe("sys-owner-call");
  });

  v_23805a("POST /oth-path — private 클론(is_system=0)은 비-follower에게 403", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_257b90 = await v_bfb240("normal-owner-sys@test.local");
    await v_a1651b
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'NormalPriv', 'normalclone_sys_test', 'memlow', 'private', CURRENT_TIMESTAMP)`,
      )
      .bind(v_257b90)
      .run();
    const v_a19ae1 = await v_a1651b.prepare("SELECT id FROM clones WHERE username = 'normalclone_sys_test'").first<{ id: number }>();

    const v_1c6644 = await v_bfb240("stranger-normal@test.local");
    const v_ea333d = await v_86c39f(v_1c6644);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_a19ae1!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("POST /oth-path — 타인 통화 시도 → ok 반환하되 세션 ended_at 미변경(M-1)", async () => {
    const v_257b90 = await v_bfb240("end-owner-m1@test.local");
    const v_53bb36 = await v_bfb240("end-attacker-m1@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "call_end_m1");
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at, ended_at) VALUES (?,?,?,?,NULL)"
    ).bind("m1-target-call", v_257b90, v_6e0fd3, Date.now() - 3000).run();
    const v_ea333d = await v_86c39f(v_53bb36);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/m1-target-call/end`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: true });

    const v_3ac7e7 = await v_a1651b.prepare("SELECT ended_at FROM call_sessions WHERE call_id = ?").bind("m1-target-call").first<{ ended_at: number | null }>();
    v_4d37e3(v_3ac7e7!.ended_at).toBeNull();
  });

  v_23805a("system clone call rejects unauthenticated (401)", async () => {

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path`, { method: "POST" });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("POST /oth-path — voice_se_url 있는 클론은 orchestrator body.assets.voiceSeUrl 전달", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("asset-seurl@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "clone_se_url");

    await v_a1651b
      .prepare("UPDATE clones SET voice_se_url = ?, idle_video_url = ?, avatar_url = ? WHERE id = ?")
      .bind("https://r2.example.com/voice/se.pth", "https://r2.example.com/idle.mp4", "https://r2.example.com/avatar.jpg", v_6e0fd3)
      .run();
    const v_ea333d = await v_86c39f(v_1badb6);
    let v_a724b9 = null;
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((v_328259) => {
        v_a724b9 = JSON.parse(v_328259.body as string) as Record<string, unknown>;
        return {
          statusCode: 200,
          data: JSON.stringify({ callId: "asset-c1", subscribeToken: "t", tracks: { video: "v", audio: "a" }, state: "live" }),
          responseOptions: { headers: { "content-type": "application/json" } },
        };
      });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7adc95 = v_a724b9!.assets as { voiceSeUrl: string | null; idleVideoUrl: string | null; voiceSeKey: string | null; avatarUrl: string | null };
    v_4d37e3(v_7adc95.voiceSeUrl).toBe("https://r2.example.com/voice/se.pth");
    v_4d37e3(v_7adc95.idleVideoUrl).toBe("https://r2.example.com/idle.mp4");
    v_4d37e3(v_7adc95.avatarUrl).toBe("https://r2.example.com/avatar.jpg");
    v_4d37e3(v_7adc95.voiceSeKey).toBeNull(); 
  });

  v_23805a("POST /oth-path — voice_preset_id만 있는 클론은 assets.voiceSeKey 전달", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_1badb6 = await v_bfb240("asset-preset@test.local");
    const v_6e0fd3 = await v_4d24a9(v_1badb6, "clone_preset_key");

    await v_a1651b
      .prepare("INSERT INTO voice_presets (name, gender, age_range, sample_url, description, is_active, se_key) VALUES (?, ?, ?, ?, ?, 1, ?)")
      .bind("테스트목소리", "female", "20s", "/sample/test.mp3", "테스트", "test-se-key")
      .run();
    const v_f653fc = await v_a1651b.prepare("SELECT id FROM voice_presets WHERE se_key = 'test-se-key'").first<{ id: number }>();
    await v_a1651b
      .prepare("UPDATE clones SET voice_preset_id = ? WHERE id = ?")
      .bind(v_f653fc!.id, v_6e0fd3)
      .run();
    const v_ea333d = await v_86c39f(v_1badb6);
    let v_a724b9 = null;
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((v_328259) => {
        v_a724b9 = JSON.parse(v_328259.body as string) as Record<string, unknown>;
        return {
          statusCode: 200,
          data: JSON.stringify({ callId: "preset-c1", subscribeToken: "t", tracks: { video: "v", audio: "a" }, state: "live" }),
          responseOptions: { headers: { "content-type": "application/json" } },
        };
      });
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7adc95 = v_a724b9!.assets as { voiceSeUrl: string | null; voiceSeKey: string | null };
    v_4d37e3(v_7adc95.voiceSeUrl).toBeNull(); 
    v_4d37e3(v_7adc95.voiceSeKey).toBe("test-se-key");
  });

  v_23805a("POST /oth-path — is_system=1이지만 viewerRole 없는 stranger는 403", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_7ef28d = await v_bfb240("sysowner-403@test.local");
    await v_a1651b
      .prepare(
        `INSERT OR IGNORE INTO clones (owner_id, name, username, clone_type, visibility, is_system, created_at)
         VALUES (?, 'SysPrivate', 'sysclone_private_403', 'memlow', 'private', 1, CURRENT_TIMESTAMP)`,
      )
      .bind(v_7ef28d)
      .run();
    const v_56eeab = await v_a1651b.prepare("SELECT id FROM clones WHERE username = 'sysclone_private_403'").first<{ id: number }>();
    const v_1c6644 = await v_bfb240("stranger-403@test.local");
    const v_ea333d = await v_86c39f(v_1c6644);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_56eeab!.id}/call`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("POST /oth-path — 형식 위반 callId 는 멱등 200(orchestrator 미호출)", async () => {
    const v_257b90 = await v_bfb240("call-badid@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "call_badid");
    const v_ea333d = await v_86c39f(v_257b90);

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/tooshort/end`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: true });
  });
});
